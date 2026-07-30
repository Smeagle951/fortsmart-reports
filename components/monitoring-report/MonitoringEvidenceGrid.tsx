'use client';

import { useState } from 'react';
import type { MonitoringReportImage } from '@/lib/monitoring-report/professional';

interface MonitoringEvidenceGridProps {
  images: MonitoringReportImage[];
  title?: string;
}

export default function MonitoringEvidenceGrid({
  images,
  title = 'Evidências fotográficas',
}: MonitoringEvidenceGridProps) {
  const [selected, setSelected] = useState<MonitoringReportImage | null>(null);
  if (images.length === 0) return null;

  return (
    <section className="mr-evidence" aria-labelledby="monitoring-evidence-title">
      <h3 id="monitoring-evidence-title" className="mr-subtitle">
        {title}
      </h3>
      <div className="mr-evidence-grid">
        {images.map((image, index) => {
          const alt = [
            image.organismo,
            image.ponto ? `ponto ${image.ponto}` : null,
            image.descricao,
          ]
            .filter(Boolean)
            .join(' — ');
          return (
            <figure key={`${image.url}-${index}`} className="report-keep-together">
              <button
                type="button"
                className="mr-evidence-image"
                onClick={() => setSelected(image)}
                aria-label={`Ampliar foto: ${alt || `evidência ${index + 1}`}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={alt || `Evidência ${index + 1}`} />
              </button>
              <figcaption>
                <strong>{image.organismo || 'Organismo não informado'}</strong>
                <span>
                  {[image.ponto, image.categoria, image.data]
                    .filter(Boolean)
                    .join(' · ') || 'Metadados não informados'}
                </span>
                {image.descricao && <span>{image.descricao}</span>}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {selected && (
        <div
          className="mr-image-modal no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Evidência fotográfica ampliada"
          onClick={() => setSelected(null)}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="mr-image-modal__close"
              onClick={() => setSelected(null)}
            >
              Fechar
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={
                [selected.organismo, selected.ponto]
                  .filter(Boolean)
                  .join(' — ') || 'Evidência fotográfica'
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}
