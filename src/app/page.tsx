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
      const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
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
      const res  = await fetch("/api/scenarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioKey: key }) });
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
    <div className="min-h-[100dvh] flex flex-col font-sans">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 h-16 bg-background/85 backdrop-blur-xl border-b border-idbi-green-muted">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black bg-gradient-to-br from-idbi-green to-[#005a4a] shadow-[0_0_12px_var(--color-idbi-green-glow)]">
            IB
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted leading-none">IDBI Bank</p>
            <p className="text-base font-semibold text-white leading-none mt-1">Digital Wealth</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-idbi-orange-muted border border-idbi-orange/25">
          <Sparkle weight="fill" size={14} className="text-idbi-orange" />
          <span className="text-xs font-semibold text-idbi-orange">AI Advisory</span>
        </div>

        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-idbi-green to-idbi-orange">
          RS
        </div>
      </header>

      {/* ── Main Layout ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 md:grid md:grid-cols-12 md:gap-8">

          {/* Left Column (Desktop: 5 cols) - Avatar & Controls */}
          <div className="md:col-span-5 space-y-6">

            {/* Avatar Section */}
            <div className="relative rounded-3xl overflow-hidden bg-surface border border-idbi-green-muted p-6 shadow-sm">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <motion.div className="absolute top-4 left-20 w-40 h-40 rounded-full bg-[radial-gradient(ellipse,var(--color-idbi-green-muted)_0%,transparent_70%)]"
                  animate={glowAnim}
                  transition={{ repeat: Infinity, duration: avatarState === "talking" ? 0.55 : 2.5, ease: "easeInOut" }}
                />
              </div>

              <div className="flex items-center gap-5 relative z-10">
                <div className="relative flex-shrink-0">
                  <motion.div animate={shouldReduceMotion ? {} : (avatarState === "talking" ? { y: [0, -4, 0, -3, 0] } : avatarState === "thinking" ? { rotate: [-1, 1, -1] } : { y: [0, -2, 0] })}
                    transition={{ repeat: Infinity, duration: avatarState === "talking" ? 0.5 : avatarState === "thinking" ? 1.8 : 5, ease: "easeInOut" }}>
                    <img src="/ava-avatar.jpg" alt="Ava AI Advisor"
                      className="w-[100px] h-[100px] rounded-full object-cover object-top transition-all duration-300"
                      style={{
                        border: `3px solid ${avatarState === "talking" ? "var(--color-idbi-green)" : avatarState === "thinking" ? "var(--color-idbi-orange)" : "var(--color-idbi-green-muted)"}`,
                        boxShadow: `0 0 ${avatarState === "idle" ? "12px" : "24px"} ${avatarState === "talking" ? "var(--color-idbi-green-glow)" : "var(--color-idbi-orange-glow)"}`
                      }}
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-strong text-[10px] text-white font-bold whitespace-nowrap transition-colors duration-300"
                      style={{ background: avatarState === "talking" ? "var(--color-idbi-green)" : avatarState === "thinking" ? "var(--color-idbi-orange)" : "#112720" }}>
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-white" animate={avatarState !== "idle" ? { opacity: [1, 0.2, 1] } : { opacity: 1 }} transition={{ repeat: Infinity, duration: 0.7 }} />
                      {avatarState === "talking" ? "Speaking" : avatarState === "thinking" ? "Thinking..." : "Ready"}
                    </div>
                  </motion.div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-white font-bold text-2xl tracking-tight">Ava</h1>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-idbi-green-muted text-green-400 border border-idbi-green/30">
                      AI Advisor
                    </span>
                  </div>
                  <p className="text-xs mb-4 text-text-muted font-medium">Gemini AI · IDBI Bank</p>

                  <div className="flex items-center gap-2">
                    <button onClick={() => voiceOn ? (speaking ? stopSpeak() : setVoiceOn(false)) : setVoiceOn(true)}
                      aria-label={speaking ? "Stop speaking" : voiceOn ? "Disable voice" : "Enable voice"}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-idbi-green"
                      style={{ background: voiceOn ? "var(--color-idbi-green-muted)" : "var(--color-surface-hover)", color: voiceOn ? "#4ade80" : "var(--color-text-muted)" }}>
                      {voiceOn ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
                      {speaking ? "Stop" : voiceOn ? "Voice On" : "Voice Off"}
                    </button>
                    <button onClick={toggleListen}
                      aria-label={listening ? "Stop listening" : "Start voice input"}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-idbi-orange border"
                      style={{ background: listening ? "rgba(239,68,68,0.2)" : "var(--color-surface-hover)", borderColor: listening ? "rgba(239,68,68,0.4)" : "transparent", color: listening ? "#f87171" : "var(--color-text-muted)" }}>
                      {listening ? <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}><Microphone size={16} /></motion.div> : <MicrophoneSlash size={16} />}
                      {listening ? "Listening" : "Speak"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-idbi-green/10 border border-idbi-green/20">
              <ShieldCheck size={18} weight="fill" className="text-idbi-green flex-shrink-0" />
              <p className="text-xs text-text-muted font-medium leading-relaxed">
                Bank-grade secure. No real financial data is shared. This is a hackathon prototype.
              </p>
            </div>

            {/* Demo Scenarios */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3 text-text-muted">Demo Scenarios</p>
              <div className="grid grid-cols-2 gap-3">
                {SCENARIOS.map(s => {
                  const Icon = s.icon;
                  return (
                    <motion.button key={s.key} onClick={() => triggerScenario(s.key)} disabled={loading}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                      className="flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-all hover:bg-surface-hover disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-idbi-green bg-surface border"
                      style={{ borderColor: `${s.color}40` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}25` }}>
                        <Icon size={20} weight="fill" style={{ color: s.color }} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold leading-tight mb-1">{s.label}</p>
                        <p className="text-xs text-text-muted font-medium">{s.sub}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column (Desktop: 7 cols) - Chat & Financials */}
          <div className="md:col-span-7 flex flex-col gap-6 mt-8 md:mt-0">

            {/* Financial Tabs */}
            <div className="bg-surface border border-border-subtle rounded-3xl p-4 md:p-6 shadow-sm">
              <div className="flex gap-2 p-1.5 rounded-2xl mb-6 bg-black/20 border border-border-subtle">
                {([
                  { k: "overview", label: "Overview", Icon: ChartBar },
                  { k: "portfolio", label: "Portfolio", Icon: ChartPie },
                  { k: "transactions", label: "Transactions", Icon: Wallet },
                ] as const).map(({ k, label, Icon }) => (
                  <button key={k} onClick={() => setTab(k)}
                    aria-selected={tab === k}
                    role="tab"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-idbi-green min-h-[44px]"
                    style={{
                      background: tab === k ? "var(--color-idbi-green-muted)" : "transparent",
                      color: tab === k ? "#4ade80" : "var(--color-text-muted)",
                      border: tab === k ? "1px solid var(--color-idbi-green-muted)" : "1px solid transparent",
                    }}>
                    <Icon size={16} weight={tab === k ? "fill" : "regular"} />
                    {label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* Overview */}
                {tab === "overview" && (
                  <motion.div key="overview" initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                      {[
                        { label: "Net Worth", value: "₹7.5L", Icon: TrendUp, pos: true },
                        { label: "Income", value: "₹1.25L/mo", Icon: ChartBar, pos: true },
                        { label: "Savings", value: "Declining", Icon: TrendDown, pos: false },
                      ].map(({ label, value, Icon, pos }) => (
                        <div key={label} className="p-4 rounded-2xl bg-surface-hover border border-border-subtle">
                          <Icon size={18} weight="fill" className="mb-2" style={{ color: pos ? "var(--color-idbi-green)" : "var(--color-idbi-orange)" }} />
                          <p className="text-white font-black text-sm md:text-lg leading-none">{value}</p>
                          <p className="text-xs mt-2 text-text-muted font-medium">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {mockGoals.map(goal => {
                        const pct = Math.round((goal.current / goal.target) * 100);
                        const Icon = goal.icon;
                        return (
                          <div key={goal.id} className="p-4 md:p-5 rounded-2xl bg-surface-hover border border-border-subtle">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Icon size={18} weight="fill" className="text-idbi-orange" />
                                <span className="text-white text-sm font-bold">{goal.name}</span>
                              </div>
                              <span className="text-sm font-black text-idbi-orange">{pct}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden bg-black/30">
                              <motion.div className="h-full rounded-full bg-gradient-to-r from-idbi-green to-idbi-orange"
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
                            </div>
                            <div className="flex justify-between mt-3 text-xs font-medium text-text-muted">
                              <span>{fmt(goal.current)}</span>
                              <span>{fmt(goal.target)} · {goal.deadline}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Portfolio */}
                {tab === "portfolio" && (
                  <motion.div key="portfolio" initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
                    {mockHoldings.map(h => (
                      <div key={h.name} className="p-4 md:p-5 rounded-2xl bg-surface-hover border border-border-subtle">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: h.color }} />
                            <span className="text-white text-sm font-bold">{h.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-400">
                            <ArrowUpRight size={14} />
                            <span className="text-xs font-black">{h.returns}%</span>
                          </div>
                        </div>
                        <div className="flex items-end justify-between mb-3">
                          <span className="text-white font-black text-lg">{fmt(h.value)}</span>
                          <span className="text-xs font-medium text-text-muted">{h.percent}% alloc</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/30">
                          <motion.div className="h-full rounded-full" style={{ background: h.color }}
                            initial={{ width: 0 }} animate={{ width: `${h.percent}%` }} transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Transactions */}
                {tab === "transactions" && (
                  <motion.div key="transactions" initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-2">
                    {mockTransactions.map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl border"
                        style={{ background: tx.spike ? "rgba(239,68,68,0.08)" : "var(--color-surface-hover)", borderColor: tx.spike ? "rgba(239,68,68,0.25)" : "var(--color-border-subtle)" }}>
                        <div>
                          <p className="text-white text-sm font-bold">{tx.merchant}</p>
                          <p className="text-xs mt-1 text-text-muted font-medium">
                            {tx.cat}{tx.spike ? " · Spike" : ""} · {tx.date}
                          </p>
                        </div>
                        <span className="text-sm font-black ml-3" style={{ color: tx.type === "credit" ? "#4ade80" : tx.spike ? "#f87171" : "white" }}>
                          {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Interface */}
            <div className="bg-surface border border-border-subtle rounded-3xl p-4 md:p-6 flex flex-col h-[500px] shadow-sm">
              <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <ChatCircleText size={16} className="text-text-muted" />
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Conversation</p>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-2">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div key={i} initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <img src="/ava-avatar.jpg" alt="Ava" className="w-8 h-8 rounded-full object-cover object-top flex-shrink-0 mt-1 border border-idbi-green/50" />
                      )}
                      <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed text-white font-medium shadow-sm"
                        style={{
                          background: msg.role === "user" ? "linear-gradient(135deg, var(--color-idbi-green), #005a4a)" : "var(--color-surface-active)",
                          border: msg.role === "assistant" ? "1px solid var(--color-border-strong)" : "none",
                          borderBottomRightRadius: msg.role === "user" ? 6 : undefined,
                          borderBottomLeftRadius: msg.role === "assistant" ? 6 : undefined,
                        }}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
                    <img src="/ava-avatar.jpg" alt="Ava" className="w-8 h-8 rounded-full object-cover object-top border border-idbi-green/50" />
                    <div className="px-4 py-3.5 rounded-2xl rounded-bl-md bg-surface-active border border-border-strong">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map(j => (
                          <motion.div key={j} className="w-2 h-2 rounded-full bg-idbi-green"
                            animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: j * 0.12 }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Bar */}
              <div className="mt-4 pt-4 border-t border-border-subtle flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                  <button type="button" onClick={toggleListen} aria-label={listening ? "Stop recording" : "Record voice message"}
                    className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-idbi-orange border"
                    style={{ background: listening ? "rgba(239,68,68,0.2)" : "var(--color-surface-hover)", borderColor: listening ? "rgba(239,68,68,0.4)" : "var(--color-border-subtle)" }}>
                    {listening ? <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}><Microphone size={20} className="text-red-400" /></motion.div> : <Microphone size={20} className="text-text-muted" />}
                  </button>

                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Ava anything..." disabled={loading}
                    className="flex-1 text-white text-sm outline-none px-4 py-2 min-h-[44px] rounded-2xl transition-all bg-surface border border-border-strong focus:border-idbi-green focus:bg-surface-active focus-visible:ring-1 focus-visible:ring-idbi-green"
                  />

                  <motion.button type="submit" disabled={loading || !input.trim()} aria-label="Send message"
                    whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                    className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-idbi-green bg-gradient-to-br from-idbi-green to-[#005a4a] shadow-[0_0_12px_var(--color-idbi-green-glow)]">
                    <PaperPlaneTilt size={18} weight="fill" className="text-white" />
                  </motion.button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
