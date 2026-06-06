import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSlider from '../components/landing/HeroSlider';
import StatsSection from '../components/landing/StatsSection';
import GallerySection from '../components/landing/GallerySection';
import OfferBanner from '../components/landing/OfferBanner';
import FacultySection from '../components/landing/FacultySection';
import ContactSection from '../components/landing/ContactSection';
import LandingFooter from '../components/landing/LandingFooter';
import { SEOMeta } from '../components/SEOMeta';
import { DEFAULT_SITE_CONTENT, type SiteContent } from '../data/landingContent';
import { loadSiteContent, SITE_CONTENT_UPDATED_EVENT } from '../lib/siteContentService';

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [apiOffline, setApiOffline] = useState(false);

  const refreshContent = useCallback(async () => {
    const { content: data, fromApi } = await loadSiteContent();
    setContent(data);
    setApiOffline(!fromApi);
  }, []);

  useEffect(() => {
    refreshContent().finally(() => setLoading(false));
  }, [location, refreshContent]);

  useEffect(() => {
    const onUpdated = () => {
      refreshContent();
    };

    window.addEventListener(SITE_CONTENT_UPDATED_EVENT, onUpdated);
    window.addEventListener('focus', onUpdated);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        onUpdated();
      }
    });

    return () => {
      window.removeEventListener(SITE_CONTENT_UPDATED_EVENT, onUpdated);
      window.removeEventListener('focus', onUpdated);
    };
  }, [refreshContent]);

  useEffect(() => {
    if (!loading && location.state && (location.state as any).scrollToSection) {
      const sectionId = (location.state as any).scrollToSection;
      
      const timer = setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (sectionId === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);

      // Clear the state so it doesn't scroll again on re-render or reload
      navigate('/', { replace: true, state: {} });

      return () => clearTimeout(timer);
    }
  }, [loading, location, navigate]);

  const scrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2b4a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]" />
      </div>
    );
  }

  const { libraryInfo, admissionContact, pageText, navMenuItems, heroSlides, aboutContent, galleryImages, facultyMembers } = content;

  return (
    <div className="min-h-screen bg-white">
      <SEOMeta
        title="Galaxy Library - Top Educational Institute in Tehta | Galaxy Education Hub"
        description="Galaxy Library is the leading educational institute in Tehta providing quality education, comprehensive admission services, transparent fee collection, and advanced student management systems. Join thousands of satisfied students today."
        keywords="galaxy library, galaxy library tehta, galaxy education, educational institute, quality education, admission portal, fee collection, student management, learning center"
        ogUrl="https://galaxyhub.in/"
        canonical="https://galaxyhub.in/"
        schema={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "Galaxy Library",
          "url": "https://galaxyhub.in",
          "logo": "https://galaxyhub.in/logo.png",
          "description": "Galaxy Library is the leading educational institute in Tehta providing quality education, admissions, and comprehensive services.",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Tehta",
            "addressCountry": "IN"
          },
          "telephone": "+91-XXXXXXXXXX",
          "email": "info@galaxyhub.in",
          "sameAs": [
            "https://www.facebook.com/galaxylibrary",
            "https://twitter.com/galaxylibrary",
            "https://www.instagram.com/galaxylibrary"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "availableLanguage": ["en", "hi"]
          },
          "potentialAction": {
            "@type": "EnrollAction"
          }
        }}
      />
      {apiOffline && (
        <div className="bg-[#fef3c7] border-b border-[#f59e0b] text-[#92400e] text-center text-sm px-4 py-2">
          Server offline — showing saved/default content. Start backend on port 5000, then refresh.
        </div>
      )}
      <LandingNavbar
        libraryInfo={libraryInfo}
        pageText={pageText}
        navMenuItems={navMenuItems}
        onNavigate={scrollTo}
        announcement={content.announcement}
      />

      <HeroSlider
        slides={heroSlides}
        pageText={pageText}
        onVisit={() => scrollTo('gallery')}
        onContact={() => scrollTo('contact')}
      />

      <section id="about" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-4">{aboutContent.title}</h2>
            {aboutContent.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="text-[#64748b] leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {aboutContent.highlights.map((item) => (
              <div
                key={`${item.label}-${item.value}`}
                className="text-center p-5 sm:p-6 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]"
              >
                <p className="text-xl sm:text-2xl font-bold text-[#3b82f6] mb-1">{item.value}</p>
                <p className="text-sm text-[#64748b]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StatsSection pageText={pageText} />
      <GallerySection images={galleryImages} pageText={pageText} />
      {content.announcement?.show && content.announcement?.text && (
        <OfferBanner announcement={content.announcement} onNavigate={scrollTo} />
      )}
      <FacultySection members={facultyMembers} pageText={pageText} />
      <ContactSection libraryInfo={libraryInfo} admissionContact={admissionContact} pageText={pageText} />
      <LandingFooter
        libraryInfo={libraryInfo}
        pageText={pageText}
        navMenuItems={navMenuItems}
        onNavigate={scrollTo}
      />
    </div>
  );
}
