import RelatorioAmostragemSoloContent from '@/components/amostragem-solo/RelatorioAmostragemSoloContent';
import fixture from './sample-payload.json';

export default function AmostragemPreviewPage() {
  return <RelatorioAmostragemSoloContent payload={fixture as unknown as Record<string, unknown>} shareToken="qa-token" />;
}

