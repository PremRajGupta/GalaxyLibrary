import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Camera, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TopHeader from '../components/layout/TopHeader';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../lib/apiService';
import { auth } from '../firebase/config';
import { 
  updatePassword, 
  updateProfile, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from 'firebase/auth';
import AppLogo from '../components/AppLogo';

interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  libraryName: string;
  address: string;
  bio: string;
  photoURL: string;
}

export default function AdminProfile() {
  const { user, updateUserContext } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile');

  // Profile Form State
  const [profile, setProfile] = useState<ProfileData>(() => {
    const cached = adminApi.getCachedProfile();
    return {
      displayName: cached?.displayName || user?.displayName || 'Library Admin',
      email: cached?.email || user?.email || 'admin@library.com',
      phone: cached?.phone || user?.phone || '+91 7488252019',
      libraryName: cached?.libraryName || 'Galaxy Library',
      address: cached?.address || 'DhiraBigha Sugaon Road, Tehtar, Bihar',
      bio: cached?.bio || 'Head Administrator of Galaxy Library & Computer Center',
      photoURL: cached?.photoURL || user?.photoURL || ''
    };
  });

  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch fresh profile from backend
  useEffect(() => {
    let isMounted = true;
    adminApi.getProfile()
      .then((data) => {
        if (!isMounted || !data) return;
        setProfile((prev) => ({
          ...prev,
          displayName: data.displayName || prev.displayName,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          libraryName: data.libraryName || prev.libraryName,
          address: data.address || prev.address,
          bio: data.bio || prev.bio,
          photoURL: data.photoURL || prev.photoURL
        }));
      })
      .catch((err) => {
        console.warn('Could not load remote admin profile:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Photo File Selection & Resize
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 400x400 to keep it crisp and ultra fast
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          setProfile((prev) => ({ ...prev, photoURL: compressedDataUrl }));
          // Update live preview in auth context
          updateUserContext({ photoURL: compressedDataUrl });
          showToast('success', 'Profile photo updated! Click "Save Changes" to save permanently.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Remove Photo
  const handleRemovePhoto = () => {
    setProfile((prev) => ({ ...prev, photoURL: '' }));
    updateUserContext({ photoURL: '' });
    showToast('success', 'Profile photo removed. Click "Save Changes" to apply.');
  };

  // Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      // 1. Update in backend MongoDB
      await adminApi.updateProfile({
        displayName: profile.displayName.trim(),
        phone: profile.phone.trim(),
        photoURL: profile.photoURL,
        libraryName: profile.libraryName.trim(),
        address: profile.address.trim(),
        bio: profile.bio.trim()
      });

      // 2. If logged in via Firebase, update Firebase profile as well
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: profile.displayName.trim(),
            photoURL: profile.photoURL || undefined
          });
        } catch (fbErr) {
          console.warn('Firebase profile sync error (ignored):', fbErr);
        }
      }

      // 3. Update Auth Context and LocalStorage
      updateUserContext({
        displayName: profile.displayName.trim(),
        photoURL: profile.photoURL || null,
        phone: profile.phone.trim()
      });

      showToast('success', 'Admin profile successfully updated! (प्रोफ़ाइल सुरक्षित हो गई)');
    } catch (err: any) {
      console.error('Save profile error:', err);
      showToast('error', err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      showToast('error', 'Please enter your current password (वर्तमान पासवर्ड डालें)');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showToast('error', 'New password must be at least 6 characters (नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए)');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'New password and confirm password do not match (पासवर्ड मैच नहीं कर रहा है)');
      return;
    }

    if (newPassword === currentPassword) {
      showToast('error', 'New password must be different from current password');
      return;
    }

    setSavingPassword(true);

    try {
      const currentUser = auth.currentUser;

      if (!currentUser || !currentUser.email) {
        throw new Error('Admin session not found in Firebase. Please log in again.');
      }

      // Step 1: Re-authenticate with current credentials
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Step 2: Update to new password
      await updatePassword(currentUser, newPassword);

      // Clear fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      showToast('success', 'Password successfully changed! Please remember your new password. (पासवर्ड सफलतापूर्वक बदल दिया गया)');
    } catch (err: any) {
      console.error('Password change error:', err);
      let errMsg = 'Failed to change password. Please check your current password.';

      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = 'Current password is incorrect (वर्तमान पासवर्ड गलत है). Please re-enter.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'New password is too weak. Please use letters and numbers.';
      } else if (err.code === 'auth/requires-recent-login') {
        errMsg = 'Security timeout. Please sign out and sign back in to change password.';
      } else if (err.message) {
        errMsg = err.message;
      }

      showToast('error', errMsg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <TopHeader />

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-medium text-sm border backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-emerald-600/95 border-emerald-500 shadow-emerald-500/20'
                : 'bg-rose-600/95 border-rose-500 shadow-rose-500/20'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={20} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0" />
            )}
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner & Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Decorative Gradient Header */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-[#2C3D5A] via-[#1e293b] to-[#3b82f6] relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
            <Sparkles size={14} className="text-yellow-300" />
            <span>Admin Control Panel</span>
          </div>
        </div>

        {/* Profile Info Row with Overlapping Avatar */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Avatar with Camera Trigger */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-1.5 shadow-xl border-2 border-white overflow-hidden relative">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-[#2C3D5A]">
                    <AppLogo size="xl" showName={false} />
                  </div>
                )}

                {/* Hover Camera Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-1.5 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer backdrop-blur-xs"
                  title="Change Profile Photo"
                >
                  <Camera size={24} />
                  <span className="text-[11px] font-semibold mt-1">Upload Photo</span>
                </button>
              </div>

              {/* Quick Action Badges beneath / beside avatar */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Profile Names and Status */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {profile.displayName || 'Library Admin'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  <ShieldCheck size={13} />
                  Super Admin
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>

              <p className="text-sm text-slate-500 font-medium">
                {profile.email} • {profile.libraryName}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2C3D5A] hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <Camera size={14} />
                  <span>Change Photo</span>
                </button>
                {profile.photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Badges */}
          <div className="flex sm:flex-col items-center sm:items-end justify-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl font-medium">
              <Clock size={14} className="text-slate-400" />
              Auto-lock: 3 min idle
            </span>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="px-6 border-t border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#2C3D5A] text-[#2C3D5A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={16} />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3.5 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#2C3D5A] text-[#2C3D5A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock size={16} />
            <span>Password & Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`py-3.5 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'border-[#2C3D5A] text-[#2C3D5A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 size={16} />
            <span>Organization & Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      <div>
        {/* TAB 1: Profile Information */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Form Column */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-slate-800">Admin Information (व्यक्तिगत विवरण)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your display name, official contact number, and library details shown to students.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Display Name (नाम)
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={profile.displayName}
                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                        required
                        placeholder="e.g. Aman Kumar"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C3D5A]/20 focus:border-[#2C3D5A] text-sm font-medium text-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Admin Email (ईमेल)
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        title="Email cannot be changed directly here"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Email address is linked to Firebase Authentication
                    </span>
                  </div>

                  {/* Contact / Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Contact / WhatsApp Phone (मोबाइल नंबर)
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+91 7488252019"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C3D5A]/20 focus:border-[#2C3D5A] text-sm font-medium text-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  {/* Library / Center Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Library / Center Name (लाइब्रेरी का नाम)
                    </label>
                    <div className="relative">
                      <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={profile.libraryName}
                        onChange={(e) => setProfile({ ...profile, libraryName: e.target.value })}
                        placeholder="Galaxy Library"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C3D5A]/20 focus:border-[#2C3D5A] text-sm font-medium text-slate-800 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Address / Location (पता)
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3.5 top-3 text-slate-400" />
                    <textarea
                      rows={2}
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      placeholder="e.g. DhiraBigha Sugaon Road, Tehtar, Bihar"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C3D5A]/20 focus:border-[#2C3D5A] text-sm font-medium text-slate-800 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Bio / Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Bio / Admin Note (विवरण)
                  </label>
                  <textarea
                    rows={2}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Short description or note about administration..."
                    className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C3D5A]/20 focus:border-[#2C3D5A] text-sm font-medium text-slate-800 transition-all resize-none"
                  />
                </div>

                {/* Save Button */}
                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2C3D5A] hover:bg-[#1e293b] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Profile Card / Preview Column */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-[#2C3D5A] rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <ShieldCheck size={22} className="text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base">Admin Security Badge</h4>
                    <p className="text-xs text-slate-300">Authorized Manager Access</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-300">Access Level:</span>
                    <span className="font-bold text-yellow-300">Full System Control</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-300">Fee Receipts:</span>
                    <span className="font-semibold text-emerald-400">Enabled</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-300">Seat Matrix:</span>
                    <span className="font-semibold text-emerald-400">Read & Write</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-300">Student Admissions:</span>
                    <span className="font-semibold text-emerald-400">Full Access</span>
                  </div>
                </div>

                <div className="mt-5 p-3 rounded-2xl bg-white/10 backdrop-blur-md flex items-start gap-2.5 text-[11px] text-slate-200">
                  <Info size={16} className="text-blue-300 flex-shrink-0 mt-0.5" />
                  <span>
                    Aapka naam aur photo top header aur fee receipts par synchronize ho jayega.
                  </span>
                </div>
              </div>

              {/* Quick Navigation Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <h4 className="font-bold text-sm text-slate-800 mb-3">Quick Navigation</h4>
                <div className="space-y-2 text-xs font-semibold">
                  <Link
                    to="/website-settings"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors border border-slate-100"
                  >
                    <span>Website & Announcement Settings</span>
                    <ExternalLink size={14} />
                  </Link>
                  <Link
                    to="/computer-center-settings"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors border border-slate-100"
                  >
                    <span>Computer Center Course Settings</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: Security & Password */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          >
            <div className="border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2C3D5A] flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Change Admin Password (पासवर्ड बदलें)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ensure your account is using a strong password that is at least 6 characters long.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Current Password (वर्तमान पासवर्ड)
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C3D5A]/20 focus:border-[#2C3D5A] text-sm font-medium text-slate-800 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Password (नया पासवर्ड)
                </label>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C3D5A]/20 focus:border-[#2C3D5A] text-sm font-medium text-slate-800 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newPassword && (
                  <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                    <span className={`font-semibold ${newPassword.length >= 6 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {newPassword.length >= 6 ? '✓ 6+ characters' : '✗ Minimum 6 characters required'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Confirm New Password (पासवर्ड दोबारा लिखें)
                </label>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C3D5A]/20 focus:border-[#2C3D5A] text-sm font-medium text-slate-800 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                    <span className={`font-semibold ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              {/* Password Guidelines Box */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle size={15} />
                  <span>Important Note / महत्वपूर्ण सूचना:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px] leading-relaxed">
                  <li>Naya password save hone ke baad agle login par vahi naya password use hoga.</li>
                  <li>Security ke liye apna password kisi aur ke sath share na karein.</li>
                  <li>Password kam se kam 6 characters ka hona anivarya hai.</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={17} />
                      <span>Update Password (पासवर्ड बदलें)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* TAB 3: System & Organization */}
        {activeTab === 'system' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Session Security */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Session Security (सुरक्षा टाइमआउट)</h3>
                  <p className="text-xs text-slate-500">Auto-lock on inactivity</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
                <p>
                  Agar admin computer par <strong>3 minute</strong> tak koi activity (mouse move, click ya typing) nahi hoti, toh system automatically security ke liye logout kar deta hai.
                </p>
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs pt-1">
                  <CheckCircle2 size={16} />
                  <span>Inactivity Protection Active (3 Minutes)</span>
                </div>
              </div>
            </div>

            {/* Database & Cloud Connection */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Connected Services (क्लाउड सिस्टम)</h3>
                  <p className="text-xs text-slate-500">Status & health of cloud servers</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">Authentication Service</span>
                  <span className="font-bold text-emerald-600">Firebase Auth (Connected)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">Database Engine</span>
                  <span className="font-bold text-emerald-600">MongoDB Atlas (Live)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">Frontend Hosting</span>
                  <span className="font-bold text-blue-600">Vercel Production</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
