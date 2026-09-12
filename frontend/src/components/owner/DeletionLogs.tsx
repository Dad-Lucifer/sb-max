import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaUserShield, FaUserTie, FaRedo, FaHistory } from 'react-icons/fa';
import './DeletionLogs.css';

interface DeletionLog {
    id: string;
    source: string; // 'Active Session' | 'Upcoming Booking'
    customerName: string;
    deletedBy: string; // 'Owner' | 'Employee'
    deletedByName: string;
    deletedAt: string;
    details: any;
}

const FILTERS = [
    { label: 'Today', value: 'today' },
    { label: 'Last Week', value: 'lastweek' },
    { label: 'This Month', value: 'thismonth' }
];

const DeletionLogs: React.FC = () => {
    const [logs, setLogs] = useState<DeletionLog[]>([]);
    const [filter, setFilter] = useState('today');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            // Simulate slight delay for better UX on fast networks
            await new Promise(r => setTimeout(r, 400));
            const res = await api.get(`/api/owner/logs?range=${filter}`);
            setLogs(res.data);
        } catch (err: any) {
            console.error('Failed to fetch deletion logs', err);
            // More descriptive error
            setError('System audit service unavailable');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const getRoleIcon = (role: string) => {
        return role.toLowerCase() === 'owner' ? <FaUserShield className="text-purple-400" /> : <FaUserTie className="text-blue-400" />;
    };

    return (
        <motion.div
            className="deletion-logs-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="logs-header">
                <div className="logs-title">
                    <div className="icon-box">
                        <FaTrash className="icon-red" />
                    </div>
                    <span>Deletion Audit</span>
                </div>

                <div className="logs-filter-wrapper flex gap-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`filter-tab ${filter === f.value ? 'active' : ''}`}
                        >
                            {f.label}
                            {filter === f.value && (
                                <motion.div
                                    layoutId="log-filter-pill"
                                    className="absolute inset-0 bg-white/10 rounded-lg -z-10"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="logs-list custom-scrollbar">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="logs-loading"
                        >
                            <div className="loading-dots">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                            <span className="text-xs uppercase tracking-widest mt-4">Syncing Audit Trail...</span>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="logs-error"
                        >
                            <p className="error-msg">{error}</p>
                            <button onClick={fetchLogs} className="retry-btn">
                                <FaRedo /> Retry Connection
                            </button>
                        </motion.div>
                    ) : logs.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="logs-empty"
                        >
                            <div className="empty-icon"><FaHistory /></div>
                            <p>No deletion records found for this period.</p>
                        </motion.div>
                    ) : (
                        <motion.div layout className="flex flex-col gap-3">
                            {logs.map((log, index) => (
                                <motion.div
                                    key={log.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="log-item"
                                >
                                    <div className="log-avatar">
                                        {getRoleIcon(log.deletedBy)}
                                    </div>

                                    <div className="log-content">
                                        <div className="log-details-top">
                                            <span className="log-target">{log.customerName}</span>
                                            <span className="log-time">
                                                {new Date(log.deletedAt).toLocaleTimeString('en-US', {
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        <div className="log-details-bottom">
                                            <span className="text-xs text-slate-400">Deleted from {log.source}</span>
                                            <span className="mx-1">•</span>
                                            <span className={`badge ${log.deletedBy.toLowerCase()}`}>
                                                {log.deletedBy.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default DeletionLogs;
