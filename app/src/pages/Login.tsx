import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import AppLogo from '../components/AppLogo';
import S from '../lib/strings';

const Lamp = ({ isOn, hue, onToggle }: { isOn: boolean; hue: number; onToggle: () => void }) => {
  const glowColor = `hsl(${hue}, 60%, 50%)`;
  
  return (
    <div className="relative flex flex-col items-center z-20 mt-0">
      {/* Lamp SVG */}
      <svg width="200" height="150" viewBox="0 0 200 150" className="drop-shadow-2xl overflow-visible">
        <defs>
          <filter id="lamp-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Wire */}
        <line x1="100" y1="0" x2="100" y2="40" stroke="#1e293b" strokeWidth="4" />
        
        {/* Lamp Shade Base */}
        <path 
          d="M 85 40 Q 100 30 115 40 L 140 100 Q 100 110 60 100 Z" 
          fill={isOn ? glowColor : "#334155"} 
          className="transition-colors duration-500"
        />

        {/* Inner Light Bulb */}
        <circle 
          cx="100" cy="100" r="15" 
          fill={isOn ? "#ffffff" : "#1e293b"} 
          filter={isOn ? "url(#lamp-glow)" : ""}
          className="transition-all duration-500"
        />

        {/* Cute Eyes Group */}
        <motion.g 
          transform="translate(100, 75)" 
          animate={{ y: isOn ? 0 : 5 }} 
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        >
          {/* Left Eye */}
          <motion.g animate={{ rotate: isOn ? 0 : 180 }}>
            <circle cx="-15" cy="0" r="3.5" fill="#0f172a" />
            <path d="M -20 -5 Q -15 -8 -10 -5" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
          
          {/* Right Eye */}
          <motion.g animate={{ rotate: isOn ? 0 : 180 }}>
            <circle cx="15" cy="0" r="3.5" fill="#0f172a" />
            <path d="M 10 -5 Q 15 -8 20 -5" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
        </motion.g>
      </svg>

      {/* Pull Cord */}
      <motion.div 
        className="absolute top-[100px] flex flex-col items-center cursor-pointer"
        whileTap={{ y: 30 }}
        onClick={onToggle}
        style={{ zIndex: 10 }}
      >
        <div className="w-[2px] h-24 bg-gray-600" />
        <div className="w-3 h-5 rounded-full bg-red-500 shadow-md border border-red-700" />
        {!isOn && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
            className="absolute top-32 w-max text-xs font-semibold text-gray-400 bg-gray-800/80 px-2 py-1 rounded-md"
          >
            Pull me!
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default function Login() {
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, studentLogin } = useAuth();
  const navigate = useNavigate();

  // Lamp State
  const [isOn, setIsOn] = useState(false);
  const [hue, setHue] = useState(320); // Default pinkish hue

  const handleToggleLamp = () => {
    const newState = !isOn;
    setIsOn(newState);
    if (newState) {
      // Randomize color hue when turned on
      setHue(Math.floor(Math.random() * 360));
    }
  };

  const glowColor = `hsl(${hue}, 40%, 45%)`;
  const glowColorDark = `hsl(${hue}, 40%, 35%)`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOn) return; // Prevent submission if lamp is off, though UI hides it anyway

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

  // Prevent default body background
  useEffect(() => {
    document.body.style.backgroundColor = '#020617'; // slate-950
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#020617] transition-colors duration-1000">
      
      {/* Light Cone Background Effect */}
      <div 
        className="absolute inset-0 transition-opacity duration-700 pointer-events-none z-0"
        style={{
          opacity: isOn ? 1 : 0,
          background: `radial-gradient(circle at 50% 100px, ${glowColorDark} 0%, transparent 60%)`
        }}
      />

      {/* The Lamp component */}
      <Lamp isOn={isOn} hue={hue} onToggle={handleToggleLamp} />

      {/* Login Form Container */}
      <div className="flex-1 flex items-center justify-center w-full px-4 mt-24 pb-12 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ 
            opacity: isOn ? 1 : 0, 
            scale: isOn ? 1 : 0.8, 
            y: isOn ? 0 : 20 
          }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-full max-w-md relative"
          style={{ pointerEvents: isOn ? 'auto' : 'none' }}
        >
          <div 
            className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 transition-all duration-500 border-2"
            style={{
              borderColor: isOn ? glowColor : 'transparent',
              boxShadow: isOn 
                ? `0 0 15px rgba(255,255,255,0.05), 0 0 30px ${glowColor}, inset 0 0 15px rgba(255,255,255,0.02)`
                : 'none'
            }}
          >
            <div className="flex flex-col items-center mb-6">
              <AppLogo size="xl" className="mb-4 justify-center" />
              <h1 className="text-2xl font-bold text-white">{S.appName}</h1>
              <p className="text-sm text-slate-400 mt-1">Library Management System</p>
            </div>

            {/* Sliding Tab Toggle */}
            <div className="flex bg-slate-800 p-1 rounded-xl mb-6 relative">
              <motion.div
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-slate-700 rounded-lg shadow-sm"
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
                  loginType === 'student' ? 'text-white' : 'text-slate-400'
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
                  loginType === 'admin' ? 'text-white' : 'text-slate-400'
                }`}
              >
                Admin Access
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2"
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {loginType === 'student' ? 'Student Email' : 'Admin Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={loginType === 'student' ? 'Galaxy@XXXX' : 'Enter your password'}
                    className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: glowColorDark,
                  boxShadow: `0 4px 15px rgba(0,0,0,0.3)`
                }}
              >
                {loading ? 'Signing in...' : `Sign In as ${loginType === 'student' ? 'Student' : 'Admin'}`}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-6">
              <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                Back to Home
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
