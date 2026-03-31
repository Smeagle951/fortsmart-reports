import React from 'react';
import { ReportFooter } from './Header';
import HeaderRelatorio from './HeaderRelatorio';
import { formatNumber, formatPercent } from '../utils/format';
import { InfoGrid } from './TabelaDados';
import TabelaDados from './TabelaDados';
import dynamic from 'next/dynamic';
import GaleriaOcorrencias from './GaleriaOcorrencias';

const MapaInterativo = dynamic(() => import('./MapaInterativo'), { ssr: false });

/** Payload espelhado do app (monitoring_card_data_service + motor v2). */
export type FortsmartIaMonitoramento = {
  dosesDefensivos?: Record<string, Record<string, unknown>>;
  manejoQuimico?: string[];
  manejoBiologico?: string[];
  manejoCultural?: string[];
  motorV2?: Record<string, unknown> | null;
};

function ListaManejo({ titulo, itens, icon }: { titulo: string; itens: string[]; icon: React.ReactNode }) {
  if (!itens?.length) return null;
  return (
    <div className="rounded-lg border border-teal-200/80 bg-white/90 p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[12px] font-black uppercase tracking-wider text-teal-900">{titulo}</span>
      </div>
      <ul className="list-disc pl-4 space-y-1 text-[12px] text-slate-700 leading-relaxed">
        {itens.map((t, j) => (
          <li key={j}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function CartaoDefensivoWeb({ nomeProduto, info }: { nomeProduto: string; info: Record<string, unknown> }) {
  const rotulos: [string, string][] = [
    ['dose', 'Dose'],
    ['volume_calda', 'Volume de calda'],
    ['intervalo_seguranca', 'Intervalo de segurança'],
    ['epoca_aplicacao', 'Época'],
    ['condicoes_climaticas', 'Condições'],
    ['equipamento', 'Equipamento'],
    ['adjuvante', 'Adjuvante'],
    ['observacoes', 'Observações'],
    ['fonte_publica', 'Fonte'],
  ];
  const linhas: { label: string; valor: string }[] = [];
  for (const [key, label] of rotulos) {
    const v = info[key];
    if (v != null && String(v).trim() !== '') linhas.push({ label, valor: String(v) });
  }
  const titulo = nomeProduto.replace(/_/g, ' ').toUpperCase();
  return (
    <div className="rounded-xl border-[1.5px] border-[#1B5E20]/35 bg-white p-3.5 shadow-sm">
      <h5 className="text-[13px] font-black text-[#1B5E20] tracking-tight mb-2">{titulo}</h5>
      {linhas.length === 0 ? (
        <p className="text-xs text-slate-500">Sem detalhes estruturados no catálogo.</p>
      ) : (
        <dl className="space-y-1.5 text-[12px]">
          {linhas.map(({ label, valor }) => (
            <div key={label} className="grid grid-cols-1 sm:grid-cols-[minmax(0,8rem)_1fr] gap-x-2 gap-y-0.5">
              <dt className="font-bold text-slate-500">{label}</dt>
              <dd className="text-slate-800 leading-snug">{valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function motorV2TemConteudoVisivel(m: Record<string, unknown>): boolean {
  const nut = Array.isArray(m.nutricaoBase) ? m.nutricaoBase.length : 0;
  const adj = Array.isArray(m.ajusteNutricao) ? m.ajusteNutricao.length : 0;
  const extras = Array.isArray(m.recomendacaoExtra) ? m.recomendacaoExtra.length : 0;
  const base = m.recomendacaoFinalBase != null ? String(m.recomendacaoFinalBase) : '';
  const obj = m.recomendacaoFinalObjetivo != null ? String(m.recomendacaoFinalObjetivo) : '';
  const exp = m.recomendacaoFinalExplicacao != null ? String(m.recomendacaoFinalExplicacao) : '';
  return (
    nut > 0 ||
    adj > 0 ||
    extras > 0 ||
    base.length > 0 ||
    obj.length > 0 ||
    exp.length > 0
  );
}

export function BlocoMotorV2Web({ m }: { m: Record<string, unknown> }) {
  const nut = Array.isArray(m.nutricaoBase) ? (m.nutricaoBase as Record<string, string>[]) : [];
  const adj = Array.isArray(m.ajusteNutricao) ? (m.ajusteNutricao as Record<string, string>[]) : [];
  const extras = Array.isArray(m.recomendacaoExtra) ? (m.recomendacaoExtra as string[]) : [];
  const base = m.recomendacaoFinalBase != null ? String(m.recomendacaoFinalBase) : '';
  const obj = m.recomendacaoFinalObjetivo != null ? String(m.recomendacaoFinalObjetivo) : '';
  const exp = m.recomendacaoFinalExplicacao != null ? String(m.recomendacaoFinalExplicacao) : '';
  const est = m.estagioCodigoUsado != null ? String(m.estagioCodigoUsado) : '';
  const estNome = m.estagioNome != null ? String(m.estagioNome) : '';
  const fallback = Boolean(m.estagioFallback);

  if (!motorV2TemConteudoVisivel(m)) return null;

  return (
    <div className="rounded-xl border-[1.5px] border-amber-300/90 bg-gradient-to-br from-amber-50/90 to-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/50 bg-amber-100 text-amber-900 text-sm">🌾</span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-950/90">Nutrição da cultura</p>
          <p className="text-[11px] text-amber-900/80">Recomendação de nutrição</p>
        </div>
      </div>
      {(est || estNome) && (
        <p className="text-[11px] font-semibold text-amber-950/80 mb-2">
          Estágio {est}
          {estNome ? ` — ${estNome}` : ''}
          {fallback ? ' · estágio estimado se fenologia ausente' : ''}
        </p>
      )}
      {base && (
        <div className="mb-3">
          <p className="text-[13px] font-black text-amber-950">Base sugerida: {base}</p>
          {obj && <p className="text-[12px] text-slate-700 mt-0.5">{obj}</p>}
          {exp && <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{exp}</p>}
        </div>
      )}
      {nut.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-amber-950 mb-1.5">Micronutrientes / apoio ao estágio</p>
          <ul className="list-disc pl-4 space-y-1 text-[12px] text-slate-800">
            {nut.map((row, i) => {
              const el = row.elemento ?? '';
              const dose = row.dose ?? '';
              const fn = row.funcao ?? '';
              const s = [el, dose && `— ${dose}`, fn && `(${fn})`].filter(Boolean).join(' ');
              return <li key={i}>{s}</li>;
            })}
          </ul>
        </div>
      )}
      {adj.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-amber-950 mb-1">Ajuste contextual</p>
          {m.regraEtiqueta != null && String(m.regraEtiqueta).length > 0 && (
            <p className="text-[10px] text-amber-900/75 mb-1">
              Regra: {String(m.regraEtiqueta)}
              {m.severidadeChaveUsada != null ? ` · severidade ${String(m.severidadeChaveUsada)}` : ''}
            </p>
          )}
          <ul className="list-disc pl-4 space-y-1 text-[12px] text-slate-800">
            {adj.map((row, i) => (
              <li key={i}>
                {row.elemento}
                {row.dose ? `: ${row.dose}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      {extras.length > 0 && (
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-amber-950 mb-1">Orientações</p>
          <ul className="list-disc pl-4 space-y-1 text-[12px] text-slate-800">
            {extras.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function fortsmartIaPayloadTemConteudo(ia: FortsmartIaMonitoramento | null | undefined): boolean {
  if (!ia || typeof ia !== 'object') return false;
  const dosesRaw = ia.dosesDefensivos;
  const entradasDoses =
    dosesRaw && typeof dosesRaw === 'object' ? Object.entries(dosesRaw) : ([] as [string, Record<string, unknown>][]);
  const quim = ia.manejoQuimico ?? [];
  const bio = ia.manejoBiologico ?? [];
  const cult = ia.manejoCultural ?? [];
  const motor = ia.motorV2 && typeof ia.motorV2 === 'object' ? (ia.motorV2 as Record<string, unknown>) : null;
  const temDoses = entradasDoses.length > 0;
  const temManejo = quim.length + bio.length + cult.length > 0;
  const temMotor = motor != null && motorV2TemConteudoVisivel(motor);
  return temDoses || temManejo || temMotor;
}

export function RecomendacaoIaFortsmartMonitoramento({ ia }: { ia: FortsmartIaMonitoramento | null | undefined }) {
  if (!ia || typeof ia !== 'object') return null;
  const dosesRaw = ia.dosesDefensivos;
  const entradasDoses =
    dosesRaw && typeof dosesRaw === 'object' ? Object.entries(dosesRaw) : ([] as [string, Record<string, unknown>][]);
  const quim = ia.manejoQuimico ?? [];
  const bio = ia.manejoBiologico ?? [];
  const cult = ia.manejoCultural ?? [];
  const motor = ia.motorV2 && typeof ia.motorV2 === 'object' ? (ia.motorV2 as Record<string, unknown>) : null;

  const temDoses = entradasDoses.length > 0;
  const temManejo = quim.length + bio.length + cult.length > 0;
  const temMotor = motor != null && motorV2TemConteudoVisivel(motor);

  if (!temDoses && !temManejo && !temMotor) return null;

  return (
    <div className="mt-4 border-t border-green-100 pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1B5E20] text-white text-xs shadow-sm">✓</span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-[#1B5E20]">Recomendações técnicas</p>
          <p className="text-[10px] text-slate-500">Prescrição, manejo integrado e nutrição</p>
        </div>
      </div>

      {temDoses && (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#1B5E20]/90">Prescrição química (defensivos)</p>
          <div className="grid gap-2 sm:grid-cols-1">
            {entradasDoses.map(([nome, raw]) => (
              <CartaoDefensivoWeb key={nome} nomeProduto={nome} info={raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}} />
            ))}
          </div>
        </div>
      )}

      {temManejo && (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-teal-900">Manejo integrado (complemento)</p>
          <div className="grid gap-2 md:grid-cols-1">
            <ListaManejo
              titulo="Químico (referência)"
              itens={quim}
              icon={<span className="text-teal-700 text-sm">⚗</span>}
            />
            <ListaManejo titulo="Biológico" itens={bio} icon={<span className="text-green-700 text-sm">🦋</span>} />
            <ListaManejo titulo="Cultural" itens={cult} icon={<span className="text-amber-900/80 text-sm">🌱</span>} />
          </div>
        </div>
      )}

      {temMotor && motor && <BlocoMotorV2Web m={motor} />}
    </div>
  );
}

export type MonitoramentoJson = {
  meta?: Record<string, unknown>;
  fazenda?: string;
  safra?: string;
  data?: string;
  tecnico?: string;
  talhoes?: Array<Record<string, unknown>>;
  metricas?: Record<string, unknown>;
  estande?: Record<string, unknown>;
  cv?: Record<string, unknown>;
  fenologia?: Record<string, unknown>;
  observacoes?: string;
  alertas?: string[];
  organismos?: Array<Record<string, unknown>>;
  imagens?: Array<{ url?: string; descricao?: string; lat?: number; lng?: number; severidade?: number; terco?: string; identificadorPonto?: string }>;
};

export default function RelatorioMonitoramento({ relatorio, reportId }: { relatorio: MonitoramentoJson, reportId?: string }) {
  const meta = relatorio.meta || {};
  const talhoes = relatorio.talhoes || [];
  const principalTalhao = talhoes.length > 0 ? talhoes[0] : {};
  const metricas = relatorio.metricas || {};
  const estande = relatorio.estande || {};
  const cv = relatorio.cv || {};
  const fenologia = relatorio.fenologia || {};
  const organismos = relatorio.organismos || [];

  // Condicoes e Recomendacoes
  const condicoes = (principalTalhao.condicoes_climaticas as Record<string, unknown>) || {};
  const recomendacoes: any[] = Array.isArray((principalTalhao as any).recomendacoes)
    ? ((principalTalhao as any).recomendacoes as any[])
    : (Array.isArray((relatorio as any).recomendacoes) ? (relatorio as any).recomendacoes : []);

  function nivelChip(nivelRaw: unknown) {
    const nivel = String(nivelRaw ?? '').toUpperCase();
    const isCritico = nivel.includes('IMEDIATA') || nivel.includes('CRITICO') || nivel.includes('CRÍTICO');
    const isAlto = nivel.includes('ALTO_RISCO') || nivel.includes('ALTO');
    const isMedio = nivel.includes('MONITORAR') || nivel.includes('MÉDIO') || nivel.includes('MODERADO') || nivel.includes('MEDIO');
    const isBaixo = nivel.includes('PREVENTIVO') || nivel.includes('BAIXO');

    if (isCritico) return { label: 'CRÍTICO', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.35)', text: '#DC2626' };
    if (isAlto) return { label: 'ALTO', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.35)', text: '#C2410C' };
    if (isMedio) return { label: 'MÉDIO', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)', text: '#B45309' };
    if (isBaixo) return { label: 'BAIXO', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.35)', text: '#15803D' };
    return { label: 'MONITORAR', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.35)', text: '#64748B' };
  }

  // Mapear pontos para o formato do MapaInterativo (PontoMonitoramento: id, identificador, lat, lng, infestacoes)
  const pontosMap = (principalTalhao.pontos as any[])?.map((p, i) => ({
    id: p.id || String(Math.random()),
    identificador: p.identificador || `P${i + 1}`,
    lat: p.lat ?? p.latitude ?? 0,
    lng: p.lng ?? p.longitude ?? 0,
    infestacoes: (p.infestacoes || []).map((inf: any, j: number) => ({
      id: String(inf.id ?? `inf-${i}-${j}`),
      tipo: (['praga', 'doenca', 'daninha'].includes(String(inf.tipo ?? '')) ? inf.tipo : 'praga'),
      nome: String(inf.nome ?? '—'),
      terco: String(inf.terco ?? 'Médio'),
      quantidade: inf.quantidade != null ? Number(inf.quantidade) : null,
      severidade: Number(inf.severidade ?? 0),
      observacao: inf.observacao != null ? String(inf.observacao) : undefined,
      imagem: inf.imagem ?? inf.url,
    })),
  })) || [];

  const poligonoDefault = (() => {
    if (principalTalhao.poligono_geojson && typeof (principalTalhao.poligono_geojson as any).geometry === 'object') {
      const g = (principalTalhao.poligono_geojson as any);
      return { type: g.type || 'Feature', geometry: g.geometry, properties: g.properties };
    }
    if (pontosMap.length > 0) {
      let minLat = pontosMap[0].lat, maxLat = pontosMap[0].lat, minLng = pontosMap[0].lng, maxLng = pontosMap[0].lng;
      pontosMap.forEach(p => { if (p.lat < minLat) minLat = p.lat; if (p.lat > maxLat) maxLat = p.lat; if (p.lng < minLng) minLng = p.lng; if (p.lng > maxLng) maxLng = p.lng; });
      const pad = 0.0001;
      return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[minLng - pad, minLat - pad], [maxLng + pad, minLat - pad], [maxLng + pad, maxLat + pad], [minLng - pad, maxLat + pad], [minLng - pad, minLat - pad]]] } };
    }
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-48, -16], [-47.9, -16], [-47.9, -15.9], [-48, -15.9], [-48, -16]]] } };
  })();

  // Galeria de Ocorrencias
  let extractedImagens = relatorio.imagens || [];
  if (extractedImagens.length === 0 && principalTalhao.pontos) {
    extractedImagens = (principalTalhao.pontos as any[]).flatMap(p =>
      (p.infestacoes as any[])?.filter(inf => inf.imagem || inf.url).map(inf => ({
        url: inf.imagem || inf.url,
        descricao: inf.nome,
        lat: p.lat,
        lng: p.lng,
        severidade: inf.severidade,
        terco: inf.terco,
        identificadorPonto: p.identificador
      })) || []
    );
  }

  return (
    <>
      <HeaderRelatorio
        meta={meta as any}
        propriedade={{ fazenda: relatorio.fazenda }}
        talhao={{ nome: principalTalhao.nome as string, cultura: principalTalhao.cultura as string }}
        reportId={reportId || meta.id as string}
      />

      {/* Cabecalhos solicitados */}
      <div className="text-center mb-8 mt-4 animate-fade-in-up">
        <h1 className="text-3xl font-black bg-gradient-to-r from-[#1B5E20] to-[#4CAF50] text-transparent bg-clip-text uppercase tracking-wide">
          SISTEMA FORTSMART AGRO ANÁLISE PROFISSIONAL
        </h1>
        <h2 className="text-xl font-bold text-gray-700 mt-2 uppercase tracking-tight">
          SESSÃO ANÁLISE COMPLETA / VISUALIZAÇÃO INTELIGENTE
        </h2>
        <div className="flex items-center justify-center gap-2 mt-3 text-sm font-semibold text-gray-500 uppercase">
          <span className="bg-gray-100 px-3 py-1 rounded-full">{relatorio.fazenda || 'Fazenda'}</span>
          <span className="bg-gray-100 px-3 py-1 rounded-full">{String(principalTalhao.nome ?? 'Talhão')}</span>
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">{String(principalTalhao.cultura ?? 'Cultura')}</span>
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8 opacity-60"></div>

      {/* Resumo Executivo / Métricas */}
      <section className="mb-10 page-break-inside-avoid">
        <h3 className="text-lg font-bold text-gray-800 border-b-2 border-[#1B5E20] pb-2 mb-4 uppercase tracking-wider text-sm flex items-center">
          <svg className="w-4 h-4 mr-2 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          Resumo Operacional
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Mapeado</span>
            <span className="text-4xl font-black text-slate-800">{Number(metricas.totalPontos || pontosMap.length || 0)}</span>
            <span className="text-xs text-slate-500 mt-1">Pontos verificados</span>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Ocorrências</span>
            <span className="text-4xl font-black text-rose-600">{Number(metricas.totalOcorrencias || organismos.length || 0)}</span>
            <span className="text-xs text-slate-500 mt-1">Registros totais</span>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Severidade Geral</span>
            <span className="text-4xl font-black text-amber-500">{Number(metricas.severidadeMedia || 0).toFixed(1)}%</span>
            <span className="text-xs text-slate-500 mt-1">Média do talhão</span>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Nível Crítico</span>
            <span className={`text-2xl mt-1 font-black px-4 py-1 rounded-full ${String(metricas.nivelRisco || '').toLowerCase().includes('alto') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {String(metricas.nivelRisco || 'Baixo').toUpperCase()}
            </span>
          </div>
        </div>
      </section>

      {/* Condicoes Climaticas, Estande, CV e Fenologia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <InfoGrid
          title="Dados Climáticos e Operacionais"
          items={[
            ['Temperatura', condicoes.temperatura ? `${condicoes.temperatura}°C` : '—'],
            ['Umidade Relativa', condicoes.umidade ? `${condicoes.umidade}%` : '—'],
            ['Condição Climática', String(condicoes.condicaoTempo || '—')]
          ]}
        />
        <InfoGrid
          title="Dados Complementares"
          items={[
            ['Fenologia / Estágio', String(fenologia.estadio || principalTalhao.estagio || '—')],
            ['DAE / DAP', fenologia.dae ? `${fenologia.dae} dias` : (principalTalhao.diasAposEmergencia ? `${principalTalhao.diasAposEmergencia} dias` : '—')],
            ['Estande (População)', estande.populacao ? formatNumber(Number(estande.populacao)) + ' pl/ha' : '—'],
            ['CV (Coef. Var.)', cv.cvPercent ? String(cv.cvPercent) + '%' : '—']
          ]}
        />
      </div>

      {/* Tabela Organismos */}
      {organismos.length > 0 && (
        <section className="mb-10 page-break-inside-avoid">
          <TabelaDados
            title="Dados dos Organismos"
            headers={['Organismo', 'Categoria', 'Frequência', 'Média/Ponto', 'Severidade']}
            rows={organismos.map(o => [
              <span key="nome" className="font-bold text-gray-800">{String(o.nome || '—')}</span>,
              <span key="tipo" className="text-xs font-semibold px-2 py-1 rounded-md bg-gray-100 text-gray-600 uppercase tracking-widest">{String(o.categoria || o.tipo || '—')}</span>,
              `${o.pontosAfetados || 0} pts (${Math.round(Number(o.frequencia || o.incidencia || 0) * 100)}%)`,
              String(o.quantidadeMedia || 0),
              <div key="sev" className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (Number(o.severidadeMedia || 0)))}%`, backgroundColor: Number(o.severidadeMedia) > 30 ? '#ef4444' : '#f59e0b' }}></div>
                </div>
                <span className="font-bold">{Number(o.severidadeMedia || 0).toFixed(1)}%</span>
              </div>
            ])}
          />
        </section>
      )}

      {/* Mapa */}
      {(pontosMap.length > 0) && (
        <section className="mb-12">
          <h3 className="text-lg font-bold text-gray-800 border-b-2 border-orange-500 pb-2 mb-4 uppercase tracking-wider text-sm flex items-center">
            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Distribuição Espacial e Heatmap Térmico
          </h3>
          <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-xl">
            <MapaInterativo
              pontos={pontosMap}
              poligono={poligonoDefault}
              talhaoId={String(principalTalhao.id ?? 'talhao')}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center uppercase tracking-widest font-semibold">Os pontos no mapa indicam as ocorrências. Clique para exibir os detalhes básicos existentes no ponto.</p>
        </section>
      )}

      {/* Recomendacoes Agronômicas */}
      {recomendacoes.length > 0 && (
        <section className="mb-12 page-break-inside-avoid">
          <h3 className="text-lg font-bold text-[#1B5E20] border-b-2 border-[#4CAF50] pb-2 mb-1 uppercase tracking-wider text-sm flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Recomendações Agronômicas
          </h3>
          <p className="text-[11px] text-slate-500 mb-4 font-medium leading-relaxed max-w-3xl">
            Inclui resumo por organismo e, quando disponível, prescrição detalhada, manejo integrado e nutrição da cultura.
          </p>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-6 rounded-xl shadow-sm">
            <div className="space-y-4">
              {recomendacoes.map((r, i) => {
                if (typeof r === 'string') {
                  return (
                    <div
                      key={i}
                      className="flex gap-4 bg-white border border-green-100 p-4 rounded-xl shadow-sm"
                    >
                      <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                        {i + 1}
                      </div>
                      <div className="text-slate-800 font-semibold text-[14px] leading-relaxed whitespace-pre-wrap">
                        {r}
                      </div>
                    </div>
                  );
                }

                const rr = r as any;
                const chip = nivelChip(rr.nivel);
                const organismo = String(rr.organismo ?? '—');
                const produto = String(rr.produto ?? '').trim();
                const dose = String(rr.dose ?? '').trim();
                const acao = String(rr.acao ?? '').trim();
                const severidade = typeof rr.severidade === 'number' ? rr.severidade : undefined;

                return (
                  <div
                    key={i}
                    className="flex gap-4 bg-white border border-green-100 p-4 rounded-xl shadow-sm"
                  >
                    <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                      {i + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className="text-[11px] font-black px-3 py-1 rounded-full border"
                            style={{ backgroundColor: chip.bg, borderColor: chip.border, color: chip.text }}
                          >
                            {chip.label}
                          </span>

                          <div>
                            <div className="font-bold text-gray-900 text-[15px] leading-snug">
                              {organismo}
                            </div>
                            {(produto || dose) && (
                              <div className="text-sm text-gray-600 mt-0.5">
                                {produto && <span className="font-semibold">{produto}</span>}
                                {produto && dose && <span className="text-gray-400 mx-1">•</span>}
                                {dose && <span className="font-mono">{dose}</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {severidade != null && (
                          <div className="text-right">
                            <div className="text-xs font-semibold text-gray-600">
                              Severidade
                            </div>
                            <div className="text-sm font-black text-slate-800">
                              {Number(severidade).toFixed(0)}%
                            </div>
                          </div>
                        )}
                      </div>

                      {acao && (
                        <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {acao}
                        </div>
                      )}

                      <RecomendacaoIaFortsmartMonitoramento ia={rr.fortsmartIa as FortsmartIaMonitoramento | undefined} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Galeria */}
      {extractedImagens.length > 0 && (
        <section className="mb-12 page-break-before-always">
          <h3 className="text-lg font-bold text-gray-800 border-b-2 border-indigo-500 pb-2 mb-4 uppercase tracking-wider text-sm flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Imagens de Cada Ponto (Galeria com Preview Zoom)
          </h3>
          <GaleriaOcorrencias pontos={pontosMap} />
        </section>
      )}

      {/* Observacoes gerais */}
      {relatorio.observacoes && (
        <section className="mb-12">
          <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 mb-4 uppercase tracking-wider text-sm">Observações Gerais</h3>
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
            {relatorio.observacoes}
          </div>
        </section>
      )}

      <ReportFooter meta={meta as { id?: string; appVersion?: string; versao?: number }} reportId={reportId} />
    </>
  );
}
