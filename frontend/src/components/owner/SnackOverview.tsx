import { socket } from '../../utils/socket';
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaPlus, FaBoxOpen, FaChartLine, FaCoins, FaExclamationTriangle,
    FaSearch, FaTrash, FaPencilAlt, FaTimes, FaCheck
} from 'react-icons/fa';
import './SnackOverview.css';

export interface Snack {
    id?: string;
    name: string;
    buyingPrice: number;
    sellingPrice: number;
    quantity: number;
    soldQuantity?: number;
}

interface CatalogItem {
    name: string;
    emoji: string;
    defaultBuyingPrice: number;
    defaultSellingPrice: number;
}

const PRE_CREATED_CATALOG: CatalogItem[] = [
    { name: 'Chips', emoji: '🥔', defaultBuyingPrice: 10, defaultSellingPrice: 15 },
    { name: 'Cadbury', emoji: '🍫', defaultBuyingPrice: 10, defaultSellingPrice: 15 },
    { name: 'Doritos', emoji: '🌮', defaultBuyingPrice: 15, defaultSellingPrice: 20 },
    { name: 'Maggie', emoji: '🍜', defaultBuyingPrice: 15, defaultSellingPrice: 25 },
    { name: 'Redbull', emoji: '⚡', defaultBuyingPrice: 100, defaultSellingPrice: 130 },
    { name: 'Sting', emoji: '🥤', defaultBuyingPrice: 15, defaultSellingPrice: 20 },
    { name: 'Rio', emoji: '🍇', defaultBuyingPrice: 35, defaultSellingPrice: 50 },
    { name: 'Diet Coke', emoji: '🥤', defaultBuyingPrice: 30, defaultSellingPrice: 45 },
    { name: 'Pepsi/Sprite', emoji: '🥤', defaultBuyingPrice: 18, defaultSellingPrice: 25 },
    { name: 'Water', emoji: '💧', defaultBuyingPrice: 8, defaultSellingPrice: 15 }
];

// ─── Edit Modal ────────────────────────────────────────────────────────────────
interface EditModalProps {
    snack: Snack;
    onClose: () => void;
    onSaved: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ snack, onClose, onSaved }) => {
    const [form, setForm] = useState({
        name: snack.name,
        buyingPrice: String(snack.buyingPrice ?? ''),
        sellingPrice: String(snack.sellingPrice ?? ''),
        quantity: String(snack.quantity ?? '')
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const buyNum = Number(form.buyingPrice);
    const sellNum = Number(form.sellingPrice);
    const profitPerUnit = !isNaN(buyNum) && !isNaN(sellNum) ? sellNum - buyNum : null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const trimmedName = form.name.trim();
        if (!trimmedName) {
            setError('Snack name is required');
            return;
        }

        const buy = Number(form.buyingPrice);
        const sell = Number(form.sellingPrice);
        const qty = Number(form.quantity);

        if (isNaN(buy) || buy < 0) {
            setError('Buying price must be a valid non-negative number');
            return;
        }
        if (isNaN(sell) || sell < 0) {
            setError('Selling price must be a valid non-negative number');
            return;
        }
        if (sell < buy) {
            setError('Selling price must be ≥ buying price');
            return;
        }
        if (isNaN(qty) || qty < 0) {
            setError('Quantity cannot be negative');
            return;
        }

        setSaving(true);
        try {
            await api.put(`/api/snacks/${snack.id}`, {
                name: trimmedName,
                buyingPrice: buy,
                sellingPrice: sell,
                quantity: qty
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
                            placeholder="Enter snack name"
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
                            <label>Current Stock</label>
                            <input
                                type="number" min="0"
                                className="dark-input"
                                value={form.quantity}
                                onChange={e => setForm({ ...form, quantity: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    {profitPerUnit !== null && (
                        <p className={profitPerUnit >= 0 ? "so-modal-profit" : "so-modal-error"}>
                            {profitPerUnit >= 0
                                ? `Estimated Profit: ₹${profitPerUnit.toFixed(2)} / unit`
                                : `Loss: ₹${Math.abs(profitPerUnit).toFixed(2)} / unit`}
                        </p>
                    )}
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

    // Add-stock form state
    const [form, setForm] = useState({
        name: '',
        customName: '',
        buyingPrice: '',
        sellingPrice: '',
        quantity: '1'
    });
    const [isFormOpen, setIsFormOpen] = useState(false);

    const isCustom = form.name === '__custom__';

    // ── Fetch Inventory ──
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
        const onSnacks = () => fetchSnacks();
        socket.on('snacks:updated', onSnacks);
        socket.on('connect', onSnacks);
        return () => {
            socket.off('snacks:updated', onSnacks);
            socket.off('connect', onSnacks);
        };
    }, []);

    // ── Dropdown Selection Handler with Auto-fill ──
    const handleSnackSelect = (selectedName: string) => {
        if (selectedName === '__custom__') {
            setForm(prev => ({
                ...prev,
                name: '__custom__',
                customName: '',
                buyingPrice: '',
                sellingPrice: '',
                quantity: prev.quantity || '1'
            }));
            return;
        }

        if (!selectedName) {
            setForm({
                name: '',
                customName: '',
                buyingPrice: '',
                sellingPrice: '',
                quantity: '1'
            });
            return;
        }

        // 1. Check if the snack is already in the database
        const existing = snacks.find(s => s.name.toLowerCase() === selectedName.toLowerCase());
        if (existing) {
            setForm(prev => ({
                ...prev,
                name: existing.name,
                customName: '',
                buyingPrice: String(existing.buyingPrice ?? ''),
                sellingPrice: String(existing.sellingPrice ?? ''),
                quantity: prev.quantity || '1'
            }));
            return;
        }

        // 2. Check if it is a pre-created catalog item
        const catalogItem = PRE_CREATED_CATALOG.find(c => c.name.toLowerCase() === selectedName.toLowerCase());
        if (catalogItem) {
            setForm(prev => ({
                ...prev,
                name: catalogItem.name,
                customName: '',
                buyingPrice: String(catalogItem.defaultBuyingPrice),
                sellingPrice: String(catalogItem.defaultSellingPrice),
                quantity: prev.quantity || '1'
            }));
            return;
        }

        // Fallback
        setForm(prev => ({
            ...prev,
            name: selectedName,
            customName: '',
            buyingPrice: '',
            sellingPrice: '',
            quantity: prev.quantity || '1'
        }));
    };

    // ── Derived Stats ──
    const totalQuantity   = snacks.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalInvestment = snacks.reduce((sum, s) => sum + ((s.buyingPrice || 0) * (s.quantity || 0)), 0);
    const totalProfit     = snacks.reduce((sum, s) => sum + ((s.sellingPrice - s.buyingPrice) * (s.soldQuantity || 0)), 0);

    // ── Add/Restock Submit Handler ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const resolvedName = isCustom ? form.customName.trim() : form.name.trim();

        if (!resolvedName) {
            alert('Please select or enter a snack name');
            return;
        }

        if (form.buyingPrice === '' || form.sellingPrice === '' || form.quantity === '') {
            alert('All fields are required');
            return;
        }

        const buy = Number(form.buyingPrice);
        const sell = Number(form.sellingPrice);
        const qty = Number(form.quantity);

        if (isNaN(buy) || buy < 0) {
            alert('Buying price must be a valid non-negative number');
            return;
        }
        if (isNaN(sell) || sell < 0) {
            alert('Selling price must be a valid non-negative number');
            return;
        }
        if (sell < buy) {
            alert('Selling Price must be ≥ Buying Price');
            return;
        }
        if (isNaN(qty) || qty < 1) {
            alert('Quantity to add must be at least 1');
            return;
        }

        try {
            await api.post('/api/snacks', {
                name: resolvedName,
                buyingPrice: buy,
                sellingPrice: sell,
                quantity: qty
            });

            alert(`Snack "${resolvedName}" added/restocked successfully! 🚀`);
            setForm({ name: '', customName: '', buyingPrice: '', sellingPrice: '', quantity: '1' });
            setIsFormOpen(false);
            fetchSnacks();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to update inventory');
        }
    };

    // ── Delete Handler ──
    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;
        try {
            await api.delete(`/api/snacks/${id}`);
            setSnacks(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete snack');
        }
    };

    // ── UI Components ──
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

    // List catalog snacks that are not yet in the DB inventory
    const unseededCatalogSnacks = PRE_CREATED_CATALOG.filter(
        cat => !snacks.some(s => s.name.toLowerCase() === cat.name.toLowerCase())
    );

    // Calculate current form profit preview
    const formBuy = Number(form.buyingPrice);
    const formSell = Number(form.sellingPrice);
    const formProfit = !isNaN(formBuy) && !isNaN(formSell) && form.buyingPrice !== '' && form.sellingPrice !== ''
        ? formSell - formBuy
        : null;

    return (
        <div className="snack-overview-container glass-panel">
            <div className="snack-header">
                <h2 className="section-title"><FaBoxOpen /> Snack Inventory &amp; Analytics</h2>
                <button
                    className="add-snack-btn"
                    onClick={() => {
                        setIsFormOpen(!isFormOpen);
                        if (!isFormOpen) {
                            setForm({ name: '', customName: '', buyingPrice: '', sellingPrice: '', quantity: '1' });
                        }
                    }}
                >
                    <FaPlus /> {isFormOpen ? 'Cancel' : 'Add Stock / Snack'}
                </button>
            </div>

            {/* Overview Stats */}
            <div className="snack-stats-grid">
                <StatCard label="Total Quantity"  value={totalQuantity}                              icon={FaBoxOpen}   color="#3b82f6" />
                <StatCard label="Total Investment" value={`₹${totalInvestment.toLocaleString()}`}    icon={FaCoins}     color="#f59e0b" />
                <StatCard label="Total Profit"     value={`₹${totalProfit.toLocaleString()}`}        icon={FaChartLine} color="#10b981" />
            </div>

            {/* Add / Restock Form */}
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
                            {/* Snack name selection dropdown */}
                            <div className="form-group">
                                <label>Snack Item</label>
                                <select
                                    className="dark-input"
                                    value={form.name}
                                    onChange={e => handleSnackSelect(e.target.value)}
                                >
                                    <option value="">-- Select Snack or Add Custom --</option>
                                    <option value="__custom__">➕ Add Custom Snack Item...</option>

                                    {/* Existing Inventory Snacks in Database */}
                                    {snacks.length > 0 && (
                                        <optgroup label="📦 Current Inventory Snacks (Database)">
                                            {snacks.map(s => (
                                                <option key={s.id || s.name} value={s.name}>
                                                    {s.name} (Stock: {s.quantity}, Sell: ₹{s.sellingPrice})
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}

                                    {/* Pre-Created Catalog Snacks not yet in DB */}
                                    {unseededCatalogSnacks.length > 0 && (
                                        <optgroup label="✨ Pre-Created Catalog Snacks">
                                            {unseededCatalogSnacks.map(cat => (
                                                <option key={cat.name} value={cat.name}>
                                                    {cat.emoji} {cat.name} (Suggested Sell: ₹{cat.defaultSellingPrice})
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            {/* Custom Snack Name Input (only shown when Add Custom Snack is selected) */}
                            {isCustom && (
                                <div className="form-group custom-snack-entry">
                                    <label>Custom Snack Name</label>
                                    <input
                                        className="dark-input"
                                        placeholder="Enter custom snack name (e.g. Monster Mango, Doritos Salsa)"
                                        value={form.customName}
                                        onChange={e => setForm({ ...form, customName: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Buying Price (₹)</label>
                                <input
                                    type="number" min="0" step="0.01"
                                    className="dark-input"
                                    placeholder="₹ Buying Price"
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
                                    placeholder="₹ Selling Price"
                                    value={form.sellingPrice}
                                    onChange={e => setForm({ ...form, sellingPrice: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Quantity to Add</label>
                                <input
                                    type="number" min="1"
                                    className="dark-input"
                                    placeholder="Quantity"
                                    value={form.quantity}
                                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Live Profit Preview */}
                        {formProfit !== null && (
                            <div style={{ marginBottom: '0.75rem' }}>
                                <span className={formProfit >= 0 ? "profit-preview" : "so-modal-error"}>
                                    {formProfit >= 0
                                        ? `📈 Profit per unit: ₹${formProfit.toFixed(2)}`
                                        : `⚠️ Selling below cost: Loss of ₹${Math.abs(formProfit).toFixed(2)} / unit`}
                                </span>
                            </div>
                        )}

                        <button type="submit" className="submit-btn">
                            {isCustom ? 'Add Custom Snack to Database 🚀' : 'Update Snack Inventory 🚀'}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Inventory Table */}
            <div className="inventory-section">
                <div className="inventory-header">
                    <h3>Current Stock ({filteredSnacks.length})</h3>
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
                                const unitProfit = snack.sellingPrice - snack.buyingPrice;
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
                                        <td className={unitProfit >= 0 ? "text-green" : "so-modal-error"}>
                                            ₹{unitProfit.toFixed(2)}
                                        </td>
                                        <td className="text-green font-bold">
                                            ₹{((unitProfit) * (snack.soldQuantity || 0)).toLocaleString()}
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
                                                    title={`Edit ${snack.name}`}
                                                >
                                                    <FaPencilAlt />
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(snack.id || '', snack.name)}
                                                    title={`Delete ${snack.name}`}
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
                                        No snacks found. Add some stock or create a custom snack!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal for manually editing any snack */}
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
