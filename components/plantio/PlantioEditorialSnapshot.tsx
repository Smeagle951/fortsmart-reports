'use client';

import React from 'react';
import { formatNumber, formatPercent } from '@/utils/format';
import { getStoragePublicUrl } from '@/lib/supabase';
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

function resolvePlantioImage(
  entry: { url?: string; path?: string; localPath?: string },
  relatorioId?: string,
): string | undefined {
  if (entry.url && String(entry.url).startsWith('http')) return entry.url;
  const p = (entry.path || entry.localPath || '').trim();
  if (relatorioId && p) {
    const u = getStoragePublicUrl(relatorioId, p);
    if (u) return u;
  }
  return undefined;
}

function firstHeroUrl(snapshot: UnknownRec, relatorioId?: string): string | undefined {
  const imgs = snapshot.imagens as Array<{ url?: string; path?: string; localPath?: string }> | undefined;
  if (imgs?.length) {
    for (const i of imgs) {
      const u = resolvePlantioImage(i, relatorioId);
      if (u) return u;
    }
  }
  const fen = snapshot.fenologia as UnknownRec | undefined;
  const tl = fen?.timeline as Array<{ fotos?: Array<{ url?: string; localPath?: string; path?: string }> }> | undefined;
  if (Array.isArray(tl)) {
    for (const row of tl) {
      for (const p of row.fotos ?? []) {
        const u = resolvePlantioImage(
          { url: p.url as string | undefined, localPath: p.localPath as string | undefined, path: p.path as string | undefined },
          relatorioId,
        );
        if (u) return u;
      }
    }
  }
  return undefined;
}

type GalleryItem = { src: string; caption: string; subtitle?: string };

function collectGalleryItems(snapshot: UnknownRec, relatorioId?: string, max = 28): GalleryItem[] {
  const out: GalleryItem[] = [];
  const seen = new Set<string>();
  const push = (src: string, caption: string, subtitle?: string) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    out.push({ src, caption, subtitle });
  };

  const imgs = snapshot.imagens as Array<{
    url?: string;
    path?: string;
    localPath?: string;
    descricao?: string;
    categoria?: string;
  }> | undefined;
  if (imgs) {
    for (const i of imgs) {
      const src = resolvePlantioImage(i, relatorioId);
      if (!src) continue;
      const cap =
        [i.descricao, i.categoria].filter((x) => x && String(x).trim()).join(' · ') ||
        'Registro de campo';
      push(src, cap);
      if (out.length >= max) return out;
    }
  }

  const fen = (snapshot.fenologia || {}) as UnknownRec;
  const tl = Array.isArray(fen.timeline) ? (fen.timeline as UnknownRec[]) : [];
  for (const row of tl) {
    const est = str(row.estagio ?? row.descricaoEstagio);
    const dae = num(row.dae);
    const subtitle = dae != null ? `DAE ~${dae}` : undefined;
    const fotos = Array.isArray(row.fotos) ? (row.fotos as UnknownRec[]) : [];
    for (const f of fotos) {
      const src =
        (typeof f.url === 'string' && f.url.startsWith('http') ? f.url : undefined) ||
        resolvePlantioImage(
          { url: f.url as string | undefined, localPath: f.localPath as string | undefined, path: f.path as string | undefined },
          relatorioId,
        );
      if (src) {
        push(src, est !== '—' ? `Fenologia · ${est}` : 'Fenologia', subtitle);
        if (out.length >= max) return out;
      }
    }
  }
  return out;
}

export default function PlantioEditorialSnapshot({
  snapshot,
  relatorioId,
}: {
  snapshot: UnknownRec;
  relatorioId?: string;
}) {
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
  const evolucaoCultura = (snapshot.evolucaoCultura || {}) as UnknownRec;
  const contextoSafra = (snapshot.contextoSafra || {}) as UnknownRec;
  const conclusao = str(snapshot.conclusao);
  const hero = firstHeroUrl(snapshot, relatorioId);
  const galleryItems = collectGalleryItems(snapshot, relatorioId);
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

  const campoBits: string[] = [];
  if (num(contextoSafra.dae) != null) campoBits.push(`DAE aproximado: ${num(contextoSafra.dae)}`);
  if (num(contextoSafra.dap) != null) campoBits.push(`DAP: ${num(contextoSafra.dap)}`);
  const estObs = str(fenologia.estadio ?? fenologia.estagio);
  if (estObs !== '—') campoBits.push(`Estádio observado: ${estObs}`);
  const estPrev = str(evolucaoCultura.estadioPrevisto);
  if (estPrev !== '—') campoBits.push(`Estádio esperado para o ciclo: ${estPrev}`);
  if (num(evolucaoCultura.atrasoFenologico) != null) {
    campoBits.push(`Desvio fenológico (estágios): ${num(evolucaoCultura.atrasoFenologico)}`);
  }
  if (num(evolucaoCultura.somaTermica) != null) {
    campoBits.push(
      `Soma térmica acumulada: ${formatNumber(num(evolucaoCultura.somaTermica)!)} °C·dia`,
    );
  }
  const campoNarrative =
    campoBits.length > 0
      ? campoBits.join(' · ')
      : 'Preencha DAE, DAP e registros fenológicos no módulo Plantio para consolidar a linha do tempo deste talhão no relatório.';

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

      <section className={styles.sectionSoft} aria-labelledby="ed-id">
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

      <section className={styles.sectionSoft} aria-labelledby="ed-campo">
        <h2 id="ed-campo" className={styles.sectionTitle}>
          Cultura em campo
        </h2>
        <p className={styles.narrative} style={{ margin: 0 }}>
          {campoNarrative}
        </p>
      </section>

      {galleryItems.length > 0 && (
        <section className={styles.sectionSoft} aria-labelledby="ed-fotos">
          <h2 id="ed-fotos" className={styles.sectionTitle}>
            Registro visual
          </h2>
          <p className={styles.subtitle} style={{ marginBottom: '1rem' }}>
            Imagens do plantio e da evolução fenológica capturadas no aplicativo.
          </p>
          <div className={styles.galleryMosaic}>
            {galleryItems.map((g, i) => (
              <figure key={`${g.src}-${i}`} className={styles.galleryFigure}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.caption} className={styles.galleryImg} loading="lazy" />
                <figcaption className={styles.galleryCap}>
                  <span className={styles.galleryCapTitle}>{g.caption}</span>
                  {g.subtitle ? (
                    <span className={styles.galleryCapSub}>{g.subtitle}</span>
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {(diag.texto || hipoteses.length > 0) && (
        <section className={styles.sectionSoft} aria-labelledby="ed-diag">
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

      <section className={styles.sectionSoft} aria-labelledby="ed-ind">
        <h2 id="ed-ind" className={styles.sectionTitle}>
          Indicadores principais
        </h2>
        <div className={styles.metricsRail} role="list">
          <div className={styles.metric} role="listitem">
            <span className={styles.metricLabel}>População alvo</span>
            <span className={styles.metricValue}>
              {num(populacao.plantasHa) != null ? `${formatNumber(num(populacao.plantasHa)!)} pl/ha` : '—'}
            </span>
          </div>
          <div className={styles.metric} role="listitem">
            <span className={styles.metricLabel}>Estande efetivo</span>
            <span className={styles.metricValue}>
              {num(populacao.estandeEfetivoPlHa) != null
                ? `${formatNumber(num(populacao.estandeEfetivoPlHa)!)} pl/ha`
                : '—'}
            </span>
          </div>
          <div className={styles.metric} role="listitem">
            <span className={styles.metricLabel}>Eficiência</span>
            <span className={styles.metricValue}>
              {num(populacao.eficienciaPct) != null ? formatPercent(num(populacao.eficienciaPct)!) : '—'}
            </span>
          </div>
          <div className={styles.metric} role="listitem">
            <span className={styles.metricLabel}>CV% plantabilidade</span>
            <span className={styles.metricValue}>
              {num(plantab.cvPercentual) != null ? `${num(plantab.cvPercentual)!.toFixed(1)}%` : '—'}
            </span>
          </div>
          <div className={styles.metric} role="listitem">
            <span className={styles.metricLabel}>IQI implantação</span>
            <span className={styles.metricValue}>
              {num(iqiBlock.iqi) != null
                ? `${num(iqiBlock.iqi)!.toFixed(0)} · ${str(iqiBlock.label)}`
                : '—'}
            </span>
          </div>
          <div className={styles.metric} role="listitem">
            <span className={styles.metricLabel}>Estádio</span>
            <span className={styles.metricValue}>{str(fenologia.estadio ?? fenologia.estagio)}</span>
          </div>
        </div>
      </section>

      {temPlantabDetalhe && (
        <section className={styles.sectionSoft} aria-labelledby="ed-planta">
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
        <section className={styles.sectionSoft} aria-labelledby="ed-est">
          <h2 id="ed-est" className={styles.sectionTitle}>
            Estande
          </h2>
          <div className={styles.techList}>
            {registrosEstande.map((r, i) => (
              <div key={i} className={styles.techRow}>
                <span className={styles.techName}>{str(r.data)}</span>
                <span className={styles.techVal}>
                  {num(r.plantasPorMetro) != null ? `${formatNumber(num(r.plantasPorMetro)!)} pl/m` : '—'}
                  {' · '}
                  {num(r.plantasHa) != null ? `${formatNumber(num(r.plantasHa)!)} pl/ha` : '—'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {itensTecnicos.length > 0 && (
        <section className={styles.sectionSoft} aria-labelledby="ed-itens">
          <h2 id="ed-itens" className={styles.sectionTitle}>
            Itens técnicos avaliados
          </h2>
          <p className={styles.subtitle} style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
            Variáveis registradas na sessão de evolução fenológica / avaliação técnica do plantio.
          </p>
          <div className={styles.techList}>
            {itensTecnicos.map((item, i) => (
              <div key={i} className={styles.techRow}>
                <span className={styles.techName}>{str(item.nome)}</span>
                <span className={styles.techVal}>
                  {str(item.valor)}
                  {item.unidade != null && String(item.unidade).trim() !== ''
                    ? ` ${str(item.unidade)}`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {timeline.length > 0 && maxAlt > 0 && (
        <section className={styles.sectionSoft} aria-labelledby="ed-evo">
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
            Eixo inferior: DAE aproximado por registro. Fotos associadas aparecem em «Registro visual».
          </p>
        </section>
      )}

      {conclusao !== '—' && (
        <section className={styles.sectionSoft} aria-labelledby="ed-conc">
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
