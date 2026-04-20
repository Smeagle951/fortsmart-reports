import { describe, expect, it } from 'vitest';
import {
  collectionLayoutLabel,
  warningsFromExperimentDesignJson,
} from '../../lib/experimentDesignWarnings';

describe('warningsFromExperimentDesignJson', () => {
  it('DBC com repetições baixas gera aviso', () => {
    const w = warningsFromExperimentDesignJson({
      delineamento: 'dbc',
      numero_repeticoes: 2,
    });
    expect(w.some((x) => x.code === 'dbc_low_rep')).toBe(true);
  });

  it('parcela pequena gera aviso', () => {
    const w = warningsFromExperimentDesignJson({
      tamanho_parcela_m2: 20,
    });
    expect(w.some((x) => x.code === 'parcel_small')).toBe(true);
  });

  it('muitos tratamentos gera aviso', () => {
    const w = warningsFromExperimentDesignJson({
      numero_tratamentos: 22,
    });
    expect(w.some((x) => x.code === 'many_treatments')).toBe(true);
  });

  it('objeto vazio não gera avisos', () => {
    expect(warningsFromExperimentDesignJson({})).toEqual([]);
  });
});

describe('collectionLayoutLabel', () => {
  it('traduz paired_points', () => {
    expect(collectionLayoutLabel('paired_points')).toContain('pareados');
  });
});
