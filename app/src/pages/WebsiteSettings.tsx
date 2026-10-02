import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopHeader from '../components/layout/TopHeader';
import { 
  Globe, 
  Save, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Eye, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Sparkles, 
  User, 
  IndianRupee, 
  Layers, 
  FileText, 
  Camera, 
  Users, 
  Megaphone, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
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
  'w-full pl-11 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400 shadow-xs';
const textareaWithIconClass =
  'w-full pl-11 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400 shadow-xs resize-none';
const rawInputClass =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400 shadow-xs';
const labelClass = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5';

const cardInputClass =
  'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all';
const cardLabelClass =
  'block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider';

const TABS = [
  { id: 'general', label: 'General & Contact', icon: Building2 },
  { id: 'announcement', label: 'Announcements & Offers', icon: Megaphone },
  { id: 'hero', label: 'Hero Slider', icon: Layers },
  { id: 'about', label: 'About Section', icon: FileText },
  { id: 'gallery', label: 'Photo Gallery', icon: Camera },
  { id: 'faculty', label: 'Faculty Team', icon: Users },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function WebsiteSettings() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSiteContent()
      .then(({ content }) => setContent(content))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3800);
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
      showToast('success', 'Changes saved successfully! Home page updated for all visitors.');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      showToast('error', `Save failed: ${message}`);
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
      showToast('success', 'Reset to default content.');
    } catch (err: any) {
      showToast('error', `Reset failed: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-500 font-medium">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Loading website editor...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16">
      <TopHeader />

      {/* Floating Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white font-medium text-sm backdrop-blur-md border ${
              notification.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-100 shadow-slate-950/20'
                : 'bg-rose-900/95 border-rose-500/50 text-rose-100 shadow-rose-950/20'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
            )}
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Header Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 relative overflow-hidden">
        {/* Subtle decorative top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2C3D5A] via-blue-600 to-indigo-600" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100/80 shadow-xs flex-shrink-0">
              <Globe size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Website Settings
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  Live Homepage Editor
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Customize content for the public landing page — contact details, hero slider, gallery, and announcements.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Reset Defaults
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Preview Live Site</span>
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save size={16} />
              <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Control Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/80 mb-6 overflow-x-auto max-w-full">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="space-y-6">
        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Card 1: Library & Owner Contact Details */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Library & Owner Contact Details</h3>
                    <p className="text-xs text-slate-500">Contact information displayed on the home page left card and navigation</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Library Name</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      className={inputClass}
                      value={content.libraryInfo.name}
                      onChange={(e) => updateLibraryInfo('name', e.target.value)}
                      placeholder="e.g. Galaxy Library"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Tagline / Catchphrase</label>
                  <div className="relative">
                    <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      className={inputClass}
                      value={content.libraryInfo.tagline}
                      onChange={(e) => updateLibraryInfo('tagline', e.target.value)}
                      placeholder="e.g. Your Space to Focus, Learn & Grow"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Left Card Title / Owner Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      className={inputClass}
                      value={content.libraryInfo.ownerName}
                      onChange={(e) => updateLibraryInfo('ownerName', e.target.value)}
                      placeholder="e.g. Galaxy Library Management"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Phone (display format)</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      className={inputClass}
                      value={content.libraryInfo.phone}
                      onChange={(e) => updateLibraryInfo('phone', e.target.value)}
                      placeholder="+91 74882 52019"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>WhatsApp Number (digits only)</label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      className={inputClass}
                      value={content.libraryInfo.phoneRaw}
                      onChange={(e) => updateLibraryInfo('phoneRaw', e.target.value.replace(/\D/g, ''))}
                      placeholder="917488252019"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Official Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      className={inputClass}
                      value={content.libraryInfo.email}
                      onChange={(e) => updateLibraryInfo('email', e.target.value)}
                      placeholder="contact@galaxylibrary.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Physical Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <textarea
                      rows={2}
                      className={textareaWithIconClass}
                      value={content.libraryInfo.address}
                      onChange={(e) => updateLibraryInfo('address', e.target.value)}
                      placeholder="e.g. DhiraBigha, Sugaon Road, Tehta, Jehanabad, Bihar 804427"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Google Maps Share Link (Optional)</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      className={inputClass}
                      value={content.libraryInfo.mapUrl}
                      onChange={(e) => updateLibraryInfo('mapUrl', e.target.value)}
                      placeholder="Paste Google Maps share link, or leave blank to search address"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>WhatsApp Click-to-Chat Message</label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <textarea
                      rows={2}
                      className={textareaWithIconClass}
                      value={content.libraryInfo.whatsappMessage}
                      onChange={(e) => updateLibraryInfo('whatsappMessage', e.target.value)}
                      placeholder="Hello! I would like to know more about Galaxy Library."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Registration Fees (Public Admission) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60">
                    <IndianRupee size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Registration Fees (Public Admission)</h3>
                    <p className="text-xs text-slate-500">One-time registration charges applied on the public student admission portal</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Library Registration Fee (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                    <input
                      type="number"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all shadow-xs"
                      value={content.admissionFees?.library ?? 5}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          admissionFees: {
                            library: Number(e.target.value) || 0,
                            computerCenter: prev.admissionFees?.computerCenter ?? 50,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Computer Center Registration Fee (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                    <input
                      type="number"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all shadow-xs"
                      value={content.admissionFees?.computerCenter ?? 50}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          admissionFees: {
                            library: prev.admissionFees?.library ?? 5,
                            computerCenter: Number(e.target.value) || 0,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Admission & Visit Help Contact (Right Card) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/60">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Admission & Visit Help Contact</h3>
                    <p className="text-xs text-slate-500">Contact information displayed on the home page right card</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Right Card Title</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      className={inputClass}
                      value={content.admissionContact.title}
                      onChange={(e) => updateAdmissionContact('title', e.target.value)}
                      placeholder="Admission & Visit Help"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Phone (display format)</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      className={inputClass}
                      value={content.admissionContact.phone}
                      onChange={(e) => updateAdmissionContact('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>WhatsApp Number (digits only)</label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      className={inputClass}
                      value={content.admissionContact.phoneRaw}
                      onChange={(e) => updateAdmissionContact('phoneRaw', e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Support Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      className={inputClass}
                      value={content.admissionContact.email}
                      onChange={(e) => updateAdmissionContact('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Office Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <textarea
                      rows={2}
                      className={textareaWithIconClass}
                      value={content.admissionContact.address}
                      onChange={(e) => updateAdmissionContact('address', e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Google Maps Share Link (Optional)</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      className={inputClass}
                      value={content.admissionContact.mapUrl}
                      onChange={(e) => updateAdmissionContact('mapUrl', e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>WhatsApp Message</label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <textarea
                      rows={2}
                      className={textareaWithIconClass}
                      value={content.admissionContact.whatsappMessage}
                      onChange={(e) => updateAdmissionContact('whatsappMessage', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Contact Section Headings */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100/60">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Contact Section Headings & Button Labels</h3>
                    <p className="text-xs text-slate-500">Custom labels and button texts appearing on the public contact section</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Section Title</label>
                  <input className={rawInputClass} value={content.pageText.contactTitle} onChange={(e) => updatePageText('contactTitle', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Section Subtitle</label>
                  <input className={rawInputClass} value={content.pageText.contactSubtitle} onChange={(e) => updatePageText('contactSubtitle', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Left Card Phone Label</label>
                  <input className={rawInputClass} value={content.pageText.contactPhoneLabel} onChange={(e) => updatePageText('contactPhoneLabel', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Left Card Email Label</label>
                  <input className={rawInputClass} value={content.pageText.contactEmailLabel} onChange={(e) => updatePageText('contactEmailLabel', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Left Card Address Label</label>
                  <input className={rawInputClass} value={content.pageText.contactAddressLabel} onChange={(e) => updatePageText('contactAddressLabel', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp Button Text</label>
                  <input className={rawInputClass} value={content.pageText.whatsappButton} onChange={(e) => updatePageText('whatsappButton', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Right Card Phone Label</label>
                  <input className={rawInputClass} value={content.pageText.contactSecondPhoneLabel} onChange={(e) => updatePageText('contactSecondPhoneLabel', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Right Card Email Label</label>
                  <input className={rawInputClass} value={content.pageText.contactSecondEmailLabel} onChange={(e) => updatePageText('contactSecondEmailLabel', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Right Card Address Label</label>
                  <input className={rawInputClass} value={content.pageText.contactSecondAddressLabel} onChange={(e) => updatePageText('contactSecondAddressLabel', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Card 5: Contact Section Live Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100/60">
                    <Eye size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Contact Section Live Preview</h3>
                    <p className="text-xs text-slate-500">Live preview of how visitors will see the contact cards on the homepage</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-200/80">
                <div className="w-full">
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
            </div>
          </motion.div>
        )}

        {activeTab === 'announcement' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/60">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Announcements & Special Offers</h3>
                    <p className="text-xs text-slate-500">Live offer banner that appears on the homepage below the Gallery section</p>
                  </div>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
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
                <div>
                  <label htmlFor="showAnnouncement" className="text-sm font-bold text-slate-900 cursor-pointer block">
                    Show Offer Banner on Homepage
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">Visitors will see this banner and countdown timer on the homepage.</p>
                </div>
              </div>

              {/* Offer Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Offer Badge / Title</label>
                  <input
                    type="text"
                    className={rawInputClass}
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
                  <p className="text-xs text-slate-500 mt-1">Shown as the badge/tag at the top of the offer card.</p>
                </div>

                <div>
                  <label className={labelClass}>Offer End Date & Time</label>
                  <input
                    type="datetime-local"
                    className={rawInputClass}
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
                  <p className="text-xs text-slate-500 mt-1">Countdown timer will count down to this date & time.</p>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Offer Description</label>
                  <textarea
                    rows={2}
                    className={`${rawInputClass} resize-none`}
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
                  <p className="text-xs text-slate-500 mt-1">Main promotional message shown on the offer banner.</p>
                </div>

                <div>
                  <label className={labelClass}>CTA Button Link (Optional)</label>
                  <input
                    type="text"
                    className={rawInputClass}
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
                  <p className="text-xs text-slate-500 mt-1">#contact scrolls to Contact section. Leave blank to hide button.</p>
                </div>

                <div>
                  <label className={labelClass}>Upcoming Offer Message</label>
                  <input
                    type="text"
                    className={rawInputClass}
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
                  <p className="text-xs text-slate-500 mt-1">Shown when the countdown timer reaches zero (offer expired).</p>
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
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'hero' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/60">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Hero Carousel Slider</h3>
                    <p className="text-xs text-slate-500">Image slider at the top of the homepage with headings and subtitles</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      heroSlides: [
                        ...prev.heroSlides,
                        { id: nextItemId(prev.heroSlides), image: '', title: 'New Slide', subtitle: '' },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus size={16} /> Add Slide
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {content.heroSlides.map((slide, index) => (
                  <div key={slide.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200/80">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Slide {index + 1}</span>
                        {content.heroSlides.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setContent((prev) => ({
                                ...prev,
                                heroSlides: prev.heroSlides.filter((s) => s.id !== slide.id),
                              }))
                            }
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Slide"
                          >
                            <Trash2 size={15} />
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
                          <span className="text-xs text-slate-400 font-medium">No image preview</span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className={cardLabelClass}>Heading</label>
                          <input
                            className={cardInputClass}
                            value={slide.title}
                            onChange={(e) =>
                              setContent((prev) => {
                                const heroSlides = [...prev.heroSlides];
                                heroSlides[index] = { ...slide, title: e.target.value };
                                return { ...prev, heroSlides };
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className={cardLabelClass}>Subtitle</label>
                          <textarea
                            className={`${cardInputClass} resize-none`}
                            rows={2}
                            value={slide.subtitle}
                            onChange={(e) =>
                              setContent((prev) => {
                                const heroSlides = [...prev.heroSlides];
                                heroSlides[index] = { ...slide, subtitle: e.target.value };
                                return { ...prev, heroSlides };
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className={cardLabelClass}>Image URL</label>
                          <input
                            className={cardInputClass}
                            value={slide.image}
                            onChange={(e) =>
                              setContent((prev) => {
                                const heroSlides = [...prev.heroSlides];
                                heroSlides[index] = { ...slide, image: e.target.value };
                                return { ...prev, heroSlides };
                              })
                            }
                            placeholder="https://images.unsplash.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'about' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/60">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">About Section Content</h3>
                    <p className="text-xs text-slate-500">About heading, descriptions, and key milestone highlights</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 mb-8">
                <div>
                  <label className={labelClass}>Section Title</label>
                  <input
                    className={rawInputClass}
                    value={content.aboutContent.title}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        aboutContent: { ...prev.aboutContent, title: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Description Paragraphs (blank line = new paragraph)</label>
                  <textarea
                    className={`${rawInputClass} min-h-[160px]`}
                    value={content.aboutContent.paragraphs.join('\n\n')}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        aboutContent: {
                          ...prev.aboutContent,
                          paragraphs: e.target.value.split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Highlights & Key Stats</h4>
                    <p className="text-xs text-slate-500">Milestone numbers shown in the About section (e.g. 500+ Students)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setContent((prev) => ({
                        ...prev,
                        aboutContent: {
                          ...prev.aboutContent,
                          highlights: [...prev.aboutContent.highlights, { label: 'New Metric', value: '100+' }],
                        },
                      }))
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus size={16} /> Add Highlight
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {content.aboutContent.highlights.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 relative shadow-xs">
                      {content.aboutContent.highlights.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setContent((prev) => ({
                              ...prev,
                              aboutContent: {
                                ...prev.aboutContent,
                                highlights: prev.aboutContent.highlights.filter((_, i) => i !== index),
                              },
                            }))
                          }
                          className="absolute top-3 right-3 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete highlight"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <div className="space-y-3">
                        <div>
                          <label className={cardLabelClass}>Value (e.g. 500+)</label>
                          <input
                            className={cardInputClass}
                            value={item.value}
                            onChange={(e) =>
                              setContent((prev) => {
                                const highlights = [...prev.aboutContent.highlights];
                                highlights[index] = { ...item, value: e.target.value };
                                return { ...prev, aboutContent: { ...prev.aboutContent, highlights } };
                              })
                            }
                            placeholder="Value"
                          />
                        </div>
                        <div>
                          <label className={cardLabelClass}>Label (e.g. Active Students)</label>
                          <input
                            className={cardInputClass}
                            value={item.label}
                            onChange={(e) =>
                              setContent((prev) => {
                                const highlights = [...prev.aboutContent.highlights];
                                highlights[index] = { ...item, label: e.target.value };
                                return { ...prev, aboutContent: { ...prev.aboutContent, highlights } };
                              })
                            }
                            placeholder="Label"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'gallery' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100/60">
                    <Camera size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Photo Gallery</h3>
                    <p className="text-xs text-slate-500">Showcase library premises, study cubicles, and environment</p>
                  </div>
                </div>
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus size={16} /> Add Image
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className={labelClass}>Gallery Section Title</label>
                  <input className={rawInputClass} value={content.pageText.galleryTitle} onChange={(e) => updatePageText('galleryTitle', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Gallery Section Subtitle</label>
                  <input className={rawInputClass} value={content.pageText.gallerySubtitle} onChange={(e) => updatePageText('gallerySubtitle', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {content.galleryImages.map((image, index) => (
                  <div key={image.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200/80">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Image {index + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setContent((prev) => ({
                              ...prev,
                              galleryImages: prev.galleryImages.filter((img) => img.id !== image.id),
                            }))
                          }
                          disabled={content.galleryImages.length <= 1}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
                          title="Delete image"
                        >
                          <Trash2 size={15} />
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
                          <span className="text-xs text-slate-400 font-medium">No image preview</span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className={cardLabelClass}>Direct Image URL</label>
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
                          <label className={cardLabelClass}>Alt Text</label>
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
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline block w-full text-left pt-1 cursor-pointer"
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
            </div>
          </motion.div>
        )}

        {activeTab === 'faculty' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Faculty & Administration Team</h3>
                    <p className="text-xs text-slate-500">Profiles displayed on the home page below the Gallery section</p>
                  </div>
                </div>
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus size={16} /> Add Profile
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className={labelClass}>Faculty Section Title</label>
                  <input
                    className={rawInputClass}
                    value={content.pageText.facultyTitle}
                    onChange={(e) => updatePageText('facultyTitle', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Faculty Section Subtitle</label>
                  <input
                    className={rawInputClass}
                    value={content.pageText.facultySubtitle}
                    onChange={(e) => updatePageText('facultySubtitle', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {content.facultyMembers.map((member, index) => (
                  <div key={member.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200/80">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Profile {index + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setContent((prev) => ({
                              ...prev,
                              facultyMembers: prev.facultyMembers.filter((item) => item.id !== member.id),
                            }))
                          }
                          disabled={content.facultyMembers.length <= 1}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
                          title="Delete profile"
                        >
                          <Trash2 size={15} />
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
                          <span className="text-xs text-slate-400 font-medium">No photo preview</span>
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
                          <label className={cardLabelClass}>Full Name</label>
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
                          <label className={cardLabelClass}>Bio / Detail</label>
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
            </div>
          </motion.div>
        )}

        {/* Global Save Button at Bottom */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm sm:text-base disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} />
            <span>{saving ? 'Saving All Changes...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
