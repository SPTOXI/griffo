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

/**
 * Os termos a buscar, agrupados por país de residência.
 *
 * Uma consulta só, e não uma por país: com dez mercados, uma consulta por país
 * seria dez idas ao banco para responder algo que uma responde.
 *
 * Perfil sem país fica de fora. Não é descuido: sem saber onde a pessoa mora,
 * não dá para escolher em qual mercado buscar, e chutar o Brasil porque é o
 * mais comum daria a ela vagas do país errado.
 */
export async function searchTermsByCountry(options: { limitPerCountry?: number } = {}): Promise<
  Map<string, string[]>
> {
  const limit = options.limitPerCountry ?? 6
  const byCountry = new Map<string, string[]>()

  try {
    const rows = await db.professionalProfile.findMany({
      where: { residenceCountry: { not: null } },
      select: { residenceCountry: true, targetRoles: true },
      take: 2000,
    })

    const grouped = new Map<string, unknown[]>()
    for (const row of rows) {
      const country = row.residenceCountry!.trim().toUpperCase()
      if (!country) continue
      const list = grouped.get(country) ?? []
      list.push(row.targetRoles)
      grouped.set(country, list)
    }

    for (const [country, lists] of grouped) {
      const terms = normalizeTerms(lists, limit)
      if (terms.length > 0) byCountry.set(country, terms)
    }
  } catch (e: any) {
    console.warn('[jobs] leitura de termos por país falhou:', e?.message || e)
  }

  return byCountry
}

/**
 * Quando cada fonte da Adzuna coletou pela última vez.
 *
 * É o que ordena o rodízio de países. Reusa o estado que a coleta já grava, em
 * vez de um contador próprio que precisaria ser mantido em sincronia.
 */
export async function adzunaLastCollections(): Promise<Map<string, Date | null>> {
  const out = new Map<string, Date | null>()

  try {
    const sources = await db.jobSource.findMany({
      where: { slug: { startsWith: 'adzuna:' } },
      select: { slug: true, lastCollectionAt: true },
    })

    for (const source of sources) {
      out.set(source.slug.slice('adzuna:'.length).toLowerCase(), source.lastCollectionAt)
    }
  } catch (e: any) {
    console.warn('[jobs] leitura das coletas da Adzuna falhou:', e?.message || e)
  }

  return out
}
