import api from '../../utils/api';
import { useState } from 'react';
import { monthKeyToFilename, monthKeyToLabel } from '../../utils/monthFilter';

/**
 * Custom Hook for handling Session Exports
 * Accepts an optional monthKey (YYYY-MM). If provided, exports only that month's data.
 * Returns { exportData, loading }
 */
export const useSessionExport = (monthKey?: string, timeFilter?: string) => {
    const [loading, setLoading] = useState(false);

    const exportData = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const hasSubFilter = timeFilter && timeFilter !== 'All Month';
            let url: string;

            if (hasSubFilter) {
                const rangeParam = timeFilter.toLowerCase().replace(/\s+/g, '');
                url = `/api/sessions/export-month?range=${rangeParam}`;
            } else if (monthKey) {
                url = `/api/sessions/export-month?month=${monthKey}`;
            } else {
                url = '/api/sessions/export';
            }

            const response = await api.get(url);
            const data = response.data;

            if (!data || data.length === 0) {
                alert('No session data available to export.');
                setLoading(false);
                return;
            }

            // Dynamically load XLSX only when exporting
            const XLSX = await import('xlsx');

            // 1. Create a new Workbook
            const wb = XLSX.utils.book_new();

            // 2. Build the title row: "SB GAMING DATABASE [ MONTH NAME ]"
            const monthLabel = monthKey
                ? monthKeyToLabel(monthKey).toUpperCase()
                : new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
            const titleText = `SB GAMING DATABASE [ ${monthLabel} ]`;

            // 3. Convert JSON to Sheet — prepend title rows
            const ws = XLSX.utils.json_to_sheet([]);

            // Insert title at A1
            XLSX.utils.sheet_add_aoa(ws, [[titleText]], { origin: 'A1' });
            // Insert blank row at A2
            XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A2' });
            // Insert data headers + rows starting at A3
            XLSX.utils.sheet_add_json(ws, data, { origin: 'A3' });

            // Merge title across all columns
            const colCount = Object.keys(data[0] || {}).length || 13;
            ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } }];

            // Style the title cell
            if (ws['A1']) {
                ws['A1'].s = {
                    font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: '991B1B' } },
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            }

            // 4. Auto-width columns
            const wscols = [
                { wch: 25 }, // Session Entry
                { wch: 12 }, // Date
                { wch: 10 }, // Time
                { wch: 20 }, // Name
                { wch: 15 }, // Phone Number
                { wch: 25 }, // Devices
                { wch: 10 }, // Duration
                { wch: 30 }, // Snacks
                { wch: 15 }, // Session Renewed
                { wch: 12 }, // Total Amount
                { wch: 10 }, // Cash
                { wch: 10 }, // Online
                { wch: 15 }, // Joined During
            ];
            ws['!cols'] = wscols;

            // Row height for title row
            ws['!rows'] = [{ hpx: 30 }, { hpx: 6 }];

            // 5. Append Sheet with month name as sheet name
            const sheetName = monthKey ? monthKeyToLabel(monthKey).substring(0, 31) : 'Session Report';
            XLSX.utils.book_append_sheet(wb, ws, sheetName);

            // 6. Generate File Name: e.g. admin-report-november-2026.xlsx or admin-report-today-november-2026.xlsx
            const fileMonthPart = monthKey ? monthKeyToFilename(monthKey) : new Date().toISOString().split('T')[0];
            const filterSuffix = hasSubFilter ? `-${timeFilter.toLowerCase().replace(/\s+/g, '-')}` : '';
            const fileName = `admin-report${filterSuffix}-${fileMonthPart}.xlsx`;

            // 7. Download
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error('Export Error:', error);
            alert('Failed to export session report. Please check the console for details.');
        } finally {
            setLoading(false);
        }
    };

    return { exportData, loading };
};
