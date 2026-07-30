import type { OrganismoContextoWeb } from '@/lib/types/monitoring';
import { assessNdeComparison } from '@/lib/monitoring-report/professional';

interface MonitoringNdeTableProps {
  rows: OrganismoContextoWeb[];
}

const decimal = (value: number) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });

export default function MonitoringNdeTable({
  rows,
}: MonitoringNdeTableProps) {
  if (rows.length === 0) return null;

  return (
    <section className="mr-nde" aria-labelledby="monitoring-nde-title">
      <h3 id="monitoring-nde-title" className="mr-subtitle">
        Risco fenológico e nível de dano econômico
      </h3>
      <div className="mr-table-scroll">
        <table className="mr-table mr-table--compact">
          <caption>
            Leituras e referências registradas para os organismos do talhão
          </caption>
          <thead>
            <tr>
              <th scope="col">Organismo</th>
              <th scope="col">Leitura observada</th>
              <th scope="col">Referência NDE</th>
              <th scope="col">Relação leitura / NDE</th>
              <th scope="col">Estágio</th>
              <th scope="col">Categoria / janela</th>
              <th scope="col">Confiança</th>
              <th scope="col">Fonte</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const comparison = assessNdeComparison(row);
              return (
                <tr key={`${row.nome}-${index}`}>
                  <th scope="row" data-label="Organismo">
                    {row.nome}
                    {row.nomeCientifico && (
                      <small className="mr-scientific">
                        {row.nomeCientifico}
                      </small>
                    )}
                  </th>
                  <td data-label="Leitura observada">
                    {comparison.observed !== null
                      ? `${decimal(comparison.observed)} ind/m²`
                      : '—'}
                  </td>
                  <td data-label="Referência NDE">
                    {comparison.reference !== null
                      ? `${decimal(comparison.reference)} ${row.referenciaNdeUnidade || ''}`.trim()
                      : '—'}
                  </td>
                  <td data-label="Relação leitura / NDE">
                    {comparison.canCompare && comparison.ratio !== null ? (
                      `${decimal(comparison.ratio)}×`
                    ) : (
                      <span className="mr-insufficient">
                        {comparison.message}
                      </span>
                    )}
                  </td>
                  <td data-label="Estágio">{row.estagioNde || '—'}</td>
                  <td data-label="Categoria / janela">
                    {[row.interpretacaoCategoria, row.interpretacaoJanelaRecomendada]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </td>
                  <td data-label="Confiança">
                    {row.confidence_level ??
                      (row.confidencePercent !== undefined
                        ? `${row.confidencePercent.toLocaleString('pt-BR', {
                            maximumFractionDigits: 0,
                          })}%`
                        : '—')}
                  </td>
                  <td data-label="Fonte">
                    {[row.knowledge_type, row.paramsRegionId]
                      .filter(Boolean)
                      .join(' · ') || 'Não informada'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
