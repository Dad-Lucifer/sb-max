
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlaystation,
  FaDesktop,
  FaVrCardboard,
  FaChevronDown,
  FaRocket,
  FaUser,
  FaClock
} from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import axios from 'axios';
import './SessionEntry.css';
import { calculateSessionPrice, isFunNightTime, isNormalHourTime } from '../../utils/pricing';
import { usePricing } from '../../context/PricingContext';


/* ---------------- SNACK STATE ---------------- */

type DeviceKeys = 'ps' | 'pc' | 'vr' | 'wheel' | 'metabat';

// Changed to number[] to store multiple machine IDs
interface DeviceCounts {
  ps: number[];
  pc: number[];
  vr: number[];
  wheel: number[];
  metabat: number[];
}

interface FormState {
  customerName: string;
  contactNumber: string;
  duration: string;        // HH:MM
  peopleCount: number;
  snacks: string;
  devices: DeviceCounts;
}

import DeviceDropdown from './DeviceDropdown';

/* ---------------- MAIN ---------------- */

import SnackSelector from './SnackSelector';

/* ---------------- MAIN ---------------- */

const SessionEntry: React.FC = () => {
  const { config } = usePricing();
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const [form, setForm] = useState<FormState>({
    customerName: '',
    contactNumber: '',
    duration: "00:00",
    peopleCount: 1,
    snacks: '',
    devices: {
      ps: [],
      pc: [],
      vr: [],
      wheel: [],
      metabat: []
    }
  });

  // State for availability - occupied is still array of numbers
  const [availability, setAvailability] = useState<{
    limits: Record<DeviceKeys, number>; // Limits are just numbers (e.g. 6 PS5s)
    occupied: { [key in DeviceKeys]: number[] };
  }>({
    limits: { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 },
    occupied: { ps: [], pc: [], vr: [], wheel: [], metabat: [] }
  });

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateDevice = (key: DeviceKeys, value: number[]) => {
    setForm(prev => ({
      ...prev,
      devices: { ...prev.devices, [key]: value }
    }));
  };

  const fetchAvailability = async () => {
    try {
      // Backend returns limits as numbers { ps: 6 } and occupied as arrays { ps: [1,2] }
      // We need to map `limits` properly if it comes as object
      const res = await axios.get<{ limits: Record<DeviceKeys, number>; occupied: { [key in DeviceKeys]: number[] } }>(
        'https://lavenderblush-chicken-803718.hostingersite.com0/api/sessions/availability'
      );
      setAvailability(res.data);
    } catch (e) {
      console.error("Failed to fetch availability", e);
    }
  };

  useEffect(() => {
    fetchAvailability();
    const interval = setInterval(fetchAvailability, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);


  const [snackCost, setSnackCost] = useState<number>(0);

  /* ---------- SAFE DURATION ---------- */
  const durationStr = form.duration || "00:00";
  const parts = durationStr.split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  const durationInHours = h + m / 60;

  // New Pricing Logic
  const calcBasePrice = calculateSessionPrice(
    durationInHours,
    form.peopleCount,
    (form.devices as unknown) as Record<string, number[]>,
    new Date(), // Current time for Fun Night check
    config
  );

  const totalPrice = calcBasePrice + snackCost;
  const isFunNight = isFunNightTime(new Date(), config);
  const isNormalHour = isNormalHourTime(new Date(), config);
  /* ----------------------------------- */

  const startSession = async () => {
    try {
      if (!form.customerName) {
        alert("Please enter customer name");
        return;
      }

      await axios.post('https://lavenderblush-chicken-803718.hostingersite.com0/api/sessions/start', {
        ...form,
        duration: durationInHours,
        price: totalPrice
      });

      alert('Session started 🚀');

      // Reset form
      setForm({
        customerName: '',
        contactNumber: '',
        duration: "00:00",
        peopleCount: 1,
        snacks: '',
        devices: { ps: [], pc: [], vr: [], wheel: [], metabat: [] }
      });

      // Re-fetch availability instantly
      fetchAvailability();

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to start session ❌';
      alert(msg);
    }
  };


  /* -----------------------------
     JSX
  ----------------------------- */
  return (
    <div className="session-card-container">
      {/* Header */}
      <div className="session-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="header-title">
          <div className="header-icon"><FaRocket /></div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>New Session</span>
            {isFunNight && <span style={{ color: '#ec4899', fontSize: '0.8em', marginLeft: 8 }}>🌙 Fun Night</span>}
            {isNormalHour && <span style={{ color: '#3b82f6', fontSize: '0.8em', marginLeft: 8 }}>☀️ Normal Hour</span>}
          </div>
        </div>
        <div className="toggle-icon" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <FaChevronDown />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="session-body-wrapper"
            style={{ overflow: 'hidden' }}
          >
            <div className="session-body">
              {/* Input Grid */}
              <div className="input-grid">
                <div className="field-group">
                  <label className="field-label">Customer Name</label>
                  <input
                    className="field-input"
                    placeholder="Enter name"
                    value={form.customerName}
                    onChange={e => updateField('customerName', e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Contact</label>
                  <input
                    className="field-input"
                    maxLength={10}
                    placeholder="10 Digits"
                    value={form.contactNumber}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) updateField('contactNumber', val);
                    }}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Duration <span style={{ opacity: 0.5, fontWeight: 400 }}>(HH:MM)</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="field-input"
                      placeholder="00:00"
                      value={form.duration}
                      style={{ paddingLeft: '2.5rem' }}
                      onChange={e => {
                        let val = e.target.value.replace(/[^0-9:]/g, "");
                        if (val.length === 2 && !val.includes(":")) val = val + ":";
                        if (val.length > 5) return;
                        updateField("duration", val);
                      }}
                    />
                    <FaClock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">People Count</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      className="field-input"
                      min={1}
                      value={form.peopleCount}
                      style={{ paddingLeft: '2.5rem' }}
                      onChange={e => updateField('peopleCount', Math.max(1, Number(e.target.value)))}
                    />
                    <FaUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
                  </div>
                </div>

                <SnackSelector
                  onChange={(val, cost) => {
                    updateField('snacks', val);
                    setSnackCost(cost);
                  }}
                />
              </div>

              {/* Devices */}
              <div className="devices-section">
                <div className="section-label">Select Devices</div>
                <div className="devices-list">
                  <DeviceDropdown
                    icon={<FaPlaystation />}
                    label="PS5"
                    limit={availability.limits.ps}
                    value={form.devices.ps}
                    occupied={availability.occupied.ps || []}
                    onChange={v => updateDevice('ps', v)}
                  />

                  <DeviceDropdown
                    icon={<FaDesktop />}
                    label="PC"
                    limit={availability.limits.pc}
                    value={form.devices.pc}
                    occupied={availability.occupied.pc || []}
                    onChange={v => updateDevice('pc', v)}
                  />

                  <DeviceDropdown
                    icon={<FaVrCardboard />}
                    label="VR"
                    limit={availability.limits.vr}
                    value={form.devices.vr}
                    occupied={availability.occupied.vr || []}
                    onChange={v => updateDevice('vr', v)}
                  />

                  <DeviceDropdown
                    icon={<GiSteeringWheel />}
                    label="Wheel"
                    limit={availability.limits.wheel}
                    value={form.devices.wheel}
                    occupied={availability.occupied.wheel || []}
                    onChange={v => updateDevice('wheel', v)}
                  />

                  <DeviceDropdown
                    icon={<GiCricketBat />}
                    label="MetaBat"
                    limit={availability.limits.metabat}
                    value={form.devices.metabat}
                    occupied={availability.occupied.metabat || []}
                    onChange={v => updateDevice('metabat', v)}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="action-footer">
                {Object.values(form.devices).some(val => val.length > 0) && (
                  <div className="price-display">
                    <span className="price-label">Estimated Total</span>
                    <span className="price-val">₹{Math.round(totalPrice)}</span>
                  </div>
                )}

                <button
                  className="start-session-btn"
                  onClick={startSession}
                  disabled={!form.customerName || (durationInHours <= 0) || !Object.values(form.devices).some(val => val.length > 0)}
                >
                  <span>Start Session</span>
                  <FaChevronDown style={{ transform: 'rotate(-90deg)' }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionEntry;