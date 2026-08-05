# 🏥 US Hospital News — Hospital Performance Analytics Platform

A hospital performance analytics dashboard with benchmarking, what-if simulation, and AI-assisted operational insight.

---

## Overview

US Hospital News helps clinical operations and quality teams:

- benchmark hospital performance against peer hospitals
- simulate metric changes and see category score deltas immediately
- compare baseline and simulated values side-by-side
- review peer benchmarking in a dedicated compare view
- query an AI operations assistant for facility-focused insights

---

## Key Features

- KPI score cards for Outcome, Structure, Process, Patient Experience, and Overall Quality
- Simulation workspace with baseline vs simulated values, delta badges, and ghost baseline markers
- Peer benchmarking and multiple hospital comparison view
- Compact score key tooltip for score bands
- Reset simulation button to restore baseline values
- AI chatbot integration through a sandboxed backend

---

## Project Structure

```
us_news/
├── src/
│   ├── App.tsx
│   ├── data.ts
│   ├── types.ts
│   ├── utils.ts
│   └── components/
│       ├── CompareView.tsx
│       ├── ChatWidget.tsx
│       ├── MetricCards.tsx
│       ├── MetricTable.tsx
│       ├── Sidebar.tsx
│       └── TopBar.tsx
├── engine.py
├── middleware.py
├── ml_models.py
├── mock_data.py
├── server.py
├── test_engine.py
├── test_server.py
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── .gitignore
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- A Gemini API key for AI chatbot support

### Install Dependencies

```bash
npm install
```

```bash
pip install flask flask-cors google-genai scikit-learn numpy python-dotenv
```

### Environment Setup

```bash
copy .env.example .env
```

Then add your Gemini key to `.env`:

```ini
GEMINI_API_KEY="your-api-key-here"
```

### Run the App

Start the frontend:

```bash
npm run dev
```

Start the backend:

```bash
python server.py
```

Open `http://localhost:3000`.

---

## Testing

```bash
python test_engine.py
python test_server.py
```

---

## Notes

- The React frontend is built with Vite and TypeScript.
- `App.tsx` manages simulation state and drives the dashboard view.
- `MetricCards.tsx` renders score cards with baseline and simulated deltas.
- `MetricTable.tsx` contains the adjustable simulation ledger.
- `CompareView.tsx` supports peer benchmarking and comparison charts.
- `middleware.py` contains LLM request safety logic.
- `engine.py` contains scoring and normalization logic.

---

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Flask
- Google GenAI SDK
- Scikit-learn
- NumPy
- python-dotenv

---

## License

Apache-2.0
