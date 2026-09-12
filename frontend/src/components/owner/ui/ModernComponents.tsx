
import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import './ModernUI.css';

// --- Base Container ---
export const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        className={`modern-glass-panel ${className}`}
    >
        {children}
    </motion.div>
);

// --- Typography ---
export const GradientTitle = ({ children, size = "large" }: { children: React.ReactNode, size?: "large" | "medium" }) => (
    <h2 className={`modern-title ${size === 'large' ? 'text-2xl' : 'text-xl'}`}>
        {children}
    </h2>
);

// --- Indicators ---
export const TrendBadge = ({ value, isPositive }: { value: string | number, isPositive: boolean }) => (
    <div className={`modern-badge ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
        {value}%
    </div>
);

// --- Interactive Elements ---
export const TabGroup = ({ options, active, onChange }: { options: string[], active: string, onChange: (o: string) => void }) => (
    <div className="modern-tabs">
        {options.map(opt => (
            <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`modern-tab-item ${active === opt ? 'active' : ''}`}
            >
                {opt}
            </button>
        ))}
    </div>
);

export const ActionButton = ({ icon: Icon, label, onClick, variant = 'primary' }: { icon: any, label: string, onClick?: () => void, variant?: 'primary' | 'ghost' }) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`modern-btn ${variant}`}
    >
        <Icon size={16} />
        {label}
    </motion.button>
);

// --- Stats ---
interface QuickStatProps {
    label: string;
    value: string;
    trend: number;
    icon: any;
    delay?: number;
}

export const QuickStat = ({ label, value, trend, icon: Icon, delay }: QuickStatProps) => (
    <GlassCard delay={delay} className="stat-card-wrapper">
        <div className="stat-icon-bg">
            <Icon size={24} />
        </div>
        <div className="stat-content">
            <div className="flex-between">
                <span className="stat-label">{label}</span>
                {trend !== 0 && (
                    <TrendBadge value={Math.abs(trend)} isPositive={trend > 0} />
                )}
            </div>
            <h3 className="stat-value">{value}</h3>
        </div>
    </GlassCard>
);
