import { Link, useLocation } from 'react-router-dom';
import { MdDashboard, MdAnalytics, MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import { useState, useEffect } from 'react';
import { FaUserShield, FaCoins } from 'react-icons/fa';
import logo from '../../assets/sb.jpg';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed?: boolean;
  toggleCollapsed?: () => void;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  { path: '/employee', icon: MdDashboard, label: 'Dashboard' },
  { path: '/analytic', icon: MdAnalytics, label: 'Analysis' },
  { path: '/owner', icon: FaUserShield, label: 'Owner' },
  { path: '/owner/pricing', icon: FaCoins, label: 'Pricing Config' },
];

const Sidebar = ({ isCollapsed = false, toggleCollapsed, isMobile = false, isMobileOpen = false, onCloseMobile }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close mobile sidebar on Escape key
  useEffect(() => {
    if (!isMobile || !isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isMobileOpen, onCloseMobile]);

  const displayedNavItems = navItems.filter(item => {
    if (item.label === 'Owner' || item.label === 'Pricing Config') {
      return user?.role === 'owner';
    }
    return true;
  });

  const handleNavClick = () => {
    if (isMobile && isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogoClick = () => {
    if (!isMobile && toggleCollapsed) {
      toggleCollapsed();
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onCloseMobile}
            aria-label="Close navigation"
          />
        )}
      </AnimatePresence>
      
      <motion.aside
        className={`sidebar ${!isMobile && isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile-drawer' : ''} ${isMobile && isMobileOpen ? 'mobile-open' : ''}`}
        initial={false}
        animate={
          isMobile
            ? { x: isMobileOpen ? 0 : '-100%' }
            : { x: 0, width: isCollapsed ? 86 : 280 }
        }
        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: isMobile ? 1000 : 50,
          pointerEvents: isMobile && !isMobileOpen ? 'none' : 'auto',
          visibility: isMobile && !isMobileOpen ? 'hidden' : 'visible'
        }}
      >
        {/* Mobile Close Button */}
        {isMobile && isMobileOpen && (
          <button
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close Sidebar"
          >
            <MdClose size={22} />
          </button>
        )}

        {/* Desktop Collapse / Expand Toggle Button */}
        {!isMobile && toggleCollapsed && (
          <button
            className="toggle-btn"
            onClick={toggleCollapsed}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
          </button>
        )}

        {/* Logo Section */}
        <div
          className="logo-section"
          onClick={handleLogoClick}
          style={{ cursor: isMobile ? 'default' : 'pointer' }}
        >
          <motion.div
            className="logo-icon-wrapper"
            whileHover={{ scale: 1.08 }}
            transition={{ stiffness: 300 }}
          >
            <motion.img
              src={logo}
              alt="Logo"
              className="logo"
              initial={{
                width: !isMobile && isCollapsed ? 50 : 60,
                height: !isMobile && isCollapsed ? 50 : 60
              }}
              animate={{
                width: !isMobile && isCollapsed ? 50 : 60,
                height: !isMobile && isCollapsed ? 50 : 60
              }}
              transition={{ duration: 0.35, ease: [0.25, 0, 0.25, 1] }}
              style={{ borderRadius: '10%', objectFit: 'contain' }}
            />
          </motion.div>

          <AnimatePresence>
            {(isMobile || !isCollapsed) && (
              <motion.div
                className="logo-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                SB <br /><span className="highlight">Max</span> 
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          {displayedNavItems.map((item) => {
            const active = isActive(item.path);
            const showTooltip = !isMobile && isCollapsed;
            return (
              <div key={item.path} className="nav-item-container">
                <Link
                  to={item.path}
                  className={`nav-item ${active ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredPath(item.path)}
                  onMouseLeave={() => setHoveredPath(null)}
                  data-tooltip={showTooltip ? item.label : undefined}
                  onClick={handleNavClick}
                >
                  {/* Active Indicator Line */}
                  {active && (
                    <motion.div
                      layoutId="active-indicator"
                      className="active-indicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Hover Background */}
                  <AnimatePresence>
                    {hoveredPath === item.path && !active && (
                      <motion.div
                        className="hover-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '12px',
                          zIndex: -1
                        }}
                      />
                    )}
                  </AnimatePresence>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: (!isMobile && isCollapsed) ? '100%' : 'auto' }}>
                    <item.icon size={22} className={active ? 'glow-icon' : ''} />
                  </div>

                  {(isMobile || !isCollapsed) && (
                    <motion.span
                      className="nav-item-label"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {/* Active Glow Effect */}
                  {active && (
                    <motion.div
                      layoutId="active-glow"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '12px',
                        background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.12) 0%, transparent 100%)',
                        zIndex: -1
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;
