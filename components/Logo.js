'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Logo({
  isWhite = false,
  className = 'h-[31px] sm:h-[34px] md:h-[39px] w-auto',
  priority = true,
}) {
  const [whiteImgError, setWhiteImgError] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center select-none ${className}`}
      style={{ aspectRatio: '2247 / 538' }}
    >
      {/* Colored Logo (Navy Blue & Gold) - active when navbar is scrolled or on light backgrounds */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
          isWhite ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Image
          src="/logo.png"
          alt="Nik Exports"
          fill
          sizes="(max-width: 768px) 160px, 200px"
          priority={priority}
          referrerPolicy="no-referrer"
          className="object-contain object-left drop-shadow-sm"
        />
      </div>

      {/* White Logo - active when transparent navbar is at top or in dark footer */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
          isWhite ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {!whiteImgError ? (
          <Image
            src="/white-logo.png"
            alt="Nik Exports"
            fill
            sizes="(max-width: 768px) 160px, 200px"
            priority={priority}
            referrerPolicy="no-referrer"
            onError={() => setWhiteImgError(true)}
            className="object-contain object-left drop-shadow-md"
          />
        ) : (
          <Image
            src="/logo.png"
            alt="Nik Exports"
            fill
            sizes="(max-width: 768px) 160px, 200px"
            priority={priority}
            referrerPolicy="no-referrer"
            className="object-contain object-left drop-shadow-md brightness-0 invert"
          />
        )}
      </div>
    </div>
  );
}
