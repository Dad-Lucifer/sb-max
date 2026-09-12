import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import TopNavbar from '../components/dashboard/TopNavbar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

const DashboardLayout = ({ children, className = '' }: DashboardLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent background scrolling on mobile when drawer is open
  useEffect(() => {
    if (isMobile && isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileSidebarOpen]);

  // On desktop, offset by sidebar width (280px or 86px). On mobile, sidebar is a drawer overlay (offset is 0).
  const sidebarWidth = isMobile ? 0 : (isCollapsed ? 86 : 280);

  return (
    <div className={`layout-container ${className}`}>
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapsed={() => setIsCollapsed(!isCollapsed)}
        isMobile={isMobile}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main
        className="main-content"
        style={{ 
          marginLeft: isMobile ? 0 : sidebarWidth, 
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
          transition: 'margin-left 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
      >
        <TopNavbar 
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
