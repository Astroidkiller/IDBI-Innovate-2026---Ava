# Ava — IDBI Digital Wealth Advisor

> An AI-powered, avatar-based wealth advisory prototype built for **IDBI Innovate 2026 Hackathon** | Problem Statement 1: Digital Wealth Management.

---

## 🚀 Live Demo
**Deployed on Render.com:** _(link will be added after deployment)_

---

## 💡 What is Ava?

**Ava** is a conversational AI wealth advisor embedded as a mobile-first web app. She analyzes your transaction history, investment portfolio, and financial goals to deliver personalized, real-time guidance — powered by Google Gemini AI.

### Key Features
- 🤖 **Avatar-based AI Advisor** — Animated 2D avatar with idle/thinking/talking states
- 🎙️ **Voice In + Voice Out** — Speak to Ava, and she speaks back using Web Speech API
- 📊 **Live Financial Dashboard** — Net worth, portfolio, goals, transactions all in one view
- ⚡ **4 Demo Scenarios** — One-click demo triggers for overspending, rebalancing, goal nudges, and loan analysis
- 🎨 **IDBI Brand Colors** — Official IDBI green (#00836C) and orange (#F58220) palette

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| AI | Google Gemini 1.5 Flash API |
| Voice | Web Speech API (built-in browser) |
| Data | Synthetic JSON mock data |
| Deployment | Render.com |

---

## ⚙️ Local Setup

### 1. Clone and Install
```bash
git clone https://github.com/Astroidkiller/IDBI-Innovate-2026---Ava.git
cd IDBI-Innovate-2026---Ava
npm install
```

### 2. Environment Variables
Create a `.env.local` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
```
Get a free key from [Google AI Studio](https://aistudio.google.com/).

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Architecture

```
User (Browser)
     │
     ▼
Next.js Frontend (App Router)
  ├── Avatar Component (animated states: idle / thinking / talking)
  ├── Dashboard (portfolio, goals, transactions)
  ├── Chat Interface (text + voice)
  └── Demo Scenario Buttons
     │
     ▼
Next.js API Routes (Backend)
  ├── /api/chat      → Gemini AI (free-form conversation)
  └── /api/scenarios → Gemini AI (pre-configured scenario prompts)
     │
     ▼
Google Gemini 1.5 Flash API
  (System prompt injected with mock financial data)
```

---

## 📋 Demo Scenarios

| Scenario | Trigger | Description |
|---|---|---|
| 🚨 Overspending Alert | Button | Flags ₹18,000 electronics spike |
| 📊 Portfolio Rebalancing | Button | Reviews 60/33/7 allocation |
| 🎯 Goal Nudge | Button | SIP top-up for home down payment |
| 🚗 Car Loan Query | Button | Full affordability analysis |

---

## 👥 Team
Built for **IDBI Innovate 2026 Hackathon** — Problem Statement 1: Digital Wealth Management.
