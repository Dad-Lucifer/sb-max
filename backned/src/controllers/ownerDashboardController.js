const { db } = require('../config/firebase');

const { calculateRevenueByMachine } = require('../utils/pricing');

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
    console.error("Error fetching pricing for owner logic:", err);
  }
  const { getDefaultPricingConfig } = require('./pricingController');
  return getDefaultPricingConfig();
};

/**
 * 🔧 Helper: get start date from range
 */
const getStartDate = (range) => {
  const now = new Date();
  let startDate = new Date();

  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'lastweek':
      startDate.setDate(startDate.getDate() - 7);
      break;

    case 'thismonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;

    default:
      // Default to today if unknown
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return startDate;
};

/**
 * ======================================================
 * 📊 OWNER DASHBOARD STATS (KPI)
 * ======================================================
 */
const getOwnerDashboardStats = async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const startDate = getStartDate(range);

    // Optimized: Query filter with ISO string (since stored as string)
    const snapshot = await db.collection('sessions')
      .where('createdAt', '>=', startDate.toISOString())
      .get();

    let totalRevenue = 0;
    let totalDuration = 0;
    let completedSessions = 0;

    snapshot.forEach(doc => {
      const s = doc.data();
      // Double check in case of different stored formats, but query reduces load massively
      const createdAt = toDate(s.createdAt);
      if (!createdAt || createdAt < startDate) return;

      totalRevenue += Number(s.price || 0);
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
    const startDate = getStartDate(range);
    const groupBy = range === 'today' || range === 'yesterday' ? 'hour' : 'day';

    const snapshot = await db.collection('sessions')
      .where('createdAt', '>=', startDate.toISOString())
      .get();

    const buckets = {};

    snapshot.forEach(doc => {
      const s = doc.data();
      const createdAt = toDate(s.createdAt);
      if (!createdAt || createdAt < startDate) return;

      const key =
        groupBy === 'hour'
          ? String(createdAt.getHours()).padStart(2, '0')
          : createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

      buckets[key] = (buckets[key] || 0) + Number(s.price || 0);
    });

    const result = Object.entries(buckets).map(([time, amount]) => ({
      time,
      amount
    }));

    res.json({ groupBy, data: result });

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
    const startDate = getStartDate(range);

    const snapshot = await db
      .collection('sessions')
      .where('createdAt', '>=', startDate.toISOString())
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const transactions = snapshot.docs
      .map(doc => {
        const s = doc.data();
        const createdAt = toDate(s.createdAt);
        if (!createdAt || createdAt < startDate) return null;
        if (s.status !== 'completed') return null;

        return {
          id: doc.id,
          item: `${s.customerName} (${s.duration}h)`,
          amount: s.price,
          status: s.status,
          time: createdAt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
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
    const startDate = getStartDate(range);

    const snapshot = await db.collection('sessions')
      .where('createdAt', '>=', startDate.toISOString())
      .get();

    const totals = {
      ps: 0,
      pc: 0,
      vr: 0,
      wheel: 0,
      metabat: 0
    };

    const pricingConfig = await getPricingConfig();

    snapshot.forEach(doc => {
      const s = doc.data();

      // Ensure status is completed (original logic did this inside loop)
      if (s.status !== 'completed') return;

      const createdAt = toDate(s.createdAt);
      if (!createdAt || createdAt < startDate) return;

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
      .map(([k, v]) => ({
        name: k.toUpperCase(),
        value: Math.round(v)
      }));

    res.json(result);

  } catch (err) {
    console.error('❌ revenue by machine error:', err);
    res.status(500).json({ message: 'Revenue by machine error' });
  }
};





// ... existing exports
/**
 * ======================================================
 * 🗑️ DELETION LOGS
 * ======================================================
 */
const getDeletionLogs = async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const startDate = getStartDate(range);

    const snapshot = await db.collection('deletion_logs')
      .where('deletedAt', '>=', startDate.toISOString())
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

module.exports = {
  getOwnerDashboardStats,
  getRevenueFlow,
  getRecentTransactions,
  getRevenueByMachine,
  getDeletionLogs
};
