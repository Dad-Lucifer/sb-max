'use strict';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 330 min in ms

/**
 * Returns a new Date representing 00:00:00 IST of the IST day
 * that `now` falls in, expressed as a UTC instant.
 *
 *   Example: now = 2026-10-03T19:06:00Z
 *     IST  = 2026-10-04T00:36:00+05:30
 *     IST midnight = 2026-10-04T00:00:00+05:30 = 2026-10-03T18:30:00Z
 */
const startOfIstDay = (now) => {
    const shifted = new Date(now.getTime() + IST_OFFSET_MS);
    shifted.setUTCHours(0, 0, 0, 0);
    return new Date(shifted.getTime() - IST_OFFSET_MS);
};

/**
 * Returns { start, end } as UTC Dates (end is exclusive).
 */
const getRange = (range, now = new Date()) => {
    const todayStart = startOfIstDay(now);

    switch (range) {
        case 'today':
            return {
                start: todayStart,
                end: new Date(todayStart.getTime() + 24 * 3600_000)
            };

        case 'yesterday': {
            const yStart = new Date(todayStart.getTime() - 24 * 3600_000);
            return { start: yStart, end: todayStart };
        }

        case 'lastweek': {
            const weekStart = new Date(todayStart.getTime() - 6 * 24 * 3600_000);
            return {
                start: weekStart,
                end: new Date(todayStart.getTime() + 24 * 3600_000)
            };
        }

        case 'thismonth': {
            // IST 1st of this month at 00:00 IST
            const shifted = new Date(now.getTime() + IST_OFFSET_MS);
            shifted.setUTCDate(1);
            shifted.setUTCHours(0, 0, 0, 0);
            const monthStart = new Date(shifted.getTime() - IST_OFFSET_MS);

            // IST 1st of next month at 00:00 IST
            const shifted2 = new Date(now.getTime() + IST_OFFSET_MS);
            shifted2.setUTCMonth(shifted2.getUTCMonth() + 1, 1);
            shifted2.setUTCHours(0, 0, 0, 0);
            const monthEnd = new Date(shifted2.getTime() - IST_OFFSET_MS);

            return { start: monthStart, end: monthEnd };
        }

        default:
            return getRange('today', now);
    }
};

/**
 * Returns the IST hour (0-23) of a UTC Date without any locale dependency.
 */
const istHour = (date) => {
    const shifted = new Date(date.getTime() + IST_OFFSET_MS);
    return shifted.getUTCHours();
};

/**
 * Returns a human-readable IST date label "03 Oct" style.
 */
const istDateLabel = (date) => {
    const shifted = new Date(date.getTime() + IST_OFFSET_MS);
    const day = String(shifted.getUTCDate()).padStart(2, '0');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = months[shifted.getUTCMonth()];
    return `${day} ${month}`;
};

/**
 * Returns IST day-of-week (0=Sun … 6=Sat).
 */
const istDay = (date) => {
    const shifted = new Date(date.getTime() + IST_OFFSET_MS);
    return shifted.getUTCDay();
};

/**
 * Returns IST { hours, minutes } of a UTC Date.
 */
const istHM = (date) => {
    const shifted = new Date(date.getTime() + IST_OFFSET_MS);
    return { hours: shifted.getUTCHours(), minutes: shifted.getUTCMinutes() };
};

module.exports = { startOfIstDay, getRange, istHour, istDateLabel, istDay, istHM };
