import React, { useEffect, useRef } from 'react';

interface SnackData { name: any; value: any; }

/* ── helpers ── */
const EMOJIS: Record<string, string> = {
    chips: '🍟', cadbury: '🍫', maggie: '🍜', noodles: '🍜',
    redbull: '⚡', 'red bull': '⚡', sting: '⚡',
    water: '💧', coke: '🥤', pepsi: '🥤', sprite: '🥤',
    rio: '🍇', 'diet coke': '🥤', doritos: '🌮',
    chocolate: '🍫', biscuit: '🍪', coffee: '☕', juice: '🍹',
};

const CATEGORY_COLOR: Record<string, [string, string]> = {
    drink: ['#3b82f6', 'rgba(59,130,246,0.15)'],
    food:  ['#f59e0b', 'rgba(245,158,11,0.15)'],
};

const RANK_STYLES = [
    { badge: '🥇', bar: 'linear-gradient(90deg,#fbbf24,#f59e0b)', glow: 'rgba(251,191,36,0.4)' },
    { badge: '🥈', bar: 'linear-gradient(90deg,#94a3b8,#64748b)', glow: 'rgba(148,163,184,0.3)' },
    { badge: '🥉', bar: 'linear-gradient(90deg,#f97316,#ea580c)', glow: 'rgba(249,115,22,0.3)' },
];

const DRINK_KEYWORDS = ['coke','pepsi','sprite','water','redbull','red bull','sting','rio','juice','coffee','drink','tea'];

function getEmoji(name: string): string {
    const lower = name.toLowerCase();
    for (const [key, emoji] of Object.entries(EMOJIS)) {
        if (lower.includes(key)) return emoji;
    }
    return '🍿';
}

function getCategory(name: string): 'drink' | 'food' {
    const lower = name.toLowerCase();
    return DRINK_KEYWORDS.some(k => lower.includes(k)) ? 'drink' : 'food';
}

function normalize(data: SnackData[]): { name: string; value: number; emoji: string; category: 'drink' | 'food' }[] {
    return data
        .map(d => {
            let name = d.name;
            if (name && typeof name === 'object') name = name.name ?? name.label ?? '';
            name = String(name ?? '').trim();
            const value = Number(d.value) || 0;
            return { name, value, emoji: getEmoji(name), category: getCategory(name) };
        })
        .filter(d => d.name && !d.name.includes('[object') && d.value > 0)
        .sort((a, b) => b.value - a.value);
}

/* ── Animated bar ── */
const AnimatedBar: React.FC<{
    pct: number; gradient: string; glow: string; delay: number;
}> = ({ pct, gradient, glow, delay }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.width = '0%';
        const t = setTimeout(() => {
            el.style.width = `${pct}%`;
        }, delay);
        return () => clearTimeout(t);
    }, [pct, delay]);

    return (
        <div style={{
            flex: 1, height: '6px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '4px', overflow: 'hidden',
        }}>
            <div ref={ref} style={{
                height: '100%', borderRadius: '4px',
                background: gradient,
                boxShadow: `0 0 8px ${glow}`,
                transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                width: '0%',
            }} />
        </div>
    );
};

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
const SnacksConsumptionChart: React.FC<{ data: SnackData[]; loading?: boolean }> = ({ data, loading }) => {
    if (loading) return <div className="an-skeleton">Loading…</div>;

    const items = normalize(data);
    if (!items.length) return (
        <div className="an-empty"><span>No snacks consumed in the last 24 hrs</span></div>
    );

    const total = items.reduce((s, d) => s + d.value, 0);
    const max = items[0].value;
    const drinks = items.filter(i => i.category === 'drink');
    const foods  = items.filter(i => i.category === 'food');
    const topItem = items[0];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* ── Hero stat row ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: '0.75rem',
            }}>
                {[
                    { label: 'Total Consumed', value: String(total), color: '#fbbf24', sub: 'items today' },
                    { label: 'Top Pick',        value: topItem.emoji + ' ' + topItem.name, color: '#3b82f6', sub: `${topItem.value}× ordered` },
                    { label: 'Unique Items',    value: String(items.length), color: '#10b981', sub: `${foods.length} food · ${drinks.length} drinks` },
                ].map(s => (
                    <div key={s.label} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid rgba(255,255,255,0.07)`,
                        borderRadius: '12px',
                        padding: '0.85rem 1rem',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                            background: s.color, opacity: 0.8,
                        }} />
                        <div style={{
                            fontSize: '0.68rem', textTransform: 'uppercase',
                            letterSpacing: '0.07em', color: '#64748b',
                            fontWeight: 600, marginBottom: '4px',
                        }}>{s.label}</div>
                        <div style={{
                            fontSize: '1.1rem', fontWeight: 700,
                            color: '#f1f5f9', letterSpacing: '-0.01em',
                            whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>{s.value}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* ── Ranked list ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map((item, i) => {
                    const pct = (item.value / max) * 100;
                    const rank = RANK_STYLES[i] ?? null;
                    const [catColor, catBg] = CATEGORY_COLOR[item.category];
                    const barGrad = rank?.bar ?? `linear-gradient(90deg,${catColor},${catColor}88)`;
                    const glow   = rank?.glow ?? `${catColor}44`;
                    const isTop3 = i < 3;

                    return (
                        <div key={item.name} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: isTop3
                                ? `linear-gradient(90deg, rgba(255,255,255,0.04) 0%, transparent 100%)`
                                : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isTop3 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                            transition: 'all 0.18s ease',
                            cursor: 'default',
                        }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)';
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateX(3px)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.background = isTop3
                                    ? 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,transparent 100%)'
                                    : 'rgba(255,255,255,0.02)';
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
                            }}
                        >
                            {/* Rank badge */}
                            <div style={{
                                width: '32px', height: '32px',
                                borderRadius: '8px',
                                display: 'grid', placeItems: 'center',
                                fontSize: isTop3 ? '1.1rem' : '0.75rem',
                                fontWeight: 700, flexShrink: 0,
                                background: isTop3 ? 'transparent' : 'rgba(255,255,255,0.04)',
                                color: isTop3 ? 'inherit' : '#64748b',
                            }}>
                                {isTop3 ? rank!.badge : `#${i + 1}`}
                            </div>

                            {/* Emoji */}
                            <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>{item.emoji}</div>

                            {/* Name + bar */}
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <span style={{
                                        fontSize: '0.88rem', fontWeight: isTop3 ? 600 : 500,
                                        color: isTop3 ? '#f1f5f9' : '#94a3b8',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>{item.name}</span>
                                    <span style={{
                                        fontSize: '0.62rem', fontWeight: 700,
                                        padding: '1px 6px', borderRadius: '4px',
                                        background: catBg, color: catColor,
                                        border: `1px solid ${catColor}33`,
                                        flexShrink: 0, textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}>
                                        {item.category}
                                    </span>
                                </div>
                                <AnimatedBar pct={pct} gradient={barGrad} glow={glow} delay={i * 60} />
                            </div>

                            {/* Right: count + pct */}
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'flex-end', gap: '2px', flexShrink: 0,
                            }}>
                                <span style={{
                                    fontSize: '1.05rem', fontWeight: 700,
                                    color: isTop3 ? '#fbbf24' : '#94a3b8',
                                    lineHeight: 1,
                                }}>{item.value}×</span>
                                <span style={{
                                    fontSize: '0.68rem', color: '#475569', fontWeight: 600,
                                }}>{Math.round((item.value / total) * 100)}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Category split ── */}
            {foods.length > 0 && drinks.length > 0 && (
                <div style={{
                    display: 'flex', gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    alignItems: 'center',
                }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, flexShrink: 0 }}>SPLIT</span>
                    <div style={{ flex: 1, height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                        {(() => {
                            const foodTotal  = foods.reduce((s, f) => s + f.value, 0);
                            const foodPct    = Math.round((foodTotal / total) * 100);
                            return (
                                <>
                                    <div style={{ width: `${foodPct}%`, background: '#f59e0b', transition: 'width 0.8s ease' }} />
                                    <div style={{ flex: 1, background: '#3b82f6' }} />
                                </>
                            );
                        })()}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                        {[
                            { label: '🍟 Food',   col: '#f59e0b', items: foods  },
                            { label: '🥤 Drinks',  col: '#3b82f6', items: drinks },
                        ].map(cat => (
                            <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: cat.col, flexShrink: 0, display: 'inline-block' }} />
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                    {cat.label} <strong style={{ color: '#f1f5f9' }}>
                                        {cat.items.reduce((s, i) => s + i.value, 0)}
                                    </strong>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SnacksConsumptionChart;
