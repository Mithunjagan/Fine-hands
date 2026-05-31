# 💸 Finehands

> *The financial dashboard for developers who earn in Lakhs, dream in Crores, spend like they're funded by Y Combinator, and need an AI to gently suggest they stop buying "ergonomic" mechanical keyboards.*

Finehands is a hyper-intelligent personal finance platform that turns your bank statements into actionable insights. Upload a PDF, let our ML handle the chaos, and get real-time wealth predictions powered by Monte Carlo simulations and an AI advisor that won't judge your Starbucks addiction.

**Features that actually work:**
- 🏦 **Scary Accurate Spending Analysis** — Knows you're a "Subscription Hoarder" better than you do
- 📊 **Monte Carlo Wealth Predictions** — Tells you if you'll be rich or ramen-poor in 10 years (with confidence bands!)
- 💰 **Indian Tax & Passive Income Modeling** — LTCG, marginal slabs, PPF EEE status—all baked in
- 🤖 **The Money Doctor AI** — Stream-powered advisor that won't hallucinate your savings rate
- 🧬 **Spending DNA Archetypes** — Reveals if you're "The Impulse Buyer," "The Disciplined Saver," or worse
- 📱 **Bank Statement OCR** — PDF uploads that don't suck
- 🎮 **Gamification** — Because adulting needs achievement badges

Built with FastAPI, React (Vite), Zustand, and enough Glassmorphism to make your eyes hurt.

---

## ⚡ The Quick Start

### 🐍 Backend (Python 3.10+)
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --reload
```

Backend runs at `http://localhost:8000` | Docs at `http://localhost:8000/docs`

### ⚛️ Frontend (Node 18+)
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 🎯 What's Inside

### Backend (`/backend`)
- **FastAPI** server with SSE streaming for real-time AI responses
- **ML models** for spending classification, anomaly detection, and health scoring
- **Monte Carlo engine** for stochastic wealth simulation
- **LLM integration** via OpenRouter (fallback modes for rate limits)
- **PDF parsing** for bank statements
- **Zustand + Zustand-persist** state management

### Frontend (`/frontend`)
- **React 19** with TypeScript + Vite
- **Zustand** stores for transactions, goals, gamification, UI state
- **Recharts** for beautiful, interactive charts
- **Tailwind CSS** + custom Glassmorphism design
- **Components**: Dashboard, Advisor, Simulator, Anomaly Scanner, Goal Tracker, etc.

### Key Algorithms
- **Health Score**: 7-factor composite with temporal decay (savings rate, emergency fund, bloat index, consistency, diversity, anomaly impact, trend)
- **Anomaly Detection**: Category-aware modified z-score with IQR fallback
- **Spending Persona**: Hybrid k-means + rule-based clustering (6 archetypes)
- **Wealth Simulator**: Stochastic modeling with income volatility, expense inflation, tax modeling

---

## 📋 Project Structure
```
finehands/
├── backend/
│   ├── app.py              # FastAPI entry point
│   ├── requirements.txt    # Python deps
│   ├── ml/                 # ML algorithms
│   │   ├── health_score.py
│   │   ├── anomaly_detector.py
│   │   ├── persona_classifier.py
│   │   └── monte_carlo.py
│   ├── routers/            # API endpoints
│   │   ├── analytics.py
│   │   ├── goals.py
│   │   ├── transactions.py
│   │   └── ...
│   └── services/           # Integrations
│       ├── openrouter.py   # LLM streaming
│       └── cache.py
│
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   ├── pages/          # Full pages
    │   ├── store/          # Zustand stores
    │   ├── types/          # TypeScript types
    │   └── lib/            # API client, data gen
    ├── vite.config.ts
    └── package.json
```

---

## 🚀 API Endpoints (Key Ones)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/analytics/health-score` | POST | Get 7-factor financial health score |
| `/analytics/anomalies` | POST | Detect unusual transactions by category |
| `/analytics/persona` | POST | Classify spending archetype |
| `/ml/monte-carlo` | POST | Run 500-trial stochastic projection |
| `/ai/advisor` | POST | Stream AI financial advice |
| `/transactions/import` | POST | Parse and ingest bank statements |

Full docs at `/docs` after starting backend.

---

## 🎓 Academic Contributions

If you're defending this as a final-year project:
1. **Temporal Trend-Weighted Health Scoring** — Penalizes worsening trajectories, not just static overspending
2. **Category-Aware Anomaly Detection** — Modified z-scores per category (not global), robust to outliers
3. **Hybrid Clustering for Persona Classification** — k-means + rule-based, interpretable with confidence scores
4. **Stochastic Wealth Modeling with Indian Tax Rules** — Full LTCG, marginal slab, inflation-adjusted projections

---

## 🛠️ Tech Stack

**Backend**: FastAPI • uvicorn • pypdf • numpy • httpx • python-dotenv • sse-starlette

**Frontend**: React 19 • TypeScript • Vite • Zustand • Recharts • Tailwind CSS • Lucide Icons

**Design**: Glassmorphism • Dark Mode • Recharts Radar Charts • Custom SVG Animations

---

## 📌 Environment Setup

Create `.env` in `backend/`:
```
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_API_BASE=https://openrouter.ai/api/v1
```

If no API key, the AI advisor returns intelligent mock responses (works offline!).

---

## 🎮 Features in Detail

### Spending DNA
Classifies your transactions into 6 archetypes:
- 🛒 The Subscription Hoarder
- 💳 The Impulse Buyer
- 🏦 The Disciplined Saver
- 🧑‍💼 The High Roller
- 👻 The Ghost (barely spends)
- ⚙️ The Balanced Operator

### Monte Carlo Simulator
Runs 500 stochastic trials modeling:
- Monthly income volatility (±5%)
- Category-wise expense inflation (2-8% annually)
- Probability of hitting financial goals
- P10/P25/P50/P75/P90 confidence bands

### The Money Doctor
AI advisor that:
- Streams real-time responses via SSE
- Validates math against a guardrail checklist
- Falls back to local advice if rate-limited
- Renders Markdown with glassmorphic design

---

## 🤝 Contributing

Found a bug? Spending category misclassified? Passive income calculator off by a Lakh? 
- Open an issue with details
- Fork, fix, submit a PR
- Add tests if you're feeling ethical

---

## 📄 License

MIT License — Use it, abuse it, but give credit.

---

## 👋 Credits

Built by developers, for developers who refuse to use Excel for financial planning.

**Questions?** Check the [docs](./docs/) folder or run the app and poke around.

*Last Updated: May 2026*
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Boot the FastAPI app
python app.py
```
The backend is now live and watching for changes on **[http://127.0.0.1:5005](http://127.0.0.1:5005)**.

### ⚡ 2. Start the Vite Frontend
```bash
cd frontend
# Install packages
npm install

# Run the dev server
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser and enjoy premium financial intelligence!

---

## ⚠️ Disclaimer
*This project is for educational purposes only. The Money Doctor is a mathematical algorithm, not a SEBI-registered financial advisor. Please consult a human holding actual SEBI credentials before investing your life savings in high-yield small-finance banks or digital YouTube channels.*
