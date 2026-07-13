<div align="center">

  <h1>Ava — Digital Wealth Advisor</h1>
  <p><strong>An AI-powered, avatar-based wealth advisory platform built for the IDBI Innovate 2026 Hackathon (Problem Statement 1: Digital Wealth Management).</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Gemini_AI-3.5_Flash-8E75B2?style=for-the-badge&logo=google" alt="Gemini AI" />
    <img src="https://img.shields.io/badge/Security-Grade_A-brightgreen?style=for-the-badge&logo=security" alt="Security" />
  </p>
</div>

---

## 🚀 Live Demo
**Deployed on Render.com:** _(Deployment link coming soon)_

---

## 💡 Overview

**Ava** is a conversational AI wealth advisor embedded as a mobile-first, highly responsive web application. Designed for the modern banking customer, Ava analyzes transaction history, investment portfolios, and financial goals to deliver personalized, real-time guidance. The platform leverages Google's Gemini 3.5 Flash AI to provide human-like, contextual, and actionable financial advice.

### ✨ Key Features

- 🤖 **Avatar-based AI Advisor:** Features a professional, culturally contextual Indian avatar with dynamic voice-modulator waveform animations during speech.
- 🎙️ **Voice In & Voice Out:** Speak naturally to Ava using the browser's native Web Speech API, and receive auditory feedback.
- 📊 **Live Financial Dashboard:** A sleek, premium dashboard displaying net worth, portfolio allocations, tracking against goals, and recent transactions.
- ⚡ **Automated Financial Scenarios:** One-click demonstration triggers for common wealth management use cases:
  - **Overspending Alerts:** Flags abnormal spending spikes and calculates impact on long-term goals.
  - **Portfolio Rebalancing:** Analyzes current asset allocations (Equity, FDs, Gold) and suggests optimizations based on risk appetite.
  - **Goal Nudges:** Recommends optimal SIP top-ups to stay on track for critical milestones.
  - **Loan Affordability:** Performs instantaneous affordability checks for major purchases (e.g., Car Loans) based on income bands and existing EMI obligations.
- 🎨 **Enterprise Brand Aesthetics:** Minimalist, premium UI utilizing IDBI's official brand palette (Teal `#00836C` and Orange `#F58220`).

---

## 🔒 Enterprise-Grade Security

Ava has undergone a rigorous **17-Point Security Audit** to ensure compliance with enterprise and banking standards:
- **Zero Secrets Exposure:** `GEMINI_API_KEY` is strictly managed server-side. No API keys are bundled into the frontend.
- **Robust API Protection:** A custom Next.js Edge Middleware enforces `Authorization: Bearer` token validation across all `/api/*` endpoints.
- **DDoS Mitigation:** An in-memory sliding-window IP Rate Limiter restricts requests (max 20 requests/minute) to prevent Gemini API quota draining and abuse.
- **Hardened HTTP Headers:** Globally enforced CSP, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers.
- **Strict Input Validation:** All JSON payloads are type-checked on the server before processing.
- **Supply Chain Security:** All dependencies are explicitly locked in `package.json` to prevent arbitrary version hijacking.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Core** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling & UI** | Tailwind CSS v4, Framer Motion, Phosphor Icons |
| **AI Intelligence** | Google Gemini 3.5 Flash API |
| **Voice Engine** | Web Speech API (Speech Recognition & Synthesis) |
| **Data Layer** | Synthetic JSON Backend (Prototype phase) |
| **Security** | Next.js Global Middleware |

---

## ⚙️ Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Astroidkiller/IDBI-Innovate-2026---Ava.git
cd IDBI-Innovate-2026---Ava
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory (you can use the provided `.env.example` as a template):
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```
> *Note: You can generate a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).*

### 4. Run the Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ System Architecture

```text
User (Browser / Mobile Device)
      │
      ▼
Next.js Frontend (React 19)
  ├── Stable Avatar Component (with Framer Motion voice waveforms)
  ├── Financial Dashboard (Portfolio, Goals, Transactions)
  └── Chat Interface (Text + Voice Web Speech API)
      │
      ▼
Next.js Edge Middleware (Security Layer)
  ├── Enforces Bearer Token Authentication
  └── Applies IP-based Rate Limiting (20 req/min)
      │
      ▼
Next.js API Routes (Backend Node Environment)
  ├── /api/chat      → Processes free-form user conversations
  └── /api/scenarios → Triggers predefined financial logic analysis
      │
      ▼
Google Gemini 3.5 Flash API
  (Injects user's financial profile into the System Prompt for context-aware responses)
```

---

## 👨‍💻 Contributor
Built and secured by **[@Astroidkiller](https://github.com/Astroidkiller)** for the IDBI Innovate 2026 Hackathon.
