import type { ProviderId } from './ai-router/types'

/**
 * Residência de dados: quais provedores de IA podem receber dado pessoal de
 * cada origem.
 *
 * O currículo é dado pessoal denso — nome, telefone, histórico de empregos,
 * formação. Enviá-lo a um provedor é uma transferência internacional.
 *
 * Sob o GDPR, transferir dado pessoal de residente na UE para um país sem
 * decisão de adequação exige base jurídica específica (cláusulas contratuais
 * padrão, avaliação de impacto). **A China não tem decisão de adequação**, e o
 * DeepSeek processa na China. Manter dado de europeu fora dele deixa de ser
 * preferência técnica e passa a ser exigência regulatória.
 *
 * Estados Unidos têm o Data Privacy Framework; Anthropic e Google são
 * endereçáveis por cláusulas contratuais padrão. Moonshot (Kimi) também é
 * China — entra na mesma restrição do DeepSeek.
 *
 * Isto é a metade técnica do problema. A metade jurídica — cláusulas assinadas,
 * representante na UE (Art. 27), registro de tratamento — não é código e
 * continua pendente (G9 no PLANO-MELHORIAS).
 */

/** Provedores que processam fora de jurisdição com adequação reconhecida pela UE. */
const NON_ADEQUATE_PROVIDERS: ProviderId[] = ['deepseek', 'kimi']

/** Países do Espaço Econômico Europeu + Reino Unido e Suíça, que aplicam regime equivalente. */
const EEA_PLUS = [
  'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB',
  'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO',
  'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
]

export function isEuropeanUser(country: string | null | undefined): boolean {
  return EEA_PLUS.includes((country || '').toUpperCase().trim())
}

/**
 * Filtra a lista de provedores candidatos conforme a origem do usuário.
 *
 * Devolve a lista intacta para quem não é europeu. Para europeus, remove os
 * provedores sem adequação — e, se isso esvaziaria a lista, devolve o que
 * sobrou preferindo falhar a rota a fazer uma transferência irregular.
 */
export function filterProvidersByResidency(
  candidates: ProviderId[],
  country: string | null | undefined
): ProviderId[] {
  if (!isEuropeanUser(country)) return candidates
  return candidates.filter((id) => !NON_ADEQUATE_PROVIDERS.includes(id))
}
