import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaCalendarAlt } from 'react-icons/fa';
import { GlassCard, GradientTitle } from './ui/ModernComponents';
import './SubscriptionOverview.css';

interface Subscription {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    price: number;
    cycle: 'monthly' | 'yearly';
    category: string;
}

const SubscriptionOverview: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        startDate: '',
        endDate: '',
        price: '',
        cycle: 'monthly' as 'monthly' | 'yearly',
        category: 'general'
    });

    const fetchSubscriptions = async () => {
        try {
            const res = await axios.get('/api/subscription/subscriptions');
            setSubscriptions(res.data);
        } catch (err) {
            console.error('Failed to fetch subscriptions', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/subscription/subscriptions', form);
            setForm({
                name: '',
                startDate: '',
                endDate: '',
                price: '',
                cycle: 'monthly',
                category: 'general'
            });
            setIsFormOpen(false);
            fetchSubscriptions();
        } catch (err) {
            console.error('Failed to create subscription', err);
            alert('Failed to save subscription');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this subscription?')) return;
        try {
            await axios.delete(`/api/subscription/subscriptions/${id}`);
            setSubscriptions(prev => prev.filter(sub => sub.id !== id));
        } catch (err) {
            console.error('Failed to delete subscription', err);
        }
    };

    const getStatus = (endDate: string) => {
        if (!endDate) return { label: 'Unknown', class: 'expired', icon: FaTimesCircle };
        const end = new Date(endDate);
        if (isNaN(end.getTime())) return { label: 'Invalid', class: 'expired', icon: FaTimesCircle };
        const now = new Date();
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Expired', class: 'expired', icon: FaTimesCircle };
        if (diffDays <= 7) return { label: 'Expiring', class: 'expiring', icon: FaExclamationCircle };
        return { label: 'Active', class: 'active', icon: FaCheckCircle };
    };

    const totalExpense = subscriptions.reduce((sum, sub) => sum + (Number(sub.price) || 0), 0);
    const activeCount = subscriptions.filter(sub => sub.endDate && new Date(sub.endDate) > new Date()).length;

    return (
        <GlassCard className="sub-overview-panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
                <GradientTitle size="medium">Subscriptions & Bills</GradientTitle>
                <button
                    className="add-snack-btn"
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        color: '#fff',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem'
                    }}
                >
                    <FaPlus /> {isFormOpen ? 'Cancel' : 'New Bill'}
                </button>
            </div>

            <div className="sub-overview-container">
                {/* Summary Cards */}
                <div className="sub-summary-grid">
                    <div className="summary-card-inner">
                        <span className="summary-label">Monthly Burn</span>
                        <span className="summary-value">₹{(totalExpense || 0).toLocaleString()}</span>
                        <span className="summary-subtext">Total recurrent costs</span>
                    </div>
                    <div className="summary-card-inner">
                        <span className="summary-label">Active Services</span>
                        <span className="summary-value">{activeCount}</span>
                        <span className="summary-subtext">Currently running</span>
                    </div>
                </div>

                {/* Add Form */}
                <AnimatePresence>
                    {isFormOpen && (
                        <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="add-entry-form"
                            onSubmit={handleSubmit}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Bill/Service Name</label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Electricity, ISP"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={form.price}
                                        onChange={e => setForm({ ...form, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Cycle</label>
                                    <select
                                        className="form-select"
                                        value={form.cycle}
                                        onChange={e => setForm({ ...form, cycle: e.target.value as any })}
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        className="form-select"
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                    >
                                        <option value="utility">Utility</option>
                                        <option value="rent">Rent</option>
                                        <option value="salary">Salary</option>
                                        <option value="internet">Internet</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="submit-btn">Save Subscription</button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* List Section */}
                <div className="list-section custom-scrollbar">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>
                            No active subscriptions tracked.
                        </p>
                    ) : (
                        subscriptions.map((sub, idx) => {
                            const status = getStatus(sub.endDate);
                            const StatusIcon = status.icon;
                            return (
                                <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="list-item"
                                >
                                    <div className="item-main">
                                        <span className="item-title">{sub.name}</span>
                                        <span className="item-subtitle">
                                            <FaCalendarAlt size={10} /> Renews: {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="item-meta">
                                        <span className="item-cost">₹{(sub.price || 0).toLocaleString()}</span>
                                        <span className={`status-badge ${status.class}`}>
                                            <StatusIcon size={8} style={{ marginRight: '4px' }} />
                                            {status.label}
                                        </span>
                                    </div>
                                    <button className="delete-btn" onClick={() => handleDelete(sub.id)}>
                                        <FaTrash size={12} />
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </GlassCard>
    );
};

export default SubscriptionOverview;
