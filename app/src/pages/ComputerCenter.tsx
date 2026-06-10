import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Monitor, Cpu, Code, BookOpen, Clock, Award } from 'lucide-react';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import { SEOMeta } from '../components/SEOMeta';
import { DEFAULT_SITE_CONTENT } from '../data/landingContent';

export default function ComputerCenter() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNavigate = (sectionId: string) => {
    navigate('/', { state: { scrollToSection: sectionId } });
  };

  const { libraryInfo, pageText, navMenuItems } = DEFAULT_SITE_CONTENT;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#040814] text-slate-800 dark:text-slate-300 font-sans selection:bg-blue-500/30 transition-colors duration-300 flex flex-col">
      <SEOMeta
        title="Galaxy Computer Center | Coming Soon"
        description="Galaxy Computer Center is launching soon! Get ready for premium computer education, programming courses, and digital skills training in Tehta."
        keywords="galaxy computer center, computer classes tehta, programming courses, digital skills, computer education"
        ogUrl="https://galaxyhub.in/computer-center"
        canonical="https://galaxyhub.in/computer-center"
      />

      <LandingNavbar
        libraryInfo={libraryInfo}
        pageText={pageText}
        navMenuItems={navMenuItems}
        onNavigate={handleNavigate}
      />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Launching Soon - Next Month
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
            Galaxy <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Computer Center</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400">
            We are expanding our educational ecosystem! Get ready to master digital skills, programming, and essential computer knowledge with our upcoming premium computer center.
          </p>
        </motion.div>

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
      </main>

      <LandingFooter
        libraryInfo={libraryInfo}
        pageText={pageText}
        navMenuItems={navMenuItems}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
