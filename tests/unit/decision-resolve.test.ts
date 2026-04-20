import { describe, expect, it } from 'vitest';
import { resolveDecision } from '../../lib/decision';

describe('resolveDecision', () => {
  it('prioriza vencedor do app quando presente', () => {
    const r = resolveDecision({
      conclusion: { winner: 'A' },
      decision_layer: { engineOverallWinner: 'B' },
    });
    expect(r.final).toBe('A');
    expect(r.conflict).toBe(true);
    expect(r.app).toBe('A');
    expect(r.engine).toBe('B');
  });

  it('sem conflito quando motor empata', () => {
    const r = resolveDecision({
      conclusion: { winner: 'A' },
      decision_layer: { engineOverallWinner: 'tie' },
    });
    expect(r.conflict).toBe(false);
    expect(r.final).toBe('A');
  });

  it('usa motor quando não há winner no app', () => {
    const r = resolveDecision({
      conclusion: {},
      decision_layer: { engineOverallWinner: 'B' },
    });
    expect(r.final).toBe('B');
    expect(r.conflict).toBe(false);
    expect(r.app).toBeNull();
  });

  it('empate final quando não há app nem motor definido', () => {
    const r = resolveDecision({
      conclusion: {},
      decision_layer: { engineOverallWinner: 'tie' },
    });
    expect(r.final).toBe('tie');
  });
});
