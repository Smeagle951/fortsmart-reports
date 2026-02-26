import React from 'react';

interface RelatorioContentProps {
  relatorio: Record<string, unknown>;
  reportId?: string;
  relatorioUuid?: string;
}

export default function RelatorioContent({ relatorio, reportId, relatorioUuid }: RelatorioContentProps) {
  const titulo = (relatorio.meta as any)?.titulo ?? reportId ?? relatorioUuid ?? 'Relatório';
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>{titulo}</h1>
      <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
        {JSON.stringify(relatorio, null, 2)}
      </pre>
    </div>
  );
}
