'use client';

interface LinhaPonto {
  tipo: 'ok' | 'dupla' | 'tripla' | 'falha';
  posicao?: number;
<<<<<<< HEAD
=======
  cm?: number;
  distancia?: number;
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
}

interface LinhaPlantioVisualizerProps {
  linha: LinhaPonto[];
  okPct?: number;
  duplasPct?: number;
  triplasPct?: number;
  falhasPct?: number;
  indicePlantabilidade?: number;
  embedded?: boolean;
<<<<<<< HEAD
  /** Espaçamento em cm por semente (ex.: [{ cm: 31, tipo: 'ok' }, ...]) */
  espacamentosIndividuais?: Array<{ cm?: number; tipo: string }>;
=======
  /** Espaçamentos individuais calculados */
  espacamentosIndividuais?: Array<{ cm?: number; tipo: string; distancia?: number }>;
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
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
<<<<<<< HEAD
  falha: 'Falha',
=======
  falha: 'Falha/Lacuna',
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
};

type TipoPonto = 'ok' | 'dupla' | 'tripla' | 'falha';

<<<<<<< HEAD
/** Representa um ponto na trena: OK=1 bolinha, Dupla=2 juntas, Tripla=3 juntas, Falha=lacuna */
=======
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
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
<<<<<<< HEAD
  const title = `${label} (posição ${ponto.posicao ?? index + 1})`;

  if (ponto.tipo === 'falha') {
=======
  const cmLabel = ponto.cm != null ? ` a ${ponto.cm}cm` : ` (posição ${ponto.posicao ?? index + 1})`;
  const title = `${label}${cmLabel}`;

  if (ponto.tipo === 'falha') {
    // If we have an absolute ruler, the falha gap is visually empty or marked with a small dash.
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
    return (
      <span
        className="plantio-trena-falha"
        title={title}
<<<<<<< HEAD
        aria-label={`Falha: lacuna na posição ${index + 1}`}
=======
        aria-label={`Falha${cmLabel}`}
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
      />
    );
  }

<<<<<<< HEAD
  const n = ponto.tipo === 'dupla' ? 2 : ponto.tipo === 'tripla' ? 3 : 1;
=======
  const n = ponto.tipo === 'tripla' ? 3 : ponto.tipo === 'dupla' ? 2 : 1;
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
  return (
    <span className={`plantio-trena-grupo plantio-trena-grupo--${ponto.tipo}`} title={title}>
      {Array.from({ length: n }, (_, j) => (
        <span key={j} className={`plantio-trena-bolinha ${cls}`} aria-hidden />
      ))}
    </span>
  );
}

<<<<<<< HEAD
/** Amostra a linha para exibição em escala (máx N pontos) */
=======
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
function sampleLinha(linha: LinhaPonto[], max: number): LinhaPonto[] {
  if (linha.length <= max) return linha;
  const step = linha.length / max;
  const out: LinhaPonto[] = [];
  for (let i = 0; i < max; i++) {
    out.push(linha[Math.floor(i * step)]);
  }
  return out;
}

<<<<<<< HEAD
/** Gera pontos a partir das porcentagens quando não há linha real */
=======
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
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
}: LinhaPlantioVisualizerProps) {
  const hasLinha = linha.length > 0;
  const hasResumo = okPct != null || duplasPct != null || triplasPct != null || falhasPct != null;
<<<<<<< HEAD
  const pontosParaTrena = hasLinha ? linha.slice(0, 80) : (hasResumo ? buildLinhaFromPct(okPct, duplasPct, triplasPct, falhasPct) : []);

  if (pontosParaTrena.length === 0 && !hasResumo) return null;

=======
  const pontosParaTrena = hasLinha ? linha.slice(0, 150) : (hasResumo ? buildLinhaFromPct(okPct, duplasPct, triplasPct, falhasPct) : []);

  if (pontosParaTrena.length === 0 && !hasResumo) return null;

  // Verifica se temos posições absolutas na fita (cm)
  const isAbsolute = pontosParaTrena.length > 0 && pontosParaTrena.some((p) => p.cm != null);
  const scale = 5; // 1cm = 5px (para a fita parecer real)
  const maxCm = isAbsolute ? Math.max(...pontosParaTrena.map((p) => p.cm ?? 0)) + 20 : 0;
  const trenaWidth = isAbsolute ? Math.max(maxCm * scale, 100) : 'auto';

>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
  const content = (
    <>
      {!embedded && (
        <h4 className="plantio-card-title mb-3">
          Distribuição Longitudinal do Plantio
        </h4>
      )}

<<<<<<< HEAD
      {/* Visualização da linha (trena): sempre que houver pontos ou resumo (CV%) */}
      {pontosParaTrena.length > 0 && (
        <figure className="plantio-figure plantio-figure--linha">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">Visualização da qualidade do plantio</h4>
          <p className="text-xs text-slate-500 mb-2">
            Cada ponto representa uma semente na linha; bolinhas verdes = OK, amarelas = duplas, roxas = triplas, lacuna = falha.
=======
      {/* Visualização da linha (trena) */}
      {pontosParaTrena.length > 0 && (
        <figure className="plantio-figure plantio-figure--linha">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">Visualização da qualidade do plantio na linha</h4>
          <p className="text-xs text-slate-500 mb-2">
            Cada ponto representa a posição real de uma semente na linha medida. Escala: 1cm = {scale}px.
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
          </p>
          <div
            className="plantio-trena"
            role="img"
            aria-label={`Linha de plantio: ${pontosParaTrena.length} pontos. Rolagem horizontal.`}
<<<<<<< HEAD
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
            Bolinhas = sementes (verde OK, amarelo dupla, roxo tripla, lacuna falha). Rolagem horizontal.
=======
            style={isAbsolute ? { paddingBottom: '24px' } : undefined}
          >
            {isAbsolute ? (
              <div
                className="plantio-trena-marcas"
                style={{ position: 'relative', width: `${trenaWidth}px`, height: '24px', display: 'block' }}
              >
                {/* Linha da fita métrica central */}
                <div style={{ position: 'absolute', bottom: '6px', left: 0, right: 0, height: '2px', backgroundColor: '#94a3b8' }} />

                {pontosParaTrena.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${(p.cm ?? i * 15) * scale}px`,
                      bottom: '0px',
                      transform: 'translateX(-50%)',
                      zIndex: p.tipo === 'falha' ? 1 : 10
                    }}
                  >
                    <TrenaGrupo ponto={p} index={i} tipoStyles={tipoStyles} tipoLabels={tipoLabels} mini={false} />
                    {/* Marcação em cm abaixo do ponto (a cada 5 sementes para não poluir) */}
                    {(i % 5 === 0 || i === pontosParaTrena.length - 1) && p.tipo !== 'falha' && (
                      <span style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: '#64748b' }}>
                        {p.cm}cm
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="plantio-trena-marcas">
                {pontosParaTrena.map((p, i) => (
                  <TrenaGrupo key={i} ponto={p} index={i} tipoStyles={tipoStyles} tipoLabels={tipoLabels} mini={false} />
                ))}
              </div>
            )}

            {hasLinha && linha.length > 150 && (
              <span className="plantio-trena-more">+{linha.length - 150} pontos</span>
            )}
          </div>
          <figcaption className="plantio-figcaption">
            Bolinhas = sementes (verde OK, amarelo dupla, roxo tripla, vermelho falha).
            {isAbsolute && ' Posicionadas conforme a distância real na trena.'}
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
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
<<<<<<< HEAD
              aria-label={`Medição da trena em escala: ${linha.length || 0} espaçamentos. OK ${okPct ?? 0}%, Duplas ${duplasPct ?? 0}%, Triplas ${triplasPct ?? 0}%, Falhas ${falhasPct ?? 0}%`}
=======
              aria-label={`Medição da trena em escala: ${linha.length || 0} espaçamentos. OK ${Number(okPct ?? 0).toFixed(1)}%, Duplas ${Number(duplasPct ?? 0).toFixed(1)}%, Triplas ${Number(triplasPct ?? 0).toFixed(1)}%, Falhas ${Number(falhasPct ?? 0).toFixed(1)}%`}
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
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
<<<<<<< HEAD
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
=======
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
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
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
<<<<<<< HEAD
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
=======
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
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
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
