# 🏥 US Hospital News — Hospital Performance Analytics Platform

> A full-stack clinical operations intelligence platform that benchmarks hospital performance metrics, runs what-if simulations, and surfaces insights through an AI-powered operations assistant.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Scoring Engine](#scoring-engine)
- [AI Operations Chatbot](#ai-operations-chatbot)
- [API Reference](#api-reference)
- [Security & Confidentiality](#security--confidentiality)
- [Tech Stack](#tech-stack)

---

## Overview

**US Hospital News** is a hospital quality analytics dashboard for administrative staff and clinical operations teams. It provides:

- **Live performance benchmarking** against peer group hospitals across 8 clinical metrics
- **What-if simulation workspace** — adjust staffing, consult rates, or transparency scores and watch composite rankings shift in real time
- **Before vs. after score comparison** — all 4 category scores and the overall composite update with clear delta indicators when a simulation is active
- **AI Operations Assistant** — a sandboxed Gemini-powered chatbot grounded entirely in your facility's operational data

---

## Features

| Feature | Description |
|---|---|
| 📊 **KPI Score Cards** | 4 category cards (Outcome, Structure, Process, Patient Exp) + Overall composite |
| 🔬 **Simulation Workspace** | Adjust any red-flagged metric inline; see cascading score changes immediately |
| 📈 **Before/After Diffs** | Struck-through baseline scores, delta badges, and ghost progress bar markers |
| 🤖 **AI Chatbot** | Gemini 2.5 Flash powered assistant for staffing gap analysis and score projections |
| 🛡️ **Prompt Injection Guard** | Multi-layer safety: injection patterns, PHI/PII blocks, system prompt sandboxing |
| 🏨 **Affiliate Network View** | Side-by-side comparison of Metropolitan Health System branch facilities |
| ⚖️ **Inverse SMR ↔ Discharge** | Staffing improvements drive down mortality, raising discharge home rates |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           React Frontend  (Port 3000)        │
│  App.tsx → MetricCards / MetricTable / Chat  │
└──────────────────┬──────────────────────────┘
                   │  Vite proxy → /api/*
                   ▼
┌─────────────────────────────────────────────┐
│           Flask Backend  (Port 5000)         │
│  server.py                                   │
│  ├── POST /api/chat     → Chatbot endpoint   │
│  ├── GET  /api/simulate → Baseline scores    │
│  ├── POST /api/simulate → Delta simulation   │
│  └── GET  /api/health   → Liveness check     │
└──────┬───────────────────┬───────────────────┘
       │                   │
       ▼                   ▼
 middleware.py          engine.py
 (Gemini LLM +         (Linear Min-Max
  Injection Guard)      Scoring Engine)
       │
       ▼
  mock_data.py / ml_models.py
  (Hospital & Peer Group Data)
```

---

## Project Structure

```
us_news/
├── src/
│   ├── App.tsx                    # Main application shell & state management
│   ├── data.ts                    # Metric definitions, category weights, departments
│   ├── types.ts                   # TypeScript interfaces
│   ├── utils.ts                   # Scoring and formatting helpers
│   └── components/
│       ├── MetricCards.tsx        # 5 KPI score cards with baseline/simulated diffs
│       ├── MetricTable.tsx        # Simulation workspace + heat-mapped metric ledger
│       ├── ChatWidget.tsx         # Floating AI Operations Assistant widget
│       ├── Sidebar.tsx            # Fixed navigation sidebar
│       └── TopBar.tsx             # Department/peer group selectors & header
│
├── engine.py                      # Linear Min-Max normalization & delta simulation engine
├── middleware.py                  # Gemini LLM integration + security middleware
├── ml_models.py                   # Scikit-learn Random Forest & Linear regression suite
├── mock_data.py                   # Hospital & peer group data store
├── server.py                      # Flask API server (port 5000)
├── test_engine.py                 # Unit tests for the scoring engine
├── test_server.py                 # Unit tests for the API endpoints
├── vite.config.ts                 # Vite config with /api proxy to Flask
├── .env.example                   # Environment variable template
└── README.md                      # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.9+
- A **Google Gemini API key** from [AI Studio](https://aistudio.google.com)

### Installation

**1. Install frontend dependencies:**
```bash
npm install
```

**2. Install Python backend dependencies:**
```bash
pip install flask flask-cors google-genai scikit-learn numpy python-dotenv
```

**3. Set up environment variables:**
```bash
copy .env.example .env
```

Edit `.env` and add your key:
```
GEMINI_API_KEY="your-api-key-here"
```

### Running the App

Open **two terminals**:

**Terminal 1 — Frontend (React/Vite):**
```bash
npm run dev
# → http://localhost:3000
```

**Terminal 2 — Backend (Flask):**
```bash
python server.py
# → http://localhost:5000
```

---

## Configuration

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes (for AI chat) | Google Gemini API key from AI Studio |
| `APP_URL` | No | Deployment URL for self-referential links |

> If `GEMINI_API_KEY` is absent, the chatbot automatically falls back to a deterministic analytical engine.

---

## Scoring Engine

`engine.py` implements **transparent Linear Min-Max Normalization**:

**Higher-is-better:**
```
score = ((value − min) / (max − min)) × 100
```

**Lower-is-better** (SMR, staffing ratio):
```
score = ((max − value) / (max − min)) × 100
```

All scores are clamped to [0, 100].

### Metric Reference

| Metric | Min | Max | Direction | Category | Weight in Category |
|---|---|---|---|---|---|
| Patient Volume | 500 | 3,000 | ↑ Higher | Structure | 20% |
| Calculated SMR | 0.5 | 1.5 | ↓ Lower | Outcome | 60% |
| Discharge Home Rate | 50% | 95% | ↑ Higher | Outcome | 40% |
| Nurse Staffing Ratio | 2.0 | 10.0 | ↓ Lower | Structure | 50% |
| Intensivists Staffing | 0% | 100% | ↑ Higher | Structure | 30% |
| Expert Consults | 50% | 100% | ↑ Higher | Process | 50% |
| Public Transparency | 0% | 100% | ↑ Higher | Process | 50% |
| HCAHPS Score | 60% | 100% | ↑ Higher | Patient Exp | 100% |

### Category Composite Weights

| Category | Weight |
|---|---|
| Outcome (Mortality & Discharge) | 30% |
| Structure (Staffing & Capacity) | 25% |
| Process (Consults & Transparency) | 25% |
| Patient Experience (HCAHPS) | 20% |

### Hybrid Delta Simulation

Rather than predicting absolute outcomes, the engine calculates **relative deltas** from the baseline:

1. Staffing ratio change → SMR delta (capped at ±0.15)
2. SMR improvement → discharge home rate increases (scale factor: ×12.5)
3. All other metrics → direct linear normalization

---

## AI Operations Chatbot

Click the **Bot icon** (bottom-right corner of the dashboard) to open the Operations Assistant.

### Quick-Click Chips

- 📊 **Analyze staffing gap** — compares your ratio to the peer group 75th percentile
- 🔄 **Project process update** — simulates the impact of increasing expert consult rate
- ⚠️ **Simulate staffing drop** — models a nurse shortage scenario

### Example Free-Form Questions

```
"How does our nurse staffing ratio compare to the peer group?"
"If we increase expert consults from 80% to 95%, what's the score impact?"
"Simulate a staffing degradation from 6.5 to 7.5 patients per nurse"
"What operational changes would most improve our composite score?"
```

---

## API Reference

### `GET /api/health`
```json
{ "status": "ok" }
```

---

### `POST /api/chat`

**Request:**
```json
{
  "message": "How does our staffing ratio compare to the peer group?",
  "hospital_id": "HOSP_A"
}
```

**Response:**
```json
{ "response": "**Nurse Staffing Gap Analysis**\n\nYour current staffing ratio is 6.5..." }
```

---

### `GET /api/simulate`

Returns baseline scores with no overrides.

**Response:**
```json
{
  "baseline": {
    "overall_composite": 72.4,
    "category_cards": {
      "Clinical_Outcomes": 68.1,
      "Operational_Structure": 74.5,
      "Care_Processes": 80.2,
      "Patient_Experience": 67.3
    },
    "individual_percentages": {},
    "raw_metrics": {}
  },
  "simulated": {},
  "is_simulated": false
}
```

---

### `POST /api/simulate`

**Request:**
```json
{ "nurse_staffing_ratio": 4.5, "expert_consults": 92.0 }
```

**Response:**
```json
{
  "baseline": { "overall_composite": 72.4 },
  "simulated": { "overall_composite": 79.1 },
  "is_simulated": true
}
```

---

## Security & Confidentiality

The chatbot uses a **3-layer confidentiality architecture**:

### Layer 1 — Prompt Injection & PHI/PII Guard

Blocks any input containing:
- Jailbreak keywords (`ignore previous`, `dan mode`, `bypass`, `jailbreak`)
- PHI/PII terms (`patient name`, `medical record`, `SSN`, `salary`)
- Competitor data requests (`competitor hospital`, `other hospitals`)
- System prompt leak attempts (`reveal your prompt`, `show instructions`)

→ Returns the sandboxed fallback message immediately.

### Layer 2 — Grounded System Prompt

The Gemini API call is bound to only the provided facility metrics and peer benchmarks. The model is explicitly forbidden from:
- Giving medical or clinical advice
- Naming competitor hospitals
- Revealing PHI/PII
- Disclosing its own instructions

### Layer 3 — Flask Exception Sandboxing

All exceptions in `/api/chat` are caught. The client always receives:

> *"I cannot answer that question. My access is strictly sandboxed to our facility's metrics and aggregated peer benchmarks."*

No raw system errors are ever returned.

---

## Running Tests

```bash
# Scoring engine unit tests
python test_engine.py

# API endpoint unit tests
python test_server.py
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite 6 | Build tool & dev server |
| Tailwind CSS 4 | Styling |
| Lucide React | Icon library |
| Motion | Micro-animations |

### Backend
| Technology | Purpose |
|---|---|
| Flask + Flask-CORS | REST API server |
| Google GenAI SDK | Gemini 2.5 Flash LLM |
| Scikit-learn | Random Forest & Linear Regression |
| NumPy | Numerical computation |
| python-dotenv | Environment variable loading |

---

## License

Apache-2.0 — see individual source file headers for license notices.