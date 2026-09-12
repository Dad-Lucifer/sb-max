import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, GradientTitle } from './ui/ModernComponents';
import { FaClock, FaCheckCircle, FaPlayCircle } from 'react-icons/fa';

interface Transaction {
    id: string;
    item: string;
    amount: number;
    status: 'active' | 'completed';
    time: string;
}

interface Props {
    timeFilter: string;
}

const RecentTransactions: React.FC<Props> = ({ timeFilter }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const range = timeFilter.toLowerCase().replace(' ', '');
                const res = await fetch(
                    `/api/owner/transactions?range=${range}`
                );
                const data = await res.json();
                setTransactions(data);
            } catch (err) {
                console.error('❌ Transactions fetch failed', err);
            }
        };

        fetchTransactions();
    }, [timeFilter]);

    return (
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
                        transition={{ delay: idx * 0.05 }}
                        className="txn-item"
                    >
                        <div className="txn-left">
                            <div className={`txn-icon ${txn.status}`}>
                                {txn.status === 'completed'
                                    ? <FaCheckCircle size={12} />
                                    : <FaPlayCircle size={12} />
                                }
                            </div>

                            <div className="txn-info">
                                <p className="txn-name">{txn.item}</p>
                                <p className="txn-time">
                                    <FaClock size={10} /> {txn.time}
                                </p>
                            </div>
                        </div>

                        <div className="txn-right">
                            <p className="txn-amount">₹{txn.amount || 0}</p>
                            <p className={`txn-status ${txn.status}`}>
                                {txn.status.toUpperCase()}
                            </p>
                        </div>
                    </motion.div>
                ))}

                {transactions.length === 0 && (
                    <p className="empty-state">No transactions found</p>
                )}
            </div>
        </GlassCard>
    );
};

export default RecentTransactions;
