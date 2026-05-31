# 💸 Finehands

> The ultimate financial intelligence dashboard for Indian developers who earn in Lakhs, dream in Crores, spend like they're VC-backed, and need an AI to politely tell them to stop buying mechanical keyboards.

Finehands is a multi-dimensional personal finance, wealth compounding, and passive income analytics platform built with **FastAPI** and **React (Vite)**. It aggregates raw bank statement data (PDF/CSV/JSON), parses your spending DNA using machine learning archetypes, runs 500-trial Box-Muller Monte Carlo simulations, and connects you to **The Money Doctor**—a highly intelligent (and mathematically strictly checked) AI financial advisor.

---

## 🚀 The Feature Show (Or: Why Excel is sweating)

### 📈 1. India Passive Income & Investment Predictor
Ever wondered how long it takes to retire on passive digital assets? Slide the controls to model compounding annuities in real-time.
* **Marginal Slab & LTCG Taxation**: Fully models Indian tax rules ( slab rates, EEE tax status for PPF, and the standard 12.5% LTCG on Equity Mutual Fund gains above ₹1.25L).
* **Real vs. Nominal Curves**: Graphing purchasing power erosion under 6% average inflation, so you know *exactly* what your money is worth in 2046.
* **Box-Muller Monte Carlo Engine**: Runs 500 stochastic trials per asset in Python to render P10 (Bearish), P50 (Expected), and P90 (Bullish) probability bands. No more "static returns" illusions.

### 🧠 2. Spending DNA / Archetype Vectors
We run your transaction ledger through a hybrid K-Means + rule-based classification algorithm to output your spending vector across 6 dimensions.
* Discover your true self: Are you **"The Subscription Hoarder"** (actively paying for 8 streaming services + a gym you visited once in 2024), **"The Impulse Buyer"** (emotional retail therapy spikes), or **"The Disciplined Saver"**?
* Features a gorgeous, custom-centered **Recharts Radar Chart** with explicit wrapper bounds that guarantees category labels like `Utilities` or `Entertainment` never crop!

### 🤖 3. The Money Doctor AI Advisor
A direct stream connection to a personal financial advisor powered by OpenRouter LLMs.
* **Math Integrity Guardrails**: Hardcoded with a ⚠️ **Critical Math & Unit Sanity Checklist** so the model *never* hallucinations Lakhs (L) as Crores (Cr) or tells you that your inflation-adjusted future value is somehow less than the principal you invested.
* **Upstream Rate-Limit Resilience**: Venice (the free provider) feeling rate-limited? No problem! The advisor automatically cycles through fallback models (`gemma-2-9b`, `mistral-7b`, `qwen-2.5-72b`) before falling back to a beautiful **offline-first local advice generator** so you never see a raw network error.
* **Pristine Markdown Render Engine**: Built from scratch to render beautiful **glassmorphic HTML tables**, dynamic numbered emoji lists, and glowing colored callout cards (🎯 Takeaways, 📋 Assumptions, 📈 Inflation notes, and 👑 Bottom Lines).

### 📂 4. AI-Powered Bank Statement Importer
Because typing transactions by hand is a form of cognitive torture.
* **Multi-Format Ingestion**: Upload bank statement PDFs, CSVs, or JSONs.
* **Backend PDF Parsing**: Integrates `pypdf` on the FastAPI backend to parse raw text directly, bypassing client-side password blockers.
* **Zero-Temp Schema Mapper**: The AI maps raw descriptions (e.g. `UPI-BHIM-STARBUCKS-120302-MUM`) into clean merchant entities (`Starbucks`), categories (`food`), and tags subscriptions.
* **Interactive Editable Grid**: Review the AI's work, rename merchants, adjust dropdown categories, and toggle subscription status inline before committing the transaction batch.

---

## 🛠️ Stack & Aesthetic

* **Backend**: FastAPI, `pypdf`, `httpx`, `numpy`, `python-dotenv`, `sse-starlette`
* **Frontend**: React (Vite), TypeScript, Zustand, Recharts, Lucide Icons, Tailwind CSS
* **Design Philosophy**: Deep Space Glassmorphism. Features absolute-positioned ambient glowing aurora background orbs, radial body mesh gradients (`#0d1326` to `#070B14`), and a custom geometric SVG logo mark representing Bezier growth vectors.

---

## 🏃 Quick Start (How to boot it up)

### 🐍 1. Start the FastAPI Backend
```bash
cd backend
# Make sure your virtual environment is active
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
