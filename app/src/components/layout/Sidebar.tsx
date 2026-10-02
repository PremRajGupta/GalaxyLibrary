import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  LayoutDashboard,
  UserPlus,
  Wallet,
  Armchair,
  MessageSquare,
  Users,
  FileText,
  Download,
  LogOut,
  X,
  Globe,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import AppLogo from '../AppLogo';
import S from '../../lib/strings';
import { requestApi } from '../../lib/apiService';

const menuItems = [
  { path: '/dashboard', label: S.sidebar.dashboard, icon: LayoutDashboard },
  { path: '/admission', label: S.sidebar.admission, icon: UserPlus },
  { path: '/fees', label: S.sidebar.fees, icon: Wallet },
  { path: '/pdf-generator', label: S.sidebar.receipts, icon: Download },
  { path: '/seat-map', label: S.sidebar.seatMap, icon: Armchair },
  { path: '/requests', label: S.sidebar.requests, icon: MessageSquare },
  { path: '/students', label: S.sidebar.students, icon: Users },
  { path: '/reports', label: S.sidebar.reports, icon: FileText },
  { path: '/computer-center-settings', label: 'Computer Center', icon: Monitor },
  { path: '/website-settings', label: S.sidebar.website, icon: Globe },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isOpen, close, isExpanded, toggleExpanded } = useSidebar();
  const [pendingCount, setPendingCount] = useState<number>(() => {
    const cached = requestApi.getCachedRequests();
    return cached ? cached.filter((r: any) => r.status === 'pending').length : 0;
  });

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const data = await requestApi.getRequests();
        if (isMounted && Array.isArray(data)) {
          const pending = data.filter((r: any) => r.status === 'pending').length;
          setPendingCount(pending);
        }
      } catch (error) {
        console.error('Failed to fetch pending requests count', error);
      }
    };

    fetchCount();

    const handleRequestsUpdated = () => {
      fetchCount();
    };

    // Poll every 45 seconds to keep badge fresh without burdening navigation
    const interval = setInterval(fetchCount, 45000);
    window.addEventListener('requestsUpdated', handleRequestsUpdated);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('requestsUpdated', handleRequestsUpdated);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    close();
  };

  const showLabelsOnDesktop = isExpanded;
  const isFull = isOpen || showLabelsOnDesktop;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={close}
        />
      )}

      {/* Main Sidebar - Strictly non-scrollable horizontally (No left-right sliding) */}
      <aside
        className={`fixed left-0 top-0 h-[100dvh] flex flex-col z-50 overflow-x-hidden overscroll-none select-none transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-[260px] translate-x-0 bg-white/95 backdrop-blur-xl shadow-2xl items-stretch border-r border-slate-200/80'
            : showLabelsOnDesktop
            ? 'w-[260px] -translate-x-full lg:translate-x-0 lg:w-[260px] items-stretch bg-white/95 backdrop-blur-xl shadow-xl border-r border-slate-200/80'
            : 'w-[95px] -translate-x-full lg:translate-x-0 items-center bg-white/60 backdrop-blur-md border-r border-slate-200/60'
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        {/* Header / Logo section with Toggle Option */}
        <div className="w-full flex-shrink-0">
          {isFull ? (
            /* Expanded view header */
            <div className="py-4 px-3.5 flex items-center justify-between border-b border-slate-100/80">
              <button
                type="button"
                onClick={toggleExpanded}
                className="flex items-center gap-2.5 min-w-0 text-left group hover:opacity-85 transition-opacity cursor-pointer"
                title="Galaxy Library (Click to Collapse)"
              >
                <AppLogo size="md" showName={false} />
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 text-sm tracking-tight truncate leading-tight">
                    {S.appName}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Admin Panel
                  </p>
                </div>
              </button>

              {/* Desktop collapse button with clear label & icon */}
              <button
                type="button"
                onClick={toggleExpanded}
                className="hidden lg:flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#2C3D5A] hover:text-white text-slate-600 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 border border-slate-200/60 shadow-xs"
                title="Sidebar chhota karein (Collapse)"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={13} strokeWidth={3} />
                <span className="text-[10px] font-bold">Collapse</span>
              </button>

              {/* Mobile close button */}
              <button
                type="button"
                onClick={close}
                className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            /* Collapsed view header: Logo + Prominent Expand Button */
            <div className="py-3.5 px-2 flex flex-col items-center justify-center w-full border-b border-slate-200/60">
              <button
                type="button"
                onClick={toggleExpanded}
                className="flex items-center justify-center p-1.5 rounded-2xl hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
                title="Galaxy Library - Click to Expand"
                aria-label="Click to expand sidebar"
              >
                <AppLogo size="md" showName={false} />
              </button>

              {/* Visually clear Expand button badge */}
              <button
                type="button"
                onClick={toggleExpanded}
                className="mt-2 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-[#2C3D5A] text-[#2C3D5A] hover:text-white border border-blue-200/70 shadow-xs transition-all duration-200 cursor-pointer group active:scale-95"
                title="Click karein naam ke saath dekhne ke liye (Expand)"
                aria-label="Expand sidebar with names"
              >
                <span className="text-[10px] font-extrabold tracking-tight select-none">Expand</span>
                <ChevronRight size={11} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav
          className={`flex-1 py-3 flex flex-col overflow-y-auto overflow-x-hidden w-full hide-scrollbar overscroll-none ${
            isFull ? 'px-3 space-y-1.5 items-stretch' : 'px-2 space-y-3 items-center'
          }`}
          style={{ touchAction: 'pan-y' }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <div key={item.path} className="flex justify-center w-full flex-shrink-0">
                {isFull ? (
                  // Expanded Row: Icon + Full Name
                  <button
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full h-11 px-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 text-left cursor-pointer ${
                      active
                        ? 'bg-[#2C3D5A] text-white shadow-sm font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#2C3D5A] font-medium'
                    }`}
                    title={item.label}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
                    <span className="text-sm truncate leading-none">{item.label}</span>
                    {item.path === '/requests' && pendingCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ) : (
                  // Collapsed Row: Only Logo / Icon (No horizontal overflow)
                  <button
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 relative cursor-pointer flex-shrink-0 ${
                      active
                        ? 'bg-[#2C3D5A] text-white shadow-[0_4px_12px_rgba(44,61,90,0.3)] scale-105'
                        : 'bg-white/70 backdrop-blur-md text-[#64748b] hover:bg-white hover:text-[#2C3D5A] hover:shadow-md'
                    }`}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                    {item.path === '/requests' && pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer / Logout Button */}
        <div
          className={`py-4 w-full flex-shrink-0 border-t border-slate-100/80 ${
            isFull ? 'px-3' : 'px-2 flex flex-col items-center'
          }`}
        >
          <div className="flex justify-center w-full">
            {isFull ? (
              <button
                type="button"
                onClick={logout}
                className="w-full h-11 px-3.5 rounded-xl flex items-center gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold transition-all duration-200 text-left cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={20} strokeWidth={2} className="flex-shrink-0" />
                <span className="text-sm truncate">Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={logout}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-md text-[#ef4444] hover:bg-[#ef4444] hover:text-white hover:shadow-md transition-all duration-200 cursor-pointer flex-shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={22} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
