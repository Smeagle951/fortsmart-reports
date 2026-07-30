interface MonitoringTechnicalConclusionProps {
  paragraphs: string[];
}

export default function MonitoringTechnicalConclusion({
  paragraphs,
}: MonitoringTechnicalConclusionProps) {
  return (
    <section
      className="mr-section mr-conclusion report-keep-together"
      aria-labelledby="monitoring-conclusion-title"
    >
      <div className="mr-section-heading">
        <p className="mr-eyebrow">Síntese dos dados apresentados</p>
        <h2 id="monitoring-conclusion-title">Conclusão técnica</h2>
      </div>
      <div className="mr-conclusion__body">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
