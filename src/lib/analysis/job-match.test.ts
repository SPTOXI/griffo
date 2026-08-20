import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ALIGNED_FROM,
  INCOMPATIBLE_BELOW,
  JOB_MATCH_TONE,
  jobMatchSeverity,
} from './job-match'

test('vaga de outra profissão é incompatível', () => {
  // O caso real: currículo de 25 anos em gestão comercial contra uma vaga que
  // exige formação em Biomedicina e CRBM ativo.
  assert.equal(jobMatchSeverity(5), 'incompatible')
  assert.equal(jobMatchSeverity(0), 'incompatible')
  assert.equal(jobMatchSeverity(INCOMPATIBLE_BELOW - 1), 'incompatible')
})

test('as bordas caem do lado declarado', () => {
  assert.equal(jobMatchSeverity(INCOMPATIBLE_BELOW), 'partial')
  assert.equal(jobMatchSeverity(ALIGNED_FROM - 1), 'partial')
  assert.equal(jobMatchSeverity(ALIGNED_FROM), 'aligned')
  assert.equal(jobMatchSeverity(100), 'aligned')
})

test('percentual ilegível não vira alarme', () => {
  // Inventar gravidade a partir de um número que não veio é o mesmo defeito
  // por outro caminho.
  assert.equal(jobMatchSeverity(null), 'partial')
  assert.equal(jobMatchSeverity(undefined), 'partial')
  assert.equal(jobMatchSeverity(Number.NaN), 'partial')
})

test('o aviso vermelho separa a vaga do currículo', () => {
  // Sem essa separação a pessoa conclui que o documento dela é ruim, quando o
  // problema é a distância até ESTA vaga.
  const tone = JOB_MATCH_TONE.incompatible
  assert.ok(/reprovada/i.test(tone.detail))
  assert.ok(/não é um veredito sobre o seu currículo/i.test(tone.detail))
})

test('toda faixa tem texto', () => {
  for (const severity of ['incompatible', 'partial', 'aligned'] as const) {
    assert.ok(JOB_MATCH_TONE[severity].headline.length > 0, severity)
    assert.ok(JOB_MATCH_TONE[severity].detail.length > 0, severity)
  }
})
