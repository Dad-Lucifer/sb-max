import React, { useEffect, useState, useCallback } from 'react';
import api, { API_BASE_URL } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUserFriends, FaGamepad, FaHamburger,
    FaTrophy, FaClock, FaSync
} from 'react-icons/fa';
import { MdDashboard, MdFastfood } from 'react-icons/md';
import { io } from 'socket.io-client';

import DashboardLayout from '../layouts/DashboardLayout';

import DeviceOccupancyChart from '../components/analytics/DeviceOccupancyChart';
import PeakHoursChart from '../components/analytics/PeakHoursChart';
import DeviceUsageChart from '../components/analytics/DeviceUsageChart';
import SnacksConsumptionChart from '../components/analytics/SnacksConsumptionChart';
import GrowthComparisonChart from '../components/analytics/GrowthComparisonChart';
import BattleLeaderboard from '../components/analytics/BattleLeaderboard';
import ThunderCoinsLeaderboard from '../components/analytics/ThunderCoinsLeaderboard';
import BattleHistory from '../components/analytics/BattleHistory';

import './Analytics.css';

/* ── Types ── */
export interface PeakHourData { time: string; users: number; }
export interface DeviceUsageData { name: string; usage: number; }
export interface GrowthData { day: string; lastMonth: number; thisMonth: number; }
export interface OccupancyData { occupied: number; remaining: number; }
export interface SnackData { name: string; value: number; }
export interface BattleEntry { name: string; wins: number; totalBattles: number; totalScore: number; winRate: number; }
export interface CoinEntry { phone: string; name: string; thunderCoins: number; }

interface AllData {
    stats: { totalEntries: number; mostPopularDevice: string; topSnack: string; peakHour: string };
    peakHours: PeakHourData[];
    deviceUsage: DeviceUsageData[];
    growth: GrowthData[];
    occupancy: OccupancyData;
    snacks: SnackData[];
    battles: any[];
    coinsWeekly: CoinEntry[];
    coinsMonthly: CoinEntry[];
}

type Tab = 'overview' | 'devices' | 'food' | 'community';

/* ── Stat Card ── */
const StatCard = ({ label, value, icon, accent }: {
    label: string; value: string | number; icon: React.ReactNode; accent: string;
}) => (
    <motion.div
        className="an-stat-card"
        style={{ '--card-accent': accent } as any}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        whileHover={{ y: -3 }}
    >
        <div className="an-stat-top">
            <span className="an-stat-label">{label}</span>
            <span className="an-stat-icon">{icon}</span>
        </div>
        <div className="an-stat-value">{value}</div>
    </motion.div>
);

/* ── Card wrapper ── */
const Card = ({ children, title, desc, badge, extra }: {
    children: React.ReactNode; title: string; desc?: string;
    badge?: string; extra?: React.ReactNode;
}) => (
    <div className="an-card">
        <div className="an-card-head">
            <div className="an-card-title-block">
                <h3 className="an-card-title">{title}</h3>
                {desc && <p className="an-card-desc">{desc}</p>}
            </div>
            {badge && <span className="an-badge">{badge}</span>}
            {extra}
        </div>
        {children}
    </div>
);

/* ── Tab slide animation ── */
const tabVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

/* ══════════════════════════════════════════════
   Main Analytics Page
══════════════════════════════════════════════ */
const Analytics: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [coinRange, setCoinRange] = useState<'weekly' | 'monthly'>('weekly');
    const [battleView, setBattleView] = useState<'leaderboard' | 'history'>('history');
    const [data, setData] = useState<AllData | null>(null);
    const [loading, setLoading] = useState(true);

    /* ─────────────────────────────────────────────
       Cache helpers  (TTL in milliseconds)
       ───────────────────────────────────────────── */
    const CACHE_KEY_DASH    = 'an_dash_v1';
    const CACHE_KEY_BATTLES = 'an_battles_v1';
    const TTL_DASH    = 5  * 60 * 1000;  // 5 min  — live data
    const TTL_BATTLES = 2  * 60 * 1000;  // 2 min — refreshed on community view

    const readCache = (key: string, ttl: number) => {
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) return null;
            const { ts, payload } = JSON.parse(raw);
            if (Date.now() - ts > ttl) return null;
            return payload;
        } catch { return null; }
    };

    const writeCache = (key: string, payload: any) => {
        try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), payload })); }
        catch { /* storage full — skip */ }
    };

    /* ─────────────────────────────────────────────
       Single consolidated fetch
       ───────────────────────────────────────────── */
    const fetchAll = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                sessionStorage.removeItem(CACHE_KEY_DASH);
                sessionStorage.removeItem(CACHE_KEY_BATTLES);
            }

            // ── Try cache first ──
            const cachedDash    = forceRefresh ? null : readCache(CACHE_KEY_DASH,    TTL_DASH);
            const cachedBattles = forceRefresh ? null : readCache(CACHE_KEY_BATTLES, TTL_BATTLES);

            if (cachedDash && cachedBattles) {
                setData({ ...cachedDash, ...cachedBattles });
                setLoading(false);
                return;
            }

            // ── Fetch only what's stale ──
            const fetches: Promise<any>[] = [];
            if (!cachedDash)    fetches.push(api.get('/api/analytics/dashboard'));
            if (!cachedBattles) fetches.push(
                Promise.all([
                    api.get('/api/battles/completed'),
                    api.get('/api/battles/thunder-leaderboard?range=weekly'),
                    api.get('/api/battles/thunder-leaderboard?range=monthly'),
                ])
            );

            const results = await Promise.allSettled(fetches);

            let dashData    = cachedDash;
            let battleData  = cachedBattles;

            let ri = 0;
            if (!cachedDash) {
                const r = results[ri++];
                if (r.status === 'fulfilled') {
                    const d = r.value.data;
                    dashData = {
                        stats:       d.stats       ?? { totalEntries: 0, mostPopularDevice: '—', topSnack: '—', peakHour: '—' },
                        peakHours:   Array.isArray(d.peakHours)   ? d.peakHours   : [],
                        deviceUsage: Array.isArray(d.deviceUsage) ? d.deviceUsage : [],
                        growth:      Array.isArray(d.growth)      ? d.growth      : [],
                        occupancy:   d.occupancy   ?? { occupied: 0, remaining: 0 },
                        snacks:      Array.isArray(d.snacks)      ? d.snacks      : [],
                    };
                    writeCache(CACHE_KEY_DASH, dashData);
                }
            }
            if (!cachedBattles) {
                const r = results[ri++];
                if (r.status === 'fulfilled') {
                    const [bR, cwR, cmR] = r.value;
                    battleData = {
                        battles:      Array.isArray(bR?.data)  ? bR.data  : [],
                        coinsWeekly:  Array.isArray(cwR?.data) ? cwR.data : [],
                        coinsMonthly: Array.isArray(cmR?.data) ? cmR.data : [],
                    };
                    writeCache(CACHE_KEY_BATTLES, battleData);
                }
            }

            setData({
                ...(dashData   ?? { stats: { totalEntries: 0, mostPopularDevice: '—', topSnack: '—', peakHour: '—' }, peakHours: [], deviceUsage: [], growth: [], occupancy: { occupied: 0, remaining: 0 }, snacks: [] }),
                ...(battleData ?? { battles: [], coinsWeekly: [], coinsMonthly: [] }),
            });
        } catch (e) {
            console.error('Analytics fetch error', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBattlesOnly = useCallback(async () => {
        try {
            const [bR, cwR, cmR] = await Promise.all([
                api.get('/api/battles/completed'),
                api.get('/api/battles/thunder-leaderboard?range=weekly'),
                api.get('/api/battles/thunder-leaderboard?range=monthly'),
            ]);
            const battleData = {
                battles: Array.isArray(bR?.data) ? bR.data : [],
                coinsWeekly: Array.isArray(cwR?.data) ? cwR.data : [],
                coinsMonthly: Array.isArray(cmR?.data) ? cmR.data : [],
            };
            writeCache(CACHE_KEY_BATTLES, battleData);
            setData(prev => ({
                ...(prev || {
                    stats: { totalEntries: 0, mostPopularDevice: '—', topSnack: '—', peakHour: '—' },
                    peakHours: [], deviceUsage: [], growth: [], occupancy: { occupied: 0, remaining: 0 }, snacks: []
                }),
                ...battleData,
            }));
        } catch (e) {
            console.error('Error fetching battles:', e);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Automatically fetch fresh battles when community tab is opened
    useEffect(() => {
        if (activeTab === 'community') {
            fetchBattlesOnly();
        }
    }, [activeTab, fetchBattlesOnly]);

    // Real-time socket listener for battle completion
    useEffect(() => {
        const socket = io(API_BASE_URL, { transports: ['websocket'] });
        socket.on('battle:finished', () => {
            sessionStorage.removeItem(CACHE_KEY_BATTLES);
            fetchBattlesOnly();
        });
        return () => {
            socket.disconnect();
        };
    }, [fetchBattlesOnly]);

    const stats = data?.stats;
    const rawTopSnack = typeof stats?.topSnack === 'string' ? stats.topSnack : '';
    const topSnackName = rawTopSnack && rawTopSnack !== 'N/A' && !rawTopSnack.includes('[object')
        ? rawTopSnack.split(',')[0].replace(/x\d+/g, '').trim()
        : '—';


    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <MdDashboard /> },
        { id: 'devices', label: 'Devices', icon: <FaGamepad /> },
        { id: 'food', label: 'F&B', icon: <MdFastfood /> },
        { id: 'community', label: 'Community', icon: <FaTrophy /> },
    ];

    return (
        <DashboardLayout>
            <div className="analytics-root">
                <div className="an-content">

                    {/* ── Header ── */}
                    <header className="an-header">
                        <div className="an-title-block">
                            <h1>Thunder <span>Analytics</span></h1>
                            <div className="an-live-row">
                                <span className="an-live-dot" />
                                System Operational · Live Data
                            </div>
                        </div>

                        <div className="an-header-right">
                            <nav className="an-tabs">
                                {tabs.map(t => (
                                    <button
                                        key={t.id}
                                        className={`an-tab${activeTab === t.id ? ' active' : ''}`}
                                        onClick={() => setActiveTab(t.id)}
                                    >
                                        {t.icon}
                                        <span className="tab-label">{t.label}</span>
                                    </button>
                                ))}
                            </nav>
                            <button
                                className="an-refresh-btn"
                                onClick={() => {
                                    setLoading(true);
                                    fetchAll(true);
                                }}
                                title="Refresh data"
                            >
                                <FaSync className={loading ? 'an-spinning' : ''} />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </header>

                    {/* ── Key Metrics ── */}
                    <div className="an-stats-row">
                        <StatCard label="Total Entries" value={stats?.totalEntries ?? '—'} icon={<FaUserFriends />} accent="#dc2626" />
                        <StatCard label="Peak Hour" value={stats?.peakHour ?? '—'} icon={<FaClock />} accent="#ef4444" />
                        <StatCard label="Top Device" value={(stats?.mostPopularDevice ?? '—').toUpperCase()} icon={<FaGamepad />} accent="#b91c1c" />
                        <StatCard label="Top Snack" value={topSnackName} icon={<FaHamburger />} accent="#fbbf24" />
                    </div>

                    {/* ── Tab Content ── */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div key="overview" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.18 }}>
                                <div className="an-grid an-grid-full">
                                    <Card title="Sessions Growth" desc="Month-over-month comparison" badge="vs Last Month">
                                        <GrowthComparisonChart data={data?.growth ?? []} loading={loading} />
                                    </Card>
                                </div>
                                <div className="an-grid an-grid-2">
                                    <Card title="Peak Hours" desc="Activity by time of day — last 24 hrs">
                                        <PeakHoursChart data={data?.peakHours ?? []} loading={loading} />
                                    </Card>
                                    <Card title="Device Occupancy" desc="Real-time device utilization">
                                        <DeviceOccupancyChart data={data?.occupancy ?? { occupied: 0, remaining: 0 }} loading={loading} />
                                    </Card>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'devices' && (
                            <motion.div key="devices" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.18 }}>
                                <div className="an-grid an-grid-full">
                                    <Card title="Device Usage" desc="Which consoles are played the most?">
                                        <DeviceUsageChart data={data?.deviceUsage ?? []} loading={loading} />
                                    </Card>
                                </div>
                                <div className="an-grid an-grid-full" style={{ maxWidth: 480 }}>
                                    <Card title="Occupancy" desc="Live device availability">
                                        <DeviceOccupancyChart data={data?.occupancy ?? { occupied: 0, remaining: 0 }} loading={loading} />
                                    </Card>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'food' && (
                            <motion.div key="food" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.18 }}>
                                <div className="an-grid an-grid-full">
                                    <Card title="🍟 Snacks & Beverages" desc="Consumption breakdown — last 24 hours" badge="Live">
                                        <SnacksConsumptionChart data={data?.snacks ?? []} loading={loading} />
                                    </Card>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'community' && (
                            <motion.div key="community" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.18 }}>
                                <div className="an-grid an-grid-2">
                                    <Card
                                        title="⚔ Battle Arena"
                                        desc={battleView === 'leaderboard' ? "Top PVP champions by wins" : "Recent completed matches"}
                                        extra={
                                            <div className="an-toggle">
                                                <button className={battleView === 'leaderboard' ? 'active' : ''} onClick={() => setBattleView('leaderboard')}>Leaderboard</button>
                                                <button className={battleView === 'history' ? 'active' : ''} onClick={() => setBattleView('history')}>Match History</button>
                                            </div>
                                        }
                                    >
                                        {battleView === 'leaderboard' ? (
                                            <BattleLeaderboard data={data?.battles ?? []} loading={loading} />
                                        ) : (
                                            <BattleHistory data={data?.battles ?? []} loading={loading} />
                                        )}
                                    </Card>
                                    <Card
                                        title="⚡ Thunder Coins"
                                        desc="Loyalty program leaders"
                                        extra={
                                            <div className="an-toggle">
                                                <button className={coinRange === 'weekly' ? 'active' : ''} onClick={() => setCoinRange('weekly')}>Week</button>
                                                <button className={coinRange === 'monthly' ? 'active' : ''} onClick={() => setCoinRange('monthly')}>Month</button>
                                            </div>
                                        }
                                    >
                                        <ThunderCoinsLeaderboard
                                            data={coinRange === 'weekly' ? (data?.coinsWeekly ?? []) : (data?.coinsMonthly ?? [])}
                                            loading={loading}
                                        />
                                    </Card>
                                </div>

                                <div className="an-grid an-grid-full" style={{ marginTop: '1.5rem' }}>
                                    <Card
                                        title="📜 Battle History & Match Logs"
                                        desc="Complete log of finished battles, player showdowns, scores, and rewards"
                                        badge={`${(data?.battles ?? []).length} Recorded`}
                                    >
                                        <BattleHistory data={data?.battles ?? []} loading={loading} />
                                    </Card>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default Analytics;
