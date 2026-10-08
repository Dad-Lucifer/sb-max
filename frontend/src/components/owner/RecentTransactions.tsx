import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GradientTitle } from './ui/ModernComponents';
import api from '../../utils/api';
import {
    FaClock, FaCheckCircle, FaPlayCircle, FaTimes, FaUser, FaPhone,
    FaGamepad, FaUsers, FaUtensils, FaMoneyBillWave, FaCreditCard,
    FaHistory, FaExpand, FaSync, FaCoins, FaMobile
} from 'react-icons/fa';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Transaction {
    id: string;
    item: string;
    amount: number;
    status: 'active' | 'completed';
    timestamp: string | null;
}

interface SnackItem {
    name: string;
    quantity: number;
    price: number | null;
}

interface TransactionDetail {
    id: string;
    customerName: string;
    contactNumber: string;
    gameName: string | null;
    peopleCount: number;
    duration: string;
    startTime: string | null;
    completedAt: string | null;
    status: string;
    devices: string[];
    snacks: SnackItem[];
    totalAmount: number;
    paidAmount: number;
    cashAmount: number;
    onlineAmount: number;
    paymentMethod: string;
    wasExtended: boolean;
    wasRenewed: boolean;
    membersAdded: number;
}

interface Props {
    timeFilter: string;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const formatTimestamp = (iso: string | null, showDate: boolean): string => {
    if (!iso) return '—';
    try {
        const opts: Intl.DateTimeFormatOptions = {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        };
        if (showDate) { opts.day = '2-digit'; opts.month = 'short'; }
        return new Intl.DateTimeFormat('en-IN', opts).format(new Date(iso));
    } catch { return '—'; }
};

const toRangeParam = (filter: string): string =>
    filter.toLowerCase().replace(/\s+/g, '');

/* ─────────────────────────────────────────────
   Detail Drawer
───────────────────────────────────────────── */
const DetailRow = ({ icon: Icon, label, value, highlight = false }: {
    icon: React.ElementType; label: string; value: React.ReactNode; highlight?: boolean;
}) => (
    <div className="detail-row">
        <div className="detail-row-label">
            <Icon size={12} />
            <span>{label}</span>
        </div>
        <div className={`detail-row-value ${highlight ? 'highlight' : ''}`}>{value}</div>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="drawer-section-title">{children}</p>
);

const TransactionDrawer = ({
    detail,
    onClose,
    showDate,
}: {
    detail: TransactionDetail | null;
    onClose: () => void;
    showDate: boolean;
}) => {
    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <AnimatePresence>
            {detail && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer panel */}
                    <motion.div
                        className="txn-drawer"
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="drawer-header">
                            <div>
                                <p className="drawer-header-label">SESSION RECEIPT</p>
                                <h3 className="drawer-header-name">{detail.customerName}</h3>
                            </div>
                            <div className="drawer-header-right">
                                <span className={`drawer-status-badge ${detail.status}`}>
                                    {detail.status === 'completed'
                                        ? <><FaCheckCircle size={10} /> COMPLETED</>
                                        : <><FaPlayCircle size={10} /> ACTIVE</>
                                    }
                                </span>
                                <button className="drawer-close-btn" onClick={onClose} aria-label="Close">
                                    <FaTimes size={16} />
                                </button>
                            </div>
                        </div>

                        {/* History pills */}
                        {(detail.wasRenewed || detail.wasExtended) && (
                            <div className="drawer-pills">
                                {detail.wasRenewed && (
                                    <span className="history-pill renewed">
                                        <FaSync size={9} />
                                        Renewed · {detail.membersAdded} member{detail.membersAdded !== 1 ? 's' : ''} added
                                    </span>
                                )}
                                {detail.wasExtended && (
                                    <span className="history-pill extended">
                                        <FaExpand size={9} />
                                        Time Extended
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="drawer-body custom-scrollbar">

                            {/* ── CUSTOMER ── */}
                            <SectionTitle>CUSTOMER</SectionTitle>
                            <div className="drawer-section">
                                <DetailRow icon={FaUser}  label="Name"    value={detail.customerName} />
                                <DetailRow icon={FaPhone} label="Contact" value={
                                    detail.contactNumber !== '—'
                                        ? <a href={`tel:${detail.contactNumber}`} className="contact-link">
                                            <FaMobile size={10} /> {detail.contactNumber}
                                          </a>
                                        : '—'
                                } />
                                <DetailRow icon={FaUsers}   label="People"  value={`${detail.peopleCount} person${detail.peopleCount !== 1 ? 's' : ''}`} />
                                {detail.gameName && (
                                    <DetailRow icon={FaGamepad} label="Game" value={detail.gameName} />
                                )}
                            </div>

                            {/* ── SESSION ── */}
                            <SectionTitle>SESSION</SectionTitle>
                            <div className="drawer-section">
                                <DetailRow icon={FaClock}   label="Start"    value={formatTimestamp(detail.startTime, showDate)} />
                                <DetailRow icon={FaCheckCircle} label="End"  value={formatTimestamp(detail.completedAt, showDate)} />
                                <DetailRow icon={FaHistory} label="Duration" value={detail.duration} highlight />
                            </div>

                            {/* ── DEVICES ── */}
                            <SectionTitle>DEVICES USED</SectionTitle>
                            <div className="drawer-section">
                                {detail.devices.length > 0 ? (
                                    <div className="device-chip-row">
                                        {detail.devices.map((d, i) => (
                                            <span key={i} className="device-chip">
                                                <FaGamepad size={10} /> {d}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="drawer-empty-note">No devices recorded</p>
                                )}
                            </div>

                            {/* ── SNACKS ── */}
                            <SectionTitle>SNACKS</SectionTitle>
                            <div className="drawer-section">
                                {detail.snacks.length > 0 ? (
                                    <div className="snack-list">
                                        {detail.snacks.map((sn, i) => (
                                            <div key={i} className="snack-row">
                                                <span className="snack-name">
                                                    <FaUtensils size={10} /> {sn.name}
                                                </span>
                                                <span className="snack-qty">×{sn.quantity}</span>
                                                {sn.price != null && (
                                                    <span className="snack-price">₹{sn.price * sn.quantity}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="drawer-empty-note">No snacks ordered</p>
                                )}
                            </div>

                            {/* ── PAYMENT ── */}
                            <SectionTitle>PAYMENT</SectionTitle>
                            <div className="drawer-section">
                                <DetailRow icon={FaMoneyBillWave} label="Total"  value={`₹${detail.totalAmount.toLocaleString('en-IN')}`} highlight />
                                <DetailRow icon={FaCoins}         label="Paid"   value={`₹${detail.paidAmount.toLocaleString('en-IN')}`} />
                                {detail.cashAmount > 0 && (
                                    <DetailRow icon={FaMoneyBillWave} label="Cash"   value={`₹${detail.cashAmount.toLocaleString('en-IN')}`} />
                                )}
                                {detail.onlineAmount > 0 && (
                                    <DetailRow icon={FaCreditCard}    label="Online" value={`₹${detail.onlineAmount.toLocaleString('en-IN')}`} />
                                )}
                                <DetailRow icon={FaCreditCard} label="Method" value={
                                    <span className="payment-method-badge">{detail.paymentMethod}</span>
                                } />
                            </div>

                            {/* Remaining balance warning */}
                            {detail.totalAmount - detail.paidAmount > 0 && (
                                <div className="balance-warning">
                                    <FaCoins size={12} />
                                    <span>Balance due: <strong>₹{(detail.totalAmount - detail.paidAmount).toLocaleString('en-IN')}</strong></span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const RecentTransactions: React.FC<Props> = ({ timeFilter }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<TransactionDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const showDate = toRangeParam(timeFilter) !== 'today';

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const range = toRangeParam(timeFilter);
                const res = await api.get(`/api/owner/transactions?range=${range}`);
                setTransactions(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('❌ Transactions fetch failed', err);
                setTransactions([]);
            }
        };
        fetchTransactions();
    }, [timeFilter]);

    const openDetail = useCallback(async (id: string) => {
        setSelectedId(id);
        setDetail(null);
        setDetailLoading(true);
        try {
            const res = await api.get(`/api/owner/transaction/${id}`);
            setDetail(res.data);
        } catch (err) {
            console.error('❌ Detail fetch failed', err);
            setDetail(null);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const closeDetail = useCallback(() => {
        setSelectedId(null);
        setDetail(null);
    }, []);

    return (
        <>
            <GlassCard className="txn-panel">
                <div className="panel-header">
                    <GradientTitle size="medium">Live Transactions</GradientTitle>
                    <span className="live-badge">● LIVE FEED</span>
                </div>

                <div className="txn-list custom-scrollbar">
                    {transactions.map((txn, idx) => (
                        <motion.div
                            key={txn.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={`txn-item clickable ${selectedId === txn.id ? 'txn-item--selected' : ''}`}
                            onClick={() => openDetail(txn.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && openDetail(txn.id)}
                            aria-label={`View details for ${txn.item}`}
                        >
                            <div className="txn-left">
                                <div className={`txn-icon ${txn.status}`}>
                                    {txn.status === 'completed'
                                        ? <FaCheckCircle size={12} />
                                        : <FaPlayCircle  size={12} />
                                    }
                                </div>
                                <div className="txn-info">
                                    <p className="txn-name">{txn.item}</p>
                                    <p className="txn-time">
                                        <FaClock size={10} /> {formatTimestamp(txn.timestamp, showDate)}
                                    </p>
                                </div>
                            </div>
                            <div className="txn-right">
                                <p className="txn-amount">₹{txn.amount ?? 0}</p>
                                <p className={`txn-status ${txn.status}`}>
                                    {txn.status.toUpperCase()}
                                </p>
                                <span className="txn-expand-hint">›</span>
                            </div>
                        </motion.div>
                    ))}

                    {transactions.length === 0 && (
                        <p className="empty-state">No transactions yet</p>
                    )}
                </div>
            </GlassCard>

            {/* Loading skeleton while detail fetches */}
            {detailLoading && (
                <div className="drawer-backdrop" style={{ zIndex: 199 }}>
                    <div className="drawer-loading-spinner" />
                </div>
            )}

            <TransactionDrawer
                detail={detail}
                onClose={closeDetail}
                showDate={showDate}
            />

            <style>{`
                /* ══════════════════════════════
                   Clickable row enhancements
                ══════════════════════════════ */
                .txn-item.clickable {
                    cursor: pointer;
                    transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease;
                    border-radius: 10px;
                    border: 1px solid transparent;
                    margin-bottom: 2px;
                }
                .txn-item.clickable:hover {
                    background: rgba(220, 38, 38, 0.06);
                    border-color: rgba(220, 38, 38, 0.18);
                    transform: translateX(3px);
                }
                .txn-item.clickable:active {
                    transform: scale(0.98);
                }
                .txn-item--selected {
                    background: rgba(220, 38, 38, 0.1) !important;
                    border-color: rgba(220, 38, 38, 0.35) !important;
                }
                .txn-expand-hint {
                    color: rgba(148, 163, 184, 0.5);
                    font-size: 1.1rem;
                    margin-left: 6px;
                    transition: color 0.2s, transform 0.2s;
                    line-height: 1;
                }
                .txn-item.clickable:hover .txn-expand-hint {
                    color: #dc2626;
                    transform: translateX(3px);
                }

                /* ══════════════════════════════
                   Backdrop
                ══════════════════════════════ */
                .drawer-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.55);
                    backdrop-filter: blur(4px);
                    z-index: 200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .drawer-loading-spinner {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 3px solid rgba(220, 38, 38, 0.2);
                    border-top-color: #dc2626;
                    animation: drawerSpin 0.7s linear infinite;
                }
                @keyframes drawerSpin {
                    to { transform: rotate(360deg); }
                }

                /* ══════════════════════════════
                   Drawer Panel
                ══════════════════════════════ */
                .txn-drawer {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: min(420px, 95vw);
                    background: #0d0d12;
                    border-left: 1px solid rgba(220, 38, 38, 0.25);
                    box-shadow: -20px 0 60px rgba(0, 0, 0, 0.7);
                    z-index: 201;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                }

                /* Header */
                .drawer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.4rem 1.4rem 1rem;
                    border-bottom: 1px solid rgba(220, 38, 38, 0.15);
                    background: rgba(220, 38, 38, 0.04);
                    flex-shrink: 0;
                }
                .drawer-header-label {
                    font-size: 0.65rem;
                    font-weight: 700;
                    letter-spacing: 3px;
                    color: #dc2626;
                    margin: 0 0 6px;
                }
                .drawer-header-name {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #fff;
                    margin: 0;
                    line-height: 1.2;
                }
                .drawer-header-right {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 10px;
                }
                .drawer-status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.65rem;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    padding: 4px 10px;
                    border-radius: 99px;
                    white-space: nowrap;
                }
                .drawer-status-badge.completed {
                    background: rgba(34, 197, 94, 0.12);
                    color: #4ade80;
                    border: 1px solid rgba(34, 197, 94, 0.25);
                }
                .drawer-status-badge.active {
                    background: rgba(251, 191, 36, 0.12);
                    color: #fbbf24;
                    border: 1px solid rgba(251, 191, 36, 0.25);
                }
                .drawer-close-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .drawer-close-btn:hover {
                    background: rgba(220, 38, 38, 0.15);
                    border-color: rgba(220, 38, 38, 0.3);
                    color: #f87171;
                }

                /* History pills */
                .drawer-pills {
                    display: flex;
                    gap: 8px;
                    padding: 10px 1.4rem;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    flex-wrap: wrap;
                    flex-shrink: 0;
                }
                .history-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 99px;
                    letter-spacing: 0.5px;
                }
                .history-pill.renewed {
                    background: rgba(139, 92, 246, 0.12);
                    color: #a78bfa;
                    border: 1px solid rgba(139, 92, 246, 0.25);
                }
                .history-pill.extended {
                    background: rgba(251, 191, 36, 0.1);
                    color: #fbbf24;
                    border: 1px solid rgba(251, 191, 36, 0.2);
                }

                /* Body */
                .drawer-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.1rem 1.4rem 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.1rem;
                }
                .drawer-section-title {
                    font-size: 0.62rem;
                    font-weight: 700;
                    letter-spacing: 3px;
                    color: rgba(148, 163, 184, 0.6);
                    margin: 0 0 8px;
                    text-transform: uppercase;
                }
                .drawer-section {
                    background: rgba(255, 255, 255, 0.025);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 10px;
                    padding: 0.8rem 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                /* Rows */
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }
                .detail-row-label {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    color: #64748b;
                    font-size: 0.78rem;
                    font-weight: 500;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .detail-row-label svg { color: #475569; }
                .detail-row-value {
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    text-align: right;
                    word-break: break-word;
                }
                .detail-row-value.highlight {
                    color: #ffffff;
                    font-size: 0.9rem;
                    font-weight: 700;
                }
                .contact-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    color: #60a5fa;
                    text-decoration: none;
                }
                .contact-link:hover { text-decoration: underline; }

                /* Devices */
                .device-chip-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                .device-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(220, 38, 38, 0.1);
                    border: 1px solid rgba(220, 38, 38, 0.2);
                    color: #fca5a5;
                    font-size: 0.72rem;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 6px;
                    letter-spacing: 0.5px;
                }

                /* Snacks */
                .snack-list { display: flex; flex-direction: column; gap: 8px; }
                .snack-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .snack-name {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    color: #cbd5e1;
                    font-weight: 500;
                    flex: 1;
                }
                .snack-qty {
                    font-size: 0.75rem;
                    color: #64748b;
                    font-weight: 600;
                    min-width: 28px;
                    text-align: right;
                }
                .snack-price {
                    font-size: 0.78rem;
                    color: #4ade80;
                    font-weight: 700;
                    min-width: 48px;
                    text-align: right;
                }

                /* Payment method */
                .payment-method-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(99, 102, 241, 0.12);
                    border: 1px solid rgba(99, 102, 241, 0.25);
                    color: #a5b4fc;
                    font-size: 0.72rem;
                    font-weight: 600;
                    padding: 3px 10px;
                    border-radius: 6px;
                }

                /* Balance warning */
                .balance-warning {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(251, 191, 36, 0.07);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                    border-radius: 8px;
                    padding: 10px 14px;
                    color: #fbbf24;
                    font-size: 0.8rem;
                }
                .balance-warning strong { font-weight: 700; }

                /* Empty note */
                .drawer-empty-note {
                    font-size: 0.78rem;
                    color: #475569;
                    font-style: italic;
                    margin: 0;
                    text-align: center;
                    padding: 4px 0;
                }

                /* Mobile responsive */
                @media (max-width: 480px) {
                    .txn-drawer { width: 100vw; border-left: none; }
                    .drawer-header { padding: 1.1rem 1.1rem 0.8rem; }
                    .drawer-body { padding: 0.9rem 1.1rem 2rem; }
                    .drawer-header-name { font-size: 1.1rem; }
                }
            `}</style>
        </>
    );
};

export default RecentTransactions;
