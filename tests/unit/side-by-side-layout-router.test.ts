import { describe, expect, it, vi } from 'vitest';
import SideBySideReportContent, {
  type SideBySideReportData,
} from '../../components/SideBySideReportContent';

const { DashboardMock, PremiumMock } = vi.hoisted(() => ({
  DashboardMock: vi.fn(() => null),
  PremiumMock: vi.fn(() => null),
}));

vi.mock('../../components/lado_a_lado/RelatorioLadoALadoDashboard', () => ({
  default: DashboardMock,
}));

vi.mock('../../components/lado_a_lado/premium/PremiumReport', () => ({
  default: PremiumMock,
}));

function makeData(reportLayout?: 'premium' | 'dashboard'): SideBySideReportData {
  return {
    tipo: 'avaliacao_lado_a_lado',
    branding: reportLayout ? { reportLayout } : undefined,
  };
}

describe('SideBySideReportContent layout router', () => {
  it('renderiza dashboard quando branding.reportLayout = dashboard', () => {
    const element = SideBySideReportContent({
      data: makeData('dashboard'),
      reportId: 'r1',
      shareToken: 't1',
    });
    expect(element.type).toBe(DashboardMock);
  });

  it('renderiza premium por padrao quando reportLayout nao e dashboard', () => {
    const element = SideBySideReportContent({
      data: makeData('premium'),
      reportId: 'r2',
      shareToken: 't2',
    });
    expect(element.type).toBe(PremiumMock);
  });

  it('renderiza premium quando branding nao vier no payload', () => {
    const element = SideBySideReportContent({
      data: makeData(),
      reportId: 'r3',
      shareToken: 't3',
    });
    expect(element.type).toBe(PremiumMock);
  });
});
