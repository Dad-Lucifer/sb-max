import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GrowthData { day: string; lastMonth: number; thisMonth: number; }

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(7,10,16,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            minWidth: 140,
        }}>
            <div style={{ color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Day {label}</div>
            {payload.map((p: any) => (
                <div key={p.dataKey} style={{ color: p.color, marginBottom: 3, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ color: '#94a3b8' }}>{p.name}</span>
                    <span style={{ fontWeight: 700 }}>{p.value}</span>
                </div>
            ))}
        </div>
    );
};

const GrowthComparisonChart: React.FC<{ data: GrowthData[]; loading?: boolean }> = ({ data, loading }) => {
    if (loading) return <div className="an-skeleton">Loading…</div>;
    if (!data.length) return <div className="an-empty"><span>No growth data</span></div>;

    return (
        <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
                    <Legend
                        wrapperStyle={{ fontSize: '0.78rem', color: '#64748b', paddingTop: 12 }}
                        iconType="circle" iconSize={8}
                    />
                    <Line
                        type="monotone" dataKey="lastMonth" name="Last Month"
                        stroke="#334155" strokeWidth={2} dot={false}
                        activeDot={{ r: 4, fill: '#334155' }}
                    />
                    <Line
                        type="monotone" dataKey="thisMonth" name="This Month"
                        stroke="#fbbf24" strokeWidth={2.5} dot={false}
                        activeDot={{ r: 5, fill: '#fbbf24', stroke: '#070a10', strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GrowthComparisonChart;
