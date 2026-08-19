import { LANGUAGE_DIRECTIVE } from '../i18n/server'
import { marketPromptContext, resolveMarket, type MarketConfig } from '../market'
import type { Language } from '../i18n'

/**
 * O bloco de contexto que se repete entre as entregas do mesmo currículo.
 *
 * ## Por que ele existe separado
 *
 * O cache de prompt da Anthropic é **casamento de prefixo**: ele só vale se os
 * bytes anteriores ao marcador forem idênticos entre uma chamada e outra. Um
 * caractere diferente invalida tudo dali para frente.
 *
 * A análise segmentada já tinha o seu (`buildSharedContext`), mas ele carrega
 * dentro o papel do avaliador — "Você é um avaliador executivo sênior…". A
 * reescrita, a orientação vocacional e a carta têm papéis diferentes, e reusar
 * aquele bloco daria ao modelo duas instruções de papel contraditórias.
 *
 * Este aqui não tem papel nenhum. Só o material que é o mesmo
 * independentemente do que se vai pedir: idioma, mercado, perfil, o currículo e
 * a vaga alvo. O papel de cada tarefa vai no `systemPrompt`, que o roteador
 * coloca DEPOIS do marcador — onde variar não custa nada.
 *
 * ## O que precisa ser estável, e o que não pode entrar
 *
 * Nada de data, hora, identificador de requisição ou qualquer valor que mude
 * entre chamadas. Um `new Date()` aqui dentro faria toda chamada gravar um
 * cache novo e nunca ler nenhum — o pior dos dois mundos, porque gravar custa
 * mais caro que não cachear.
 *
 * ## O piso de 1024 tokens
 *
 * A Anthropic não cacheia prefixo menor que isso, e não avisa: simplesmente não
 * cacheia. Currículo curto com mercado e perfil enxutos pode ficar abaixo do
 * piso, e nesse caso a chamada roda como se o cache não existisse. Não é erro,
 * é limite da plataforma — e é por isso que a economia real depende do tamanho
 * do currículo.
 */
export interface ResumeContextInput {
  resumeContent: string
  targetJob?: string | null
  targetJobDescription?: string | null
  lang: Language
  market?: MarketConfig
  profileContext?: string | null
}

export function buildResumeContext({
  resumeContent,
  targetJob,
  targetJobDescription,
  lang,
  market,
  profileContext,
}: ResumeContextInput): string {
  const resolvedMarket = market ?? resolveMarket({ language: lang }).market

  const jobBlock =
    targetJob || targetJobDescription
      ? `VAGA / CARGO ALVO DESEJADO PELO CANDIDATO:
Cargo: ${targetJob || 'Não especificado'}
Descrição/Requisitos da Vaga:
${targetJobDescription || 'Nenhuma descrição fornecida.'}`
      : 'VAGA ALVO: nenhuma vaga específica foi fornecida.'

  return `${LANGUAGE_DIRECTIVE[lang]}

${marketPromptContext(resolvedMarket)}
${profileContext ? `\n${profileContext}\n` : ''}
=== CURRÍCULO DO CANDIDATO ===
${resumeContent}
=== FIM DO CURRÍCULO ===

${jobBlock}`
}
