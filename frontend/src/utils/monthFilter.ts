/**
 * Utilities for the two-month rolling filter used in the Admin Dashboard.
 * Calculates current and previous calendar month from system date.
 * No manual configuration or database updates required.
 */

export interface MonthOption {
    key: string;   // "YYYY-MM" format used as API param
    label: string; // "November 2026"
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns the two available month options based on the current system date.
 * Index 0 = Current Month (default), Index 1 = Previous Month.
 */
export const getAvailableMonths = (now: Date = new Date()): MonthOption[] => {
    const currentYear  = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear  = currentMonth === 0 ? currentYear - 1 : currentYear;

    return [
        {
            key: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
            label: `${MONTH_NAMES[currentMonth]} ${currentYear}`
        },
        {
            key: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`,
            label: `${MONTH_NAMES[prevMonth]} ${prevYear}`
        }
    ];
};

/**
 * Returns a lowercase hyphenated filename-friendly month string.
 * e.g. "november-2026"
 */
export const monthKeyToFilename = (key: string): string => {
    const [year, month] = key.split('-').map(Number);
    return `${MONTH_NAMES[month - 1].toLowerCase()}-${year}`;
};

/**
 * Returns the month label for a given key.
 * e.g. "2026-11" → "November 2026"
 */
export const monthKeyToLabel = (key: string): string => {
    const [year, month] = key.split('-').map(Number);
    return `${MONTH_NAMES[month - 1]} ${year}`;
};
