import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import SimulatorChart from '../components/SimulatorChart';
import { Bot, LineChart, Search, RefreshCw, LogOut, Settings, Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const [expense, setExpense] = useState('');
  const [advice, setAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [simData, setSimData] = useState([]);
  const [loadingSim, setLoadingSim] = useState(false);
  const [subs, setSubs] = useState([]);

  // Load initial data
  useEffect(() => {
    handleSimulate();
    handleScanSubs();
  }, []);

  const handleAskDoctor = async () => {
    setLoadingAdvice(true);
    try {
      const response = await fetch('http://localhost:5000/api/analyze-spending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: [] })
      });
      const data = await response.json();
      setAdvice(data.advice);
    } catch (error) {
      setAdvice("The Money Doctor is currently unavailable.");
    }
    setLoadingAdvice(false);
  };

  const handleSimulate = async () => {
    setLoadingSim(true);
    try {
      const response = await fetch('http://localhost:5000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          expenseAmount: expense ? parseFloat(expense) : 0,
          currentSavings: 12500,
          monthlySavingsRate: 850
        })
      });
      const data = await response.json();
      
      // Transform data for Recharts
      const formatted = data.baseline.map((b, i) => ({
        month: b.month,
        baseline: b.savings,
        projected: data.projected[i].savings
      }));
      setSimData(formatted);
    } catch (error) {
      console.error(error);
    }
    setLoadingSim(false);
  };

  const handleScanSubs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/scan-subs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: [] })
      });
      const data = await response.json();
      setSubs(data.subscriptions);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto animate-fade-in-up">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full blur-sm opacity-70"></div>
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.6)] border-2 border-white/20"></div>
          </div>
          Finehands
        </h1>
        <div className="flex gap-4">
          <button className="glass-panel p-3 rounded-full hover:bg-white/10 transition-colors group"><Settings className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /></button>
          <button className="glass-panel p-3 rounded-full hover:bg-white/10 transition-colors group"><LogOut className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /></button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Money Doctor */}
        <div className="lg:col-span-4 space-y-8 flex flex-col">
          <GlassCard className="flex-1 flex flex-col relative z-10" hover>
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <Bot className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">The Money Doctor</h2>
                <p className="text-sm text-cyan-200/70 flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Financial Advisor</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-8 pr-2 space-y-5 custom-scrollbar">
              <div className="bg-black/20 rounded-2xl p-5 border border-white/5 backdrop-blur-sm relative overflow-hidden group hover:border-white/10 transition-colors">
                <div className="absolute left-0 top-0 w-1 h-full bg-blue-500/50"></div>
                <p className="text-[11px] font-semibold text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Current Status</p>
                <p className="text-white/90 leading-relaxed text-sm">I've reviewed your recent transactions. You're on track to hit your emergency fund goal, but dining out is up 15% this month compared to your 6-month average.</p>
              </div>
              
              {advice && (
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-2xl p-5 shadow-[0_4px_20px_rgba(6,182,212,0.1)] relative animate-fade-in-up">
                  <div className="absolute left-0 top-0 w-1 h-full bg-cyan-400"></div>
                  <p className="text-[11px] font-semibold text-cyan-300 uppercase tracking-widest mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Doctor's Advice</p>
                  <p className="text-cyan-50 leading-relaxed text-sm">{advice}</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleAskDoctor}
              disabled={loadingAdvice}
              className="glass-button w-full flex items-center justify-center gap-2 mt-auto"
            >
              {loadingAdvice ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Get Personalized Advice'}
            </button>
          </GlassCard>
        </div>

        {/* Right Column (Wider) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Top Row: Financial Decision Simulator */}
          <GlassCard hover className="relative z-10 overflow-hidden">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <LineChart className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Decision Simulator</h2>
                  <p className="text-sm text-white/50">Predict 6-month trajectory vs major purchases</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-black/20 p-2 rounded-2xl border border-white/5">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">$</span>
                  <input 
                    type="number" 
                    placeholder="Enter planned expense..." 
                    className="glass-input w-56 pl-8"
                    value={expense}
                    onChange={(e) => setExpense(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                  />
                </div>
                <button onClick={handleSimulate} disabled={loadingSim} className="glass-button px-5 py-3 flex items-center gap-2">
                  {loadingSim ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Simulate'}
                </button>
              </div>
            </div>
            
            <div className="bg-black/10 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
              <SimulatorChart data={simData} />
            </div>
          </GlassCard>

          {/* Bottom Row: Subscription Scanner */}
          <GlassCard hover className="relative z-10">
            <div className="absolute top-1/2 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-gradient-to-br from-purple-500/20 to-fuchsia-600/20 rounded-2xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <Search className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Subscription Scanner</h2>
                  <p className="text-sm text-white/50">Detecting ghost charges & inactive services</p>
                </div>
              </div>
              <button onClick={handleScanSubs} className="glass-button-secondary py-2 px-4 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Rescan
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Service</th>
                    <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Monthly Cost</th>
                    <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {subs.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-6 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
                          ${sub.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                            sub.status === 'flagged' ? 'bg-red-500/20 text-red-400' : 
                            'bg-yellow-500/20 text-yellow-400'}`}>
                          {sub.name.charAt(0)}
                        </div>
                        <span className="font-medium text-white/90 group-hover:text-white transition-colors">{sub.name}</span>
                      </td>
                      <td className="py-4 px-6 font-medium text-white/80">${sub.amount.toFixed(2)}</td>
                      <td className="py-4 px-6">
                        {sub.status === 'active' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle2 className="w-3 h-3"/> Active</span>}
                        {sub.status === 'unused' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><AlertCircle className="w-3 h-3"/> Unused 2mo</span>}
                        {sub.status === 'flagged' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"><AlertCircle className="w-3 h-3"/> Ghost Charge</span>}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-sm font-medium text-white/50 hover:text-cyan-400 transition-colors">Manage</button>
                      </td>
                    </tr>
                  ))}
                  {subs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-white/50">Scanning for subscriptions...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
