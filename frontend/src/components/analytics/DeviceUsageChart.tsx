import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DeviceUsageData { name: string; usage: number; }

const PALETTE = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(7,10,16,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '0.82rem',
        }}>
            <div style={{ color: '#64748b', marginBottom: 2 }}>{label}</div>
            <div style={{ color: '#fbbf24', fontWeight: 700 }}>{payload[0].value} sessions</div>
        </div>
    );
};

const DeviceUsageChart: React.FC<{ data: DeviceUsageData[]; loading?: boolean }> = ({ data, loading }) => {
    if (loading) return <div className="an-skeleton">Loading…</div>;
    if (!data.length) return <div className="an-empty"><span>No usage data</span></div>;

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="usage" radius={[0, 5, 5, 0]} barSize={18}>
                        {data.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DeviceUsageChart;
