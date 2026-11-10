import api from '../utils/api';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    FaCalendarAlt, FaDownload, FaChartLine, FaRobot, FaUserCog, FaCreditCard, FaMoneyBillWave, FaChevronDown
} from 'react-icons/fa';
import { motion } from 'framer-motion';

import DashboardLayout from '../layouts/DashboardLayout';
import {
    GlassCard, GradientTitle, ActionButton, QuickStat, TabGroup
} from '../components/owner/ui/ModernComponents';
import SubscriptionOverview from "../components/owner/SubscriptionOverview.tsx";
import RecentTransactions from '../components/owner/RecentTransactions';

import OwnerPieCharts from '../components/owner/OwnerPieCharts';
import DeletionLogs from '../components/owner/DeletionLogs';
import SnackOverview from '../components/owner/SnackOverview';
import { useSessionExport } from '../components/owner/ExportSessionsReport';
import UserManagement from '../components/owner/UserManagement';

import { getAvailableMonths, type MonthOption } from '../utils/monthFilter';

import './OwnerDashboard.css';

interface KPIStat {
    label: string;
    value: string | number;
    trend: number;
}

const LiveClock: React.FC = React.memo(() => {
    const [time, setTime] = useState(() => new Date().toLocaleTimeString());

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return <div className="live-clock">{time}</div>;
});

// ─── Month Dropdown ──────────────────────────────────────────────────────────
interface MonthDropdownProps {
    months: MonthOption[];
    selected: MonthOption;
    onChange: (m: MonthOption) => void;
}

const MonthDropdown: React.FC<MonthDropdownProps> = ({ months, selected, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(220,38,38,0.12)',
                    border: '1px solid rgba(220,38,38,0.35)',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.2s'
                }}
            >
                <FaCalendarAlt size={13} style={{ color: '#dc2626' }} />
                {selected.label}
                {months.indexOf(selected) === 0 && (
                    <span style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        background: 'rgba(220,38,38,0.25)',
                        border: '1px solid rgba(220,38,38,0.4)',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        color: '#fca5a5',
                        letterSpacing: '1px'
                    }}>CURRENT</span>
                )}
                <FaChevronDown size={10} style={{ opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    background: '#0d0d12',
                    border: '1px solid rgba(220,38,38,0.25)',
                    borderRadius: '10px',
                    minWidth: '200px',
                    zIndex: 300,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
                }}>
                    {months.map((m, idx) => (
                        <button
                            key={m.key}
                            onClick={() => { onChange(m); setOpen(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '11px 16px',
                                background: selected.key === m.key ? 'rgba(220,38,38,0.12)' : 'transparent',
                                border: 'none',
                                color: selected.key === m.key ? '#fff' : '#94a3b8',
                                fontSize: '0.85rem',
                                fontWeight: selected.key === m.key ? 600 : 400,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={e => (e.currentTarget.style.background = selected.key === m.key ? 'rgba(220,38,38,0.12)' : 'transparent')}
                        >
                            <span>{m.label}</span>
                            <span style={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                letterSpacing: '0.8px',
                                background: idx === 0 ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.07)',
                                color: idx === 0 ? '#fca5a5' : '#64748b',
                                border: idx === 0 ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(255,255,255,0.08)'
                            }}>
                                {idx === 0 ? 'CURRENT' : 'PREVIOUS'}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Dashboard Component ─────────────────────────────────────────────────
const OwnerDashboard: React.FC = () => {
    const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

    // Month options — recalculated on load and when tab regains focus
    const [monthOptions, setMonthOptions] = useState<MonthOption[]>(() => getAvailableMonths());
    const [selectedMonth, setSelectedMonth] = useState<MonthOption>(() => getAvailableMonths()[0]);

    // Sub-filter for Current Month: All Month | Today | Yesterday | Day after Yesterday
    const [subFilter, setSubFilter] = useState('All Month');
    const subFilterOptions = ['All Month', 'Today', 'Yesterday', 'Day after Yesterday'];

    const isCurrentMonth = selectedMonth.key === monthOptions[0].key;
    const activeDailyFilter = isCurrentMonth && subFilter !== 'All Month' ? subFilter : undefined;

    const [chartMode, setChartMode] = useState<'hour' | 'day'>('day');
    const [kpiStats, setKpiStats] = useState<KPIStat[]>([]);
    const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleMonthChange = (m: MonthOption) => {
        setSelectedMonth(m);
        setSubFilter('All Month'); // reset sub-filter on month switch
    };

    // Detect month boundary when dashboard regains focus
    useEffect(() => {
        const handleFocus = () => {
            const freshMonths = getAvailableMonths();
            if (freshMonths[0].key !== monthOptions[0].key) {
                setMonthOptions(freshMonths);
                setSelectedMonth(freshMonths[0]);
                setSubFilter('All Month');
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [monthOptions]);

    // Fetch KPI stats + revenue flow
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        const month = selectedMonth.key;
        const hasDailyFilter = isCurrentMonth && subFilter !== 'All Month';

        try {
            let statsUrl: string;
            let flowUrl: string;

            if (hasDailyFilter) {
                const rangeParam = subFilter.toLowerCase().replace(/\s+/g, '');
                statsUrl = `/api/owner/ownerstat?range=${rangeParam}`;
                flowUrl = `/api/owner/revenueflow?range=${rangeParam}`;
            } else {
                statsUrl = `/api/owner/month/stats?month=${month}`;
                flowUrl = `/api/owner/month/revenueflow?month=${month}`;
            }

            const [statsRes, flowRes] = await Promise.all([
                api.get(statsUrl),
                api.get(flowUrl)
            ]);

            const statsData = statsRes.data;
            const flowData = flowRes.data;

            setKpiStats(statsData.kpiStats || []);
            setRevenueTrends(flowData.data || []);
            setChartMode(flowData.groupBy || (hasDailyFilter ? 'hour' : 'day'));
        } catch (err) {
            console.error('❌ Dashboard data fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth.key, isCurrentMonth, subFilter]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const { exportData, loading: exportLoading } = useSessionExport(selectedMonth.key, activeDailyFilter);

    const handleDownload = () => {
        exportData();
    };

    const getIconForLabel = (label: string) => {
        const lower = label.toLowerCase();
        if (lower.includes('online')) return FaCreditCard;
        if (lower.includes('cash')) return FaMoneyBillWave;
        if (lower.includes('revenue')) return FaChartLine;
        if (lower.includes('time')) return FaCalendarAlt;
        return FaRobot;
    };

    return (
        <DashboardLayout>
            <div className="owner-dashboard-container">

                {/* 1. Header */}
                <motion.header
                    className="dashboard-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="header-left">
                        <h1 className="header-title">Command Center</h1>
                        <p className="header-subtitle">
                            <FaUserCog className="inline-icon" /> Welcome back, Owner
                        </p>
                    </div>

                    <div className="header-center">
                        <LiveClock />
                    </div>

                    <div className="header-actions">
                        <div className="time-filter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <MonthDropdown
                                months={monthOptions}
                                selected={selectedMonth}
                                onChange={handleMonthChange}
                            />
                            {/* Daily sub-filter shown ONLY for Current Month */}
                            {isCurrentMonth && (
                                <TabGroup
                                    options={subFilterOptions}
                                    active={subFilter}
                                    onChange={setSubFilter}
                                />
                            )}
                        </div>
                        <div className="header-buttons-group">
                            <ActionButton
                                icon={FaDownload}
                                label={exportLoading ? "Exporting..." : "Export"}
                                onClick={handleDownload}
                                variant="primary"
                            />
                            <ActionButton
                                icon={FaUserCog}
                                label="Manage User"
                                onClick={() => setIsUserManagementOpen(true)}
                                variant="ghost"
                            />
                        </div>
                    </div>
                </motion.header>

                {/* 2. KPI Cards */}
                <section className="hero-stats-grid">
                    {!loading && kpiStats.map((stat, idx) => (
                        <QuickStat
                            key={idx}
                            label={stat.label}
                            value={String(stat.value)}
                            trend={Number(stat.trend) || 0}
                            icon={getIconForLabel(stat.label)}
                            delay={idx * 0.1}
                        />
                    ))}
                </section>

                {/* 3. Revenue + Machine Pie */}
                <section className="operational-grid">
                    <div className="main-chart-area">
                        <GlassCard className="chart-panel">
                            <div className="panel-header">
                                <GradientTitle size="medium">
                                    Revenue Flow — {isCurrentMonth && subFilter !== 'All Month' ? `${subFilter} (${selectedMonth.label})` : selectedMonth.label}
                                </GradientTitle>
                            </div>

                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                                    <AreaChart data={revenueTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.45} />
                                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(255,255,255,0.05)"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="time"
                                            stroke="#64748b"
                                            fontSize={11}
                                            tickFormatter={(val) =>
                                                chartMode === 'hour' ? `${val}:00` : val
                                            }
                                            tickLine={false}
                                            axisLine={false}
                                            minTickGap={16}
                                        />

                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={11}
                                            tickFormatter={(v) => `₹${v}`}
                                            tickLine={false}
                                            axisLine={false}
                                        />

                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0c0c10',
                                                border: '1px solid rgba(220,38,38,0.3)',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem'
                                            }}
                                            formatter={(value?: number) => [`₹${value ?? 0}`, 'Revenue']}
                                            labelFormatter={(label) =>
                                                chartMode === 'hour' ? `${label}:00` : label
                                            }
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#dc2626"
                                            strokeWidth={3}
                                            fill="url(#colorRev)"
                                            dot={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    </div>

                    <OwnerPieCharts
                        monthKey={selectedMonth.key}
                        timeFilter={activeDailyFilter}
                    />
                </section>

                {/* 4. Secondary */}
                <section className="secondary-grid">
                    <div className="pie-charts-area">
                        <RecentTransactions
                            monthKey={selectedMonth.key}
                            timeFilter={activeDailyFilter}
                        />
                    </div>
                    <div className="transactions-area">
                        <SubscriptionOverview />
                    </div>
                </section>

                {/* 5. Snacks & Deletion Audits */}
                <section className="snack-deletion-grid">
                    <SnackOverview />
                    <DeletionLogs
                        monthKey={selectedMonth.key}
                        timeFilter={activeDailyFilter}
                    />
                </section>

            </div>

            <UserManagement
                isOpen={isUserManagementOpen}
                onClose={() => setIsUserManagementOpen(false)}
            />
        </DashboardLayout>
    );
};

export default OwnerDashboard;
