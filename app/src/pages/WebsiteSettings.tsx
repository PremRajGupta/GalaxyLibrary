import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopHeader from '../components/layout/TopHeader';
import { Globe, Save, ExternalLink, Plus, Trash2, Eye } from 'lucide-react';
import ContactDisplay from '../components/shared/ContactDisplay';
import {
  DEFAULT_FACULTY_PHOTO_URL,
  DEFAULT_GALLERY_IMAGE_URL,
  DEFAULT_SITE_CONTENT,
  nextItemId,
  type PageText,
  type SiteContent,
} from '../data/landingContent';
import {
  loadSiteContent,
  saveSiteContent,
  resetSiteContentToDefaults,
} from '../lib/siteContentService';

const inputClass =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';

const cardInputClass =
  'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all';
const cardLabelClass =
  'block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider';

const TABS = [
  { id: 'general', label: 'General & Contact' },
  { id: 'announcement', label: 'Announcements & Offers' },
  { id: 'hero', label: 'Hero Slider' },
  { id: 'about', label: 'About' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'faculty', label: 'Faculty' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function WebsiteSettings() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadSiteContent()
      .then(({ content }) => setContent(content))
      .finally(() => setLoading(false));
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const updateLibraryInfo = (field: keyof SiteContent['libraryInfo'], value: string) => {
    setContent((prev) => ({
      ...prev,
      libraryInfo: { ...prev.libraryInfo, [field]: value },
    }));
  };

  const updateAdmissionContact = (field: keyof SiteContent['admissionContact'], value: string) => {
    setContent((prev) => ({
      ...prev,
      admissionContact: { ...prev.admissionContact, [field]: value },
    }));
  };

  const updatePageText = (field: keyof PageText, value: string) => {
    setContent((prev) => ({
      ...prev,
      pageText: { ...prev.pageText, [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSiteContent(content);
      const { content: saved } = await loadSiteContent();
      setContent(saved);
      showNotification('Saved! Home page will show updated content for all visitors.');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      showNotification(`Save failed: ${message}. Is backend running on port 5000?`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset entire index page to default content?')) return;
    setSaving(true);
    try {
      const defaults = await resetSiteContentToDefaults();
      setContent(defaults);
      showNotification('Reset to default content.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500 font-medium text-base">Loading website editor...</div>;
  }

  return (
    <div>
      <TopHeader />

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-50 px-5 py-3.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-xl flex items-center gap-2"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page-card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Edit Index Page</h2>
              <p className="text-sm text-slate-500 mt-0.5">Full control over home page — navbar, hero, about, gallery, contact, footer</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2.5 border border-red-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Reset Defaults
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ExternalLink size={16} /> Preview Site
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4.5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-sm ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 pb-12">
        {activeTab === 'general' && (
          <>
            <section className="page-card">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100">
                Library / Owner Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Library Name</label>
                  <input className={inputClass} value={content.libraryInfo.name} onChange={(e) => updateLibraryInfo('name', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Tagline</label>
                  <input className={inputClass} value={content.libraryInfo.tagline} onChange={(e) => updateLibraryInfo('tagline', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Left Card Title / Owner Name</label>
                  <input className={inputClass} value={content.libraryInfo.ownerName} onChange={(e) => updateLibraryInfo('ownerName', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Phone (display)</label>
                  <input className={inputClass} value={content.libraryInfo.phone} onChange={(e) => updateLibraryInfo('phone', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp Number (digits only)</label>
                  <input className={inputClass} value={content.libraryInfo.phoneRaw} onChange={(e) => updateLibraryInfo('phoneRaw', e.target.value.replace(/\D/g, ''))} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" className={inputClass} value={content.libraryInfo.email} onChange={(e) => updateLibraryInfo('email', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Address</label>
                  <input className={inputClass} value={content.libraryInfo.address} onChange={(e) => updateLibraryInfo('address', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Google Maps URL (optional)</label>
                  <input className={inputClass} value={content.libraryInfo.mapUrl} onChange={(e) => updateLibraryInfo('mapUrl', e.target.value)} placeholder="Paste Google Maps share link, or leave blank to search address" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>WhatsApp Message</label>
                  <textarea className={`${inputClass} resize-none h-24`} value={content.libraryInfo.whatsappMessage} onChange={(e) => updateLibraryInfo('whatsappMessage', e.target.value)} />
                </div>
              </div>
            </section>
            
            <section className="page-card">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100">
                Registration Fees (Public Admission)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Library Registration Fee (₹)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={content.admissionFees?.library || 5}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      admissionFees: {
                        library: Number(e.target.value) || 0,
                        computerCenter: prev.admissionFees?.computerCenter || 50
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Computer Center Registration Fee (₹)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={content.admissionFees?.computerCenter || 50}
                    onChange={(e) => setContent(prev => ({
                      ...prev,
                      admissionFees: {
                        library: prev.admissionFees?.library || 5,
                        computerCenter: Number(e.target.value) || 0
                      }
                    }))}
                  />
                </div>
              </div>
            </section>

            <section className="page-card">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100">
                Admission & Visit Help Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Right Card Title</label>
                  <input className={inputClass} value={content.admissionContact.title} onChange={(e) => updateAdmissionContact('title', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Phone (display)</label>
                  <input className={inputClass} value={content.admissionContact.phone} onChange={(e) => updateAdmissionContact('phone', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp Number (digits only)</label>
                  <input className={inputClass} value={content.admissionContact.phoneRaw} onChange={(e) => updateAdmissionContact('phoneRaw', e.target.value.replace(/\D/g, ''))} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" className={inputClass} value={content.admissionContact.email} onChange={(e) => updateAdmissionContact('email', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Address</label>
                  <input className={inputClass} value={content.admissionContact.address} onChange={(e) => updateAdmissionContact('address', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Google Maps URL (optional)</label>
                  <input className={inputClass} value={content.admissionContact.mapUrl} onChange={(e) => updateAdmissionContact('mapUrl', e.target.value)} placeholder="Paste Google Maps share link, or leave blank to search address" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>WhatsApp Message</label>
                  <textarea className={`${inputClass} resize-none h-24`} value={content.admissionContact.whatsappMessage} onChange={(e) => updateAdmissionContact('whatsappMessage', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="page-card">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100">
                Contact Section Headings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Section Title</label>
                  <input className={inputClass} value={content.pageText.contactTitle} onChange={(e) => updatePageText('contactTitle', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Section Subtitle</label>
                  <input className={inputClass} value={content.pageText.contactSubtitle} onChange={(e) => updatePageText('contactSubtitle', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Phone Label</label>
                  <input className={inputClass} value={content.pageText.contactPhoneLabel} onChange={(e) => updatePageText('contactPhoneLabel', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Email Label</label>
                  <input className={inputClass} value={content.pageText.contactEmailLabel} onChange={(e) => updatePageText('contactEmailLabel', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Address Label</label>
                  <input className={inputClass} value={content.pageText.contactAddressLabel} onChange={(e) => updatePageText('contactAddressLabel', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp Button Text</label>
                  <input className={inputClass} value={content.pageText.whatsappButton} onChange={(e) => updatePageText('whatsappButton', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Right Card Phone Label</label>
                  <input className={inputClass} value={content.pageText.contactSecondPhoneLabel} onChange={(e) => updatePageText('contactSecondPhoneLabel', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Right Card Email Label</label>
                  <input className={inputClass} value={content.pageText.contactSecondEmailLabel} onChange={(e) => updatePageText('contactSecondEmailLabel', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Right Card Address Label</label>
                  <input className={inputClass} value={content.pageText.contactSecondAddressLabel} onChange={(e) => updatePageText('contactSecondAddressLabel', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="page-card">
              <div className="flex items-center gap-2.5 mb-2">
                <Eye size={22} className="text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Contact Section Preview</h3>
              </div>
              <p className="text-sm text-slate-500 mb-6">This is how your contact section will look on the homepage and visitor screen:</p>
              
              <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-200/80">
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">{content.pageText.contactTitle}</h2>
                    <p className="text-base text-slate-600 font-medium">{content.pageText.contactSubtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ContactDisplay
                      contact={{
                        phone: content.libraryInfo.phone,
                        phoneRaw: content.libraryInfo.phoneRaw,
                        email: content.libraryInfo.email,
                        address: content.libraryInfo.address,
                        mapUrl: content.libraryInfo.mapUrl,
                        whatsappMessage: content.libraryInfo.whatsappMessage,
                      }}
                      title={content.libraryInfo.ownerName}
                      phoneLabel={content.pageText.contactPhoneLabel}
                      emailLabel={content.pageText.contactEmailLabel}
                      addressLabel={content.pageText.contactAddressLabel}
                      whatsappButtonText={content.pageText.whatsappButton}
                    />

                    <ContactDisplay
                      contact={{
                        phone: content.admissionContact.phone,
                        phoneRaw: content.admissionContact.phoneRaw,
                        email: content.admissionContact.email,
                        address: content.admissionContact.address,
                        mapUrl: content.admissionContact.mapUrl,
                        whatsappMessage: content.admissionContact.whatsappMessage,
                      }}
                      title={content.admissionContact.title}
                      phoneLabel={content.pageText.contactSecondPhoneLabel}
                      emailLabel={content.pageText.contactSecondEmailLabel}
                      addressLabel={content.pageText.contactSecondAddressLabel}
                      whatsappButtonText={content.pageText.whatsappButton}
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'announcement' && (
          <section className="page-card space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Announcements & Special Offers</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Control the offer banner that appears on the homepage (below the Gallery section). When enabled, visitors see the offer with a live countdown timer. When the timer expires, the "Upcoming Offer" message is shown instead.
              </p>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  id="showAnnouncement"
                  checked={content.announcement?.show ?? false}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      announcement: {
                        title: prev.announcement?.title ?? '',
                        text: prev.announcement?.text ?? '',
                        link: prev.announcement?.link ?? '',
                        endDate: prev.announcement?.endDate ?? '',
                        upcomingText: prev.announcement?.upcomingText ?? '',
                        show: e.target.checked,
                      },
                    }))
                  }
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div>
                <label htmlFor="showAnnouncement" className="text-base font-bold text-slate-900 cursor-pointer block">
                  Show Offer Banner on Homepage
                </label>
                <p className="text-sm text-slate-500 mt-0.5">Visitors will see this banner below the Gallery section.</p>
              </div>
            </div>

            {/* Offer Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title / Badge */}
              <div>
                <label className={labelClass}>Offer Badge / Title</label>
                <input
                  type="text"
                  className={inputClass}
                  value={content.announcement?.title ?? ''}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      announcement: {
                        title: e.target.value,
                        text: prev.announcement?.text ?? '',
                        link: prev.announcement?.link ?? '',
                        endDate: prev.announcement?.endDate ?? '',
                        upcomingText: prev.announcement?.upcomingText ?? '',
                        show: prev.announcement?.show ?? false,
                      },
                    }))
                  }
                  placeholder="e.g. Special Discount Offer"
                />
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Shown as the badge/tag at the top of the offer card.</p>
              </div>

              {/* End Date */}
              <div>
                <label className={labelClass}>Offer End Date & Time</label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={
                    content.announcement?.endDate
                      ? new Date(
                          new Date(content.announcement.endDate).getTime() -
                            new Date().getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      announcement: {
                        title: prev.announcement?.title ?? '',
                        text: prev.announcement?.text ?? '',
                        link: prev.announcement?.link ?? '',
                        endDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                        upcomingText: prev.announcement?.upcomingText ?? '',
                        show: prev.announcement?.show ?? false,
                      },
                    }))
                  }
                />
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Countdown timer will count down to this date & time.</p>
              </div>

              {/* Offer Text */}
              <div className="md:col-span-2">
                <label className={labelClass}>Offer Description</label>
                <textarea
                  rows={2}
                  className={`${inputClass} resize-none`}
                  value={content.announcement?.text ?? ''}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      announcement: {
                        title: prev.announcement?.title ?? '',
                        text: e.target.value,
                        link: prev.announcement?.link ?? '',
                        endDate: prev.announcement?.endDate ?? '',
                        upcomingText: prev.announcement?.upcomingText ?? '',
                        show: prev.announcement?.show ?? false,
                      },
                    }))
                  }
                  placeholder="e.g. Join today and get 10% off on your first month admission fee!"
                />
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Main message shown on the offer banner.</p>
              </div>

              {/* Link */}
              <div>
                <label className={labelClass}>CTA Button Link (Optional)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={content.announcement?.link ?? ''}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      announcement: {
                        title: prev.announcement?.title ?? '',
                        text: prev.announcement?.text ?? '',
                        link: e.target.value,
                        endDate: prev.announcement?.endDate ?? '',
                        upcomingText: prev.announcement?.upcomingText ?? '',
                        show: prev.announcement?.show ?? false,
                      },
                    }))
                  }
                  placeholder="e.g. #contact or /services"
                />
                <p className="text-xs sm:text-sm text-slate-500 mt-1">#contact scrolls to Contact section. Leave blank to hide button.</p>
              </div>

              {/* Upcoming Text */}
              <div>
                <label className={labelClass}>Upcoming Offer Message</label>
                <input
                  type="text"
                  className={inputClass}
                  value={content.announcement?.upcomingText ?? ''}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      announcement: {
                        title: prev.announcement?.title ?? '',
                        text: prev.announcement?.text ?? '',
                        link: prev.announcement?.link ?? '',
                        endDate: prev.announcement?.endDate ?? '',
                        upcomingText: e.target.value,
                        show: prev.announcement?.show ?? false,
                      },
                    }))
                  }
                  placeholder="e.g. Stay tuned! An exciting new offer is coming soon."
                />
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Shown when the countdown timer reaches zero (offer expired).</p>
              </div>
            </div>

            {/* Live Preview */}
            {content.announcement?.show && (
              <div className="mt-4 pt-6 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-800 mb-3">📋 Live Preview (Navbar Banner)</p>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-5 text-center text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm">
                  <span>📢 {content.announcement?.text || 'Your announcement text will appear here'}</span>
                  {content.announcement?.link && (
                    <span className="underline font-bold ml-1 cursor-pointer hover:text-blue-100">Learn More →</span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-800 mt-6 mb-3">📦 Offer Card Preview (Homepage - below Gallery)</p>
                <div className="rounded-2xl p-6 border border-indigo-500/30 bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-md">
                  <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3">
                    🎁 {content.announcement?.title || 'Limited Time Offer'}
                  </div>
                  <h4 className="text-xl font-extrabold mb-1">Exclusive <span className="text-indigo-300">Special Offer</span></h4>
                  <p className="text-slate-300 text-sm sm:text-base mb-4">{content.announcement?.text || 'Offer description...'}</p>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300 mb-4">
                    <span className="font-semibold">⏱ Offer ends in:</span>
                    {['DD', 'HH', 'MM', 'SS'].map((u, i) => (
                      <span key={u} className="flex flex-col items-center gap-1">
                        <span className="bg-slate-950/80 border border-indigo-500/30 rounded-lg px-2.5 py-1 text-indigo-300 font-bold text-sm">{u}</span>
                        <span className="text-xs text-slate-400 uppercase font-semibold">{['Days','Hrs','Min','Sec'][i]}</span>
                      </span>
                    ))}
                  </div>
                  {content.announcement?.link && (
                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs sm:text-sm font-bold px-4.5 py-2.5 rounded-xl shadow">
                      ✨ Grab This Offer →
                    </div>
                  )}
                </div>
                {content.announcement?.upcomingText && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                    <span className="font-bold text-slate-800">⏳ When expired, visitors see:</span> "{content.announcement.upcomingText}"
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'hero' && (
          <section className="page-card">
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Use image URLs from Google Images / Unsplash (right-click image → copy image address). Paste the full https:// link.
            </p>
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Hero Slider</h3>
              <button
                type="button"
                onClick={() => setContent((prev) => ({
                  ...prev,
                  heroSlides: [...prev.heroSlides, { id: nextItemId(prev.heroSlides), image: '', title: 'New Slide', subtitle: '' }],
                }))}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
              >
                <Plus size={16} /> Add Slide
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {content.heroSlides.map((slide, index) => (
                <div key={slide.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-sm font-bold text-blue-600">Slide {index + 1}</p>
                      {content.heroSlides.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setContent((prev) => ({ ...prev, heroSlides: prev.heroSlides.filter((s) => s.id !== slide.id) }))}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Slide"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="mb-3 rounded-xl border border-slate-200 bg-slate-200 overflow-hidden h-32 flex items-center justify-center">
                      {slide.image?.trim() ? (
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs text-slate-500 p-2 text-center font-medium">No image preview</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={cardLabelClass}>Heading</label>
                        <input
                          className={cardInputClass}
                          value={slide.title}
                          onChange={(e) => setContent((prev) => { const heroSlides = [...prev.heroSlides]; heroSlides[index] = { ...slide, title: e.target.value }; return { ...prev, heroSlides }; })}
                        />
                      </div>
                      <div>
                        <label className={cardLabelClass}>Subtitle</label>
                        <textarea
                          className={`${cardInputClass} resize-none`}
                          rows={2}
                          value={slide.subtitle}
                          onChange={(e) => setContent((prev) => { const heroSlides = [...prev.heroSlides]; heroSlides[index] = { ...slide, subtitle: e.target.value }; return { ...prev, heroSlides }; })}
                        />
                      </div>
                      <div>
                        <label className={cardLabelClass}>Image URL</label>
                        <input
                          className={cardInputClass}
                          value={slide.image}
                          onChange={(e) => setContent((prev) => { const heroSlides = [...prev.heroSlides]; heroSlides[index] = { ...slide, image: e.target.value }; return { ...prev, heroSlides }; })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'about' && (
          <section className="page-card">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100">About Section</h3>
            <div className="space-y-5 mb-8">
              <div>
                <label className={labelClass}>Title</label>
                <input className={inputClass} value={content.aboutContent.title} onChange={(e) => setContent((prev) => ({ ...prev, aboutContent: { ...prev.aboutContent, title: e.target.value } }))} />
              </div>
              <div>
                <label className={labelClass}>Description (blank line = new paragraph)</label>
                <textarea className={`${inputClass} min-h-[160px]`} value={content.aboutContent.paragraphs.join('\n\n')} onChange={(e) => setContent((prev) => ({ ...prev, aboutContent: { ...prev.aboutContent, paragraphs: e.target.value.split(/\n\n+/).map((p) => p.trim()).filter(Boolean) } }))} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold text-slate-800">Highlights / Stats</p>
              <button
                type="button"
                onClick={() => setContent((prev) => ({ ...prev, aboutContent: { ...prev.aboutContent, highlights: [...prev.aboutContent.highlights, { label: 'Label', value: 'Value' }] } }))}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
              >
                <Plus size={16} /> Add Highlight
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {content.aboutContent.highlights.map((item, index) => (
                <div key={`${item.label}-${index}`} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 relative shadow-sm">
                  {content.aboutContent.highlights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setContent((prev) => ({ ...prev, aboutContent: { ...prev.aboutContent, highlights: prev.aboutContent.highlights.filter((_, i) => i !== index) } }))}
                      className="absolute top-3 right-3 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete highlight"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div className="space-y-3">
                    <div>
                      <label className={cardLabelClass}>Value (e.g. 500+)</label>
                      <input className={cardInputClass} value={item.value} onChange={(e) => setContent((prev) => { const highlights = [...prev.aboutContent.highlights]; highlights[index] = { ...item, value: e.target.value }; return { ...prev, aboutContent: { ...prev.aboutContent, highlights } }; })} placeholder="Value" />
                    </div>
                    <div>
                      <label className={cardLabelClass}>Label (e.g. Students)</label>
                      <input className={cardInputClass} value={item.label} onChange={(e) => setContent((prev) => { const highlights = [...prev.aboutContent.highlights]; highlights[index] = { ...item, label: e.target.value }; return { ...prev, aboutContent: { ...prev.aboutContent, highlights } }; })} placeholder="Label" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'gallery' && (
          <section className="page-card">
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Add your library photos using a direct image URL (https://). Only images with a valid URL appear on the home page. Use Unsplash or uploaded image links.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className={labelClass}>Gallery Title</label>
                <input className={inputClass} value={content.pageText.galleryTitle} onChange={(e) => updatePageText('galleryTitle', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Gallery Subtitle</label>
                <input className={inputClass} value={content.pageText.gallerySubtitle} onChange={(e) => updatePageText('gallerySubtitle', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Gallery Images</h3>
              <button
                type="button"
                onClick={() =>
                  setContent((prev) => ({
                    ...prev,
                    galleryImages: [
                      ...prev.galleryImages,
                      {
                        id: nextItemId(prev.galleryImages),
                        src: DEFAULT_GALLERY_IMAGE_URL,
                        title: 'New Photo',
                        alt: 'New Photo',
                      },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
              >
                <Plus size={16} /> Add Image
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {content.galleryImages.map((image, index) => (
                <div key={image.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-sm font-bold text-blue-600">Image {index + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            galleryImages: prev.galleryImages.filter((img) => img.id !== image.id),
                          }))
                        }
                        disabled={content.galleryImages.length <= 1}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40 transition-colors"
                        title="Delete image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mb-3 rounded-xl border border-slate-200 bg-slate-200 overflow-hidden h-32 flex items-center justify-center">
                      {image.src?.trim() ? (
                        <img
                          src={image.src}
                          alt={image.alt || image.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs text-slate-500 p-2 text-center font-medium">No image preview</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={cardLabelClass}>Image URL</label>
                        <input
                          className={cardInputClass}
                          value={image.src}
                          onChange={(e) => {
                            const src = e.target.value;
                            setContent((prev) => {
                              const galleryImages = [...prev.galleryImages];
                              galleryImages[index] = { ...image, src };
                              return { ...prev, galleryImages };
                            });
                          }}
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      <div>
                        <label className={cardLabelClass}>Caption / Title</label>
                        <input
                          className={cardInputClass}
                          value={image.title}
                          onChange={(e) => {
                            const title = e.target.value;
                            setContent((prev) => {
                              const galleryImages = [...prev.galleryImages];
                              galleryImages[index] = {
                                ...image,
                                title,
                                alt: image.alt || title,
                              };
                              return { ...prev, galleryImages };
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className={cardLabelClass}>Alt text</label>
                        <input
                          className={cardInputClass}
                          value={image.alt}
                          onChange={(e) => {
                            setContent((prev) => {
                              const galleryImages = [...prev.galleryImages];
                              galleryImages[index] = { ...image, alt: e.target.value };
                              return { ...prev, galleryImages };
                            });
                          }}
                          placeholder="Describe the image"
                        />
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline block w-full text-left pt-1"
                        onClick={() =>
                          setContent((prev) => {
                            const galleryImages = [...prev.galleryImages];
                            galleryImages[index] = { ...image, alt: image.title };
                            return { ...prev, galleryImages };
                          })
                        }
                      >
                        Copy title → alt text
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'faculty' && (
          <section className="page-card">
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Add faculty or library team profiles using direct photo URLs. These profiles appear below Our Library Gallery on the home page.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className={labelClass}>Section Title</label>
                <input
                  className={inputClass}
                  value={content.pageText.facultyTitle}
                  onChange={(e) => updatePageText('facultyTitle', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Section Subtitle</label>
                <input
                  className={inputClass}
                  value={content.pageText.facultySubtitle}
                  onChange={(e) => updatePageText('facultySubtitle', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Faculty Profiles</h3>
              {content.facultyMembers.length < 4 && (
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      facultyMembers: [
                        ...prev.facultyMembers,
                        {
                          id: nextItemId(prev.facultyMembers),
                          photo: DEFAULT_FACULTY_PHOTO_URL,
                          name: 'New Faculty',
                          role: 'Role / Designation',
                          detail: 'Short detail about this faculty member.',
                        },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                >
                  <Plus size={16} /> Add Profile
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {content.facultyMembers.map((member, index) => (
                <div key={member.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-sm font-bold text-blue-600">Profile {index + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            facultyMembers: prev.facultyMembers.filter((item) => item.id !== member.id),
                          }))
                        }
                        disabled={content.facultyMembers.length <= 1}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40 transition-colors"
                        title="Delete profile"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mb-3 rounded-xl border border-slate-200 bg-slate-200 overflow-hidden h-32 flex items-center justify-center">
                      {member.photo?.trim() ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs text-slate-500 p-2 text-center font-medium">No photo preview</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={cardLabelClass}>Photo URL</label>
                        <input
                          className={cardInputClass}
                          value={member.photo}
                          onChange={(e) => {
                            const photo = e.target.value;
                            setContent((prev) => {
                              const facultyMembers = [...prev.facultyMembers];
                              facultyMembers[index] = { ...member, photo };
                              return { ...prev, facultyMembers };
                            });
                          }}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className={cardLabelClass}>Name</label>
                        <input
                          className={cardInputClass}
                          value={member.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setContent((prev) => {
                              const facultyMembers = [...prev.facultyMembers];
                              facultyMembers[index] = { ...member, name };
                              return { ...prev, facultyMembers };
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className={cardLabelClass}>Role / Designation</label>
                        <input
                          className={cardInputClass}
                          value={member.role}
                          onChange={(e) => {
                            const role = e.target.value;
                            setContent((prev) => {
                              const facultyMembers = [...prev.facultyMembers];
                              facultyMembers[index] = { ...member, role };
                              return { ...prev, facultyMembers };
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className={cardLabelClass}>Detail</label>
                        <textarea
                          className={`${cardInputClass} resize-none`}
                          rows={2}
                          value={member.detail}
                          onChange={(e) => {
                            const detail = e.target.value;
                            setContent((prev) => {
                              const facultyMembers = [...prev.facultyMembers];
                              facultyMembers[index] = { ...member, detail };
                              return { ...prev, facultyMembers };
                            });
                          }}
                          placeholder="Short detail..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all text-base disabled:opacity-50"
          >
            <Save size={20} /> {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
