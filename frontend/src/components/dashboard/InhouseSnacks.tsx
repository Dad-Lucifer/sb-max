import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaShoppingBag, FaMoneyBillWave, FaQrcode, FaCheck } from 'react-icons/fa';
import SnackSelector from './SnackSelector';
import api from '../../utils/api';
import './InhouseSnacks.css';

interface SnackItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface InhouseSnacksProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = 'cash' | 'online';

const InhouseSnacks: React.FC<InhouseSnacksProps> = ({ isOpen, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [selectedSnacks, setSelectedSnacks] = useState<SnackItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSnackChange = (_summary: string, total: number, items: SnackItem[]) => {
    setSelectedSnacks(items);
    setTotalAmount(total);
  };

  const handleClose = () => {
    if (submitting) return;
    setCustomerName('');
    setSelectedSnacks([]);
    setTotalAmount(0);
    setPaymentMethod('cash');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      alert('Please enter the customer name.');
      return;
    }
    if (selectedSnacks.length === 0) {
      alert('Please select at least one snack.');
      return;
    }
    if (totalAmount <= 0) {
      alert('Total amount must be greater than ₹0.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/sessions/snack-only', {
        customerName: customerName.trim(),
        snacks: selectedSnacks,
        totalAmount,
        paymentMethod,
      });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err: any) {
      console.error('Inhouse snack submission error:', err);
      alert(err?.response?.data?.message || 'Failed to record order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentOptions: { value: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'cash',   label: 'Cash',   icon: <FaMoneyBillWave />, color: '#22c55e' },
    { value: 'online', label: 'Online', icon: <FaQrcode />,        color: '#3b82f6' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="is-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Centering Wrapper */}
          <div className="is-wrapper">
            {/* Modal */}
            <motion.div
              className="is-modal"
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              {/* Success Overlay */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    className="is-success-overlay"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="is-success-icon"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 18 }}
                    >
                      <FaCheck />
                    </motion.div>
                    <h3 className="is-success-title">Order Recorded!</h3>
                    <p className="is-success-sub">Snacks deducted from inventory.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="is-header">
                <div className="is-header-icon">
                  <FaShoppingBag />
                </div>
                <div>
                  <h2 className="is-title">Inhouse Snacks</h2>
                  <p className="is-subtitle">Quick snack sale — no gaming session required</p>
                </div>
                <button className="is-close-btn" onClick={handleClose} disabled={submitting}>
                  <FaTimes />
                </button>
              </div>

              {/* Body */}
              <div className="is-body">

                {/* Customer Name */}
                <div className="is-field-group">
                  <label className="is-label">Customer Name</label>
                  <input
                    className="is-input"
                    type="text"
                    placeholder="Enter customer name…"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
                </div>

                {/* Snack Selector */}
                <div className="is-field-group">
                  <label className="is-label">Select Snacks</label>
                  <div className="is-snack-wrapper">
                    <SnackSelector onChange={handleSnackChange} />
                  </div>
                </div>

                {/* Total Amount Display */}
                <div className="is-total-bar">
                  <span className="is-total-label">Total Amount</span>
                  <span className="is-total-value">₹{totalAmount}</span>
                </div>

                {/* Payment Method */}
                <div className="is-field-group">
                  <label className="is-label">Payment Method</label>
                  <div className="is-payment-options">
                    {paymentOptions.map(opt => (
                      <button
                        key={opt.value}
                        className={`is-pay-btn ${paymentMethod === opt.value ? 'active' : ''}`}
                        style={{
                          '--pay-color': opt.color,
                        } as React.CSSProperties}
                        onClick={() => setPaymentMethod(opt.value)}
                      >
                        <span className="is-pay-icon">{opt.icon}</span>
                        <span className="is-pay-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="is-footer">
                <button className="is-cancel-btn" onClick={handleClose} disabled={submitting}>
                  Cancel
                </button>
                <button
                  className="is-submit-btn"
                  onClick={handleSubmit}
                  disabled={submitting || selectedSnacks.length === 0 || !customerName.trim()}
                >
                  {submitting ? (
                    <span className="is-spinner" />
                  ) : (
                    <>
                      <FaCheck style={{ marginRight: '0.5rem' }} />
                      Confirm Order · ₹{totalAmount}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

};

export default InhouseSnacks;
