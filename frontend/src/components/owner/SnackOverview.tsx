
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaPlus, FaBoxOpen, FaChartLine, FaCoins, FaExclamationTriangle, FaSearch, FaTrash
} from 'react-icons/fa';
import { SNACK_CATALOG } from '../dashboard/SnackSelector';
import './SnackOverview.css';

interface Snack {
    id?: string;
    name: string;
    buyingPrice: number;
    sellingPrice: number;
    quantity: number;
    soldQuantity?: number;
}

const SnackOverview: React.FC = () => {
    // State
    const [snacks, setSnacks] = useState<Snack[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [form, setForm] = useState({
        name: '',
        buyingPrice: '',
        sellingPrice: '',
        quantity: ''
    });

    const [isFormOpen, setIsFormOpen] = useState(false);

    // Fetch Data
    const fetchSnacks = async () => {
        try {
            const res = await axios.get('/api/snacks');
            setSnacks(res.data);
        } catch (err) {
            console.error('Failed to fetch snacks', err);
        } finally {
            // done
        }
    };

    useEffect(() => {
        fetchSnacks();
        const interval = setInterval(fetchSnacks, 30000); // Live update
        return () => clearInterval(interval);
    }, []);

    // Derived Stats
    const totalQuantity = snacks.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalInvestment = snacks.reduce((sum, s) => sum + ((s.buyingPrice || 0) * (s.quantity || 0)), 0);
    const totalProfit = snacks.reduce((sum, s) => sum + ((s.sellingPrice - s.buyingPrice) * (s.soldQuantity || 0)), 0);

    // Handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!form.name || !form.buyingPrice || !form.sellingPrice || !form.quantity) {
                alert('All fields are required');
                return;
            }
            if (Number(form.sellingPrice) < Number(form.buyingPrice)) {
                alert('Selling Price must be >= Buying Price');
                return;
            }

            await axios.post('/api/snacks', {
                name: form.name,
                buyingPrice: Number(form.buyingPrice),
                sellingPrice: Number(form.sellingPrice),
                quantity: Number(form.quantity)
            });

            alert('Snack Inventory Updated 🚀');
            setForm({ name: '', buyingPrice: '', sellingPrice: '', quantity: '' });
            setIsFormOpen(false);
            fetchSnacks();
        } catch (err) {
            console.error(err);
            alert('Failed to update inventory');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this snack?')) return;
        try {
            await axios.delete(`/api/snacks/${id}`);
            setSnacks(prev => prev.filter(s => s.id !== id));
            // alert('Snack Deleted'); // Optional, maybe too noisy
        } catch (err) {
            console.error(err);
            alert('Failed to delete snack');
        }
    };

    // UI Components
    const StatCard = ({ label, value, icon: Icon, color }: any) => (
        <div className="snack-stat-card" style={{ borderColor: color }}>
            <div className="stat-icon" style={{ backgroundColor: `${color} 20`, color: color }}>
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
                <h2 className="section-title"><FaBoxOpen /> Snack Inventory & Analytics</h2>
                <button
                    className="add-snack-btn"
                    onClick={() => setIsFormOpen(!isFormOpen)}
                >
                    <FaPlus /> {isFormOpen ? 'Cancel' : 'Add Stock'}
                </button>
            </div>

            {/* Overview Stats */}
            <div className="snack-stats-grid">
                <StatCard
                    label="Total Quantity"
                    value={totalQuantity}
                    icon={FaBoxOpen}
                    color="#3b82f6"
                />
                <StatCard
                    label="Total Investment"
                    value={`₹${totalInvestment.toLocaleString()} `}
                    icon={FaCoins}
                    color="#f59e0b"
                />
                <StatCard
                    label="Total Profit"
                    value={`₹${totalProfit.toLocaleString()} `}
                    icon={FaChartLine}
                    color="#10b981"
                />
            </div>

            {/* Add Form */}
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
                            <div className="form-group">
                                <label>Snack Name</label>
                                <select
                                    className="dark-input"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                >
                                    <option value="">Select Snack</option>
                                    {SNACK_CATALOG.map((s: any) => (
                                        <option key={s.id} value={s.name}>{s.name} {s.emoji}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Buying Price</label>
                                <input
                                    type="number"
                                    className="dark-input"
                                    placeholder="₹"
                                    value={form.buyingPrice}
                                    onChange={e => setForm({ ...form, buyingPrice: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Selling Price</label>
                                <input
                                    type="number"
                                    className="dark-input"
                                    placeholder="₹"
                                    value={form.sellingPrice}
                                    onChange={e => setForm({ ...form, sellingPrice: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Quantity to Add</label>
                                <input
                                    type="number"
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

            {/* Inventory List */}
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
                                    <tr key={idx} className={isLowStock ? 'low-stock-row' : ''}>
                                        <td className="font-medium">{snack.name}</td>
                                        <td>
                                            <span className={`badge ${isLowStock ? 'badge-red' : 'badge-green'} `}>
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
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(snack.id || '')}
                                                title="Delete Snack"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredSnacks.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center p-4 text-gray-400">
                                        No snacks found. Add some stock!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SnackOverview;
