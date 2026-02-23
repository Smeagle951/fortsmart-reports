import { NextResponse } from 'next/server';
import { getDatabasePath } from '@/lib/db/findDatabase';
import { mockRelatorio } from '@/lib/data/mock_monitoring';
import { RelatorioMonitoramento, Talhao, PontoMonitoramento, Infestacao, TipoOrganismo } from '@/lib/types/monitoring';

// better-sqlite3 só está disponível em ambiente local (Node.js real).
// Na Vercel (serverless) ele não existe — sempre cai em mock.
let BetterSqlite3: ((path: string, opts: object) => unknown) | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    BetterSqlite3 = require('better-sqlite3');
} catch {
    // Ambiente sem o módulo nativo (Vercel, CI, etc.) — usa mock
}


// ─── Tipos internos SQLite ────────────────────────────────────────────────────
interface SessionRow {
    id: string;
    talhao_id: string;
    cultura_nome: string;
    cultura_id: string;
    started_at: string;
    status: string;
}

interface PointRow {
    id: string;
    session_id: string;
    numero: number;
    latitude: number;
    longitude: number;
    timestamp: string;
}

interface OccurrenceRow {
    id: string;
    point_id: string;
    organism_id: string;
    valor_bruto: number;
    observacao?: string;
    org_name: string;
    org_type: string;
    low_limit: number;
    medium_limit: number;
    high_limit: number;
}

interface TalhaoRow {
    id: number | string;
    name: string;
    area?: number;
    farm_id?: string;
}

interface PoligonoRow {
    id: number;
    talhao_id: number;
    poligono_index: number;
    points: string; // JSON: [{lat, lng}, ...]
}

interface FazendaRow {
    nome?: string;
    name?: string;
}

// ─── Mapeamento tipo organismo ────────────────────────────────────────────────
function mapTipo(tipo: string): TipoOrganismo {
    const t = (tipo ?? '').toLowerCase();
    if (t.includes('praga') || t.includes('inseto')) return 'praga';
    if (t.includes('doen') || t.includes('fungo') || t.includes('bact')) return 'doenca';
    return 'daninha';
}

// ─── Severidade normalizada 0-100 baseada nos limites do catálogo ─────────────
function calcSeveridade(val: number, low: number, medium: number, high: number): number {
    if (val <= 0) return 0;
    if (val <= low) return Math.round((val / Math.max(low, 1)) * 10);
    if (val <= medium) return Math.round(10 + ((val - low) / Math.max(medium - low, 1)) * 15);
    if (val <= high) return Math.round(25 + ((val - medium) / Math.max(high - medium, 1)) * 15);
    return Math.min(100, Math.round(40 + ((val - high) / Math.max(high, 1)) * 60));
}

// ─── Converter points JSON [{lat,lng}] → GeoJSON Feature ────────────────────
function pointsJsonToGeoJSON(pointsJson: string, talhaoId: number | string): Talhao['poligono_geojson'] | null {
    try {
        const pts = JSON.parse(pointsJson) as { lat: number; lng: number }[];
        if (!pts || pts.length < 3) return null;

        // GeoJSON usa [lng, lat] — fechar polígono repetindo o primeiro ponto
        const coords = pts.map(p => [p.lng, p.lat]);
        coords.push(coords[0]); // fechar anel

        return {
            type: 'Feature',
            properties: { talhao_id: String(talhaoId) },
            geometry: {
                type: 'Polygon',
                coordinates: [coords],
            },
        };
    } catch {
        return null;
    }
}

// ─── Polígono padrão centrado nos pontos de monitoramento ────────────────────
function buildPolygonFromPoints(pontos: PointRow[], radiusKm = 0.25): Talhao['poligono_geojson'] {
    if (pontos.length === 0) {
        return {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[-46.23, -23.54], [-46.22, -23.54], [-46.22, -23.55], [-46.23, -23.55], [-46.23, -23.54]]] },
        };
    }
    const avgLat = pontos.reduce((s, p) => s + p.latitude, 0) / pontos.length;
    const avgLng = pontos.reduce((s, p) => s + p.longitude, 0) / pontos.length;
    const deg = radiusKm / 111;
    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [avgLng - deg, avgLat - deg],
                [avgLng + deg, avgLat - deg],
                [avgLng + deg, avgLat + deg],
                [avgLng - deg, avgLat + deg],
                [avgLng - deg, avgLat - deg],
            ]],
        },
    };
}

// ─── Leitura do banco real ────────────────────────────────────────────────────
function readFromDatabase(dbPath: string): RelatorioMonitoramento {
    if (!BetterSqlite3) return mockRelatorio;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (BetterSqlite3 as any)(dbPath, { readonly: true, fileMustExist: true });

    try {
        const tables = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).all().map((r: { name: string }) => r.name) as string[];

        const hasSessions = tables.includes('monitoring_sessions');
        const hasPoints = tables.includes('monitoring_points');
        const hasOccur = tables.includes('monitoring_occurrences');
        const hasOrganisms = tables.includes('organism_catalog');
        const hasTalhoes = tables.includes('talhoes');
        const hasPoligonos = tables.includes('poligonos_talhao');   // ← tabela real dos polígonos
        const hasSafras = tables.includes('safras_talhao');

        if (!hasSessions || !hasPoints || !hasOccur) {
            return mockRelatorio;
        }

        // ── Fazenda ───────────────────────────────────────────────────────────
        let fazendaNome = 'Fazenda';
        const fazTable = tables.find(t => t === 'fazendas' || t === 'properties');
        if (fazTable) {
            const faz = db.prepare(`SELECT nome, name FROM ${fazTable} LIMIT 1`).get() as FazendaRow | undefined;
            fazendaNome = faz?.nome ?? faz?.name ?? fazendaNome;
        }

        // ── Sessões finalizadas (mais recente por talhão) ─────────────────────
        const sessions = db.prepare(`
      SELECT id, talhao_id, cultura_nome, cultura_id, started_at, status
      FROM monitoring_sessions
      WHERE status IN ('finalized','draft')
      ORDER BY started_at DESC
    `).all() as SessionRow[];

        if (sessions.length === 0) return mockRelatorio;

        // Pegar só a sessão mais recente por talhão
        const sessPerTalhao: Record<string, SessionRow> = {};
        for (const s of sessions) {
            if (!sessPerTalhao[s.talhao_id]) sessPerTalhao[s.talhao_id] = s;
        }

        // ── Mapa de talhões (nome, área) ──────────────────────────────────────
        const talhaoInfo: Record<string, TalhaoRow> = {};
        if (hasTalhoes) {
            const rows = db.prepare('SELECT id, name, area, farm_id FROM talhoes WHERE deleted_at IS NULL').all() as TalhaoRow[];
            for (const r of rows) talhaoInfo[String(r.id)] = r;
        }

        // ── Mapa de polígonos reais: talhao_id → GeoJSON Feature ─────────────
        const poligonoMap: Record<string, Talhao['poligono_geojson']> = {};
        if (hasPoligonos) {
            // Cada talhão pode ter vários polígonos; pega o de índice 0 (principal)
            const poliRows = db.prepare(`
        SELECT id, talhao_id, poligono_index, points
        FROM poligonos_talhao
        WHERE poligono_index = 0
        ORDER BY talhao_id ASC
      `).all() as PoligonoRow[];

            for (const row of poliRows) {
                const geoJSON = pointsJsonToGeoJSON(row.points, row.talhao_id);
                if (geoJSON) poligonoMap[String(row.talhao_id)] = geoJSON;
            }
        }

        // ── Safra atual ───────────────────────────────────────────────────────
        let safraLabel = `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`;
        if (hasSafras) {
            const safra = db.prepare(
                "SELECT safra FROM safras_talhao WHERE deleted_at IS NULL ORDER BY data_criacao DESC LIMIT 1"
            ).get() as { safra?: string } | undefined;
            if (safra?.safra) safraLabel = safra.safra;
        }

        // ── Construir talhões ──────────────────────────────────────────────────
        const talhoes: Talhao[] = [];
        let idx = 0;

        for (const [talhaoId, sess] of Object.entries(sessPerTalhao)) {
            if (idx >= 10) break;
            idx++;

            const info = talhaoInfo[talhaoId];
            const nome = info?.name ?? `Talhão ${String(idx).padStart(2, '0')}`;
            const area = info?.area ?? 0;

            // ── Pontos GPS reais desta sessão ──────────────────────────────────
            const pointRows = db.prepare(`
        SELECT id, session_id, numero, latitude, longitude, timestamp
        FROM monitoring_points
        WHERE session_id = ?
        ORDER BY numero ASC
      `).all(sess.id) as PointRow[];

            // ── Polígono real do talhão; fallback = bbox dos pontos GPS ────────
            const poligono: Talhao['poligono_geojson'] =
                poligonoMap[talhaoId] ?? buildPolygonFromPoints(pointRows);

            // ── Pontos com ocorrências ─────────────────────────────────────────
            const pontos: PontoMonitoramento[] = pointRows.map(point => {
                let occRows: OccurrenceRow[] = [];

                if (hasOrganisms) {
                    occRows = db.prepare(`
            SELECT
              o.id, o.point_id, o.organism_id, o.valor_bruto, o.observacao,
              COALESCE(c.name, o.organism_id) AS org_name,
              COALESCE(c.type, 'praga')        AS org_type,
              COALESCE(c.low_limit,  10)       AS low_limit,
              COALESCE(c.medium_limit, 25)     AS medium_limit,
              COALESCE(c.high_limit, 40)       AS high_limit
            FROM monitoring_occurrences o
            LEFT JOIN organism_catalog c ON c.id = o.organism_id
            WHERE o.point_id = ?
          `).all(point.id) as OccurrenceRow[];
                } else {
                    occRows = db.prepare(`
            SELECT id, point_id, organism_id, valor_bruto, observacao,
                   organism_id AS org_name, 'praga' AS org_type,
                   10 AS low_limit, 25 AS medium_limit, 40 AS high_limit
            FROM monitoring_occurrences
            WHERE point_id = ?
          `).all(point.id) as OccurrenceRow[];
                }

                const infestacoes: Infestacao[] = occRows.map(occ => ({
                    id: occ.id,
                    tipo: mapTipo(occ.org_type),
                    nome: occ.org_name,
                    terco: 'Médio',
                    quantidade: occ.valor_bruto ?? null,
                    severidade: calcSeveridade(occ.valor_bruto ?? 0, occ.low_limit, occ.medium_limit, occ.high_limit),
                    observacao: occ.observacao ?? undefined,
                }));

                return {
                    id: point.id,
                    identificador: `P${point.numero}`,
                    lat: point.latitude,    // ← lat GPS real
                    lng: point.longitude,   // ← lng GPS real
                    infestacoes,
                };
            });

            talhoes.push({
                id: talhaoId,
                nome,
                cultura: sess.cultura_nome ?? 'Cultura',
                area_ha: area,
                poligono_geojson: poligono, // ← polígono real de poligonos_talhao
                pontos,
            });
        }

        const dataRelatorio = sessions[0]?.started_at
            ? new Date(sessions[0].started_at).toLocaleDateString('pt-BR')
            : new Date().toLocaleDateString('pt-BR');

        return {
            fazenda: fazendaNome,
            safra: safraLabel,
            data: dataRelatorio,
            tecnico: 'Engenheiro Agrônomo',
            talhoes,
        };
    } finally {
        db.close();
    }
}

// ─── Handler GET /api/relatorio ───────────────────────────────────────────────
export async function GET() {
    try {
        const dbPath = getDatabasePath();

        if (dbPath) {
            const relatorio = readFromDatabase(dbPath);
            return NextResponse.json({ source: 'sqlite', dbPath, relatorio });
        }

        return NextResponse.json({
            source: 'mock',
            dbPath: null,
            message: 'Banco fortsmart_agro.db não encontrado. Execute o app Flutter e tente novamente.',
            relatorio: mockRelatorio,
        });
    } catch (error) {
        console.error('[/api/relatorio] Erro:', error);
        return NextResponse.json({
            source: 'mock',
            dbPath: null,
            error: String(error),
            relatorio: mockRelatorio,
        });
    }
}
