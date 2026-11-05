'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { resolveImage } from '@/lib/image';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function TestimonialImageCarousel({ photos, customerName }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Maximum 4 pictures
  const displayPhotos = (photos && photos.length > 0 ? photos : ['https://picsum.photos/seed/customer/800/800']).slice(0, 4);

  // Auto-advance pictures every 2 seconds when not hovered
  useEffect(() => {
    if (displayPhotos.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setPhotoIndex((prev) => (prev === displayPhotos.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [displayPhotos.length, isHovered]);

  const prevPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev === 0 ? displayPhotos.length - 1 : prev - 1));
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev === displayPhotos.length - 1 ? 0 : prev + 1));
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Immediately move to next picture as soon as the user exits the picture zone
    if (displayPhotos.length > 1) {
      setPhotoIndex((prev) => (prev === displayPhotos.length - 1 ? 0 : prev + 1));
    }
  };

  const currentPhoto = resolveImage(displayPhotos[photoIndex], 1000);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full bg-[#0B1522] overflow-hidden flex items-center justify-center group select-none"
    >
      {/* Ambient background blur for cinematic depth while keeping foreground 100% fitted */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 filter blur-2xl scale-125">
        <Image
          src={currentPhoto}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="object-cover"
        />
      </div>

      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none z-[1]" />

      {/* Foreground Fitted Image - completely fitted with object-contain, never stretched or cropped */}
      <div className="relative w-full h-full p-4 sm:p-6 md:p-8 flex items-center justify-center z-[2]">
        <Image
          src={currentPhoto}
          alt={`${customerName || 'Customer'} testimonial`}
          fill
          referrerPolicy="no-referrer"
          className="object-contain p-2 transition-all duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Prev / Next controls for photo carousel */}
      {displayPhotos.length > 1 && (
        <>
          <div className="absolute inset-y-0 left-0 flex items-center px-3 z-10 pointer-events-none">
            <button
              onClick={prevPhoto}
              aria-label="Previous customer photo"
              className="pointer-events-auto w-9 h-9 rounded-full bg-steel/80 hover:bg-amber text-white hover:text-steel flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 z-10 pointer-events-none">
            <button
              onClick={nextPhoto}
              aria-label="Next customer photo"
              className="pointer-events-auto w-9 h-9 rounded-full bg-steel/80 hover:bg-amber text-white hover:text-steel flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots Indicator for images */}
          <div className="absolute bottom-3 sm:bottom-4 inset-x-0 flex justify-center gap-2 z-10">
            {displayPhotos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoIndex(i);
                }}
                aria-label={`View photo ${i + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === photoIndex ? 'w-6 bg-amber' : 'w-2 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Dynamically compute responsive font sizing based on quote length
function getQuoteFontSize(quote = '') {
  const len = quote.trim().length;
  if (len <= 80) {
    return 'text-2xl sm:text-3xl lg:text-[28px] xl:text-3xl leading-snug';
  }
  if (len <= 140) {
    return 'text-xl sm:text-2xl lg:text-2xl leading-relaxed';
  }
  if (len <= 220) {
    return 'text-lg sm:text-xl lg:text-xl leading-relaxed';
  }
  if (len <= 320) {
    return 'text-base sm:text-lg lg:text-lg leading-relaxed';
  }
  return 'text-sm sm:text-base lg:text-base leading-normal';
}

export default function TestimonialCarousel({ testimonials }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Sort basis position numbering system (1, 2, 3...)
  const sortedTestimonials = [...(testimonials || [])].sort((a, b) => {
    const hasA = a.order !== undefined && a.order !== null && a.order !== '';
    const hasB = b.order !== undefined && b.order !== null && b.order !== '';
    const orderA = hasA ? Number(a.order) : Infinity;
    const orderB = hasB ? Number(b.order) : Infinity;
    return orderA - orderB;
  });

  const total = sortedTestimonials.length;

  // Auto-advance entire testimonial carousel every 3 seconds
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [total, isPaused]);

  if (!total) return null;

  const current = sortedTestimonials[currentIndex];
  const isAlternate = currentIndex % 2 !== 0;

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  return (
    <section className="bg-freight text-paper py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Header with Navigation & Progress Indicators */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-paper/10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber mono-label text-xs uppercase font-bold tracking-wider mb-2">
              <span>■</span> Global Client Trust
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight">
              What Our Customers Say
            </h2>
          </div>

          {/* Testimonial Nav Arrows, Pagination Bars and Counter */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Quick jump pagination bars */}
            <div className="flex items-center gap-1.5 mr-2">
              {sortedTestimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to testimonial ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? 'w-7 bg-amber'
                      : 'w-2 bg-paper/30 hover:bg-paper/60'
                  }`}
                />
              ))}
            </div>

            <span className="mono-label text-sm text-paper/70 font-semibold mr-1">
              {currentIndex + 1} / {total}
            </span>
            <button
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
              className="w-11 h-11 rounded-lg border border-paper/30 hover:bg-amber hover:text-steel hover:border-amber flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextTestimonial}
              aria-label="Next testimonial"
              className="w-11 h-11 rounded-lg border border-paper/30 hover:bg-amber hover:text-steel hover:border-amber flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Outer Fixed-Height Container to prevent layout shift during transitions */}
        <div className="relative w-full h-[640px] sm:h-[600px] lg:h-[480px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={`testimonial-${current._id || currentIndex}`}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="w-full h-full bg-paper text-steel rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-line"
            >
              {/* Image Carousel Column - Left on even slides, Right on alternate slides */}
              <div
                className={`lg:col-span-6 xl:col-span-6 h-[270px] sm:h-[280px] lg:h-full overflow-hidden order-1 ${
                  isAlternate ? 'lg:order-2' : 'lg:order-1'
                }`}
              >
                <TestimonialImageCarousel
                  key={`carousel-${current._id || currentIndex}`}
                  photos={current.photos}
                  customerName={current.customerName}
                />
              </div>

              {/* Text & Quote Column - Right on even slides, Left on alternate slides */}
              <div
                className={`lg:col-span-6 xl:col-span-6 h-[370px] sm:h-[320px] lg:h-full p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between bg-paper overflow-hidden order-2 ${
                  isAlternate
                    ? 'lg:order-1 lg:border-r border-line/60'
                    : 'lg:order-2 lg:border-l border-line/60'
                }`}
              >
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4 shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber/15 text-amber-dark flex items-center justify-center">
                      <Quote className="w-5 h-5 sm:w-6 sm:h-6 fill-amber/30" />
                    </div>
                    <span className="mono-label text-[11px] font-bold uppercase tracking-wider text-steel/60 bg-steel/5 px-2.5 py-1 rounded-md border border-steel/10">
                      Story 0{currentIndex + 1}
                    </span>
                  </div>

                  {/* Quote text container that accommodates text without expanding or jumping the card */}
                  <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                    <blockquote
                      className={`font-sans text-steel font-medium transition-all ${getQuoteFontSize(
                        current.quote
                      )}`}
                    >
                      &ldquo;{current.quote}&rdquo;
                    </blockquote>
                  </div>
                </div>

                {/* Customer Details Footer (pinned cleanly to the bottom) */}
                <div className="pt-4 sm:pt-6 mt-3 border-t border-line/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div>
                    <p className="font-display text-lg sm:text-2xl font-bold text-steel">
                      {current.customerName}
                    </p>
                    {current.customerDetail && (
                      <p className="mono-label text-xs uppercase font-semibold text-amber-dark tracking-wider mt-0.5">
                        {current.customerDetail}
                      </p>
                    )}
                  </div>

                  {/* Verified Export Badge */}
                  <div className="flex items-center gap-2 bg-steel/5 px-3 py-1.5 rounded-lg border border-steel/10 self-start sm:self-auto shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="mono-label text-[11px] uppercase font-bold text-steel tracking-wide">
                      Verified Client
                    </span>
                  </div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
