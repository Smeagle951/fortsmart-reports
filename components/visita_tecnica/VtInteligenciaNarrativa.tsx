'use client';

import React, { useMemo } from 'react';
import { computeInteligenciaAgronomicaFromRelatorio } from '@/lib/inteligencia-agronomica';
import dp from './decision-premium.module.css';

export default function VtInteligenciaNarrativa({ relatorio }: { relatorio: Record<string, unknown> }) {
  const data = useMemo(() => computeInteligenciaAgronomicaFromRelatorio(relatorio), [relatorio]);
  const intelRaw = relatorio.inteligencia_agronomica as Record<string, unknown> | undefined;
  const motorAlertas = Array.isArray(intelRaw?.motor_alertas)
    ? (intelRaw.motor_alertas as Record<string, unknown>[])
    : [];
  const primeiroAlerta = motorAlertas[0];
  const alertaTexto =
    primeiroAlerta != null
      ? [primeiroAlerta.titulo, primeiroAlerta.mensagem, primeiroAlerta.texto].map((x) => (x != null ? String(x) : '')).find((s) => s.trim()) ??
        null
      : null;

  const resumo = data.resumo?.trim();
  const recoAcao = data.recomendacao?.acao?.trim();
  const recoPrazo = data.recomendacao?.prazo?.trim();
  const recoLinha = [recoAcao, recoPrazo ? `Prazo sugerido: ${recoPrazo}` : null].filter(Boolean).join(' · ');

  if (!resumo && !alertaTexto && !recoLinha) return null;

  return (
    <section className={`${dp.sectionPremium} ${dp.intelGradient}`} aria-label="Inteligência agronômica">
      <h2 className={dp.sectionTitle} style={{ color: '#14532d' }}>
        Inteligência agronômica
      </h2>
      {resumo ? (
        <div className={dp.intelBlock}>
          <div className={dp.intelBlockTitle}>Insight automático</div>
          <p className={dp.intelBlockText}>{resumo}</p>
        </div>
      ) : null}
      {alertaTexto ? (
        <div className={dp.intelBlock}>
          <div className={dp.intelBlockTitle}>Alerta técnico</div>
          <p className={dp.intelAlertText}>{alertaTexto}</p>
        </div>
      ) : null}
      {recoLinha ? (
        <div className={dp.intelBlock}>
          <div className={dp.intelBlockTitle}>Ação sugerida</div>
          <p className={dp.intelBlockText} style={{ color: '#14532d', fontWeight: 700 }}>
            {recoLinha}
          </p>
        </div>
      ) : null}
    </section>
  );
}
