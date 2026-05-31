import { useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';
import { useTransactionStore } from '../store/transactionStore';
import { fetchHealthScore } from '../lib/api';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GaugeSkeleton } from './SkeletonLoader';
import type { FinancialHealth } from '../types';

// Animated Counter Hook
const useCountUp = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
};

const HealthScoreGauge = () => {
  const { profile } = useUserStore();
  const { transactions } = useTransactionStore();
  const [scoreData, setScoreData] = useState<FinancialHealth | null>(null);
  const [loading, setLoading] = useState(true);

  // Call the custom hook at the top level to satisfy React Rules of Hooks
  const animatedScore = useCountUp(scoreData?.score || 0);

  useEffect(() => {
    if (transactions.length > 0 && profile) {
      setLoading(true);
      fetchHealthScore(transactions, profile.currentSavings, profile.monthlyIncome)
        .then(data => {
          setScoreData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [transactions, profile]);

  const hasNoTransactions = transactions.length === 0;

  if (hasNoTransactions) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 h-full flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-md min-h-[250px]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none"></div>
        <div className="p-3.5 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20 mb-3 animate-pulse">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white mb-2">Financial Health Score</h3>
        <p className="text-xs text-gray-400 max-w-xs leading-normal">
          We compute your credit-like health score (0-850) based on savings rate, debt coverage, and transaction patterns. Please add transactions to generate your baseline grade.
        </p>
      </div>
    );
  }

  if (loading || !scoreData) return <GaugeSkeleton />;


  const percentage = Math.max(0, Math.min(100, ((scoreData.score - 300) / 550) * 100));
  const strokeDasharray = `${percentage}, 100`;

  const renderTrendIcon = () => {
    switch (scoreData.trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 h-full flex flex-col relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Financial Health
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {renderTrendIcon()}
            <span className="text-xs text-white/50 capitalize">{scoreData.trend}</span>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
          Grade {scoreData.grade}
        </div>
      </div>

      {/* Gauge */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center relative z-10 mb-4">
        <svg viewBox="0 0 36 36" className="w-40 h-40 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <path
            className="text-gray-800"
            strokeWidth="3"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-cyan-400 transition-all duration-1000 ease-out"
            strokeWidth="3"
            strokeDasharray={strokeDasharray}
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-bold text-white tracking-tight">
            {animatedScore}
          </span>
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-1">Score</span>
        </div>
      </div>

      {/* Factor Breakdown Bars */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 relative z-10 custom-scrollbar">
        {Object.entries(scoreData.factors || {}).map(([key, factor]: [string, any]) => (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 font-medium">{factor.label}</span>
              <span className="text-gray-500">{Math.round(factor.value * 100)}/100</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  factor.value > 0.8 ? 'bg-emerald-500' : 
                  factor.value > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${factor.value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthScoreGauge;
