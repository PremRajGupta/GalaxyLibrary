import { Link } from 'react-router-dom';
import AppLogo from '../AppLogo';
import type { LibraryInfo, NavMenuItem, PageText } from '../../data/landingContent';

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
    <footer className="bg-[#1a2b4a] text-[#94a3b8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <AppLogo
                size="md"
                showName
                name={libraryInfo.name}
                nameClassName="text-white font-semibold text-lg"
              />
            </div>
            <p className="text-sm leading-relaxed">{libraryInfo.tagline}</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{pageText.footerQuickLinksTitle}</h4>
            <ul className="space-y-2 text-sm">
              {navMenuItems.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.sectionId)}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{pageText.footerGetStartedTitle}</h4>
            <p className="text-sm mb-4">{pageText.footerGetStartedText}</p>
            <Link
              to="/login"
              className="inline-block px-5 py-2 bg-[#3b82f6] text-white text-sm font-semibold rounded-lg hover:bg-[#2563eb] transition-colors"
            >
              {pageText.footerLoginButton}
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-sm text-center">
          © {year} {libraryInfo.name}. {pageText.footerCopyright}
        </div>
      </div>
    </footer>
  );
}
