'use client';

import { Download, Link2, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  onExportGeoJson: () => void;
  onCopyLink: () => void;
  onPrint: () => void;
  tip: string | null;
};

/** Ações alinhadas ao cabeçalho do `/mapa-talhoes` (exportar, copiar link, impressão). */
export function DashboardPlantioToolbar({ onExportGeoJson, onCopyLink, onPrint, tip }: Props) {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onExportGeoJson}>
          <Download className="h-3.5 w-3.5" />
          Exportar GeoJSON
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onCopyLink}>
          <Link2 className="h-3.5 w-3.5" />
          Copiar link
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onPrint}>
          <Printer className="h-3.5 w-3.5" />
          Imprimir / PDF
        </Button>
      </div>
      {tip ? <p className="mt-1.5 text-[11px] text-emerald-800">{tip}</p> : null}
    </div>
  );
}
