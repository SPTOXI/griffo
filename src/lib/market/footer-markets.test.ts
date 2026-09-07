import test from 'node:test'
import assert from 'node:assert/strict'
import { FOOTER_MARKET_SLUGS } from './footer-markets'
import { SUPPORTED_COUNTRY_SLUGS } from './supported-slugs'
import { HREFLANG_COUNTRY_ROUTE } from '../i18n/hreflang'
import { LANGUAGES } from '../i18n'
import { displayCountry } from '../hiring-index/display'

/**
 * O defeito que estes testes existem para impedir foi achado em produção:
 * `/ae` — a rota que o `hreflang` da raiz declara ser a casa do árabe —
 * estava no sitemap, servindo página, e sem UM único link interno apontando
 * para ela. `/my` idem. As outras 27 rotas de país dependiam de um link só, o
 * da tabela do `/market-pulse`, que lista apenas quem tem dado no atlas: a
 * descoberta ficava presa à cobertura de uma coleta estatística.
 */

test('toda casa de idioma do hreflang tem link permanente no rodapé', () => {
  for (const lang of LANGUAGES) {
    const slug = HREFLANG_COUNTRY_ROUTE[lang]
    assert.ok(
      FOOTER_MARKET_SLUGS.includes(slug),
      `/${slug} é a casa do "${lang}" no hreflang, mas não está no rodapé. ` +
        `Sem link interno permanente ela depende da tabela do /market-pulse, ` +
        `que só lista países com dado no atlas — foi assim que /ae ficou órfã.`
    )
  }
})

test('todo slug do rodapé é uma rota que existe', () => {
  for (const slug of FOOTER_MARKET_SLUGS) {
    assert.ok(
      SUPPORTED_COUNTRY_SLUGS.includes(slug),
      `o rodapé linka /${slug}, que não está em SUPPORTED_COUNTRY_SLUGS — ` +
        `link interno para rota que não é gerada`
    )
  }
})

test('rodapé não repete o mesmo mercado', () => {
  assert.equal(
    new Set(FOOTER_MARKET_SLUGS).size,
    FOOTER_MARKET_SLUGS.length,
    'slug duplicado gera duas <a> para a mesma URL e chave repetida no React'
  )
})

test('rodapé não linka /global pela lista de países', () => {
  // `/global` tem rótulo próprio (`footer.globalRemote`) porque não é país e
  // `displayCountry('GLOBAL')` devolveria o código cru.
  assert.ok(!FOOTER_MARKET_SLUGS.includes('global'))
})

test('nome de país do rodapé sai traduzido, não em português fixo', () => {
  // A regressão concreta: o rodapé escrevia "Alemanha (DE)" e "Estados Unidos
  // (US)" nas 54 páginas públicas, inclusive nas onze línguas que não são
  // português.
  assert.equal(displayCountry('DE', 'de'), 'Deutschland')
  assert.equal(displayCountry('US', 'pt'), 'Estados Unidos')
  assert.notEqual(displayCountry('DE', 'ja'), displayCountry('DE', 'pt'))

  for (const lang of LANGUAGES) {
    for (const slug of FOOTER_MARKET_SLUGS) {
      const name = displayCountry(slug.toUpperCase(), lang)
      assert.ok(
        name && name !== slug.toUpperCase(),
        `sem nome de "${slug}" em "${lang}" — o rodapé mostraria o código cru`
      )
    }
  }
})

test('sitemap e rotas pré-geradas saem da MESMA lista de países', async () => {
  // Não é teste de estilo. `sitemap.ts` mantinha um literal de 41 slugs
  // idêntico ao de `supported-slugs.ts`, e ao acrescentar `se`, `cn` e `kr` às
  // rotas pré-geradas eles nasceram construídos e AUSENTES do sitemap — três
  // páginas que nenhum buscador seria avisado que existem.
  const fs = await import('node:fs/promises')
  const src = await fs.readFile('src/app/sitemap.ts', 'utf-8')
  assert.ok(
    src.includes('const COUNTRIES = SUPPORTED_COUNTRY_SLUGS'),
    'sitemap.ts voltou a manter a própria cópia da lista de países — duas ' +
      'listas que precisam concordar e nada as obriga'
  )
})
