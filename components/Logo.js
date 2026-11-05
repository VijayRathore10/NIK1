'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Logo({ isWhite = false, className = "h-16 md:h-20 w-auto" }) {
  const [whiteImgError, setWhiteImgError] = useState(false);

  return (
    <div className={`relative inline-flex items-center select-none overflow-hidden ${className}`}>
      {/* Colored Logo */}
      <div
        className={`transition-opacity duration-300 flex items-center ${
          isWhite ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 relative'
        }`}
      >
        <Image
          src="/logo.png"
          alt="SSG MOTORS"
          width={2816}
          height={1536}
          priority
          unoptimized
          className="h-16 md:h-20 w-auto object-contain drop-shadow-sm scale-110"
        />
      </div>

      {/* White Logo with automatic CSS fallback if file is missing in production */}
      <div
        className={`transition-opacity duration-300 flex items-center ${
          isWhite ? 'opacity-100 relative' : 'opacity-0 pointer-events-none absolute inset-0'
        }`}
      >
        {!whiteImgError ? (
          <Image
            src="/white-logo.png"
            alt="SSG MOTORS"
            width={677}
            height={369}
            priority
            unoptimized
            onError={() => setWhiteImgError(true)}
            className="h-16 md:h-20 w-auto object-contain drop-shadow-md scale-110"
          />
        ) : (
          /* Robust fallback: uses logo.png with full white filter */
          <Image
            src="/logo.png"
            alt="SSG MOTORS"
            width={2816}
            height={1536}
            priority
            unoptimized
            className="h-16 md:h-20 w-auto object-contain drop-shadow-md scale-110 brightness-0 invert"
          />
        )}
      </div>
    </div>
  );
}

