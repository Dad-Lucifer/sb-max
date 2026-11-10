const { db } = require('../config/firebase');
const {
    getActiveDocs,
    getLastMonthGrowthBuckets,
    getThisMonthSessions,
    getLast24HoursSessions
} = require('../services/dataCache');
const { cached } = require('../utils/cache');
const deviceLimits = require('../config/deviceLimit');
const { istHour } = require('../utils/istTime');

const resolveSnackName = (snack) => {
    if (!snack) return null;
    let raw = snack.name;
    if (raw && typeof raw === 'object') raw = raw.name || raw.label || raw.title || null;
    if (!raw && snack.item) raw = typeof snack.item === 'string' ? snack.item : snack.item?.name;
    if (typeof raw !== 'string' || !raw.trim()) return null;
    return raw.trim();
};

const getLast24HoursStats = async (req, res) => {
    try {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const snapshot = await getLast24HoursSessions(last24Hours.toISOString());

        let totalEntries = 0;
        const deviceCount = {};
        const snackCount = {};
        const hourCount = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            totalEntries++;

            // -------- Devices --------
            if (data.devices) {
                Object.keys(data.devices).forEach(device => {
                    const count = Array.isArray(data.devices[device]) ? data.devices[device].length : Number(data.devices[device] || 0);
                    deviceCount[device] = (deviceCount[device] || 0) + count;
                });
            }

            // -------- Snacks --------
            const _snackArr = (data.snackDetails && Array.isArray(data.snackDetails))
                ? data.snackDetails
                : (Array.isArray(data.snacks) ? data.snacks : null);

            if (_snackArr) {
                _snackArr.forEach(snack => {
                    const snackName = resolveSnackName(snack);
                    if (snackName) {
                        snackCount[snackName] = (snackCount[snackName] || 0) + (Number(snack.quantity ?? snack.qty) || 1);
                    }
                });
            } else if (data.snacks && typeof data.snacks === 'string') {
                data.snacks.split(',').forEach(s => {
                    let snackName = s.trim();
                    let qty = 1;
                    const match = snackName.match(/(.*?)\s*x(\d+)$/i);
                    if (match) {
                        snackName = match[1].trim();
                        qty = parseInt(match[2], 10) || 1;
                    }
                    if (snackName) {
                        snackCount[snackName] = (snackCount[snackName] || 0) + qty;
                    }
                });
            }

            // -------- Peak Hour --------
            const hour = new Date(data.startTime).getHours();
            hourCount[hour] = (hourCount[hour] || 0) + 1;
        });

        const mostPopularDevice =
            Object.entries(deviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        const topSnack =
            Object.entries(snackCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        const peakHourRaw =
            Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0];

        let peakHour = 'N/A';

        if (peakHourRaw !== undefined) {
            const hour = Number(peakHourRaw);
            const suffix = hour >= 12 ? 'PM' : 'AM';
            const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
            peakHour = `${formattedHour}:00 ${suffix}`;
        }

        res.status(200).json({
            totalEntries,
            mostPopularDevice,
            topSnack,
            peakHour
        });

    } catch (error) {
        console.error('❌ Analytics Error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};

const getDeviceOccupancyLast24Hours = async (req, res) => {
    try {
        const snapshot = await getActiveDocs();

        let occupiedDevices = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.devices) return;

            Object.values(data.devices).forEach(val => {
                if (Array.isArray(val)) {
                    occupiedDevices += val.length;
                } else if (typeof val === 'number') {
                    occupiedDevices += val;
                }
            });
        });

        const totalCapacity = Object.values(deviceLimits)
            .reduce((sum, val) => sum + val, 0);

        const remainingDevices = Math.max(
            totalCapacity - occupiedDevices,
            0
        );

        res.status(200).json({
            occupied: occupiedDevices,
            remaining: remainingDevices,
            totalCapacity
        });

    } catch (error) {
        console.error('❌ Device Occupancy Error:', error);
        res.status(500).json({ message: 'Failed to fetch device occupancy' });
    }
};

const getPeakHoursLast24Hours = async (req, res) => {
    try {
        const now = new Date();
        const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        /**
         * Hour buckets: 10 AM (10) → 10 PM (22)
         * Zero-filled by default
         */
        const hourMap = {};
        for (let h = 10; h <= 22; h++) {
            hourMap[h] = 0;
        }

        const snapshot = await getLast24HoursSessions(last24.toISOString());

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.startTime || !data.peopleCount) return;

            // Convert to IST using the shared istTime helper
            const date = new Date(data.startTime);
            const hour = istHour(date);

            if (hour >= 10 && hour <= 22) {
                hourMap[hour] += Number(data.peopleCount);
            }
        });

        // Convert to ARRAY in correct order
        const result = [];
        for (let h = 10; h <= 22; h++) {
            const suffix = h >= 12 ? 'PM' : 'AM';
            const formattedHour = h % 12 === 0 ? 12 : h % 12;

            result.push({
                time: `${formattedHour} ${suffix}`,
                users: hourMap[h]
            });
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Peak Hours Error:', error);
        return res.status(500).json([]);
    }
};

const getDeviceUsageLast24Hours = async (req, res) => {
    try {
        const now = new Date();
        const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Initialize device counters
        const deviceMap = {
            pc: 0,
            ps: 0,
            vr: 0,
            wheel: 0,
            metabat: 0
        };

        const snapshot = await getLast24HoursSessions(last24.toISOString());

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.devices) return;

            Object.entries(data.devices).forEach(([device, count]) => {
                if (deviceMap[device] !== undefined) {
                    const n = Array.isArray(count) ? count.length : Number(count || 0);
                    deviceMap[device] += n;
                }
            });
        });

        // Convert to chart-friendly array (ordered)
        const result = [
            { name: 'PC', usage: deviceMap.pc },
            { name: 'PS5', usage: deviceMap.ps },
            { name: 'VR', usage: deviceMap.vr },
            { name: 'Sim', usage: deviceMap.wheel },
            { name: 'MetaBat', usage: deviceMap.metabat }
        ];

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Device Usage Error:', error);
        return res.status(500).json([]);
    }
};

const getSnacksConsumptionLast24Hours = async (req, res) => {
    try {
        const now = new Date();
        const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const snapshot = await getLast24HoursSessions(last24.toISOString());

        const snackMap = {};

        snapshot.forEach(doc => {
            const data = doc.data();

            const snackArray = (data.snackDetails && Array.isArray(data.snackDetails))
                ? data.snackDetails
                : (Array.isArray(data.snacks) ? data.snacks : null);

            if (snackArray) {
                snackArray.forEach(snack => {
                    const snackName = resolveSnackName(snack);
                    if (!snackName) return;
                    const qty = Number(snack.quantity ?? snack.qty) || 1;
                    snackMap[snackName] = (snackMap[snackName] || 0) + qty;
                });
            } else if (data.snacks && typeof data.snacks === 'string') {
                data.snacks.split(',').forEach(s => {
                    let snackName = s.trim();
                    let qty = 1;
                    const match = snackName.match(/(.*?)\s*x(\d+)$/i);
                    if (match) {
                        snackName = match[1].trim();
                        qty = parseInt(match[2], 10) || 1;
                    }
                    if (snackName) {
                        snackMap[snackName] = (snackMap[snackName] || 0) + qty;
                    }
                });
            }
        });

        const result = Object.entries(snackMap).map(([name, value]) => ({
            name,
            value
        }));

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Snacks Consumption Error:', error);
        return res.status(500).json([]);
    }
};

const getMonthlyGrowthComparison = async (req, res) => {
    try {
        const now = new Date();

        // Month boundaries
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Last month: cached permanently (30 days), NEVER refetched
        const lastMonthWeeks = await getLastMonthGrowthBuckets(startOfLastMonth, endOfLastMonth);

        // Current month: cached 3 minutes
        const thisMonthSnap = await getThisMonthSessions(startOfThisMonth.toISOString());
        const thisMonthWeeks = { 1: 0, 2: 0, 3: 0, 4: 0 };

        thisMonthSnap.forEach(doc => {
            const data = doc.data();
            if (!data.startTime || !data.peopleCount) return;

            const date = new Date(data.startTime);
            const dayOfMonth = date.getDate();
            const week = Math.min(Math.ceil(dayOfMonth / 7), 4);

            if (date >= startOfThisMonth && date <= now) {
                thisMonthWeeks[week] += Number(data.peopleCount) || 1;
            }
        });

        const result = [
            { day: 'Week 1', lastMonth: lastMonthWeeks[1] || 0, thisMonth: thisMonthWeeks[1] || 0 },
            { day: 'Week 2', lastMonth: lastMonthWeeks[2] || 0, thisMonth: thisMonthWeeks[2] || 0 },
            { day: 'Week 3', lastMonth: lastMonthWeeks[3] || 0, thisMonth: thisMonthWeeks[3] || 0 },
            { day: 'Week 4', lastMonth: lastMonthWeeks[4] || 0, thisMonth: thisMonthWeeks[4] || 0 }
        ];

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Growth comparison error:', error);
        return res.status(500).json([]);
    }
};

/**
 * GET /api/analytics/dashboard
 * ─────────────────────────────
 * Consolidated endpoint with in-memory caching.
 * - Last month's data is fetched ONCE and permanently cached (30 days) — NEVER refetched.
 * - Active sessions and this month sessions use short TTL memory cache.
 * - Entire result is cached for 3 minutes to eliminate duplicate page-open reads.
 */
const getDashboardData = async (req, res) => {
    try {
        const payload = await cached('analytics:dashboard_full', 3 * 60_000, async () => {
            const now              = new Date();
            const last24           = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

            // Parallel reads from cached layers
            const [last24Snap, activeSnap, lastMonthWeeks, thisMonthSnap] = await Promise.all([
                getLast24HoursSessions(last24.toISOString()),
                getActiveDocs(),
                getLastMonthGrowthBuckets(startOfLastMonth, endOfLastMonth),
                getThisMonthSessions(startOfThisMonth.toISOString())
            ]);

            // Process last-24h
            let totalEntries = 0;
            const deviceCount = {};
            const snackMap    = {};
            const hourMap     = {};
            for (let h = 10; h <= 22; h++) hourMap[h] = 0;

            last24Snap.forEach(doc => {
                const data = doc.data();
                totalEntries++;

                // Devices
                if (data.devices) {
                    Object.entries(data.devices).forEach(([k, v]) => {
                        const n = Array.isArray(v) ? v.length : (typeof v === 'number' ? v : 0);
                        deviceCount[k] = (deviceCount[k] || 0) + n;
                    });
                }

                // Snacks
                const arr = (data.snackDetails && Array.isArray(data.snackDetails))
                    ? data.snackDetails
                    : (Array.isArray(data.snacks) ? data.snacks : null);

                if (arr) {
                    arr.forEach(s => {
                        const name = resolveSnackName(s);
                        if (name) snackMap[name] = (snackMap[name] || 0) + (Number(s.quantity ?? s.qty) || 1);
                    });
                } else if (data.snacks && typeof data.snacks === 'string') {
                    data.snacks.split(',').forEach(s => {
                        let name = s.trim();
                        let qty  = 1;
                        const m  = name.match(/(.*?)\s*x(\d+)$/i);
                        if (m) { name = m[1].trim(); qty = parseInt(m[2], 10) || 1; }
                        if (name) snackMap[name] = (snackMap[name] || 0) + qty;
                    });
                }

                // Peak hours (IST)
                if (data.startTime) {
                    const date = new Date(data.startTime);
                    const hour = istHour(date);
                    if (hour >= 10 && hour <= 22) {
                        hourMap[hour] += Number(data.peopleCount) || 1;
                    }
                }
            });

            const mostPopularDevice = Object.entries(deviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
            const topSnackEntry     = Object.entries(snackMap).sort((a, b) => b[1] - a[1])[0];
            const topSnack          = topSnackEntry?.[0] || 'N/A';

            const peakHourRaw = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0];
            let peakHour = 'N/A';
            if (peakHourRaw !== undefined) {
                const h = Number(peakHourRaw);
                peakHour = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
            }

            const stats = { totalEntries, mostPopularDevice, topSnack, peakHour };

            const peakHours = [];
            for (let h = 10; h <= 22; h++) {
                const suffix = h >= 12 ? 'PM' : 'AM';
                const fh     = h % 12 === 0 ? 12 : h % 12;
                peakHours.push({ time: `${fh} ${suffix}`, users: hourMap[h] });
            }

            const deviceUsage = [
                { name: 'PC',      usage: deviceCount.pc      || 0 },
                { name: 'PS5',     usage: deviceCount.ps      || 0 },
                { name: 'VR',      usage: deviceCount.vr      || 0 },
                { name: 'Sim',     usage: deviceCount.wheel   || 0 },
                { name: 'MetaBat', usage: deviceCount.metabat || 0 },
            ];

            const snacks = Object.entries(snackMap).map(([name, value]) => ({ name, value }));

            // Occupancy
            let occupiedDevices = 0;
            activeSnap.forEach(doc => {
                const d = doc.data();
                if (!d.devices) return;
                Object.values(d.devices).forEach(val => {
                    if (Array.isArray(val)) occupiedDevices += val.length;
                    else if (typeof val === 'number') occupiedDevices += val;
                });
            });
            const totalCapacity = Object.values(deviceLimits).reduce((s, v) => s + v, 0);
            const occupancy = {
                occupied:      occupiedDevices,
                remaining:     Math.max(totalCapacity - occupiedDevices, 0),
                totalCapacity
            };

            // Monthly growth: lastMonth from permanent cache + thisMonth calculated
            const thisMonthWeeks = { 1: 0, 2: 0, 3: 0, 4: 0 };
            thisMonthSnap.forEach(doc => {
                const data = doc.data();
                if (!data.startTime || !data.peopleCount) return;
                const date  = new Date(data.startTime);
                const week  = Math.min(Math.ceil(date.getDate() / 7), 4);
                if (date >= startOfThisMonth && date <= now) {
                    thisMonthWeeks[week] += Number(data.peopleCount) || 1;
                }
            });

            const growth = [1, 2, 3, 4].map(w => ({
                day: `Week ${w}`,
                lastMonth: lastMonthWeeks[w] || 0,
                thisMonth: thisMonthWeeks[w] || 0
            }));

            return { stats, peakHours, deviceUsage, snacks, occupancy, growth };
        });

        return res.status(200).json(payload);

    } catch (error) {
        console.error('❌ Dashboard data error:', error);
        return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};


module.exports = {
    getDeviceOccupancyLast24Hours,
    getLast24HoursStats,
    getPeakHoursLast24Hours,
    getDeviceUsageLast24Hours,
    getSnacksConsumptionLast24Hours,
    getMonthlyGrowthComparison,
    getDashboardData,
};