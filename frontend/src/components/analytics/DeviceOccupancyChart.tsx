import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

interface OccupancyData { occupied: number; remaining: number; }

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <g>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 5}
                startAngle={startAngle} endAngle={endAngle} fill={fill}
                style={{ filter: `drop-shadow(0 0 6px ${fill})` }}
            />
        </g>
    );
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { name, value, color } = payload[0].payload;
    return (
        <div style={{
            background: 'rgba(7,10,16,0.95)', border: `1px solid ${color}33`,
            borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem',
        }}>
            <div style={{ color: '#64748b', marginBottom: 2 }}>{name}</div>
            <div style={{ color, fontWeight: 700 }}>{value} devices</div>
        </div>
    );
};

const DeviceOccupancyChart: React.FC<{ data: OccupancyData; loading?: boolean }> = ({ data, loading }) => {
    const [activeIndex, setActiveIndex] = React.useState(0);

    const total = data.occupied + data.remaining;
    const rate = total > 0 ? Math.round((data.occupied / total) * 100) : 0;

    const chartData = [
        { name: 'Occupied', value: data.occupied || (total === 0 ? 0 : 0), color: '#fbbf24' },
        { name: 'Available', value: data.remaining || (total === 0 ? 1 : 0), color: '#dc2626' },
    ];

    if (loading) return <div className="an-skeleton">Loading…</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: '100%', height: 220, position: 'relative' }}>
                {/* Center overlay */}
                <div className="an-donut-center">
                    <div className="an-donut-pct">{rate}%</div>
                    <div className="an-donut-label">Occupied</div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            <linearGradient id="occGold" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#fbbf24" />
                            </linearGradient>
                            <linearGradient id="occRed" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#991b1b" />
                                <stop offset="100%" stopColor="#dc2626" />
                            </linearGradient>
                        </defs>
                        <Pie
                            {...({
                                data: total > 0 ? chartData : [{ ...chartData[0], value: 0 }, { ...chartData[1], value: 1 }],
                                cx: '50%', cy: '50%',
                                innerRadius: 70, outerRadius: 90,
                                paddingAngle: 3, dataKey: 'value',
                                activeIndex, activeShape: renderActiveShape,
                                onMouseEnter: (_: any, i: number) => setActiveIndex(i),
                                stroke: 'none',
                            } as any)}
                        >
                            {chartData.map((_, i) => (
                                <Cell key={i} fill={i === 0 ? 'url(#occGold)' : 'url(#occRed)'} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="an-occ-legend">
                {chartData.map(d => (
                    <span key={d.name} className="an-occ-item">
                        <span className="an-occ-dot" style={{ background: d.color }} />
                        {d.name}: <strong>{d.value}</strong>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default DeviceOccupancyChart;
