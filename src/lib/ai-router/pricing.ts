/**
 * Tabela de preços dos modelos.
 *
 * Separada de `registry.ts` porque lá o módulo importa o Prisma — e com ele o
 * `server-only` —, o que torna a tabela impossível de exercitar num teste. Aqui
 * não há dependência nenhuma: são dados e uma função pura, que é o que o preço
 * por horário do DeepSeek precisa que seja testável.
 *
 * `registry.ts` reexporta tudo, então os importadores antigos continuam valendo.
 */
import { ModelPricing, TieredPricing } from './types'

// O custo real depende do MODELO efetivamente usado, não do provedor: o admin
// pode trocar o modelo no painel sem que a tabela do provedor acompanhe. Antes
// disso o preço do Opus 5 estava declarado como $15/$75 (o triplo do real), o
// que inflava em 3x o custo e o lucro exibidos no painel administrativo.
//
// Valores em USD por 1k tokens. Modelos ausentes caem no preço do provedor.
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic
  'claude-opus-5': { inputPer1k: 0.005, outputPer1k: 0.025 },
  'claude-sonnet-5': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-haiku-4-5': { inputPer1k: 0.001, outputPer1k: 0.005 },
  // Moonshot
  'kimi-k3': { inputPer1k: 0.003, outputPer1k: 0.015 },
  // DeepSeek — preço vigente ATÉ 16/08/2026 16:00 UTC. A partir daí vale
  // TIERED_MODEL_PRICING, logo abaixo.
  'deepseek-v4-flash': { inputPer1k: 0.00014, outputPer1k: 0.00028 },
  'deepseek-v4-pro': { inputPer1k: 0.000435, outputPer1k: 0.00087 },
  // OpenAI — preço de contexto curto, tabela de 26/08/2026. Em contexto
  // longo o gpt-5.6-luna sobe para $0,40/$1,80 por 1M; não modelado aqui
  // (sem TieredPricing por tamanho de contexto, só por horário como o
  // DeepSeek) porque o uso do Griffo — currículo, alguns milhares de
  // tokens — fica bem abaixo do limiar de contexto longo.
  'gpt-5.6-luna': { inputPer1k: 0.0002, outputPer1k: 0.0012 },
}

/**
 * Tabela nova do DeepSeek, anunciada em 13/08/2026 e em vigor a partir de
 * 16/08/2026 16:00 UTC — o aumento que a nota anterior registrava como "sem
 * tamanho nem data divulgados".
 *
 * São duas mudanças de uma vez. O preço subiu (o V4-Flash fora de pico custa
 * 1,6x a entrada e 2,4x a saída de hoje), e passou a depender da HORA: as
 * janelas de pico cobram o dobro do resto do dia. Por isso a tabela não é um
 * par de números, e o preço é resolvido no momento da chamada.
 *
 * O fuso continua favorecendo a operação: 01:00–04:00 e 06:00–10:00 UTC são
 * 22:00–01:00 e 03:00–07:00 no horário de Brasília. O horário comercial
 * brasileiro cai inteiro fora de pico.
 *
 * Os preços de entrada abaixo são de cache MISS. O acerto de cache do DeepSeek
 * custa $0,007/$0,014 por 1M (V4-Flash, fora de pico/pico) e $0,022/$0,044
 * (V4-Pro) — ~1/30 do miss —, mas não aparece aqui porque o roteador não o
 * contabiliza para provedores compatíveis com OpenAI: o desconto já vem
 * aplicado na fatura e `prompt_tokens` não separa as duas parcelas (ver
 * router.ts, onde `cacheReadTokens` é zerado nesse caminho). O efeito é que o
 * painel superestima o custo quando o cache acerta.
 */
export const TIERED_MODEL_PRICING: Record<string, TieredPricing> = {
  'deepseek-v4-flash': {
    from: Date.UTC(2026, 7, 16, 16, 0, 0),
    peakWindowsUtc: [
      [1, 4],
      [6, 10],
    ],
    offPeak: { inputPer1k: 0.00022, outputPer1k: 0.00066 }, // $0,22 / $0,66 por 1M
    peak: { inputPer1k: 0.00044, outputPer1k: 0.00132 }, // $0,44 / $1,32 por 1M
  },
  // `deepseek-v4-flash` foi aposentado pela DeepSeek — o ID atual é
  // `deepseek-flash` (confirmado na documentação oficial em 13/09/2026). A
  // própria DeepSeek diz que o nome antigo "ainda é aceito, mas os modelos
  // correspondentes foram aposentados" e passam a ser servidos por este,
  // cobrados no mesmo preço Flash — por isso os números abaixo são
  // IDÊNTICOS à entrada acima, só o nome mudou. Mesma classe de problema já
  // vista com `deepseek-chat` e `gemini-2.0-flash`: um ID retirado não avisa,
  // só some ou (neste caso) some silenciosamente por trás de um alias.
  'deepseek-flash': {
    from: Date.UTC(2026, 7, 16, 16, 0, 0),
    peakWindowsUtc: [
      [1, 4],
      [6, 10],
    ],
    offPeak: { inputPer1k: 0.00022, outputPer1k: 0.00066 }, // $0,22 / $0,66 por 1M
    peak: { inputPer1k: 0.00044, outputPer1k: 0.00132 }, // $0,44 / $1,32 por 1M
  },
  'deepseek-v4-pro': {
    from: Date.UTC(2026, 7, 16, 16, 0, 0),
    peakWindowsUtc: [
      [1, 4],
      [6, 10],
    ],
    offPeak: { inputPer1k: 0.00066, outputPer1k: 0.00198 }, // $0,66 / $1,98 por 1M
    peak: { inputPer1k: 0.00132, outputPer1k: 0.00396 }, // $1,32 / $3,96 por 1M
  },
}

/**
 * Preço de um modelo no instante da chamada.
 *
 * Vale para qualquer modelo: os que não têm preço por horário caem direto em
 * MODEL_PRICING, e os que têm só passam a usá-lo depois da data de vigência.
 */
export function resolveModelPricing(model: string, at: Date = new Date()): ModelPricing | undefined {
  const tiered = TIERED_MODEL_PRICING[model]
  if (tiered && at.getTime() >= tiered.from) {
    const hourUtc = at.getUTCHours()
    const isPeak = tiered.peakWindowsUtc.some(([start, end]) => hourUtc >= start && hourUtc < end)
    return isPeak ? tiered.peak : tiered.offPeak
  }
  return MODEL_PRICING[model]
}
