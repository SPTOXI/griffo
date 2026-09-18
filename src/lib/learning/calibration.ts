import type { OverallFit } from '../matching/compatibility'

/**
 * A nota que demos prevê o que aconteceu de verdade — para ESTA pessoa?
 *
 * ## Por que isto existe
 *
 * Recolocação 90 dias é pagamento único por 90 dias: o risco do produto não é
 * a venda, é a pessoa sumir na semana 3. Um relatório que diz "as suas
 * candidaturas `strong` viraram conversa em 22%, as `partial` em 4%" é motivo
 * recorrente de voltar — e, diferente de quase tudo o que se pode mostrar, ele
 * fica mais útil quanto mais a pessoa usa.
 *
 * O sistema de nota continua global. O que é pessoal é a **evidência sobre
 * como ele se comporta na busca desta pessoa**. Este módulo lê e agrega; ele
 * nunca ajusta limiar, peso ou regra de matching.
 *
 * ## As duas regras de honestidade
 *
 * Elas são a diferença entre um painel confiável e um gerador de ruído caro, e
 * estão aqui como código testado, não como intenção:
 *
 * 1. **Candidatura em andamento não é ponto de dado.** Contar quem ainda não
 *    respondeu como fracasso pune toda candidatura recente; contar como
 *    sucesso lisonjeia tudo. Fica fora de toda taxa e é reportada à parte.
 * 2. **Nenhuma taxa abaixo do piso amostral.** "2 de 3" não é 67%. Abaixo do
 *    piso a taxa é `null` e quem exibe mostra a contagem crua, nunca um
 *    percentual — a mesma disciplina do piso de 30 vagas por país do §2.127.
 *
 * ## O que este módulo NÃO é
 *
 * Não é teste de significância. Não há valor-p aqui, e o veredito é uma
 * heurística de painel pessoal: com dezenas de candidaturas, e não milhares,
 * qualquer inferência formal seria teatro. Dizer isso por escrito é parte do
 * contrato — quem ler `predictive` precisa saber que leu "o padrão aponta
 * para lá", não "está provado".
 *
 * Fase 1: módulo puro. Sem schema e sem tela — ver `docs/PLANO-CAREER-OPS.md` (F2).
 */

/**
 * O estágio MAIS LONGE que a candidatura chegou — não o veredito final.
 *
 * A distinção decide o número: quem foi entrevistado e depois recusado grava
 * `interview`, não `rejected`. Para a pergunta que este módulo faz — a nota
 * previu TRAÇÃO? — chegar à conversa é o desfecho favorável, mesmo que a vaga
 * tenha ido para outra pessoa. `rejected` é a recusa que veio antes de
 * qualquer conversa.
 */
export type ApplicationOutcome =
  /** Candidatou-se e ainda não houve desfecho. Nunca entra numa taxa. */
  | 'in_flight'
  /** Silêncio: tempo suficiente sem resposta nenhuma. */
  | 'no_response'
  /** Recusa explícita, sem ter chegado a conversa. */
  | 'rejected'
  /** Chegou a entrevista — independente do que veio depois. */
  | 'interview'
  /** Recebeu proposta. */
  | 'offer'

/** Uma candidatura resolvida ou em andamento, reduzida ao que a conta usa. */
export interface CalibrationEntry {
  /** A faixa que demos no momento do alerta (`RadarAlert.overallFit`). */
  band: OverallFit
  outcome: ApplicationOutcome
}

/**
 * Da pior para a melhor. A ordem é o eixo do veredito: sem ela não há "faixa
 * de cima" nem "faixa de baixo" para comparar.
 */
export const BAND_ORDER: readonly OverallFit[] = ['weak', 'partial', 'good', 'strong']

/**
 * Abaixo disto, nenhuma taxa é calculada.
 *
 * Cinco é baixo para estatística e alto para quem está começando — é o
 * compromisso deliberado de um painel que precisa dizer algo antes do
 * centésimo envio sem dizer bobagem no quinto. Com 5, uma candidatura vale 20
 * pontos percentuais; é por isso que o veredito exige, além do piso, uma
 * diferença grande (`MEANINGFUL_GAP`).
 */
export const SAMPLE_FLOOR = 5

/**
 * Diferença mínima entre a faixa de cima e a de baixo para o veredito sair de
 * `flat`.
 *
 * Quinze pontos percentuais é menos de uma candidatura de diferença no piso
 * amostral — de propósito frouxo o bastante para detectar um padrão real cedo,
 * e explicitamente frouxo demais para ser prova. Ver "o que este módulo NÃO é".
 */
export const MEANINGFUL_GAP = 0.15

/** Sem duas faixas com amostra, não há comparação possível — só uma metade. */
export const MIN_BANDS_FOR_VERDICT = 2

export interface BandStats {
  band: OverallFit
  /** Candidaturas com desfecho. É o denominador. */
  resolved: number
  /** Quantas chegaram a conversa (`interview` ou `offer`). */
  advanced: number
  /** `null` abaixo do piso amostral. Quem exibe mostra a contagem crua. */
  rate: number | null
  /** Em andamento. Reportadas, nunca contadas. */
  inFlight: number
}

export type CalibrationVerdict =
  /** Menos de duas faixas acima do piso: não dá para comparar nada ainda. */
  | 'insufficient'
  /** Faixa alta converte mais que a baixa, por margem que não é ruído. */
  | 'predictive'
  /** Há amostra, e as faixas convertem parecido. */
  | 'flat'
  /** Faixa alta converte MENOS que a baixa — achado, não erro de conta. */
  | 'inverted'

export interface Calibration {
  /** Sempre as quatro faixas, em `BAND_ORDER`, mesmo as vazias. */
  bands: BandStats[]
  verdict: CalibrationVerdict
  totalResolved: number
  totalInFlight: number
}

/** Desfecho favorável: chegou a conversa. */
function isAdvanced(outcome: ApplicationOutcome): boolean {
  return outcome === 'interview' || outcome === 'offer'
}

/**
 * Compara a melhor e a pior faixa que têm amostra suficiente.
 *
 * Usa os extremos, e não uma tendência sobre as quatro, porque com dezenas de
 * pontos as faixas do meio quase nunca passam do piso — exigir monotonicidade
 * nas quatro devolveria `insufficient` para sempre, que é o mesmo que não
 * responder.
 */
function verdictFor(bands: readonly BandStats[]): CalibrationVerdict {
  const qualified = bands.filter((b) => b.rate !== null)
  if (qualified.length < MIN_BANDS_FOR_VERDICT) return 'insufficient'

  const lowest = qualified[0]
  const highest = qualified[qualified.length - 1]
  const gap = highest.rate! - lowest.rate!

  if (gap >= MEANINGFUL_GAP) return 'predictive'
  if (gap <= -MEANINGFUL_GAP) return 'inverted'
  return 'flat'
}

/**
 * Agrega as candidaturas em taxa por faixa, mais o veredito.
 *
 * Entrada em qualquer ordem; a saída sai sempre em `BAND_ORDER`, para a tela
 * não depender da ordem em que o banco devolveu.
 */
export function calibrate(entries: readonly CalibrationEntry[]): Calibration {
  const bands: BandStats[] = BAND_ORDER.map((band) => {
    const ofBand = entries.filter((e) => e.band === band)
    const inFlight = ofBand.filter((e) => e.outcome === 'in_flight').length
    const settled = ofBand.filter((e) => e.outcome !== 'in_flight')
    const advanced = settled.filter((e) => isAdvanced(e.outcome)).length

    return {
      band,
      resolved: settled.length,
      advanced,
      // A regra 2, no único lugar onde uma taxa nasce.
      rate: settled.length >= SAMPLE_FLOOR ? advanced / settled.length : null,
      inFlight,
    }
  })

  return {
    bands,
    verdict: verdictFor(bands),
    totalResolved: bands.reduce((sum, b) => sum + b.resolved, 0),
    totalInFlight: bands.reduce((sum, b) => sum + b.inFlight, 0),
  }
}
