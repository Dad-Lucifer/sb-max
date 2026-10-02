
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaPlus, FaBoxOpen, FaChartLine, FaCoins, FaExclamationTriangle,
    FaSearch, FaTrash, FaPencilAlt, FaTimes, FaCheck
} from 'react-icons/fa';
import './SnackOverview.css';

interface Snack {
    id?: string;
    name: string;
    buyingPrice: number;
    sellingPrice: number;
    quantity: number;
    soldQuantity?: number;
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
interface EditModalProps {
    snack: Snack;
    onClose: () => void;
    onSaved: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ snack, onClose, onSaved }) => {
    const [form, setForm] = useState({
        name: snack.name,
        buyingPrice: String(snack.buyingPrice),
        sellingPrice: String(snack.sellingPrice),
        quantity: String(snack.quantity)
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.name.trim()) { setError('Name is required'); return; }
        if (Number(form.sellingPrice) < Number(form.buyingPrice)) {
            setError('Selling price must be ≥ buying price');
            return;
        }
        setSaving(true);
        try {
            await api.put(`/api/snacks/${snack.id}`, {
                name: form.name.trim(),
                buyingPrice: Number(form.buyingPrice),
                sellingPrice: Number(form.sellingPrice),
                quantity: Number(form.quantity)
            });
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="so-modal-backdrop" onClick={onClose}>
            <motion.div
                className="so-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="so-modal-header">
                    <span><FaPencilAlt style={{ marginRight: '0.5rem' }} />Edit Snack</span>
                    <button className="so-modal-close" onClick={onClose}><FaTimes /></button>
                </div>
                <form className="so-modal-body" onSubmit={handleSave}>
                    <div className="form-group">
                        <label>Snack Name</label>
                        <input
                            className="dark-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="so-modal-grid">
                        <div className="form-group">
                            <label>Buying Price (₹)</label>
                            <input
                                type="number" min="0" step="0.01"
                                className="dark-input"
                                value={form.buyingPrice}
                                onChange={e => setForm({ ...form, buyingPrice: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Selling Price (₹)</label>
                            <input
                                type="number" min="0" step="0.01"
                                className="dark-input"
                                value={form.sellingPrice}
                                onChange={e => setForm({ ...form, sellingPrice: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number" min="0"
                                className="dark-input"
                                value={form.quantity}
                                onChange={e => setForm({ ...form, quantity: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    {error && <p className="so-modal-error">{error}</p>}
                    <button type="submit" className="so-modal-save-btn" disabled={saving}>
                        {saving ? 'Saving…' : <><FaCheck style={{ marginRight: '0.4rem' }} />Save Changes</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const SnackOverview: React.FC = () => {
    const [snacks, setSnacks] = useState<Snack[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSnack, setEditingSnack] = useState<Snack | null>(null);

    // Add-stock form
    const [form, setForm] = useState({
        name: '',
        customName: '',
        buyingPrice: '',
        sellingPrice: '',
        quantity: ''
    });
    const [isFormOpen, setIsFormOpen] = useState(false);

    const isCustom = form.name === '__custom__';

    // ── Fetch ──
    const fetchSnacks = async () => {
        try {
            const res = await api.get('/api/snacks');
            setSnacks(res.data);
        } catch (err) {
            console.error('Failed to fetch snacks', err);
        }
    };

    useEffect(() => {
        fetchSnacks();
        const interval = setInterval(fetchSnacks, 30000);
        return () => clearInterval(interval);
    }, []);

    // ── Stats ──
    const totalQuantity   = snacks.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalInvestment = snacks.reduce((sum, s) => sum + ((s.buyingPrice || 0) * (s.quantity || 0)), 0);
    const totalProfit     = snacks.reduce((sum, s) => sum + ((s.sellingPrice - s.buyingPrice) * (s.soldQuantity || 0)), 0);

    // ── Add/restock handler ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const resolvedName = isCustom ? form.customName.trim() : form.name;
        if (!resolvedName || !form.buyingPrice || !form.sellingPrice || !form.quantity) {
            alert('All fields are required');
            return;
        }
        if (Number(form.sellingPrice) < Number(form.buyingPrice)) {
            alert('Selling Price must be ≥ Buying Price');
            return;
        }
        try {
            await api.post('/api/snacks', {
                name: resolvedName,
                buyingPrice: Number(form.buyingPrice),
                sellingPrice: Number(form.sellingPrice),
                quantity: Number(form.quantity)
            });
            alert('Snack Inventory Updated 🚀');
            setForm({ name: '', customName: '', buyingPrice: '', sellingPrice: '', quantity: '' });
            setIsFormOpen(false);
            fetchSnacks();
        } catch (err) {
            console.error(err);
            alert('Failed to update inventory');
        }
    };

    // ── Delete ──
    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this snack?')) return;
        try {
            await api.delete(`/api/snacks/${id}`);
            setSnacks(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete snack');
        }
    };

    // ── Stat card ──
    const StatCard = ({ label, value, icon: Icon, color }: any) => (
        <div className="snack-stat-card" style={{ borderColor: color }}>
            <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
                <Icon size={20} />
            </div>
            <div className="stat-info">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{value}</span>
            </div>
        </div>
    );

    const filteredSnacks = snacks.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="snack-overview-container glass-panel">
            <div className="snack-header">
                <h2 className="section-title"><FaBoxOpen /> Snack Inventory &amp; Analytics</h2>
                <button
                    className="add-snack-btn"
                    onClick={() => setIsFormOpen(!isFormOpen)}
                >
                    <FaPlus /> {isFormOpen ? 'Cancel' : 'Add Stock'}
                </button>
            </div>

            {/* Overview Stats */}
            <div className="snack-stats-grid">
                <StatCard label="Total Quantity"  value={totalQuantity}                              icon={FaBoxOpen}   color="#3b82f6" />
                <StatCard label="Total Investment" value={`₹${totalInvestment.toLocaleString()}`}    icon={FaCoins}     color="#f59e0b" />
                <StatCard label="Total Profit"     value={`₹${totalProfit.toLocaleString()}`}        icon={FaChartLine} color="#10b981" />
            </div>

            {/* Add-stock Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="snack-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="form-grid">
                            {/* Snack name — dropdown + optional custom text field */}
                            <div className="form-group">
                                <label>Snack Name</label>
                                <select
                                    className="dark-input"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value, customName: '' })}
                                >
                                    <option value="">Select Snack</option>
                                    {snacks.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                    <option value="__custom__">➕ Add Custom Snack…</option>
                                </select>
                                {isCustom && (
                                    <input
                                        className="dark-input"
                                        style={{ marginTop: '0.5rem' }}
                                        placeholder="Enter custom snack name"
                                        value={form.customName}
                                        onChange={e => setForm({ ...form, customName: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                )}
                            </div>

                            <div className="form-group">
                                <label>Buying Price (₹)</label>
                                <input
                                    type="number" min="0" step="0.01"
                                    className="dark-input"
                                    placeholder="₹"
                                    value={form.buyingPrice}
                                    onChange={e => setForm({ ...form, buyingPrice: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Selling Price (₹)</label>
                                <input
                                    type="number" min="0" step="0.01"
                                    className="dark-input"
                                    placeholder="₹"
                                    value={form.sellingPrice}
                                    onChange={e => setForm({ ...form, sellingPrice: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Quantity to Add</label>
                                <input
                                    type="number" min="1"
                                    className="dark-input"
                                    placeholder="0"
                                    value={form.quantity}
                                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="submit-btn">Update Inventory</button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Inventory Table */}
            <div className="inventory-section">
                <div className="inventory-header">
                    <h3>Current Stock</h3>
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            placeholder="Search snacks..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="inventory-table-wrapper custom-scrollbar">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Stock</th>
                                <th>Buy ₹</th>
                                <th>Sell ₹</th>
                                <th>Profit/Unit</th>
                                <th>Total Profit</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSnacks.map((snack, idx) => {
                                const isLowStock = (snack.quantity || 0) < 5;
                                return (
                                    <tr key={snack.id ?? idx} className={isLowStock ? 'low-stock-row' : ''}>
                                        <td className="font-medium">{snack.name}</td>
                                        <td>
                                            <span className={`badge ${isLowStock ? 'badge-red' : 'badge-green'}`}>
                                                {snack.quantity}
                                            </span>
                                        </td>
                                        <td>₹{snack.buyingPrice}</td>
                                        <td>₹{snack.sellingPrice}</td>
                                        <td className="text-green">₹{snack.sellingPrice - snack.buyingPrice}</td>
                                        <td className="text-green font-bold">
                                            ₹{((snack.sellingPrice - snack.buyingPrice) * (snack.soldQuantity || 0)).toLocaleString()}
                                        </td>
                                        <td>
                                            {isLowStock && (
                                                <span className="stock-alert">
                                                    <FaExclamationTriangle /> Refill
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="so-action-btns">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => setEditingSnack(snack)}
                                                    title="Edit Snack"
                                                >
                                                    <FaPencilAlt />
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(snack.id || '')}
                                                    title="Delete Snack"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredSnacks.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center p-4 text-gray-400">
                                        No snacks found. Add some stock!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingSnack && (
                    <EditModal
                        snack={editingSnack}
                        onClose={() => setEditingSnack(null)}
                        onSaved={fetchSnacks}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default SnackOverview;
