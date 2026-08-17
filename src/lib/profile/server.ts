import 'server-only'
import { db } from '../db'
import { resolveMarket, type MarketConfig } from '../market'
import type { Language } from '../i18n'
import { fromRecord, marketInputFrom, profilePromptContext, type ProfessionalProfile } from './index'

/**
 * Leitura do perfil no servidor, e o mercado que ele determina.
 *
 * Existe para que as rotas de IA façam UMA chamada em vez de repetir a mesma
 * sequência — buscar o perfil, converter, derivar o mercado — cinco vezes, com
 * cinco chances de divergir entre si.
 *
 * Nunca lança. Um perfil ilegível, ou o banco fora do ar no meio de uma
 * análise já paga, não pode derrubar a análise: o produto degrada para o
 * comportamento anterior a esta etapa, que continua correto, apenas menos
 * informado.
 */

export interface ProfileContext {
  /** `null` quando não há perfil — não é erro, é o estado inicial. */
  profile: ProfessionalProfile | null
  /** O mercado que vale para esta operação. Sempre presente. */
  market: MarketConfig
  /** De onde saiu o mercado, para log e para o painel. */
  marketSource: 'target' | 'residence' | 'language' | 'default'
  /** Bloco de prompt do perfil, ou string vazia quando não há o que dizer. */
  promptContext: string
}

export async function loadProfile(userId: string): Promise<ProfessionalProfile | null> {
  try {
    const row = await db.professionalProfile.findUnique({ where: { userId } })
    return row ? fromRecord(row) : null
  } catch (e: any) {
    console.warn('[profile] leitura falhou, seguindo sem perfil:', e?.message || e)
    return null
  }
}

/**
 * O contexto completo de uma operação de IA.
 *
 * `edgeCountry` é o país da borda — onde a pessoa está agora. Entra como
 * segunda opção: vale quando ela não declarou mercado-alvo, e é substituído
 * assim que ela declara. `paymentCountry` não entra em posição nenhuma.
 */
export async function loadProfileContext(
  userId: string,
  fallback: { edgeCountry?: string | null; language: Language }
): Promise<ProfileContext> {
  const profile = await loadProfile(userId)

  const { market, source } = resolveMarket(
    marketInputFrom(profile, {
      residenceCountry: fallback.edgeCountry ?? null,
      language: fallback.language,
    })
  )

  return {
    profile,
    market,
    marketSource: source,
    promptContext: profilePromptContext(profile),
  }
}
