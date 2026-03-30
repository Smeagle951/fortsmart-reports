import { describe, expect, it } from 'vitest';
import { normalizeRelatorioPlantio } from '../../lib/normalize-relatorio-plantio';

describe('normalizeRelatorioPlantio — analiseAgronomica e datas de talhão', () => {
  it('preserva analiseAgronomica e normaliza datas camel/snake no talhão', () => {
    const raw = {
      talhao: {
        id: 't1',
        nome: 'Talhão 1',
        cultura: 'Soja',
        data_emergencia: '2025-11-10',
        data_germinacao: '2025-11-08',
        data_avaliacao_estande: '2025-11-15',
      },
      contextoSafra: { dae: 12, dap: 20 },
      analiseAgronomica: {
        implantacao: { insight: 'Teste', cvPercentual: 14.2 },
        motor: {
          riscoProdutivo: 'medio',
          correlacoes: [{ mensagem: 'CV elevado' }],
          subscores: { implantacao: 72, geral: 68 },
        },
      },
    };

    const out = normalizeRelatorioPlantio(raw as Record<string, unknown>);
    const tal = out.talhao as Record<string, unknown>;
    expect(tal.dataEmergencia).toBe('2025-11-10');
    expect(tal.dataGerminacao).toBe('2025-11-08');
    expect(tal.dataAvaliacaoEstande).toBe('2025-11-15');

    const a = out.analiseAgronomica as Record<string, unknown>;
    expect(a).toBeDefined();
    const motor = a.motor as Record<string, unknown>;
    expect(motor.riscoProdutivo).toBe('medio');
    expect(Array.isArray(motor.correlacoes)).toBe(true);
  });
});
