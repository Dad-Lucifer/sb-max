'use strict';

const MAX_KEYS = 2000;
const store = new Map();     // key -> { value, expires }
const inflight = new Map();  // key -> Promise
const stats = { hit: 0, miss: 0, joined: 0 };
let generation = 0;

async function cached(key, ttlMs, loader) {
    const hit = store.get(key);
    if (hit && hit.expires > Date.now()) { stats.hit++; return hit.value; }

    const running = inflight.get(key);
    if (running) { stats.joined++; return running; }

    stats.miss++;
    const startedAt = generation;
    const p = (async () => {
        const value = await loader();
        if (startedAt === generation) {
            if (store.size >= MAX_KEYS) store.delete(store.keys().next().value);
            store.set(key, { value, expires: Date.now() + ttlMs });
        }
        return value;
    })().finally(() => { if (inflight.get(key) === p) inflight.delete(key); });

    inflight.set(key, p);
    return p;
}

function invalidate(...prefixes) {
    generation++;
    for (const k of [...store.keys()]) if (prefixes.some(p => k.startsWith(p))) store.delete(k);
    for (const k of [...inflight.keys()]) if (prefixes.some(p => k.startsWith(p))) inflight.delete(k);
}

function keys() {
    return [...store.keys()];
}

function clear() {
    generation++;
    store.clear();
    inflight.clear();
}

setInterval(() => {
    console.log(`[cache] hit=${stats.hit} miss=${stats.miss} joined=${stats.joined} keys=${store.size}`);
}, 10 * 60_000).unref();

module.exports = { cached, invalidate, keys, clear };
