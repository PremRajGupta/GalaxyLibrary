import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import AppLogo from '../AppLogo';
import type { LibraryInfo, NavMenuItem, PageText } from '../../data/landingContent';

type LandingNavbarProps = {
  libraryInfo: LibraryInfo;
  pageText: PageText;
  navMenuItems: NavMenuItem[];
  onNavigate: (sectionId: string) => void;
};

export default function LandingNavbar({
  libraryInfo,
  pageText,
  navMenuItems,
  onNavigate,
}: LandingNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (sectionId: string) => {
    onNavigate(sectionId);
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a2b4a]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center gap-2 text-white"
          >
            <AppLogo
              size="md"
              showName
              name={libraryInfo.name}
              nameClassName="text-white font-semibold text-lg hidden sm:inline"
            />
          </button>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navMenuItems.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNav(link.sectionId)}
                className="text-sm font-medium text-[#cbd5e1] hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/login"
              className="px-5 py-2 bg-[#3b82f6] text-white text-sm font-semibold rounded-lg hover:bg-[#2563eb] transition-colors"
            >
              {pageText.navLogin}
            </Link>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#1a2b4a] border-t border-white/10 px-4 py-4 space-y-2">
          {navMenuItems.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleNav(link.sectionId)}
              className="block w-full text-left px-4 py-3 text-[#cbd5e1] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {link.label}
            </button>
          ))}
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="block w-full text-center px-4 py-3 bg-[#3b82f6] text-white font-semibold rounded-lg hover:bg-[#2563eb] transition-colors"
          >
            {pageText.navLogin}
          </Link>
        </div>
      )}
    </header>
  );
}
