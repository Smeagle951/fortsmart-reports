'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  parsePlantioFeatureProperties,
  manejoCostSummary,
  moneyDisplay,
  plantingDateDisplay,
  subareaStatusDisplay,
  type PlantioFeatureReadModel,
} from '@/lib/dashboard-mapa/plantio-read-model';

import { AgronomicSummaryTab } from './AgronomicSummaryTab';
import { PlantioManejoTimeline } from './PlantioManejoTimeline';

type TabId = 'resumo' | 'manejo' | 'avaliacoes' | 'comparativo';

type Props = {
  properties: Record<string, unknown> | null;
  onClose: () => void;
  onBackToTalhao?: () => void;
  comparisonCandidates?: PlantioFeatureReadModel[];
};

function ManejoProductsTab({ model }: { model: PlantioFeatureReadModel }) {
  const costs = manejoCostSummary(model);
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Produtos do manejo</p>
      <PlantioManejoTimeline stages={model.manejoStages} recentActivities={model.recentActivities} />
      <dl className="space-y-1 border-t border-slate-200 pt-2 text-[11px]">
        <div className="flex justify-between gap-2"><dt>Produtos/ha</dt><dd>{moneyDisplay(costs.productPerHa)}</dd></div>
        <div className="flex justify-between gap-2"><dt>Operações/ha</dt><dd>{moneyDisplay(costs.operationPerHa)}</dd></div>
        <div className="flex justify-between gap-2 font-semibold"><dt>Total manejo/ha</dt><dd>{moneyDisplay(costs.totalPerHa)}</dd></div>
        <div className="flex justify-between gap-2"><dt>Custo total da subárea</dt><dd>{moneyDisplay(costs.total)}</dd></div>
      </dl>
    </div>
  );
}

function ComparativoTab({ model, peers }: { model: PlantioFeatureReadModel; peers: PlantioFeatureReadModel[] }) {
  const [peerId, setPeerId] = useState(peers[0]?.subareaId ?? '');
  const peer = peers.find((item) => item.subareaId === peerId) ?? peers[0];
  if (!peer) return <p className="text-xs text-slate-500">Selecione duas subáreas comparáveis.</p>;
  const aCost = manejoCostSummary(model);
  const bCost = manejoCostSummary(peer);
  const standDifference = model.agronomic.standMeasured != null && peer.agronomic.standMeasured != null
    ? model.agronomic.standMeasured - peer.agronomic.standMeasured : null;
  const costDifference = aCost.productPerHa != null && bCost.productPerHa != null
    ? aCost.productPerHa - bCost.productPerHa : null;
  const products = (item: PlantioFeatureReadModel) => item.productsTable.length > 0
    ? item.productsTable.map((p) => `${p.name} · ${p.dose} ${p.unit}`).join('; ') : 'Sem produto registrado';
  const rows = [
    ['Área', model.areaHa == null ? '—' : `${model.areaHa.toFixed(2)} ha`, peer.areaHa == null ? '—' : `${peer.areaHa.toFixed(2)} ha`],
    ['Material', model.material, peer.material],
    ['Plantio', plantingDateDisplay(model.agronomic.plantingDate), plantingDateDisplay(peer.agronomic.plantingDate)],
    ['DAP', model.agronomic.dap ?? '—', peer.agronomic.dap ?? '—'],
    ['DAE', model.agronomic.dae ?? 'Aguardando emergência', peer.agronomic.dae ?? 'Aguardando emergência'],
    ['Estande (pl/ha)', model.agronomic.standMeasured ?? '—', peer.agronomic.standMeasured ?? '—'],
    ['População alvo', model.agronomic.standTarget ?? '—', peer.agronomic.standTarget ?? '—'],
    ['Produtos e doses', products(model), products(peer)],
    ['Custo produtos/ha', moneyDisplay(aCost.productPerHa), moneyDisplay(bCost.productPerHa)],
    ['Custo operação/ha', moneyDisplay(aCost.operationPerHa), moneyDisplay(bCost.operationPerHa)],
    ['Custo total', moneyDisplay(aCost.total), moneyDisplay(bCost.total)],
    ['Avaliação', model.manejoStages.find((s) => s.stage === 'avaliacoes_qualidade')?.summary ?? '—', peer.manejoStages.find((s) => s.stage === 'avaliacoes_qualidade')?.summary ?? '—'],
    ['Vigor', model.agronomic.vigor ?? '—', peer.agronomic.vigor ?? '—'],
    ['Desenvolvimento', model.agronomic.phaseLabel ?? '—', peer.agronomic.phaseLabel ?? '—'],
    ['Colheita', model.manejoStages.find((s) => s.stage === 'colheita')?.summary ?? '—', peer.manejoStages.find((s) => s.stage === 'colheita')?.summary ?? '—'],
    ['Produtividade', model.agronomic.productivity ?? '—', peer.agronomic.productivity ?? '—'],
  ];
  return <div className="space-y-2 text-xs">
    <label className="block text-[11px] text-slate-600">Comparar com
      <select className="mt-1 w-full rounded border border-slate-200 p-1.5" value={peer.subareaId ?? ''}
        onChange={(event) => setPeerId(event.target.value)}>
        {peers.map((item) => <option key={item.subareaId} value={item.subareaId ?? ''}>{item.displayName}</option>)}
      </select>
    </label>
    <div className="overflow-x-auto"><table className="w-full min-w-[390px] text-left text-[10px]">
      <thead><tr className="border-b border-slate-200"><th className="py-1">Indicador</th><th>{model.displayName}</th><th>{peer.displayName}</th></tr></thead>
      <tbody>{rows.map(([label, a, b]) => <tr key={String(label)} className="border-b border-slate-100 align-top">
        <th className="py-1 pr-2 font-medium text-slate-600">{label}</th><td className="py-1 pr-2">{a}</td><td className="py-1">{b}</td>
      </tr>)}</tbody>
    </table></div>
    {(standDifference != null || costDifference != null) ? (
      <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-600">
        <p className="font-semibold">Diferença {model.displayName} − {peer.displayName}</p>
        {standDifference != null ? <p>Estande: {standDifference > 0 ? '+' : ''}{standDifference.toLocaleString('pt-BR')} pl/ha</p> : null}
        {costDifference != null ? <p>Produtos: {costDifference > 0 ? '+' : ''}{moneyDisplay(costDifference)}/ha</p> : null}
      </div>
    ) : null}
    <p className="text-[10px] text-slate-500">Comparação descritiva; não indica um manejo vencedor.</p>
  </div>;
}

function AvaliacoesTab({ model }: { model: PlantioFeatureReadModel }) {
  const e = model.evaluation;
  const h = model.harvest;
  const number = (value: number | null, suffix = '') => value == null
    ? null : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${suffix}`;
  const evaluationRows = [
    ['Data da avaliação', e.date ? plantingDateDisplay(e.date) : null],
    ['Plantas medidas', number(e.plantsMeasured)],
    ['Comprimento avaliado', number(e.measuredLengthM, ' m')],
    ['Espaçamento', number(e.rowSpacingM, ' m')],
    ['População calculada', number(e.calculatedPopulation, ' plantas/ha')],
    ['Média', number(e.averagePlantsPerMeter, ' plantas/m')],
    ['Germinação', number(e.germinationPct, '%')], ['Vigor', e.vigor],
    ['Uniformidade', e.uniformity], ['CV', number(e.cvPct, '%')],
    ['Fenologia', e.phenology], ['Pragas', e.pests], ['Doenças', e.diseases],
    ['Daninhas', e.weeds], ['Observações', e.notes],
  ].filter((row): row is string[] => row[1] != null && row[1] !== '');
  const harvestRows = [
    ['Data', h.date ? plantingDateDisplay(h.date) : null],
    ['Área colhida', number(h.areaHa, ' ha')],
    ['Produção', h.production == null ? null : `${number(h.production)} ${h.productionUnit ?? ''}`.trim()],
    ['Produtividade', h.productivity == null ? null : `${number(h.productivity)} ${h.productivityUnit ?? ''}`.trim()],
    ['Umidade', number(h.moisturePct, '%')], ['Impureza', number(h.impurityPct, '%')],
    ['Resultado econômico', h.economicResult == null ? null : moneyDisplay(h.economicResult)],
  ].filter((row): row is string[] => row[1] != null && row[1] !== '');
  return (
    <div className="space-y-4 text-xs text-slate-700">
      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Avaliações</h3>
        {evaluationRows.length === 0 ? <p className="mt-2 text-slate-500">Sem avaliações registradas nesta área.</p> : (
          <dl className="mt-2 divide-y divide-slate-100">{evaluationRows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 py-1.5"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium text-slate-900">{value}</dd></div>
          ))}</dl>
        )}
      </section>
      <section className="border-t border-slate-200 pt-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Colheita</h3>
        {harvestRows.length === 0 ? <p className="mt-2 text-slate-500">Colheita ainda não registrada.</p> : (
          <dl className="mt-2 divide-y divide-slate-100">{harvestRows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 py-1.5"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium text-slate-900">{value}</dd></div>
          ))}</dl>
        )}
      </section>
    </div>
  );
}

export function PlantioAgronomicPanel({ properties, onClose, onBackToTalhao, comparisonCandidates = [] }: Props) {
  const model = useMemo(
    () => (properties ? parsePlantioFeatureProperties(properties) : null),
    [properties],
  );
  const [tab, setTab] = useState<TabId>('resumo');
  useEffect(() => setTab('resumo'), [model?.subareaId, model?.talhaoId]);

  if (!properties || !model) {
    return (
      <div className="flex h-full min-h-[280px] flex-col rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        <p className="font-semibold text-slate-800">Painel agronômico</p>
        <p className="mt-2 text-xs leading-relaxed">
          Selecione um talhão ou subárea no mapa para ver resumo, linha do tempo e produtos registrados.
        </p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'manejo', label: 'Manejo' },
    { id: 'avaliacoes', label: 'Avaliações' },
  ];
  const peers = comparisonCandidates.filter((candidate) =>
    candidate.subareaId !== model.subareaId &&
    candidate.talhaoId === model.talhaoId &&
    candidate.cultura === model.cultura && candidate.safra === model.safra);
  if (model.tipo === 'subarea' && peers.length > 0) {
    tabs.push({ id: 'comparativo', label: 'Comparativo' });
  }

  const active = model.tipo === 'subarea';

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase text-emerald-700">
              {active ? 'Subárea' : 'Talhão'}
            </p>
            <h2 className="truncate text-base font-bold text-slate-900">{model.displayName}</h2>
            <p className="text-[11px] text-slate-500">
              {model.parentTalhaoName ?? model.displayName} · {model.cultura} · Safra {model.safra}
            </p>
            <p className="text-[10px] text-emerald-700">{subareaStatusDisplay(model.agronomic.status)}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        {active && onBackToTalhao ? (
          <button
            type="button"
            className="mt-1 text-[11px] font-semibold text-emerald-700 hover:underline"
            onClick={onBackToTalhao}
          >
            ← Visão do talhão
          </button>
        ) : null}
        <div className="mt-2 flex gap-1 overflow-x-auto border-b border-slate-100 pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`shrink-0 border-b-2 px-2 py-1.5 text-[11px] font-semibold ${
                tab === t.id
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {tab === 'resumo' ? (
          <AgronomicSummaryTab model={model} onVerTodasAtividades={() => setTab('manejo')} />
        ) : null}
        {tab === 'manejo' ? <ManejoProductsTab model={model} /> : null}
        {tab === 'avaliacoes' ? <AvaliacoesTab model={model} /> : null}
        {tab === 'comparativo' && peers.length > 0 ? <ComparativoTab model={model} peers={peers} /> : null}
      </div>
    </div>
  );
}
