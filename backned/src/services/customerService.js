'use strict';
const { db } = require('../config/firebase');

const makeSearchKeys = (nameLower) => {
    const keys = new Set();
    for (const word of nameLower.split(/\s+/).filter(Boolean)) {
        for (let i = 2; i <= Math.min(word.length, 15); i++) keys.add(word.slice(0, i));
    }
    return [...keys];
};

const recentlyWritten = new Map();
const SIX_H = 6 * 3600_000;

async function upsertCustomer(name, phone) {
    const n = String(name || '').trim();
    const p = String(phone || '').trim();
    if (!n || !p || p.includes('/')) return;

    const last = recentlyWritten.get(p);
    if (last && last.name === n && Date.now() - last.at < SIX_H) return;
    recentlyWritten.set(p, { name: n, at: Date.now() });
    if (recentlyWritten.size > 5000) recentlyWritten.delete(recentlyWritten.keys().next().value);

    try {
        const nameLower = n.toLowerCase();
        await db.collection('customers').doc(p).set({
            name: n, nameLower, phone: p,
            searchKeys: makeSearchKeys(nameLower),
            lastSeen: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.error('upsertCustomer failed:', e.message);
    }
}

module.exports = { upsertCustomer, makeSearchKeys };
