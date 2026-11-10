require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { db } = require('../src/config/firebase');
const { makeSearchKeys } = require('../src/services/customerService');

(async () => {
    const found = new Map();
    const add = (name, phone, seen) => {
        name = String(name || '').trim(); phone = String(phone || '').trim();
        if (!name || !phone || phone.includes('/')) return;
        const prev = found.get(phone);
        if (!prev || (seen || '') >= (prev.lastSeen || '')) found.set(phone, { name, lastSeen: seen || '' });
    };

    for (const col of ['sessions', 'bookings']) {
        const snap = await db.collection(col).get();
        snap.forEach(d => { const x = d.data(); add(x.customerName, x.contactNumber, x.createdAt); });
        console.log(`${col}: scanned ${snap.size}`);
    }
    const battles = await db.collection('battles').get();
    battles.forEach(d => {
        const b = d.data();
        [b.crownHolder, b.challenger].forEach(p => p && add(p.name, p.phone, b.createdAt));
    });
    console.log(`battles: scanned ${battles.size}`);

    const entries = [...found.entries()];
    for (let i = 0; i < entries.length; i += 400) {
        const batch = db.batch();
        for (const [phone, c] of entries.slice(i, i + 400)) {
            const nameLower = c.name.toLowerCase();
            batch.set(db.collection('customers').doc(phone), {
                name: c.name, nameLower, phone,
                searchKeys: makeSearchKeys(nameLower),
                lastSeen: c.lastSeen || new Date().toISOString()
            }, { merge: true });
        }
        await batch.commit();
    }
    console.log(`Done. ${entries.length} customers written.`);
    process.exit(0);
})();
