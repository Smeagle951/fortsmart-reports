import { redirect } from 'next/navigation';

/** Mesmo renderer que `/r/[token]`; URL canónica para partilha de monitoramento. */
export const dynamic = 'force-dynamic';

type Awaitable<T> = T | Promise<T>;
type Props = { params: Awaitable<{ token: string }> };

export default async function MonitoramentoRelatorioRedirect({ params }: Props) {
  const { token } = await Promise.resolve(params);
  redirect(`/r/${token.trim()}`);
}
