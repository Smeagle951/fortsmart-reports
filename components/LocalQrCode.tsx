'use client';

import { useEffect, useState } from 'react';

type LocalQrCodeProps = {
  data: string;
  size?: number;
  alt?: string;
  className?: string;
};

/**
 * QR gerado no browser (canvas) — não envia URL/token a terceiros (LGPD).
 */
export function LocalQrCode({
  data,
  size = 120,
  alt = 'QR Code',
  className,
}: LocalQrCodeProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const value = data.trim();
    if (!value) {
      setSrc(null);
      return;
    }

    (async () => {
      try {
        const QR = await import('qrcode');
        const url = await QR.toDataURL(value, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f172a', light: '#ffffff' },
        });
        if (!cancelled) setSrc(url);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data, size]);

  if (!src) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={size} height={size} className={className} />;
}
