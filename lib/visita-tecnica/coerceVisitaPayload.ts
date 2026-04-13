/**
 * Garante lista de objetos para campos do payload VT que às vezes chegam como
 * mapa (ex.: serialização) ou objeto único — evita crash em .map / for..of.
 */
export function coerceVisitaObjectArray(v: unknown): Record<string, unknown>[] {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v.filter(
      (x): x is Record<string, unknown> =>
        x != null && typeof x === 'object' && !Array.isArray(x),
    );
  }
  if (typeof v === 'object') {
    const vals = Object.values(v as Record<string, unknown>);
    if (
      vals.length > 0 &&
      vals.every((x) => x != null && typeof x === 'object' && !Array.isArray(x))
    ) {
      return vals as Record<string, unknown>[];
    }
    return [v as Record<string, unknown>];
  }
  return [];
}

function coerceAplicacoesArray(v: unknown): unknown[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).filter(
      (x) => x != null && typeof x === 'object',
    );
  }
  return [];
}

function coerceStringArrayLoose(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
  if (typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).map((x) =>
      typeof x === 'string' ? x : JSON.stringify(x),
    );
  }
  return [String(v)];
}

/**
 * Garante `talhoes: Record[]` e remove `talhao` singular (legado V1).
 * Evita payload com os dois campos e priorização errada no React.
 */
function normalizeTalhoesRemoveLegacy(raw: Record<string, unknown>, out: Record<string, unknown>): void {
  const singular = raw.talhao;
  const hasSingular = singular != null && typeof singular === 'object' && !Array.isArray(singular);
  let arr = raw.talhoes;
  if (!Array.isArray(arr) || arr.length === 0) {
    arr = hasSingular ? [singular as Record<string, unknown>] : [];
  }
  out.talhoes = (arr as unknown[]).filter(
    (x): x is Record<string, unknown> =>
      x != null && typeof x === 'object' && !Array.isArray(x),
  );
  delete out.talhao;
}

/**
 * Última linha de defesa antes do Client Component: raiz só com `talhoes[]`, nunca `talhao`.
 * Idempotente se sanitize já tiver rodado.
 */
export function ensureVisitaTecnicaRootTalhoesOnly(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...payload };
  normalizeTalhoesRemoveLegacy(payload, out);
  delete out.talhao;
  return out;
}

/**
 * Última camada antes do React: corrige formatos que o app/DB enviam como objeto
 * ou tipos mistos (evita crash em .map, .trim, for..of).
 */
export function sanitizeVisitaTecnicaPayload(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };

  normalizeTalhoesRemoveLegacy(raw, out);

  out.pragas = coerceVisitaObjectArray(raw.pragas);
  out.desvios = coerceVisitaObjectArray(raw.desvios);
  out.imagens = coerceVisitaObjectArray(raw.imagens);
  out.aplicacoes = coerceAplicacoesArray(raw.aplicacoes) as typeof raw.aplicacoes;

  const checklistRaw = raw.checklist;
  if (checklistRaw != null && typeof checklistRaw === 'object' && !Array.isArray(checklistRaw)) {
    out.checklist = { ...(checklistRaw as Record<string, unknown>) };
  }

  const intel = raw.inteligencia_agronomica;
  if (intel != null && typeof intel === 'object' && !Array.isArray(intel)) {
    const im = { ...(intel as Record<string, unknown>) };
    if (im.padrao != null && !Array.isArray(im.padrao)) {
      im.padrao = coerceStringArrayLoose(im.padrao);
    }
    out.inteligencia_agronomica = im;
  }

  const mapa = raw.mapa;
  if (mapa != null && typeof mapa === 'object' && !Array.isArray(mapa)) {
    const m = { ...(mapa as Record<string, unknown>) };
    if (m.path != null && typeof m.path !== 'string') m.path = String(m.path);
    if (m.viewBox != null && typeof m.viewBox !== 'string') m.viewBox = String(m.viewBox);
    if (m.pontos != null && !Array.isArray(m.pontos)) {
      m.pontos = coerceVisitaObjectArray(m.pontos) as unknown[];
    }
    out.mapa = m;
  }

  const plano = raw.planoAcao;
  if (plano != null && typeof plano === 'object' && !Array.isArray(plano)) {
    const pm = { ...(plano as Record<string, unknown>) };
    if (pm.acoes != null && !Array.isArray(pm.acoes)) {
      pm.acoes = coerceAplicacoesArray(pm.acoes);
    }
    out.planoAcao = pm;
  }

  const diag = raw.diagnostico;
  if (diag != null && typeof diag === 'object' && !Array.isArray(diag)) {
    const dm = { ...(diag as Record<string, unknown>) };
    if (dm.recomendacoes != null && !Array.isArray(dm.recomendacoes)) {
      dm.recomendacoes = coerceStringArrayLoose(dm.recomendacoes);
    }
    out.diagnostico = dm;
  }

  delete out.talhao;
  return out;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(v: unknown): UnknownRecord | undefined {
  if (v != null && typeof v === 'object' && !Array.isArray(v)) return v as UnknownRecord;
  return undefined;
}

function arrayOfRecords(v: unknown): UnknownRecord[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is UnknownRecord => x != null && typeof x === 'object' && !Array.isArray(x));
}

function condicoesHasMeaningfulData(c: unknown): boolean {
  const o = asRecord(c);
  if (!o) return false;
  const skip = new Set(['amostragem']);
  for (const [k, v] of Object.entries(o)) {
    if (skip.has(k)) continue;
    if (v != null && String(v).trim() !== '') return true;
  }
  const am = asRecord(o.amostragem);
  if (am) {
    for (const v of Object.values(am)) {
      if (v != null && String(v).trim() !== '') return true;
    }
  }
  return false;
}

function planoAcaoPrecisaSnapshot(plano: unknown): boolean {
  if (plano == null) return true;
  const o = asRecord(plano);
  if (!o) return true;
  const acoes = o.acoes;
  return !Array.isArray(acoes) || acoes.length === 0;
}

function diagnosticoPrecisaSnapshot(d: unknown): boolean {
  if (d == null) return true;
  const o = asRecord(d);
  if (!o) return true;
  const pp = o.problemaPrincipal != null ? String(o.problemaPrincipal).trim() : '';
  const cp = o.causaProvavel != null ? String(o.causaProvavel).trim() : '';
  return pp === '' && cp === '';
}

function mapRiscoSnapshotParaNivel(risco: unknown): string {
  const r = String(risco ?? '').toLowerCase();
  if (r.includes('baix')) return 'Baixo';
  if (r.includes('alt') || r.includes('crit')) return 'Alto';
  return 'Moderado';
}

function mapSnapshotPragaParaRaiz(row: UnknownRecord): UnknownRecord {
  const nome = String(row.nome ?? row.alvo ?? '—').trim() || '—';
  const tipoRaw = String(row.tipo ?? 'praga').toLowerCase();
  let tipo = 'praga';
  if (tipoRaw.includes('doen')) tipo = 'doença';
  else if (tipoRaw.includes('daninh')) tipo = 'daninha';
  const sev = String(row.severidade ?? 'baixa').toLowerCase();
  let situacao = 'Monitorar';
  if (sev.includes('baixa')) situacao = 'OK';
  else if (sev.includes('alta') || sev.includes('crit')) situacao = 'Atenção';
  let severidadeLabel = 'Baixa';
  if (sev.includes('alta')) severidadeLabel = 'Alta';
  else if (sev.includes('méd') || sev.includes('med')) severidadeLabel = 'Média';
  const inc = String(row.incidencia ?? row.observacoes ?? '—').trim() || '—';
  const out: UnknownRecord = {
    tipo,
    alvo: nome,
    incidencia: inc,
    severidade: severidadeLabel,
    situacao,
  };
  if (row.observacoes != null && String(row.observacoes).trim() !== '') {
    out.observacoes = row.observacoes;
  }
  if (row.origem != null) out.origem = row.origem;
  if (row.occurrence_id != null) out.occurrence_id = row.occurrence_id;
  return out;
}

function mapSnapshotDesvioParaRaiz(row: UnknownRecord): UnknownRecord {
  const impact = String(row.impacto ?? 'medio').toLowerCase();
  let severidade = 'Média';
  if (impact.includes('alt')) severidade = 'Alta';
  else if (impact.includes('baix') || impact.includes('baixo')) severidade = 'Baixa';
  return {
    tipo: row.tipo != null ? String(row.tipo) : '—',
    descricao: row.descricao != null ? String(row.descricao) : '—',
    severidade,
    status: 'Aberto',
  };
}

function mapSnapshotAplicParaRaiz(row: UnknownRecord): UnknownRecord {
  const status = String(row.status ?? 'recomendado').toLowerCase();
  const aplicado = status.includes('aplic');
  const obj = row.objetivo != null ? String(row.objetivo) : '';
  return {
    tipo: aplicado ? 'Aplicação' : 'Prescrição',
    data: row.data != null && String(row.data).trim() !== '' ? String(row.data) : '—',
    produto: row.produto != null ? String(row.produto) : '—',
    dose: row.dose != null ? String(row.dose) : undefined,
    status: aplicado ? 'Executada' : 'Recomendada',
    alvo: obj.trim() !== '' ? obj : '—',
    observacoes: obj.trim() !== '' ? obj : undefined,
  };
}

/**
 * Promove dados canónicos de `visita_snapshot` / `visita` para as chaves raiz
 * que o viewer (`RelatorioVisitaTecnicaContent`) consome, quando a raiz está vazia
 * ou incompleta. Deve correr **antes** de `sanitizeVisitaTecnicaPayload`.
 */
export function mergeVisitaSnapshotIntoFlatBeforeSanitize(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };

  const snap = asRecord(out.visita_snapshot) ?? asRecord(out.visita);
  if (snap == null) return out;

  if (out.visita_snapshot == null) {
    out.visita_snapshot = { ...snap };
  }
  if (out.visita == null) {
    out.visita = { ...snap };
  }

  const pragasExistentes = coerceVisitaObjectArray(out.pragas);
  const pd = arrayOfRecords(snap.pragas_doencas);
  if (pragasExistentes.length === 0 && pd.length > 0) {
    out.pragas = pd.map(mapSnapshotPragaParaRaiz);
  }

  const desviosExistentes = coerceVisitaObjectArray(out.desvios);
  const sd = arrayOfRecords(snap.desvios);
  if (desviosExistentes.length === 0 && sd.length > 0) {
    out.desvios = sd.map(mapSnapshotDesvioParaRaiz);
  }

  const aplicRaw = out.aplicacoes;
  const aplicLista = Array.isArray(aplicRaw) ? aplicRaw : [];
  const apSnap = arrayOfRecords(snap.aplicacoes_prescricoes);
  if (aplicLista.length === 0 && apSnap.length > 0) {
    out.aplicacoes = apSnap.map(mapSnapshotAplicParaRaiz);
  }

  if (planoAcaoPrecisaSnapshot(out.planoAcao)) {
    const pa = arrayOfRecords(snap.plano_acao);
    if (pa.length > 0) {
      const prev = asRecord(out.planoAcao);
      const objM = prev?.objetivoManejo != null ? String(prev.objetivoManejo).trim() : '';
      out.planoAcao = {
        objetivoManejo: objM,
        acoes: pa.map((a) => ({
          prioridade: String(a.prioridade ?? 'media'),
          acao: a.acao != null ? String(a.acao) : '',
          prazo: a.prazo != null ? String(a.prazo) : '',
        })),
      };
    }
  }

  if (diagnosticoPrecisaSnapshot(out.diagnostico)) {
    const df = asRecord(snap.diagnostico_final);
    const resumo = df?.resumo != null ? String(df.resumo).trim() : '';
    const risco = df?.risco;
    const pot = df?.potencial_produtivo != null ? String(df.potencial_produtivo).trim() : '';
    if (resumo !== '' || String(risco ?? '').trim() !== '' || pot !== '') {
      out.diagnostico = {
        ...(asRecord(out.diagnostico) ?? {}),
        problemaPrincipal: resumo !== '' ? resumo : '—',
        nivelRisco: mapRiscoSnapshotParaNivel(risco),
        ...(pot !== '' ? { causaProvavel: pot } : {}),
        origem: 'final',
      };
    }
  }

  if (!condicoesHasMeaningfulData(out.condicoes)) {
    const cm = asRecord(snap.condicoes_momento);
    if (cm) {
      const sint = [cm.clima, cm.observacoes]
        .map((x) => (x != null ? String(x).trim() : ''))
        .filter((s) => s.length > 0)
        .join(' · ');
      const temp = cm.temperatura != null ? String(cm.temperatura).trim() : '';
      const umid = cm.umidade != null ? String(cm.umidade).trim() : '';
      out.condicoes = {
        ...(temp !== '' ? { temperatura: temp } : {}),
        ...(umid !== '' ? { umidade: umid } : {}),
        ...(sint !== '' ? { sintomas: sint } : {}),
      };
    }
  }

  if (out.evolucao == null && snap.evolucao != null && typeof snap.evolucao === 'object' && !Array.isArray(snap.evolucao)) {
    out.evolucao = { ...(snap.evolucao as UnknownRecord) };
  }

  return out;
}
