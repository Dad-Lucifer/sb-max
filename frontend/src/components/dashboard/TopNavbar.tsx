import { useEffect, useRef, useState } from 'react';
import { FaUserCircle, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import { IoNotificationsOutline } from 'react-icons/io5';
import { MdMenu } from 'react-icons/md';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerThunderSearchModal from './PlayerThunderSearch';
import './TopNavbar.css';

interface Session {
  id: string;
  customer: string;
  startTime: string;
  duration: number;
}

interface NotificationItem {
  id: string;
  customer: string;
  startTime: string;
  duration: number;
}

interface TopNavbarProps {
  onMenuClick?: () => void;
}

const TopNavbar = ({ onMenuClick }: TopNavbarProps) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [openNotif, setOpenNotif] = useState(false);

  // Search State
  const [openSearch, setOpenSearch] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenNotif(false);
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ⌨️ Search Shortcut (Ctrl/Cmd + K) */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpenSearch(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* 🔔 Fetch expiring sessions every 30s */
  useEffect(() => {
    const checkExpiring = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/sessions/active');
        const sessions: Session[] = res.data;

        const now = Date.now();

        const expiring = sessions.filter(s => {
          const start = new Date(s.startTime).getTime();
          const end = start + s.duration * 60 * 60 * 1000;
          const diff = end - now;
          return diff > 0 && diff <= 10 * 60 * 1000; // 10 minutes
        });

        const notifs: NotificationItem[] = expiring.map(session => ({
          id: session.id,
          customer: session.customer,
          startTime: session.startTime,
          duration: session.duration
        }));

        setNotifications(notifs);
      } catch (error) {
        console.error("Failed to fetch sessions", error);
      }
    };

    checkExpiring();
    const interval = setInterval(checkExpiring, 30000);
    return () => clearInterval(interval);
  }, []);


  return (
    <header className="top-navbar">
      <div className="navbar-content">
        {/* Mobile Menu Button */}
        {onMenuClick && (
          <motion.button
            className="mobile-menu-btn"
            onClick={onMenuClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open Menu"
          >
            <MdMenu size={24} />
          </motion.button>
        )}

        <div className="cafe-title">
          SB GAME MAX
        </div>

        {/* 🔍 Addictive Minimal Search Trigger */}
        <div className="search-wrapper">
          <motion.div
            className="global-search-btn"
            onClick={() => setOpenSearch(true)}
            whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(251, 191, 36, 0.15)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="search-placeholder">
              <FaSearch className="search-icon-anim" size={14} />
              <span style={{ marginLeft: 8 }}>Quick Search Player...</span>
            </div>
            <div className="search-shortcut">Ctrl K</div>
          </motion.div>
        </div>

        <div className="user-actions" ref={dropdownRef}>
          {/* 🔔 NOTIFICATIONS */}
          <div style={{ position: "relative" }}>
            <motion.button
              className="icon-btn"
              onClick={() => { setOpenNotif(p => !p); setOpen(false); }}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.9 }}
            >
              <IoNotificationsOutline size={20} />
              <AnimatePresence>
                {notifications.length > 0 && (
                  <motion.span
                    className="notification-dot"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  />
                )}
              </AnimatePresence>
            </motion.button>

            <AnimatePresence>
              {openNotif && (
                <motion.div
                  className="notif-dropdown"
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.9 }}
                  transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                >
                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>💤</span>
                      No upcoming endings
                    </div>
                  ) : (
                    notifications.map(s => (
                      <motion.div
                        key={s.id}
                        className="notif-item"
                        whileHover={{ x: 5 }}
                      >
                        <span style={{ color: '#fbbf24', marginRight: '8px' }}>⏰</span>
                        <div>
                          <strong style={{ color: '#fff' }}>{s.customer}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Ends in 10 mins</div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PROFILE */}
          <div className="profile-wrapper">
            <motion.div
              className="profile-section"
              onClick={() => { setOpen(prev => !prev); setOpenNotif(false); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="profile-info">
                <span className="profile-name">{user?.username || 'Admin'}</span>
                <span className="profile-role">{user?.role?.toLowerCase() === 'employee' ? 'CREWMATE' : (user?.role?.toUpperCase() || 'OWNER')}</span>
              </div>
              <FaUserCircle size={32} color="rgba(255,255,255,0.8)" />
            </motion.div>

            <AnimatePresence>
              {open && (
                <motion.div
                  className="profile-dropdown"
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    className="logout-btn"
                    onClick={logout}
                    whileHover={{ x: 5 }}
                  >
                    <FaSignOutAlt /> Sign Out
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <PlayerThunderSearchModal
        open={openSearch}
        onClose={() => setOpenSearch(false)}
      />
    </header>
  );
};

export default TopNavbar;
