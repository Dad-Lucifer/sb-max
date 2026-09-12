import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlaystation,
  FaDesktop,
  FaVrCardboard,
  FaTimes,
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaChevronRight,
  FaChevronLeft,
  FaCheck,
  FaCheckCircle,
  FaPhone
} from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import axios from 'axios';
import './BookingModal.css';
import { useToast } from '../../context/ToastContext';

import DeviceDropdown from './DeviceDropdown'; // Imported shared component
import { calculateSessionPrice } from '../../utils/pricing';
import { usePricing } from '../../context/PricingContext';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

// Device Dropdown moved to separate file

type DeviceType = 'ps' | 'pc' | 'vr' | 'wheel' | 'metabat';

interface DeviceInfo {
  key: DeviceType;
  label: string;
  icon: React.ReactNode;
}

const DEVICES: DeviceInfo[] = [
  { key: 'ps', label: 'PlayStation 5', icon: <FaPlaystation /> },
  { key: 'pc', label: 'PC Gaming', icon: <FaDesktop /> },
  { key: 'vr', label: 'VR Station', icon: <FaVrCardboard /> },
  { key: 'wheel', label: 'Racing Wheel', icon: <GiSteeringWheel /> },
  { key: 'metabat', label: 'Meta Bat', icon: <GiCricketBat /> }
];

const BookingModal = ({ onClose, onSuccess }: Props) => {
  const { config } = usePricing();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    customerName: '',
    contactNumber: '',
    peopleCount: 1,
    bookingDate: '',
    bookingTime: '',
    bookingEndTime: '',
    devices: {
      ps: [],
      pc: [],
      vr: [],
      wheel: [],
      metabat: []
    } as Record<string, number[]>
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const isSelecting = useRef(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!form.customerName || form.customerName.length < 2) {
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
          "https://lavenderblush-chicken-803718.hostingersite.com0/api/customers/search",
          { params: { name: form.customerName.trim() } }
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
  }, [form.customerName]);

  const selectCustomer = (customer: any) => {
    isSelecting.current = true;
    setForm(prev => ({
      ...prev,
      customerName: customer.name,
      contactNumber: customer.phone
    }));
    setShowDropdown(false);
  };

  // State for time-specific availability
  const [timeBasedAvailability, setTimeBasedAvailability] = useState<{
    limits: Record<string, number>;
    occupied: { [key: string]: number[] };
  }>({
    limits: { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 },
    occupied: { ps: [], pc: [], vr: [], wheel: [], metabat: [] }
  });

  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Fetch availability for specific date/time
  const fetchTimeBasedAvailability = async () => {
    if (!form.bookingDate || !form.bookingTime || !form.bookingEndTime) {
      return;
    }

    setLoadingAvailability(true);
    try {
      const startDateTime = new Date(`${form.bookingDate}T${form.bookingTime}`);
      const endDateTime = new Date(`${form.bookingDate}T${form.bookingEndTime}`);

      const res = await axios.get(
        'https://lavenderblush-chicken-803718.hostingersite.com0/api/sessions/availability-for-time',
        {
          params: {
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString()
          }
        }
      );
      setTimeBasedAvailability(res.data);
    } catch (e) {
      console.error("Failed to fetch time-based availability", e);
      // Fallback
      setTimeBasedAvailability({
        limits: { ps: 6, pc: 5, vr: 1, wheel: 1, metabat: 1 },
        occupied: { ps: [], pc: [], vr: [], wheel: [], metabat: [] }
      });
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Fetch availability when date/time changes
  useEffect(() => {
    if (currentStep === 3) {
      fetchTimeBasedAvailability();
    }
  }, [currentStep]);

  const updateDevice = (key: string, value: number[]) => {
    // Check if adding devices exceeds people count
    const currentDeviceCount = getTotalDevices();
    const newDeviceTypeCount = value.length;
    const oldDeviceTypeCount = form.devices[key].length;
    const diff = newDeviceTypeCount - oldDeviceTypeCount;

    if (diff > 0 && (currentDeviceCount + diff) > form.peopleCount) {
      alert(`You cannot select more devices than the number of people (${form.peopleCount}).`);
      return;
    }

    setForm(prev => ({
      ...prev,
      devices: {
        ...prev.devices,
        [key]: value
      }
    }));
  };

  const getTotalDevices = () => {
    return Object.values(form.devices).reduce((sum, list) => sum + list.length, 0);
  };

  const getSelectedDevices = () => {
    return Object.entries(form.devices)
      .filter(([_, list]) => list.length > 0)
      .map(([key, list]) => {
        const device = DEVICES.find(d => d.key === key);
        return { ...device, count: list.length, ids: list };
      });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return form.customerName.trim().length > 0 &&
          form.contactNumber.length === 10 &&
          form.peopleCount > 0;
      case 2:
        return form.bookingDate && form.bookingTime && form.bookingEndTime;
      case 3:
        return getTotalDevices() > 0 && getTotalDevices() <= form.peopleCount && pcCountValid;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const { showToast } = useToast();

  const createBooking = async () => {
    if (!canProceed()) return;

    try {
      const bookingDateTime = new Date(`${form.bookingDate}T${form.bookingTime}`);
      const endDateTime = new Date(`${form.bookingDate}T${form.bookingEndTime}`);

      await axios.post('https://lavenderblush-chicken-803718.hostingersite.com0/api/sessions/booking', {
        customerName: form.customerName,
        contactNumber: form.contactNumber,
        peopleCount: form.peopleCount,
        bookingTime: bookingDateTime.toISOString(),
        bookingEndTime: endDateTime.toISOString(),
        devices: form.devices
      });

      setShowSuccess(true);
      setTimeout(() => {
        showToast('Booking created successfully!', 'success');
        onSuccess();
      }, 2000);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to create booking.';
      showToast(message, 'error');
    }
  };

  // ------------------- Price Calculation Helper -------------------
  const getEstimatedPrice = () => {
    if (!form.bookingDate || !form.bookingTime || !form.bookingEndTime) return 0;

    const start = new Date(`${form.bookingDate}T${form.bookingTime}`);
    const end = new Date(`${form.bookingDate}T${form.bookingEndTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (duration <= 0) return 0;

    return calculateSessionPrice(
      duration,
      form.peopleCount,
      form.devices, // Expects Record<string, number[]>
      start, // Use booking start time for pricing logic (Normal vs Fun)
      config
    );
  };

  // PC count validation: price only valid when people count matches PC count
  const numPcSelected = (form.devices.pc as number[])?.length || 0;
  const pcCountValid = numPcSelected === 0 || form.peopleCount === numPcSelected;


  const getFormattedSummary = () => {
    const start = new Date(`${form.bookingDate}T${form.bookingTime}`);
    const end = new Date(`${form.bookingDate}T${form.bookingEndTime}`);

    const dateStr = start.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeConfig: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    const startTimeStr = start.toLocaleTimeString('en-US', timeConfig);
    const endTimeStr = end.toLocaleTimeString('en-US', timeConfig);

    return `${dateStr} | ${startTimeStr} - ${endTimeStr}`;
  };

  return (
    <div className="booking-modal-overlay">
      <motion.div
        className="booking-modal-container"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        style={{ position: 'relative' }}
      >
        {/* Success Overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="success-overlay-absolute"
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(2, 6, 23, 0.85)',
                borderRadius: '24px',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #eab308)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)'
                }}
              >
                <FaCheckCircle style={{ fontSize: '40px', color: '#fff' }} />
              </motion.div>

              <div style={{ textAlign: 'center' }}>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: '2rem',
                    color: '#fff',
                    marginBottom: '8px',
                    fontWeight: 800,
                    fontFamily: "'Outfit', sans-serif"
                  }}
                >
                  Booking Confirmed!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{ color: '#94a3b8', fontSize: '1.1rem' }}
                >
                  Get ready, <span style={{ color: '#eab308', fontWeight: 600 }}>{form.customerName}</span>
                </motion.p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #3b82f6, #eab308)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="booking-modal-header">
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>

          <div className="modal-title-section">
            <div className="modal-icon-wrapper">
              <FaCalendarAlt />
            </div>
            <div className="modal-title-text">
              <h2>New Booking</h2>
              <p>Step {currentStep} of 3 - {
                currentStep === 1 ? 'Customer Details' :
                  currentStep === 2 ? 'Date & Time' :
                    'Select Devices'
              }</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="booking-steps">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`step-indicator ${step === currentStep ? 'active' :
                  step < currentStep ? 'completed' : ''
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="booking-modal-body">
          <AnimatePresence mode="wait">
            {/* STEP 1: Customer Details */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                className="step-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="step-title">Customer Information</h3>
                <p className="step-description">
                  Let's start with the customer's details
                </p>

                <div className="form-field" style={{ position: "relative" }}>
                  <label className="field-label">
                    <FaUser style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Customer Name
                  </label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Enter customer name..."
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    onFocus={() => searchResults.length && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    autoFocus
                  />
                  {showDropdown && (
                    <div className="player-dropdown" style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      marginTop: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 50,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                    }}>
                      {isSearching && <div className="dropdown-item" style={{ padding: '8px 12px', color: '#94a3b8' }}>Searching...</div>}
                      {searchResults.map((c, i) => (
                        <div
                          key={i}
                          className="dropdown-item"
                          onMouseDown={() => selectCustomer(c)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #334155',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ color: '#f8fafc', fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label className="field-label">
                    <FaPhone style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    className="field-input"
                    placeholder="10-digit mobile number..."
                    maxLength={10}
                    value={form.contactNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setForm({ ...form, contactNumber: val });
                    }}
                  />
                  {form.contactNumber.length > 0 && form.contactNumber.length < 10 && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                      Please enter a 10-digit number
                    </span>
                  )}
                </div>

                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label className="field-label">
                    <FaUser style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Number of People
                  </label>
                  <input
                    type="number"
                    className="field-input"
                    placeholder="How many people?"
                    min={1}
                    value={form.peopleCount}
                    onChange={(e) => setForm({ ...form, peopleCount: Math.max(1, Number(e.target.value)) })}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: Date & Time */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                className="step-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="step-title">When do you need it?</h3>
                <p className="step-description">
                  Select the date and time for this booking
                </p>

                <div className="form-field">
                  <label className="field-label">
                    <FaCalendarAlt style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Booking Date
                  </label>
                  <input
                    type="date"
                    className="field-input"
                    value={form.bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                  />
                </div>

                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label className="field-label">
                    <FaClock style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="field-input"
                    value={form.bookingTime}
                    onChange={(e) => setForm({ ...form, bookingTime: e.target.value })}
                  />
                </div>

                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label className="field-label">
                    <FaClock style={{ display: 'inline', marginRight: '0.5rem' }} />
                    End Time
                  </label>
                  <input
                    type="time"
                    className="field-input"
                    value={form.bookingEndTime}
                    onChange={(e) => setForm({ ...form, bookingEndTime: e.target.value })}
                  />
                </div>

                {form.bookingDate && form.bookingTime && form.bookingEndTime && (
                  <div className="time-info-card" style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    color: '#60a5fa'
                  }}>
                    📅 {getFormattedSummary()}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Device Selection (Time-based Availability) */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                className="step-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="step-title">Select Gaming Devices</h3>
                <p className="step-description">
                  {getTotalDevices() > 0
                    ? `${getTotalDevices()} devices selected`
                    : "Choose from available devices for this time slot"}
                </p>

                {loadingAvailability ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a' }}>
                    Loading availability...
                  </div>
                ) : (
                  <div className="devices-dropdown-list">
                    <DeviceDropdown
                      icon={<FaPlaystation />}
                      label="PS5"
                      limit={timeBasedAvailability.limits.ps}
                      value={form.devices.ps}
                      occupied={timeBasedAvailability.occupied.ps || []}
                      onChange={v => updateDevice('ps', v)}
                    />

                    <DeviceDropdown
                      icon={<FaDesktop />}
                      label="PC"
                      limit={timeBasedAvailability.limits.pc}
                      value={form.devices.pc}
                      occupied={timeBasedAvailability.occupied.pc || []}
                      onChange={v => updateDevice('pc', v)}
                    />

                    <DeviceDropdown
                      icon={<FaVrCardboard />}
                      label="VR"
                      limit={timeBasedAvailability.limits.vr}
                      value={form.devices.vr}
                      occupied={timeBasedAvailability.occupied.vr || []}
                      onChange={v => updateDevice('vr', v)}
                    />

                    <DeviceDropdown
                      icon={<GiSteeringWheel />}
                      label="Wheel"
                      limit={timeBasedAvailability.limits.wheel}
                      value={form.devices.wheel}
                      occupied={timeBasedAvailability.occupied.wheel || []}
                      onChange={v => updateDevice('wheel', v)}
                    />

                    <DeviceDropdown
                      icon={<GiCricketBat />}
                      label="MetaBat"
                      limit={timeBasedAvailability.limits.metabat}
                      value={form.devices.metabat}
                      occupied={timeBasedAvailability.occupied.metabat || []}
                      onChange={v => updateDevice('metabat', v)}
                    />
                  </div>
                )}

                {/* Booking Summary */}
                {getTotalDevices() > 0 && (
                  <div className="booking-summary-card">
                    <h4 className="summary-title">Booking Summary</h4>
                    <div className="summary-item">
                      <span className="summary-label">Customer:</span>
                      <span className="summary-value">{form.customerName}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Contact:</span>
                      <span className="summary-value">{form.contactNumber}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">People:</span>
                      <span className="summary-value">{form.peopleCount}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">When:</span>
                      <span className="summary-value">{getFormattedSummary()}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Devices:</span>
                      <span className="summary-value">
                        {getSelectedDevices().map(d => `${d?.label} #${d?.ids?.join(', #')}`).join(', ')}
                      </span>
                    </div>
                    <div className="summary-item" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <span className="summary-label">Estimated Cost:</span>
                      {!pcCountValid ? (
                        <span style={{
                          color: '#f59e0b',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ⚠️ Set People to {numPcSelected} to match {numPcSelected} PC{numPcSelected > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="summary-value" style={{ color: '#ec4899', fontWeight: 'bold' }}>
                          ₹{getEstimatedPrice().toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="booking-modal-footer">
          <button
            className="modal-btn secondary"
            onClick={currentStep === 1 ? onClose : handleBack}
          >
            <FaChevronLeft />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 3 ? (
            <button
              className="modal-btn primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <FaChevronRight />
            </button>
          ) : (
            <button
              className="modal-btn confirm"
              onClick={createBooking}
              disabled={!canProceed()}
            >
              <FaCheck />
              Confirm Booking
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BookingModal;
