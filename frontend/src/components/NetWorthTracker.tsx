import React from 'react';
import { TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import type { NetWorthData } from '../types';

interface NetWorthTrackerProps {
  data: NetWorthData;
}

export const NetWorthTracker: React.FC<NetWorthTrackerProps> = ({ data }) => {
  const isUp = data.month_over_month.direction === 'up';

  // Find min/max for sparkline scaling
  const values = data.trend.map(t => t.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid div by 0

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4" />
            Total Net Worth
          </h3>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white tracking-tight">
              ₹{data.net_worth.toLocaleString()}
            </span>
            <span className={`flex items-center gap-1 text-sm font-medium mb-1 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(data.month_over_month.percentage)}%
            </span>
          </div>
        </div>

        {/* Minimal SVG Sparkline */}
        <div className="h-12 w-24">
          <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
            <path
              d={`M ${data.trend.map((t, i) => {
                const x = (i / (data.trend.length - 1)) * 100;
                const y = 40 - ((t.value - min) / range) * 40;
                return `${x},${y}`;
              }).join(' L ')}`}
              fill="none"
              stroke={isUp ? '#34d399' : '#f87171'} // emerald-400 / red-400
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Gradient Fill under line */}
            <path
              d={`M 0,40 L ${data.trend.map((t, i) => {
                const x = (i / (data.trend.length - 1)) * 100;
                const y = 40 - ((t.value - min) / range) * 40;
                return `${x},${y}`;
              }).join(' L ')} L 100,40 Z`}
              fill={`url(#gradient-${isUp ? 'up' : 'down'})`}
              opacity="0.2"
            />
            <defs>
              <linearGradient id="gradient-up" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gradient-down" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity="1" />
                <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};
