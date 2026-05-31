import React, { useState } from 'react';
import { X, Check, IndianRupee, Calendar, Tag, ShieldAlert } from 'lucide-react';
import type { Transaction } from '../types';

interface AddTransactionFormProps {
  onClose: () => void;
  onAddTransaction: (txn: Omit<Transaction, 'id'>) => void;
}

const CATEGORIES = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'transport', label: 'Transport' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'bills', label: 'Bills & Utilities' },
  { value: 'investment', label: 'Investments & Savings' },
  { value: 'other', label: 'Other Expenses' }
];

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ onClose, onAddTransaction }) => {
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('shopping');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubscription, setIsSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!vendor.trim()) {
      setError('Please enter a vendor or payee name.');
      return;
    }

    if (!date) {
      setError('Please select a transaction date.');
      return;
    }

    onAddTransaction({
      amount: parsedAmount,
      vendor: vendor.trim(),
      category: category.toLowerCase(),
      date: new Date(date).toISOString(),
      isSubscription,
      status: 'active'
    });
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/95 p-6 backdrop-blur-md shadow-2xl relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 transition-colors">
        <X className="h-5 w-5" />
      </button>

      <div className="mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-cyan-400" />
          Add Transaction Manually
        </h3>
        <p className="text-xs text-gray-400 mt-1">Log a new expense or investment to update your live financial score.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1500" 
              className="w-full rounded-xl border border-gray-700 bg-gray-950/70 p-3 pl-7 text-white focus:border-cyan-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Vendor */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor / Payee</label>
          <input 
            type="text" 
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Starbucks, Reliance Retail, atg-investments" 
            className="w-full rounded-xl border border-gray-700 bg-gray-950/70 p-3 text-white focus:border-cyan-500 outline-none transition-colors"
          />
        </div>

        {/* Category & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Category
            </label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-700 bg-gray-950/70 p-3 text-white focus:border-cyan-500 outline-none"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date
            </label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-950/70 p-3 text-white focus:border-cyan-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Subscription toggle */}
        <div className="flex items-center gap-3 bg-gray-950/30 p-3 rounded-xl border border-gray-800/40">
          <input 
            type="checkbox" 
            id="isSubscription"
            checked={isSubscription}
            onChange={(e) => setIsSubscription(e.target.checked)}
            className="w-4.5 h-4.5 rounded border-gray-700 bg-gray-950 accent-cyan-500 cursor-pointer"
          />
          <label htmlFor="isSubscription" className="text-xs font-medium text-gray-300 cursor-pointer">
            This is a recurring monthly subscription (e.g., Netflix, gym fee)
          </label>
        </div>

        {/* Error notice */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button 
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-cyan-500/25"
        >
          <Check className="h-4 w-4" /> Save Transaction
        </button>
      </form>
    </div>
  );
};
