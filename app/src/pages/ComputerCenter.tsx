import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Monitor, Cpu, Code, BookOpen, Clock, Award, ArrowRight, IndianRupee, Sparkles, ChevronRight } from 'lucide-react';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import ChatBot from '../components/ChatBot';
import { SEOMeta } from '../components/SEOMeta';
import { DEFAULT_SITE_CONTENT } from '../data/landingContent';

const topCourses = [
  { id: 'bcc', title: 'BCC', fullName: 'BASIC COMPUTER COURSE', duration: '2 Months', fee: '1,000.00', color: 'from-slate-900 to-[#0a192f]' },
  { id: 'dca', title: 'DCA', fullName: 'DIPLOMA IN COMPUTER APPLICATION', duration: '6 Months', fee: '2,000.00', color: 'from-[#0a192f] to-slate-900' },
  { id: 'adca', title: 'ADCA', fullName: 'ADVANCE DIPLOMA', duration: '6 Months', fee: '2,000.00', color: 'from-slate-950 to-slate-900' },
  { id: 'dtp', title: 'DTP', fullName: 'DESKTOP PUBLISHING', duration: '3 Months', fee: '1,000.00', color: 'from-[#1e1e2f] to-black' },
  { id: 'tally', title: 'Tally With Gst', fullName: 'MASTER ACCOUNTING', duration: '3 Months', fee: '1,000.00', color: 'from-slate-900 to-[#0f172a]' },
  { id: 'network', title: 'Computer Networking', fullName: 'NETWORKING FUNDAMENTALS', duration: '2 Months', fee: '1,500.00', color: 'from-[#0b1b3d] to-slate-900' },
  { id: 'c', title: 'C Programming', fullName: 'LEARN C PROGRAMMING', duration: '2 Months', fee: '1,000.00', color: 'from-slate-900 to-black' },
  { id: 'css', title: 'CSS', fullName: 'CSS 3 STYLING', duration: '1 Months', fee: '500.00', color: 'from-[#0d2a52] to-slate-900' },
];

const Typewriter = ({ words }: { words: string[] }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[currentWordIndex];
    let typingSpeed = isDeleting ? 30 : 80;
    
    if (!isDeleting && currentText === word) {
      typingSpeed = 2500; // Pause at end of word
      const timeout = setTimeout(() => setIsDeleting(true), typingSpeed);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentText === '') {
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setCurrentText(word.substring(0, currentText.length + (isDeleting ? -1 : 1)));
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words]);

  return (
    <span className="inline-block">
      {currentText}
      <span className="animate-pulse border-r-2 border-white ml-1 pr-1">&nbsp;</span>
    </span>
  );
};

export default function ComputerCenter() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNavigate = (sectionId: string) => {
    navigate('/', { state: { scrollToSection: sectionId } });
  };

  const { libraryInfo, pageText, navMenuItems } = DEFAULT_SITE_CONTENT;
  const computerCenterInfo = { ...libraryInfo, name: 'Galaxy Computer Center' };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#040814] text-slate-800 dark:text-slate-300 font-sans selection:bg-blue-500/30 transition-colors duration-300 flex flex-col">
      <SEOMeta
        title="Galaxy Computer Center Tehta | Education Hub in Tehta, Jehanabad"
        description="Join Galaxy Computer Center Tehta, the top educational hub in Jehanabad. Master programming, digital skills, and advance your career at Galaxy Library Tehta."
        keywords="galaxy computer center tehta, computer center tehta, galaxy computer center jehanabad, education hub in tehta, galaxy educaion hub tehta, galaxy education hub tehta, galaxy library tehta, programming courses"
        ogUrl="https://galaxyhub.in/computercenter"
        canonical="https://galaxyhub.in/computercenter"
      />

      <LandingNavbar
        libraryInfo={computerCenterInfo}
        pageText={pageText}
        navMenuItems={navMenuItems}
        onNavigate={handleNavigate}
      />

      <main className="flex-grow w-full">
        {/* HERO SECTION */}
        <section className="relative w-full min-h-screen flex items-center justify-start pt-20 overflow-hidden bg-slate-900">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop" 
              alt="Cyber Background" 
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
            />
            {/* Deep gradient overlay to make text readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              {/* Badge */}
              <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-medium text-sm tracking-wide mb-8 shadow-2xl">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                Trusted IT Training Institute
              </div>
              
              {/* Typing Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-white mb-4 leading-[1.2] tracking-tight drop-shadow-md">
                <Typewriter words={[
                  "Start Your Professional Career",
                  "Learn Programming & Coding",
                  "Master Advanced Tech Skills"
                ]} />
              </h1>
              
              {/* Subtext */}
              <p className="text-lg sm:text-xl lg:text-2xl text-slate-300/90 mb-10 max-w-2xl leading-relaxed font-medium">
                At Galaxy Computer Center, we empower students with in-demand digital skills to build a successful, career-ready future.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-5">
                <button 
                  type="button"
                  onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center gap-2 group tracking-wide"
                >
                  Explore Courses
                  <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
                </button>
                <a 
                  href={`https://wa.me/${libraryInfo.phoneRaw}?text=Hi! I want to get admission in Galaxy Computer Center.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-8 py-4 rounded-full bg-transparent border-2 border-white/70 text-white hover:bg-white hover:text-slate-900 font-bold text-lg transition-all backdrop-blur-sm tracking-wide"
                >
                  Get Admission
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* TOP COURSES SECTION */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 relative z-10 bg-slate-50 dark:bg-[#040814]">
          <div className="text-center mb-12 flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] dark:text-white flex items-center justify-center gap-3">
              <Sparkles className="text-yellow-500 fill-yellow-500 w-8 h-8" />
              Our Top Courses
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topCourses.map((course, index) => (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col"
              >
                {/* Course Banner / Thumbnail */}
                <div className={`h-40 bg-gradient-to-br ${course.color} relative flex flex-col items-center justify-center p-4 text-center border-b-[3px] border-yellow-400 overflow-hidden group`}>
                  {/* Background decoration */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                  
                  <h3 className="text-4xl sm:text-5xl font-black text-white drop-shadow-md z-10 uppercase tracking-tight">
                    {course.title === 'Tally With Gst' ? 'TALLY' : course.title === 'Computer Networking' ? 'NETWORK' : course.title === 'C Programming' ? 'C PROG' : course.title}
                  </h3>
                  <p className="text-[10px] font-bold text-yellow-400 tracking-widest z-10 mt-1 uppercase">
                    {course.fullName}
                  </p>
                  
                  <div className="absolute bottom-2 left-2 bg-yellow-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-sm z-10 flex items-center gap-0.5 shadow-sm transform transition-transform group-hover:scale-105">
                    ENROLL NOW <ChevronRight size={10} strokeWidth={4} />
                  </div>
                </div>

                {/* Course Details */}
                <div className="p-5 flex flex-col items-center flex-grow text-center">
                  <h4 className="text-[17px] font-bold text-slate-800 dark:text-white mb-3">
                    {course.title}
                  </h4>
                  
                  <div className="flex flex-col items-center gap-1 text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-5 w-full">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>Duration: {course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-center">
                      <IndianRupee size={14} className="text-green-600 dark:text-green-400" />
                      <span>Fee: ₹{course.fee}</span>
                    </div>
                  </div>
                  
                  <button className="mt-auto px-6 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-sm font-bold rounded-full transition-all shadow-md shadow-indigo-500/20 w-full max-w-[160px] hover:-translate-y-0.5">
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button className="px-8 py-3.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-full shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 hover:shadow-blue-500/40 text-sm tracking-wide">
              Show All Courses
            </button>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Why Choose Galaxy?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              We provide the best environment and expert syllabus for practical, job-oriented learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              { icon: Monitor, title: 'Basic Computer Skills', desc: 'Master fundamentals like MS Office, internet browsing, and everyday computing.' },
              { icon: Code, title: 'Programming & Web Dev', desc: 'Learn to code and build modern websites and software applications.' },
              { icon: Cpu, title: 'Advanced Tech Courses', desc: 'Explore advanced topics to stay ahead in the digital world.' },
              { icon: BookOpen, title: 'Expert Syllabus', desc: 'Curriculum designed by industry experts for real-world applications.' },
              { icon: Clock, title: 'Flexible Batches', desc: 'Choose a batch timing that perfectly fits your schedule.' },
              { icon: Award, title: 'Certification', desc: 'Get certified upon course completion to boost your career prospects.' }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-500/10 group"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Lead Capture / Interest form section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl"
          >
            <h2 className="text-3xl font-bold mb-4">Interested in Joining?</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Be the first to know when we open! Contact us to pre-register and get early bird benefits.
            </p>
            <a
              href={`https://wa.me/${libraryInfo.phoneRaw}?text=Hi! I want to know more about the upcoming Galaxy Computer Center.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Notify Me on WhatsApp
            </a>
          </motion.div>
        </section>
      </main>

      <LandingFooter
        libraryInfo={computerCenterInfo}
        pageText={pageText}
        navMenuItems={navMenuItems}
        onNavigate={handleNavigate}
      />
      <ChatBot />
    </div>
  );
}
