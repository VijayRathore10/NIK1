'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { resolveImage } from '@/lib/image';
import { ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon } from 'lucide-react';

export default function ImageCarousel({ images = [], alt }) {
  const [index, setIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const safeImages = Array.isArray(images) && images.length > 0
    ? images.filter(Boolean)
    : ['https://picsum.photos/seed/vehicle/1920/1080'];

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % safeImages.length);
  }, [safeImages.length]);

  // Keyboard navigation for carousel and lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') setIsLightboxOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prev, next]);

  const currentImg = resolveImage(safeImages[index], 1920);

  return (
    <div className="w-full">
      {/* Main Full-Width Cinematic Vehicle Showcase Stage */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[340px] sm:min-h-[440px] lg:min-h-[520px] max-h-[720px] bg-[#0E1724] rounded-2xl border border-line/80 overflow-hidden shadow-2xl group select-none">
        {/* Ambient Blurred Background for Immersive Atmosphere */}
        <div className="absolute inset-0 overflow-hidden opacity-30 blur-3xl scale-110 pointer-events-none">
          <Image
            src={currentImg}
            alt=""
            fill
            referrerPolicy="no-referrer"
            className="object-cover"
          />
        </div>

        {/* Foreground Full-Vehicle Display (object-contain ensures zero cropped parts) */}
        <div className="relative w-full h-full flex items-center justify-center p-3 sm:p-6 md:p-8">
          <Image
            src={currentImg}
            alt={`${alt || 'Commercial Vehicle'} — photo ${index + 1}`}
            fill
            referrerPolicy="no-referrer"
            className="object-contain drop-shadow-2xl transition-opacity duration-300"
            priority={index === 0}
          />
        </div>

        {/* Navigation Arrows */}
        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-950/75 hover:bg-[#B69255] text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-xl hover:scale-105 cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-950/75 hover:bg-[#B69255] text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-xl hover:scale-105 cursor-pointer z-10"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Top-Right Action Controls (Fullscreen Zoom) */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="View Fullscreen"
            className="p-2 sm:p-2.5 rounded-full bg-slate-950/75 hover:bg-[#B69255] text-white border border-white/20 backdrop-blur-md transition-all shadow-lg hover:scale-105 cursor-pointer"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Metadata Badges */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-5 right-3 sm:right-5 flex items-center justify-between pointer-events-none z-10">
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/75 text-white/90 px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Pre-Shipment Inspection Verified</span>
          </div>

          <div className="mono-label text-[11px] sm:text-xs font-bold bg-slate-950/85 text-amber-300 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md flex items-center gap-1.5 shadow-md ml-auto">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>
              {index + 1} / {safeImages.length} {safeImages.length === 1 ? 'Photo' : 'Photos'}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Thumbnails Carousel Ribbon */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto py-3.5 px-1 scrollbar-thin scrollbar-thumb-slate-400/40">
          {safeImages.map((img, i) => {
            const thumbUrl = resolveImage(img, 300);
            const isSelected = i === index;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Switch to photo ${i + 1}`}
                className={`relative w-20 h-14 sm:w-28 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-slate-900 ${
                  isSelected
                    ? 'border-[#B69255] ring-2 ring-[#B69255]/50 scale-102 shadow-md'
                    : 'border-slate-300/80 hover:border-slate-400 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={thumbUrl}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono text-white px-1.5 py-0.2 rounded">
                  #{i + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0">
            <div>
              <h3 className="font-display text-lg font-bold tracking-wide">
                {alt || 'Vehicle Photography'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Image {index + 1} of {safeImages.length} · Press ESC to close
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close Fullscreen"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Center Image */}
          <div className="relative flex-1 w-full my-4 flex items-center justify-center">
            <Image
              src={currentImg}
              alt={`${alt || 'Vehicle'} — fullscreen`}
              fill
              referrerPolicy="no-referrer"
              className="object-contain"
            />

            {safeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous image"
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-[#B69255] text-white transition-all cursor-pointer border border-white/20"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next image"
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-[#B69255] text-white transition-all cursor-pointer border border-white/20"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Footer Thumbnails */}
          {safeImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 shrink-0">
              {safeImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    i === index ? 'border-[#B69255] scale-105' : 'border-white/20 opacity-60'
                  }`}
                >
                  <Image
                    src={resolveImage(img, 150)}
                    alt=""
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
