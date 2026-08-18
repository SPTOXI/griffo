import 'server-only'
import { db } from '../db'
import { normalizeTerms, type SearchTermOptions } from './search-terms'

/**
 * Lê os cargos-alvo dos perfis e devolve os termos a buscar.
 *
 * Nunca lança: uma fonte de busca sem termos coleta zero vagas, o que é
 * inofensivo. Derrubar a rodada inteira porque esta consulta falhou não é.
 */
export async function searchTermsFromProfiles(options: SearchTermOptions = {}): Promise<string[]> {
  const limit = options.limit ?? 8

  try {
    const rows = await db.professionalProfile.findMany({
      where: options.country ? { residenceCountry: options.country } : undefined,
      select: { targetRoles: true },
      // Teto de leitura: com muitos usuários, os cargos mais pedidos já
      // aparecem bem antes de a lista acabar.
      take: 500,
    })

    return normalizeTerms(rows.map((r) => r.targetRoles), limit)
  } catch (e: any) {
    console.warn('[jobs] leitura de termos de busca falhou:', e?.message || e)
    return []
  }
}
