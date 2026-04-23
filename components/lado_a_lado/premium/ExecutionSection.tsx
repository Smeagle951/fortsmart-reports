'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ReportApplicationEventV2Json } from '@/types/side-by-side-report';
import { formatWind } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatDate, formatNumber } from '@/utils/format';
import PremiumSectionShell from './PremiumSectionShell';

function protocolBadge(ev: ReportApplicationEventV2Json): { label: string; ok: boolean } {
  const prods = ev.products ?? [];
  if (prods.length === 0) return { label: 'Sem produtos no registro', ok: true };
  const linked = prods.filter((p) => p.linkedProtocolItemId?.trim()).length;
  if (linked === prods.length) return { label: 'Seguiu protocolo', ok: true };
  if (linked === 0) return { label: 'Sem vínculo ao protocolo', ok: false };
  return { label: 'Parcial ao protocolo', ok: false };
}

export default function ExecutionSection({ data }: { data: SideBySideReportData }) {
  const apps = data.applications ?? [];
  const legacy = data.aplicacoes ?? [];

  if (apps.length === 0 && legacy.length > 0) {
    return (
      <PremiumSectionShell
        id="execucao-premium"
        eyebrow="Registros de aplicação"
        title="Execução em campo"
        subtitle="Formato resumido. A linha do tempo completa (clima, DAA, vínculo ao protocolo) aparece quando houver registros detalhados de aplicações."
      >
        <ul className="space-y-3">
          {legacy.map((a, i) => (
            <li key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
              <span className="font-semibold text-slate-900">{a.data ? formatDate(a.data) : '—'}</span>
              <span className="text-slate-600"> · {a.tipo || 'Aplicação'}</span>
              {a.produtos ? <p className="mt-1 text-slate-700">{a.produtos}</p> : null}
            </li>
          ))}
        </ul>
      </PremiumSectionShell>
    );
  }

  if (apps.length === 0) return null;

  const sorted = [...apps].sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    return da.localeCompare(db);
  });

  return (
    <PremiumSectionShell
      id="execucao-premium"
      eyebrow="Registros de aplicação"
      title="Execução em campo"
      subtitle="Linha do tempo das aplicações: data, DAA, lado, clima, tecnologia e aderência ao protocolo quando o evento publica vínculo ao item planejado."
    >
      <div className="relative max-w-3xl mx-auto pl-2 sm:pl-4">
        <div className="absolute left-[11px] sm:left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 via-emerald-200 to-slate-200 rounded-full" aria-hidden />
        <ul className="space-y-6">
          {sorted.map((ev, i) => {
            const c = ev.climate;
            const t = ev.applicationTech;
            const badge = protocolBadge(ev);
            return (
              <motion.li
                key={ev.id || `${ev.date}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                className="relative pl-10 sm:pl-12"
              >
                <div
                  className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow ${
                    ev.side === 'A' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}
                />
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold text-slate-900">{ev.date ? formatDate(ev.date) : '—'}</span>
                    {ev.daa != null && (
                      <span className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded-md">{ev.daa} DAA</span>
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        ev.side === 'A' ? 'bg-blue-100 text-blue-900' : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      Manejo {ev.side}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-800">{ev.type || 'Aplicação'}</p>
                  {c && (c.temperature != null || c.humidity != null || c.wind != null) && (
                    <p className="mt-2 text-xs text-slate-600">
                      <span aria-hidden>🌡 </span>
                      {[
                        c.temperature != null ? `${c.temperature}°C` : null,
                        c.humidity != null ? `${c.humidity}%` : null,
                        c.wind != null ? `Vento ${formatWind(c.wind)}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  {(t?.bico != null || t?.vazao != null || t?.pressao != null) && (
                    <p className="mt-1 text-xs text-slate-600">
                      <span aria-hidden>⚙ </span>
                      {[t?.bico && `Bico ${t.bico}`, t?.vazao != null && `Vazão ${t.vazao} L/min`, t?.pressao != null && `Pressão ${t.pressao}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  {ev.products && ev.products.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {ev.products.map((p, j) => (
                        <li key={j} className="text-slate-700">
                          <span className="font-medium text-slate-900">{p.nomeComercial || 'Produto'}</span>
                          <span className="text-slate-500">
                            {' '}
                            · {p.dose != null ? p.dose : '—'}
                            {p.unidade ? ` ${p.unidade}` : ''}
                            {p.custoHa != null && (
                              <span className="text-slate-800 font-medium">
                                {' '}
                                · R$ {formatNumber(p.custoHa, { decimals: 2 })}/ha
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        badge.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {badge.ok ? '✓' : '⚠'} {badge.label}
                    </span>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </PremiumSectionShell>
  );
}
