import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUsers, FaUserPlus, FaUserShield, FaTrash } from 'react-icons/fa';
import { auth } from '../../config/firebase';
import './UserManagement.css';

interface User {
    uid: string;
    email: string;
    username: string;
    role: string;
    name: string;
    createdAt?: string;
}

interface UserManagementProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'add'>('overview');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'employee'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to fetch users');
            }
            const data = await res.json();
            setUsers(data);
        } catch (error: any) {
            console.error('Fetch Users Error:', error);
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setActiveTab('overview');
        }
    }, [isOpen]);

    const handleRoleChange = async (uid: string, newRole: string) => {
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`/api/users/${uid}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to update role');
            }

            showToast(`Role updated to ${newRole}`);
            fetchUsers(); // refresh
        } catch (error: any) {
            console.error('Update Role Error:', error);
            showToast(error.message, 'error');
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to create user');
            }

            showToast('User created successfully!');
            setFormData({ username: '', password: '', role: 'employee' });
            setActiveTab('overview');
            fetchUsers();
        } catch (error: any) {
            console.error('Create User Error:', error);
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`/api/users/${uid}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to delete user');
            }

            showToast('User deleted successfully!');
            fetchUsers();
        } catch (error: any) {
            console.error('Delete User Error:', error);
            showToast(error.message, 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="um-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="um-modal-content"
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {/* Header */}
                    <div className="um-header">
                        <div className="um-title-group">
                            <FaUserShield size={24} color="#8b5cf6" />
                            <h2 className="um-title">User Management</h2>
                        </div>
                        <button className="um-close-btn" onClick={onClose}>
                            <FaTimes size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="um-body">
                        {/* Sidebar Tabs */}
                        <div className="um-sidebar">
                            <button
                                className={`um-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <FaUsers /> Overview
                            </button>
                            <button
                                className={`um-tab ${activeTab === 'add' ? 'active' : ''}`}
                                onClick={() => setActiveTab('add')}
                            >
                                <FaUserPlus /> Add User
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="um-content">
                            {activeTab === 'overview' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="um-overview-grid">
                                        <div className="um-stat-card">
                                            <div className="um-stat-icon">
                                                <FaUsers />
                                            </div>
                                            <div className="um-stat-info">
                                                <span className="um-stat-value">{users.length}</span>
                                                <span className="um-stat-label">Total Users</span>
                                            </div>
                                        </div>
                                        <div className="um-stat-card">
                                            <div className="um-stat-icon" style={{ color: '#34d399', background: 'rgba(16,185,129,0.1)' }}>
                                                <FaUserShield />
                                            </div>
                                            <div className="um-stat-info">
                                                <span className="um-stat-value">{users.filter(u => u.role === 'owner').length}</span>
                                                <span className="um-stat-label">Admins / Owners</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="um-table-container">
                                        <table className="um-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Username</th>
                                                    <th>Role</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading && users.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} style={{ textAlign: 'center' }}>
                                                            Loading...
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    users.map(user => (
                                                        <tr key={user.uid}>
                                                            <td>{user.name}</td>
                                                            <td>@{user.username}</td>
                                                            <td>
                                                                <span className={`um-role-badge ${user.role}`}>
                                                                    {user.role}
                                                                </span>
                                                            </td>
                                                            <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                <select
                                                                    className="um-action-select"
                                                                    value={user.role}
                                                                    onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                                                >
                                                                    <option value="owner">Make Admin</option>
                                                                    <option value="employee">Make Employee</option>
                                                                    <option value="revoked">Revoke Perms</option>
                                                                </select>
                                                                {user.role !== 'owner' && (
                                                                    <button 
                                                                        className="um-close-btn" 
                                                                        style={{ padding: '0.4rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px' }}
                                                                        onClick={() => handleDeleteUser(user.uid)}
                                                                        title="Delete User"
                                                                    >
                                                                        <FaTrash size={14} color="#f87171" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'add' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <form className="um-form" onSubmit={handleAddUser}>
                                        <div className="um-form-group">
                                            <label>User ID</label>
                                            <input
                                                type="text"
                                                className="um-input"
                                                required
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                placeholder="e.g. johndoe"
                                            />
                                        </div>
                                        <div className="um-form-group">
                                            <label>Temporary Password</label>
                                            <input
                                                type="password"
                                                className="um-input"
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="Min 6 characters"
                                            />
                                        </div>
                                        <div className="um-form-group">
                                            <label>Role</label>
                                            <select
                                                className="um-input"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="owner">Admin (Owner)</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            className="um-submit-btn"
                                            disabled={loading}
                                        >
                                            {loading ? <div className="loading-spinner"></div> : <FaUserPlus />}
                                            Create User
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Toast Notification */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            className={`um-toast ${toast.type}`}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        >
                            {toast.type === 'success' ? <FaUserShield /> : <FaTimes />}
                            {toast.message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};

export default UserManagement;
