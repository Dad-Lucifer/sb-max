import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
    FaBolt,
    FaSearch,
    FaTimes,
    FaUser,
    FaPhoneAlt,
    FaExclamationTriangle,
    FaHistory
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './PlayerThunderSearch.css';

interface PlayerResult {
    name: string;
    phone: string;
    thunderCoins: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
}
interface SearchCustomer {
    name: string;
    phone: string;
}


const PlayerThunderSearchModal = ({ open, onClose }: Props) => {
    const isSelecting = React.useRef(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [result, setResult] = useState<PlayerResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);
    const [activity, setActivity] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<SearchCustomer[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [manualSelect, setManualSelect] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {

        if (!manualSelect) return;
        if (!name || !phone) return;

        handleSearch();
        setManualSelect(false);

    }, [phone]);

    const handleSearch = async () => {



        if (!name.trim() || !phone.trim()) {
            setError('Please enter both name and phone number');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        setActivity([]); // clear old history

        try {
            /* STEP 1 — verify player */
            const playerRes = await axios.get(
                "http://localhost:5000/api/battles/thunder-player",
                { params: { name, phone } }
            );

            setResult(playerRes.data);

            /* STEP 2 — fetch activity ONLY if player valid */
            const activityRes = await axios.get(
                "http://localhost:5000/api/battles/player-activity",
                { params: { phone } }
            );

            setActivity(activityRes.data);


        } catch (err: any) {
            setError('Player not found or invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        if (!name || name.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        if (isSelecting.current) {
            isSelecting.current = false;
            return;
        }

        let cancel = false;

        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);

                const res = await axios.get(
                    "http://localhost:5000/api/customers/search",
                    { params: { name: name.trim() } }
                );

                if (!cancel) {
                    setSearchResults(res.data);
                    setShowDropdown(res.data.length > 0);
                }

            } catch {
                if (!cancel) setSearchResults([]);
            } finally {
                if (!cancel) setIsSearching(false);
            }
        }, 400);

        return () => {
            cancel = true;
            clearTimeout(timer);
        };

    }, [name]);

    const selectCustomer = (customer: SearchCustomer) => {
        isSelecting.current = true;
        setManualSelect(true);
        setName(customer.name);
        setPhone(customer.phone);
        setShowDropdown(false);
    };


    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="modal-card"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="modal-title">
                                <FaBolt className="modal-title-icon" />
                                <span>Player Search</span>
                            </div>
                            <button className="close-btn" onClick={onClose}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Search Inputs */}
                            <div className="search-section">
                                <div className="input-container" style={{ position: "relative" }}>
                                    <input
                                        className="modal-inputs"
                                        placeholder="Player Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onFocus={() => searchResults.length && setShowDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                                        autoFocus
                                    />
                                    <FaUser className="input-icon" size={14} />

                                    {showDropdown && (
                                        <div className="player-dropdown">
                                            {isSearching && <div className="dropdown-item">Searching...</div>}

                                            {searchResults.map((c) => (
                                                <div
                                                    key={c.phone}
                                                    className="dropdown-item"
                                                    onMouseDown={() => selectCustomer(c)}
                                                >
                                                    <div>{c.name}</div>
                                                    <div className="dropdown-phone">{c.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>


                                <div className="input-container">
                                    <input
                                        className="modal-inputs"
                                        placeholder="Phone Number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        type="tel"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <FaPhoneAlt className="input-icon" size={14} />
                                </div>

                                <motion.button
                                    className="search-btn"
                                    onClick={handleSearch}
                                    disabled={loading || !name || !phone}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        >
                                            <FaBolt />
                                        </motion.div>
                                    ) : (
                                        <>
                                            <FaSearch /> Search Player
                                        </>
                                    )}
                                </motion.button>
                            </div>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        className="error-message"
                                        initial={{ opacity: 0, y: -10, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -10, height: 0 }}
                                    >
                                        <FaExclamationTriangle />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Results */}
                            <AnimatePresence mode="wait">
                                {result && (
                                    <motion.div
                                        className="result-section"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <div className="player-card">
                                            {/* ID Card Header */}
                                            <div className="player-header">
                                                <div className="avatar-container">
                                                    <div className="avatar-circle">
                                                        <FaUser size={24} />
                                                    </div>
                                                </div>
                                                <div className="player-details">
                                                    <h2 className="player-name-text">{result.name}</h2>
                                                    <div className="player-phone-badge">
                                                        <FaPhoneAlt size={10} /> {result.phone}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Large Balance Display */}
                                            <div className="balance-display">
                                                <span className="balance-label">Current Balance</span>
                                                <div className="balance-amount">
                                                    <FaBolt size={32} />
                                                    <span>{result.thunderCoins}</span>
                                                </div>
                                            </div>

                                            {/* Activity Timeline */}
                                            {activity.length > 0 && (
                                                <div className="activity-section">
                                                    <div className="activity-header-text">
                                                        <FaHistory style={{ marginRight: 8 }} />
                                                        Recent Activity
                                                    </div>
                                                    <div className="activity-timeline">
                                                        {activity.map((a, idx) => (
                                                            <motion.div
                                                                key={`${a.type}-${a.timestamp}-${idx}`}
                                                                className={`timeline-item ${a.type}`}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: 0.2 + (idx * 0.05) }}
                                                            >
                                                                <div className="timeline-dot" />
                                                                <div className="timeline-content">
                                                                    <div className="timeline-title">{a.title}</div>
                                                                    <div className="timeline-date">
                                                                        {new Date(a.date).toLocaleString([], {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default PlayerThunderSearchModal;
