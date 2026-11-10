import { useState, useEffect, useCallback } from 'react';

const SIDEBAR_COLLAPSED_KEY = 'sb_sidebar_collapsed';

/**
 * Reads the persisted collapsed state of the desktop sidebar.
 * Defaults to false (expanded) on very first visit.
 */
export const getStoredSidebarCollapsed = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Persists the sidebar collapsed state to localStorage and broadcasts the change.
 */
export const setStoredSidebarCollapsed = (collapsed: boolean): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
      window.dispatchEvent(new CustomEvent<boolean>('sb:sidebar_toggle', { detail: collapsed }));
    }
  } catch (e) {
    console.error('Failed to save sidebar state to localStorage:', e);
  }
};

/**
 * Hook to manage desktop sidebar collapsed state with cross-navigation and cross-tab persistence.
 */
export const useSidebarCollapsed = () => {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(getStoredSidebarCollapsed);

  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setIsCollapsedState(customEvent.detail);
      } else {
        setIsCollapsedState(getStoredSidebarCollapsed());
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === SIDEBAR_COLLAPSED_KEY && e.newValue !== null) {
        setIsCollapsedState(e.newValue === 'true');
      }
    };

    window.addEventListener('sb:sidebar_toggle', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('sb:sidebar_toggle', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsedState(prev => {
      const next = !prev;
      setStoredSidebarCollapsed(next);
      return next;
    });
  }, []);

  const setIsCollapsed = useCallback((value: boolean) => {
    setIsCollapsedState(value);
    setStoredSidebarCollapsed(value);
  }, []);

  return { isCollapsed, toggleCollapsed, setIsCollapsed };
};
