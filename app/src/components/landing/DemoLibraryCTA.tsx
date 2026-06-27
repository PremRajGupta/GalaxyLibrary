import { motion } from 'framer-motion';
import { ExternalLink, Layout } from 'lucide-react';

export default function DemoLibraryCTA() {
  return (
    <section className="py-12 bg-white dark:bg-[#020617] relative overflow-hidden transition-colors duration-300">
      {/* Decorative ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px] h-[80vw] max-h-[600px] bg-purple-200/40 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none transition-colors duration-300" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="relative group p-1 rounded-[2rem] bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-500 hover:from-purple-500 hover:via-indigo-600 hover:to-blue-600 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/25"
        >
          <div className="bg-white/95 dark:bg-[#0a0f1e]/95 backdrop-blur-xl rounded-[1.85rem] p-8 sm:p-12 overflow-hidden relative border border-white/20 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

            <div className="flex-1 text-center md:text-left z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-100 dark:border-indigo-500/20 shadow-inner"
              >
                <Layout size={32} />
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight drop-shadow-sm">
                Check for Demo Library
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto md:mx-0 leading-relaxed">
                Experience our comprehensive library management system firsthand. Test features, manage users, and see how our software can streamline your operations before you make a decision.
              </p>
            </div>

            <div className="flex-shrink-0 z-10 mt-2 md:mt-0">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://demo-library-kappa.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative inline-flex items-center justify-center gap-3 px-8 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-lg font-bold rounded-2xl shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_10px_40px_rgba(99,102,241,0.5)] transition-all overflow-hidden"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
                
                <span>Demo Visit</span>
                <ExternalLink size={20} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
