import React, { useState } from 'react';
import { FaBolt, FaCrown, FaMedal, FaCrosshairs } from 'react-icons/fa';
import { motion, type Variants } from 'framer-motion';

interface CoinEntry { phone: string; name: string; thunderCoins: number; }

const ThunderCoinsLeaderboard: React.FC<{ data: CoinEntry[]; loading?: boolean }> = ({ data, loading }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}>
            <motion.div
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ color: '#fbbf24', fontSize: '1.2rem', display: 'flex', gap: '12px', alignItems: 'center', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
                <FaBolt /> <span>Syncing Vault</span> <FaBolt />
            </motion.div>
        </div>
    );

    if (!data || !data.length) return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: '#64748b' }}
        >
            <div style={{ position: 'relative' }}>
                <FaBolt style={{ fontSize: '4rem', opacity: 0.1 }} />
                <motion.div 
                    animate={{ opacity: [0, 1, 0] }} 
                    transition={{ duration: 2, repeat: Infinity }} 
                    style={{ position: 'absolute', top: 0, left: 0, color: '#fbbf24', fontSize: '4rem', filter: 'blur(8px)' }}
                >
                    <FaBolt />
                </motion.div>
            </div>
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.3em', marginTop: '16px', fontWeight: 700 }}>VAULT EMPTY</span>
        </motion.div>
    );

    const formatName = (name: string) => name ? name.toUpperCase() : 'UNKNOWN HERO';
    const topPlayer = data[0];
    const runnersUp = data.slice(1);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, x: -30, skewX: -10 },
        show: { opacity: 1, x: 0, skewX: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', fontFamily: '"Inter", sans-serif' }}>
            
            {/* HERO STAT: GRAND CHAMPION */}
            {topPlayer && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(20, 20, 20, 1) 0%, rgba(10, 10, 10, 1) 100%)',
                        border: '1px solid #fbbf24',
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px -10px rgba(251, 191, 36, 0.3)',
                        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' // Cyberpunk cut corner
                    }}
                >
                    {/* Background glows and accents */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)', opacity: 0.8 }} />
                    <div style={{ position: 'absolute', bottom: '-40%', right: '-10%', fontSize: '12rem', opacity: 0.05, color: '#fbbf24', transform: 'rotate(-15deg)', pointerEvents: 'none' }}>
                        <FaCrown />
                    </div>
                    
                    {/* Striped overlay pattern */}
                    <div style={{ 
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                        background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251,191,36,0.03) 10px, rgba(251,191,36,0.03) 20px)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', zIndex: 1 }}>
                        <div style={{
                            width: '64px', height: '64px', 
                            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                            color: '#000', display: 'grid', placeItems: 'center',
                            fontSize: '2rem', boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
                            transform: 'rotate(5deg)', borderRadius: '4px'
                        }}>
                            <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                                <FaCrown />
                            </motion.div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#fbbf24', fontWeight: 900, textShadow: '0 0 8px rgba(251,191,36,0.5)' }}>
                                Supreme Leader
                            </span>
                            <span style={{ 
                                fontSize: '1.4rem', fontWeight: 900, color: '#fff', 
                                letterSpacing: '-0.02em', textTransform: 'uppercase',
                                lineHeight: '1.1',
                                background: 'linear-gradient(to bottom, #ffffff, #a3a3a3)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                            }}>
                                {formatName(topPlayer.name)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em', marginTop: '4px' }}>
                                ID://{topPlayer.phone.slice(-4) || 'XXXX'}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 1, paddingLeft: '20px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', color: '#fbbf24', fontSize: '2.5rem', fontWeight: 900, textShadow: '0 0 20px rgba(251,191,36,0.4)', lineHeight: '1' }}>
                            <FaBolt style={{ fontSize: '1.4rem', verticalAlign: 'middle' }} /> 
                            <span>{topPlayer.thunderCoins}</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', fontWeight: 700, marginTop: '4px' }}>
                            Thunder Coins
                        </span>
                    </div>
                </motion.div>
            )}

            {/* HIGH SCORE LOG (Runners Up) */}
            <div style={{ position: 'relative', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        ELITE ROSTER
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.15em' }}>
                        COINS
                    </span>
                </div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{ 
                        display: 'flex', flexDirection: 'column', gap: '8px', 
                        maxHeight: '380px', overflowY: 'auto', paddingRight: '6px',
                        scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent'
                    }}
                >
                    {runnersUp.map((item, idx) => {
                        const rank = idx + 2;
                        const isSilver = rank === 2;
                        const isBronze = rank === 3;
                        const isHovered = hoveredIndex === idx;
                        
                        let rankBg = 'rgba(255,255,255,0.03)';
                        let rankColor = '#64748b';
                        if (isSilver) { rankBg = 'linear-gradient(135deg, #f1f5f9, #94a3b8)'; rankColor = '#0f172a'; }
                        if (isBronze) { rankBg = 'linear-gradient(135deg, #f97316, #ea580c)'; rankColor = '#fff'; }

                        return (
                            <motion.div 
                                key={item.phone + idx}
                                variants={itemVariants}
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: isHovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                                    border: `1px solid ${isHovered ? (isSilver ? '#94a3b8' : isBronze ? '#ea580c' : 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.03)'}`,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'default',
                                    transition: 'background 0.2s ease, border 0.2s ease',
                                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)'
                                }}
                            >
                                {/* Hover scanline effect */}
                                {isHovered && (
                                    <motion.div 
                                        layoutId="hoverGlow"
                                        initial={{ x: '-100%', opacity: 0 }}
                                        animate={{ x: '100%', opacity: 0.1 }}
                                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%', background: 'linear-gradient(90deg, transparent, #ffffff, transparent)' }}
                                    />
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
                                    <div style={{
                                        width: '36px', height: '36px',
                                        background: rankBg, color: rankColor,
                                        display: 'grid', placeItems: 'center', fontSize: '1rem', fontWeight: 900,
                                        boxShadow: isSilver || isBronze ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
                                        transform: 'skewX(-10deg)'
                                    }}>
                                        <div style={{ transform: 'skewX(10deg)' }}>
                                            {isSilver || isBronze ? <FaMedal /> : String(rank).padStart(2, '0')}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: isSilver || isBronze ? '#f8fafc' : '#cbd5e1', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                                                {formatName(item.name)}
                                            </span>
                                            {(isSilver || isBronze) && (
                                                <span style={{ fontSize: '0.55rem', background: isSilver ? '#94a3b8' : '#ea580c', color: isSilver ? '#000' : '#fff', padding: '2px 6px', borderRadius: '10px', fontWeight: 800 }}>
                                                    {isSilver ? 'ELITE' : 'VANGUARD'}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.65rem', color: '#475569', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em' }}>
                                            USR_{item.phone.slice(-4) || 'XXXX'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                                    {isHovered && <FaCrosshairs style={{ fontSize: '0.7rem', color: '#fbbf24', opacity: 0.5 }} />}
                                    <span style={{ 
                                        fontFamily: '"JetBrains Mono", monospace', 
                                        fontSize: '1.2rem', 
                                        fontWeight: 900, 
                                        color: isHovered ? '#fbbf24' : (isSilver || isBronze ? '#f1f5f9' : '#94a3b8'),
                                        transition: 'color 0.2s',
                                        display: 'flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        {item.thunderCoins}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
};

export default ThunderCoinsLeaderboard;
