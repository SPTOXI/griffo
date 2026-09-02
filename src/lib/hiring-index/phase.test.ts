import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_MINIMUM_POINTS,
  classifyHiringPhase,
  median,
  movingAverage,
  normalizeSeries,
  trailingSlope,
  type HiringSeriesPoint,
} from './phase'

/** Série mensal a partir de janeiro de 2024, um valor por mês. */
const serie = (valores: number[], extra: Partial<HiringSeriesPoint> = {}): HiringSeriesPoint[] =>
  valores.map((value, i) => ({ period: new Date(Date.UTC(2024, i, 1)), value, ...extra }))

const fase = (valores: number[]) => classifyHiringPhase(serie(valores)).phase

// ---------------------------------------------------------------------------
// As cinco fases
// ---------------------------------------------------------------------------

test('média móvel caindo é ESFRIAMENTO', () => {
  assert.equal(fase([5.0, 4.8, 4.6, 4.4, 4.2, 4.0, 3.8, 3.6]), 'cooling')
})

test('queda lenta e constante continua sendo esfriamento, não fundo de poço', () => {
  // 0,05 p.p. por mês sobre ~2,8% é pouco, mas é consistente. O limiar de
  // planura foi calibrado exatamente para não engolir este caso.
  assert.equal(fase([3.0, 2.95, 2.9, 2.85, 2.8, 2.75, 2.7, 2.65]), 'cooling')
})

test('parou de cair, no fundo da própria série, é FUNDO DE POÇO', () => {
  assert.equal(fase([5.0, 4.6, 4.2, 3.8, 3.5, 3.3, 3.2, 3.2, 3.2, 3.2, 3.2]), 'bottoming_out')
})

test('subindo, mas ainda abaixo do próprio normal, é RECUPERAÇÃO', () => {
  assert.equal(
    fase([6.0, 5.7, 5.4, 5.1, 4.8, 4.5, 4.2, 3.9, 3.6, 3.3, 3.0, 3.2, 3.5, 3.8]),
    'recovering'
  )
})

test('subindo e já acima do próprio normal é AQUECIMENTO', () => {
  assert.equal(fase([3.0, 3.0, 3.1, 3.2, 3.4, 3.6, 3.9, 4.2, 4.5, 4.8]), 'heating_up')
})

test('série parada num nível normal é ESTÁVEL, e não uma das quatro à força', () => {
  // Encaixar isto em "recuperando" ou "no fundo" seria inventar um movimento
  // que o dado não mostra.
  assert.equal(fase([4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0]), 'stable')
})

test('OSCILAÇÃO SEM RUMO NÃO É TENDÊNCIA', () => {
  // ±0,1 p.p. em torno de 2,5%, indo e voltando. Um limiar de planura frouxo
  // demais leria o último repique como aquecimento e a tela diria que o
  // mercado virou.
  assert.equal(fase([2.5, 2.4, 2.5, 2.6, 2.5, 2.4, 2.5, 2.6, 2.5]), 'stable')
})

// ---------------------------------------------------------------------------
// Dado insuficiente — nunca um palpite
// ---------------------------------------------------------------------------

test('SEM PONTO NENHUM, A RESPOSTA É "NÃO SEI"', () => {
  const r = classifyHiringPhase([])
  assert.equal(r.phase, null)
  assert.equal(r.insufficientDataReason, 'no_points')
  assert.equal(r.latest, null)
  assert.equal(r.slope, null)
  assert.deepEqual(r.movingAverage, [])
  assert.equal(r.pointsUsed, 0)
})

test('poucos períodos não viram fase, por mais tentadora que a reta seja', () => {
  const r = classifyHiringPhase(serie([4.0, 4.1, 4.2, 4.3, 4.4]))
  assert.equal(r.phase, null)
  assert.equal(r.insufficientDataReason, 'too_few_points')
  assert.equal(r.pointsUsed, 5)
  assert.equal(r.minimumPoints, DEFAULT_MINIMUM_POINTS)
})

test('o mínimo exato classifica; um a menos, não', () => {
  assert.equal(classifyHiringPhase(serie([5, 4.8, 4.6, 4.4, 4.2, 4.0])).phase, 'cooling')
  assert.equal(classifyHiringPhase(serie([5, 4.8, 4.6, 4.4, 4.2])).phase, null)
})

test('valor não numérico não conta como ponto', () => {
  const sujo: HiringSeriesPoint[] = [
    ...serie([5.0, 4.8, 4.6]),
    { period: new Date(Date.UTC(2024, 3, 1)), value: Number.NaN },
    { period: new Date(Date.UTC(2024, 4, 1)), value: Number.POSITIVE_INFINITY },
    { period: 'data inválida', value: 4.2 },
  ]
  const r = classifyHiringPhase(sujo)
  assert.equal(r.pointsUsed, 3)
  assert.equal(r.phase, null)
})

// ---------------------------------------------------------------------------
// Quebra de série
// ---------------------------------------------------------------------------

test('A SÉRIE COMEÇA NA QUEBRA MAIS RECENTE', () => {
  // Antes da quebra o instituto media outra coisa. Emendar os dois trechos
  // faria uma mudança de metodologia aparecer na tela como mercado virando.
  const pontos = serie([1.0, 1.0, 1.0, 1.0, 1.0, 5.0, 4.8, 4.6, 4.4, 4.2, 4.0])
  pontos[5].seriesBreak = true

  const r = classifyHiringPhase(pontos)
  assert.equal(r.pointsUsed, 6)
  assert.equal(r.phase, 'cooling')
  // O 1.0 de antes da quebra não pode ter virado o fundo da série.
  assert.ok(r.trough! > 4)
})

test('quebra recente demais devolve "não sei", com o motivo certo', () => {
  const pontos = serie([3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7])
  pontos[6].seriesBreak = true

  const r = classifyHiringPhase(pontos)
  assert.equal(r.phase, null)
  assert.equal(r.insufficientDataReason, 'series_break_too_recent')
  assert.equal(r.pointsUsed, 2)
})

// ---------------------------------------------------------------------------
// Preliminar, revisão e confiança
// ---------------------------------------------------------------------------

test('MÉDIA MÓVEL DE 3, SEMPRE — não há caminho que classifique pelo valor cru', () => {
  const ma = movingAverage(
    serie([3, 6, 9, 12]).map((p) => ({ period: p.period as Date, value: p.value, revised: true }))
  )
  assert.equal(ma.length, 2)
  assert.equal(ma[0].value, 6)
  assert.equal(ma[1].value, 9)
  // A média é datada pelo ÚLTIMO ponto da janela: ela responde "onde o
  // mercado está agora", não onde estava no meio da janela.
  assert.equal(ma[1].period.toISOString(), '2024-04-01T00:00:00.000Z')
})

test('a janela final avisa quando ainda contém impressão preliminar', () => {
  const pontos = serie([4.4, 4.3, 4.5, 4.6, 4.2, 4.2, 4.4])
  pontos[6].revised = false

  const r = classifyHiringPhase(pontos)
  assert.equal(r.latestIsPreliminary, true)
  assert.equal(r.movingAverage[r.movingAverage.length - 1].windowHasPreliminary, true)
  // A janela mais antiga não tem nenhum preliminar.
  assert.equal(r.movingAverage[0].windowHasPreliminary, false)
})

test('A LEITURA REVISADA SUBSTITUI A PRELIMINAR DO MESMO PERÍODO', () => {
  // É o caso do JOLTS: a mesma competência é buscada várias vezes e volta
  // primeiro preliminar, depois revisada. Somar as duas daria peso duplo a um
  // mês só.
  const julho = new Date(Date.UTC(2024, 6, 1))
  const pontos: HiringSeriesPoint[] = [
    ...serie([5.0, 4.8, 4.6, 4.4, 4.2, 4.0]),
    { period: julho, value: 9.9, revised: false },
    { period: julho, value: 3.8, revised: true },
  ]

  const normalizada = normalizeSeries(pontos)
  assert.equal(normalizada.length, 7)
  assert.equal(normalizada[6].value, 3.8)
  assert.equal(normalizada[6].revised, true)
  assert.equal(classifyHiringPhase(pontos).phase, 'cooling')
})

test('a ordem de chegada não importa: a série é ordenada por período', () => {
  const embaralhada = [...serie([5.0, 4.8, 4.6, 4.4, 4.2, 4.0])].reverse()
  const r = classifyHiringPhase(embaralhada)
  assert.equal(r.phase, 'cooling')
  assert.equal(r.movingAverage[0].period.getTime() < r.movingAverage[1].period.getTime(), true)
})

test('UM SÓ PONTO DE BAIXA CONFIANÇA REBAIXA A ANÁLISE INTEIRA', () => {
  // A média móvel mistura três períodos: se um deles é ruim, a média é ruim.
  // Apresentar o resultado com a mesma precisão implícita de uma série limpa
  // seria emprestar autoridade que o dado não tem.
  const pontos = serie([5.0, 4.8, 4.6, 4.4, 4.2, 4.0])
  pontos[2].confidence = 'low'

  const r = classifyHiringPhase(pontos)
  assert.equal(r.confidence, 'low')
  assert.equal(r.phase, 'cooling')

  assert.equal(classifyHiringPhase(serie([5.0, 4.8, 4.6, 4.4, 4.2, 4.0])).confidence, 'high')
})

// ---------------------------------------------------------------------------
// A regra de ouro: nada aqui compara países
// ---------------------------------------------------------------------------

test('A MESMA FORMA DE CURVA DÁ A MESMA FASE EM QUALQUER NÍVEL', () => {
  // A Polônia opera perto de 0,8% e os Países Baixos perto de 4,0%. Uma queda
  // proporcional idêntica tem de ser lida do mesmo jeito nos dois — é isso que
  // torna a leitura auto-referencial em vez de um ranking disfarçado.
  const polonia = [0.80, 0.76, 0.72, 0.68, 0.64, 0.60, 0.56]
  const paisesBaixos = polonia.map((v) => v * 5)

  assert.equal(fase(polonia), 'cooling')
  assert.equal(fase(paisesBaixos), 'cooling')

  const a = classifyHiringPhase(serie(polonia))
  const b = classifyHiringPhase(serie(paisesBaixos))
  // A inclinação é relativa ao nível, então é a MESMA nos dois.
  assert.ok(Math.abs(a.slope! - b.slope!) < 1e-9)
  // E o nível absoluto, que seria a base de um ranking, difere por 5x.
  assert.ok(Math.abs(b.latest! - a.latest! * 5) < 1e-9)
})

test('a referência é a mediana da própria série, não o começo da janela', () => {
  // Uma janela que começasse no meio da queda faria qualquer repique parecer
  // aquecimento, se a referência fosse o primeiro ponto.
  const valores = [6.0, 5.4, 4.8, 4.2, 3.6, 3.0, 3.2, 3.5, 3.8]
  const r = classifyHiringPhase(serie(valores))
  assert.equal(r.phase, 'recovering')
  assert.ok(r.latest! < r.reference!)
  assert.equal(r.reference, median(r.movingAverage.map((p) => p.value)))
})

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

test('mediana de lista par e ímpar, sem exigir ordem', () => {
  assert.equal(median([]), null)
  assert.equal(median([3]), 3)
  assert.equal(median([5, 1, 3]), 3)
  assert.equal(median([4, 1, 3, 2]), 2.5)
})

test('a inclinação é por mínimos quadrados, não pela diferença das pontas', () => {
  // Subida constante e "queda seguida de repique" têm a mesma diferença entre
  // primeiro e último ponto, e são coisas diferentes.
  assert.equal(trailingSlope([1, 2, 3], 3), 1)
  assert.equal(trailingSlope([3, 2, 1], 3), -1)
  assert.equal(trailingSlope([2, 2, 2], 3), 0)
  assert.equal(trailingSlope([9], 3), null)
  assert.equal(trailingSlope([], 3), null)
  // Só os últimos `count` contam.
  assert.equal(trailingSlope([100, 1, 2, 3], 3), 1)
})

test('média móvel de janela maior que a série devolve vazio, não uma média parcial', () => {
  const pontos = serie([1, 2]).map((p) => ({ period: p.period as Date, value: p.value, revised: true }))
  assert.deepEqual(movingAverage(pontos, 3), [])
})
