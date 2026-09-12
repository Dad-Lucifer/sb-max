const { db } = require('../config/firebase');
const deviceLimits = require('../config/deviceLimit');

const getLast24HoursStats = async (req, res) => {
    try {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const snapshot = await db.collection('sessions')
            .where('createdAt', '>=', last24Hours.toISOString())
            .get();

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
                    deviceCount[device] =
                        (deviceCount[device] || 0) + data.devices[device];
                });
            }

            // -------- Snacks --------
            const _snackArr = (data.snackDetails && Array.isArray(data.snackDetails))
                ? data.snackDetails
                : (Array.isArray(data.snacks) ? data.snacks : null);

            if (_snackArr) {
                _snackArr.forEach(snack => {
                    let raw = snack.name;
                    if (raw && typeof raw === 'object') raw = raw.name || raw.label || null;
                    if (!raw && snack.item) raw = typeof snack.item === 'string' ? snack.item : snack.item?.name;
                    const snackName = typeof raw === 'string' ? raw.trim() : null;
                    if (snackName) {
                        snackCount[snackName] = (snackCount[snackName] || 0) + (Number(snack.quantity ?? snack.qty) || 1);
                    }
                });
            } else if (data.snacks && typeof data.snacks === 'string') {
                // Legacy string format: "Chips x2, Coke x1"
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
        // Query ACTIVE sessions for current occupancy
        const snapshot = await db.collection('sessions')
            .where('status', '==', 'active')
            .get();

        let occupiedDevices = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.devices) return;

            // Sum actual stored device counts (Handle both Arrays and Numbers)
            Object.values(data.devices).forEach(val => {
                if (Array.isArray(val)) {
                    occupiedDevices += val.length;
                } else if (typeof val === 'number') {
                    occupiedDevices += val;
                }
            });
        });

        // ---- Total device limit ----
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

        const snapshot = await db
            .collection('sessions')
            .where('createdAt', '>=', last24.toISOString())
            .get();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.startTime || !data.peopleCount) return;

            // 🔥 Convert to IST explicitly
            const date = new Date(data.startTime);
            const istHour = date.getUTCHours() + 5.5;

            // Normalize hour (0–23)
            const hour = Math.floor((istHour + 24) % 24);

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

        const snapshot = await db
            .collection('sessions')
            .where('createdAt', '>=', last24.toISOString())
            .get();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.devices) return;

            Object.entries(data.devices).forEach(([device, count]) => {
                if (deviceMap[device] !== undefined) {
                    deviceMap[device] += Number(count);
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

        const snapshot = await db
            .collection('sessions')
            .where('createdAt', '>=', last24.toISOString())
            .get();

        const snackMap = {};

        // Safely extract a plain string name from any stored snack shape:
        // { name: "Chips", quantity: 2 }  — current format
        // { name: { name: "Chips", price: 15 }, quantity: 2 } — object accidentally stored as name
        // { item: { name: "Chips" }, qty: 2 } — alternate legacy shape
        const resolveSnackName = (snack) => {
            if (!snack) return null;
            let raw = snack.name;
            // If name is itself an object, try to extract a string from it
            if (raw && typeof raw === 'object') {
                raw = raw.name || raw.label || raw.title || null;
            }
            if (!raw && snack.item) {
                // Another legacy pattern: { item: { name: 'Chips' }, qty: 2 }
                raw = typeof snack.item === 'string' ? snack.item : snack.item?.name;
            }
            if (typeof raw !== 'string' || !raw.trim()) return null;
            return raw.trim();
        };

        snapshot.forEach(doc => {
            const data = doc.data();

            // data.snacks stores an array of { name, quantity } objects (set at session creation)
            // data.snackDetails is a legacy / alternate field name — check both
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
                // Legacy string format: "Chips x2, Coke x1"
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

        // Convert to Recharts-friendly array
        const result = Object.entries(snackMap).map(([name, value]) => ({
            name,
            value
        }));

        return res.status(200).json(result); // 👈 ARRAY ONLY

    } catch (error) {
        console.error('❌ Snacks Consumption Error:', error);
        return res.status(500).json([]);
    }
};


const getMonthlyGrowthComparison = async (req, res) => {
    try {
        const now = new Date();

        // ---- Month boundaries ----
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // ---- Week buckets ----
        const weeks = {
            1: { thisMonth: 0, lastMonth: 0 },
            2: { thisMonth: 0, lastMonth: 0 },
            3: { thisMonth: 0, lastMonth: 0 },
            4: { thisMonth: 0, lastMonth: 0 }
        };

        // Scoped to start of last month — not a full collection scan
        const snapshot = await db.collection('sessions')
            .where('createdAt', '>=', startOfLastMonth.toISOString())
            .get();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.startTime || !data.peopleCount) return;

            const date = new Date(data.startTime);
            const dayOfMonth = date.getDate();
            const week = Math.min(Math.ceil(dayOfMonth / 7), 4);

            if (date >= startOfThisMonth && date <= now) {
                weeks[week].thisMonth += Number(data.peopleCount);
            }
            if (date >= startOfLastMonth && date <= endOfLastMonth) {
                weeks[week].lastMonth += Number(data.peopleCount);
            }
        });

        const result = [
            { day: 'Week 1', lastMonth: weeks[1].lastMonth, thisMonth: weeks[1].thisMonth },
            { day: 'Week 2', lastMonth: weeks[2].lastMonth, thisMonth: weeks[2].thisMonth },
            { day: 'Week 3', lastMonth: weeks[3].lastMonth, thisMonth: weeks[3].thisMonth },
            { day: 'Week 4', lastMonth: weeks[4].lastMonth, thisMonth: weeks[4].thisMonth }
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
 * Consolidated endpoint: replaces 5 separate calls with 3 Firestore reads.
 *
 * Reads:
 *  1. sessions where createdAt >= last 24h  → stats, peakHours, deviceUsage, snacks
 *  2. sessions where status == 'active'     → occupancy
 *  3. sessions where createdAt >= last month's start → growth chart
 *
 * Returns: { stats, peakHours, deviceUsage, snacks, occupancy, growth }
 */
const getDashboardData = async (req, res) => {
    try {
        const now         = new Date();
        const last24      = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // ── 3 parallel Firestore reads ──
        const [last24Snap, activeSnap, monthlySnap] = await Promise.all([
            db.collection('sessions').where('createdAt', '>=', last24.toISOString()).get(),
            db.collection('sessions').where('status', '==', 'active').get(),
            db.collection('sessions').where('createdAt', '>=', startOfLastMonth.toISOString()).get(),
        ]);

        // ── Shared snack name resolver ──
        const resolveSnackName = (snack) => {
            if (!snack) return null;
            let raw = snack.name;
            if (raw && typeof raw === 'object') raw = raw.name || raw.label || raw.title || null;
            if (!raw && snack.item) raw = typeof snack.item === 'string' ? snack.item : snack.item?.name;
            if (typeof raw !== 'string' || !raw.trim()) return null;
            return raw.trim();
        };

        // ── Process last-24h snapshot ──
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
                const date    = new Date(data.startTime);
                const istHour = Math.floor(((date.getUTCHours() + 5.5) + 24) % 24);
                if (istHour >= 10 && istHour <= 22) {
                    hourMap[istHour] += Number(data.peopleCount) || 1;
                }
            }
        });

        // ── Stats card values ──
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

        // ── Peak hours array ──
        const peakHours = [];
        for (let h = 10; h <= 22; h++) {
            const suffix = h >= 12 ? 'PM' : 'AM';
            const fh     = h % 12 === 0 ? 12 : h % 12;
            peakHours.push({ time: `${fh} ${suffix}`, users: hourMap[h] });
        }

        // ── Device usage array ──
        const deviceUsage = [
            { name: 'PC',      usage: deviceCount.pc      || 0 },
            { name: 'PS5',     usage: deviceCount.ps      || 0 },
            { name: 'VR',      usage: deviceCount.vr      || 0 },
            { name: 'Sim',     usage: deviceCount.wheel   || 0 },
            { name: 'MetaBat', usage: deviceCount.metabat || 0 },
        ];

        // ── Snacks array ──
        const snacks = Object.entries(snackMap).map(([name, value]) => ({ name, value }));

        // ── Occupancy ──
        let occupiedDevices = 0;
        activeSnap.forEach(doc => {
            const d = doc.data();
            if (!d.devices) return;
            Object.values(d.devices).forEach(val => {
                if (Array.isArray(val)) occupiedDevices += val.length;
                else if (typeof val === 'number') occupiedDevices += val;
            });
        });
        const totalCapacity  = Object.values(deviceLimits).reduce((s, v) => s + v, 0);
        const occupancy = {
            occupied:      occupiedDevices,
            remaining:     Math.max(totalCapacity - occupiedDevices, 0),
            totalCapacity
        };

        // ── Monthly growth ──
        const weeks = {
            1: { thisMonth: 0, lastMonth: 0 },
            2: { thisMonth: 0, lastMonth: 0 },
            3: { thisMonth: 0, lastMonth: 0 },
            4: { thisMonth: 0, lastMonth: 0 }
        };
        monthlySnap.forEach(doc => {
            const data = doc.data();
            if (!data.startTime || !data.peopleCount) return;
            const date  = new Date(data.startTime);
            const week  = Math.min(Math.ceil(date.getDate() / 7), 4);
            if (date >= startOfThisMonth && date <= now) weeks[week].thisMonth += Number(data.peopleCount);
            if (date >= startOfLastMonth && date <= endOfLastMonth) weeks[week].lastMonth += Number(data.peopleCount);
        });
        const growth = [1, 2, 3, 4].map(w => ({
            day: `Week ${w}`, lastMonth: weeks[w].lastMonth, thisMonth: weeks[w].thisMonth
        }));

        return res.status(200).json({ stats, peakHours, deviceUsage, snacks, occupancy, growth });

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