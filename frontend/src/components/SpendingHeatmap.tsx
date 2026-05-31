import React, { useMemo } from 'react';
import type { HeatmapDay } from '../types';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';

interface SpendingHeatmapProps {
  data: HeatmapDay[];
  months?: number;
}

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({ data, months = 6 }) => {
  const isDataEmpty = !data || data.length === 0 || data.every(d => d.total === 0);

  if (isDataEmpty) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/10 p-8 backdrop-blur-md text-center flex flex-col items-center justify-center min-h-[260px]">
        <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 mb-4 animate-pulse">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Insufficient Transaction Data</h3>
        <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
          We need your real transaction history to plot your daily spending patterns. Currently, no transactions have been logged or uploaded.
        </p>
        <div className="bg-gray-950/60 rounded-xl p-4 border border-gray-800 text-left text-xs text-gray-300 max-w-lg space-y-2">
          <p className="font-semibold text-emerald-400 flex items-center gap-1.5">⚡ What you need to do:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-1">
            <li>Click <strong className="text-white">Scan Receipt</strong> in the bottom quick menu to scan any shopping invoice.</li>
            <li>Click <strong className="text-white">Add Txn</strong> to manually log your latest expenditure.</li>
            <li>Upload a bank statement file to import your full history instantly.</li>
          </ul>
        </div>
      </div>
    );
  }

  const { grid, maxValue } = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, months * 30));
    const allDays = eachDayOfInterval({ start: startDate, end: today });
    
    // Map dates to data values
    const dataMap = new Map(data.map(d => [d.date, d]));
    let max = 0;

    const formattedGrid = allDays.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayData = dataMap.get(dateStr) || { date: dateStr, total: 0, count: 0, topCategory: 'none' };
      if (dayData.total > max) max = dayData.total;
      return dayData;
    });

    return { grid: formattedGrid, maxValue: max };
  }, [data, months]);

  const getColorClass = (value: number) => {
    if (value === 0) return 'bg-gray-800/50';
    const ratio = value / (maxValue || 1);
    if (ratio < 0.2) return 'bg-emerald-900/40 text-emerald-500';
    if (ratio < 0.5) return 'bg-emerald-700/60 text-emerald-400';
    if (ratio < 0.8) return 'bg-yellow-600/60 text-yellow-400';
    return 'bg-red-500/80 text-red-100 shadow-[0_0_10px_rgba(239,68,68,0.5)]'; // High spending is red
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Spending Activity</h3>
        <p className="text-sm text-gray-400">Daily transaction volume over the last {months} months</p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[600px]">
          <div className="flex gap-1">
            {/* Split grid into weeks (columns of 7) */}
            {Array.from({ length: Math.ceil(grid.length / 7) }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {grid.slice(weekIndex * 7, weekIndex * 7 + 7).map((day: any) => (
                  <div
                    key={day.date}
                    className={`group relative h-4 w-4 cursor-help rounded-[3px] transition-colors hover:ring-2 hover:ring-white/50 ${getColorClass(day.total)}`}
                  >
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 scale-95 whitespace-nowrap rounded-lg bg-gray-950 px-3 py-2 text-xs opacity-0 shadow-xl ring-1 ring-white/10 transition-all group-hover:scale-100 group-hover:opacity-100">
                      <p className="font-medium text-white">{format(new Date(day.date), 'MMM d, yyyy')}</p>
                      {day.total > 0 ? (
                        <>
                          <p className="text-gray-300">₹{day.total.toLocaleString()} ({day.count} txns)</p>
                          <p className="mt-1 capitalize text-blue-400">{day.topCategory}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">No spending</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-400">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-gray-800/50" />
        <div className="h-3 w-3 rounded-sm bg-emerald-900/40" />
        <div className="h-3 w-3 rounded-sm bg-emerald-700/60" />
        <div className="h-3 w-3 rounded-sm bg-yellow-600/60" />
        <div className="h-3 w-3 rounded-sm bg-red-500/80" />
        <span>More</span>
      </div>
    </div>
  );
};
