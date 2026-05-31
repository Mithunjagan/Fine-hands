import { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTransactionStore } from '../store/transactionStore';
import { useUserStore } from '../store/userStore';
import { Dna, Fingerprint } from 'lucide-react';
import type { Persona } from '../types';
import { fetchPersona } from '../lib/api';

const SpendingDNA = () => {
  const { transactions } = useTransactionStore();
  const { profile } = useUserStore();
  const [persona, setPersona] = useState<Persona | null>(null);

  useEffect(() => {
    if (transactions.length > 0 && profile) {
      fetchPersona(transactions, profile.monthlyIncome)
        .then(data => setPersona(data))
        .catch(err => console.error(err));
    }
  }, [transactions, profile]);

  const hasNoTransactions = transactions.length === 0;

  if (hasNoTransactions) {
    return (
      <div className="glass-panel p-6 h-full flex flex-col items-center justify-center text-center relative z-10 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-md min-h-[400px]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-4 animate-pulse">
          <Fingerprint className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Spending DNA Profile</h3>
        <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
          No transactions detected. We analyze your transaction history using clustering algorithms to group you into a Spending Archetype and map your behavioral vectors.
        </p>
        <div className="bg-gray-950/60 rounded-xl p-4 border border-gray-800 text-left text-xs text-gray-300 max-w-sm space-y-2">
          <p className="font-semibold text-indigo-400 flex items-center gap-1.5">⚡ What you need to do:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-1">
            <li>Log at least <strong className="text-white">one purchase</strong> via receipt scans, statement imports, or manual entries.</li>
            <li>Once transactions are loaded, we will calculate your traits.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 h-full flex flex-col md:flex-row gap-8 relative z-10 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-md">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Persona Radar */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Dna className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white/90">Spending DNA Profile</h2>
          </div>
          {persona && persona.confidence !== undefined && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-medium text-indigo-300">
              <Fingerprint className="w-3.5 h-3.5" />
              {(persona.confidence || 0).toFixed(0)}% Match
            </div>
          )}
        </div>
        
        {persona ? (
          <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="text-4xl bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">{persona.icon}</div>
              <div>
                <h3 className="font-bold text-indigo-300 text-lg">{persona.persona}</h3>
                <p className="text-sm text-gray-400 mt-1">{persona.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(persona.traits || []).map((trait, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full bg-gray-800/80 border border-gray-700 text-xs text-gray-300 font-medium">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800/50">
              <p className="text-sm text-indigo-200/70 italic">"{persona.advice}"</p>
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex-1 bg-gray-950/50 border border-gray-800 rounded-xl mb-4 min-h-[150px]"></div>
        )}
      </div>

      {/* Radar Chart */}
      <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-800/50 pt-6 md:pt-0 md:pl-6 w-full flex flex-col items-center justify-center">
        {persona && persona.radar_data ? (
          <div className="w-full h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="62%" margin={{ top: 10, right: 45, bottom: 10, left: 45 }} data={persona.radar_data}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: 12, color: '#818cf8' }}
                />
                <Radar name="Score" dataKey="A" stroke="#818cf8" strokeWidth={2} fill="#818cf8" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="animate-pulse w-48 h-48 rounded-full bg-indigo-500/10 border border-indigo-500/20"></div>
        )}
      </div>
    </div>
  );
};

export default SpendingDNA;
