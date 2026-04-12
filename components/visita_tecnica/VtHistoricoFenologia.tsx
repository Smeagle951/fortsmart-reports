'use client';

import React from 'react';
import { formatDate } from '@/utils/format';
import dp from './decision-premium.module.css';

export default function VtHistoricoFenologia({ itens }: { itens: Record<string, unknown>[] }) {
  if (itens.length === 0) return null;

  return (
    <section className={dp.sectionPremium} aria-label="Histórico fenológico">
      <h2 className={dp.sectionTitle}>Histórico (fenologia / visitas)</h2>
      <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, fontWeight: 600 }}>
        Linha do tempo registrada no relatório — apoia leitura de tendência antes das imagens e da assinatura.
      </p>
      <ul className={dp.historicoList}>
        {itens.slice(0, 15).map((row, i) => {
          const est = row.estagio ?? row.estadio ?? row.estágio;
          const dt = row.data ?? row.dataRegistro;
          const obs = row.observacoes ?? row.observacao ?? row.nota;
          return (
            <li key={i} className={dp.historicoItem}>
              <div className={dp.historicoMeta}>
                {dt != null && String(dt).trim() ? (
                  <span className={dp.historicoData}>{formatDate(String(dt)) || String(dt)}</span>
                ) : (
                  <span className={dp.historicoData}>—</span>
                )}
                {est != null && String(est).trim() ? (
                  <span className={dp.historicoEstagio}>{String(est)}</span>
                ) : null}
              </div>
              {obs != null && String(obs).trim() ? <p className={dp.historicoObs}>{String(obs)}</p> : null}
            </li>
          );
        })}
      </ul>
      {itens.length > 15 ? (
        <p className={dp.fraseImpacto} style={{ marginTop: '0.75rem', fontSize: '0.78rem' }}>
          Mostrando 15 de {itens.length} registros.
        </p>
      ) : null}
    </section>
  );
}
