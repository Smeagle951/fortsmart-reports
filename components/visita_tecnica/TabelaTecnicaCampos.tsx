'use client';

import React from 'react';

export type ParCampoValor = { campo: string; valor: string | number | null | undefined };

interface TabelaTecnicaCamposProps {
  /** Lista de linhas. Só renderiza linha se valor for preenchido (não null/undefined/''). */
  linhas: ParCampoValor[];
  className?: string;
}

/** Tabela técnica editorial: duas colunas (Campo | Valor). Não renderiza linhas com valor vazio. */
export default function TabelaTecnicaCampos({ linhas, className = '' }: TabelaTecnicaCamposProps) {
  const rows = linhas.filter((l) => l.valor != null && String(l.valor).trim() !== '');
  if (rows.length === 0) return null;

  return (
    <table className={`table-tech ${className}`.trim()}>
      <tbody>
        {rows.map((l, i) => (
          <tr key={i}>
            <td>{l.campo}</td>
            <td>{typeof l.valor === 'number' ? (Number.isInteger(l.valor) ? l.valor : Number(l.valor).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })) : String(l.valor)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
