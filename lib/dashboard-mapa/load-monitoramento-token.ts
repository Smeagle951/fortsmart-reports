/**
 * Loader servidor: relatório por token para `/dashboard/mapa?token=`.
 *
 * **Linha de verdade:** dados gravados pelo app no **SQL** (ex. registo de relatório + coluna `dados`),
 * expostos pelo mesmo mecanismo híbrido que alimenta `/r/[token]`. A web não gera estes dados.
 * Ficheiros **GeoJSON/KML** em cloud são outro pipeline (`?file=`, uploads R2, etc.).
 */
import { getRelatorioByTokenHybrid } from '@/lib/get-relatorio-by-token-hybrid';

import { isMonitoramentoPayloadForMap } from './monitoramento-map-bundle';

function parsePayload(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Carrega o JSON do relatório (**SQL do app / backend**, mesmo fluxo que `/r/[token]`)
 * quando o utilizador abre `/dashboard/mapa?token=...`.
 */
export async function loadMonitoramentoPayloadForMapToken(token: string): Promise<{
  payload: Record<string, unknown> | null;
  error: string | null;
}> {
  const t = token.trim();
  if (!t) return { payload: null, error: null };

  const result = await getRelatorioByTokenHybrid(t);
  if (!result.ok) {
    return { payload: null, error: 'Relatório não encontrado ou link inválido.' };
  }

  const relatorio = parsePayload(result.row.dados);
  if (!relatorio) {
    return { payload: null, error: 'Dados do relatório inválidos ou vazios.' };
  }

  if (!isMonitoramentoPayloadForMap(relatorio)) {
    return {
      payload: null,
      error:
        'Este link não corresponde a um relatório de monitoramento com talhões. Abra o relatório web correto ou use o mapa clássico com GeoJSON (?file=).',
    };
  }

  return { payload: relatorio, error: null };
}
