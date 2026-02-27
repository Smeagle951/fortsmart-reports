import React from 'react';
import { ReportFooter } from './Header';
import HeaderRelatorio from './HeaderRelatorio';
import { formatNumber, formatPercent } from '../utils/format';
import { InfoGrid } from './TabelaDados';
import TabelaDados from './TabelaDados';
import dynamic from 'next/dynamic';
import GaleriaOcorrencias from './GaleriaOcorrencias';

const MapaInterativo = dynamic(() => import('./MapaInterativo'), { ssr: false });

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
  const recomendacoes = (principalTalhao.recomendacoes as Array<{ acao: string }>) || (relatorio as any).recomendacoes || [];

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
          <h3 className="text-lg font-bold text-[#1B5E20] border-b-2 border-[#4CAF50] pb-2 mb-4 uppercase tracking-wider text-sm flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Recomendações Agronômicas
          </h3>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-6 rounded-xl shadow-sm">
            <ul className="space-y-4">
              {recomendacoes.map((r, i) => (
                <li key={i} className="flex gap-4">
                  <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                    {i + 1}
                  </div>
                  <div>
                    <span className="text-slate-800 font-semibold text-[15px] leading-relaxed block">{r.acao || (r as { nome?: string }).nome || String(r)}</span>
                    {(r as any).justificativa && <span className="text-sm text-slate-500 mt-1 block">{(r as any).justificativa}</span>}
                  </div>
                </li>
              ))}
            </ul>
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
