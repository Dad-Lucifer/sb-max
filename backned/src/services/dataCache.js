'use strict';
const { db } = require('../config/firebase');
const { cached, invalidate } = require('../utils/cache');

const wrap = (snap) => {
    const list = snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, data: () => data, ref: d.ref };
    });
    list.docs = list;
    list.empty = list.length === 0;
    list.size = list.length;
    return list;
};

const MIN = 60_000;
const PAST_DATA_TTL = 30 * 24 * 60 * MIN; // 30 days — historical months/ranges are immutable, never refetch

const getActiveDocs = () =>
    cached('sessions:active', 5 * MIN, async () =>
        wrap(await db.collection('sessions').where('status', '==', 'active').get()));

const getUpcomingDocs = () =>
    cached('bookings:upcoming', 5 * MIN, async () =>
        wrap(await db.collection('bookings').where('status', '==', 'upcoming').get()));

const getSnackDocs = () =>
    cached('snacks:all', 10 * MIN, async () =>
        (await db.collection('snacks').get()).docs.map(d => ({ id: d.id, ...d.data() })));

const getPricingDoc = () =>
    cached('settings:pricing', 10 * MIN, async () => {
        const doc = await db.collection('settings').doc('pricing').get();
        return doc.exists ? doc.data() : null;
    });

const getSessionsInRange = (startIso, endIso) => {
    const finished = new Date(endIso).getTime() <= Date.now();
    const key = `${finished ? 'rangeold' : 'range'}:${startIso}|${endIso}`;
    return cached(key, finished ? PAST_DATA_TTL : 2 * MIN, async () =>
        wrap(await db.collection('sessions')
            .where('createdAt', '>=', startIso)
            .where('createdAt', '<', endIso)
            .get()));
};

const getSessionsSince = (startIso) =>
    cached(`rangesoft:since:${startIso}`, 5 * MIN, async () =>
        wrap(await db.collection('sessions').where('createdAt', '>=', startIso).get()));

/**
 * Fetches last month's weekly growth distribution ONCE and caches it indefinitely (30 days).
 * Never refetches last month's sessions.
 */
const getLastMonthGrowthBuckets = async (startOfLastMonth, endOfLastMonth) => {
    const key = `analytics:last_month_growth:${startOfLastMonth.toISOString()}`;
    return cached(key, PAST_DATA_TTL, async () => {
        console.log(`[dataCache] 📊 Fetching last month growth ONCE (${startOfLastMonth.toISOString()} to ${endOfLastMonth.toISOString()})...`);
        const snap = await db.collection('sessions')
            .where('createdAt', '>=', startOfLastMonth.toISOString())
            .where('createdAt', '<=', endOfLastMonth.toISOString())
            .get();
        const weeks = { 1: 0, 2: 0, 3: 0, 4: 0 };
        snap.forEach(doc => {
            const data = doc.data();
            if (!data.startTime || !data.peopleCount) return;
            const date = new Date(data.startTime);
            const week = Math.min(Math.ceil(date.getDate() / 7), 4);
            weeks[week] += Number(data.peopleCount) || 1;
        });
        return weeks;
    });
};

/**
 * Current month sessions cached with a short TTL (3 minutes) and invalidated on writes.
 */
const getThisMonthSessions = (startOfThisMonthIso) =>
    cached(`analytics:this_month_sessions:${startOfThisMonthIso}`, 3 * MIN, async () =>
        wrap(await db.collection('sessions').where('createdAt', '>=', startOfThisMonthIso).get()));

/**
 * Last 24 hours sessions cached with a 3 minute TTL.
 */
const getLast24HoursSessions = (last24Iso) =>
    cached(`analytics:last24:${last24Iso.slice(0, 16)}`, 3 * MIN, async () =>
        wrap(await db.collection('sessions').where('createdAt', '>=', last24Iso).get()));

/**
 * Subscriptions cached for 15 minutes.
 */
const getSubscriptionDocs = () =>
    cached('subscriptions:all', 15 * MIN, async () => {
        const snap = await db.collection('subscriptions').orderBy('createdAt', 'desc').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });

const afterSubscriptionWrite = () => invalidate('subscriptions:');

// User profile in-memory cache
const userProfileCache = new Map();
const getUserProfile = async (uid) => {
    const hit = userProfileCache.get(uid);
    if (hit && hit.expires > Date.now()) return hit.data;
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) return null;
    const data = doc.data();
    userProfileCache.set(uid, { data, expires: Date.now() + 5 * MIN });
    return data;
};
const clearUserProfileCache = (uid) => {
    if (uid) userProfileCache.delete(uid);
    else userProfileCache.clear();
};

const afterSessionWrite = ({ historical = false } = {}) => {
    invalidate('sessions:', 'range:', 'analytics:this_month', 'analytics:dashboard', 'analytics:last24');
    if (historical) invalidate('rangeold:', 'analytics:last_month_growth');
};
const afterBookingWrite = () => invalidate('bookings:');
const afterPricingWrite = () => invalidate('settings:');
const afterSnackWrite = () => {
    invalidate('snacks:');
    if (global.io) global.io.emit('snacks:updated');
};

module.exports = {
    getActiveDocs, getUpcomingDocs, getSnackDocs, getPricingDoc,
    getSessionsInRange, getSessionsSince,
    getLastMonthGrowthBuckets, getThisMonthSessions, getLast24HoursSessions,
    getSubscriptionDocs, afterSubscriptionWrite,
    getUserProfile, clearUserProfileCache,
    afterSessionWrite, afterBookingWrite, afterPricingWrite, afterSnackWrite
};
