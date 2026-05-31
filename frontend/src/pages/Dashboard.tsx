import { useState, useEffect } from 'react';
import { Bell, User, Plus, Camera, MessageSquare, Compass, Activity, Zap, Target as TargetIcon, Brain, Wallet, Upload } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useUIStore } from '../store/uiStore';
import { useTransactionStore } from '../store/transactionStore';
import { fetchNetWorth, fetchAnomalies, fetchHeatmapData } from '../lib/api';
 
import HealthScoreGauge from '../components/HealthScoreGauge';
import MonteCarloSimulator from '../components/MonteCarloSimulator';
import AIAdvisor from '../components/AIAdvisor';
import SpendingDNA from '../components/SpendingDNA';
import { NetWorthTracker } from '../components/NetWorthTracker';
import { GamificationPanel } from '../components/GamificationPanel';
import { GoalTracker } from '../components/GoalTracker';
import { AnomalyScanner } from '../components/AnomalyScanner';
import { SpendingHeatmap } from '../components/SpendingHeatmap';
import { ReceiptOCR } from '../components/ReceiptOCR';
import { NotificationCenter } from '../components/NotificationCenter';
import { PassiveIncomePredictor } from '../components/PassiveIncomePredictor';
import { AddTransactionForm } from '../components/AddTransactionForm';
import { BankStatementUpload } from '../components/BankStatementUpload';

const Dashboard = () => {
  const { profile } = useUserStore();
  const { sidebarOpen, openModal, notifications } = useUIStore();
  const { transactions, addTransaction } = useTransactionStore();

  const [netWorth, setNetWorth] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [isScanningAnomalies, setIsScanningAnomalies] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (profile && transactions.length > 0) {
      // Fetch Net Worth
      fetchNetWorth({
        currentSavings: profile.currentSavings,
        investments: 0,
        liabilities: 0,
        transactions,
        monthlyIncome: profile.monthlyIncome
      }).then(setNetWorth).catch(console.error);

      // Fetch Anomalies
      setIsScanningAnomalies(true);
      fetchAnomalies(transactions)
        .then(res => setAnomalies(res.anomalies))
        .catch(console.error)
        .finally(() => setIsScanningAnomalies(false));

      // Fetch Heatmap
      fetchHeatmapData(transactions)
        .then(res => setHeatmap(res.days))
        .catch(console.error);
    }
  }, [profile, transactions]);

  const handleDismissAnomaly = (id: string) => {
    setAnomalies(prev => prev.filter(a => a.transaction.id !== id));
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] relative overflow-hidden">
      {/* Ambient Glow Aurora Background Orbs */}
      <div className="absolute top-12 left-1/4 w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[40vh] right-1/3 w-[550px] h-[550px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Top Nav */}
      <header className="h-16 border-b border-gray-800 bg-[#0A0F1C]/80 backdrop-blur-lg px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="url(#logo-grad)" opacity="0.15" />
            <path d="M8 22 C 8 14, 12 12, 14 16 C 16 20, 18 10, 20 13 C 22 16, 24.5 9, 24.5 9" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 25 L 22 25" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
            <circle cx="24.5" cy="9" r="1.5" fill="#fff" />
          </svg>
          <h1 className="text-xl font-bold tracking-wide text-white flex items-center gap-1">
            Fine<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">hands</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => openModal('notifications')} className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5 text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-[#0A0F1C]"></span>
            )}
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-400" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {sidebarOpen && (
          <aside className="hidden lg:flex w-64 border-r border-gray-800 bg-[#0A0F1C]/50 flex-col py-6 px-4 gap-2">
            <div className="px-3 mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</p>
            </div>
            {[
              { id: 'overview', label: 'Overview', icon: <Compass className="w-4 h-4" /> },
              { id: 'predictor', label: 'Passive Income Predictor', icon: <Wallet className="w-4 h-4 text-emerald-400" /> },
              { id: 'projections', label: 'Projections', icon: <Activity className="w-4 h-4" /> },
              { id: 'analysis', label: 'Deep Analysis', icon: <Zap className="w-4 h-4" /> },
              { id: 'goals', label: 'Goals & Progress', icon: <TargetIcon className="w-4 h-4" /> },
              { id: 'advisor', label: 'AI Advisor', icon: <Brain className="w-4 h-4" /> },
            ].map(nav => (
              <button 
                key={nav.id}
                onClick={() => scrollToSection(nav.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors font-medium text-sm"
              >
                {nav.icon} {nav.label}
              </button>
            ))}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar relative pb-28">
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            
            {/* Header */}
            <div className="mb-8" id="overview">
              <h2 className="text-3xl font-bold mb-1 text-white">Welcome back, {profile?.name || 'User'}</h2>
              <p className="text-gray-400">Here's your financial intelligence overview for today.</p>
            </div>
            
            {/* Row 1: Net Worth + Health Score */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 h-[250px]">
                {netWorth ? <NetWorthTracker data={netWorth} /> : <div className="animate-pulse bg-gray-900/50 rounded-2xl h-full border border-gray-800" />}
              </div>
              <div className="lg:col-span-4 h-[250px]">
                <HealthScoreGauge />
              </div>
            </div>

            {/* Passive Income & Investment Predictor Component */}
            <div id="predictor">
              <PassiveIncomePredictor />
            </div>

            {/* Row 2: Monte Carlo + Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="projections">
              <div className="lg:col-span-12 h-[450px]">
                <MonteCarloSimulator />
              </div>
              <div className="lg:col-span-12">
                <SpendingHeatmap data={heatmap} />
              </div>
            </div>

            {/* Row 3: Spending DNA + Anomaly */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="analysis">
              <div className="lg:col-span-7 h-[450px]">
                <SpendingDNA />
              </div>
              <div className="lg:col-span-5 h-[450px]">
                <AnomalyScanner anomalies={anomalies} onDismiss={handleDismissAnomaly} onInvestigate={() => {}} isScanning={isScanningAnomalies} />
              </div>
            </div>

            {/* Row 4: Goals + Gamification */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="goals">
              <div className="lg:col-span-6 h-[400px]">
                <GoalTracker />
              </div>
              <div className="lg:col-span-6 h-[400px]">
                <GamificationPanel />
              </div>
            </div>

            {/* Row 5: AI Advisor */}
            <div className="h-[500px]" id="advisor">
              <AIAdvisor />
            </div>

          </div>
        </main>
      </div>

      {/* Notification Modal / Drawer */}
      <NotificationCenter />

      {/* OCR Modal (Quick Action) */}
      {/* For simplicity in this layout, we could render ReceiptOCR inside a modal if triggered, but for now we'll rely on the bottom action bar calling openModal('ocr') */}
      
      {/* Bottom Quick Actions Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-full px-2 py-2 flex items-center gap-2 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        <button onClick={() => openModal('add-transaction')} className="p-3 rounded-full hover:bg-gray-800 transition-colors group flex items-center gap-2 pr-4 text-white">
          <div className="bg-cyan-500/20 p-2 rounded-full group-hover:bg-cyan-500/30 transition-colors">
            <Plus className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-sm font-medium hidden md:block">Add Txn</span>
        </button>
        <div className="w-px h-8 bg-gray-700"></div>
        <button onClick={() => openModal('upload-statement')} className="p-3 rounded-full hover:bg-gray-800 transition-colors group flex items-center gap-2 pr-4 text-white">
          <div className="bg-emerald-500/20 p-2 rounded-full group-hover:bg-emerald-500/30 transition-colors">
            <Upload className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm font-medium hidden md:block">Import CSV</span>
        </button>
        <div className="w-px h-8 bg-gray-700"></div>
        <button onClick={() => openModal('ocr')} className="p-3 rounded-full hover:bg-gray-800 transition-colors group flex items-center gap-2 pr-4 text-white">
          <div className="bg-purple-500/20 p-2 rounded-full group-hover:bg-purple-500/30 transition-colors">
            <Camera className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-sm font-medium hidden md:block">Scan Receipt</span>
        </button>
        <div className="w-px h-8 bg-gray-700"></div>
        <button onClick={() => scrollToSection('advisor')} className="p-3 rounded-full hover:bg-gray-800 transition-colors group flex items-center gap-2 pr-4 text-white">
          <div className="bg-blue-500/20 p-2 rounded-full group-hover:bg-blue-500/30 transition-colors">
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-medium hidden md:block">Advisor</span>
        </button>
      </div>
      
      {/* Simple Modal for OCR if needed */}
      {useUIStore(s => s.activeModal) === 'ocr' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl relative">
            <button onClick={() => openModal('')} className="absolute -top-12 right-0 text-white p-2">Close</button>
            <ReceiptOCR onAddTransaction={(txn) => {
              addTransaction({...txn, id: Math.random().toString()});
              openModal('');
            }} />
          </div>
        </div>
      )}

      {/* Manual Transaction Modal */}
      {useUIStore(s => s.activeModal) === 'add-transaction' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg relative">
            <AddTransactionForm 
              onClose={() => openModal('')} 
              onAddTransaction={(txn) => {
                addTransaction({...txn, id: `manual-${Date.now()}`});
                openModal('');
              }} 
            />
          </div>
        </div>
      )}

      {/* Statement Import Modal */}
      {useUIStore(s => s.activeModal) === 'upload-statement' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl relative">
            <BankStatementUpload onClose={() => openModal('')} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
