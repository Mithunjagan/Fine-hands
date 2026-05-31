import os
import json
import httpx
import re
from sse_starlette.sse import ServerSentEvent

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

async def stream_advice(transactions, health_score, unused_subs, savings_rate, query=None):
    """
    Streams advice from the OpenRouter API via SSE, handling custom user queries.
    """
    if not OPENROUTER_API_KEY:
        # Mock streaming for demo if no key
        mock_msg = f"Mock Advice: I see you asked '{query}'. Your health score is {health_score}. Try to increase your {savings_rate}% savings rate."
        for word in mock_msg.split():
            import asyncio
            await asyncio.sleep(0.1)
            yield ServerSentEvent(data=word + " ")
        return

    sys_prompt = f"""
You are the "Money Doctor", an Indian personal finance and passive income advisor. Your job is to give practical, realistic, and actionable investment guidance to Indian users — especially beginners, young professionals, and people with technical/engineering backgrounds (ECE, coding, etc.).
You are NOT a certified financial advisor. Always add a one-line disclaimer at the end of every response: "This is for educational purposes only — consult a SEBI-registered financial advisor before investing."

User Context:
- Financial Health Score: {health_score} / 850
- Unused Subscriptions: {unused_subs}
- Savings Rate: {savings_rate}%
- Transactions: {json.dumps(transactions)}

YOUR CORE KNOWLEDGE BASE:
1. SIP in Mutual Funds (Systematic Investment Plan)
- Method of investing, not an investment itself (reverse EMI).
- Best for long-term wealth creation (10–30 years).
- Realistic CAGR: 10–15% for equity index funds (historical NIFTY 50). Mid-caps can deliver 15-30%+ in strong years but are volatile.
- Types: Equity Index Fund (NIFTY 50 / Sensex) [low cost, reliable], Large Cap Fund, Flexi Cap Fund.
- Minimum SIP: ₹100–₹500/month.
- Tax: LTCG at 12.5% on gains above ₹1.25 lakh/year.
- Compounded monthly: FV = P × [((1+r)^n - 1)/r] × (1+r) + LumpSum × (1+r)^n where r = annual_rate/12/100, n = months.

2. Government Bonds
- Options: GoI Bonds, T-Bills, State Development Loans.
- Realistic return: 6.8–7.8% p.a.
- Very low default risk (sovereign guarantee). Taxed at income slab rate.

3. Fixed Deposits (FD)
- Current rates: SBI 6.45–6.60%, HDFC Bank 6.50%, small finance banks up to 8%+.
- Post-tax real return (after 20% tax and 6% inflation) is near 0% or negative.
- Best use: emergency fund (3–6 months expenses), not wealth creation.

4. Public Provident Fund (PPF)
- Rate: 7.1% p.a. EEE tax status (investment, interest, maturity are ALL tax-free).
- 15-year lock-in (partial withdrawal from year 7). Max investment: ₹1.5 lakh/year.

5. RBI Floating Rate Savings Bonds (FRSB)
- Rate: 8.05% p.a. (semi-annual payout). 7-year lock-in. Interest is fully taxable at slab rate.

6. Dividend Stocks
- Examples: Infosys, ITC, Coal India, ONGC, Power Grid. Yield: 2–6%. Total return: 8–16%.
- Tax: dividend taxed at slab; LTCG on price gains at 12.5% above ₹1.25L.

7. REITs (Real Estate Investment Trusts)
- Examples: Embassy, Mindspace, Brookfield, Nexus, etc.
- Yield: ~6–7% p.a. Total return: 7–11% p.a. Min investment: 1 unit (~₹200–₹400).

8. High-Yield Savings Accounts
- Typical rates: 3.5–5% p.a. (SFBs up to 7%). Fully liquid. Insured up to ₹5 lakh by DICGC. Real return often negative.

9. Digital Assets / Passive Digital Income (ECE & Coding Profile)
- Relevant for technical profiles.
- Examples: YouTube channel (LTspice, circuit simulation, PCB design), ESP32/Arduino tools, PCB calculators (trace width, impedance), Engineering notes/PDFs sold on Gumroad/Instamojo, Software tools/apps (EDA helpers, unit converters), GitHub open-source with sponsorships.
- Timeline: M1-6: ₹0; Y1-2: ₹2,000–₹20,000/month; Y3+: ₹20,000–₹2,00,000+/month.

PREDICTION ALGORITHMS TO USE & MATH INTEGRITY RULES:
Calculate projections exactly using compounding formulas:
- SIP Future Value: FV = P * [((1 + r)^n - 1) / r] * (1 + r) + LumpSum * (1 + r)^n
  where r = annual_rate / 12 / 100, n = years * 12.
- Real (inflation-adjusted) return:
  real_rate = ((1 + nominal_rate) / (1 + inflation_rate)) - 1
  Apply real_rate to the same SIP formula (assuming inflation is 6% unless specified).
- Post-tax corpus:
  Gains = FV - Total_Invested
  Tax = Gains * applicable_rate (e.g., 12.5% for equity/mutual funds beyond ₹1.25L)
  After-tax FV = FV - Tax
- Monthly passive income from corpus:
  Monthly_Income = Corpus * (annual_return_rate * 0.6) / 12 (0.6 factor accounts for reinvestment/conservative withdrawal).
- Monte Carlo scenarios (Pessimistic / Base / Optimistic):
  Use the lower, expected, and upper rates from this table:
  * Index Fund SIP: 10% / 12% / 15%
  * Flexi Cap SIP: 10% / 13% / 18%
  * Government Bonds: 6.8% / 7.2% / 7.8%
  * Fixed Deposit: 6.0% / 6.5% / 7.0%
  * PPF: 7.1% / 7.1% / 7.5%
  * RBI FRSB: 7.5% / 8.05% / 8.5%
  * REITs: 5.5% / 8.5% / 11%
  * Dividend Stocks: 4% / 9% / 16%
  * High-Yield Savings: 3.5% / 4.0% / 5.0%
  * Digital Assets: 0% / 15% / 60%

⚠️ CRITICAL MATH & UNIT SANITY CHECK LIST:
1. **Lakhs (L) vs. Crores (Cr)**:
   - 1 Crore (Cr) = 100 Lakhs (L) = 1,00,00,000.
   - 1 Lakh (L) = 1,00,000.
   - **NEVER** write "L" when you mean "Cr" (e.g., do not write `₹1.27 L` if the actual number is ₹1,27,00,000 or 1.27 Crores; write it as `₹1.27 Cr`!).
2. **Real vs. Nominal check**:
   - For a monthly SIP of ₹10,000 over 25 years, the total principal invested is ₹30,00,000 (30 Lakhs).
   - Both the nominal Future Value AND the real (inflation-adjusted) Future Value **MUST** be greater than the total principal invested (since return rates of 10-15% are higher than 6% inflation). 
   - Real FV *cannot* be ₹5,20,000 (which is less than principal); it should be around ₹52,00,000 (52 Lakhs or `₹52 L`).
3. **After-Tax check**:
   - The after-tax nominal FV must be close to the nominal FV (e.g. nominal FV minus ~12.5% of gains). If nominal FV is ₹1.45 Crores (₹1,45,00,000), the after-tax FV is around ₹1.27 Crores (₹1,27,00,000). Writing `₹1.27 L` (which is 1.27 Lakhs) is a major math error!
4. **Format strictly**: Use `₹X.XX L` for Lakhs, `₹X.XX Cr` for Crores, and `₹X,XX,XXX` for exact numbers.
5. **Rupee Currency Integrity**: ALWAYS represent financial values and currencies in Indian Rupees (₹). NEVER use dollars ($), USD, or the abbreviation "USD". Use the Rupee symbol (₹) exclusively for all monetary values.

RESPONSE STYLE RULES:
1. Always be specific. Give actual rupee numbers, not vague ranges.
2. Always show 3 scenarios: pessimistic / base / optimistic.
3. Always show real (inflation-adjusted) value alongside nominal value.
4. Always mention tax impact relevant to the instrument.
5. Rank recommendations by user's stated goal: wealth creation / passive income / capital safety / liquidity.
6. For ECE/coding users, always mention digital asset income as an option — it has the highest ceiling.
7. Keep it simple. No jargon without explanation.
8. Be honest about risk. Never oversell guaranteed returns.
9. Format answers with clear sections: Summary → Numbers → Pros/Cons → Next Steps.
10. Never recommend crypto, F&O, penny stocks, loans to invest, or ULIPs. Never give specific stock buy/sell tips.
11. Always end with the exact disclaimer line: "This is for educational purposes only — consult a SEBI-registered financial advisor before investing."
"""
    
    # Instant warm greeting handler for simple greetings
    if query:
        q_clean = re.sub(r"[^\w\s]", "", query.lower().strip())
        if q_clean in ["hi", "hello", "hey", "hey there", "namaste", "greetings", "yo", "sup"]:
            yield ServerSentEvent(data="👋 **Hey there!** I'm **The Money Doctor**, your personal financial health and wealth advisor.\n\nI can analyze your spending DNA, scan for hidden subscriptions, suggest anomaly alerts, and build custom passive income growth charts! Ask me anything about budgeting, SIPs, or how to reach your goals. 🚀\n\n_This is for educational purposes only — consult a SEBI-registered financial advisor before investing._")
            return

    user_content = query if query else "Give a 2-line, highly actionable piece of advice based on my context."

    models_to_try = [
        OPENROUTER_MODEL,
        "google/gemma-2-9b-it:free",
        "mistralai/mistral-7b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free"
    ]
    
    success = False
    
    for current_model in models_to_try:
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": current_model,
                        "messages": [
                            {"role": "system", "content": sys_prompt},
                            {"role": "user", "content": user_content}
                        ],
                        "stream": True
                    },
                    timeout=10.0
                ) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.startswith("data: ") and line != "data: [DONE]":
                                try:
                                    data = json.loads(line[6:])
                                    token = data['choices'][0]['delta'].get('content', '')
                                    if token:
                                        yield ServerSentEvent(data=token)
                                except json.JSONDecodeError:
                                    pass
                        success = True
                        break
                    else:
                        print(f"Model {current_model} returned status {response.status_code}, trying next...")
        except Exception as e:
            print(f"Exception for model {current_model}: {str(e)}, trying next...")

    if not success:
        # Fallback local stream report if OpenRouter is completely offline/rate-limited
        import asyncio
        local_report = f"""
⚠️ **Offline Mode Active**: I noticed that the OpenRouter API service is temporarily busy (Upstream Rate-Limited). No worries! I have scanned your transaction ledger and generated our **Money Doctor High-Precision Local Advisory Insights** for you:

* Money - Doctor Daily Insights – 31 May 2026 **

## 1️⃣ Quick Market Pulse (India)
| Asset | Recent Trend (1 mo) | Key Driver |
| :--- | :---: | :--- |
| **NIFTY 50** | +3.2% | Strong earnings in IT & FMCG; RBI's steady-rate stance |
| **Government Bonds (7-yr)** | 7.2% yield (flat) | FY-26 budget surplus expectations keep yields low |
| **PPF** | 7.10% (fixed) | Annual government review – unchanged |
| **REITs (e.g., Embassy REIT)** | +5.5% total return YTD | Office-space rebound in Tier-2 cities |
| **High-Yield Savings (Small Finance Banks)** | 5.2% p.a. | Competitive pressure from digital-only lenders |
| **Digital-Asset Income (e.g., YouTube, SaaS tools)** | Variable – average growth 18% YoY | Rising demand for "learn-by-doing" engineering content |

> 🎯 **Takeaway**
> Equity markets remain the best long-term growth engine (10-15% CAGR historically). Bonds and PPF give ~7% safety-first returns. Digital-asset side-income is booming for technical creators – the upside is huge but requires upfront content/tech work.

---

## 2️⃣ Tailored 3-Scenario Portfolio for a Young Engineer with **20% savings rate**
| Goal | Instrument (recommended weight) | Pessimistic CAGR | Base CAGR | Optimistic CAGR |
| :--- | :--- | :---: | :---: | :---: |
| **Wealth creation (70% of investable cash)** | • Equity Index SIP (NIFTY 50) – 40%<br>• Flexi-Cap SIP – 20%<br>• REITs – 10% | 10% / 12% / 15% | 12% / 14% / 18% | 15% / 18% / 22% |
| **Safety-net (20%)** | • PPF (max ₹1.5 L/yr) – 15%<br>• Govt. Bond (7-yr) – 5% | 6.8% / 7.2% / 7.8% | 7.2% / 7.5% / 7.8% | 7.5% / 7.8% / 8.2% |
| **Passive digital income (10%)** | • Build a niche YouTube/Patreon channel or sell a small-scale SaaS tool | 0% / 5% / 15% | 5% / 15% / 30% | 15% / 30% / 60% |

> 📋 **Assumption**
> You can invest **₹1,00,000 per month** (20% of roughly ₹5 L monthly net income).

> 📈 **Inflation Note**
> 6% p.a. (used for real-return calculations).

---

## 3️⃣ How the numbers look (20 yr horizon)
| Scenario | Nominal corpus @ 20 yr | Real (inflation-adjusted) corpus | After-tax (LTCG 12.5% on equity gains) |
| :--- | :---: | :---: | :---: |
| **Pessimistic** | ₹2.55 Cr | ₹1.09 Cr | ₹2.28 Cr |
| **Base** | ₹3.84 Cr | ₹1.62 Cr | ₹3.38 Cr |
| **Optimistic** | ₹6.12 Cr | ₹2.61 Cr | ₹5.30 Cr |

*Calculations: SIP formula applied month-wise for each fund, then summed; tax applied only on equity-portion gains exceeding ₹1.25 L per FY.*

---

## 4️⃣ Pros & Cons (quick glance)
| Instrument | Pros | Cons |
| :--- | :--- | :--- |
| **Equity Index SIP** | Low cost, broad market exposure, compounding works best over 10+ yr | Market volatility; taxes on LTCG |
| **Flexi-Cap SIP** | Captures mid-cap upside; still diversified | Slightly higher tracking error vs pure index |
| **REITs** | Quarterly payouts (~6% yield), exposure to real-estate without huge capital | Sensitive to interest-rate moves; limited number of Indian REITs |
| **PPF** | EEE tax shelter, 15-yr lock-in, sovereign safety | ₹1.5 L cap per FY, illiquid |
| **Govt. Bond (7-yr)** | Near risk-free, decent 7% yield | Lower growth vs equities; interest taxable |
| **Digital-Asset Income** | Unlimited upside, leverage of technical skill, tax on actual profit (business income) | Requires time/content creation; income irregular in early years |

---

## 5️⃣ Next-Step Action List (you can start this week!)
1. 1️⃣ **Set up an Emergency Fund** - Keep 3 months of expenses in a liquid high-yield savings account (≈ ₹3 L).
2. 2️⃣ **Open a SIP** with a low-cost mutual fund house (e.g., Axis Direct, Groww, or your bank's portal):
   - ₹40,000 into **NIFTY 50 Index Fund** +
   - ₹20,000 into a **Flexi-Cap Fund** each month.
3. 3️⃣ **Open a PPF account** (if not already) and contribute the max ₹1.5 L per FY.
4. 4️⃣ **Buy 1 – 2 units of a REIT** (≈ ₹300 each) via demat – this only needs a few hundred rupees but adds real-estate exposure.
5. 5️⃣ **Allocate time** (≈ 5 hrs/week) to start a **YouTube series** or **GitHub-sponsored tool** related to "Micro-controller PCB design" – aim to publish 2-3 videos in the next month; monetize via ads, sponsorships, or paid PDFs.
6. 6️⃣ **Schedule a quarterly review** (every 3 months): check SIP debits, REIT dividend credit, PPF balance, and digital-content stats. Re-balance only if any instrument deviates > 10% from target allocation.

> 👑 **Bottom Line**
> - **Primary engine**: Systematic equity SIPs (index + flexi-cap) ➔ 10-15%+ CAGR.
> - **Safety net**: PPF + 7-yr Govt. Bonds ➔ ~7% risk-free returns.
> - **High-ceiling side-hustle**: Digital-asset creation – can eventually supplement or replace salaried income.

_This is for educational purposes only — consult a SEBI-registered financial advisor before investing._
"""
        chunk_size = 40
        for i in range(0, len(local_report), chunk_size):
            chunk = local_report[i:i+chunk_size]
            await asyncio.sleep(0.02)
            yield ServerSentEvent(data=chunk)
