import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('side-by-side enterprise payload (fixture)', () => {
  it('mantém chaves canônicas e lacunas econômicas', () => {
    const p = path.join(__dirname, '../fixtures/side-by-side-enterprise.min.json');
    const json = JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>;

    expect(json.schemaVersion).toBe('2.1');
    expect(json.economic_analysis).toBeTruthy();
    expect(json.media_gallery).toBeTruthy();
    expect(json.evolution_timeline).toBeTruthy();
    expect(json.quality_check).toBeTruthy();

    const dl = json.decision_layer as { dataQuality?: { enterpriseEconomicsSuppressed?: boolean } };
    expect(dl.dataQuality?.enterpriseEconomicsSuppressed).toBe(true);
  });
});
