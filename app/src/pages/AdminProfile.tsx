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
  Clock,
  ExternalLink,
  Check,
  X,
  FileText,
  Monitor,
  Globe
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
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [profile, setProfile] = useState<ProfileData>(() => {
    const cached = adminApi.getCachedProfile();
    return {
      displayName: cached?.displayName || user?.displayName || 'Admin',
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
    }, 4000);
  };

  // Password Strength Calculation
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, text: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 2, text: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, text: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 4, text: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, text: 'Too short', color: 'bg-slate-200' };
    }
  };

  const strength = calculatePasswordStrength(newPassword);

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
      showToast('error', 'Please select an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
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
          updateUserContext({ photoURL: compressedDataUrl });
          showToast('success', 'Photo selected! Click "Save Changes" to apply.');
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
      const updatedProfile = await adminApi.updateProfile({
        displayName: profile.displayName.trim(),
        phone: profile.phone.trim(),
        photoURL: profile.photoURL,
        libraryName: profile.libraryName.trim(),
        address: profile.address.trim(),
        bio: profile.bio.trim(),
        email: profile.email.trim()
      });

      if (updatedProfile) {
        setProfile((prev) => ({
          ...prev,
          displayName: updatedProfile.displayName || prev.displayName,
          phone: updatedProfile.phone || prev.phone,
          photoURL: updatedProfile.photoURL !== undefined ? updatedProfile.photoURL : prev.photoURL,
          libraryName: updatedProfile.libraryName || prev.libraryName,
          address: updatedProfile.address || prev.address,
          bio: updatedProfile.bio !== undefined ? updatedProfile.bio : prev.bio
        }));
      }

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

      updateUserContext({
        displayName: profile.displayName.trim(),
        photoURL: profile.photoURL || null,
        phone: profile.phone.trim()
      });

      showToast('success', 'Admin profile changes saved successfully.');
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
      showToast('error', 'Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showToast('error', 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      showToast('error', 'New password must be different from current password.');
      return;
    }

    setSavingPassword(true);

    try {
      const currentUser = auth.currentUser;

      if (!currentUser || !currentUser.email) {
        throw new Error('Admin session not found in Firebase. Please log in again.');
      }

      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      showToast('success', 'Password updated successfully! Keep your new password secure.');
    } catch (err: any) {
      console.error('Password change error:', err);
      let errMsg = 'Failed to change password. Please check your current password.';

      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = 'Current password is incorrect. Please re-enter.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'New password is too weak. Please use letters and numbers.';
      } else if (err.code === 'auth/requires-recent-login') {
        errMsg = 'Security verification expired. Please sign out and sign back in to continue.';
      } else if (err.message) {
        errMsg = err.message;
      }

      showToast('error', errMsg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
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
                ? 'bg-slate-900/90 border-emerald-500/50 text-emerald-100 shadow-slate-950/20'
                : 'bg-rose-900/90 border-rose-500/50 text-rose-100 shadow-rose-950/20'
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

      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Account & Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your personal profile, administrative security credentials, and organization details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Session
          </span>
        </div>
      </div>

      {/* Modern Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 relative overflow-hidden">
        {/* Subtle decorative top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2C3D5A] via-blue-600 to-indigo-600" />

        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Avatar with Camera Overlay */}
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 p-1 ring-4 ring-slate-50 border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center relative">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-white rounded-xl flex items-center justify-center text-[#2C3D5A]">
                    <AppLogo size="lg" showName={false} />
                  </div>
                )}

                {/* Instant Upload Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-900/60 rounded-xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs"
                  title="Upload New Photo"
                >
                  <Camera size={20} />
                  <span className="text-[10px] font-medium mt-1">Upload</span>
                </button>
              </div>

              {/* Small Action Badge beside avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white hover:bg-slate-50 rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                title="Change Photo"
              >
                <Camera size={13} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {profile.displayName || 'Administrator'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  <ShieldCheck size={13} />
                  Super Admin
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {profile.email} • {profile.libraryName}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Change Profile Photo
                </button>
                {profile.photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Security Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <Clock size={15} className="text-slate-400" />
            <span>Auto-lock: <strong>3 min inactivity</strong></span>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl max-w-fit border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <User size={15} />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Lock size={15} />
          <span>Password & Security</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      <div>
        {/* TAB 1: Profile Details */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main Form (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Personal Information Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">Personal & Official Information</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Information displayed across administrative reports, student receipts, and communication.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Display Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Display Name
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={profile.displayName}
                          onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                          required
                          placeholder="e.g. Aman Kumar"
                          className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Admin Email
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={profile.email}
                          readOnly
                          className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed select-none"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Linked to Firebase Auth credentials
                      </span>
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Contact / Phone Number
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          placeholder="+91 7488252019"
                          className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Library Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Library / Organization Name
                      </label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={profile.libraryName}
                          onChange={(e) => setProfile({ ...profile, libraryName: e.target.value })}
                          placeholder="Galaxy Library"
                          className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Address / Location
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                      <textarea
                        rows={2}
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="e.g. DhiraBigha Sugaon Road, Tehtar, Bihar"
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all resize-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Bio / Administrator Notes
                    </label>
                    <textarea
                      rows={2}
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Short note or description about management..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all resize-none placeholder:text-slate-400"
                    />
                  </div>

                  {/* Save Button Row */}
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C3D5A] hover:bg-[#1e293b] text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {savingProfile ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Sidebar Summary & Shortcuts (1 col) */}
            <div className="space-y-6">
              {/* Administrative Shortcuts Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Management</h4>
                <div className="space-y-2 text-xs font-medium">
                  <Link
                    to="/website-settings"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 transition-colors border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <Globe size={15} className="text-slate-400" />
                      <span>Website & Announcements</span>
                    </div>
                    <ExternalLink size={13} />
                  </Link>

                  <Link
                    to="/computer-center-settings"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 transition-colors border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <Monitor size={15} className="text-slate-400" />
                      <span>Computer Center Settings</span>
                    </div>
                    <ExternalLink size={13} />
                  </Link>

                  <Link
                    to="/reports"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 transition-colors border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-slate-400" />
                      <span>Financial & Audit Reports</span>
                    </div>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: Password & Security */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Password Form (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Change Admin Password</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your account password. Requires verification of your current password.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2C3D5A] flex items-center justify-center">
                  <KeyRound size={17} />
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="Enter current password"
                      className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Enter new password (min. 6 characters)"
                      className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-slate-500">Strength:</span>
                        <span className={
                          strength.score >= 3 ? 'text-emerald-600' :
                          strength.score === 2 ? 'text-amber-600' : 'text-rose-500'
                        }>
                          {strength.text}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                        <div className={`h-full rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`} />
                        <div className={`h-full rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`} />
                        <div className={`h-full rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`} />
                        <div className={`h-full rounded-full ${strength.score >= 4 ? strength.color : 'bg-slate-200'}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm new password"
                      className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-600 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {confirmPassword && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold">
                      {newPassword === confirmPassword ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          <span className="text-emerald-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X size={14} className="text-rose-500" />
                          <span className="text-rose-500">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-3 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {savingPassword ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Notes Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck size={17} className="text-blue-600" />
                  <span>Security Recommendations</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>Use at least 8 characters with a combination of letters, numbers, and symbols.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>Never share administrative login credentials with staff or students.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>Active sessions will automatically re-verify on your next login.</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
