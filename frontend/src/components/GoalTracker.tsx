import React, { useState } from 'react';
import { useGoalStore } from '../store/goalStore';
import { useUserStore } from '../store/userStore';
import { Target, Plus, CheckCircle, Clock, AlertCircle, IndianRupee } from 'lucide-react';
import type { Goal } from '../types';

export const GoalTracker: React.FC = () => {
  const { goals, addGoal, updateGoalProgress, rescheduleGoal, isLoading } = useGoalStore();
  const { profile, setProfile } = useUserStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: '', deadline: '' });
  
  // Allocate savings states
  const [allocatingGoalId, setAllocatingGoalId] = useState<string | null>(null);
  const [allocationAmount, setAllocationAmount] = useState<string>('');
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newGoal.title || !newGoal.target || !newGoal.deadline) return;
    await addGoal({
      title: newGoal.title,
      target: parseFloat(newGoal.target),
      deadline: new Date(newGoal.deadline).toISOString().split('T')[0],
      icon: '🎯',
      color: '#6366F1'
    });
    setShowAdd(false);
    setNewGoal({ title: '', target: '', deadline: '' });
  };

  const handleReschedule = async (id: string, monthsToAdd: number) => {
    const today = new Date();
    today.setMonth(today.getMonth() + monthsToAdd);
    const newDeadline = today.toISOString().split('T')[0];
    await rescheduleGoal(id, newDeadline);
  };

  const handleAllocate = async (goal: Goal) => {
    setAllocationError(null);
    const amountToAllocate = parseFloat(allocationAmount);
    
    if (isNaN(amountToAllocate) || amountToAllocate <= 0) {
      setAllocationError('Enter a valid amount.');
      return;
    }

    const availableSavings = profile?.currentSavings || 0;
    if (amountToAllocate > availableSavings) {
      setAllocationError(`Limit exceeded. You only have ₹${availableSavings.toLocaleString()} in general savings.`);
      return;
    }

    // Calculate new current amount for goal
    const newCurrent = goal.current + amountToAllocate;
    if (newCurrent > goal.target) {
      setAllocationError(`Allocation would exceed target goal of ₹${goal.target.toLocaleString()}.`);
      return;
    }

    try {
      // 1. Update goal progress on backend/store
      await updateGoalProgress(goal.id, newCurrent);
      
      // 2. Subtract from user's general savings pool
      if (profile) {
        setProfile({
          ...profile,
          currentSavings: profile.currentSavings - amountToAllocate
        });
      }

      setAllocatingGoalId(null);
      setAllocationAmount('');
    } catch (err: any) {
      setAllocationError('Failed to allocate funds.');
    }
  };

  const getStatusConfig = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: <CheckCircle className="h-4 w-4" /> };
      case 'on_track': return { color: 'text-cyan-400', bg: 'bg-cyan-400/10', icon: <Target className="h-4 w-4" /> };
      case 'behind': return { color: 'text-amber-400', bg: 'bg-amber-400/10', icon: <AlertCircle className="h-4 w-4" /> };
      case 'overdue': return { color: 'text-red-400', bg: 'bg-red-400/10', icon: <Clock className="h-4 w-4" /> };
      default: return { color: 'text-gray-400', bg: 'bg-gray-800', icon: <Target className="h-4 w-4" /> };
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan-400 animate-pulse" />
            Smart Goal Tracker
          </h3>
          <p className="text-xs text-gray-400 mt-1">AI-augmented target dates and feasibility forecasting</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all font-medium text-xs flex items-center gap-1"
        >
          {showAdd ? 'Cancel' : <><Plus className="h-4 w-4" /> Add Goal</>}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 animate-in slide-in-from-top-2 fade-in">
          <div className="space-y-3">
            <input 
              placeholder="Goal Title (e.g. Car Downpayment)" 
              className="w-full rounded-lg bg-gray-950 border border-gray-800 p-2 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
              value={newGoal.title}
              onChange={e => setNewGoal({...newGoal, title: e.target.value})}
            />
            <div className="flex gap-3">
              <input 
                type="number"
                placeholder="Target Amount (₹)" 
                className="w-1/2 rounded-lg bg-gray-950 border border-gray-800 p-2 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                value={newGoal.target}
                onChange={e => setNewGoal({...newGoal, target: e.target.value})}
              />
              <input 
                type="date"
                className="w-1/2 rounded-lg bg-gray-950 border border-gray-800 p-2 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                value={newGoal.deadline}
                onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
              />
            </div>
            <button 
              onClick={handleAdd}
              disabled={isLoading || !newGoal.title || !newGoal.target || !newGoal.deadline}
              className="w-full rounded-lg bg-cyan-600 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors shadow-lg hover:shadow-cyan-500/20"
            >
              {isLoading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <Target className="h-10 w-10 text-gray-700" />
            <p className="text-sm">No active goals. Set one up!</p>
          </div>
        ) : (
          goals.map(goal => {
            const conf = getStatusConfig(goal.status);
            const radius = 24;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (goal.progress / 100) * circumference;

            // Feasibility Warnings based on User Profile Income
            const userIncome = profile?.monthlyIncome || 50000;
            const savingsRatio = goal.required_monthly / userIncome;
            const isHighlyAmbitious = savingsRatio > 0.40 && goal.status !== 'completed';

            return (
              <div key={goal.id} className="relative flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-950/50 p-4 transition-all hover:border-gray-700">
                <div className="flex items-center gap-4">
                  {/* Progress Ring */}
                  <div className="relative flex items-center justify-center h-16 w-16 flex-shrink-0">
                    <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r={radius} className="fill-none stroke-gray-800 stroke-[4]" />
                      <circle 
                        cx="30" cy="30" r={radius} 
                        className={`fill-none stroke-[4] transition-all duration-1000 ease-out ${conf.color.replace('text-', 'stroke-')}`}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-white">{Math.round(goal.progress)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white flex items-center gap-1">
                        <span className="mr-1">{goal.icon || '🎯'}</span> {goal.title}
                      </h4>
                      <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${conf.bg} ${conf.color}`}>
                        {conf.icon} {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex justify-between text-xs text-gray-400">
                      <span className="font-semibold text-white/90">₹{goal.current.toLocaleString()} / ₹{goal.target.toLocaleString()}</span>
                      <span className="text-[11px]">{goal.status === 'overdue' ? 'Deadline passed' : `${goal.days_remaining} days left`}</span>
                    </div>
                    
                    {goal.status !== 'completed' && goal.status !== 'overdue' && (
                      <div className="mt-2 text-[10px] text-gray-400 flex items-center justify-between bg-gray-900/40 p-1.5 rounded-lg border border-gray-800/50">
                        <span>Required monthly:</span>
                        <span className="text-cyan-400 font-semibold">₹{goal.required_monthly.toLocaleString()} / mo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overdue Rescheduling Banner */}
                {goal.status === 'overdue' && (
                  <div className="mt-1 border border-red-500/20 bg-red-500/5 rounded-xl p-3 text-xs text-gray-300 space-y-2">
                    <p className="flex items-center gap-1.5 text-red-400 font-bold">
                      <Clock className="w-3.5 h-3.5" /> Timeline Passed!
                    </p>
                    <p className="text-[11px] text-gray-400">
                      You need to save the entire ₹{(goal.target - goal.current).toLocaleString()} remaining. Adjust your target date to get a realistic savings plan:
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReschedule(goal.id, 6)}
                        className="flex-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 py-1.5 text-[10px] font-semibold text-white transition-all"
                      >
                        📅 Add 6 Months
                      </button>
                      <button 
                        onClick={() => handleReschedule(goal.id, 12)}
                        className="flex-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 py-1.5 text-[10px] font-semibold text-white transition-all"
                      >
                        📅 Add 1 Year
                      </button>
                    </div>
                  </div>
                )}

                {/* Ambitious Goal Warning */}
                {isHighlyAmbitious && (
                  <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-2.5 text-[11px] text-amber-300/95 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Ambitious Target:</span> This requires saving <span className="font-bold">{(savingsRatio * 100).toFixed(0)}%</span> of your monthly income (₹{userIncome.toLocaleString()}/mo). Consider adding <button onClick={() => handleReschedule(goal.id, 6)} className="underline hover:text-white font-bold">6 months</button> or <button onClick={() => handleReschedule(goal.id, 12)} className="underline hover:text-white font-bold">12 months</button> to make it feasible.
                    </div>
                  </div>
                )}

                {/* Inline Allocator Panel */}
                <div className="mt-1 pt-2 border-t border-gray-900/40 flex items-center justify-between">
                  {allocatingGoalId !== goal.id ? (
                    <>
                      <span className="text-[10px] text-gray-500">
                        General Pool: <span className="text-gray-400">₹{(profile?.currentSavings || 0).toLocaleString()}</span>
                      </span>
                      {goal.status !== 'completed' && (profile?.currentSavings || 0) > 0 && (
                        <button 
                          onClick={() => { setAllocatingGoalId(goal.id); setAllocationError(null); }}
                          className="flex items-center gap-1 rounded bg-cyan-950 border border-cyan-800/40 hover:bg-cyan-900 text-cyan-400 text-[10px] px-2 py-1 font-semibold transition-all"
                        >
                          <IndianRupee className="w-3 h-3" /> Allocate Savings
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full space-y-2 animate-in fade-in duration-200">
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          placeholder={`Amount (Max: ₹${(profile?.currentSavings || 0).toLocaleString()})`}
                          value={allocationAmount}
                          onChange={(e) => setAllocationAmount(e.target.value)}
                          className="flex-1 bg-gray-950 border border-gray-800 rounded p-1.5 text-xs text-white outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={() => handleAllocate(goal)}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold px-2.5 py-1.5 transition-all shrink-0"
                        >
                          Transfer
                        </button>
                        <button
                          onClick={() => setAllocatingGoalId(null)}
                          className="text-gray-400 hover:text-white text-xs px-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {allocationError && (
                        <p className="text-[10px] text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {allocationError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Lucide icon helper
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
