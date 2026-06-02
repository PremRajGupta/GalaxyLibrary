import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ImageOff } from 'lucide-react';
import type { GalleryImage, PageText } from '../../data/landingContent';

type GallerySectionProps = {
  images: GalleryImage[];
  pageText: PageText;
};

function GalleryTile({
  image,
  index,
  onSelect,
}: {
  image: GalleryImage;
  index: number;
  onSelect: () => void;
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const hasSrc = Boolean(image.src?.trim());

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      onClick={onSelect}
      disabled={!hasSrc || loadFailed}
      className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow text-left disabled:cursor-not-allowed disabled:opacity-70 bg-[#e2e8f0]"
    >
      {hasSrc && !loadFailed ? (
        <img
          src={image.src}
          alt={image.alt || image.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-[#64748b] p-4">
          <ImageOff size={32} className="mb-2 opacity-60" />
          <span className="text-xs text-center">{loadFailed ? 'Image failed to load' : 'No image URL'}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between pointer-events-none">
        <p className="text-white font-semibold text-sm">{image.title}</p>
        {hasSrc && !loadFailed && (
          <ZoomIn className="text-white/80 group-hover:text-white transition-colors shrink-0" size={20} />
        )}
      </div>
    </motion.button>
  );
}

export default function GallerySection({ images, pageText }: GallerySectionProps) {
  const [selected, setSelected] = useState<GalleryImage | null>(null);
  const visibleImages = images.filter((img) => img.src?.trim());

  return (
    <section id="gallery" className="py-16 sm:py-20 bg-[#f1f5f9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-3">{pageText.galleryTitle}</h2>
          <p className="text-[#64748b] max-w-2xl mx-auto">{pageText.gallerySubtitle}</p>
        </div>

        {visibleImages.length === 0 ? (
          <p className="text-center text-[#64748b] text-sm py-12">
            Gallery images will appear here after you add image URLs in Website Settings.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleImages.map((image, index) => (
              <GalleryTile
                key={image.id}
                image={image}
                index={index}
                onSelect={() => setSelected(image)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && selected.src?.trim() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full"
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-[#3b82f6] transition-colors"
                aria-label="Close image"
              >
                <X size={28} />
              </button>
              <img
                src={selected.src}
                alt={selected.alt || selected.title}
                className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-[#1e293b]"
              />
              <p className="text-center text-white mt-4 text-lg font-medium">{selected.title}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
