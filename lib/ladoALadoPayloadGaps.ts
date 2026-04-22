import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { isColheitaJson, isCustoJson } from '@/components/lado_a_lado/ladoALadoHelpers';

/**
 * Lacunas adicionais detectadas só no viewer (o app já preenche `meta.missingData` quando publica com confiança).
 * Serve para o produtor/técnico perceber o que falta para o relatório ficar "redondo" em decisão, economia e registro.
 */
export function supplementWebReportGaps(data: SideBySideReportData): string[] {
  const out: string[] = [];

  if (!data.decision_layer || Object.keys(data.decision_layer).length === 0) {
    out.push('Camada de decisão (motor) indisponível no JSON publicado');
  }

  if (!data.applications || data.applications.length === 0) {
    out.push('Registo de aplicações (applications V2) — execução detalhada por DAA/insumos');
  }

  const e = data.economia;
  const preco = e?.preco_saca_brl;
  if (preco == null || preco <= 0) {
    out.push('Preço de referência da saca (tela Economia do ensaio / preferências)');
  }

  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  if (!colheita?.sides || colheita.sides.length < 2) {
    out.push('Colheita final por manejo (módulo Colheita no app) — fecha ROI e produtividade real');
  }

  const custo = isCustoJson(data.custo) ? data.custo : null;
  if (!custo?.by_side || (custo.by_side?.length ?? 0) < 2) {
    out.push('Custo operacional completo por manejo (estoque + itens) para margem/ROI');
  }

  const a = data.sideA?.photos ?? [];
  const b = data.sideB?.photos ?? [];
  if (a.length === 0 && b.length === 0) {
    out.push('Registo fotográfico — anexar pelo menos uma imagem por manejo');
  } else {
    const diverse =
      (data.economic_analysis as { photoRegistry?: { diverseCategories?: boolean } } | null)?.photoRegistry
        ?.diverseCategories === true;
    if (!diverse) {
      const all = [...a, ...b].filter((p) => p?.url);
      const withCat = all.filter(
        (p) => p.category && p.category.trim() !== '' && p.category.toLowerCase() !== 'geral',
      );
      if (all.length > 0 && withCat.length === 0) {
        out.push(
          'Categorias de fotos (ex.: estande, nutrição, raiz) — além de “Geral” para galeria comparativa',
        );
      }
    }
  }

  if (!data.criteriosEstatistica || data.criteriosEstatistica.length === 0) {
    out.push('Critérios estatísticos (tabela A/B) exportados com o resumo de critérios');
  }

  if (data.experiment_design && !data.plant_evaluation) {
    out.push('Avaliação por planta (amostras) — reforça o comparativo quando há desenho de ensaio');
  }

  const layout = data.collection_layout?.trim();
  if (layout && !data.field_collection_modules?.points?.length) {
    out.push('Módulos de coleta no campo (pontos/lados) alinhados ao layout publicado do ensaio');
  }

  if (!data.evolucao && !data.economic_timeline) {
    out.push('Linha do tempo (DAAs / custo acumulado ou comparação com visita anterior)');
  }

  return out;
}

/**
 * Funde lacunas do `meta.missingData` (Flutter) com as detetadas no web, sem duplicar mensagens.
 */
export function mergeReportDataGaps(
  metaMissing: string[] | null | undefined,
  data: SideBySideReportData,
): string[] {
  const s = new Set<string>();
  for (const x of metaMissing ?? []) {
    if (x.trim()) s.add(x.trim());
  }
  for (const x of supplementWebReportGaps(data)) {
    s.add(x);
  }
  return Array.from(s);
}
