import { Link } from 'react-router-dom';
import AppLogo from '../AppLogo';
import type { LibraryInfo, NavMenuItem, PageText } from '../../data/landingContent';
import { motion } from 'framer-motion';

type LandingFooterProps = {
  libraryInfo: LibraryInfo;
  pageText: PageText;
  navMenuItems: NavMenuItem[];
  onNavigate: (sectionId: string) => void;
};

export default function LandingFooter({
  libraryInfo,
  pageText,
  navMenuItems,
  onNavigate,
}: LandingFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-50 dark:bg-[#020617] text-slate-600 dark:text-slate-400 overflow-hidden border-t border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400 dark:via-blue-500 to-transparent opacity-30 dark:opacity-50 transition-opacity duration-300" />
      
      {/* Ambient background light */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[800px] h-[300px] bg-blue-100 dark:bg-blue-600/10 blur-[100px] pointer-events-none rounded-full transition-colors duration-300" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="flex flex-col items-start">
            <div className="mb-6 flex items-center gap-3">
              <AppLogo
                size="md"
                showName={false}
              />
              <span className="text-slate-900 dark:text-white font-bold text-xl tracking-wide transition-colors">
                {libraryInfo.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">{libraryInfo.tagline}</p>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6 tracking-wide uppercase text-sm transition-colors">{pageText.footerQuickLinksTitle}</h4>
            <ul className="space-y-3 text-sm">
              {navMenuItems.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.sectionId)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-700 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-colors" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6 tracking-wide uppercase text-sm transition-colors">{pageText.footerGetStartedTitle}</h4>
            <p className="text-sm mb-6 leading-relaxed max-w-xs">{pageText.footerGetStartedText}</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link
                to="/login"
                className="relative group px-8 py-3 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-xl border border-blue-200 dark:border-blue-500/30 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white hover:border-blue-600 dark:hover:border-blue-500 transition-all shadow-sm dark:shadow-[0_0_15px_rgba(37,99,235,0.1)] hover:shadow-md dark:hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center gap-2"
              >
                {pageText.footerLoginButton}
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium transition-colors">
          <p>© {year} {libraryInfo.name}. {pageText.footerCopyright}</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
