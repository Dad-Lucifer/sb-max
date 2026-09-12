import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PeakHourData { time: string; users: number; }

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

const PeakHoursChart: React.FC<{ data: PeakHourData[]; loading?: boolean }> = ({ data, loading }) => {
    if (loading) return <div className="an-skeleton">Loading…</div>;
    if (!data.length) return <div className="an-empty"><span>No data available</span></div>;

    return (
        <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                        <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="time"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false} tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false} tickLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                    <Area
                        type="monotone" dataKey="users"
                        stroke="#fbbf24" strokeWidth={2}
                        fill="url(#phGrad)"
                        dot={false} activeDot={{ r: 5, fill: '#fbbf24', stroke: '#070a10', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PeakHoursChart;
