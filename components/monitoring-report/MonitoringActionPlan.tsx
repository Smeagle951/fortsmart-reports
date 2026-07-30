import type { MonitoringPriorityAction } from '@/lib/monitoring-report/professional';

interface MonitoringActionPlanProps {
  actions: MonitoringPriorityAction[];
  limit?: number;
}

export default function MonitoringActionPlan({
  actions,
  limit = 8,
}: MonitoringActionPlanProps) {
  const visibleActions = actions.slice(0, limit);

  return (
    <section className="mr-section" aria-labelledby="monitoring-actions-title">
      <div className="mr-section-heading">
        <p className="mr-eyebrow">Condutas registradas</p>
        <h2 id="monitoring-actions-title">Plano de ação prioritário</h2>
      </div>

      {visibleActions.length === 0 ? (
        <p className="mr-empty">
          Nenhuma recomendação técnica registrada para este monitoramento.
        </p>
      ) : (
        <div className="mr-table-scroll">
          <table className="mr-table">
            <caption>
              Ações existentes no relatório, ordenadas por prioridade
            </caption>
            <thead>
              <tr>
                <th scope="col">Prioridade</th>
                <th scope="col">Talhão</th>
                <th scope="col">Organismo / problema</th>
                <th scope="col">Evidência</th>
                <th scope="col">Conduta</th>
                <th scope="col">Produto</th>
                <th scope="col">Dose</th>
                <th scope="col">Prazo</th>
              </tr>
            </thead>
            <tbody>
              {visibleActions.map((action) => (
                <tr key={action.id}>
                  <td data-label="Prioridade">
                    <span
                      className={`mr-status mr-status--${action.priority.toLocaleLowerCase('pt-BR')}`}
                    >
                      {action.priorityLabel}
                    </span>
                  </td>
                  <th scope="row" data-label="Talhão">
                    <a href={`#talhao-${action.talhaoId}`}>
                      {action.talhaoNome}
                    </a>
                  </th>
                  <td data-label="Organismo / problema">{action.organismo}</td>
                  <td data-label="Evidência">{action.evidencia ?? '—'}</td>
                  <td data-label="Conduta" className="mr-action-conduct">
                    {action.conduta ?? '—'}
                  </td>
                  <td data-label="Produto">{action.produto ?? '—'}</td>
                  <td data-label="Dose">{action.dose ?? '—'}</td>
                  <td data-label="Prazo">{action.prazo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {actions.length > visibleActions.length && (
        <p className="mr-table-note">
          As demais condutas estão apresentadas nas seções dos respectivos
          talhões.
        </p>
      )}
    </section>
  );
}
