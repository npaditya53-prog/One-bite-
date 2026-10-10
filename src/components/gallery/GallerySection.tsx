import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { GalleryItem } from '../../types/index.ts';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles } from 'lucide-react';

interface GallerySectionProps {
  id?: string;
  isStandalonePage?: boolean;
}

export function GallerySection({ id = 'gallery', isStandalonePage = false }: GallerySectionProps) {
  const { gallery } = useRestaurant();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['All', 'Food', 'Interior', 'Exterior', 'Ambience', 'Other'];

  const filteredPhotos = useMemo(() => {
    if (selectedCategory === 'All') return gallery;
    return gallery.filter(item => item.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [gallery, selectedCategory]);

  const activePhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  const handlePrev = useCallback(() => {
    if (lightboxIndex !== null && filteredPhotos.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  }, [lightboxIndex, filteredPhotos.length]);

  const handleNext = useCallback(() => {
    if (lightboxIndex !== null && filteredPhotos.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
    }
  }, [lightboxIndex, filteredPhotos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handlePrev, handleNext]);

  return (
    <section id={id} className={`py-16 sm:py-24 bg-white border-b border-stone-200/80 ${isStandalonePage ? 'pt-28' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-bold mb-2">
            Visual Experience
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Restaurant Gallery
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            A glimpse into our freshly prepared dishes, cozy dining atmosphere, and vibrant outlet at Bagaha Dhala Road.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative rounded-2xl overflow-hidden aspect-4/3 bg-stone-100 cursor-pointer shadow-xs hover:shadow-lg transition-all duration-300"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || 'One Bite restaurant photo'}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end text-white">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                    <span>{photo.category}</span>
                    {photo.featured && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Featured
                        </span>
                      </>
                    )}
                  </div>
                  {photo.caption && (
                    <p className="text-xs text-stone-100 line-clamp-2">{photo.caption}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-stone-50 rounded-2xl border border-stone-200 p-8 max-w-md mx-auto">
            <ImageIcon className="w-8 h-8 text-stone-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-stone-600">No photos in this category yet.</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={e => {
            if (e.target === e.currentTarget) setLightboxIndex(null);
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 hover:text-white transition-colors"
            aria-label="Close photo view"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous button */}
          {filteredPhotos.length > 1 && (
            <button
              onClick={e => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 hover:text-white transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next button */}
          {filteredPhotos.length > 1 && (
            <button
              onClick={e => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 hover:text-white transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Lightbox content */}
          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={activePhoto.imageUrl}
              alt={activePhoto.caption || 'One Bite gallery image'}
              className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-4 text-center">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block mb-1">
                {activePhoto.category} · {lightboxIndex + 1} of {filteredPhotos.length}
              </span>
              {activePhoto.caption && (
                <p className="text-sm text-stone-200 max-w-xl mx-auto">{activePhoto.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
