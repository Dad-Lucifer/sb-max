import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { usePricing } from '../context/PricingContext';
import { defaultPricingConfig } from '../types/pricingConfig';
import type { PricingConfig } from '../types/pricingConfig';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdSave,
    MdCheckCircle,
    MdAccessTime,
    MdFlashOn,
    MdShield,
    MdSettingsInputComponent,
    MdInfo,
    MdTune,
    MdRefresh,
    MdKeyboardArrowRight,
    MdEventAvailable
} from 'react-icons/md';
import './PricingConfig.css';

// URL is now handled by the api utility

type TabType = 'hours' | 'consoles';

const PricingConfigPage = () => {
    const { refreshConfig } = usePricing();
    const [config, setConfig] = useState<PricingConfig>(defaultPricingConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('hours');
    const [dayPriceTab, setDayPriceTab] = useState<'monWed' | 'thursday' | 'friSun'>('monWed');

    useEffect(() => {
        fetchConfig();
    }, []);

    const deepMerge = (target: any, source: any) => {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    };

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/pricing');
            if (response.data) {
                // deep merge with default to ensure all new fields exist
                const merged = JSON.parse(JSON.stringify(defaultPricingConfig));
                deepMerge(merged, response.data);
                setConfig(merged);
            }
        } catch (err) {
            console.error("Error fetching admin pricing config", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (section: keyof PricingConfig, field: string, value: any) => {
        setConfig(prev => {
            const newConfig = { ...prev };
            const path = field.split('.');

            let current: any = { ...newConfig[section] };
            newConfig[section] = current;

            for (let i = 0; i < path.length - 1; i++) {
                const step = path[i];
                current[step] = { ...current[step] };
                current = current[step];
            }

            current[path[path.length - 1]] = value;
            return newConfig;
        });
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        try {
            await api.put('/api/pricing', config);
            refreshConfig();
            setSuccessMessage("Configuration Synced Successfully");
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (error) {
            console.error(error);
            alert("Failed to save pricing configuration.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="pricing-dashboard-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 90, 180, 270, 360]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ fontSize: '3rem', color: '#3b82f6' }}
                >
                    <MdTune />
                </motion.div>
                <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Establishing secure connection...</p>
            </div>
        );
    }

    const TimePicker = ({ hour, minute, onChange, hasMinute = true }: { hour: number; minute?: number; onChange: (h: number, m?: number) => void; hasMinute?: boolean }) => (
        <div className="time-box-premium">
            <input
                type="number"
                value={hour}
                onChange={e => onChange(Math.min(23, Math.max(0, Number(e.target.value))), minute)}
                className="time-num-input"
            />
            {hasMinute && (
                <>
                    <span className="time-sep">:</span>
                    <input
                        type="number"
                        value={minute}
                        onChange={e => onChange(hour, Math.min(59, Math.max(0, Number(e.target.value))))}
                        className="time-num-input"
                    />
                </>
            )}
        </div>
    );

    const renderHoursTab = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="helper-box">
                <MdInfo className="helper-icon" />
                <div className="helper-text">
                    The pricing engine automatically transitions between slots. Ensure <strong>End Time</strong> of one slot roughly aligns with the <strong>Start Time</strong> of the next.
                </div>
            </div>

            <div className="schedule-container">
                {/* MON-WED SECTION */}
                <div className="day-schedule-card">
                    <div className="day-header-dash">
                        <MdEventAvailable size={24} style={{ color: '#3b82f6' }} />
                        <h3>Week Start <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem', marginLeft: '8px' }}>Monday — Wednesday</span></h3>
                    </div>

                    <div className="shifts-timeline">
                        <div className="shift-row shift-happy">
                            <div className="shift-label"><MdFlashOn /> Happy Hour</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.happyHour.monWedStartHour} minute={config.happyHour.monWedStartMinute} onChange={(h, m) => { handleChange('happyHour', 'monWedStartHour', h); handleChange('happyHour', 'monWedStartMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.happyHour.monWedEndHour} minute={config.happyHour.monWedEndMinute} onChange={(h, m) => { handleChange('happyHour', 'monWedEndHour', h); handleChange('happyHour', 'monWedEndMinute', m); }} />
                            </div>
                        </div>

                        <div className="shift-row shift-normal">
                            <div className="shift-label"><MdAccessTime /> Normal</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.normalHour.monWedStartHour} minute={config.normalHour.monWedStartMinute} onChange={(h, m) => { handleChange('normalHour', 'monWedStartHour', h); handleChange('normalHour', 'monWedStartMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.normalHour.monWedEndHour} minute={config.normalHour.monWedEndMinute} onChange={(h, m) => { handleChange('normalHour', 'monWedEndHour', h); handleChange('normalHour', 'monWedEndMinute', m); }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* THURSDAY SECTION */}
                <div className="day-schedule-card" style={{ borderLeftColor: '#facc15' }}>
                    <div className="day-header-dash">
                        <MdEventAvailable size={24} style={{ color: '#facc15' }} />
                        <h3>Fun Thursday <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem', marginLeft: '8px' }}>Special Override</span></h3>
                    </div>

                    <div className="shifts-timeline">
                        <div className="shift-row shift-happy">
                            <div className="shift-label"><MdFlashOn /> Happy Hour</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.happyHour.thursdayStartHour} minute={config.happyHour.thursdayStartMinute} onChange={(h, m) => { handleChange('happyHour', 'thursdayStartHour', h); handleChange('happyHour', 'thursdayStartMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.happyHour.thursdayEndHour} minute={config.happyHour.thursdayEndMinute} onChange={(h, m) => { handleChange('happyHour', 'thursdayEndHour', h); handleChange('happyHour', 'thursdayEndMinute', m); }} />
                            </div>
                        </div>

                        <div className="shift-row shift-normal">
                            <div className="shift-label"><MdAccessTime /> Normal</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.normalHour.thursdayStartHour} minute={config.normalHour.thursdayStartMinute} onChange={(h, m) => { handleChange('normalHour', 'thursdayStartHour', h); handleChange('normalHour', 'thursdayStartMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.normalHour.thursdayEndHour} minute={config.normalHour.thursdayEndMinute} onChange={(h, m) => { handleChange('normalHour', 'thursdayEndHour', h); handleChange('normalHour', 'thursdayEndMinute', m); }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FRI-SUN SECTION */}
                <div className="day-schedule-card" style={{ borderLeftColor: '#10b981' }}>
                    <div className="day-header-dash">
                        <MdEventAvailable size={24} style={{ color: '#10b981' }} />
                        <h3>Week Finish <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem', marginLeft: '8px' }}>Friday — Sunday</span></h3>
                    </div>

                    <div className="shifts-timeline">
                        <div className="shift-row shift-happy">
                            <div className="shift-label"><MdFlashOn /> Happy Hour</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.happyHour.friSunStartHour} minute={config.happyHour.friSunStartMinute} onChange={(h, m) => { handleChange('happyHour', 'friSunStartHour', h); handleChange('happyHour', 'friSunStartMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.happyHour.friSunEndHour} minute={config.happyHour.friSunEndMinute} onChange={(h, m) => { handleChange('happyHour', 'friSunEndHour', h); handleChange('happyHour', 'friSunEndMinute', m); }} />
                            </div>
                        </div>

                        <div className="shift-row shift-normal">
                            <div className="shift-label"><MdAccessTime /> Normal</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.normalHour.friSunStartHour} minute={config.normalHour.friSunStartMinute} onChange={(h, m) => { handleChange('normalHour', 'friSunStartHour', h); handleChange('normalHour', 'friSunStartMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.normalHour.friSunEndHour} minute={config.normalHour.friSunEndMinute} onChange={(h, m) => { handleChange('normalHour', 'friSunEndHour', h); handleChange('normalHour', 'friSunEndMinute', m); }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* LATE NIGHT */}
                <div className="day-schedule-card" style={{ borderLeftColor: '#ec4899' }}>
                    <div className="day-header-dash">
                        <MdShield size={24} style={{ color: '#ec4899' }} />
                        <h3>Shift Policy <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem', marginLeft: '8px' }}>Daily Rotation</span></h3>
                    </div>
                    <div className="shifts-timeline">
                        <div className="shift-row shift-fun">
                            <div className="shift-label"><MdShield /> Fun Night</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.funNight.startHour} minute={config.funNight.startMinute} onChange={(h, m) => { handleChange('funNight', 'startHour', h); handleChange('funNight', 'startMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.funNight.endHour} minute={config.funNight.endMinute} onChange={(h, m) => { handleChange('funNight', 'endHour', h); handleChange('funNight', 'endMinute', m); }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderConsolesTab = () => {
        const isMonWed = dayPriceTab === 'monWed';
        const isThursday = dayPriceTab === 'thursday';
        const priceSet = isMonWed ? config.monWedPrices : (isThursday ? config.thursdayPrices : config.friSunPrices);

        if (!priceSet) return <div className="helper-box"><div className="helper-text">Loading price matrix...</div></div>;

        const prefix = dayPriceTab === 'monWed' ? 'monWedPrices' :
            dayPriceTab === 'thursday' ? 'thursdayPrices' :
                'friSunPrices';

        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="settings-group">
                    <div className="settings-group-header">
                        <div className="settings-group-title">
                            <MdSettingsInputComponent style={{ color: '#3b82f6' }} /> Console Rate Matrix
                        </div>
                        <div className="price-toggle-group">
                            <button className={`price-toggle-btn ${dayPriceTab === 'monWed' ? 'active' : ''}`} onClick={() => setDayPriceTab('monWed')}>Mon-Wed</button>
                            <button className={`price-toggle-btn ${dayPriceTab === 'thursday' ? 'active' : ''}`} style={{ borderColor: dayPriceTab === 'thursday' ? '#facc15' : 'transparent' }} onClick={() => setDayPriceTab('thursday')}>Thursday</button>
                            <button className={`price-toggle-btn ${dayPriceTab === 'friSun' ? 'active' : ''}`} style={{ borderColor: dayPriceTab === 'friSun' ? '#10b981' : 'transparent' }} onClick={() => setDayPriceTab('friSun')}>Fri-Sun</button>
                        </div>
                    </div>
                    <div className="price-table-responsive-wrapper">
                        <table className="price-comparison-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '220px' }}>Platform Device</th>
                                    <th>Max 30m</th>
                                    <th>Base (60m)</th>
                                    <th>2 Players (60m)</th>
                                    <th>Multi-Mod</th>
                                    <th>Extra Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* PS5 */}
                                <tr className="price-row-card">
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdSettingsInputComponent style={{ color: '#facc15' }} /> PS5 (Happy Hour)</div></td>
                                    <td><input type="number" value={priceSet.happyHour.ps5.less30m} onChange={e => handleChange(prefix, 'happyHour.ps5.less30m', Number(e.target.value))} className="dashboard-input" /></td>
                                    <td><input type="number" value={priceSet.happyHour.ps5.onePerson} onChange={e => handleChange(prefix, 'happyHour.ps5.onePerson', Number(e.target.value))} className="dashboard-input" /></td>
                                    <td><input type="number" value={priceSet.happyHour.ps5.twoPerson || ''} onChange={e => handleChange(prefix, 'happyHour.ps5.twoPerson', Number(e.target.value))} className="dashboard-input" placeholder="-" /></td>
                                    <td><input type="number" value={priceSet.happyHour.ps5.multiplePersonBaseMod} onChange={e => handleChange(prefix, 'happyHour.ps5.multiplePersonBaseMod', Number(e.target.value))} className="dashboard-input" /></td>
                                    <td><input type="number" value={priceSet.happyHour.ps5.extra30mMod} onChange={e => handleChange(prefix, 'happyHour.ps5.extra30mMod', Number(e.target.value))} className="dashboard-input" /></td>
                                </tr>
                                <tr className="price-row-card">
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdSettingsInputComponent style={{ color: '#60a5fa' }} /> PS5 (Normal)</div></td>
                                    <td><input type="number" value={priceSet.normalHour.ps5.less30m} onChange={e => handleChange(prefix, 'normalHour.ps5.less30m', Number(e.target.value))} className="dashboard-input" /></td>
                                    <td><input type="number" value={priceSet.normalHour.ps5.onePerson} onChange={e => handleChange(prefix, 'normalHour.ps5.onePerson', Number(e.target.value))} className="dashboard-input" /></td>
                                    <td><input type="number" value={priceSet.normalHour.ps5.twoPerson || ''} onChange={e => handleChange(prefix, 'normalHour.ps5.twoPerson', Number(e.target.value))} className="dashboard-input" placeholder="-" /></td>
                                    <td><input type="number" value={priceSet.normalHour.ps5.multiplePersonBaseMod} onChange={e => handleChange(prefix, 'normalHour.ps5.multiplePersonBaseMod', Number(e.target.value))} className="dashboard-input" /></td>
                                    <td><input type="number" value={priceSet.normalHour.ps5.extra30mMod} onChange={e => handleChange(prefix, 'normalHour.ps5.extra30mMod', Number(e.target.value))} className="dashboard-input" /></td>
                                </tr>

                                {/* Fun Night (Isolated by Day Slot) */}
                                <tr className="price-row-card" style={{ borderTop: '2px solid rgba(236, 72, 153, 0.2)' }}>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdShield style={{ color: '#ec4899' }} /> PS5 (Fun Night)</div></td>
                                    <td><input type="number" value={priceSet.funNight.ps5.less30m} onChange={e => handleChange(prefix, 'funNight.ps5.less30m', Number(e.target.value))} className="dashboard-input" /></td>
                                    <td><input type="number" value={priceSet.funNight.ps5.onePerson} onChange={e => handleChange(prefix, 'funNight.ps5.onePerson', Number(e.target.value))} className="dashboard-input" /></td>
                                    <td><input type="number" value={priceSet.funNight.ps5.twoPerson || ''} onChange={e => handleChange(prefix, 'funNight.ps5.twoPerson', Number(e.target.value))} className="dashboard-input" placeholder="-" /></td>
                                    <td><input type="number" value={priceSet.funNight.ps5.multiplePersonBaseMod} onChange={e => handleChange(prefix, 'funNight.ps5.multiplePersonBaseMod', Number(e.target.value))} className="dashboard-input" /></td>
                                    <td><input type="number" value={priceSet.funNight.ps5.extra30mMod} onChange={e => handleChange(prefix, 'funNight.ps5.extra30mMod', Number(e.target.value))} className="dashboard-input" /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        );
    };



    return (
        <div className="pricing-dashboard-view">
            <AnimatePresence mode="wait">
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="success-toast"
                    >
                        <MdCheckCircle size={20} />
                        <span>{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="module-header">
                <div className="module-title">
                    <h2>Pricing Engine Configuration</h2>
                    <p>Centralized control for system economy and time-based multipliers.</p>
                </div>
                <div className="module-header-actions">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-secondary"
                        onClick={fetchConfig}
                        style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <MdRefresh /> Reload Data
                    </motion.button>
                </div>
            </header>

            <div className="pricing-tabs-container">
                <nav className="pricing-tabs-nav">
                    <button className={`tab-btn ${activeTab === 'hours' ? 'active' : ''}`} onClick={() => setActiveTab('hours')}>
                        <MdAccessTime className="tab-icon" /> Operating Hours
                    </button>
                    <button className={`tab-btn ${activeTab === 'consoles' ? 'active' : ''}`} onClick={() => setActiveTab('consoles')}>
                        <MdSettingsInputComponent className="tab-icon" /> Rate Matrix
                    </button>
                </nav>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <main className="pricing-tabs-content">
                        {activeTab === 'hours' && renderHoursTab()}
                        {activeTab === 'consoles' && renderConsolesTab()}
                    </main>

                    <footer className="module-actions-bar">
                        <button className="btn-secondary" onClick={fetchConfig}>Discard Changes</button>
                        <motion.button
                            className="btn-primary"
                            disabled={saving}
                            onClick={() => handleSave()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {saving ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                >
                                    <MdRefresh size={18} />
                                </motion.div>
                            ) : <MdSave size={18} />}
                            {saving ? 'Syncing...' : 'Save Configuration'}
                        </motion.button>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default PricingConfigPage;
