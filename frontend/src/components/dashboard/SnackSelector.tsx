import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus } from 'react-icons/fa';
import api from '../../utils/api';
import './SnackSelector.css';

/* ---------------- TYPES ---------------- */

export interface SnackItem {
  id: string; // Using ID for key
  name: string;
  price: number; // This comes from sellingPrice
  category: 'snack' | 'drink';
  emoji: string;
  quantity?: number; // Available stock
}

interface SelectedItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface Props {
  onChange: (
    summary: string,
    totalCost: number,
    items: SelectedItem[]
  ) => void;
}

/* ---------------- COMPONENT ---------------- */

const SnackSelector: React.FC<Props> = ({ onChange }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'snack' | 'drink'>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [inventory, setInventory] = useState<SnackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to categorize (simple heuristic or use DB field)
  const categorize = (name: string): 'snack' | 'drink' => {
    const lower = name.toLowerCase();
    if (lower.includes('drink') || lower.includes('coke') || lower.includes('pepsi') || lower.includes('water') || lower.includes('redbull') || lower.includes('sting') || lower.includes('rio')) return 'drink';
    return 'snack';
  };

  const getEmoji = (name: string, category: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('chips')) return '🍟';
    if (lower.includes('cadbury') || lower.includes('chocolate')) return '🍫';
    if (lower.includes('maggie') || lower.includes('noodles')) return '🍜';
    if (lower.includes('redbull') || lower.includes('energy')) return '⚡';
    if (lower.includes('water')) return '💧';
    if (category === 'drink') return '🥤';
    return '🍪';
  };

  // Fetch Inventory
  useEffect(() => {
    const fetchSnacks = async () => {
      try {
        const res = await api.get('/api/snacks');
        const data = res.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          price: s.sellingPrice,
          category: categorize(s.name),
          emoji: getEmoji(s.name, categorize(s.name)),
          quantity: s.quantity // Available stock
        }));
        setInventory(data);
      } catch (err) {
        console.error("Failed to fetch snacks", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSnacks();
    // Poll for updates (stock changes)
    const interval = setInterval(fetchSnacks, 30000);
    return () => clearInterval(interval);
  }, []);


  /* ---------- Emit change to parent (SAFE) ---------- */
  const emitChange = (nextQuantities: Record<string, number>) => {
    const items: SelectedItem[] = Object.entries(nextQuantities)
      .map(([id, qty]) => {
        const item = inventory.find(i => i.id === id);
        return item ? {
          id: item.id,
          name: item.name,
          price: item.price,
          qty
        } : null;
      })
      .filter(Boolean) as SelectedItem[];

    const summary =
      items.length > 0
        ? items.map(i => `${i.name} x${i.qty}`).join(', ')
        : '';

    const totalCost = items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    onChange(summary, totalCost, items);
  };

  /* ---------- Quantity handler ---------- */
  const updateQuantity = (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    setQuantities(prev => {
      const current = prev[id] || 0;

      // Stock Check
      if (delta > 0 && current + delta > (item.quantity || 0)) {
        alert(`Only ${item.quantity} ${item.name} available!`);
        return prev;
      }

      const next = Math.max(0, current + delta);

      const updated = { ...prev };
      if (next === 0) delete updated[id];
      else updated[id] = next;

      emitChange(updated);
      return updated;
    });
  };

  /* ---------- Derived ---------- */
  const filteredItems = inventory.filter(
    item => activeTab === 'all' || item.category === activeTab
  );

  const totalCost = Object.entries(quantities).reduce((sum, [id, qty]) => {
    const item = inventory.find(i => i.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  /* ---------------- JSX ---------------- */



  return (
    <div className="snack-selector-container">
      {/* Tabs */}
      <div className="selector-tabs">
        {(['all', 'snack', 'drink'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '20px', color: '#aaa', textAlign: 'center' }}>Loading snacks...</div>
      ) : (
        /* Grid */
        <div className="snack-grid">
          <AnimatePresence>
            {filteredItems.map(item => {
              const qty = quantities[item.id] || 0;
              const isOutOfStock = (item.quantity || 0) <= 0;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: isOutOfStock ? 0.5 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`snack-card ${qty > 0 ? 'selected' : ''}`}
                  onClick={() => !isOutOfStock && updateQuantity(item.id, 1)}
                  style={{ pointerEvents: isOutOfStock ? 'none' : 'auto' }}
                >
                  {/* Unique Top Badge for Stock */}
                  {isOutOfStock && (
                    <div style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Sold Out
                    </div>
                  )}
                  {!isOutOfStock && (item.quantity || 0) <= 5 && (
                    <div style={{ position: 'absolute', top: '2px', right: '2px', background: '#f59e0b', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.4)' }}>
                      🔥 Only {item.quantity} left
                    </div>
                  )}

                  <div className="snack-emoji">{item.emoji}</div>

                  <div className="snack-details">
                    <span className="snack-name">{item.name}</span>
                    <span className="snack-price">₹{item.price}</span>
                  </div>

                  {qty > 0 ? (
                    <div
                      className="quantity-control"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        className="qty-btn minus"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <FaMinus size={10} />
                      </button>

                      <span className="qty-val">{qty}</span>

                      <button
                        className="qty-btn plus"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <FaPlus size={10} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ height: '32px' }} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Footer Summary */}
      {totalCost > 0 && (
        <div className="selection-summary">
          <span className="summary-text">Total Snacks:</span>
          <span>₹{totalCost}</span>
        </div>
      )}
    </div>
  );
};

// Export inventory export for backward compat if needed (though dynamic now)
export const SNACK_CATALOG = [
  { id: 'chips', name: 'Chips', price: 15, category: 'snack', emoji: '🥔' },
  { id: 'cadbury', name: 'Cadbury', price: 15, category: 'snack', emoji: '🍫' },
  { id: 'doritos', name: 'Doritos', price: 20, category: 'snack', emoji: '🌮' },
  { id: 'maggie', name: 'Maggie', price: 25, category: 'snack', emoji: '🍜' },
  { id: 'redbull', name: 'Redbull', price: 130, category: 'drink', emoji: '⚡' },
  { id: 'sting', name: 'Sting', price: 20, category: 'drink', emoji: '🥤' },
  { id: 'rio', name: 'Rio', price: 50, category: 'drink', emoji: '🍇' },
  { id: 'dietcoke', name: 'Diet Coke', price: 45, category: 'drink', emoji: '🥤' },
  { id: 'softdrink', name: 'Pepsi/Sprite', price: 25, category: 'drink', emoji: '🥤' },
  { id: 'water', name: 'Water', price: 15, category: 'drink', emoji: '💧' }
];

export default SnackSelector;
