import React, { useState, useEffect, useMemo } from 'react';
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useUserStore } from '../store/userStore';
import { useTransactionStore } from '../store/transactionStore';
import { Sliders, Wallet, CircleCheck, Coins, ShieldAlert, Award, Calculator, Info } from 'lucide-react';

// Indian Investment Instruments Data Schema
interface InvestmentInstrument {
  id: string;
  name: string;
  minReturn: number;
  baseReturn: number;
  maxReturn: number;
  risk: 'Low' | 'Medium' | 'High';
  lockIn: string;
  taxRule: string;
  details: string;
  color: string;
}

const INSTRUMENTS: InvestmentInstrument[] = [
  {
    id: 'sip',
    name: 'SIP – Equity Index Fund',
    minReturn: 10,
    baseReturn: 12,
    maxReturn: 15,
    risk: 'High',
    lockIn: 'None',
    taxRule: 'LTCG 12.5% above ₹1.25L',
    details: 'Tracks NIFTY 50 / BSE Sensex. Best long-term wealth creator in India historically.',
    color: '#1D9E75'
  },
  {
    id: 'flexicap',
    name: 'SIP – Flexi Cap Fund',
    minReturn: 10,
    baseReturn: 13,
    maxReturn: 18,
    risk: 'High',
    lockIn: 'None',
    taxRule: 'LTCG 12.5%',
    details: 'Active fund manager picks across market caps. Higher potential, higher variability.',
    color: '#38bdf8'
  },
  {
    id: 'govbond',
    name: 'Government Bonds',
    minReturn: 6.8,
    baseReturn: 7.2,
    maxReturn: 7.8,
    risk: 'Low',
    lockIn: '5yr',
    taxRule: 'Slab rate',
    details: 'GOI bonds & T-Bills. Near-zero default risk. Good for conservative capital.',
    color: '#fb7185'
  },
  {
    id: 'fd',
    name: 'Fixed Deposit',
    minReturn: 6.0,
    baseReturn: 6.5,
    maxReturn: 7.0,
    risk: 'Low',
    lockIn: '1yr',
    taxRule: 'Slab rate',
    details: 'SBI/HDFC FD. Guaranteed but post-tax real return may be near 0% after inflation.',
    color: '#a1a1aa'
  },
  {
    id: 'ppf',
    name: 'PPF',
    minReturn: 7.1,
    baseReturn: 7.1,
    maxReturn: 7.5,
    risk: 'Low',
    lockIn: '15yr',
    taxRule: 'EEE – fully tax-free',
    details: 'EEE tax-exempt. Best guaranteed tax-free long-term option. 15-yr lock-in.',
    color: '#f59e0b'
  },
  {
    id: 'rbi',
    name: 'RBI Floating Rate Bond',
    minReturn: 7.5,
    baseReturn: 8.05,
    maxReturn: 8.5,
    risk: 'Low',
    lockIn: '7yr',
    taxRule: 'Slab rate',
    details: 'Rate = NSC + 0.35%. Adjusted every 6 months. Available via RBI Retail Direct.',
    color: '#c084fc'
  },
  {
    id: 'reit',
    name: 'REITs',
    minReturn: 5.5,
    baseReturn: 8.5,
    maxReturn: 11,
    risk: 'Medium',
    lockIn: 'None',
    taxRule: 'Dividend partially taxable',
    details: 'Embassy / Mindspace / Nexus. 6–7% dividend yield + capital appreciation.',
    color: '#22c55e'
  },
  {
    id: 'divstock',
    name: 'Dividend Stocks',
    minReturn: 4,
    baseReturn: 9,
    maxReturn: 16,
    risk: 'High',
    lockIn: 'None',
    taxRule: 'Dividend + LTCG taxable',
    details: 'Infosys, ITC, Coal India type. Passive dividend + price growth but volatile.',
    color: '#ec4899'
  },
  {
    id: 'hisa',
    name: 'High-Yield Savings Account',
    minReturn: 3.5,
    baseReturn: 4.0,
    maxReturn: 5.0,
    risk: 'Low',
    lockIn: 'None',
    taxRule: 'Slab rate',
    details: 'Emergency fund only. Real return after tax and inflation is often negative.',
    color: '#64748b'
  },
  {
    id: 'digital',
    name: 'Digital Assets (ECE/Coding)',
    minReturn: 0,
    baseReturn: 15,
    maxReturn: 60,
    risk: 'High',
    lockIn: 'None',
    taxRule: 'Business income',
    details: 'For ECE/coding background: LTspice tutorials, ESP32 tools, PCB calculators, engineering apps. One good tool = years of passive income.',
    color: '#f43f5e'
  }
];

export const PassiveIncomePredictor: React.FC = () => {
  const { profile } = useUserStore();
  const { transactions } = useTransactionStore();

  // --- Real Data Processing & Hooks ---
  const [sip, setSip] = useState(5000);
  const [lumpSum, setLumpSum] = useState(0);
  const [horizon, setHorizon] = useState(10);
  const [taxBracket, setTaxBracket] = useState(30);
  const [inflation, setInflation] = useState(6.0);
  const [selectedIds, setSelectedIds] = useState<string[]>(['sip', 'ppf', 'digital']);
  const [activeTab, setActiveTab] = useState<'growth' | 'montecarlo' | 'breakdown'>('growth');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Initialize inputs from Real User Data when mounted
  useEffect(() => {
    if (profile) {
      // 1. Initial savings from profile
      setLumpSum(profile.currentSavings || 0);

      // 2. Aggregate monthly investments / savings rate from actual transactions
      const incomeVal = profile.monthlyIncome || 50000;
      
      // Look for real savings or investment category transactions
      const savingsCategoryTxns = transactions.filter(t => 
        t.category.toLowerCase() === 'savings' || 
        t.category.toLowerCase() === 'investment' ||
        t.category.toLowerCase() === 'investments'
      );

      if (savingsCategoryTxns.length > 0) {
        // Calculate average monthly investment transactions
        const monthsMap: Record<string, number> = {};
        savingsCategoryTxns.forEach(t => {
          const m = t.date.substring(0, 7); // YYYY-MM
          monthsMap[m] = (monthsMap[m] || 0) + Math.abs(t.amount);
        });
        const monthlyAverages = Object.values(monthsMap);
        const avgSip = monthlyAverages.reduce((a, b) => a + b, 0) / monthlyAverages.length;
        setSip(Math.max(500, Math.round(avgSip / 500) * 500));
      } else {
        // Fallback to active savings rate of income
        // Group regular transactions to see what's left
        const monthlyExpensesMap: Record<string, number> = {};
        transactions.forEach(t => {
          const m = t.date.substring(0, 7);
          if (t.category !== 'income') {
            monthlyExpensesMap[m] = (monthlyExpensesMap[m] || 0) + Math.abs(t.amount);
          }
        });
        const expenseAverages = Object.values(monthlyExpensesMap);
        const avgExpenses = expenseAverages.length > 0 
          ? expenseAverages.reduce((a, b) => a + b, 0) / expenseAverages.length
          : incomeVal * 0.75;
        
        const calculatedSip = Math.max(1000, Math.round((incomeVal - avgExpenses) / 500) * 500);
        setSip(calculatedSip);
      }
    }
  }, [profile, transactions]);

  // Helper: Indian Currency Formatting
  const formatIndianCurrency = (value: number) => {
    const val = Math.round(value);
    if (val < 100000) {
      return '₹' + new Intl.NumberFormat('en-IN').format(val);
    } else if (val < 10000000) {
      const lakhs = val / 100000;
      return '₹' + lakhs.toFixed(2) + ' L';
    } else {
      const crores = val / 10000000;
      return '₹' + crores.toFixed(2) + ' Cr';
    }
  };

  // Helper: Standard Normal Random via Box-Muller
  const boxMuller = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  // Compounding Future Value calculator (SIP + Lump Sum)
  const calculateSIPFV = (sipAmt: number, lump: number, annualRate: number, years: number) => {
    const n = years * 12;
    const r = annualRate / 12 / 100;
    if (Math.abs(r) < 1e-9) {
      return sipAmt * n + lump;
    }
    const comp = Math.pow(1 + r, n);
    return sipAmt * ((comp - 1) / r) * (1 + r) + lump * comp;
  };

  // Toggle selection cards
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // --- Computation Engine & Memoized Outputs ---
  const results = useMemo(() => {
    if (selectedIds.length === 0) return null;

    const totalPrincipal = sip * 12 * horizon + lumpSum;
    let totalNominal = 0;
    let totalReal = 0;
    let totalAfterTax = 0;
    let totalPassiveIncome = 0;

    const breakdowns: any[] = [];
    const mcData: any[] = [];
    const growthTimeline: any[] = [];

    // Initialize growth curve keys per year
    for (let y = 0; y <= horizon; y++) {
      growthTimeline.push({ year: y, 'Total Invested': sip * 12 * y + lumpSum });
    }

    selectedIds.forEach(id => {
      const inst = INSTRUMENTS.find(i => i.id === id)!;

      // 1. Nominal FV
      const nominalFV = calculateSIPFV(sip, lumpSum, inst.baseReturn, horizon);
      totalNominal += nominalFV;

      // 2. Real (inflation-adjusted) FV
      const realRateAnnual = ((1 + inst.baseReturn / 100) / (1 + inflation / 100)) - 1;
      const realFV = calculateSIPFV(sip, lumpSum, realRateAnnual * 100, horizon);
      totalReal += realFV;

      // 3. Post-Tax FV
      const gains = nominalFV - totalPrincipal;
      const safeGains = Math.max(0, gains);
      let tax = 0;
      if (inst.id === 'ppf') {
        tax = 0;
      } else if (inst.id === 'sip' || inst.id === 'flexicap') {
        tax = Math.max(0, safeGains - 125000) * 0.125;
      } else {
        tax = safeGains * (taxBracket / 100);
      }
      const postTaxFV = nominalFV - tax;
      totalAfterTax += postTaxFV;

      // 4. Monthly Passive Income (from Net post-tax corpus)
      const monthlyIncome = postTaxFV * (inst.baseReturn * 0.006) / 12;
      totalPassiveIncome += monthlyIncome;

      // 5. Box-Muller Monte Carlo simulation (500 runs)
      const runs: number[] = [];
      const sd = (inst.maxReturn - inst.minReturn) / 3;
      for (let i = 0; i < 500; i++) {
        const z = boxMuller();
        const r = inst.baseReturn + z * sd;
        const fv = calculateSIPFV(sip, lumpSum, r, horizon);
        runs.push(fv);
      }
      runs.sort((a, b) => a - b);
      const p10 = runs[Math.floor(500 * 0.10)];
      const p50 = runs[Math.floor(500 * 0.50)];
      const p90 = runs[Math.floor(500 * 0.90)];

      breakdowns.push({
        ...inst,
        nominal: nominalFV,
        real: realFV,
        monthlyIncome,
        p10,
        p50,
        p90
      });

      // Growth curves dataset
      for (let y = 0; y <= horizon; y++) {
        const fvYear = calculateSIPFV(sip, lumpSum, inst.baseReturn, y);
        growthTimeline[y][inst.name] = Math.round(fvYear);
      }

      // Monte Carlo Horizontal Bar dataset
      mcData.push({
        name: inst.name,
        color: inst.color,
        p10: Math.round(p10),
        p50Diff: Math.max(0, Math.round(p50 - p10)),
        p90Diff: Math.max(0, Math.round(p90 - p50)),
        actualP10: p10,
        actualP50: p50,
        actualP90: p90
      });
    });

    const numSelected = selectedIds.length;
    return {
      totalPrincipal,
      avgNominal: totalNominal / numSelected,
      avgReal: totalReal / numSelected,
      avgAfterTax: totalAfterTax / numSelected,
      avgPassive: totalPassiveIncome / numSelected,
      wealthMultiple: (totalNominal / numSelected) / totalPrincipal,
      breakdowns,
      mcData,
      growthTimeline
    };
  }, [sip, lumpSum, horizon, taxBracket, inflation, selectedIds]);

  return (
    <div className="rounded-2xl border border-gray-800 bg-[#0A0F1C]/80 p-6 backdrop-blur-md relative" id="passive-income-predictor">
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              India Passive Income &amp; Investment Predictor
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Live compounding modeling synchronized with your active financial profile
            </p>
          </div>
        </div>
        
        {/* Real Data indicator */}
        {profile && (
          <div className="flex items-center gap-2 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
            ⚡ Active Profile Linked (Income: ₹{profile.monthlyIncome.toLocaleString()} | Savings: ₹{profile.currentSavings.toLocaleString()})
          </div>
        )}
      </div>

      {/* Main split layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Parameters / Cards */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-gray-950/40 border border-gray-800/80 p-5 rounded-2xl space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-500" /> Control Console
            </h3>

            {/* Monthly SIP Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Monthly SIP Amount</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {formatIndianCurrency(sip)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <input 
                  type="number" 
                  value={sip} 
                  onChange={(e) => setSip(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-7 pr-3 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <div className="flex gap-2">
                {[1000, 5000, 10000].map(val => (
                  <button 
                    key={val} 
                    onClick={() => setSip(prev => prev + val)}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-xs font-semibold py-1 rounded text-gray-400 hover:text-white transition-all"
                  >
                    +{val >= 10000 ? `${val/10000}L` : `${val/1000}K`}
                  </button>
                ))}
              </div>
            </div>

            {/* Lump Sum Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Lump Sum / Initial Savings</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {formatIndianCurrency(lumpSum)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <input 
                  type="number" 
                  value={lumpSum} 
                  onChange={(e) => setLumpSum(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-7 pr-3 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <div className="flex gap-2">
                {[10000, 50000, 100000].map(val => (
                  <button 
                    key={val} 
                    onClick={() => setLumpSum(prev => prev + val)}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-xs font-semibold py-1 rounded text-gray-400 hover:text-white transition-all"
                  >
                    +{val >= 100000 ? `${val/100000}L` : `${val/1000}K`}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizon & Tax split */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">Horizon</label>
                <select 
                  value={horizon}
                  onChange={(e) => setHorizon(parseInt(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  {[3, 5, 10, 15, 20, 25, 30].map(y => <option key={y} value={y}>{y} Years</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">Tax Slab</label>
                <select 
                  value={taxBracket}
                  onChange={(e) => setTaxBracket(parseInt(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  {[0, 5, 20, 30].map(t => <option key={t} value={t}>{t}% Bracket</option>)}
                </select>
              </div>
            </div>

            {/* Inflation slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Expected Inflation Rate</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {inflation.toFixed(1)}%
                </span>
              </div>
              <input 
                type="range"
                min="3"
                max="9"
                step="0.5"
                value={inflation}
                onChange={(e) => setInflation(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>3% (Low)</span>
                <span>6% (Avg)</span>
                <span>9% (High)</span>
              </div>
            </div>
          </div>

          {/* Investment Selection Cards Wrapper */}
          <div className="bg-gray-950/40 border border-gray-800/80 p-5 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-4">
              <Wallet className="h-4 w-4 text-emerald-500" /> Asset Selectors
            </h3>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
              {INSTRUMENTS.map(inst => {
                const isActive = selectedIds.includes(inst.id);
                const isHovered = hoveredCardId === inst.id;

                let riskBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                if (inst.risk === 'Medium') riskBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                if (inst.risk === 'High') riskBadge = 'bg-red-500/10 text-red-400 border border-red-500/20';

                return (
                  <div 
                    key={inst.id}
                    onClick={() => toggleSelect(inst.id)}
                    onMouseEnter={() => setHoveredCardId(inst.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    className={`rounded-xl border p-3.5 cursor-pointer transition-all duration-200 select-none ${
                      isActive 
                        ? 'border-emerald-500 bg-emerald-500/5' 
                        : 'border-gray-800 bg-gray-900/30 hover:bg-gray-800/40 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] text-white transition-all ${
                          isActive ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'
                        }`}>
                          {isActive && <CircleCheck className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-sm font-bold text-white">{inst.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${riskBadge}`}>
                        {inst.risk} Risk
                      </span>
                      <span className="text-[10px] bg-gray-800/80 border border-gray-700 px-2 py-0.5 rounded text-gray-400 font-semibold">
                        Lock: {inst.lockIn}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-gray-800/60 pt-2 mt-2">
                      <span className="text-gray-500">Return: <strong className="text-gray-300 font-semibold">{inst.baseReturn}%</strong></span>
                      <span className="text-amber-500/90 text-[11px] font-medium flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" /> {inst.taxRule}
                      </span>
                    </div>

                    {/* Expand details on hover or click */}
                    <div className={`overflow-hidden transition-all duration-300 ${
                      isHovered ? 'max-h-20 mt-2.5 border-t border-gray-800/40 pt-2.5' : 'max-h-0'
                    }`}>
                      <p className="text-xs text-gray-400 leading-normal flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {inst.details}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="xl:col-span-8 space-y-6">
          {results ? (
            <>
              {/* Grid KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Nominal Corpus */}
                <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/30 p-4.5 group hover:border-emerald-500/30 transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Avg Projected Corpus</div>
                  <div className="text-xl font-bold text-white tracking-tight">{formatIndianCurrency(results.avgNominal)}</div>
                  <p className="text-[10px] text-gray-400 mt-1">Nominal value at horizon</p>
                </div>

                {/* Real Corpus */}
                <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/30 p-4.5 group hover:border-sky-500/30 transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500"></div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Real Purchasing Power</div>
                  <div className="text-xl font-bold text-white tracking-tight text-sky-400">{formatIndianCurrency(results.avgReal)}</div>
                  <p className="text-[10px] text-gray-400 mt-1">Adjusted for {inflation}% inflation</p>
                </div>

                {/* After Tax Corpus */}
                <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/30 p-4.5 group hover:border-amber-500/30 transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">After-Tax Corpus</div>
                  <div className="text-xl font-bold text-white tracking-tight text-amber-400">{formatIndianCurrency(results.avgAfterTax)}</div>
                  <p className="text-[10px] text-gray-400 mt-1">Net post-tax payout</p>
                </div>

                {/* Passive Income */}
                <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/30 p-4.5 group hover:border-emerald-500/30 transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-400"></div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Monthly Passive Income</div>
                  <div className="text-xl font-bold text-emerald-400 tracking-tight">{formatIndianCurrency(results.avgPassive)}</div>
                  <p className="text-[10px] text-gray-400 mt-1">Conservative 60% rule</p>
                </div>

                {/* Principal */}
                <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/30 p-4.5 group hover:border-gray-500/30 transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-500"></div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Principal Invested</div>
                  <div className="text-xl font-bold text-white tracking-tight">{formatIndianCurrency(results.totalPrincipal)}</div>
                  <p className="text-[10px] text-gray-400 mt-1">Total capital contributions</p>
                </div>

                {/* Wealth Multiple */}
                <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/30 p-4.5 group hover:border-purple-500/30 transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Wealth Multiple</div>
                  <div className="text-xl font-bold text-purple-400 tracking-tight">{results.wealthMultiple.toFixed(2)}x</div>
                  <p className="text-[10px] text-gray-400 mt-1">Corpus vs Principal ratio</p>
                </div>

              </div>

              {/* Tabs Panel */}
              <div className="border border-gray-800 bg-gray-950/40 rounded-2xl overflow-hidden shadow-xl">
                {/* Navigation */}
                <div className="flex border-b border-gray-800 bg-gray-950/70 px-4">
                  {[
                    { id: 'growth', label: 'Growth Curves' },
                    { id: 'montecarlo', label: 'Monte Carlo Bands' },
                    { id: 'breakdown', label: 'Instrument Breakdown' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-5 text-sm font-semibold border-b-2 outline-none transition-all ${
                        activeTab === tab.id
                          ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* Tab 1: Growth Curves */}
                  {activeTab === 'growth' && (
                    <div className="space-y-4">
                      <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={results.growthTimeline} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid stroke="#ffffff08" strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="year" 
                              stroke="#64748b" 
                              tick={{ fill: '#64748b', fontSize: 11 }} 
                              tickLine={false}
                              axisLine={false}
                              label={{ value: 'Investment Horizon (Years)', position: 'bottom', fill: '#64748b', fontSize: 11 }}
                            />
                            <YAxis 
                              stroke="#64748b" 
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(val) => formatIndianCurrency(val)} 
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
                              itemStyle={{ fontSize: 12 }}
                              labelStyle={{ fontSize: 12, fontWeight: 750, color: '#94a3b8', marginBottom: 4 }}
                              formatter={(val: any) => [formatIndianCurrency(Number(val)), 'Corpus']}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                            
                            {/* Selected instrument lines */}
                            {selectedIds.map(id => {
                              const inst = INSTRUMENTS.find(i => i.id === id)!;
                              return (
                                <Line 
                                  key={inst.id} 
                                  type="monotone" 
                                  dataKey={inst.name} 
                                  stroke={inst.color} 
                                  strokeWidth={2.5}
                                  dot={false}
                                  activeDot={{ r: 5 }}
                                />
                              );
                            })}
                            
                            {/* Dashed linear investment line */}
                            <Line 
                              type="linear" 
                              dataKey="Total Invested" 
                              stroke="#64748b" 
                              strokeDasharray="4 4" 
                              strokeWidth={1.5}
                              dot={false}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Monte Carlo Bands */}
                  {activeTab === 'montecarlo' && (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-400 mb-4 leading-normal flex items-start gap-1.5">
                        <Award className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        500 Box-Muller stochastic runs per asset showing the confidence interval bands from Pessimistic (P10) to Optimistic (P90) outcomes.
                      </p>
                      <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart layout="vertical" data={results.mcData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid stroke="#ffffff08" strokeDasharray="3 3" horizontal={false} />
                            <XAxis 
                              type="number" 
                              stroke="#64748b" 
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(val) => formatIndianCurrency(val)} 
                            />
                            <YAxis 
                              type="category" 
                              dataKey="name" 
                              stroke="#64748b" 
                              tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }}
                              tickLine={false}
                              axisLine={false}
                              width={140}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
                              formatter={(_value: any, name: any, props: any) => {
                                const data = props.payload;
                                if (name === 'Bear Case') return [formatIndianCurrency(data.actualP10), 'P10 (Bear Outcome)'];
                                if (name === 'Median Case') return [formatIndianCurrency(data.actualP50), 'P50 (Median Target)'];
                                return [formatIndianCurrency(data.actualP90), 'P90 (Bull Outcome)'];
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                            
                            {/* Stacked components */}
                            <Bar dataKey="p10" name="Bear Case" stackId="a" fill="rgba(239, 68, 68, 0.2)" stroke="rgba(239, 68, 68, 0.3)" strokeWidth={1} />
                            <Bar dataKey="p50Diff" name="Median Case" stackId="a" fill="#1D9E75" />
                            <Bar dataKey="p90Diff" name="Bull Case" stackId="a" fill="rgba(16, 185, 129, 0.2)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth={1} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Instrument Breakdown */}
                  {activeTab === 'breakdown' && (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-3 px-4">Asset Instrument</th>
                            <th className="py-3 px-4 text-right">Base Corpus</th>
                            <th className="py-3 px-4 text-right">Inflation Adjusted</th>
                            <th className="py-3 px-4 text-right">Monthly Payout</th>
                            <th className="py-3 px-4 text-right">P10 (Bearish)</th>
                            <th className="py-3 px-4 text-right">P90 (Bullish)</th>
                            <th className="py-3 px-4 text-center">Lock-in</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.breakdowns.map(row => (
                            <tr key={row.id} className="border-b border-gray-800/50 hover:bg-gray-900/20 text-white font-medium">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: row.color }} />
                                  {row.name}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right">{formatIndianCurrency(row.nominal)}</td>
                              <td className="py-3.5 px-4 text-right text-sky-400">{formatIndianCurrency(row.real)}</td>
                              <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">{formatIndianCurrency(row.monthlyIncome)}</td>
                              <td className="py-3.5 px-4 text-right text-red-400/90">{formatIndianCurrency(row.p10)}</td>
                              <td className="py-3.5 px-4 text-right text-emerald-500/95">{formatIndianCurrency(row.p90)}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-900 border border-gray-850 text-gray-400">
                                  {row.lockIn}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
              <ShieldAlert className="w-12 h-12 text-gray-600 mb-4 animate-bounce" />
              <h4 className="text-white font-bold text-lg mb-1">No Active Selections</h4>
              <p className="text-xs text-gray-500 max-w-sm">
                Select one or more wealth categories on the left panel to immediately initiate long-term compounding models.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Footer Disclaimer */}
      <div className="mt-8 border-t border-gray-850/60 pt-4 flex gap-3 items-start bg-gray-950/20 p-4.5 rounded-xl border border-gray-850">
        <Info className="w-4.5 h-4.5 text-gray-500 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-gray-400 leading-relaxed">
          <strong>Projections Disclaimer:</strong> Projections are purely illustrative simulations and do not represent guaranteed financial returns. Past performance does not assure future capital growth. Benchmark rates used: PPF 7.10% (RBI Q2 FY26), FD 6.50% (Dec 2025), RBI floating bond 8.05% (Dec 2025). Please consult a SEBI registered investment advisor before committing real capital.
        </p>
      </div>

    </div>
  );
};
