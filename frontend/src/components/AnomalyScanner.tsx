import React, { useState } from 'react';
import type { Anomaly } from '../types';
import { AlertTriangle, CheckCircle2, ShieldAlert, Zap, X } from 'lucide-react';
import { useTransactionStore } from '../store/transactionStore';

interface AnomalyScannerProps {
  anomalies: Anomaly[];
  onDismiss: (id: string) => void;
  onInvestigate: (id: string) => void;
  isScanning?: boolean;
}

export const AnomalyScanner: React.FC<AnomalyScannerProps> = ({ anomalies, onDismiss, isScanning }) => {
  const { transactions } = useTransactionStore();
  const [activeAnomaly, setActiveAnomaly] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'alert': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="h-5 w-5 text-red-400" />;
      case 'alert': return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      default: return <Zap className="h-5 w-5 text-yellow-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            Anomaly Scanner
          </h3>
          <p className="text-sm text-gray-400">AI-powered outlier detection</p>
        </div>
        {isScanning && (
          <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Scanning...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {transactions.length === 0 && !isScanning ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-500 gap-3">
            <AlertTriangle className="h-10 w-10 text-gray-600 animate-pulse" />
            <h4 className="text-sm font-semibold text-gray-400">No Transactions Logged</h4>
            <p className="text-xs text-gray-500 leading-normal max-w-xs">
              Add transactions to scan for budget outliers or subscription leaks.
            </p>
          </div>
        ) : anomalies.length === 0 && !isScanning ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500/50" />
            <p>No anomalies detected</p>
          </div>
        ) : (
          anomalies.map((anomaly) => (
            <div 
              key={anomaly.transaction.id}
              className={`rounded-xl border p-4 transition-all duration-300 ${
                activeAnomaly === anomaly.transaction.id 
                  ? 'border-blue-500/50 bg-blue-500/10' 
                  : 'border-gray-800 bg-gray-950/50 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`rounded-lg p-2 ${getSeverityColor(anomaly.severity)}`}>
                    {getSeverityIcon(anomaly.severity)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{anomaly.transaction.vendor}</h4>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{anomaly.explanation}</p>
                    
                    {activeAnomaly === anomaly.transaction.id && (
                      <div className="mt-3 grid grid-cols-2 gap-4 text-xs bg-black/40 p-3 rounded-lg">
                        <div>
                          <span className="text-gray-500 block">Z-Score</span>
                          <span className="text-white font-mono">{anomaly.z_score.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Category Avg</span>
                          <span className="text-white font-mono">₹{anomaly.category_mean.toFixed(0)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="font-semibold text-white">₹{anomaly.transaction.amount.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onDismiss(anomaly.transaction.id)}
                      className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setActiveAnomaly(activeAnomaly === anomaly.transaction.id ? null : anomaly.transaction.id)}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 px-2 py-1 bg-blue-400/10 hover:bg-blue-400/20 rounded-md transition-colors"
                    >
                      {activeAnomaly === anomaly.transaction.id ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
