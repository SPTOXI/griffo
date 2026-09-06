import test from 'node:test'
import assert from 'node:assert/strict'
import { ATS_DATABASE } from './data'

/**
 * Número que parece estatística de mercado: percentual ("70%"), milhar
 * ("25 mil", "4.000") ou referência a ranking ("Fortune 500").
 *
 * NÃO pega número que é só parte do nome do produto ou de uma norma — por
 * isso o teste roda só sobre `marketShare`, o campo onde a afirmação de
 * tamanho de mercado vive, e não sobre a descrição inteira.
 */
const LOOKS_LIKE_STAT = /\d+\s*%|\d[\d.,]*\s*(mil|milhões|milhão|bilhões)|\bFortune\s*\d+|\d{3,}/i

test('afirmação de mercado com número declara fonte e data', () => {
  // A trava principal é o TIPO (`kind: 'sourced'` obriga source/sourceUrl/asOf,
  // não compila sem). Este teste fecha a brecha que o tipo sozinho não
  // fecha: escrever o número dentro de um `qualitative`, onde nada exigiria
  // fonte. Foi assim que "mais de 70% das vagas corporativas" da Gupy ficou
  // meses no ar (§2.80).
  for (const [slug, ats] of Object.entries(ATS_DATABASE)) {
    if (ats.marketShare.kind !== 'qualitative') continue
    assert.ok(
      !LOOKS_LIKE_STAT.test(ats.marketShare.text),
      `'${slug}': afirmação de mercado tem número mas está como 'qualitative' — ` +
        `use kind: 'sourced' com source/sourceUrl/asOf, ou tire o número. Texto: "${ats.marketShare.text}"`
    )
  }
})

test('toda fonte declarada tem URL utilizável e ano', () => {
  for (const [slug, ats] of Object.entries(ATS_DATABASE)) {
    if (ats.marketShare.kind !== 'sourced') continue
    const { source, sourceUrl, asOf } = ats.marketShare
    assert.ok(source.trim().length > 0, `'${slug}': fonte vazia`)
    assert.match(sourceUrl, /^https:\/\/\S+$/, `'${slug}': sourceUrl não é URL https`)
    assert.match(asOf, /^\d{4}$/, `'${slug}': asOf deveria ser o ano (ex.: '2024')`)
  }
})

test('todo guia de ATS declara posição de mercado em uma das duas formas', () => {
  for (const [slug, ats] of Object.entries(ATS_DATABASE)) {
    assert.ok(
      ats.marketShare.kind === 'qualitative' || ats.marketShare.kind === 'sourced',
      `'${slug}': kind inesperado`
    )
    assert.ok(ats.marketShare.text.trim().length > 0, `'${slug}': texto vazio`)
  }
})
