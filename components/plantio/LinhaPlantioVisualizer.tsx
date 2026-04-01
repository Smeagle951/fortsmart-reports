'use client';

import React, { useMemo, useState } from 'react';

interface LinhaPonto {
  tipo: 'ok' | 'dupla' | 'tripla' | 'falha';
  posicao?: number;
  cm?: number;
  distancia?: number;
}

interface LinhaPlantioVisualizerProps {
  linha: LinhaPonto[];
  okPct?: number;
  duplasPct?: number;
  triplasPct?: number;
  falhasPct?: number;
  indicePlantabilidade?: number;
  embedded?: boolean;
  /** Espaçamento em cm por semente (ex.: [{ cm: 31, tipo: 'ok' }, ...]) */
  espacamentosIndividuais?: Array<{ cm?: number; tipo: string; distancia?: number }>;
  /** Espaçamento alvo (cm) — exibido na régua e no painel técnico */
  espacamentoIdealCm?: number;
}

const tipoStyles: Record<string, string> = {
  ok: 'bg-emerald-500',
  dupla: 'bg-amber-400',
  tripla: 'bg-violet-500',
  falha: 'bg-red-500',
};

const tipoLabels: Record<string, string> = {
  ok: 'OK',
  dupla: 'Dupla',
  tripla: 'Tripla',
  falha: 'Falha',
};

type TipoPonto = 'ok' | 'dupla' | 'tripla' | 'falha';

function TrenaGrupo({
  ponto,
  index,
  tipoStyles,
  tipoLabels,
  mini,
}: {
  ponto: LinhaPonto;
  index: number;
  tipoStyles: Record<string, string>;
  tipoLabels: Record<string, string>;
  mini: boolean;
}) {
  const cls = tipoStyles[ponto.tipo] || 'bg-slate-300';
  const label = tipoLabels[ponto.tipo] || ponto.tipo;
  const cmLabel = ponto.cm != null ? ` a ${ponto.cm}cm` : ` (posição ${ponto.posicao ?? index + 1})`;
  const title = `${label}${cmLabel}`;

  if (ponto.tipo === 'falha') {
    return (
      <span
        className="plantio-trena-falha"
        title={title}
        aria-label={`Falha${cmLabel}`}
      />
    );
  }

  const n = ponto.tipo === 'tripla' ? 3 : ponto.tipo === 'dupla' ? 2 : 1;
  return (
    <span className={`plantio-trena-grupo plantio-trena-grupo--${ponto.tipo}`} title={title}>
      {Array.from({ length: n }, (_, j) => (
        <span key={j} className={`plantio-trena-bolinha ${cls}`} aria-hidden />
      ))}
    </span>
  );
}

function buildGapSequence(linha: LinhaPonto[]): { gapCm: number; ponto: LinhaPonto }[] {
  const hasCm = linha.some((p) => p.cm != null && p.cm > 0);
  if (!hasCm && linha.some((p) => (p.distancia ?? 0) > 0)) {
    const out: { gapCm: number; ponto: LinhaPonto }[] = [];
    let pos = 0;
    for (const p of linha) {
      const gapCm = Math.max(0.15, p.distancia ?? 0);
      pos += gapCm;
      out.push({ gapCm, ponto: { ...p, cm: pos } });
    }
    return out;
  }

  const sorted = [...linha].sort((a, b) => (a.cm ?? 0) - (b.cm ?? 0));
  const out: { gapCm: number; ponto: LinhaPonto }[] = [];
  let prevCm = 0;
  for (const p of sorted) {
    const cm = p.cm ?? prevCm + (p.distancia ?? 0);
    const gapCm = Math.max(0.15, cm - prevCm);
    out.push({ gapCm, ponto: { ...p, cm } });
    prevCm = cm;
  }
  return out;
}

function totalCmFromLinha(linha: LinhaPonto[]): number {
  const seq = buildGapSequence(linha);
  if (seq.length === 0) return 1;
  const last = seq[seq.length - 1]!;
  return Math.max(last.ponto.cm ?? seq.reduce((s, x) => s + x.gapCm, 0), 0.5);
}

function sampleLinha(linha: LinhaPonto[], max: number): LinhaPonto[] {
  if (linha.length <= max) return linha;
  const step = linha.length / max;
  const out: LinhaPonto[] = [];
  for (let i = 0; i < max; i++) {
    out.push(linha[Math.floor(i * step)]);
  }
  return out;
}

function buildLinhaFromPct(
  okPct?: number,
  duplasPct?: number,
  triplasPct?: number,
  falhasPct?: number
): LinhaPonto[] {
  const total = 50;
  const ok = Math.round((okPct ?? 0) / 100 * total);
  const duplas = Math.round((duplasPct ?? 0) / 100 * total);
  const triplas = Math.round((triplasPct ?? 0) / 100 * total);
  const falhas = Math.round((falhasPct ?? 0) / 100 * total);
  const pontos: LinhaPonto[] = [];
  const add = (tipo: TipoPonto, n: number) => {
    for (let i = 0; i < n; i++) pontos.push({ tipo });
  };
  add('ok', ok);
  add('dupla', duplas);
  add('tripla', triplas);
  add('falha', falhas);
  while (pontos.length < total) pontos.push({ tipo: 'ok' });
  return pontos.slice(0, total);
}

export default function LinhaPlantioVisualizer({
  linha = [],
  okPct,
  duplasPct,
  triplasPct,
  falhasPct,
  indicePlantabilidade,
  embedded = false,
  espacamentosIndividuais,
  espacamentoIdealCm,
}: LinhaPlantioVisualizerProps) {
  const [zoom, setZoom] = useState(100);
  const hasLinha = linha.length > 0;
  const hasResumo = okPct != null || duplasPct != null || triplasPct != null || falhasPct != null;
  const pontosParaTrena = hasLinha ? linha.slice(0, 80) : (hasResumo ? buildLinhaFromPct(okPct, duplasPct, triplasPct, falhasPct) : []);

  const gapSeq = useMemo(() => (hasLinha ? buildGapSequence(linha) : []), [hasLinha, linha]);
  const totalCm = useMemo(() => (hasLinha ? totalCmFromLinha(linha) : 0), [hasLinha, linha]);
  const trackBasePx = useMemo(() => Math.round(380 * (zoom / 100)), [zoom]);
  const showProportional = hasLinha && gapSeq.length > 0 && totalCm > 0;

  if (pontosParaTrena.length === 0 && !hasResumo) return null;

  const legendRow = (
    <div className="plantio-trena-legend-bar" aria-hidden="false">
      <span className="plantio-trena-legend-title">Legenda</span>
      <ul className="plantio-trena-legend-chips">
        <li>
          <span className="plantio-trena-chip plantio-trena-chip--ok" /> OK
        </li>
        <li>
          <span className="plantio-trena-chip plantio-trena-chip--dupla" /> Dupla
        </li>
        <li>
          <span className="plantio-trena-chip plantio-trena-chip--tripla" /> Tripla
        </li>
        <li>
          <span className="plantio-trena-chip plantio-trena-chip--falha" /> Falha
        </li>
      </ul>
      {espacamentoIdealCm != null && espacamentoIdealCm > 0 ? (
        <span className="plantio-trena-ideal-pill">Alvo {espacamentoIdealCm.toFixed(0)} cm</span>
      ) : null}
    </div>
  );

  const content = (
    <>
      {!embedded && (
        <h4 className="plantio-card-title mb-3">
          Distribuição Longitudinal do Plantio
        </h4>
      )}

      {showProportional && (
        <figure className="plantio-figure plantio-figure--linha plantio-figure--linha-pro">
          <div className="plantio-trena-pro-header">
            <div>
              <h4 className="plantio-trena-pro-title">Distribuição na linha (escala real)</h4>
              <p className="plantio-trena-pro-sub">
                Largura de cada trecho é proporcional ao espaçamento entre sementes ({totalCm.toFixed(1)} cm de trecho medido).
                Use o zoom para inspecionar detalhes.
              </p>
            </div>
            <label className="plantio-trena-zoom">
              <span className="plantio-trena-zoom-label">Zoom</span>
              <input
                type="range"
                min={60}
                max={220}
                step={10}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-valuetext={`${zoom} por cento`}
              />
              <span className="plantio-trena-zoom-val">{zoom}%</span>
            </label>
          </div>
          {legendRow}
          <div
            className="plantio-trena plantio-trena--proportional"
            role="img"
            aria-label={`Trena em escala: ${gapSeq.length} sementes ao longo de ${totalCm.toFixed(1)} centímetros.`}
          >
            <div className="plantio-trena-pro-track" style={{ width: trackBasePx, minWidth: '100%' }}>
              {gapSeq.map(({ gapCm, ponto }, i) => {
                const w = Math.max(6, (gapCm / totalCm) * trackBasePx);
                return (
                  <React.Fragment key={i}>
                    <div
                      className="plantio-trena-segment"
                      style={{ width: w }}
                      title={`${gapCm.toFixed(1)} cm`}
                    >
                      <span className="plantio-trena-segment-rail" />
                      <span className="plantio-trena-segment-cm">{gapCm.toFixed(1)}</span>
                    </div>
                    <TrenaGrupo
                      ponto={ponto}
                      index={i}
                      tipoStyles={tipoStyles}
                      tipoLabels={tipoLabels}
                      mini={false}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          <div className="plantio-trena-ruler" aria-hidden>
            <span>0</span>
            <span>{(totalCm * 0.25).toFixed(0)} cm</span>
            <span>{(totalCm * 0.5).toFixed(0)} cm</span>
            <span>{(totalCm * 0.75).toFixed(0)} cm</span>
            <span>{totalCm.toFixed(0)} cm</span>
          </div>
          <figcaption className="plantio-figcaption plantio-figcaption--stats">
            Escala proporcional aos espaçamentos registrados na trena (submódulo CV%). Números nos trechos = centímetros entre
            sementes consecutivas.
          </figcaption>
        </figure>
      )}

      {pontosParaTrena.length > 0 && (
        <figure className="plantio-figure plantio-figure--linha">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">
            {showProportional ? 'Visão compacta (sequência)' : 'Visualização da qualidade do plantio'}
          </h4>
          <p className="text-xs text-slate-500 mb-2">
            Cada marca é uma posição na linha; verde = OK, amarelo = dupla, roxo = tripla, lacuna = falha.
          </p>
          {!showProportional ? legendRow : null}
          <div
            className="plantio-trena"
            role="img"
            aria-label={`Linha de plantio: ${pontosParaTrena.length} pontos. Rolagem horizontal.`}
          >
            <div className="plantio-trena-marcas">
              {pontosParaTrena.map((p, i) => (
                <TrenaGrupo key={i} ponto={p} index={i} tipoStyles={tipoStyles} tipoLabels={tipoLabels} mini={false} />
              ))}
            </div>
            {hasLinha && linha.length > 80 && (
              <span className="plantio-trena-more">+{linha.length - 80} pontos</span>
            )}
          </div>
          <figcaption className="plantio-figcaption">
            Rolagem horizontal quando houver muitos pontos.
          </figcaption>
        </figure>
      )}

      {hasResumo && (
        <section className="plantio-resumo-linha" aria-labelledby="resumo-linha-titulo">
          <h4 id="resumo-linha-titulo" className="plantio-sr-only">
            Resumo da distribuição
          </h4>
          <figure className="plantio-figure plantio-figure--linha-mini">
            <div
              className="plantio-trena plantio-trena--mini"
              role="img"
              aria-label={`Medição da trena em escala: ${linha.length || 0} espaçamentos. OK ${Number(okPct ?? 0).toFixed(1)}%, Duplas ${Number(duplasPct ?? 0).toFixed(1)}%, Triplas ${Number(triplasPct ?? 0).toFixed(1)}%, Falhas ${Number(falhasPct ?? 0).toFixed(1)}%`}
            >
              <div className="plantio-trena-marcas">
                {(hasLinha ? sampleLinha(linha, 60) : buildLinhaFromPct(okPct, duplasPct, triplasPct, falhasPct)).map((p, i) => (
                  <TrenaGrupo key={i} ponto={p} index={i} tipoStyles={tipoStyles} tipoLabels={tipoLabels} mini />
                ))}
              </div>
            </div>
            <figcaption className="plantio-figcaption">
              Simulação da medição da trena em escala reduzida
            </figcaption>
          </figure>
          <dl className="plantio-legend">
            <div className="plantio-legend-item">
              <dt><span className="plantio-legend-dot plantio-legend-dot--ok" aria-hidden /> OK</dt>
              <dd>{Number(okPct ?? 0).toFixed(1)}%</dd>
            </div>
            <div className="plantio-legend-item">
              <dt><span className="plantio-legend-dot plantio-legend-dot--dupla" aria-hidden /> Duplas</dt>
              <dd>{Number(duplasPct ?? 0).toFixed(1)}%</dd>
            </div>
            <div className="plantio-legend-item">
              <dt><span className="plantio-legend-dot plantio-legend-dot--tripla" aria-hidden /> Triplas</dt>
              <dd>{Number(triplasPct ?? 0).toFixed(1)}%</dd>
            </div>
            <div className="plantio-legend-item">
              <dt><span className="plantio-legend-dot plantio-legend-dot--falha" aria-hidden /> Falhas</dt>
              <dd>{Number(falhasPct ?? 0).toFixed(1)}%</dd>
            </div>
          </dl>
          {indicePlantabilidade != null && !embedded && (
            <div className="plantio-indice-box">
              <span className="plantio-indice-label">Índice de Plantabilidade</span>
              <span className="plantio-indice-valor">{indicePlantabilidade}/100</span>
            </div>
          )}
        </section>
      )}

      {/* Lista de espaçamentos individuais (cada semente): mostra com linha real ou array de espacamentos */}
      {(hasLinha || (espacamentosIndividuais && espacamentosIndividuais.length > 0)) && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Espaçamentos individuais calculados</h4>
          <ul className="space-y-1.5 text-sm text-slate-600 max-h-48 overflow-y-auto">
            {(espacamentosIndividuais && espacamentosIndividuais.length > 0
              ? espacamentosIndividuais.map((e, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${tipoStyles[e.tipo] || 'bg-slate-300'}`} aria-hidden />
                    Semente {i + 1}:{e.cm != null ? ` ${e.cm} cm → ` : ' '}{tipoLabels[e.tipo] || e.tipo}
                  </li>
                ))
              : linha.slice(0, 60).map((p, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${tipoStyles[p.tipo] || 'bg-slate-300'}`} aria-hidden />
                    Semente {i + 1}: {tipoLabels[p.tipo] || p.tipo}
                  </li>
                ))
            )}
          </ul>
          {hasLinha && linha.length > 60 && (
            <p className="text-xs text-slate-500 mt-1">+{linha.length - 60} sementes</p>
          )}
        </div>
      )}
    </>
  );

  if (embedded) return content;
  return <div className="plantio-card">{content}</div>;
}
