'use client';

interface LinhaPonto {
  tipo: 'ok' | 'dupla' | 'tripla' | 'falha';
  posicao?: number;
}

interface LinhaPlantioVisualizerProps {
  linha: LinhaPonto[];
  okPct?: number;
  duplasPct?: number;
  triplasPct?: number;
  falhasPct?: number;
  indicePlantabilidade?: number;
  embedded?: boolean;
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

/** Representa um ponto na trena: OK=1 bolinha, Dupla=2 juntas, Tripla=3 juntas, Falha=lacuna */
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
  const title = `${label} (posição ${ponto.posicao ?? index + 1})`;

  if (ponto.tipo === 'falha') {
    return (
      <span
        className="plantio-trena-falha"
        title={title}
        aria-label={`Falha: lacuna na posição ${index + 1}`}
      />
    );
  }

  const n = ponto.tipo === 'dupla' ? 2 : ponto.tipo === 'tripla' ? 3 : 1;
  return (
    <span className={`plantio-trena-grupo plantio-trena-grupo--${ponto.tipo}`} title={title}>
      {Array.from({ length: n }, (_, j) => (
        <span key={j} className={`plantio-trena-bolinha ${cls}`} aria-hidden />
      ))}
    </span>
  );
}

/** Amostra a linha para exibição em escala (máx N pontos) */
function sampleLinha(linha: LinhaPonto[], max: number): LinhaPonto[] {
  if (linha.length <= max) return linha;
  const step = linha.length / max;
  const out: LinhaPonto[] = [];
  for (let i = 0; i < max; i++) {
    out.push(linha[Math.floor(i * step)]);
  }
  return out;
}

/** Gera pontos a partir das porcentagens quando não há linha real */
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
}: LinhaPlantioVisualizerProps) {
  const hasLinha = linha.length > 0;
  const hasResumo = okPct != null || duplasPct != null || triplasPct != null || falhasPct != null;

  if (!hasLinha && !hasResumo) return null;

  const content = (
    <>
      {!embedded && (
        <h4 className="plantio-card-title mb-3">
          Distribuição Longitudinal do Plantio
        </h4>
      )}

      {hasLinha && (
        <figure className="plantio-figure plantio-figure--linha">
          <div
            className="plantio-trena"
            role="img"
            aria-label={`Medição da trena: ${linha.length} espaçamentos. Rolagem horizontal habilitada.`}
          >
            <div className="plantio-trena-marcas">
              {linha.slice(0, 80).map((p, i) => (
                <TrenaGrupo key={i} ponto={p} index={i} tipoStyles={tipoStyles} tipoLabels={tipoLabels} mini={false} />
              ))}
            </div>
            {linha.length > 80 && (
              <span className="plantio-trena-more">+{linha.length - 80} pontos</span>
            )}
          </div>
          <figcaption className="plantio-figcaption">
            Espaçamento real: bolinhas juntas = duplas/triplas; lacuna vermelha = falha. Rolagem horizontal habilitada.
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
              aria-label={`Medição da trena em escala: ${linha.length || 0} espaçamentos. OK ${okPct ?? 0}%, Duplas ${duplasPct ?? 0}%, Triplas ${triplasPct ?? 0}%, Falhas ${falhasPct ?? 0}%`}
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
              <dd>{okPct ?? 0}%</dd>
            </div>
            <div className="plantio-legend-item">
              <dt><span className="plantio-legend-dot plantio-legend-dot--dupla" aria-hidden /> Duplas</dt>
              <dd>{duplasPct ?? 0}%</dd>
            </div>
            <div className="plantio-legend-item">
              <dt><span className="plantio-legend-dot plantio-legend-dot--tripla" aria-hidden /> Triplas</dt>
              <dd>{triplasPct ?? 0}%</dd>
            </div>
            <div className="plantio-legend-item">
              <dt><span className="plantio-legend-dot plantio-legend-dot--falha" aria-hidden /> Falhas</dt>
              <dd>{falhasPct ?? 0}%</dd>
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
    </>
  );

  if (embedded) return content;
  return <div className="plantio-card">{content}</div>;
}
