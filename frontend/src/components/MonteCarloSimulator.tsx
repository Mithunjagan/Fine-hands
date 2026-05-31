import { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useUserStore } from '../store/userStore';
import { useGoalStore } from '../store/goalStore';
import { useTransactionStore } from '../store/transactionStore';
import { fetchSimulation } from '../lib/api';
import { LineChart, RefreshCw } from 'lucide-react';
import type { MonteCarloResult } from '../types';

const MonteCarloSimulator = () => {
  const { profile } = useUserStore();
  const { goals } = useGoalStore();
  const { transactions } = useTransactionStore();

  // Calculate real average monthly expenses from transaction logs or default to 25k
  const averageExpenses = transactions.length > 0
    ? Math.round(transactions.reduce((sum, t) => sum + t.amount, 0) / Math.max(1, new Set(transactions.map(t => t.date.slice(0, 7))).size))
    : 25000;

  const [expense, setExpense] = useState(15000); // Default placeholder, will be synced
  const [months, setMonths] = useState(12);
  const [simData, setSimData] = useState<MonteCarloResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync default expense slider state with real calculated averages once loaded
  useEffect(() => {
    if (transactions.length > 0) {
      setExpense(averageExpenses);
    } else if (profile) {
      setExpense(Math.round(profile.monthlyIncome * 0.4)); // Default to 40% of income if no transactions
    }
  }, [transactions, averageExpenses, profile]);

  // Use the highest goal target for the reference line
  const maxGoalTarget = goals.length > 0 ? Math.max(...goals.map(g => g.target)) : 0;

  const runSimulation = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await fetchSimulation({
        currentSavings: profile.currentSavings,
        // Smart Math: Real savings rate is Income minus Monthly Expenses (surplus or deficit)
        monthlySavingsRate: profile.monthlyIncome - expense,
        expense: 0, // No one-time first-month expense shock from the slider
        months: months,
        goalTarget: maxGoalTarget
      });
      setSimData(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [profile, expense, months, maxGoalTarget]);

  // Debounce slider updates for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 500);
    return () => clearTimeout(timer);
  }, [expense, months, runSimulation]);

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 h-full flex flex-col relative z-10 overflow-hidden backdrop-blur-md">
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-xl border border-blue-500/30">
            <LineChart className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Future Projections
              {simData?.goal_probability !== undefined && maxGoalTarget > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  simData.goal_probability > 0.8 ? 'bg-emerald-500/20 text-emerald-400' :
                  simData.goal_probability > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {Math.round(simData.goal_probability * 100)}% Goal Hit Probability
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Stochastic modeling with 5 probability bands</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-gray-950/50 p-3 rounded-xl border border-gray-800 w-full xl:w-auto">
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Monthly Expenses</span>
              <span className="text-white font-medium">₹{expense.toLocaleString()}</span>
            </div>
            <input 
              type="range"
              min="0"
              max={profile?.monthlyIncome ? profile.monthlyIncome * 1.5 : 100000}
              step="1000"
              value={expense}
              onChange={(e) => setExpense(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
            {[6, 12, 24].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  months === m ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[300px] relative">
        {simData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={simData.bands} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorP90" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorP75" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorP25" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorP10" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} axisLine={false} tickLine={false} dx={-10} />
              
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: 12, fontWeight: 500 }}
                formatter={(value: any, name: any) => [`₹${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, name]}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
              />
              
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}/>
              
              <Area type="monotone" dataKey="p90" name="Best Case (P90)" stroke="#10B981" strokeWidth={1} fillOpacity={1} fill="url(#colorP90)" />
              <Area type="monotone" dataKey="p75" name="Optimistic (P75)" stroke="#34D399" strokeWidth={1} fillOpacity={1} fill="url(#colorP75)" />
              <Area type="monotone" dataKey="p50" name="Expected (P50)" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorP50)" activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="p25" name="Pessimistic (P25)" stroke="#F59E0B" strokeWidth={1} fillOpacity={1} fill="url(#colorP25)" />
              <Area type="monotone" dataKey="p10" name="Worst Case (P10)" stroke="#EF4444" strokeWidth={1} fillOpacity={1} fill="url(#colorP10)" />

              {maxGoalTarget > 0 && (
                <ReferenceLine 
                  y={maxGoalTarget} 
                  stroke="#A855F7" 
                  strokeDasharray="5 5" 
                  label={{ position: 'top', value: 'Highest Goal Target', fill: '#A855F7', fontSize: 12 }} 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-blue-500/50">
            <RefreshCw className="h-8 w-8 animate-spin mb-4" />
            <span className="text-sm">Calculating 1,000 simulations...</span>
          </div>
        )}
        
        {loading && simData && (
          <div className="absolute inset-0 bg-gray-950/20 backdrop-blur-[1px] flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MonteCarloSimulator;
