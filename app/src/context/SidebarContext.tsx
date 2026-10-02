import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  isExpanded: boolean;
  toggleExpanded: () => void;
  setIsExpanded: (val: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpandedState] = useState(() => {
    try {
      return localStorage.getItem('admin_sidebar_expanded') === 'true';
    } catch {
      return false;
    }
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const toggleExpanded = useCallback(() => {
    setIsExpandedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_expanded', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const setIsExpanded = useCallback((expanded: boolean) => {
    setIsExpandedState(expanded);
    try {
      localStorage.setItem('admin_sidebar_expanded', String(expanded));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        isExpanded,
        toggleExpanded,
        setIsExpanded,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}
