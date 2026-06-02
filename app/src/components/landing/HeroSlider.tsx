import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setImageFailed(false);
  }, [current]);

  if (slides.length === 0) {
    return (
      <section id="home" className="relative min-h-[50vh] flex items-center justify-center pt-16 bg-[#1a2b4a]">
        <p className="text-white">Hero content coming soon...</p>
      </section>
    );
  }

  const slide = slides[current];

  const goTo = (index: number) => {
    setCurrent((index + slides.length) % slides.length);
  };

  return (
    <section id="home" className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden pt-16 bg-[#1a2b4a]">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {!imageFailed && slide.image ? (
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading="eager"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a2b4a] via-[#243656] to-[#334155]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a2b4a]/95 via-[#1a2b4a]/85 to-[#1a2b4a]/75" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              {slide.title}
            </h1>
            <p className="text-base sm:text-lg text-[#cbd5e1] mb-8 leading-relaxed">
              {slide.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={onVisit}
                className="px-8 py-3 bg-[#3b82f6] text-white font-semibold rounded-lg hover:bg-[#2563eb] transition-colors shadow-lg"
              >
                {pageText.heroVisitButton}
              </button>
              <button
                type="button"
                onClick={onContact}
                className="px-8 py-3 bg-white/10 backdrop-blur text-white font-semibold rounded-lg border border-white/30 hover:bg-white/20 transition-colors"
              >
                {pageText.heroContactButton}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all ${
              index === current ? 'w-8 bg-[#3b82f6]' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(current - 1)}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        onClick={() => goTo(current + 1)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>
    </section>
  );
};
