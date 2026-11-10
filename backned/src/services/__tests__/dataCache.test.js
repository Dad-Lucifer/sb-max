/**
 * Unit test for cache.js and dataCache invalidation rules.
 * Run: node backned/src/services/__tests__/dataCache.test.js
 */
'use strict';
const { cached, invalidate, keys } = require('../../utils/cache');
const { afterSessionWrite, afterBookingWrite } = require('../dataCache');

let passed = 0;
let failed = 0;

function assert(condition, label, got, expected) {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.error(`  ❌ ${label}\n     got:      ${got}\n     expected: ${expected}`);
        failed++;
    }
}

async function runTests() {
    console.log('\n── Basic Caching & TTL ──');
    let callCount = 0;
    const compute = async () => {
        callCount++;
        return { data: 'test_val' };
    };

    const res1 = await cached('test:key', 1000, compute);
    const res2 = await cached('test:key', 1000, compute);
    assert(callCount === 1, 'cached() returns cached value without re-evaluating compute', callCount, 1);
    assert(res1.data === res2.data, 'cached() returns identical data', res2.data, 'test_val');

    console.log('\n── Invalidation Isolation (Historical vs Current Month) ──');
    // Simulate populating cache keys
    await cached('analytics:last_month_growth:2026-09-01T00:00:00.000Z', 30 * 24 * 60 * 60 * 1000, async () => ({ 1: 50, 2: 40 }));
    await cached('rangeold:2026-09-01|2026-09-30', 30 * 24 * 60 * 60 * 1000, async () => [{ id: 's1' }]);
    await cached('analytics:this_month_sessions:2026-10-01', 3 * 60 * 1000, async () => [{ id: 's2' }]);
    await cached('analytics:dashboard_full', 3 * 60 * 1000, async () => ({ stats: {} }));
    await cached('range:2026-10-01|2026-10-10', 2 * 60 * 1000, async () => [{ id: 's3' }]);
    await cached('sessions:active', 5 * 60 * 1000, async () => [{ id: 's4' }]);

    // Trigger normal session write
    afterSessionWrite();

    const snapshotAfterWrite = keys();
    const hasLastMonthGrowth = snapshotAfterWrite.some(k => k.startsWith('analytics:last_month_growth:'));
    const hasRangeOld = snapshotAfterWrite.some(k => k.startsWith('rangeold:'));
    const hasThisMonth = snapshotAfterWrite.some(k => k.startsWith('analytics:this_month_sessions:'));
    const hasDashboard = snapshotAfterWrite.some(k => k.startsWith('analytics:dashboard_full'));
    const hasRange = snapshotAfterWrite.some(k => k.startsWith('range:'));
    const hasActive = snapshotAfterWrite.some(k => k.startsWith('sessions:active'));

    assert(hasLastMonthGrowth === true, 'Last month growth cache was PRESERVED after session write', hasLastMonthGrowth, true);
    assert(hasRangeOld === true, 'Historical range cache was PRESERVED after session write', hasRangeOld, true);
    assert(hasThisMonth === false, 'Current month cache was PURGED after session write', hasThisMonth, false);
    assert(hasDashboard === false, 'Dashboard aggregate cache was PURGED after session write', hasDashboard, false);
    assert(hasRange === false, 'Current range cache was PURGED after session write', hasRange, false);
    assert(hasActive === false, 'Active sessions cache was PURGED after session write', hasActive, false);

    console.log('\n────────────────────────────────────────');
    console.log(`Results: ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error('Test run error:', err);
    process.exit(1);
});
