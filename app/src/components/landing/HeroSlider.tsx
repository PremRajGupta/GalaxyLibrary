import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { HeroSlide, PageText } from '../../data/landingContent';

type HeroSliderProps = {
  slides: HeroSlide[];
  pageText: PageText;
  onVisit: () => void;
  onContact: () => void;
};

export default function HeroSlider({ slides, pageText, onVisit, onContact }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (slides.length === 0) return undefined;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 10000); 
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setImageFailed(false);
  }, [current]);

  if (slides.length === 0) {
    return (
      <section id="home" className="relative min-h-[50vh] flex items-center justify-center pt-16 bg-white dark:bg-[#040814] transition-colors duration-300">
        <p className="text-slate-800 dark:text-white transition-colors">Hero content coming soon...</p>
      </section>
    );
  }

  const slide = slides[current];

  const goTo = (index: number) => {
    setCurrent((index + slides.length) % slides.length);
  };

  return (
    <section id="home" className="relative min-h-[90vh] sm:min-h-[95vh] flex items-center overflow-hidden pt-16 bg-slate-50 dark:bg-[#040814] transition-colors duration-300">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {!imageFailed && slide.image ? (
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover opacity-100 dark:opacity-70 transition-opacity duration-700"
              loading="eager"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-[#040814] dark:via-[#0f172a] dark:to-[#1e1b4b]" />
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent dark:from-[#040814]/95 dark:via-[#040814]/60 dark:to-transparent transition-colors duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent dark:from-[#040814]/90 dark:via-transparent dark:to-transparent transition-colors duration-300" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-sm font-medium mb-6 backdrop-blur-sm transition-colors"
            >
              <Sparkles size={16} />
              <span>Welcome to the Future of Education</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight drop-shadow-sm dark:drop-shadow-2xl transition-colors">
              {slide.title.split(' ').map((word, i) => (
                <span key={i} className={i % 3 === 0 ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300" : ""}>
                  {word}{' '}
                </span>
              ))}
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed max-w-2xl font-light transition-colors">
              {slide.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onVisit}
                className="group relative px-8 py-4 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 text-base font-bold rounded-xl border border-blue-200 dark:border-blue-500/30 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white hover:border-blue-600 dark:hover:border-blue-500 transition-all shadow-sm dark:shadow-[0_0_15px_rgba(37,99,235,0.1)] hover:shadow-md dark:hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {pageText.heroVisitButton}
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onContact}
                className="px-8 py-4 bg-slate-100/50 dark:bg-white/5 backdrop-blur-md text-slate-800 dark:text-white font-bold rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-sm dark:shadow-xl"
              >
                {pageText.heroContactButton}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {slides.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === current 
                ? 'w-12 bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.5)] dark:shadow-[0_0_10px_rgba(56,189,248,0.8)]' 
                : 'w-3 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-400'
            }`}
          />
        ))}
      </div>

    </section>
  );
}
