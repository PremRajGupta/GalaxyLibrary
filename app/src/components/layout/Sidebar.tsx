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
} from 'lucide-react';

import AppLogo from '../AppLogo';
import S from '../../lib/strings';

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
  const { isOpen, close } = useSidebar();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { requestApi } = await import('../../lib/apiService');
        const data = await requestApi.getRequests();
        const pending = data.filter((r: any) => r.status === 'pending').length;
        setPendingCount(pending);
      } catch (error) {
        console.error('Failed to fetch pending requests count', error);
      }
    };
    fetchCount();

    const handleRequestsUpdated = () => {
      fetchCount();
    };

    window.addEventListener('requestsUpdated', handleRequestsUpdated);
    return () => {
      window.removeEventListener('requestsUpdated', handleRequestsUpdated);
    };
  }, [location.pathname]); // refetch when navigation happens or event triggered

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

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-[100px] flex flex-col items-center z-50 transition-transform duration-300 ease-in-out bg-transparent ${
          isOpen ? 'translate-x-0 bg-white/90 backdrop-blur-md shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="py-6 flex items-center justify-center w-full relative">
          <AppLogo
            size="md"
            showName={false}
          />
          <button
            type="button"
            onClick={close}
            className="lg:hidden absolute right-2 top-6 p-1.5 text-[#64748b] hover:text-[#0f172a] bg-white rounded-full shadow-sm"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-5 flex flex-col items-center overflow-y-auto w-full hide-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <div key={item.path} className="relative group flex justify-center w-full">
                <button
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 ${
                    active
                      ? 'bg-[#2C3D5A] text-white shadow-[0_4px_12px_rgba(44,61,90,0.3)] scale-110'
                      : 'bg-white/60 backdrop-blur-md text-[#64748b] hover:bg-white hover:text-[#2C3D5A] hover:shadow-md'
                  }`}
                  title={item.label}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  {item.path === '/requests' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
                {/* Tooltip for desktop */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-[#0f172a] text-sm font-semibold rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="py-6 flex flex-col items-center w-full">
          <div className="relative group flex justify-center w-full">
            <button
              type="button"
              onClick={logout}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-md text-[#ef4444] hover:bg-[#ef4444] hover:text-white hover:shadow-md transition-all duration-200"
              title="Logout"
            >
              <LogOut size={20} strokeWidth={2} />
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-[#0f172a] text-sm font-semibold rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              Logout
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
