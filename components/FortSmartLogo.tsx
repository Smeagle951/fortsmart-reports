'use client';

import React, { useState } from 'react';

interface FortSmartLogoProps {
  size?: number;
  className?: string;
}

/** Logo FortSmart Agro – usa imagem do aplicativo; fallback SVG se não carregar */
export default function FortSmartLogo({ size = 48, className = '' }: FortSmartLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden
      >
        <rect width="48" height="48" rx="10" fill="url(#fs-logo-gradient)" />
        <path
          d="M34 16C16 20 11 33 11 33S10 44 24 44s13-11 13-11S32 20 34 16z"
          fill="white"
          opacity="0.95"
        />
        <defs>
          <linearGradient id="fs-logo-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1B5E20" />
            <stop offset="1" stopColor="#2E7D32" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 10,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        padding: 4,
      }}
      className={className}
    >
      <img
        src="/FortSmart.png"
        alt="FortSmart Agro"
        width={size - 8}
        height={size - 8}
        style={{ objectFit: 'contain', display: 'block' }}
        onError={() => setImgError(true)}
      />
    </span>
  );
}
