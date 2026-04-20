import type { ExperimentDesignJson } from '@/types/side-by-side-report';

export type ExperimentDesignWarning = { code: string; message: string };

/**
 * Avisos não bloqueantes espelhando a lógica de `ExperimentDesignValidation` no app —
 * apenas a partir de números presentes no JSON publicado.
 */
export function warningsFromExperimentDesignJson(
  design: ExperimentDesignJson | null | undefined,
): ExperimentDesignWarning[] {
  if (!design || typeof design !== 'object') return [];
  const out: ExperimentDesignWarning[] = [];

  const del = String(design.delineamento ?? 'dbc').toLowerCase().trim();
  const nRep =
    typeof design.numero_repeticoes === 'number' && Number.isFinite(design.numero_repeticoes)
      ? design.numero_repeticoes
      : null;
  if (del === 'dbc' && nRep != null && nRep < 3) {
    out.push({
      code: 'dbc_low_rep',
      message:
        'DBC com menos de 3 repetições — análise estatística comprometida. Recomendado: mínimo 4 rep.',
    });
  }

  const parcel =
    typeof design.tamanho_parcela_m2 === 'number' && Number.isFinite(design.tamanho_parcela_m2)
      ? design.tamanho_parcela_m2
      : null;
  if (parcel != null && parcel > 0 && parcel < 30) {
    out.push({
      code: 'parcel_small',
      message: 'Parcelas pequenas (<30 m²) — risco de efeito borda. Recomendado: mínimo 60 m².',
    });
  }

  const nTrat =
    typeof design.numero_tratamentos === 'number' && Number.isFinite(design.numero_tratamentos)
      ? design.numero_tratamentos
      : null;
  if (nTrat != null && nTrat > 20) {
    out.push({
      code: 'many_treatments',
      message:
        'Muitos tratamentos — considere experimento fatorial ou subdividir em ensaios menores.',
    });
  }

  return out;
}

export function collectionLayoutLabel(layout: string | null | undefined): string | null {
  const k = (layout || '').trim();
  if (!k) return null;
  const map: Record<string, string> = {
    paired_points: 'Pontos pareados (A e B no mesmo ponto de amostragem)',
    parcel_per_treatment: 'Parcela por tratamento',
  };
  return map[k] ?? k;
}
