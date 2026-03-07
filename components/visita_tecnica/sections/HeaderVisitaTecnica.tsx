import React from 'react';
import { PayloadVisitaTecnica } from '@/components/RelatorioVisitaTecnicaContent';
import FortSmartLogo from '@/components/FortSmartLogo';

interface HeaderVisitaTecnicaProps {
  relatorio: PayloadVisitaTecnica;
  fazenda: string;
  safra: string;
  data: string;
  tecnico: string;
  tecnicoCrea?: string;
  municipio?: string;
  estado?: string;
  proprietario?: string;
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{value}</div>
    </div>
  );
}

export default function HeaderVisitaTecnica({
  relatorio,
  fazenda,
  safra,
  data,
  tecnico,
  tecnicoCrea,
  municipio,
  estado,
  proprietario,
}: HeaderVisitaTecnicaProps) {
  // Use consultoria from the same structure as Monitoring if available.
  // Although typings on PayloadVisitaTecnica might need adjusting, we will accept it via cast.
  const consultoria = (relatorio.consultoria as { nome?: string; logoUrl?: string }) || {};

  return (
    <header
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        marginBottom: 28,
        overflow: 'hidden',
      }}
    >
      <div style={{ height: 4, background: 'linear-gradient(90deg, #166534 0%, #22c55e 100%)' }} />
      <div style={{ padding: 28, display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {consultoria.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={consultoria.logoUrl} alt={consultoria.nome} style={{ height: 56, objectFit: 'contain' }} />
          ) : (
            <FortSmartLogo size={56} />
          )}

          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#14532d', letterSpacing: '-0.03em' }}>
              {consultoria.nome || 'FortSmart Agro'}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
              Relatório Agronômico · Visita Técnica
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 24, minWidth: 260 }}>
          <MetaItem label="Fazenda" value={fazenda} />
          <MetaItem label="Safra" value={safra} />
          <MetaItem label="Data da visita" value={data} />
          <MetaItem label="Técnico responsável" value={tecnicoCrea ? `${tecnico} · ${tecnicoCrea}` : tecnico} />
          {municipio && (estado || proprietario) && (
            <MetaItem label="Propriedade" value={[municipio, estado, proprietario].filter(Boolean).join(' · ')} />
          )}
        </div>
      </div>
    </header>
  );
}
