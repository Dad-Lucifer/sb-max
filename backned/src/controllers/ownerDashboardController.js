const { db } = require('../config/firebase');
const { calculateRevenueByMachine } = require('../utils/pricing');
const { getRange, istHour, istDateLabel } = require('../utils/istTime');

/**
 * 🔧 Helper: safely convert Firestore Timestamp or string to JS Date
 */
const toDate = (value) => {
    if (!value) return null;
    if (value.toDate) return value.toDate(); // Firestore Timestamp
    return new Date(value); // ISO string
};

// Helper to get Pricing Config
const getPricingConfig = async () => {
    try {
        const doc = await db.collection('settings').doc('pricing').get();
        if (doc.exists) {
            const data = doc.data();
            const { getDefaultPricingConfig } = require('./pricingController');
            const defaults = getDefaultPricingConfig();
            const merged = { ...defaults };
            Object.keys(data).forEach(key => {
                if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
                    merged[key] = { ...merged[key], ...data[key] };
                } else {
                    merged[key] = data[key];
                }
            });
            return merged;
        }
    } catch (err) {
        console.error('Error fetching pricing for owner logic:', err);
    }
    const { getDefaultPricingConfig } = require('./pricingController');
    return getDefaultPricingConfig();
};

/**
 * ======================================================
 * 📊 OWNER DASHBOARD STATS (KPI)
 * ======================================================
 */
const getOwnerDashboardStats = async (req, res) => {
    try {
        const { range = 'today' } = req.query;
        const { start, end } = getRange(range);

        const snapshot = await db.collection('sessions')
            .where('createdAt', '>=', start.toISOString())
            .where('createdAt', '<', end.toISOString())
            .get();

        let totalRevenue = 0;
        let totalOnlineRevenue = 0;
        let totalCashRevenue = 0;
        let totalDuration = 0;
        let completedSessions = 0;

        snapshot.forEach(doc => {
            const s = doc.data();
            totalRevenue += Number(s.price || 0);
            totalOnlineRevenue += Number(s.online || 0);
            totalCashRevenue += Number(s.cash || 0);
            totalDuration += Number(s.duration || 0);
            if (s.status === 'completed') completedSessions++;
        });

        const avgSessionTime =
            completedSessions > 0
                ? Math.round((totalDuration / completedSessions) * 60)
                : 0;

        res.json({
            kpiStats: [
                { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, trend: 0 },
                { label: 'Total Online Revenue', value: `₹${totalOnlineRevenue.toLocaleString()}`, trend: 0 },
                { label: 'Total Cash Revenue', value: `₹${totalCashRevenue.toLocaleString()}`, trend: 0 },
                { label: 'Completed Sessions', value: completedSessions, trend: 0 },
                { label: 'Avg Session Time', value: `${avgSessionTime}m`, trend: 0 },
                { label: 'Snacks Sold', value: 0, trend: 0 }
            ]
        });

    } catch (err) {
        console.error('❌ owner dashboard error:', err);
        res.status(500).json({ message: 'Dashboard stats error' });
    }
};

/**
 * ======================================================
 * 📈 REVENUE FLOW (CHART)
 * ======================================================
 */
const getRevenueFlow = async (req, res) => {
    try {
        const { range = 'today' } = req.query;
        const { start, end } = getRange(range);
        const groupBy = (range === 'today' || range === 'yesterday') ? 'hour' : 'day';

        const snapshot = await db.collection('sessions')
            .where('createdAt', '>=', start.toISOString())
            .where('createdAt', '<', end.toISOString())
            .get();

        const buckets = {};

        snapshot.forEach(doc => {
            const s = doc.data();
            const createdAt = toDate(s.createdAt);
            if (!createdAt) return;

            const key = groupBy === 'hour'
                ? String(istHour(createdAt)).padStart(2, '0')
                : istDateLabel(createdAt);

            buckets[key] = (buckets[key] || 0) + Number(s.price || 0);
        });

        let data;
        if (groupBy === 'hour') {
            // Always return all 24 hour slots so chart never collapses on an empty day
            data = Array.from({ length: 24 }, (_, h) => {
                const key = String(h).padStart(2, '0');
                return { time: key, amount: buckets[key] ?? 0 };
            });
        } else {
            data = Object.entries(buckets).map(([time, amount]) => ({ time, amount }));
        }

        res.json({ groupBy, data });

    } catch (err) {
        console.error('❌ revenue flow error:', err);
        res.status(500).json({ message: 'Revenue flow error' });
    }
};

/**
 * ======================================================
 * 🧾 RECENT TRANSACTIONS
 * ======================================================
 */
const getRecentTransactions = async (req, res) => {
    try {
        const { range = 'today' } = req.query;
        const { start, end } = getRange(range);

        const snapshot = await db
            .collection('sessions')
            .where('createdAt', '>=', start.toISOString())
            .where('createdAt', '<', end.toISOString())
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const transactions = snapshot.docs
            .map(doc => {
                const s = doc.data();
                if (s.status !== 'completed') return null;

                // Use completedAt when available, fall back to createdAt; never invent a timestamp
                const ts = s.completedAt ?? s.createdAt ?? null;

                return {
                    id: doc.id,
                    item: `${s.customerName} (${s.duration}h)`,
                    amount: s.price,
                    status: s.status,
                    timestamp: ts  // raw ISO string (or null) — formatted on the frontend in IST
                };
            })
            .filter(Boolean)
            .slice(0, 15);

        res.json(transactions);

    } catch (err) {
        console.error('❌ recent transactions error:', err);
        res.status(500).json({ message: 'Recent transactions error' });
    }
};

/**
 * ======================================================
 * 🥧 REVENUE BY MACHINE (PIE)
 * ======================================================
 */
const getRevenueByMachine = async (req, res) => {
    try {
        const { range = 'today' } = req.query;
        const { start, end } = getRange(range);

        const snapshot = await db.collection('sessions')
            .where('createdAt', '>=', start.toISOString())
            .where('createdAt', '<', end.toISOString())
            .get();

        const totals = { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 };
        const pricingConfig = await getPricingConfig();

        snapshot.forEach(doc => {
            const s = doc.data();
            if (s.status !== 'completed') return;

            const createdAt = toDate(s.createdAt);
            if (!createdAt) return;

            const split = calculateRevenueByMachine(
                s.duration,
                s.peopleCount,
                s.devices,
                createdAt,
                pricingConfig
            );

            Object.keys(totals).forEach(k => {
                totals[k] += split[k];
            });
        });

        const result = Object.entries(totals)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => ({ name: k.toUpperCase(), value: Math.round(v) }));

        res.json(result);

    } catch (err) {
        console.error('❌ revenue by machine error:', err);
        res.status(500).json({ message: 'Revenue by machine error' });
    }
};

/**
 * ======================================================
 * 🗑️ DELETION LOGS
 * ======================================================
 */
const getDeletionLogs = async (req, res) => {
    try {
        const { range = 'today' } = req.query;
        const { start, end } = getRange(range);

        const snapshot = await db.collection('deletion_logs')
            .where('deletedAt', '>=', start.toISOString())
            .where('deletedAt', '<', end.toISOString())
            .orderBy('deletedAt', 'desc')
            .get();

        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(logs);
    } catch (err) {
        console.error('❌ deletion logs error:', err);
        res.status(500).json({ message: 'Deletion logs error' });
    }
};

/**
 * ======================================================
 * 🔍 SINGLE TRANSACTION DETAIL
 * ======================================================
 */
const getTransactionDetail = async (req, res) => {
    if (!db) return res.status(503).json({ message: 'Database unavailable' });

    try {
        const { id } = req.params;
        const doc = await db.collection('sessions').doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const s = doc.data();

        // --- Format devices into readable labels ---
        const deviceLabels = [];
        if (s.devices && typeof s.devices === 'object') {
            Object.entries(s.devices).forEach(([type, ids]) => {
                const label = type.toUpperCase();
                if (Array.isArray(ids)) {
                    ids.forEach(id => { if (id) deviceLabels.push(`${label} #${id}`); });
                } else if (typeof ids === 'number' && ids > 0) {
                    deviceLabels.push(`${label} ×${ids}`);
                }
            });
        }

        // --- Snacks ---
        const snackList = Array.isArray(s.snacks) && s.snacks.length > 0
            ? s.snacks.map(sn => ({ name: sn.name, quantity: sn.quantity, price: sn.price ?? null }))
            : [];

        // --- Renewal / Extension history ---
        // A session is considered "renewed" if it has members (new people joined)
        // or if extraTime was applied (duration > originalDuration, tracked via updatedAt)
        const wasExtended = !!(s.extraTime || (s.updatedAt && s.updatedAt !== s.createdAt && !s.members?.length));
        const wasRenewed  = Array.isArray(s.members) && s.members.length > 0;

        // Duration breakdown: hours and minutes
        const hrs = s.duration || 0;
        const h   = Math.floor(hrs);
        const m   = Math.round((hrs - h) * 60);
        const durationLabel = m > 0 ? `${h}h ${m}min` : `${h}h`;

        // Payment method label
        const cash   = Number(s.cash   || 0);
        const online = Number(s.online || 0);
        let paymentMethod = 'Not recorded';
        if (cash > 0 && online > 0) paymentMethod = 'Mixed (Cash + Online)';
        else if (cash > 0)          paymentMethod = 'Cash';
        else if (online > 0)        paymentMethod = 'Online';

        return res.status(200).json({
            id: doc.id,
            // Customer
            customerName:  s.customerName  || '—',
            contactNumber: s.contactNumber || '—',
            gameName:      s.gameName      || null,
            peopleCount:   s.peopleCount   || 1,
            // Session
            duration:      durationLabel,
            startTime:     s.startTime   || s.createdAt || null,
            completedAt:   s.completedAt || null,
            status:        s.status,
            // Devices
            devices: deviceLabels,
            // Snacks
            snacks: snackList,
            // Payment
            totalAmount:   Number(s.price      || 0),
            paidAmount:    Number(s.paidAmount || 0),
            cashAmount:    cash,
            onlineAmount:  online,
            paymentMethod,
            // History
            wasExtended,
            wasRenewed,
            membersAdded:  Array.isArray(s.members) ? s.members.length : 0,
        });

    } catch (err) {
        console.error('❌ getTransactionDetail error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getOwnerDashboardStats,
    getRevenueFlow,
    getRecentTransactions,
    getRevenueByMachine,
    getDeletionLogs,
    getTransactionDetail
};
