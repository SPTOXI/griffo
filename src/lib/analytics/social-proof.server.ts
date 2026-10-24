import 'server-only'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { scoreFromMeta } from './social-proof'

/** Eventos que são um currículo de verdade lido pelo teste (robôs ficam de fora). */
const SCORED_EVENTS = ['ats_check_done', 'lead_submitted']

/** Teto de leitura: as notas mais recentes bastam para a distribuição. */
const DISTRIBUTION_SAMPLE = 5000

/**
 * As notas de legibilidade dos currículos já testados, em ordem crescente.
 * Guardado por uma hora: a distribuição não muda de minuto a minuto.
 */
export const loadAtsScoreDistribution = unstable_cache(
  async (): Promise<number[]> => {
    const rows = await db.analyticsEvent.findMany({
      where: { event: { in: SCORED_EVENTS }, meta: { contains: '"score":' } },
      orderBy: { createdAt: 'desc' },
      take: DISTRIBUTION_SAMPLE,
      select: { meta: true },
    })
    return rows
      .map((r) => scoreFromMeta(r.meta))
      .filter((s): s is number => s !== null)
      .sort((a, b) => a - b)
  },
  ['ats-score-distribution-v1'],
  { revalidate: 3600 }
)

/**
 * Quantos currículos a GriffoWork já analisou: testes ATS, envios pela página
 * inicial e currículos de conta. Nunca lança — a home não pode cair por isso.
 */
export const loadResumesAnalyzedCount = unstable_cache(
  async (): Promise<number> => {
    try {
      const [events, resumes] = await Promise.all([
        db.analyticsEvent.count({ where: { event: { in: SCORED_EVENTS } } }),
        db.resume.count(),
      ])
      return events + resumes
    } catch (e: any) {
      console.warn('[social-proof] contagem falhou:', e?.message || e)
      return 0
    }
  },
  ['resumes-analyzed-count-v1'],
  { revalidate: 3600 }
)
