'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { ArrowRight } from 'lucide-react';

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export default function Header({ settings }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const rawWhatsapp = settings?.socialLinks?.whatsapp;
  const whatsappUrl = rawWhatsapp
    ? (rawWhatsapp.startsWith('http') ? rawWhatsapp : `https://wa.me/${rawWhatsapp.replace(/[^0-9]/g, '')}`)
    : 'https://wa.me/971506988527';

  // scrollProgress ranges from 0 (at top of page) to 1 (at or past 50% scroll threshold)
  const [scrollProgress, setScrollProgress] = useState(isHomePage ? 0 : 1);
  const [isPast50Percent, setIsPast50Percent] = useState(!isHomePage);

  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    const handleScroll = () => {
      const heroElement = document.getElementById('hero-section');
      const heroHeight = heroElement ? heroElement.offsetHeight : window.innerHeight * 0.75;
      const scrollY = window.scrollY;

      // 50% of hero height threshold
      const halfHero = heroHeight * 0.5;

      // Calculate smooth gradient progress between 0 and 1
      const progress = Math.min(Math.max(scrollY / halfHero, 0), 1);
      setScrollProgress(progress);

      // Transition to colored logo and white navbar at 50% or more scroll
      setIsPast50Percent(scrollY >= halfHero);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isHomePage]);

  const isWhiteNav = !isHomePage || isPast50Percent;
  const isTransparent = isHomePage && scrollProgress === 0;

  // Compute dynamic inline style for smooth gradient transition while scrolling
  const getHeaderStyle = () => {
    if (!isHomePage || isWhiteNav) {
      return {};
    }
    if (isTransparent) {
      return {
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        borderColor: 'transparent',
        boxShadow: 'none',
      };
    }
    // Gaining gradient as user scrolls slowly towards 50%
    const opacity = scrollProgress;
    return {
      background: `linear-gradient(180deg, rgba(19, 34, 56, ${0.85 * opacity}) 0%, rgba(19, 34, 56, ${0.45 * opacity}) 70%, rgba(255, 255, 255, ${0.15 * opacity}) 100%)`,
      backdropFilter: `blur(${Math.round(8 * opacity)}px)`,
      WebkitBackdropFilter: `blur(${Math.round(8 * opacity)}px)`,
      borderBottom: `1px solid rgba(255, 255, 255, ${0.15 * opacity})`,
      boxShadow: `0 4px 20px -2px rgba(0, 0, 0, ${0.15 * opacity})`,
    };
  };

  return (
    <header
      style={getHeaderStyle()}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isWhiteNav
          ? 'bg-white/80 backdrop-blur-md text-steel shadow-sm border-b border-gray-200/50 py-1'
          : isTransparent
          ? 'bg-transparent text-white border-b border-transparent py-1.5'
          : 'py-1 text-white'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between">
        {/* Brand Logo: White when transparent or <50% scroll; Colored when >=50% scroll */}
        <Link
          href="/"
          className="inline-flex items-center transition-transform duration-200 hover:scale-102"
          aria-label="SSG MOTORS Home"
        >
          <Logo
            isWhite={!isWhiteNav}
            className="h-14 md:h-16 w-auto"
          />
        </Link>

        {/* Action Buttons: WhatsApp & Request a Quote */}
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            title="Chat on WhatsApp"
            className={`inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full transition-all duration-300 cursor-pointer ${
              isWhiteNav
                ? 'text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white shadow-sm hover:shadow-md hover:scale-105'
                : 'text-white bg-white/15 backdrop-blur-md border border-white/40 hover:bg-[#25D366] hover:border-[#25D366] hover:text-white shadow-md hover:scale-105'
            }`}
          >
            <WhatsAppIcon className="w-4 h-4 md:w-4.5 md:h-4.5 fill-current transition-colors duration-300" />
          </a>

          <Link
            href="/contact"
            className={`mono-label text-xs uppercase font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-sm transition-all duration-200 tracking-wider flex items-center gap-2 group cursor-pointer ${
              isWhiteNav
                ? 'bg-[#B69255] hover:bg-[#9E7A3F] text-white shadow-md hover:shadow-lg'
                : 'bg-white/15 backdrop-blur-md text-white border border-white/40 hover:bg-[#B69255] hover:border-[#B69255] hover:text-white shadow-lg'
            }`}
          >
            <span>Request a Quote</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
