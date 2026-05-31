import React, { useState, useRef } from 'react';
import { processReceipt } from '../lib/api';
import type { ReceiptResult } from '../types';
import { Camera, Upload, Loader2, Plus, Edit2, Check, X } from 'lucide-react';

interface ReceiptOCRProps {
  onAddTransaction: (txn: any) => void;
}

export const ReceiptOCR: React.FC<ReceiptOCRProps> = ({ onAddTransaction }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedResult, setEditedResult] = useState<ReceiptResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImage(base64);
      setLoading(true);
      try {
        // Strip data:image/jpeg;base64, prefix for API
        const base64Data = base64.split(',')[1];
        const res = await processReceipt(base64Data);
        setResult(res);
        setEditedResult(res);
      } catch (err) {
        console.error('OCR Failed', err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!editedResult) return;
    onAddTransaction({
      vendor: editedResult.vendor,
      amount: editedResult.amount,
      category: editedResult.category,
      date: editedResult.date,
    });
    // Reset state after adding
    setImage(null);
    setResult(null);
    setEditedResult(null);
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Camera className="h-5 w-5 text-purple-400" />
          Smart Receipt Scanner
        </h3>
      </div>

      {!image ? (
        <div 
          className={`relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
            isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-950/50 hover:border-gray-600 hover:bg-gray-900'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
            accept="image/*" 
            className="hidden" 
          />
          <Upload className="mb-3 h-8 w-8 text-gray-500" />
          <p className="font-medium text-gray-300">Click or drag receipt here</p>
          <p className="mt-1 text-xs text-gray-500">Supports JPG, PNG (Max 5MB)</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="relative h-64 overflow-hidden rounded-xl border border-gray-800 bg-black">
            <img src={image} alt="Receipt" className="h-full w-full object-contain opacity-80" />
            <button 
              onClick={() => { setImage(null); setResult(null); setEditedResult(null); }}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
                <span className="text-sm font-medium text-purple-200">Analyzing Receipt...</span>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex flex-col">
            {result && editedResult ? (
              <div className="flex-1 rounded-xl border border-gray-800 bg-gray-950/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium text-white">Extracted Data</h4>
                  <button 
                    onClick={() => setEditing(!editing)} 
                    className="text-xs flex items-center gap-1 text-gray-400 hover:text-white"
                  >
                    {editing ? <Check className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                    {editing ? 'Done' : 'Edit'}
                  </button>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Vendor</label>
                    {editing ? (
                      <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" value={editedResult.vendor} onChange={e => setEditedResult({...editedResult, vendor: e.target.value})} />
                    ) : (
                      <div className="font-medium text-white">{editedResult.vendor}</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Amount</label>
                      {editing ? (
                        <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" value={editedResult.amount} onChange={e => setEditedResult({...editedResult, amount: parseFloat(e.target.value)})} />
                      ) : (
                        <div className="font-semibold text-white">₹{editedResult.amount}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Date</label>
                      {editing ? (
                        <input type="date" className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" value={editedResult.date.split('T')[0]} onChange={e => setEditedResult({...editedResult, date: new Date(e.target.value).toISOString()})} />
                      ) : (
                        <div className="text-gray-300">{editedResult.date.split('T')[0]}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Category</label>
                    {editing ? (
                      <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white capitalize" value={editedResult.category} onChange={e => setEditedResult({...editedResult, category: e.target.value})} />
                    ) : (
                      <div className="inline-block rounded-md bg-gray-800 px-2 py-1 text-xs capitalize text-gray-300">{editedResult.category}</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {editedResult.source === 'ai_vision' ? '✨ AI Extracted' : '🔧 Mock Data'}
                  </span>
                  <button 
                    onClick={handleSubmit}
                    className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add Txn
                  </button>
                </div>
              </div>
            ) : !loading && (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                Data will appear here
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
