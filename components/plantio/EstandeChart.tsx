'use client';

import { useEffect, useRef } from 'react';

interface EstandeRegistro {
  data: string;
  plantasPorMetro: number;
  plantasHa?: number;
}

interface EstandeChartProps {
  registros: EstandeRegistro[];
  perdaTotalPct?: number;
  perdaSemanalPct?: number;
  talhaoNome?: string;
  showStats?: boolean;
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return iso;
  }
}

export default function EstandeChart({
  registros,
  perdaTotalPct,
  perdaSemanalPct,
  talhaoNome,
  showStats = true,
}: EstandeChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<unknown>(null);

  if (!registros?.length) return null;

  const maxVal = Math.max(...registros.map((r) => r.plantasPorMetro));
  const minVal = Math.min(...registros.map((r) => r.plantasPorMetro));
  const media = registros.reduce((s, r) => s + r.plantasPorMetro, 0) / registros.length;

  useEffect(() => {
    import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, BarController, LineController, Filler, Tooltip }) => {
      Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, BarController, LineController, Filler, Tooltip);

      if (chartRef.current && !chartInstance.current) {
        chartInstance.current = new Chart(chartRef.current, {
          type: 'bar',
          data: {
            labels: registros.map((r) => formatShortDate(r.data)),
            datasets: [
              {
                type: 'bar',
                label: 'Estande (pl/m)',
                data: registros.map((r) => r.plantasPorMetro),
                backgroundColor: 'rgba(27, 94, 32, 0.35)',
                borderColor: '#1B5E20',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
                maxBarThickness: 28,
              },
              {
                type: 'line',
                label: 'Tendência',
                data: registros.map((r) => r.plantasPorMetro),
                borderColor: '#1B5E20',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#1B5E20',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: { font: { size: 11 }, usePointStyle: true },
              },
              tooltip: {
                backgroundColor: '#1A2332',
                callbacks: {
                  label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} plantas/m`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#64748B', maxRotation: 0 },
              },
              y: {
                min: Math.max(0, minVal - 0.5),
                max: maxVal + 0.5,
                grid: { color: '#F1F5F9' },
                ticks: { font: { size: 10 }, color: '#64748B', stepSize: 0.5 },
              },
            },
            animation: { duration: 600 },
          },
        });
      }
    });

    return () => {
      if (chartInstance.current) {
        (chartInstance.current as { destroy: () => void }).destroy();
        chartInstance.current = null;
      }
    };
  }, [registros, maxVal, minVal]);

  return (
    <section className="plantio-card" aria-labelledby="estande-titulo">
      <h3 id="estande-titulo" className="plantio-card-title">
        Evolução do Estande{talhaoNome ? ` – ${talhaoNome}` : ''}
      </h3>
      <figure className="plantio-figure plantio-figure--chart">
        <div className="plantio-chart-wrap" aria-hidden>
          <canvas ref={chartRef} />
        </div>
        {showStats && (
          <figcaption className="plantio-figcaption plantio-figcaption--stats">
            Mín: {minVal.toFixed(1)} / Máx: {maxVal.toFixed(1)} / Média: {media.toFixed(1)} plantas/m
          </figcaption>
        )}
      </figure>
      {(perdaTotalPct != null || perdaSemanalPct != null) && (
        <dl className="plantio-data-list plantio-data-list--inline">
          {perdaTotalPct != null && (
            <div className="plantio-data-row">
              <dt>Perda Total</dt>
              <dd>{perdaTotalPct > 0 ? '+' : ''}{perdaTotalPct?.toFixed(1)}%</dd>
            </div>
          )}
          {perdaSemanalPct != null && (
            <div className="plantio-data-row">
              <dt>Perda Semanal</dt>
              <dd>{perdaSemanalPct > 0 ? '+' : ''}{perdaSemanalPct?.toFixed(1)}%</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
