import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    FaCalendarAlt, FaDownload, FaChartLine, FaRobot, FaUserCog, FaCreditCard, FaMoneyBillWave
} from 'react-icons/fa';
import { motion } from 'framer-motion';

import DashboardLayout from '../layouts/DashboardLayout';
import {
    GlassCard, GradientTitle, TabGroup, ActionButton, QuickStat
} from '../components/owner/ui/ModernComponents';
import SubscriptionOverview from "../components/owner/SubscriptionOverview.tsx";
import RecentTransactions from '../components/owner/RecentTransactions';

import OwnerPieCharts from '../components/owner/OwnerPieCharts';
import DeletionLogs from '../components/owner/DeletionLogs';
import SnackOverview from '../components/owner/SnackOverview'; // Import SnackOverview
import { useSessionExport } from '../components/owner/ExportSessionsReport';
import UserManagement from '../components/owner/UserManagement';

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

const OwnerDashboard: React.FC = () => {
    const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
    const [timeFilter, setTimeFilter] = useState('Today');

    const [chartMode, setChartMode] = useState<'hour' | 'day'>('hour');
    const [kpiStats, setKpiStats] = useState<KPIStat[]>([]);
    const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            const range = timeFilter.toLowerCase().replace(' ', '');

            try {
                // Fetch stats and revenue flow in parallel to avoid race conditions
                const [statsRes, flowRes] = await Promise.all([
                    fetch(`/api/owner/ownerstat?range=${range}`),
                    fetch(`/api/owner/revenueflow?range=${range}`)
                ]);

                const statsData = await statsRes.json();
                const flowData = await flowRes.json();

                setKpiStats(statsData.kpiStats || []);

                // Use flowData specifically for the chart
                setRevenueTrends(flowData.data || []);
                setChartMode(flowData.groupBy || 'hour');

            } catch (err) {
                console.error('❌ Dashboard data fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [timeFilter]);



    const filterOptions = ['Today', 'Yesterday', 'Last Week', 'This Month'];

    const { exportData, loading: exportLoading } = useSessionExport();

    const handleDownload = () => {
        exportData();
    };

    // Icon helper
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
                        <div className="time-filter-wrapper">
                            <TabGroup
                                options={filterOptions}
                                active={timeFilter}
                                onChange={setTimeFilter}
                            />
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

                {/* 3. Revenue + Floor */}
                <section className="operational-grid">
                    <div className="main-chart-area">
                        <GlassCard className="chart-panel">
                            <div className="panel-header">
                                <GradientTitle size="medium">Revenue Flow</GradientTitle>
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

                                        {/* X Axis = Hour */}
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

                                        {/* Y Axis = Revenue */}
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

                    <OwnerPieCharts timeFilter={timeFilter} />
                </section>

                {/* 4. Secondary */}
                <section className="secondary-grid">
                    <div className="pie-charts-area">
                        <RecentTransactions timeFilter={timeFilter} />
                    </div>
                    <div className="transactions-area">
                        <SubscriptionOverview />
                    </div>
                </section>

                {/* 5. Snacks & Deletion Audits */}
                <section className="snack-deletion-grid">
                    <SnackOverview />
                    <DeletionLogs />
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
