'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { resolveImage } from '@/lib/image';

const SLIDE_DEFINITIONS = [
  {
    key: 'trucks',
    match: (filename = '', url = '', ref = '') => {
      const s = `${filename} ${url} ${ref}`.toLowerCase();
      return s.includes('prima') || s.includes('truck') || s.includes('274bd13');
    },
    title: 'COMMERCIAL VEHICLES & FLEET EXPORT',
    subtitle:
      'Prime movers, multi-axle cargo haulers, and heavy tippers certified for immediate worldwide port dispatch.',
    category: 'Commercial Trucks',
    href: '/#catalog',
  },
  {
    key: 'machineries',
    match: (filename = '', url = '', ref = '') => {
      const s = `${filename} ${url} ${ref}`.toLowerCase();
      return s.includes('jcb') || s.includes('machinery') || s.includes('da5c469') || s.includes('equipment');
    },
    title: 'EARTHMOVING & HEAVY MACHINERY',
    subtitle:
      'High-performance hydraulic excavators, backhoe loaders, and road equipment inspected to international standards.',
    category: 'Heavy Equipment',
    href: '/#catalog',
  },
  {
    key: 'buses',
    match: (filename = '', url = '', ref = '') => {
      const s = `${filename} ${url} ${ref}`.toLowerCase();
      return s.includes('1618') || s.includes('bus') || s.includes('420e1a6') || s.includes('lpo');
    },
    title: 'PASSENGER BUSES & STAFF COACHES',
    subtitle:
      'Transit fleets, intercity luxury coaches, and airport shuttles built for demanding climate and terrain.',
    category: 'Passenger Transit',
    href: '/#catalog',
  },
  {
    key: 'agriculture',
    match: (filename = '', url = '', ref = '') => {
      const s = `${filename} ${url} ${ref}`.toLowerCase();
      return s.includes('tractor') || s.includes('agri') || s.includes('950ae68');
    },
    title: 'AGRICULTURAL TRACTORS & IMPLEMENTS',
    subtitle:
      'Modern 4WD tractors from 45HP to 110HP with complete implement packages for large-scale farming.',
    category: 'Agricultural Machinery',
    href: '/#catalog',
  },
];

function buildSlideData(img, idx, defaultTagline) {
  const url = resolveImage(img);
  const ref = img?.asset?._ref || img?.asset?._id || '';
  const filename = img?.asset?.originalFilename || '';

  const matchedDef = SLIDE_DEFINITIONS.find((def) => def.match(filename, url, ref));
  const fallbackDef = SLIDE_DEFINITIONS[idx % SLIDE_DEFINITIONS.length];
  const def = matchedDef || fallbackDef;

  return {
    id: `slide-${idx}-${ref || idx}`,
    url,
    title: def.title,
    subtitle: defaultTagline && !matchedDef ? defaultTagline : def.subtitle,
    category: def.category,
    href: def.href,
  };
}

const DEFAULT_SLIDES = [
  {
    id: 'default-1',
    url: 'https://picsum.photos/seed/nik-heavy-haulage-1610/1920/1200',
    title: 'COMMERCIAL VEHICLES & FLEET EXPORT',
    subtitle: 'Prime movers, multi-axle cargo haulers, and heavy tippers certified for immediate worldwide port dispatch.',
    category: 'Commercial Trucks',
  },
  {
    id: 'default-2',
    url: 'https://picsum.photos/seed/nik-machinery-1610/1920/1200',
    title: 'EARTHMOVING & HEAVY MACHINERY',
    subtitle: 'High-performance hydraulic excavators, wheel loaders, and road equipment inspected to international standards.',
    category: 'Heavy Equipment',
  },
  {
    id: 'default-3',
    url: 'https://picsum.photos/seed/nik-transit-1610/1920/1200',
    title: 'PASSENGER BUSES & STAFF COACHES',
    subtitle: 'Transit fleets, intercity luxury coaches, and airport shuttles built for demanding climate and terrain.',
    category: 'Passenger Transit',
  },
  {
    id: 'default-4',
    url: 'https://picsum.photos/seed/nik-agricultural-1610/1920/1200',
    title: 'AGRICULTURAL TRACTORS & IMPLEMENTS',
    subtitle: 'Modern 4WD tractors from 45HP to 110HP with complete implement packages for large-scale farming.',
    category: 'Agricultural Machinery',
  },
];

export default function HeroSlider({ images, tagline }) {
  const slides = useMemo(() => {
    if (Array.isArray(images) && images.length > 0) {
      return images.map((img, idx) => buildSlideData(img, idx, tagline));
    }
    return DEFAULT_SLIDES;
  }, [images, tagline]);

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || isPaused || prefersReducedMotion) return;
    const interval = setInterval(next, 6500);
    return () => clearInterval(interval);
  }, [next, slides.length, isPaused, prefersReducedMotion]);

  const safeIndex = index % slides.length;
  const currentSlide = slides[safeIndex] || slides[0];

  return (
    <section
      id="hero-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full aspect-[16/10] min-h-[520px] max-h-[88vh] overflow-hidden bg-[#0e1724] select-none"
    >
      {/* 16:10 Aspect Ratio Background Photography Slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === safeIndex ? 1 : 0 }}
          aria-hidden={i !== safeIndex}
        >
          <Image
            src={slide.url}
            alt={slide.title}
            fill
            priority={i === 0}
            referrerPolicy="no-referrer"
            className="object-cover object-center transform scale-102 transition-transform duration-10000 ease-out"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c141f]/85 via-[#0c141f]/50 to-transparent" />
        </div>
      ))}

      {/* Main Hero Content - Synced with Current Slide */}
      <div className="relative z-10 mx-auto max-w-7xl h-full px-5 md:px-8 flex flex-col justify-center pt-20 md:pt-24 pb-12">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`slide-content-${safeIndex}-${currentSlide.title}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: prefersReducedMotion ? 0.05 : 0.45, ease: 'easeInOut' }}
            >
              <h1 className="font-display text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-white leading-[1.1] drop-shadow-xl">
                {currentSlide?.title?.split('&')[0]}{' '}
                {currentSlide?.title?.includes('&') && (
                  <span className="text-[#D5B57A] drop-shadow">
                    &amp; {currentSlide?.title?.split('&').slice(1).join('&')}
                  </span>
                )}
              </h1>

              <p className="mt-3 md:mt-4 text-xs sm:text-sm md:text-base text-[#F3F1EA]/95 font-light leading-relaxed max-w-xl drop-shadow-md">
                {currentSlide?.subtitle ||
                  tagline ||
                  'Supplying commercial trucks, passenger buses, agricultural machinery, and heavy equipment to over 100+ countries.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide Navigation Controls */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/40 hover:bg-[#B69255] hover:border-[#B69255] text-white border border-white/20 rounded-full items-center justify-center transition-all duration-200 backdrop-blur-sm cursor-pointer hidden md:flex"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/40 hover:bg-[#B69255] hover:border-[#B69255] text-white border border-white/20 rounded-full items-center justify-center transition-all duration-200 backdrop-blur-sm cursor-pointer hidden md:flex"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators / Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {slides.map((s, i) => (
            <button
              key={`dot-${s.id}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === safeIndex ? 'w-7 bg-[#D5B57A]' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
