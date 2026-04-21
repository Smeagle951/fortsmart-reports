/**
 * Hash da forma (caminhos de chaves) do JSON de relatório — detetar drift estrutural Postgres vs Supabase.
 * Server-only (node:crypto).
 */

import { createHash } from 'node:crypto';

function hash12(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 12);
}

export function relatorioSchemaHash(dados: unknown): string {
  const parts: string[] = [];
  const walk = (v: unknown, p: string, d: number) => {
    if (d > 32) {
      parts.push(p + '…');
      return;
    }
    if (v == null) {
      if (p) parts.push(p + ':0');
      return;
    }
    if (Array.isArray(v)) {
      parts.push(p + '[]');
      if (v.length > 0) walk(v[0], p ? `${p}[]0` : '[]0', d + 1);
      return;
    }
    if (typeof v === 'object' && v !== null) {
      for (const k of Object.keys(v as object).sort()) {
        walk((v as Record<string, unknown>)[k], p ? `${p}.${k}` : k, d + 1);
      }
    } else if (p) {
      parts.push(p + ':$');
    }
  };
  walk(dados, '', 0);
  return hash12(parts.sort().join('|'));
}
