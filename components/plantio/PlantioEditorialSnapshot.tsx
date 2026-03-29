'use client';

import React from 'react';
import { formatNumber, formatPercent } from '@/utils/format';
import styles from './relatorio-plantio-editorial.module.css';

type UnknownRec = Record<string, unknown>;

function str(v: unknown): string {
  if (v == null) return '—';
  const s = String(v).trim();
  return s || '—';
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function timelinePhotoUrls(fenologia: UnknownRec, max = 12): string[] {
  const tl = Array.isArray(fenologia.timeline) ? (fenologia.timeline as UnknownRec[]) : [];
  const out: string[] = [];
  for (const row of tl) {
    const fotos = Array.isArray(row.fotos) ? (row.fotos as UnknownRec[]) : [];
    for (const f of fotos) {
      const u = f.url;
      if (typeof u === 'string' && u.startsWith('http') && out.length < max) out.push(u);
    }
  }
  return out;
}

function firstHeroUrl(snapshot: UnknownRec): string | undefined {
  const imgs = snapshot.imagens as Array<{ url?: string }> | undefined;
  if (imgs?.length) {
    const u = imgs.map((i) => i.url).find((x) => x && String(x).startsWith('http'));
    if (u) return u;
  }
  const fen = snapshot.fenologia as UnknownRec | undefined;
  const tl = fen?.timeline as Array<{ fotos?: Array<{ url?: string }> }> | undefined;
  if (Array.isArray(tl)) {
    for (const row of tl) {
      const f = row.fotos?.find((p) => p.url && String(p.url).startsWith('http'));
      if (f?.url) return f.url;
    }
  }
  return undefined;
}

export default function PlantioEditorialSnapshot({ snapshot }: { snapshot: UnknownRec }) {
  const meta = (snapshot.meta || {}) as UnknownRec;
  const prop = (snapshot.propriedade || {}) as UnknownRec;
  const talhao = (snapshot.talhao || {}) as UnknownRec;
  const fenologia = (snapshot.fenologia || {}) as UnknownRec;
  const populacao = (snapshot.populacao || {}) as UnknownRec;
  const plantab = (snapshot.plantabilidade || {}) as UnknownRec;
  const diag = (snapshot.diagnosticoIntegrado || {}) as UnknownRec;
  const iqiBlock = (snapshot.indiceQualidadeImplantacao || {}) as UnknownRec;
  const assinatura = (snapshot.assinaturaTecnica || {}) as UnknownRec;
  const estande = (snapshot.estande || {}) as UnknownRec;
  const conclusao = str(snapshot.conclusao);
  const hero = firstHeroUrl(snapshot);
  const timelinePhotos = timelinePhotoUrls(fenologia, 12);
  const registrosEstande = Array.isArray(estande.registros)
    ? (estande.registros as UnknownRec[])
    : [];
  const itensTecnicos = Array.isArray(snapshot.itensTecnicos)
    ? (snapshot.itensTecnicos as UnknownRec[])
    : [];

  const temPlantabDetalhe =
    num(plantab.duplasPct) != null ||
    num(plantab.triplasPct) != null ||
    num(plantab.falhasPct) != null ||
    num(plantab.okPct) != null;

  const timeline = Array.isArray(fenologia.timeline) ? fenologia.timeline : [];
  const alturas = timeline
    .map((r) => num((r as UnknownRec).alturaCm))
    .filter((x): x is number => x != null && x > 0);
  const maxAlt = alturas.length ? Math.max(...alturas) : 0;

  const hipoteses = Array.isArray(diag.hipoteses) ? (diag.hipoteses as string[]) : [];
  const recs = Array.isArray(diag.recomendacoes) ? (diag.recomendacoes as string[]) : [];

  return (
    <div className={styles.root}>
      <header className={styles.hero}>
        {hero ? (
          <div className={styles.heroImageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.heroImage} src={hero} alt="" />
          </div>
        ) : null}
        <div className={styles.heroText}>
          <p className={styles.kicker}>Relatório técnico de plantio</p>
          <h1 className={styles.title}>{str(talhao.nome)}</h1>
          <p className={styles.subtitle}>
            {str(talhao.cultura)} · {str(prop.fazenda)} · Safra {str(meta.safra)}
          </p>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="ed-id">
        <h2 id="ed-id" className={styles.sectionTitle}>
          Identificação
        </h2>
        <dl className={styles.grid}>
          <dt>Fazenda</dt>
          <dd>{str(prop.fazenda)}</dd>
          <dt>Talhão</dt>
          <dd>{str(talhao.nome)}</dd>
          <dt>Área</dt>
          <dd>{num(talhao.area) != null ? `${formatNumber(num(talhao.area)!)} ha` : '—'}</dd>
          <dt>Data de plantio</dt>
          <dd>{str(talhao.dataPlantio)}</dd>
          <dt>Município / UF</dt>
          <dd>
            {[prop.municipio, prop.estado].filter(Boolean).join(' / ') || '—'}
          </dd>
        </dl>
      </section>

      {(diag.texto || hipoteses.length > 0) && (
        <section className={styles.section} aria-labelledby="ed-diag">
          <h2 id="ed-diag" className={styles.sectionTitle}>
            Diagnóstico integrado
          </h2>
          {diag.texto ? <p className={styles.narrative}>{str(diag.texto)}</p> : null}
          {hipoteses.length > 0 ? (
            <>
              <p className={styles.sectionTitle} style={{ marginTop: '1rem', fontSize: '0.68rem' }}>
                Hipóteses
              </p>
              <ul className={styles.bullets}>
                {hipoteses.slice(0, 8).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </>
          ) : null}
          {recs.length > 0 ? (
            <>
              <p className={styles.sectionTitle} style={{ marginTop: '1rem', fontSize: '0.68rem' }}>
                Recomendações
              </p>
              <ul className={styles.bullets}>
                {recs.slice(0, 12).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      )}

      <section className={styles.section} aria-labelledby="ed-ind">
        <h2 id="ed-ind" className={styles.sectionTitle}>
          Indicadores
        </h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>População alvo (pl/ha)</td>
              <td>{num(populacao.plantasHa) != null ? formatNumber(num(populacao.plantasHa)!) : '—'}</td>
            </tr>
            <tr>
              <td>Estande efetivo (pl/ha)</td>
              <td>
                {num(populacao.estandeEfetivoPlHa) != null
                  ? formatNumber(num(populacao.estandeEfetivoPlHa)!)
                  : '—'}
              </td>
            </tr>
            <tr>
              <td>Eficiência</td>
              <td>
                {num(populacao.eficienciaPct) != null ? formatPercent(num(populacao.eficienciaPct)!) : '—'}
              </td>
            </tr>
            <tr>
              <td>CV% (plantabilidade)</td>
              <td>
                {num(plantab.cvPercentual) != null ? `${num(plantab.cvPercentual)!.toFixed(1)}%` : '—'}
              </td>
            </tr>
            <tr>
              <td>IQI (implantação)</td>
              <td>
                {num(iqiBlock.iqi) != null
                  ? `${num(iqiBlock.iqi)!.toFixed(0)} — ${str(iqiBlock.label)}`
                  : '—'}
              </td>
            </tr>
            <tr>
              <td>Estádio fenológico</td>
              <td>{str(fenologia.estadio ?? fenologia.estagio)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {temPlantabDetalhe && (
        <section className={styles.section} aria-labelledby="ed-planta">
          <h2 id="ed-planta" className={styles.sectionTitle}>
            Plantabilidade (distribuição)
          </h2>
          <dl className={styles.grid}>
            <dt>Espaçamento ideal (cm)</dt>
            <dd>
              {num(plantab.espacamentoIdealCm) != null
                ? `${num(plantab.espacamentoIdealCm)!.toFixed(1)}`
                : '—'}
            </dd>
            <dt>Espaçamento real (cm)</dt>
            <dd>
              {num(plantab.espacamentoRealCm) != null
                ? `${num(plantab.espacamentoRealCm)!.toFixed(1)}`
                : '—'}
            </dd>
            <dt>Aceitáveis (ok)</dt>
            <dd>{num(plantab.okPct) != null ? `${num(plantab.okPct)!.toFixed(1)}%` : '—'}</dd>
            <dt>Duplas</dt>
            <dd>{num(plantab.duplasPct) != null ? `${num(plantab.duplasPct)!.toFixed(1)}%` : '—'}</dd>
            <dt>Triplas</dt>
            <dd>{num(plantab.triplasPct) != null ? `${num(plantab.triplasPct)!.toFixed(1)}%` : '—'}</dd>
            <dt>Falhas</dt>
            <dd>{num(plantab.falhasPct) != null ? `${num(plantab.falhasPct)!.toFixed(1)}%` : '—'}</dd>
          </dl>
        </section>
      )}

      {registrosEstande.length > 0 && (
        <section className={styles.section} aria-labelledby="ed-est">
          <h2 id="ed-est" className={styles.sectionTitle}>
            Estande
          </h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Plantas/m</th>
                <th>Plantas/ha</th>
              </tr>
            </thead>
            <tbody>
              {registrosEstande.map((r, i) => (
                <tr key={i}>
                  <td>{str(r.data)}</td>
                  <td>{num(r.plantasPorMetro) != null ? formatNumber(num(r.plantasPorMetro)!) : '—'}</td>
                  <td>{num(r.plantasHa) != null ? formatNumber(num(r.plantasHa)!) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {itensTecnicos.length > 0 && (
        <section className={styles.section} aria-labelledby="ed-itens">
          <h2 id="ed-itens" className={styles.sectionTitle}>
            Itens técnicos avaliados
          </h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Variável</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {itensTecnicos.map((item, i) => (
                <tr key={i}>
                  <td>{str(item.nome)}</td>
                  <td>
                    {str(item.valor)}
                    {item.unidade != null && String(item.unidade).trim() !== ''
                      ? ` ${str(item.unidade)}`
                      : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {timeline.length > 0 && maxAlt > 0 && (
        <section className={styles.section} aria-labelledby="ed-evo">
          <h2 id="ed-evo" className={styles.sectionTitle}>
            Evolução (altura por registro)
          </h2>
          <div className={styles.miniBars}>
            {timeline.map((row, i) => {
              const a = num((row as UnknownRec).alturaCm);
              const barPx =
                a != null && maxAlt > 0 ? Math.max(8, Math.round((a / maxAlt) * 100)) : 8;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    minHeight: 120,
                  }}
                >
                  <div
                    className={styles.miniBar}
                    style={{ width: 'min(100%, 18px)', height: barPx, flexShrink: 0 }}
                    title={a != null ? `${a} cm` : ''}
                  />
                  <span className={styles.miniBarLabel}>{num((row as UnknownRec).dae) ?? '—'}</span>
                </div>
              );
            })}
          </div>
          <p className={styles.subtitle} style={{ marginTop: 8 }}>
            Eixo inferior: DAE aproximado por registro na timeline.
          </p>
          {timelinePhotos.length > 0 ? (
            <div className={styles.photoStrip} aria-label="Fotos da fenologia">
              {timelinePhotos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" width={72} height={72} loading="lazy" />
              ))}
            </div>
          ) : null}
        </section>
      )}

      {conclusao !== '—' && (
        <section className={styles.section} aria-labelledby="ed-conc">
          <h2 id="ed-conc" className={styles.sectionTitle}>
            Conclusão
          </h2>
          <p className={styles.narrative}>{conclusao}</p>
        </section>
      )}

      <footer className={styles.signature}>
        <strong>{str(assinatura.nome)}</strong>
        {assinatura.crea ? <> · CREA {str(assinatura.crea)}</> : null}
        {assinatura.dataAssinatura ? (
          <>
            <br />
            {str(assinatura.dataAssinatura)}
            {assinatura.cidade ? ` · ${str(assinatura.cidade)}` : null}
          </>
        ) : null}
      </footer>
    </div>
  );
}
