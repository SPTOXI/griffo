import test from 'node:test'
import assert from 'node:assert/strict'
import { MODEL_PRICING, TIERED_MODEL_PRICING, resolveModelPricing } from './pricing'

// 16/08/2026 16:00 UTC — quando a tabela nova do DeepSeek entra em vigor.
const VIGENCIA = new Date(Date.UTC(2026, 7, 16, 16, 0, 0))
const antes = (h: number) => new Date(Date.UTC(2026, 7, 15, h, 0, 0))
const depois = (h: number) => new Date(Date.UTC(2026, 7, 20, h, 0, 0))

test('antes da vigência vale o preço antigo, mesmo em hora de pico', () => {
  assert.deepEqual(resolveModelPricing('deepseek-v4-flash', antes(2)), {
    inputPer1k: 0.00014,
    outputPer1k: 0.00028,
  })
})

test('a partir do instante da vigência vale a tabela nova', () => {
  const umInstanteAntes = new Date(VIGENCIA.getTime() - 1)
  assert.equal(resolveModelPricing('deepseek-v4-flash', umInstanteAntes)?.inputPer1k, 0.00014)
  // 16:00 UTC é hora fora de pico.
  assert.equal(resolveModelPricing('deepseek-v4-flash', VIGENCIA)?.inputPer1k, 0.00022)
})

test('as duas janelas de pico cobram o dobro do resto do dia', () => {
  for (const model of ['deepseek-v4-flash', 'deepseek-v4-pro']) {
    const foraDePico = resolveModelPricing(model, depois(12))!
    for (const horaDePico of [1, 2, 3, 6, 7, 8, 9]) {
      const pico = resolveModelPricing(model, depois(horaDePico))!
      assert.equal(pico.inputPer1k, foraDePico.inputPer1k * 2, `${model} às ${horaDePico}h UTC`)
      assert.equal(pico.outputPer1k, foraDePico.outputPer1k * 2, `${model} às ${horaDePico}h UTC`)
    }
  }
})

test('as bordas das janelas são [início, fim) — 04:00 e 10:00 já são fora de pico', () => {
  const foraDePico = resolveModelPricing('deepseek-v4-flash', depois(12))!
  for (const hora of [0, 4, 5, 10, 11, 23]) {
    assert.deepEqual(
      resolveModelPricing('deepseek-v4-flash', depois(hora)),
      foraDePico,
      `${hora}h UTC deveria ser fora de pico`
    )
  }
})

test('o horário comercial brasileiro cai inteiro fora de pico', () => {
  const foraDePico = resolveModelPricing('deepseek-v4-flash', depois(12))!
  // 08:00–20:00 BRT (UTC-3) = 11:00–23:00 UTC.
  for (let horaUtc = 11; horaUtc <= 23; horaUtc++) {
    assert.deepEqual(
      resolveModelPricing('deepseek-v4-flash', depois(horaUtc)),
      foraDePico,
      `${horaUtc}h UTC está dentro do horário comercial e não pode ser pico`
    )
  }
})

test('os valores publicados pelo DeepSeek', () => {
  assert.deepEqual(resolveModelPricing('deepseek-v4-flash', depois(12)), {
    inputPer1k: 0.00022, // $0,22 / 1M
    outputPer1k: 0.00066, // $0,66 / 1M
  })
  assert.deepEqual(resolveModelPricing('deepseek-v4-flash', depois(2)), {
    inputPer1k: 0.00044, // $0,44 / 1M
    outputPer1k: 0.00132, // $1,32 / 1M
  })
  assert.deepEqual(resolveModelPricing('deepseek-v4-pro', depois(12)), {
    inputPer1k: 0.00066, // $0,66 / 1M
    outputPer1k: 0.00198, // $1,98 / 1M
  })
  assert.deepEqual(resolveModelPricing('deepseek-v4-pro', depois(2)), {
    inputPer1k: 0.00132, // $1,32 / 1M
    outputPer1k: 0.00396, // $3,96 / 1M
  })
})

test('o aumento é real: a faixa fora de pico ainda é mais cara que o preço de hoje', () => {
  for (const model of Object.keys(TIERED_MODEL_PRICING)) {
    const hoje = MODEL_PRICING[model]!
    const foraDePico = TIERED_MODEL_PRICING[model].offPeak
    assert.ok(foraDePico.inputPer1k > hoje.inputPer1k, `${model}: entrada`)
    assert.ok(foraDePico.outputPer1k > hoje.outputPer1k, `${model}: saída`)
  }
})

test('modelo sem preço por horário não muda com a hora nem com a data', () => {
  const sonnet = { inputPer1k: 0.003, outputPer1k: 0.015 }
  assert.deepEqual(resolveModelPricing('claude-sonnet-5', antes(2)), sonnet)
  assert.deepEqual(resolveModelPricing('claude-sonnet-5', depois(2)), sonnet)
  assert.deepEqual(resolveModelPricing('claude-sonnet-5', depois(12)), sonnet)
})

test('modelo desconhecido não tem preço — o chamador cai no do provedor', () => {
  assert.equal(resolveModelPricing('deepseek-chat', depois(12)), undefined)
})
