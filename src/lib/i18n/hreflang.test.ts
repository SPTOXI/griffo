import test from 'node:test'
import assert from 'node:assert/strict'
import { LANGUAGES, localeForLang, dirForLang, type Language } from './index'
import { HREFLANG_COUNTRY_ROUTE, rootHreflang, declaredLocales } from './hreflang'
import { SUPPORTED_COUNTRY_SLUGS } from '../market/supported-slugs'
import { marketForCountry } from '../market'

/**
 * Estes testes existem por um defeito real, não por completude cerimonial.
 *
 * O `<html lang="pt-BR">` do layout raiz era fixo enquanto `/de` servia
 * alemão, `/jp` japonês e `/ae` árabe — o site inteiro declarando ser
 * português, contradizendo o `hreflang` do mesmo arquivo. E `/ae` servia árabe
 * sem nenhum `dir="rtl"` no HTML: a página espelhada errada de ponta a ponta.
 *
 * Nada disso falhava em teste nenhum, porque não havia teste. O que se cobra
 * aqui é o que teria pegado os dois na hora.
 */

test('hreflang da raiz cobre todo idioma de LANGUAGES', () => {
  for (const lang of LANGUAGES) {
    assert.ok(
      HREFLANG_COUNTRY_ROUTE[lang],
      `${lang} está em LANGUAGES mas não tem rota de país no hreflang da raiz. ` +
        `O Google descarta o bloco INTEIRO quando ele não fecha (§2.69), então ` +
        `o idioma faltando não custa um idioma — custa os doze.`
    )
  }
})

test('hreflang não declara idioma que o site não fala', () => {
  for (const lang of Object.keys(HREFLANG_COUNTRY_ROUTE)) {
    assert.ok(
      (LANGUAGES as string[]).includes(lang),
      `${lang} tem rota no hreflang mas saiu de LANGUAGES — sobra apontando ` +
        `para conteúdo que não existe mais`
    )
  }
})

test('toda rota do hreflang é pré-gerada por SSG', () => {
  for (const lang of LANGUAGES) {
    const slug = HREFLANG_COUNTRY_ROUTE[lang]
    assert.ok(
      SUPPORTED_COUNTRY_SLUGS.includes(slug),
      `/${slug} é declarada como a casa do "${lang}" no hreflang, mas não está ` +
        `em SUPPORTED_COUNTRY_SLUGS — renderiza a cada requisição em vez de sair ` +
        `pronta do build. Era o caso de /se, /cn e /kr.`
    )
  }
})

test('toda rota do hreflang serve de fato o idioma que declara', () => {
  for (const lang of LANGUAGES) {
    const slug = HREFLANG_COUNTRY_ROUTE[lang]
    const market = marketForCountry(slug.toUpperCase())
    assert.equal(
      market.jobLanguage,
      lang,
      `o hreflang manda quem fala "${lang}" para /${slug}, mas essa rota serve ` +
        `"${market.jobLanguage}" — o visitante cai numa página em outro idioma`
    )
  }
})

test('x-default aponta para a página global, não para a raiz em português', () => {
  const block = rootHreflang()
  assert.equal(block['x-default'], 'https://griffo.work/global')
})

test('declaredLocales acompanha LANGUAGES', () => {
  assert.deepEqual(declaredLocales(), LANGUAGES.map(localeForLang))
})

test('dirForLang: árabe é rtl, e todo idioma tem direção explícita', () => {
  assert.equal(dirForLang('ar'), 'rtl')
  for (const lang of LANGUAGES) {
    const dir = dirForLang(lang)
    assert.ok(
      dir === 'rtl' || dir === 'ltr',
      `${lang} não tem direção de texto definida — foi assim que /ae passou a ` +
        `servir árabe da esquerda para a direita`
    )
  }
})

test('idioma novo obriga a decidir a direção do texto, em vez de herdar ltr calado', () => {
  // Os idiomas RTL vivos no mundo que este projeto pode vir a adotar. Se um
  // deles entrar em LANGUAGES sem entrar em RTL_LANGUAGES, `dirForLang`
  // devolveria 'ltr' e a página nasceria espelhada errada — exatamente o que
  // aconteceu com o árabe, calado, até alguém abrir /ae.
  const RTL_CONHECIDOS = ['ar', 'he', 'fa', 'ur']
  for (const code of RTL_CONHECIDOS) {
    if ((LANGUAGES as string[]).includes(code)) {
      assert.equal(
        dirForLang(code as Language),
        'rtl',
        `"${code}" é escrito da direita para a esquerda e está em LANGUAGES, ` +
          `mas dirForLang devolve ltr — acrescente-o a RTL_LANGUAGES`
      )
    }
  }
})
