
import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaMinus, FaDownload, FaInbox } from 'react-icons/fa';
import * as XLSX from 'xlsx';

// --- Comparison Badge ---
interface ComparisonBadgeProps {
    type: 'up' | 'down' | 'neutral';
    value: number; // percentage
    absolute: string;
}

export const ComparisonBadge: React.FC<ComparisonBadgeProps> = ({ type, value, absolute }) => {
    return (
        <div className={`owner-badge ${type}`}>
            {type === 'up' && <FaArrowUp size={10} style={{ marginRight: 4 }} />}
            {type === 'down' && <FaArrowDown size={10} style={{ marginRight: 4 }} />}
            {type === 'neutral' && <FaMinus size={10} style={{ marginRight: 4 }} />}
            <span>{Math.abs(value)}% ({absolute})</span>
        </div>
    );
};

// --- Stat Card ---
interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    trend: 'up' | 'down' | 'neutral';
    trendValue: number;
    trendAbsolute: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, trendValue, trendAbsolute }) => {
    return (
        <motion.div
            className="owner-card"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <ComparisonBadge type={trend} value={trendValue} absolute={trendAbsolute} />
            </div>
            <div style={{ color: 'var(--owner-text-muted)', fontSize: '0.875rem' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--owner-text)', marginTop: '0.25rem' }}>{value}</div>
        </motion.div>
    );
};

// --- Section Header ---
interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => {
    return (
        <div className="owner-section-header">
            <div>
                <div className="owner-title">{title}</div>
                {subtitle && <div style={{ fontSize: '0.875rem', color: 'var(--owner-text-muted)', marginLeft: '0.75rem', marginTop: '0.25rem' }}>{subtitle}</div>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};

// --- Filter Tabs ---
interface FilterTabsProps {
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ options, selected, onSelect }) => {
    return (
        <div className="owner-tabs">
            {options.map((opt) => (
                <button
                    key={opt}
                    className={`owner-tab ${selected === opt ? 'active' : ''}`}
                    onClick={() => onSelect(opt)}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
};

// --- Download Button ---
interface DownloadButtonProps {
    data: any[];
    fileName: string;
    label?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ data, fileName, label = "Download Report" }) => {
    const handleDownload = () => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    return (
        <button
            onClick={handleDownload}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--owner-primary)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600
            }}
        >
            <FaDownload size={14} />
            {label}
        </button>
    );
};

// --- Empty State ---
export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        color: 'var(--owner-text-muted)',
        border: '1px dashed var(--owner-border)',
        borderRadius: '12px'
    }}>
        <FaInbox size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>{message}</p>
    </div>
);

// --- Chart Container ---
export const ChartContainer: React.FC<{ children: React.ReactNode; height?: number }> = ({ children, height = 300 }) => {
    return (
        <div className="owner-card" style={{ height: height + 50, padding: '1rem' }}>
            <div style={{ width: '100%', height: '100%' }}>
                {children}
            </div>
        </div>
    );
};
