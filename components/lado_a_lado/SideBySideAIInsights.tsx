'use client';

import { Sparkles } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { FS } from '@/lib/lado-a-lado-official/theme';

export default function SideBySideAIInsights({ data }: { data: SideBySideReportData }) {
  const ai = data.decision_layer?.fortsmart_ai as
    | {
        summary?: string;
        recommendation?: string;
        risks?: string[];
        opportunities?: string[];
        confidencePct?: number;
      }
    | undefined;

  const bullets: string[] = [];
  if (ai?.summary?.trim()) bullets.push(ai.summary.trim());
  if (ai?.recommendation?.trim()) bullets.push(ai.recommendation.trim());
  for (const r of ai?.risks ?? []) if (r?.trim()) bullets.push(`Risco: ${r.trim()}`);
  for (const o of ai?.opportunities ?? []) if (o?.trim()) bullets.push(`Oportunidade: ${o.trim()}`);

  if (bullets.length === 0 && data.conclusion?.summary) {
    bullets.push(data.conclusion.summary);
  }
  if (bullets.length === 0) return null;

  const conf = ai?.confidencePct ?? data.meta?.confidenceScore;

  return (
    <section className="fs-section">
      <div className="fs-official-card border border-[#E5E7EB] bg-[#F8FAFC] p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" style={{ color: FS.green }} />
          <h2 className="text-lg font-bold text-[#111827]">FortSmart IA — Insights</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#374151]">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2E7D32]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {conf != null && Number.isFinite(conf) ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs font-semibold text-[#6B7280]">
              <span>Confiança da análise</span>
              <span>{Math.round(conf)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, conf)}%`, background: FS.green }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
