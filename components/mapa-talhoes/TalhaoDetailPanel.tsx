'use client';

import { strokeForProperties } from './materialColor';

type Props = {
  properties: Record<string, unknown> | null;
  onClose: () => void;
};

function fmt(n: unknown, digits = 0): string {
  if (typeof n === 'number' && !Number.isNaN(n)) {
    return n.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  }
  return '—';
}

/**
 * Detalhe do talhão / subárea a partir do GeoJSON (mesmo schema do export FortSmart / KmlExportService).
 */
export function TalhaoDetailPanel({ properties, onClose }: Props) {
  if (!properties) {
    return (
      <div className="flex h-full min-h-[200px] flex-col rounded-lg border border-slate-700/80 bg-slate-900/70 p-4 text-sm text-slate-500 shadow-inner">
        <p className="font-medium text-slate-300">Detalhe do talhão</p>
        <p className="mt-3 text-xs leading-relaxed">
          Toque em um <strong>polígono</strong> no mapa (contorno = híbrido/material). O painel
          preenche com cultura, híbrido, estande e safra, como o export do app.
        </p>
      </div>
    );
  }

  const tipo = String(properties.tipo ?? 'talhao');
  const isSub = tipo === 'subarea';
  const nome = String(properties.talhao ?? properties.name ?? '—');
  const cultura = String(properties.cultura ?? '—');
  const material = String(
    (properties.material as string) ??
      (properties.variedade as string) ??
      (properties.tipo_manejo as string) ??
      '—',
  );
  const stroke = isSub
    ? '#94a3b8'
    : strokeForProperties({
        material: properties.material as string,
        kml_style_key: properties.kml_style_key as string,
      });
  const est = properties.estande_pl_ha ?? properties.plantas_por_ha;
  const areaH = properties.area_ha;
  const dp = properties.data_plantio != null ? String(properties.data_plantio) : '—';
  const sa = String(properties.safra ?? '—');
  const subtipo = isSub && properties.tipo_manejo != null ? String(properties.tipo_manejo) : '';

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-slate-700/80 bg-slate-900/70 p-3 text-sm text-slate-200 shadow-inner">
      <div className="mb-2 flex items-start justify-between gap-2 border-b border-slate-700/80 pb-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {isSub ? 'Subárea' : 'Talhão'}
          </p>
          <h2 className="text-base font-semibold text-white">{nome}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-8 rounded border border-slate-500"
            style={{ background: 'transparent', borderColor: stroke, borderWidth: 3 }}
            title="Cor do híbrido (contorno)"
          />
          <button
            type="button"
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      </div>

      {isSub && subtipo ? (
        <p className="mb-2 text-xs text-amber-200/90">Manejo: {subtipo}</p>
      ) : null}

      <dl className="space-y-2 text-xs">
        <div>
          <dt className="text-slate-500">Cultura</dt>
          <dd className="text-slate-100">{cultura}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Híbrido / material</dt>
          <dd className="font-medium text-slate-100">{material}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Estande</dt>
          <dd>
            {typeof est === 'number' && !Number.isNaN(est)
              ? `${fmt(est, 0)} pl/ha`
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Área</dt>
          <dd>{typeof areaH === 'number' ? `${fmt(areaH, 1)} ha` : '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Data de plantio</dt>
          <dd>{dp}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Safra</dt>
          <dd>{sa}</dd>
        </div>
      </dl>
    </div>
  );
}
