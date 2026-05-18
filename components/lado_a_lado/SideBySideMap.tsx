'use client';

import dynamic from 'next/dynamic';
import { MapPinned } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import {
  getEvaluationPointsGeo,
  getSubareasGeo,
  getTalhaoPolygonFeatureCollection,
} from '@/lib/ladoALadoPayloadExtras';
import { sideLabel, isControlSide } from '@/lib/lado-a-lado-official/selectors';
import { FS } from '@/lib/lado-a-lado-official/theme';

const LadoALadoExperimentMap = dynamic(
  () => import('@/components/lado_a_lado/fortsmart/LadoALadoExperimentMap'),
  { ssr: false },
);

export default function SideBySideMap({ data }: { data: SideBySideReportData }) {
  const talhao = getTalhaoPolygonFeatureCollection(data);
  const subareas = getSubareasGeo(data);
  const points = getEvaluationPointsGeo(data);

  return (
    <section className="fs-section">
      <div className="mb-3 flex items-center gap-2">
        <MapPinned className="h-5 w-5" style={{ color: FS.green }} />
        <h2 className="fs-official-section-title">Mapa do Ensaio</h2>
      </div>
      <p className="fs-official-section-sub">
        Polígonos do talhão e parcelas vinculadas aos tratamentos (subáreas publicadas pelo app).
      </p>
      <div className="fs-official-card overflow-hidden p-3 sm:p-4">
        <LadoALadoExperimentMap talhaoGeo={talhao} subareasGeo={subareas} points={points} height={520} />
        <div className="mt-4 flex flex-wrap gap-4 border-t border-[#EEF2F7] pt-4 text-sm">
          <Legend color="#14532d" dash label="Contorno talhão" />
          <Legend color={FS.sideA} label={`Lado A — ${sideLabel(data, 'A')}${isControlSide(data, 'A') ? ' (Testemunha)' : ''}`} />
          <Legend color={FS.sideB} label={`Lado B — ${sideLabel(data, 'B')}${isControlSide(data, 'B') ? ' (Testemunha)' : ''}`} />
        </div>
      </div>
    </section>
  );
}

function Legend({
  color,
  label,
  dash,
}: {
  color: string;
  label: string;
  dash?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3 w-6 rounded-sm border-2"
        style={{
          borderColor: color,
          background: dash ? 'transparent' : `${color}33`,
          borderStyle: dash ? 'dashed' : 'solid',
        }}
      />
      <span className="text-[#374151]">{label}</span>
    </div>
  );
}
