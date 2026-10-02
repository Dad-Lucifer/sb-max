/**
 * Quick assertion test for istTime.js
 * Run: node backned/src/utils/__tests__/istTime.test.js
 */
'use strict';
const { getRange, istHour, istDateLabel, istDay } = require('../istTime');

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

// ── Spec case: 2026-10-03T19:06:00Z = IST 2026-10-04T00:36:00+05:30
// IST day = Oct 4 → IST midnight = 2026-10-03T18:30:00Z
const specNow = new Date('2026-10-03T19:06:00Z');
console.log('\n── getRange("today") ──');
const { start: todayStart, end: todayEnd } = getRange('today', specNow);
assert(
    todayStart.toISOString() === '2026-10-03T18:30:00.000Z',
    'today start = IST midnight of Oct 4',
    todayStart.toISOString(), '2026-10-03T18:30:00.000Z'
);
assert(
    todayEnd.toISOString() === '2026-10-04T18:30:00.000Z',
    'today end = IST midnight of Oct 5',
    todayEnd.toISOString(), '2026-10-04T18:30:00.000Z'
);

console.log('\n── getRange("yesterday") ──');
const { start: yStart, end: yEnd } = getRange('yesterday', specNow);
assert(
    yStart.toISOString() === '2026-10-02T18:30:00.000Z',
    'yesterday start = IST midnight of Oct 3',
    yStart.toISOString(), '2026-10-02T18:30:00.000Z'
);
assert(
    yEnd.toISOString() === '2026-10-03T18:30:00.000Z',
    'yesterday end = IST midnight of Oct 4 (exclusive)',
    yEnd.toISOString(), '2026-10-03T18:30:00.000Z'
);

console.log('\n── getRange("lastweek") ──');
const { start: wStart, end: wEnd } = getRange('lastweek', specNow);
assert(
    wStart.toISOString() === '2026-09-27T18:30:00.000Z',
    'lastweek start = IST midnight of Sep 28 (7 days before Oct 4)',
    wStart.toISOString(), '2026-09-27T18:30:00.000Z'
);
assert(
    wEnd.toISOString() === '2026-10-04T18:30:00.000Z',
    'lastweek end = IST midnight of Oct 5 (inclusive today)',
    wEnd.toISOString(), '2026-10-04T18:30:00.000Z'
);

console.log('\n── istHour ──');
// UTC 19:06 = IST 00:36 → hour 0
const h1 = istHour(new Date('2026-10-03T19:06:00Z'));
assert(h1 === 0, 'UTC 19:06 → IST hour 0', h1, 0);

// UTC 06:30 = IST 12:00 → hour 12
const h2 = istHour(new Date('2026-10-03T06:30:00Z'));
assert(h2 === 12, 'UTC 06:30 → IST hour 12', h2, 12);

// UTC 18:29 = IST 23:59 → hour 23
const h3 = istHour(new Date('2026-10-03T18:29:00Z'));
assert(h3 === 23, 'UTC 18:29 → IST hour 23', h3, 23);

console.log('\n── istDateLabel ──');
const lbl = istDateLabel(new Date('2026-10-03T19:06:00Z')); // IST = Oct 4
assert(lbl === '04 Oct', 'UTC 19:06 → IST label "04 Oct"', lbl, '04 Oct');

console.log('\n── istDay ──');
// 2026-10-03 (UTC) = Saturday; but IST 00:36 on Oct 4 = Sunday
const d = istDay(new Date('2026-10-03T19:06:00Z'));
assert(d === 0, 'UTC 19:06 on Sat Oct 3 → IST Sunday (0)', d, 0);

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
