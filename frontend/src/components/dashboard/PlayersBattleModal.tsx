import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaCrown, FaTimes, FaGamepad, FaUsers
} from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { validateName, validatePhone, formatName, formatPhone } from '../../utils/validation';
import './PlayersBattle.css';

interface PlayerInfo {
    name: string;
    phone: string;
    teamName?: string; // Optional, for team matches
    errors: {
        name?: string;
        phone?: string;
    }
}

interface BattleConfig {
    matchType: 'Solo' | 'Team';
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const PlayersBattleModal = ({ isOpen, onClose }: Props) => {
    const isSelectingP1 = React.useRef(false);
    const isSelectingP2 = React.useRef(false);

    // --- State: Match Config ---
    const [crownHolder, setCrownHolder] = useState<PlayerInfo>({ name: '', phone: '', errors: {} });
    const [challenger, setChallenger] = useState<PlayerInfo>({ name: '', phone: '', errors: {} });
    const [searchResultsP1, setSearchResultsP1] = useState<{ name: string, phone: string }[]>([]);
    const [searchResultsP2, setSearchResultsP2] = useState<{ name: string, phone: string }[]>([]);

    const [showDropdownP1, setShowDropdownP1] = useState(false);
    const [showDropdownP2, setShowDropdownP2] = useState(false);

    const [isSearchingP1, setIsSearchingP1] = useState(false);
    const [isSearchingP2, setIsSearchingP2] = useState(false);

    // Config State
    const [config, setConfig] = useState<BattleConfig>({
        matchType: 'Solo'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Handlers ---

    // Generic Input Handler with Validation
    const handlePlayerChange = (
        playerBox: 'crown' | 'challenger',
        field: keyof PlayerInfo,
        value: string
    ) => {
        const setPlayer = playerBox === 'crown' ? setCrownHolder : setChallenger;

        setPlayer(prev => {
            let newVal = value;
            const newErrors = { ...prev.errors };

            // 1. Sanitization & formatting 
            if (field === 'phone') {
                newVal = formatPhone(value);
            } else if (field === 'name') {
                // Allow typing, format strict on blur usually, but we can do some realtime blocks
                // Block double spaces
                if (value.includes('  ')) return prev;
                if (/[^a-zA-Z\s]/.test(value)) return prev; // Regex strict block
                newVal = value; // allow typing
            }

            // 2. Clear error on change
            if (field === 'name' || field === 'phone') {
                delete newErrors[field as 'name' | 'phone'];
            }

            return { ...prev, [field]: newVal, errors: newErrors };
        });
    };

    // Strict Validation on Blur
    const handleBlur = (playerBox: 'crown' | 'challenger', field: 'name' | 'phone') => {
        const player = playerBox === 'crown' ? crownHolder : challenger;
        const setPlayer = playerBox === 'crown' ? setCrownHolder : setChallenger;

        let error: string | undefined;

        if (field === 'name') {
            const res = validateName(player.name);
            if (!res.isValid) error = res.error;
            else {
                // Auto-format on blur
                setPlayer(prev => ({ ...prev, name: formatName(prev.name) }));
            }
        } else if (field === 'phone') {
            const res = validatePhone(player.phone);
            if (!res.isValid) error = res.error;
        }

        if (error) {
            setPlayer(prev => ({
                ...prev,
                errors: { ...prev.errors, [field]: error }
            }));
        }
    };

    useEffect(() => {
        if (!crownHolder.name || crownHolder.name.length < 2) {
            setSearchResultsP1([]);
            setShowDropdownP1(false);
            return;
        }

        if (isSelectingP1.current) {
            isSelectingP1.current = false;
            return;
        }

        let cancel = false;

        const timer = setTimeout(async () => {
            try {
                setIsSearchingP1(true);

                const res = await axios.get(
                    "/api/customers/search",
                    { params: { name: crownHolder.name.trim() } }
                );

                if (!cancel) {
                    setSearchResultsP1(res.data);
                    setShowDropdownP1(res.data.length > 0);
                }

            } catch {
                if (!cancel) setSearchResultsP1([]);
            } finally {
                if (!cancel) setIsSearchingP1(false);
            }
        }, 400);

        return () => { cancel = true; clearTimeout(timer); };

    }, [crownHolder.name]);

    useEffect(() => {
        if (!challenger.name || challenger.name.length < 2) {
            setSearchResultsP2([]);
            setShowDropdownP2(false);
            return;
        }

        if (isSelectingP2.current) {
            isSelectingP2.current = false;
            return;
        }

        let cancel = false;

        const timer = setTimeout(async () => {
            try {
                setIsSearchingP2(true);

                const res = await axios.get(
                    "/api/customers/search",
                    { params: { name: challenger.name.trim() } }
                );

                if (!cancel) {
                    setSearchResultsP2(res.data);
                    setShowDropdownP2(res.data.length > 0);
                }

            } catch {
                if (!cancel) setSearchResultsP2([]);
            } finally {
                if (!cancel) setIsSearchingP2(false);
            }
        }, 400);

        return () => { cancel = true; clearTimeout(timer); };

    }, [challenger.name]);

    const selectPlayer1 = (c: { name: string, phone: string }) => {
        isSelectingP1.current = true;
        setCrownHolder(prev => ({
            ...prev,
            name: c.name,
            phone: c.phone,
            errors: {}
        }));
        setShowDropdownP1(false);
    };

    const selectPlayer2 = (c: { name: string, phone: string }) => {
        isSelectingP2.current = true;
        setChallenger(prev => ({
            ...prev,
            name: c.name,
            phone: c.phone,
            errors: {}
        }));
        setShowDropdownP2(false);
    };

    // Config Handlers
    const handleConfigChange = (field: keyof BattleConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    // Submit Logic
    const validateAll = () => {
        const p1Name = validateName(crownHolder.name);
        const p1Phone = validatePhone(crownHolder.phone);
        const p2Name = validateName(challenger.name);
        const p2Phone = validatePhone(challenger.phone);

        setCrownHolder(prev => ({
            ...prev,
            errors: { name: p1Name.error, phone: p1Phone.error }
        }));
        setChallenger(prev => ({
            ...prev,
            errors: { name: p2Name.error, phone: p2Phone.error }
        }));

        return p1Name.isValid && p1Phone.isValid && p2Name.isValid && p2Phone.isValid;
    };

    const handleSubmit = async () => {
        if (!validateAll()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                crownHolder: {
                    name: formatName(crownHolder.name),
                    phone: crownHolder.phone,
                    teamName: config.matchType === 'Team' ? crownHolder.teamName : undefined
                },
                challenger: {
                    name: formatName(challenger.name),
                    phone: challenger.phone,
                    teamName: config.matchType === 'Team' ? challenger.teamName : undefined
                },
                config
            };

            await axios.post('/api/battles/start', payload);

            // alert('Battle Started! ⚔️'); 
            // Better UX: No alert, just close and show toast (if available), or simple auto-close
            onClose();

            // Reset
            setCrownHolder({ name: '', phone: '', errors: {} });
            setChallenger({ name: '', phone: '', errors: {} });
            setConfig({ matchType: 'Solo' });

        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to start battle");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            <div className="battle-modal-backdrop" onClick={onClose}>
                <motion.div
                    className="battle-modal-container"
                    onClick={(e) => e.stopPropagation()} // Prevent close on modal click
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {/* Header */}
                    <div className="battle-modal-header">
                        <div className="header-title-wrapper">
                            <GiCrossedSwords className="text-red-500 text-xl" />
                            <h2 className="battle-modal-title">New Battle Registration</h2>
                        </div>
                        <button className="close-btn" onClick={onClose}>
                            <FaTimes size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="battle-form-content custom-scrollbar">

                        {/* Common Config Section */}
                        <div className="common-settings">
                            <div className="battle-input-wrapper">
                                <label className="input-label">Match Type</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className={`battle-select text-left flex items-center gap-2 ${config.matchType === 'Solo' ? 'border-purple-500 bg-purple-500/10' : ''}`}
                                        onClick={() => handleConfigChange('matchType', 'Solo')}
                                    >
                                        <FaUsers size={12} /> Solo
                                    </button>
                                    <button
                                        type="button"
                                        className={`battle-select text-left flex items-center gap-2 ${config.matchType === 'Team' ? 'border-purple-500 bg-purple-500/10' : ''}`}
                                        onClick={() => handleConfigChange('matchType', 'Team')}
                                    >
                                        <FaUsers size={12} /> Team
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Players Grid */}
                        <div className="players-grid">

                            {/* Crown Holder */}
                            <div className="player-card crown">
                                <div className="card-header">
                                    <FaCrown /> Crown Holder (Player 1)
                                </div>

                                <div className="input-group" style={{ position: "relative" }}>
                                    <label className="input-label">Full Name</label>
                                    <input
                                        className={`battle-input ${crownHolder.errors.name ? 'error' : ''}`}
                                        placeholder="e.g. Rahul Sharma"
                                        value={crownHolder.name}
                                        onChange={(e) => handlePlayerChange('crown', 'name', e.target.value)}
                                        onBlur={() => { handleBlur('crown', 'name'); setTimeout(() => setShowDropdownP1(false), 150) }}
                                        onFocus={() => searchResultsP1.length && setShowDropdownP1(true)}
                                    />

                                    {showDropdownP1 && (
                                        <div className="player-dropdown">
                                            {isSearchingP1 && <div className="dropdown-item">Searching...</div>}

                                            {searchResultsP1.map((c, i) => (
                                                <div key={i} className="dropdown-item" onMouseDown={() => selectPlayer1(c)}>
                                                    <div>{c.name}</div>
                                                    <div style={{ fontSize: 12, opacity: .7 }}>{c.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {crownHolder.errors.name && <span className="input-error-msg">{crownHolder.errors.name}</span>}
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Phone Number</label>
                                    <input
                                        className={`battle-input ${crownHolder.errors.phone ? 'error' : ''}`}
                                        placeholder="10-digit number"
                                        type="tel"
                                        maxLength={10}
                                        value={crownHolder.phone}
                                        onChange={(e) => handlePlayerChange('crown', 'phone', e.target.value)}
                                        onBlur={() => handleBlur('crown', 'phone')}
                                    />
                                    {crownHolder.errors.phone && <span className="input-error-msg">{crownHolder.errors.phone}</span>}
                                </div>

                                {config.matchType === 'Team' && (
                                    <div className="input-group">
                                        <label className="input-label">Team Name</label>
                                        <input
                                            className="battle-input"
                                            placeholder="Team Alpha"
                                            value={crownHolder.teamName || ''}
                                            onChange={(e) => setCrownHolder({ ...crownHolder, teamName: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* VS Divider */}
                            <div className="vs">
                                VS
                            </div>

                            {/* Challenger */}
                            <div className="player-card challenger">
                                <div className="card-header">
                                    <FaGamepad /> Challenger (Player 2)
                                </div>

                                <div className="input-group" style={{ position: "relative" }}>
                                    <label className="input-label">Full Name</label>
                                    <input
                                        className={`battle-input ${challenger.errors.name ? 'error' : ''}`}
                                        placeholder="e.g. Vikram Singh"
                                        value={challenger.name}
                                        onChange={(e) => handlePlayerChange('challenger', 'name', e.target.value)}
                                        onBlur={() => { handleBlur('challenger', 'name'); setTimeout(() => setShowDropdownP2(false), 150) }}
                                        onFocus={() => searchResultsP2.length && setShowDropdownP2(true)}
                                    />

                                    {showDropdownP2 && (
                                        <div className="player-dropdown">
                                            {isSearchingP2 && <div className="dropdown-item">Searching...</div>}

                                            {searchResultsP2.map((c, i) => (
                                                <div key={i} className="dropdown-item" onMouseDown={() => selectPlayer2(c)}>
                                                    <div>{c.name}</div>
                                                    <div style={{ fontSize: 12, opacity: .7 }}>{c.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {challenger.errors.name && <span className="input-error-msg">{challenger.errors.name}</span>}
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Phone Number</label>
                                    <input
                                        className={`battle-input ${challenger.errors.phone ? 'error' : ''}`}
                                        placeholder="10-digit number"
                                        type="tel"
                                        maxLength={10}
                                        value={challenger.phone}
                                        onChange={(e) => handlePlayerChange('challenger', 'phone', e.target.value)}
                                        onBlur={() => handleBlur('challenger', 'phone')}
                                    />
                                    {challenger.errors.phone && <span className="input-error-msg">{challenger.errors.phone}</span>}
                                </div>

                                {config.matchType === 'Team' && (
                                    <div className="input-group">
                                        <label className="input-label">Team Name</label>
                                        <input
                                            className="battle-input"
                                            placeholder="Team Omega"
                                            value={challenger.teamName || ''}
                                            onChange={(e) => setChallenger({ ...challenger, teamName: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Actions */}
                    <div className="battle-actions">
                        <button className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button className="start-btn" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>Processing...</>
                            ) : (
                                <><GiCrossedSwords /> Start Battle</>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PlayersBattleModal;