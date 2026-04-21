'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.35 },
};

type FcmPoint = {
  point_id?: string;
  index?: number;
  status?: string;
  sides?: Record<string, Record<string, unknown>>;
};

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function hasFieldCollectionData(data: SideBySideReportData): boolean {
  const fcm = data.field_collection_modules;
  if (fcm == null || typeof fcm !== 'object' || Array.isArray(fcm)) return false;
  const pts = (fcm as { points?: unknown }).points;
  return Array.isArray(pts) && pts.length > 0;
}

/**
 * Módulos de coleta em campo (JSON `field_collection_modules` publicado pelo app FortSmart).
 */
export default function FieldCollectionModulesSection({
  data,
  sectionId = 'coleta-campo-modulos',
}: {
  data: SideBySideReportData;
  sectionId?: string;
}) {
  if (!hasFieldCollectionData(data)) return null;

  const fcm = data.field_collection_modules as {
    schema_version?: number;
    module_labels?: Record<string, string>;
    points?: FcmPoint[];
  };
  const points = fcm.points ?? [];
  const moduleLabels = fcm.module_labels ?? {};
  const schemaVersion = fcm.schema_version;

  return (
    <motion.section id={sectionId} {...fadeIn} className="scroll-mt-36 space-y-6">
      <h2 className="text-lg font-bold text-slate-900 mb-1 border-l-4 border-violet-500 pl-3">Coleta em campo (módulos)</h2>
      <p className="text-sm text-slate-600 mb-4">
        Dados por ponto de amostragem e por manejo (A/B), conforme o preenchimento no app.
        {schemaVersion != null ? (
          <span className="block mt-1 text-xs text-slate-500">Schema {schemaVersion}</span>
        ) : null}
      </p>
      <div className="space-y-8">
        {points.map((pt, i) => {
          const pLabel =
            typeof pt.index === 'number' ? `Ponto ${pt.index}` : `Ponto ${i + 1}`;
          const sides = pt.sides && typeof pt.sides === 'object' ? pt.sides : {};
          const sideKeys = Object.keys(sides).sort();
          if (sideKeys.length === 0) return null;
          return (
            <div
              key={pt.point_id ?? `pt-${i}`}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{pLabel}</h3>
                {pt.status ? (
                  <span className="text-xs font-medium uppercase text-slate-500">Status: {pt.status}</span>
                ) : null}
              </div>
              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sideKeys.map((letter) => {
                  const secMap = sides[letter];
                  if (!secMap || typeof secMap !== 'object') return null;
                  const sectionIds = Object.keys(secMap).sort();
                  return (
                    <div
                      key={letter}
                      className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 space-y-3"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Lado {letter}</p>
                      {sectionIds.length === 0 ? (
                        <p className="text-sm text-slate-500">Sem seções.</p>
                      ) : (
                        sectionIds.map((secId) => {
                          const title = moduleLabels[secId] || secId;
                          return (
                            <details
                              key={secId}
                              className="group rounded-lg border border-slate-200 bg-white open:shadow-sm"
                            >
                              <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-slate-800 flex justify-between gap-2">
                                <span>{title}</span>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">{secId}</span>
                              </summary>
                              <div className="px-3 pb-3">
                                <pre className="text-[11px] leading-relaxed text-slate-700 overflow-x-auto max-h-80 overflow-y-auto rounded-md bg-slate-50 p-2 border border-slate-100 whitespace-pre-wrap wrap-break-word">
                                  {formatJson(secMap[secId])}
                                </pre>
                              </div>
                            </details>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
