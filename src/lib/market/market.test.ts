import test from 'node:test'
import assert from 'node:assert/strict'
import {
  GLOBAL_MARKET,
  MARKETS,
  marketById,
  marketForCountry,
  marketPromptContext,
  resolveMarket,
} from './index'

test('todo mercado declarado é alcançável pelos seus países', () => {
  for (const market of MARKETS) {
    assert.ok(market.countries.length > 0, `mercado ${market.id} não atende país nenhum`)
    for (const country of market.countries) {
      assert.equal(
        marketForCountry(country).id,
        market.id,
        `país ${country} não resolve para o mercado ${market.id}`
      )
    }
  }
})

test('nenhum país é reivindicado por dois mercados', () => {
  const seen = new Map<string, string>()
  for (const market of MARKETS) {
    for (const country of market.countries) {
      const owner = seen.get(country)
      assert.equal(owner, undefined, `país ${country} declarado em ${owner} e em ${market.id}`)
      seen.set(country, market.id)
    }
  }
})

test('país desconhecido cai no mercado global, não no Brasil', () => {
  // A regra estrutural do produto: o Brasil é um mercado entre outros, nunca o
  // padrão do sistema. Um país sem configuração recebe listas globais.
  assert.equal(marketForCountry('ZZ').id, 'GLOBAL')
  assert.equal(marketForCountry('').id, 'GLOBAL')
  assert.equal(marketForCountry(null).id, 'GLOBAL')
  assert.equal(marketById('inexistente').id, 'GLOBAL')
})

test('o alvo profissional declarado vence a residência e o idioma', () => {
  const { market, source } = resolveMarket({
    targetCountry: 'US',
    residenceCountry: 'BR',
    language: 'pt',
  })
  assert.equal(market.id, 'US')
  assert.equal(source, 'target')
})

test('a residência vence o idioma da interface', () => {
  const { market, source } = resolveMarket({ residenceCountry: 'PT', language: 'en' })
  assert.equal(market.id, 'PT')
  assert.equal(source, 'residence')
})

/**
 * O caso que motivou toda esta camada.
 *
 * Antes, o contexto de mercado saía de uma tabela indexada pelo idioma da
 * interface: quem estava no Brasil, com a tela em português, mirando os Estados
 * Unidos, recebia recomendação de palavra-chave otimizada para a Gupy — e será
 * triado pelo Workday.
 */
test('interface em português com alvo nos EUA não recebe ATS brasileiro', () => {
  const { market } = resolveMarket({ targetCountry: 'US', residenceCountry: 'BR', language: 'pt' })
  const prompt = marketPromptContext(market)
  assert.ok(!prompt.includes('Gupy'), 'ATS brasileiro vazou para o mercado dos EUA')
  assert.ok(prompt.includes('Workday'), 'ATS dominante nos EUA ausente do contexto')
})

test('o idioma só decide quando não há alvo nem residência conhecida', () => {
  assert.deepEqual(
    { id: resolveMarket({ language: 'pt' }).market.id, source: resolveMarket({ language: 'pt' }).source },
    { id: 'BR', source: 'language' }
  )
  assert.equal(resolveMarket({ language: 'es' }).market.id, 'ES')
  assert.equal(resolveMarket({ language: 'en' }).market.id, 'US')
})

test('sem sinal nenhum, mercado global', () => {
  const { market, source } = resolveMarket({})
  assert.equal(market.id, 'GLOBAL')
  assert.equal(source, 'default')
})

test('trabalho remoto internacional é um mercado próprio, não um país', () => {
  const { market, source } = resolveMarket({ targetCountry: 'GLOBAL', residenceCountry: 'BR' })
  assert.equal(market.id, 'GLOBAL')
  assert.equal(source, 'target')
})

test('o contexto de prompt de cada mercado traz o que o prompt precisa', () => {
  for (const market of [...MARKETS, GLOBAL_MARKET]) {
    const prompt = marketPromptContext(market)
    assert.ok(prompt.includes(market.name), `${market.id}: nome do mercado ausente`)
    assert.ok(prompt.includes(market.ats[0]), `${market.id}: ATS predominante ausente`)
    assert.ok(prompt.includes(market.salaryCurrency), `${market.id}: moeda de salário ausente`)
    assert.ok(
      prompt.includes(market.employment.contractTypes[0]),
      `${market.id}: tipo de contrato predominante ausente`
    )
  }
})

/**
 * Moeda de salário e moeda de cobrança são coisas distintas (§33 do prompt
 * mestre). Um brasileiro mirando Londres vê salário em GBP e paga em BRL — se
 * alguém um dia derivar preço daqui, este teste é o aviso.
 */
test('a moeda de salário do mercado não é a moeda de cobrança do produto', () => {
  assert.equal(marketById('GB').salaryCurrency, 'GBP')
  assert.equal(marketById('BR').salaryCurrency, 'BRL')
  assert.notEqual(marketById('GB').salaryCurrency, marketById('BR').salaryCurrency)
})

test('mercados anglófonos não pedem foto no currículo', () => {
  // Não é preferência estética: em mercados com legislação antidiscriminação
  // forte a foto é motivo de descarte na triagem.
  for (const id of ['US', 'CA', 'GB', 'AU']) {
    assert.equal(marketById(id).resume.photo, 'avoid', `${id} não deveria esperar foto`)
  }
})
