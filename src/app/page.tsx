import { db } from '@/lib/db'
import { HomeClient } from './home-client'

// A landing (Hero D) cita a contagem real de vagas ativas — nunca um número
// inventado. `closedAt: null` é exatamente o critério de "aberta" usado pelo
// resto do produto (ver o comentário do model `Job` em `prisma/schema.prisma`
// e `lib/jobs/lifecycle.server.ts`): vagas encerradas pelo dedup/expiração do
// Radar já têm `closedAt` preenchido e saem da contagem sozinhas.
//
// ISR de 5 minutos em vez de por-request: a home é a página de maior tráfego
// do site, e o número não precisa de segundo a segundo — só precisa de não
// mentir.
export const revalidate = 300

async function getOpenJobsCount(): Promise<number> {
  try {
    return await db.job.count({ where: { closedAt: null } })
  } catch (e) {
    console.error('open jobs count failed', e)
    return 0
  }
}

export default async function Page() {
  const openJobsCount = await getOpenJobsCount()
  return <HomeClient openJobsCount={openJobsCount} />
}
