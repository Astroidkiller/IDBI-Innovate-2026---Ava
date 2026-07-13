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
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "linear-gradient(160deg, #080e0d 0%, #0b1a16 50%, #080e0d 100%)" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14"
        style={{ background: "rgba(8,14,13,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,131,108,0.15)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black"
            style={{ background: "linear-gradient(135deg, #00836C 0%, #005a4a 100%)", boxShadow: "0 0 12px rgba(0,131,108,0.4)" }}>
            IB
          </div>
          <div>
            <p className="text-[10px] font-medium leading-none" style={{ color: "rgba(255,255,255,0.4)" }}>IDBI Bank</p>
            <p className="text-sm font-semibold text-white leading-none mt-0.5">Digital Wealth</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(245,130,32,0.12)", border: "1px solid rgba(245,130,32,0.25)" }}>
          <Sparkle weight="fill" size={12} style={{ color: "#F58220" }} />
          <span className="text-[11px] font-semibold" style={{ color: "#F58220" }}>AI Advisory</span>
        </div>

        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #00836C, #F58220)" }}>
          RS
        </div>
      </header>

      {/* ── Main scroll area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 pb-4 space-y-3 pt-3">

          {/* ── Avatar Card ────────────────────────────────────────────────── */}
          <div className="relative rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(0,131,108,0.12) 0%, rgba(245,130,32,0.07) 100%)", border: "1px solid rgba(0,131,108,0.2)" }}>

            {/* Ambient glow */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <motion.div className="absolute top-4 left-16 w-32 h-32 rounded-full"
                style={{ background: "radial-gradient(ellipse, rgba(0,131,108,0.25) 0%, transparent 70%)" }}
                animate={glowAnim}
                transition={{ repeat: Infinity, duration: avatarState === "talking" ? 0.55 : 2.5, ease: "easeInOut" }}
              />
            </div>

            <div className="flex items-center gap-4 p-4 relative z-10">
              {/* Avatar with state ring */}
              <div className="relative flex-shrink-0">
                <motion.div
                  animate={shouldReduceMotion ? {} : (
                    avatarState === "talking"  ? { y: [0, -4, 0, -3, 0] } :
                    avatarState === "thinking" ? { rotate: [-1, 1, -1] } :
                    { y: [0, -2, 0] }
                  )}
                  transition={{ repeat: Infinity, duration: avatarState === "talking" ? 0.5 : avatarState === "thinking" ? 1.8 : 5, ease: "easeInOut" }}
                >
                  <img src="/ava-avatar.jpg" alt="Ava AI Advisor"
                    className="w-[88px] h-[88px] rounded-full object-cover object-top"
                    style={{
                      border: `3px solid ${avatarState === "talking" ? "#00836C" : avatarState === "thinking" ? "#F58220" : "rgba(0,131,108,0.5)"}`,
                      boxShadow: `0 0 ${avatarState === "idle" ? "12px" : "24px"} ${avatarState === "talking" ? "rgba(0,131,108,0.6)" : "rgba(245,130,32,0.4)"}`,
                      transition: "border-color 0.3s, box-shadow 0.3s",
                    }}
                  />
                  {/* Status pill */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: avatarState === "talking" ? "#00836C" : avatarState === "thinking" ? "#F58220" : "#112720", border: "1px solid rgba(255,255,255,0.15)", fontSize: "9px", color: "white", fontWeight: 600 }}>
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-white"
                      animate={avatarState !== "idle" ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 0.7 }}
                    />
                    {avatarState === "talking" ? "Speaking" : avatarState === "thinking" ? "Thinking..." : "Ready"}
                  </div>
                </motion.div>
              </div>

              {/* Ava info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-white font-bold text-xl tracking-tight">Ava</h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                    style={{ background: "rgba(0,131,108,0.25)", color: "#4ade80", border: "1px solid rgba(0,131,108,0.35)" }}>
                    AI Advisor
                  </span>
                </div>
                <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>Gemini AI · IDBI Bank</p>

                {/* Voice controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => voiceOn ? (speaking ? stopSpeak() : setVoiceOn(false)) : setVoiceOn(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                    style={{ background: voiceOn ? "rgba(0,131,108,0.2)" : "rgba(255,255,255,0.07)", color: voiceOn ? "#4ade80" : "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {voiceOn ? <SpeakerHigh size={12} /> : <SpeakerX size={12} />}
                    {speaking ? "Stop" : voiceOn ? "Voice On" : "Voice Off"}
                  </button>
                  <button
                    onClick={toggleListen}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                    style={{ background: listening ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)", color: listening ? "#f87171" : "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {listening
                      ? <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}><Microphone size={12} /></motion.div>
                      : <MicrophoneSlash size={12} />}
                    {listening ? "Listening..." : "Speak"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Security Badge ───────────────────────────────────────────── */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(0,131,108,0.06)", border: "1px solid rgba(0,131,108,0.12)" }}>
            <ShieldCheck size={14} weight="fill" style={{ color: "#00836C", flexShrink: 0 }} />
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Bank-grade secure · No real data shared · Demo prototype
            </p>
          </div>

          {/* ── Demo Scenarios ───────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Demo Scenarios
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SCENARIOS.map(s => {
                const Icon = s.icon;
                return (
                  <motion.button key={s.key}
                    onClick={() => triggerScenario(s.key)}
                    disabled={loading}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                    className="flex items-start gap-2.5 p-3 rounded-xl text-left transition-all disabled:opacity-40"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${s.color}28` }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${s.color}18` }}>
                      <Icon size={14} weight="fill" style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-white text-[12px] font-semibold leading-tight">{s.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.sub}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Dashboard Tabs ───────────────────────────────────────────── */}
          <div>
            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-xl mb-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {([
                { k: "overview",      label: "Overview",      Icon: ChartBar  },
                { k: "portfolio",     label: "Portfolio",     Icon: ChartPie  },
                { k: "transactions",  label: "Transactions",  Icon: Wallet    },
              ] as const).map(({ k, label, Icon }) => (
                <button key={k} onClick={() => setTab(k)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                  style={{
                    background: tab === k ? "rgba(0,131,108,0.35)" : "transparent",
                    color:      tab === k ? "#4ade80" : "rgba(255,255,255,0.4)",
                    border:     tab === k ? "1px solid rgba(0,131,108,0.4)" : "1px solid transparent",
                  }}>
                  <Icon size={12} weight={tab === k ? "fill" : "regular"} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {/* Overview */}
              {tab === "overview" && (
                <motion.div key="overview"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Net Worth",   value: "₹7.5L",     Icon: TrendUp,   pos: true },
                      { label: "Income",      value: "₹1.25L/mo", Icon: ChartBar,  pos: true },
                      { label: "Savings",     value: "Declining",  Icon: TrendDown, pos: false },
                    ].map(({ label, value, Icon, pos }) => (
                      <div key={label} className="p-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <Icon size={13} weight="fill" style={{ color: pos ? "#00836C" : "#F58220", marginBottom: 6 }} />
                        <p className="text-white font-bold text-xs leading-none">{value}</p>
                        <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Goals */}
                  {mockGoals.map(goal => {
                    const pct = Math.round((goal.current / goal.target) * 100);
                    const Icon = goal.icon;
                    return (
                      <div key={goal.id} className="p-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon size={13} weight="fill" style={{ color: "#F58220" }} />
                            <span className="text-white text-xs font-semibold">{goal.name}</span>
                          </div>
                          <span className="text-[11px] font-semibold" style={{ color: "#F58220" }}>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <motion.div className="h-1.5 rounded-full"
                            style={{ background: "linear-gradient(90deg, #00836C, #F58220)" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{fmt(goal.current)}</span>
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{fmt(goal.target)} · {goal.deadline}</span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* Portfolio */}
              {tab === "portfolio" && (
                <motion.div key="portfolio"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2">
                  {mockHoldings.map(h => (
                    <div key={h.name} className="p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: h.color }} />
                          <span className="text-white text-xs font-medium">{h.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowUpRight size={10} style={{ color: "#4ade80" }} />
                          <span className="text-[11px] font-bold" style={{ color: "#4ade80" }}>{h.returns}%</span>
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-white font-bold">{fmt(h.value)}</span>
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{h.percent}% alloc</span>
                      </div>
                      <div className="w-full h-1 rounded-full mt-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div className="h-1 rounded-full"
                          style={{ background: h.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${h.percent}%` }}
                          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Transactions */}
              {tab === "transactions" && (
                <motion.div key="transactions"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-1.5">
                  {mockTransactions.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{
                        background: tx.spike ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${tx.spike ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.07)"}`,
                      }}>
                      <div>
                        <p className="text-white text-xs font-semibold">{tx.merchant}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {tx.cat}{tx.spike ? " · Spike" : ""} · {tx.date}
                        </p>
                      </div>
                      <span className="text-xs font-bold ml-2"
                        style={{ color: tx.type === "credit" ? "#4ade80" : tx.spike ? "#f87171" : "rgba(255,255,255,0.7)" }}>
                        {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount)}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Chat ─────────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ChatCircleText size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                Conversation
              </p>
            </div>

            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div key={i}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <img src="/ava-avatar.jpg" alt="Ava"
                        className="w-6 h-6 rounded-full object-cover object-top flex-shrink-0 mt-0.5"
                        style={{ border: "1.5px solid #00836C" }} />
                    )}
                    <div className="max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed"
                      style={{
                        background:           msg.role === "user" ? "linear-gradient(135deg, #00836C, #005a4a)" : "rgba(255,255,255,0.06)",
                        color:                "white",
                        border:               msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
                        borderBottomRightRadius: msg.role === "user" ? 4 : undefined,
                        borderBottomLeftRadius:  msg.role === "assistant" ? 4 : undefined,
                      }}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
                  <img src="/ava-avatar.jpg" alt="Ava"
                    className="w-6 h-6 rounded-full object-cover object-top"
                    style={{ border: "1.5px solid #00836C" }} />
                  <div className="px-3 py-2.5 rounded-2xl rounded-bl-sm"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(j => (
                        <motion.div key={j} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "#00836C" }}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay: j * 0.12 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Input Bar ────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-40 px-4 py-3"
        style={{ background: "rgba(8,14,13,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,131,108,0.15)" }}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-md mx-auto">
          <button type="button" onClick={toggleListen}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: listening ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)", border: `1px solid ${listening ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}` }}>
            {listening
              ? <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}><Microphone size={16} style={{ color: "#f87171" }} /></motion.div>
              : <Microphone size={16} style={{ color: "rgba(255,255,255,0.4)" }} />}
          </button>

          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Ava anything about your finances..."
            disabled={loading}
            className="flex-1 text-white text-sm outline-none px-3 py-2 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
          />

          <motion.button type="submit" disabled={loading || !input.trim()}
            whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-35"
            style={{ background: "linear-gradient(135deg, #00836C 0%, #005a4a 100%)", boxShadow: "0 0 12px rgba(0,131,108,0.4)" }}>
            <PaperPlaneTilt size={16} weight="fill" style={{ color: "white" }} />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
