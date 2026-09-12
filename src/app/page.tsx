import { getOpenJobsCount } from '@/lib/jobs/open-count.server'
import { HomeClient } from './home-client'

// A landing (Hero D) cita a contagem real de vagas ativas — nunca um número
// inventado. `closedAt: null` é exatamente o critério de "aberta" usado pelo
// resto do produto (ver o comentário do model `Job` em `prisma/schema.prisma`
// e `lib/jobs/lifecycle.server.ts`): vagas encerradas pelo dedup/expiração do
// Radar já têm `closedAt` preenchido e saem da contagem sozinhas.
//
// ISR de 5 minutos em vez de por-request: a home é a página de maior tráfego
// do site, e o número não precisa de segundo a segundo — só precisa de não
// mentir. Por isso a contagem em si (com retry e sem cair para `0` num erro)
// vive em `lib/jobs/open-count.server.ts`, compartilhada com as 41 rotas de
// país — ver o cabeçalho de lá para o porquê.

export const revalidate = 300

export default async function Page() {
  const openJobsCount = await getOpenJobsCount()
  return <HomeClient openJobsCount={openJobsCount} />
}
