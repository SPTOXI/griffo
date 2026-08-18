import 'server-only'
import { db } from '../db'
import { resolveMarket, type MarketConfig } from '../market'
import type { Language } from '../i18n'
import {
  EMPTY_PROFILE,
  fromRecord,
  marketInputFrom,
  profilePromptContext,
  toRecordData,
  type ProfessionalProfile,
} from './index'
import { deriveFromOrientation, parseStoredOrientation } from './from-orientation'

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

/**
 * Cria ou completa o perfil a partir do diagnóstico vocacional.
 *
 * Chamada pela rota da orientação, logo depois de ela gravar o resultado. É o
 * que faz o Radar funcionar para quem nunca abriu a tela de perfil: o
 * diagnóstico já respondeu "quais áreas", e a pessoa não deveria ter de
 * responder de novo num formulário.
 *
 * **Só preenche o que está vazio**, e devolve o que preencheu. O §30 proíbe
 * alterar o perfil sem que a pessoa saiba — quem escreveu tem razão sobre si, e
 * o que foi preenchido aqui é dito de volta na resposta da rota.
 *
 * Falha em silêncio de propósito: o diagnóstico vocacional é a entrega que a
 * pessoa pediu e pagou. Derrubá-lo porque a gravação de um efeito colateral não
 * deu certo troca a entrega principal pela acessória.
 */
export async function seedProfileFromOrientation(
  userId: string,
  orientationJson: string | null,
  options: { fallbackCountry?: string | null } = {}
): Promise<string[]> {
  try {
    const orientation = parseStoredOrientation(orientationJson)
    const existing = await db.professionalProfile.findUnique({ where: { userId } })
    const current = existing ? fromRecord(existing) : EMPTY_PROFILE

    const { data, filled } = deriveFromOrientation(current, orientation, {
      fallbackCountry: options.fallbackCountry,
    })

    if (filled.length === 0) return []

    const record = toRecordData(data)
    await db.professionalProfile.upsert({
      where: { userId },
      create: { userId, ...record },
      update: record,
    })

    return filled
  } catch (e: any) {
    console.warn('[profile] semeadura a partir da orientação falhou:', e?.message || e)
    return []
  }
}
