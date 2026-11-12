'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Logo({
  isWhite = false,
  className = 'h-11 sm:h-12 md:h-14 w-auto',
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
        className={`absolute inset-0 flex items-center transition-opacity duration-300 ease-in-out ${
          isWhite ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Image
          src="/logo.png"
          alt="Nik Exports"
          width={2247}
          height={538}
          priority={priority}
          unoptimized
          className="h-full w-auto object-contain drop-shadow-sm"
        />
      </div>

      {/* White Logo - active when transparent navbar is at top or in dark footer */}
      <div
        className={`absolute inset-0 flex items-center transition-opacity duration-300 ease-in-out ${
          isWhite ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {!whiteImgError ? (
          <Image
            src="/white-logo.png"
            alt="Nik Exports"
            width={2247}
            height={538}
            priority={priority}
            unoptimized
            onError={() => setWhiteImgError(true)}
            className="h-full w-auto object-contain drop-shadow-md"
          />
        ) : (
          <Image
            src="/logo.png"
            alt="Nik Exports"
            width={2247}
            height={538}
            priority={priority}
            unoptimized
            className="h-full w-auto object-contain drop-shadow-md brightness-0 invert"
          />
        )}
      </div>

      {/* Invisible layout anchor keeping the container sized exactly to intrinsic aspect ratio */}
      <div className="h-full w-auto invisible pointer-events-none opacity-0 select-none flex items-center">
        <Image
          src="/logo.png"
          alt=""
          width={2247}
          height={538}
          priority={false}
          unoptimized
          aria-hidden="true"
          className="h-full w-auto object-contain opacity-0"
        />
      </div>
    </div>
  );
}
