/**
 * A gravidade de um percentual de aderência à vaga.
 *
 * ## Por que existe
 *
 * A tela pintava o bloco de compatibilidade sempre da mesma cor. Um laudo que
 * dizia "incompatibilidade radical e absoluta", "requisitos que o candidato não
 * possui e não pode suprir" e "reprovação automática na triagem" era exibido no
 * mesmo azul tranquilo de um match de 95%, sob o título "💡 Avaliação de
 * Aderência". Quem bate o olho na tela e não lê o parágrafo inteiro sai
 * achando que está tudo bem.
 *
 * Cor é informação, e usar a mesma para desfechos opostos é esconder o
 * resultado — a versão visual de falhar em silêncio.
 *
 * ## Sobre os cortes
 *
 * Não são notas de qualidade do currículo, e a distinção importa para o texto
 * que acompanha cada faixa: um currículo excelente pode ter 10% de aderência a
 * uma vaga de outra profissão. O que a faixa mede é a DISTÂNCIA entre este
 * currículo e ESTA vaga.
 *
 * - **Abaixo de 40**: falta requisito eliminatório — formação, registro
 *   profissional, área inteira. Ajuste de texto não resolve, e dizer o
 *   contrário venderia esperança falsa.
 * - **40 a 69**: dá para disputar, e é aqui que o produto rende mais: as
 *   lacunas são de ênfase, palavra-chave e evidência.
 * - **70 ou mais**: aderente; o trabalho é de acabamento.
 */

export type JobMatchSeverity = 'incompatible' | 'partial' | 'aligned'

export const INCOMPATIBLE_BELOW = 40
export const ALIGNED_FROM = 70

export function jobMatchSeverity(percentage: number | null | undefined): JobMatchSeverity {
  // Percentual ilegível não vira alarme: inventar gravidade a partir de um
  // número que não veio é o mesmo defeito por outro caminho.
  //
  // O teste de nulidade vem ANTES da conversão porque `Number(null)` é 0 — que
  // é finito, e cairia direto na faixa vermelha. Ausência viraria o alarme mais
  // grave que existe.
  if (percentage === null || percentage === undefined) return 'partial'

  const pct = Number(percentage)
  if (!Number.isFinite(pct)) return 'partial'
  if (pct < INCOMPATIBLE_BELOW) return 'incompatible'
  if (pct >= ALIGNED_FROM) return 'aligned'
  return 'partial'
}

export interface JobMatchTone {
  /** Título do aviso. Vazio quando não há aviso a dar. */
  headline: string
  /** O que isso significa para a candidatura, sem rodeio e sem desânimo. */
  detail: string
}

/**
 * O texto que acompanha a faixa.
 *
 * O da faixa vermelha é o que mais importa e o mais fácil de escrever errado.
 * Ele precisa dizer que a candidatura tende a ser reprovada — e, na mesma
 * frase, que isso NÃO é um veredito sobre o currículo. Sem a segunda metade, a
 * pessoa conclui que o documento dela é ruim quando o problema é a distância
 * até esta vaga específica.
 */
export const JOB_MATCH_TONE: Record<JobMatchSeverity, JobMatchTone> = {
  incompatible: {
    headline: 'Esta vaga exige requisitos que o currículo não atende',
    detail:
      'A candidatura a esta vaga tende a ser reprovada logo na triagem, e nenhum ajuste de texto muda isso. Não é um veredito sobre o seu currículo: é a distância entre ele e ESTA vaga. Compare com uma vaga da sua área para ver a diferença.',
  },
  partial: {
    headline: 'Dá para disputar esta vaga, com ajustes',
    detail:
      'Há lacunas, mas são do tipo que o currículo resolve: ênfase, palavra-chave e evidência do que você já fez. Os requisitos ausentes abaixo são a lista do que atacar.',
  },
  aligned: {
    headline: 'Seu perfil é aderente a esta vaga',
    detail:
      'Os requisitos principais estão cobertos. O trabalho aqui é de acabamento — deixar explícito o que já existe no currículo.',
  },
}
