import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { useUserStore } from '../store/userStore';
import { onboardUser } from '../lib/api';
import { useTransactionStore } from '../store/transactionStore';
import { ArrowRight, ArrowLeft, CheckCircle, Target, Wallet, User, MapPin } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { isOnboarded, setIsOnboarded } = useUIStore();
  const { setProfile } = useUserStore();
  const { setTransactions } = useTransactionStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    income: '',
    city: 'Mumbai',
    savings: '',
    style: 'moderate',
    goalTitle: '',
    goalTarget: ''
  });

  if (isOnboarded) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const incomeNum = parseFloat(formData.income) || 50000;
      const savingsNum = parseFloat(formData.savings) || 10000;

      // 1. Send profile to backend (optional, if backend onboard route exists)
      try {
        await onboardUser({
          name: formData.name || 'User',
          monthly_income: incomeNum,
          current_savings: savingsNum,
          city: formData.city,
          spending_style: formData.style
        });
      } catch (e) {
        console.warn('Backend onboarding failed, proceeding locally', e);
      }

      // Start with empty real transactions as requested
      setTransactions([]);
      setProfile({
        name: formData.name || 'User',
        monthlyIncome: incomeNum,
        currentSavings: savingsNum,
        city: formData.city,
        spendingStyle: formData.style as any
      });

      // 3. Mark onboarded
      setIsOnboarded(true);
    } catch (err) {
      console.error('Onboarding failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-gray-800 bg-gray-950 shadow-2xl">
        {/* Header/Progress */}
        <div className="bg-gray-900/50 p-6 border-b border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-white">Welcome to Finehands</h2>
            <span className="text-sm font-medium text-gray-400">Step {step} of 3</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-800">
            <div 
              className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 h-96 overflow-y-auto">
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right fade-in">
              <div className="text-center mb-4">
                <User className="mx-auto h-12 w-12 text-blue-400 mb-3" />
                <h3 className="text-2xl font-semibold text-white">Let's get to know you</h3>
                <p className="text-gray-400 mt-2">Basic details to personalize your experience.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="John Doe" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Monthly Income (₹)</label>
                    <input type="number" name="income" value={formData.income} onChange={handleChange} className="w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 outline-none" placeholder="75000" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <select name="city" value={formData.city} onChange={handleChange} className="w-full appearance-none rounded-xl border border-gray-700 bg-gray-900 p-3 pl-9 text-white focus:border-blue-500 outline-none">
                        {['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right fade-in">
               <div className="text-center mb-4">
                <Wallet className="mx-auto h-12 w-12 text-green-400 mb-3" />
                <h3 className="text-2xl font-semibold text-white">Financial Baseline</h3>
                <p className="text-gray-400 mt-2">Where do you stand right now?</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Current Savings (₹)</label>
                  <input type="number" name="savings" value={formData.savings} onChange={handleChange} className="w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 outline-none" placeholder="150000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Spending Personality</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['frugal', 'moderate', 'lavish'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setFormData({ ...formData, style })}
                        className={`rounded-xl border p-3 capitalize transition-all ${
                          formData.style === style 
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right fade-in">
              <div className="text-center mb-4">
                <Target className="mx-auto h-12 w-12 text-purple-400 mb-3" />
                <h3 className="text-2xl font-semibold text-white">Set Your First Goal</h3>
                <p className="text-gray-400 mt-2">What are you saving for?</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Goal Name</label>
                  <input type="text" name="goalTitle" value={formData.goalTitle} onChange={handleChange} className="w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 outline-none" placeholder="New Laptop, Vacation, etc." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Target Amount (₹)</label>
                  <input type="number" name="goalTarget" value={formData.goalTarget} onChange={handleChange} className="w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 outline-none" placeholder="80000" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-800 bg-gray-900/50 p-6">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white ${step === 1 ? 'invisible' : ''}`}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => setStep(s => Math.min(3, s + 1))}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Get Started'} <CheckCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
