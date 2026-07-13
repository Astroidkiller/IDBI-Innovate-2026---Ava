"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  PaperPlaneTilt,
  Microphone,
  MicrophoneSlash,
  TrendUp,
  TrendDown,
  Target,
  Warning,
  ChartPie,
  ChatCircleText,
  Car,
  SpeakerHigh,
  SpeakerX,
  Sparkle,
  House,
  Wallet,
  ChartBar,
  ArrowUpRight,
  ShieldCheck,
} from "@phosphor-icons/react";

// ─── Mock Data ──────────────────────────────────────────────────────────────

const mockHoldings = [
  { name: "Equity Mutual Funds", value: 450000, percent: 60, returns: 12.5, color: "#00836C" },
  { name: "Fixed Deposits",      value: 250000, percent: 33.3, returns: 6.8,  color: "#F58220" },
  { name: "Gold",                value: 50000,  percent: 6.7,  returns: 8.1,  color: "#EAB308" },
];

const mockGoals = [
  { id: "g1", name: "Home Down Payment", icon: House,   target: 1500000, current: 600000,  deadline: "Dec 2028" },
  { id: "g2", name: "Emergency Fund",    icon: Wallet,  target: 300000,  current: 280000,  deadline: "Oct 2026" },
];

const mockTransactions = [
  { cat: "Food & Dining",    amount: 4500,   merchant: "Zomato",      date: "Jul 10", type: "debit",  spike: false },
  { cat: "Travel",           amount: 1200,   merchant: "Uber",         date: "Jul 9",  type: "debit",  spike: false },
  { cat: "Rent",             amount: 25000,  merchant: "Landlord",     date: "Jul 8",  type: "debit",  spike: false },
  { cat: "Discretionary",   amount: 18000,  merchant: "Apple Store",  date: "Jul 5",  type: "debit",  spike: true  },
  { cat: "Salary",           amount: 125000, merchant: "Employer",     date: "Jul 1",  type: "credit", spike: false },
];

const SCENARIOS = [
  { key: "overspending", label: "Overspending Alert", icon: Warning,      color: "#ef4444", sub: "Spike detected" },
  { key: "rebalancing",  label: "Portfolio Review",   icon: ChartPie,     color: "#00836C", sub: "Rebalancing insight" },
  { key: "goalNudge",    label: "Goal Nudge",          icon: Target,       color: "#F58220", sub: "SIP recommendation" },
  { key: "carLoan",      label: "Car Loan Query",      icon: Car,          color: "#8B5CF6", sub: "Affordability check" },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message { role: "user" | "assistant"; content: string; }
type AvatarState = "idle" | "thinking" | "talking";
type Tab = "overview" | "portfolio" | "transactions";

// ─── Female Voice Priority ────────────────────────────────────────────────────

const FEMALE_VOICES = [
  "Google UK English Female","Google US English Female","Microsoft Aria","Microsoft Jenny",
  "Microsoft Zira","Microsoft Ava","Samantha","Victoria","Karen","Moira","Tessa",
  "Fiona","Allison","Ava","Susan","Zira","Aria","Jenny","female","Female",
];

function getFemaleVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  for (const kw of FEMALE_VOICES) {
    const hit = voices.find(v => v.name.includes(kw));
    if (hit) return hit;
  }
  return voices.find(v =>
    v.lang.startsWith("en") &&
    !["male","guy","david","mark","james","george","daniel","alex"].some(n =>
      v.name.toLowerCase().includes(n)
    )
  ) ?? null;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ─── Component ───────────────────────────────────────────────────────────────

export default function AvaPage() {
  const shouldReduceMotion = useReducedMotion();

  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hi Rohan! I'm Ava, your personal wealth advisor at IDBI Bank. I've reviewed your financial profile and I'm ready to help you make smarter decisions. What's on your mind today?",
  }]);
  const [input,        setInput]        = useState("");
  const [avatarState,  setAvatarState]  = useState<AvatarState>("idle");
  const [loading,      setLoading]      = useState(false);
  const [listening,    setListening]    = useState(false);
  const [speaking,     setSpeaking]     = useState(false);
  const [voiceOn,      setVoiceOn]      = useState(true);
  const [tab,          setTab]          = useState<Tab>("overview");

  const bottomRef    = useRef<HTMLDivElement>(null);
  const synthRef     = useRef<SpeechSynthesis | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef     = useRef<any>(null);

  // Init synth + preload voices
  useEffect(() => {
    if (typeof window === "undefined") return;
    synthRef.current = window.speechSynthesis;
    const load = () => synthRef.current?.getVoices();
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Speak ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!voiceOn || !synthRef.current) return;
    synthRef.current.cancel();
    const clean = text.replace(/[*_#`]/g, "").replace(/\n/g, " ");
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate   = 0.95;
    utt.pitch  = 1.25;
    utt.volume = 1;
    const voice = getFemaleVoice(synthRef.current);
    if (voice) utt.voice = voice;
    utt.onstart = () => { setAvatarState("talking"); setSpeaking(true); };
    utt.onend   = () => { setAvatarState("idle");    setSpeaking(false); };
    synthRef.current.speak(utt);
  }, [voiceOn]);

  const stopSpeak = () => {
    synthRef.current?.cancel();
    setAvatarState("idle");
    setSpeaking(false);
  };

  // ── Send chat ──────────────────────────────────────────────────────────────
  const sendMessage = async (content: string, history: Message[]) => {
    const next: Message[] = [...history, { role: "user", content }];
    setMessages(next);
    setLoading(true);
    setAvatarState("thinking");
    try {
      const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer idbi-prototype-auth-token" }, body: JSON.stringify({ messages: next }) });
      const data = await res.json();
      const reply = data.reply ?? "I'm having trouble connecting. Please try again.";
      setMessages(p => [...p, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Connection error. Please try again." }]);
      setAvatarState("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const t = input.trim();
    setInput("");
    sendMessage(t, messages);
  };

  // ── Scenario ───────────────────────────────────────────────────────────────
  const triggerScenario = async (key: string) => {
    setLoading(true);
    setAvatarState("thinking");
    try {
      const res  = await fetch("/api/scenarios", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer idbi-prototype-auth-token" }, body: JSON.stringify({ scenarioKey: key }) });
      const data = await res.json();
      const reply = data.reply ?? "Unable to load scenario.";
      setMessages(p => [...p, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      setAvatarState("idle");
    } finally {
      setLoading(false);
    }
  };

  // ── Voice input ────────────────────────────────────────────────────────────
  const toggleListen = () => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome."); return; }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.lang = "en-IN"; r.continuous = false; r.interimResults = false;
    r.onstart  = () => setListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => setInput(e.results[0][0].transcript);
    r.onend    = () => setListening(false);
    recogRef.current = r;
    r.start();
  };

  // ─── Avatar pulse glow ────────────────────────────────────────────────────
  const glowAnim = shouldReduceMotion ? {} : {
    scale: avatarState === "talking" ? [1, 1.15, 1] : avatarState === "thinking" ? [1, 1.08, 1] : [1, 1.04, 1],
    opacity: avatarState === "idle" ? [0.4, 0.6, 0.4] : [0.6, 0.9, 0.6],
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-idbi-green/20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 h-16 bg-surface/80 backdrop-blur-md border-b border-border-subtle shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center bg-idbi-green text-white text-xs font-bold shadow-sm">
            IB
          </div>
          <div>
            <p className="text-xs font-semibold tracking-tight text-foreground leading-none mt-0.5">IDBI Wealth</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-hover border border-border-subtle">
          <Sparkle weight="fill" size={14} className="text-idbi-green" />
          <span className="text-xs font-medium text-foreground">AI Advisory</span>
        </div>

        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-surface-hover border border-border-subtle text-foreground">
          RS
        </div>
      </header>

      {/* ── Main Layout ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 md:grid md:grid-cols-12 md:gap-12">

          {/* Left Column (Desktop: 5 cols) - Avatar & Controls */}
          <div className="md:col-span-5 space-y-8">

            {/* Avatar Section */}
            <div className="relative rounded-lg overflow-hidden bg-surface border border-border-subtle p-6 shadow-sm">
              <div className="flex items-start gap-6 relative z-10">
                <div className="relative flex-shrink-0">
                  <div className="relative flex flex-col items-center">
                    <img src="/ava-avatar.jpg" alt="Ava AI Advisor"
                      className="w-[80px] h-[80px] rounded object-cover object-top transition-all duration-300"
                      style={{
                        border: `2px solid ${avatarState === "talking" ? "var(--color-idbi-green)" : avatarState === "thinking" ? "var(--color-idbi-orange)" : "var(--color-border-subtle)"}`,
                        opacity: avatarState === "idle" ? 0.9 : 1
                      }}
                    />
                    <div className="mt-3 h-6 flex items-center justify-center">
                      {avatarState === "talking" ? (
                        <div className="flex items-center gap-1 h-3">
                          {[0, 1, 2, 3, 4].map(i => (
                            <motion.div key={i} className="w-1 bg-idbi-green rounded-full"
                              animate={{ height: ["4px", "14px", "4px"] }}
                              transition={{ repeat: Infinity, duration: 0.5 + (i % 2) * 0.2, delay: i * 0.15, ease: "easeInOut" }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-foreground font-bold uppercase tracking-widest bg-surface-hover px-2 py-1 rounded border border-border-subtle">
                          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: avatarState === "idle" ? "var(--color-text-muted)" : "var(--color-idbi-orange)" }} animate={avatarState === "thinking" ? { opacity: [1, 0, 1] } : { opacity: 1 }} transition={{ repeat: Infinity, duration: 0.8 }} />
                          {avatarState === "thinking" ? "Thinking" : "Ready"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-foreground font-medium text-3xl tracking-tighter mb-1">Ava.</h1>
                  <p className="text-sm text-text-muted font-normal mb-6">IDBI Autonomous Wealth Agent</p>

                  <div className="flex items-center gap-2">
                    <button onClick={() => voiceOn ? (speaking ? stopSpeak() : setVoiceOn(false)) : setVoiceOn(true)}
                      aria-label={speaking ? "Stop speaking" : voiceOn ? "Disable voice" : "Enable voice"}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-idbi-green"
                      style={{ background: voiceOn ? "var(--color-idbi-green)" : "var(--color-surface-hover)", color: voiceOn ? "#ffffff" : "var(--color-foreground)", border: voiceOn ? "1px solid var(--color-idbi-green)" : "1px solid var(--color-border-subtle)" }}>
                      {voiceOn ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
                      {speaking ? "Stop" : voiceOn ? "Voice On" : "Voice Off"}
                    </button>
                    <button onClick={toggleListen}
                      aria-label={listening ? "Stop listening" : "Start voice input"}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-idbi-orange border border-border-subtle"
                      style={{ background: listening ? "rgba(239,68,68,0.1)" : "var(--color-surface-hover)", color: listening ? "#ef4444" : "var(--color-foreground)", borderColor: listening ? "rgba(239,68,68,0.3)" : "var(--color-border-subtle)" }}>
                      {listening ? <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}><Microphone size={16} /></motion.div> : <MicrophoneSlash size={16} />}
                      {listening ? "Listening" : "Speak"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="text-idbi-green flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-muted leading-relaxed">
                Bank-grade secure. No real financial data is shared. Prototype environment.
              </p>
            </div>

            {/* Demo Scenarios */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4 text-text-muted">Scenarios</p>
              <div className="grid grid-cols-2 gap-4">
                {SCENARIOS.map(s => {
                  const Icon = s.icon;
                  return (
                    <button key={s.key} onClick={() => triggerScenario(s.key)} disabled={loading}
                      className="flex flex-col items-start p-4 rounded-lg bg-surface text-left transition-colors hover:bg-surface-hover disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-idbi-green border border-border-subtle hover:border-border-strong shadow-sm">
                      <Icon size={18} style={{ color: s.color }} className="mb-4" />
                      <p className="text-foreground text-sm font-medium mb-1">{s.label}</p>
                      <p className="text-xs text-text-muted">{s.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column (Desktop: 7 cols) - Chat & Financials */}
          <div className="md:col-span-7 flex flex-col gap-8 mt-12 md:mt-0">

            {/* Financial Tabs */}
            <div>
              <div className="flex gap-4 border-b border-border-subtle mb-6">
                {([
                  { k: "overview", label: "Overview" },
                  { k: "portfolio", label: "Portfolio" },
                  { k: "transactions", label: "Ledger" },
                ] as const).map(({ k, label }) => (
                  <button key={k} onClick={() => setTab(k)}
                    aria-selected={tab === k}
                    role="tab"
                    className="pb-3 text-sm font-medium transition-colors focus-visible:outline-none"
                    style={{
                      color: tab === k ? "var(--color-foreground)" : "var(--color-text-muted)",
                      borderBottom: tab === k ? "2px solid var(--color-foreground)" : "2px solid transparent",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* Overview */}
                {tab === "overview" && (
                  <motion.div key="overview" initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Net Worth", value: "₹7.5L" },
                        { label: "Monthly Flow", value: "₹1.25L" },
                        { label: "Savings Rate", value: "14%" },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-5 rounded-lg bg-surface border border-border-subtle shadow-sm">
                          <p className="text-xs text-text-muted mb-2">{label}</p>
                          <p className="text-foreground font-medium text-xl tracking-tight">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {mockGoals.map(goal => {
                        const pct = Math.round((goal.current / goal.target) * 100);
                        return (
                          <div key={goal.id} className="p-5 rounded-lg bg-surface border border-border-subtle shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-foreground text-sm font-medium">{goal.name}</span>
                              <span className="text-xs font-mono text-text-muted">{pct}%</span>
                            </div>
                            <div className="w-full h-1 bg-surface-hover mb-3">
                              <motion.div className="h-full bg-idbi-green"
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                            </div>
                            <div className="flex justify-between text-xs text-text-muted font-mono">
                              <span>{fmt(goal.current)}</span>
                              <span>{fmt(goal.target)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Portfolio */}
                {tab === "portfolio" && (
                  <motion.div key="portfolio" initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-3">
                    {mockHoldings.map(h => (
                      <div key={h.name} className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border-subtle group hover:border-border-strong transition-colors shadow-sm">
                        <div className="flex-1">
                          <p className="text-foreground text-sm font-medium mb-1">{h.name}</p>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1 bg-surface-hover">
                              <motion.div className="h-full" style={{ background: h.color }}
                                initial={{ width: 0 }} animate={{ width: `${h.percent}%` }} transition={{ duration: 0.6 }} />
                            </div>
                            <span className="text-xs text-text-muted font-mono">{h.percent}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-foreground font-mono text-sm mb-1">{fmt(h.value)}</p>
                          <p className="text-xs font-mono text-idbi-green">+{h.returns}%</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Transactions */}
                {tab === "transactions" && (
                  <motion.div key="transactions" initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-3">
                    <div className="bg-surface border border-border-subtle rounded-lg shadow-sm">
                      {mockTransactions.map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border-b border-border-subtle last:border-0" style={{ background: tx.spike ? "rgba(239,68,68,0.03)" : "transparent" }}>
                          <div>
                            <p className="text-foreground text-sm font-medium">{tx.merchant}</p>
                            <p className="text-xs text-text-muted mt-1">{tx.date}</p>
                          </div>
                          <span className="text-sm font-mono" style={{ color: tx.type === "credit" ? "var(--color-idbi-green)" : "var(--color-foreground)" }}>
                            {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Interface */}
            <div className="flex flex-col h-[450px] border border-border-strong rounded-lg bg-surface shadow-sm">
              <div className="px-5 py-4 border-b border-border-subtle bg-surface-hover rounded-t-lg">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Agent Thread</p>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto p-5">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div key={i} initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                      className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded flex-shrink-0 bg-idbi-green text-white flex items-center justify-center text-[10px] font-bold mt-1">A</div>
                      )}
                      <div className="max-w-[85%] text-sm leading-relaxed px-4 py-3 rounded-lg border"
                        style={{ 
                          background: msg.role === "user" ? "var(--color-idbi-green)" : "var(--color-surface-hover)", 
                          color: msg.role === "user" ? "#ffffff" : "var(--color-foreground)",
                          borderColor: msg.role === "user" ? "transparent" : "var(--color-border-subtle)"
                        }}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded flex-shrink-0 bg-idbi-green text-white flex items-center justify-center text-[10px] font-bold mt-1">A</div>
                    <div className="flex gap-1.5 mt-4 px-4">
                      {[0, 1, 2].map(j => (
                        <motion.div key={j} className="w-1.5 h-1.5 rounded-full bg-text-muted"
                          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: j * 0.2 }} />
                      ))}
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Bar */}
              <div className="p-4 border-t border-border-subtle bg-surface-hover rounded-b-lg">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                  <button type="button" onClick={toggleListen} aria-label={listening ? "Stop recording" : "Record voice message"}
                    className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-idbi-green border border-border-subtle"
                    style={{ background: listening ? "rgba(239,68,68,0.1)" : "var(--color-surface)", color: listening ? "#ef4444" : "var(--color-text-muted)" }}>
                    <Microphone size={18} />
                  </button>

                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." disabled={loading}
                    className="flex-1 text-foreground text-sm outline-none px-4 py-2.5 h-10 rounded transition-colors bg-surface border border-border-strong focus:border-idbi-green focus-visible:ring-1 focus-visible:ring-idbi-green"
                  />

                  <button type="submit" disabled={loading || !input.trim()} aria-label="Send message"
                    className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-idbi-green bg-idbi-green text-white hover:bg-[#00705a]">
                    <PaperPlaneTilt size={16} weight="fill" />
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
