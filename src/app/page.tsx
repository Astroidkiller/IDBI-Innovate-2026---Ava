"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  PieChart,
  MessageCircle,
  Car,
  Volume2,
  VolumeX,
  Sparkles,
  Home as HomeIcon,
  Wallet,
  BarChart3,
} from "lucide-react";

const mockProfile = {
  name: "Rohan Sharma",
  age: 32,
  riskAppetite: "Moderate",
  netWorth: 750000,
  monthlyIncome: 125000,
  savingsRate: "Declining",
};

const mockHoldings = [
  { name: "Equity Mutual Funds", value: 450000, percent: 60, returns: 12.5, color: "#00836C" },
  { name: "Fixed Deposits", value: 250000, percent: 33.3, returns: 6.8, color: "#F58220" },
  { name: "Gold", value: 50000, percent: 6.7, returns: 8.1, color: "#EAB308" },
];

const mockGoals = [
  { id: "goal_1", name: "Home Down Payment", icon: HomeIcon, target: 1500000, current: 600000, deadline: "Dec 2028" },
  { id: "goal_2", name: "Emergency Fund", icon: Wallet, target: 300000, current: 280000, deadline: "Oct 2026" },
];

const mockTransactions = [
  { category: "Food & Dining", amount: 4500, merchant: "Zomato", date: "Jul 10", type: "debit" },
  { category: "Travel", amount: 1200, merchant: "Uber", date: "Jul 9", type: "debit" },
  { category: "Rent", amount: 25000, merchant: "Landlord", date: "Jul 8", type: "debit" },
  { category: "Discretionary ⚠️", amount: 18000, merchant: "Apple Store", date: "Jul 5", type: "debit", spike: true },
  { category: "Salary", amount: 125000, merchant: "Employer", date: "Jul 1", type: "credit" },
];

const scenarios = [
  { key: "overspending", label: "Overspending Alert", icon: AlertTriangle, color: "#ef4444", desc: "Spending spike detected" },
  { key: "rebalancing", label: "Portfolio Review", icon: PieChart, color: "#00836C", desc: "Rebalancing insight" },
  { key: "goalNudge", label: "Goal Nudge", icon: Target, color: "#F58220", desc: "SIP recommendation" },
  { key: "carLoan", label: "Car Loan Query", icon: Car, color: "#8B5CF6", desc: "Affordability analysis" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

type AvatarState = "idle" | "thinking" | "talking";

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi Rohan! 👋 I'm Ava, your personal wealth advisor at IDBI Bank. I've analyzed your financial profile and I'm here to help you make smarter money decisions. What's on your mind today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "portfolio" | "transactions">("overview");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const clean = text.replace(/[*_#`]/g, "").replace(/\n/g, " ");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Google UK English Female"));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => { setAvatarState("talking"); setIsSpeaking(true); };
    utterance.onend = () => { setAvatarState("idle"); setIsSpeaking(false); };
    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setAvatarState("idle");
    setIsSpeaking(false);
  };

  const sendMessage = async (content: string, currentMessages: Message[]) => {
    const newMessages: Message[] = [...currentMessages, { role: "user", content }];
    setMessages(newMessages);
    setIsLoading(true);
    setAvatarState("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const reply = data.reply || "I'm having trouble connecting right now. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
      setAvatarState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    sendMessage(text, messages);
  };

  const triggerScenario = async (key: string) => {
    setIsLoading(true);
    setAvatarState("thinking");
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioKey: key }),
      });
      const data = await res.json();
      const reply = data.reply || "Unable to load scenario.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      setAvatarState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Voice not supported in this browser. Try Chrome.");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0d1117 0%, #0f1f1c 50%, #0d1117 100%)" }}>
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50" style={{ background: "rgba(13,17,23,0.85)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #00836C, #006654)" }}>
            IB
          </div>
          <div>
            <p className="text-xs text-white/50 leading-none">IDBI Bank</p>
            <p className="text-sm font-semibold text-white leading-none mt-0.5">Digital Wealth</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#F58220" }} />
          <span className="text-xs font-medium" style={{ color: "#F58220" }}>AI Advisory</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-green-600 flex items-center justify-center text-xs font-bold text-white">
            RS
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto flex flex-col h-[calc(100vh-56px)]">
        {/* Avatar Panel */}
        <div className="relative px-4 pt-4 pb-2">
          <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, rgba(0,131,108,0.15), rgba(245,130,32,0.1))", border: "1px solid rgba(0,131,108,0.3)" }}>
            {/* Glow behind avatar */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="rounded-full"
                style={{ width: 140, height: 140, background: "radial-gradient(ellipse, rgba(0,131,108,0.3) 0%, transparent 70%)" }}
                animate={{ scale: avatarState === "talking" ? [1, 1.1, 1] : avatarState === "thinking" ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: Infinity, duration: avatarState === "talking" ? 0.6 : 2, ease: "easeInOut" }}
              />
            </div>

            <div className="flex items-center gap-4 p-4 relative z-10">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <motion.div
                  className="relative"
                  animate={avatarState === "talking" ? { y: [0, -3, 0, -2, 0] } : avatarState === "thinking" ? { rotate: [-1, 1, -1] } : { y: [0, -2, 0] }}
                  transition={{ repeat: Infinity, duration: avatarState === "talking" ? 0.5 : avatarState === "thinking" ? 1.5 : 4, ease: "easeInOut" }}
                >
                  <img
                    src="/ava-avatar.jpg"
                    alt="Ava AI Advisor"
                    className="w-24 h-24 rounded-full object-cover object-top"
                    style={{ border: "3px solid #00836C", boxShadow: "0 0 20px rgba(0,131,108,0.5)" }}
                  />
                  {/* State indicator */}
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: avatarState === "talking" ? "#00836C" : avatarState === "thinking" ? "#F58220" : "#1e3a34",
                      border: "1px solid rgba(255,255,255,0.2)",
                      fontSize: "9px",
                      color: "white"
                    }}>
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-white"
                      animate={{ opacity: avatarState !== "idle" ? [1, 0.3, 1] : 1 }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                    {avatarState === "talking" ? "Speaking" : avatarState === "thinking" ? "Thinking..." : "Ready"}
                  </div>
                </motion.div>
              </div>

              {/* Ava Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-white font-bold text-lg">Ava</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,131,108,0.3)", color: "#4ade80", border: "1px solid rgba(0,131,108,0.4)" }}>
                    AI Advisor
                  </span>
                </div>
                <p className="text-white/60 text-xs mb-2">Powered by Gemini AI • IDBI Bank</p>
                {/* Voice controls */}
                <div className="flex items-center gap-2">
                  <button onClick={() => { if (isSpeaking) stopSpeaking(); else setVoiceEnabled(v => !v); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{ background: voiceEnabled ? "rgba(0,131,108,0.3)" : "rgba(255,255,255,0.1)", color: voiceEnabled ? "#4ade80" : "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                    {isSpeaking ? "Stop" : voiceEnabled ? "Voice On" : "Voice Off"}
                  </button>
                  <button onClick={toggleVoiceInput}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{ background: isListening ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)", color: isListening ? "#f87171" : "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {isListening ? <><motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}><Mic className="w-3 h-3" /></motion.div> Listening</> : <><MicOff className="w-3 h-3" /> Tap to Speak</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Scenarios */}
        <div className="px-4 py-2">
          <p className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">Quick Demo Scenarios</p>
          <div className="grid grid-cols-2 gap-2">
            {scenarios.map((s) => {
              const Icon = s.icon;
              return (
                <motion.button
                  key={s.key}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => triggerScenario(s.key)}
                  disabled={isLoading}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-all disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${s.color}33` }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}22` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold leading-none">{s.label}</p>
                    <p className="text-white/40 text-xs leading-none mt-0.5">{s.desc}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="px-4 py-1">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            {[
              { key: "overview", label: "Overview", icon: BarChart3 },
              { key: "portfolio", label: "Portfolio", icon: PieChart },
              { key: "transactions", label: "Transactions", icon: Wallet },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeTab === tab.key ? "rgba(0,131,108,0.4)" : "transparent",
                    color: activeTab === tab.key ? "#4ade80" : "#9ca3af",
                    border: activeTab === tab.key ? "1px solid rgba(0,131,108,0.4)" : "1px solid transparent"
                  }}>
                  <Icon className="w-3 h-3" />{tab.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { label: "Net Worth", value: formatCurrency(750000), icon: TrendingUp, positive: true },
                  { label: "Monthly Income", value: "₹1.25L", icon: BarChart3, positive: true },
                  { label: "Savings Rate", value: "Declining", icon: TrendingDown, positive: false },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Icon className="w-3 h-3 mb-1.5" style={{ color: stat.positive ? "#00836C" : "#F58220" }} />
                      <p className="text-white font-bold text-xs leading-none">{stat.value}</p>
                      <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
                    </div>
                  );
                })}
                {mockGoals.map(goal => {
                  const pct = Math.round((goal.current / goal.target) * 100);
                  const Icon = goal.icon;
                  return (
                    <div key={goal.id} className="col-span-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" style={{ color: "#F58220" }} />
                          <span className="text-white text-xs font-semibold">{goal.name}</span>
                        </div>
                        <span className="text-xs" style={{ color: "#F58220" }}>{pct}% • {goal.deadline}</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <motion.div className="h-2 rounded-full" style={{ background: "linear-gradient(90deg, #00836C, #F58220)", width: `${pct}%` }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-white/40 text-xs">{formatCurrency(goal.current)}</span>
                        <span className="text-white/40 text-xs">{formatCurrency(goal.target)}</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === "portfolio" && (
              <motion.div key="portfolio" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="mt-2 space-y-2">
                {mockHoldings.map(h => (
                  <div key={h.name} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: h.color }} />
                        <span className="text-white text-xs font-medium">{h.name}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: "#4ade80" }}>+{h.returns}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-sm">{formatCurrency(h.value)}</span>
                      <span className="text-white/50 text-xs">{h.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full mt-2" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <motion.div className="h-1.5 rounded-full" style={{ background: h.color, width: `${h.percent}%` }} initial={{ width: 0 }} animate={{ width: `${h.percent}%` }} transition={{ duration: 1, delay: 0.2 }} />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "transactions" && (
              <motion.div key="transactions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="mt-2 space-y-1.5">
                {mockTransactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: tx.spike ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${tx.spike ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}` }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{tx.merchant}</p>
                      <p className="text-white/40 text-xs">{tx.category} • {tx.date}</p>
                    </div>
                    <span className="text-xs font-bold ml-2" style={{ color: tx.type === "credit" ? "#4ade80" : tx.spike ? "#f87171" : "#e5e7eb" }}>
                      {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-3.5 h-3.5 text-white/40" />
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Conversation</p>
          </div>
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <img src="/ava-avatar.jpg" alt="Ava" className="w-7 h-7 rounded-full object-cover object-top flex-shrink-0 mt-0.5" style={{ border: "1.5px solid #00836C" }} />
                )}
                <div className="max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed"
                  style={{
                    background: msg.role === "user" ? "linear-gradient(135deg, #00836C, #006654)" : "rgba(255,255,255,0.08)",
                    color: "white",
                    borderBottomRightRadius: msg.role === "user" ? 4 : undefined,
                    borderBottomLeftRadius: msg.role === "assistant" ? 4 : undefined,
                    border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.1)" : "none"
                  }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
              <img src="/ava-avatar.jpg" alt="Ava" className="w-7 h-7 rounded-full object-cover object-top" style={{ border: "1.5px solid #00836C" }} />
              <div className="px-3 py-2 rounded-2xl rounded-bl-sm" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#00836C" }} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10" style={{ background: "rgba(13,17,23,0.9)", backdropFilter: "blur(16px)" }}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <button type="button" onClick={toggleVoiceInput}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: isListening ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)", border: `1px solid ${isListening ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.15)"}` }}>
              {isListening
                ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}><Mic className="w-4 h-4 text-red-400" /></motion.div>
                : <Mic className="w-4 h-4 text-white/50" />}
            </button>

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Ava anything..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30 px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
              disabled={isLoading}
            />

            <motion.button type="submit" disabled={isLoading || !input.trim()}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #00836C, #006654)" }}>
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
