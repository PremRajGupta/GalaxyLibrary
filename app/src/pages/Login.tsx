import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import AppLogo from '../components/AppLogo';
import S from '../lib/strings';

export default function Login() {
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, studentLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'student') {
        await studentLogin(email.trim(), password);
        navigate('/student-portal');
      } else {
        await login(email.trim(), password);
        navigate('/dashboard');
      }
    } catch (err) {
      const message = (err as Error).message || 'An error occurred. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="flex flex-col items-center mb-6">
            <AppLogo size="xl" className="mb-4 justify-center" />
            <h1 className="text-2xl font-bold text-[#1e293b]">{S.appName}</h1>
            <p className="text-sm text-[#64748b] mt-1">Library Management System</p>
          </div>

          {/* Sliding Tab Toggle */}
          <div className="flex bg-[#f1f5f9] p-1 rounded-xl mb-6 relative">
            <motion.div
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
              animate={{
                x: loginType === 'student' ? '0%' : '100%',
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => {
                setLoginType('student');
                setError('');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors duration-200 relative text-center ${
                loginType === 'student' ? 'text-[#1e293b]' : 'text-[#64748b]'
              }`}
            >
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('admin');
                setError('');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors duration-200 relative text-center ${
                loginType === 'admin' ? 'text-[#1e293b]' : 'text-[#64748b]'
              }`}
            >
              Admin Access
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                {loginType === 'student' ? 'Student Email' : 'Admin Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={loginType === 'student' ? 'Galaxy@XXXX' : 'Enter your password'}
                  className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1a2b4a] text-white font-semibold rounded-lg hover:bg-[#2a3b5a] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in...' : `Sign In as ${loginType === 'student' ? 'Student' : 'Admin'}`}
            </button>
          </form>

          <p className="text-center text-sm text-[#94a3b8] mt-6">
            <Link to="/" className="text-[#3b82f6] hover:underline">
              Back to Home
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
