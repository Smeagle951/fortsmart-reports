'use client';

/**
 * Indicador circular 0–100 para o herói (performanceScore publicado).
 */
export default function ScoreGauge({
  value,
  max = 100,
  size = 140,
}: {
  value: number;
  max?: number;
  size?: number;
}) {
  const pct = Math.min(1, Math.max(0, value / max));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const gap = c - dash;

  const hue = pct < 0.4 ? 0 : pct < 0.7 ? 38 : 145;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="block">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`hsl(${hue} 75% 52%)`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-3xl font-bold tabular-nums text-white leading-none">
            {Math.round(value)}
            <span className="text-lg font-semibold text-white/50">/{max}</span>
          </p>
        </div>
      </div>
      <p className="mt-3 text-[10px] text-white/45 text-center leading-tight max-w-[11rem]">
        0–40 atenção · 41–70 médio · acima de 70 forte
      </p>
    </div>
  );
}
