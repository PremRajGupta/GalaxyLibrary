import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ChevronDown, UserCog } from 'lucide-react';
import AppLogo from '../AppLogo';

export default function TopHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleGoProfile = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
      <div className="min-w-0 flex items-center gap-4">
        <h1 className="text-xl sm:text-2xl text-[#1e293b] truncate">
          <span className="font-normal text-[#64748b]">Welcome, </span>
          <span className="font-bold text-[#1e293b]">{user?.displayName || 'Admin'}</span>
        </h1>
        <span className="inline-flex items-center px-4 py-1.5 bg-[#e9ecef] shadow-inner text-[#475569] text-xs font-bold uppercase tracking-widest rounded-full">
          MANAGER
        </span>
      </div>

      <div className="relative self-start sm:self-auto">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 p-1.5 sm:pr-4 rounded-full bg-[#f4f5f7] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] border border-[#e2e8f0] hover:bg-[#e9ecef] transition-all text-[#1e293b] cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#2C3D5A] overflow-hidden border border-slate-200">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user?.displayName || 'Admin'} 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <AppLogo size="sm" showName={false} />
            )}
          </div>
          <ChevronDown size={16} className={`hidden sm:block text-[#64748b] transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-[5]"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-60 sm:w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 z-10 overflow-hidden divide-y divide-slate-100">
              <div className="px-4 py-3 bg-slate-50/80">
                <p className="text-sm font-bold text-[#1e293b] truncate">{user?.displayName || 'Library Admin'}</p>
                <p className="text-xs text-[#64748b] truncate mt-0.5">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={handleGoProfile}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-100/80 transition-colors text-left cursor-pointer font-medium text-sm"
                >
                  <UserCog size={17} className="text-[#2C3D5A]" />
                  <span>Admin Profile</span>
                </button>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer font-medium text-sm"
                >
                  <LogOut size={17} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
