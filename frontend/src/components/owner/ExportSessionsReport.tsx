import { useState } from 'react';
import * as XLSX from 'xlsx';

/**
 * Custom Hook for handling Session Exports
 * Returns { exportData, loading }
 */
export const useSessionExport = () => {
    const [loading, setLoading] = useState(false);

    const exportData = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const response = await fetch('/api/sessions/export');

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Export failed');
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                alert('No session data available to export.');
                setLoading(false);
                return;
            }

            // 1. Create a new Workbook
            const wb = XLSX.utils.book_new();

            // 2. Convert JSON to Sheet
            const ws = XLSX.utils.json_to_sheet(data);

            // 3. Auto-width columns (Simple heuristic)
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

            // 4. Append Sheet
            XLSX.utils.book_append_sheet(wb, ws, "Session Report");

            // 5. Generate File Name
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Thunder_Sessions_Report_${dateStr}.xlsx`;

            // 6. Download
            XLSX.writeFile(wb, fileName);

            // console.log("✅ Export successful");

        } catch (error) {
            console.error('Export Error:', error);
            alert('Failed to export session report. Please check the console for details.');
        } finally {
            setLoading(false);
        }
    };

    return { exportData, loading };
};
