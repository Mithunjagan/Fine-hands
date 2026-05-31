import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const SimulatorChart = ({ data }) => {
  return (
    <div className="w-full h-[350px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#475569" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#475569" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
            tickFormatter={(value) => `$${(value/1000).toFixed(1)}k`} 
            axisLine={false}
            tickLine={false}
            dx={-10}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'rgba(2, 6, 23, 0.85)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '12px', 
              color: '#fff',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
            itemStyle={{ color: '#fff', fontWeight: 500 }}
            formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
          />
          <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#94a3b8' }}/>
          <Area
            type="monotone"
            dataKey="baseline"
            name="Baseline Savings"
            stroke="#64748b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorBaseline)"
            activeDot={{ r: 6, fill: "#64748b", stroke: "#fff", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="projected"
            name="Projected Post-Purchase"
            stroke="#06b6d4"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorProjected)"
            activeDot={{ r: 6, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimulatorChart;
