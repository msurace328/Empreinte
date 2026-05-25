'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { date: 'May 19', score: 92 },
    { date: 'May 20', score: 91 },
    { date: 'May 21', score: 94 },
    { date: 'May 22', score: 93 },
    { date: 'May 23', score: 95 },
    { date: 'May 24', score: 94 },
    { date: 'May 25', score: 96 },
];

export function TrustTrendChart() {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5EE6C9" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#5EE6C9" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}
                    />
                    <YAxis
                        domain={[80, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#15191E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                        itemStyle={{ color: '#5EE6C9', fontFamily: 'var(--font-jetbrains-mono)', fontSize: '12px' }}
                        labelStyle={{ color: '#94A3B8', fontSize: '10px', marginBottom: '4px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#5EE6C9"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
