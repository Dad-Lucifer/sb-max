
import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    trendIcon?: React.ReactNode;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendIcon, color = "var(--accent-yellow)" }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="cyber-card"
            style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Glow effect background */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '100px',
                height: '100px',
                background: color,
                filter: 'blur(50px)',
                opacity: 0.15,
                pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 500
                }}>{title}</h3>
                {icon && <div style={{ color: color, fontSize: '1.5rem', filter: `drop-shadow(0 0 8px ${color}40)` }}>{icon}</div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <div style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)'
                }}>{value}</div>
                {trend && (
                    <div style={{
                        fontSize: '0.875rem',
                        color: parseInt(trend) > 0 ? '#10b981' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {trendIcon}
                        {trend}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default StatCard;
