import React, { useState, useRef } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { uploadStatement } from '../lib/api';
import { Upload, FileText, Loader2, Check, AlertCircle, X, Sparkles } from 'lucide-react';
import type { Transaction } from '../types';

interface BankStatementUploadProps {
  onClose: () => void;
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

export const BankStatementUpload: React.FC<BankStatementUploadProps> = ({ onClose }) => {
  const { setTransactions } = useTransactionStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedTxns, setParsedTxns] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = async (selectedFile: File) => {
    setError(null);
    setParsedTxns([]);
    setFile(selectedFile);
    setLoading(true);

    try {
      const res = await uploadStatement(selectedFile);
      if (res.error) {
        throw new Error(res.error);
      }
      setParsedTxns(res.transactions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to parse and classify bank statement.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleCategoryChange = (index: number, newCat: string) => {
    setParsedTxns(prev => prev.map((t, i) => i === index ? { ...t, category: newCat } : t));
  };

  const handleSubscriptionToggle = (index: number) => {
    setParsedTxns(prev => prev.map((t, i) => i === index ? { ...t, isSubscription: !t.isSubscription } : t));
  };

  const handleVendorChange = (index: number, newVendor: string) => {
    setParsedTxns(prev => prev.map((t, i) => i === index ? { ...t, vendor: newVendor } : t));
  };

  const handleImport = () => {
    if (parsedTxns.length === 0) return;
    setTransactions(parsedTxns);
    onClose();
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/95 p-6 backdrop-blur-md shadow-2xl relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1">
        <X className="h-5 w-5" />
      </button>

      <div className="mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          AI-Powered Bank Statement Importer
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Upload bank statement PDFs, CSVs, or JSON files. Our AI cleans, extracts, and tags every transaction instantly.
        </p>
      </div>

      {!file && !loading ? (
        <div 
          className={`flex h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${
            isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 bg-gray-950/50 hover:border-emerald-500/30 hover:bg-gray-900/60'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} 
            accept=".csv,.json,.pdf" 
            className="hidden" 
          />
          <Upload className="mb-3 h-8 w-8 text-gray-500 group-hover:text-emerald-400 transition-colors" />
          <p className="font-medium text-gray-300">Click or drag bank statement file here</p>
          <p className="mt-1 text-xs text-gray-500">Supports PDF, CSV, and JSON formats</p>
        </div>
      ) : loading ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-950/30 backdrop-blur-sm p-6 text-center">
          <Loader2 className="mb-3 h-8 w-8 text-emerald-400 animate-spin" />
          <p className="font-medium text-emerald-300 flex items-center gap-1.5 justify-center">
            <Sparkles className="h-4 w-4 animate-pulse" /> Money Doctor AI is processing statement...
          </p>
          <p className="mt-2 text-xs text-gray-500 max-w-sm">
            Extracting text, cleaning merchants, mapping categories, and parsing subscription tags using zero-temperature LLM models.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-950/50 border border-gray-800 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-sm font-semibold text-white truncate max-w-[250px]">{file?.name}</div>
                <div className="text-[10px] text-gray-500">
                  {file ? (file.size / 1024).toFixed(1) : 0} KB • {parsedTxns.length} AI-Extracted Transactions
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setParsedTxns([]); }}
              className="text-xs text-red-400 hover:text-red-300 font-medium px-2.5 py-1 border border-red-500/10 hover:border-red-500/35 rounded-lg bg-red-500/5 transition-all"
            >
              Clear
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-800 rounded-xl bg-gray-950/20 custom-scrollbar">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-gray-950/50 border-b border-gray-800 text-gray-400 uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Cleaned Vendor</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Sub?</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-gray-300">
                {parsedTxns.map((t, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 text-gray-400 shrink-0">{t.date.split('T')[0]}</td>
                    <td className="p-3 font-medium text-white min-w-[120px]">
                      <input
                        type="text"
                        value={t.vendor}
                        onChange={(e) => handleVendorChange(idx, e.target.value)}
                        className="bg-transparent hover:bg-gray-800 focus:bg-gray-900 border-none rounded px-1.5 py-0.5 text-white w-full focus:outline-cyan-500/60"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={t.category}
                        onChange={(e) => handleCategoryChange(idx, e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded px-1 py-0.5 text-[10px] text-gray-300 focus:outline-emerald-500"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={t.isSubscription}
                        onChange={() => handleSubscriptionToggle(idx)}
                        className="w-3.5 h-3.5 rounded border-gray-700 bg-gray-950 accent-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-right font-bold text-white shrink-0">
                      ₹{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleImport}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-emerald-500/25"
            >
              <Check className="h-4 w-4" /> Import {parsedTxns.length} Verified Transactions
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 border-t border-gray-800/50 pt-3 text-[11px] text-gray-500 space-y-1">
        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
          <Sparkles className="h-3 w-3" />
          <span>Intelligent Extraction Matrix</span>
        </div>
        <p className="text-gray-400">
          PDF statement text is mapped dynamically. CSV files do not require rigid headers—our AI handles any description format cleanly!
        </p>
      </div>
    </div>
  );
};
