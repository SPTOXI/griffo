import test from 'node:test'
import assert from 'node:assert/strict'
import { ATS_META, ATS_SLUGS, atsSlugsForLanguage } from './meta'
import {
  atsContentFor,
  atsLanguagesFor,
  atsRoutePairs,
  availableAtsLanguages,
  rawLocaleSlugs,
} from './content'
import { LANGUAGES } from '../i18n'
import type { AtsContent } from './content-types'

/**
 * Número que parece estatística de mercado: percentual ("70%"), milhar
 * ("25 mil", "4.000") ou referência a ranking ("Fortune 500").
 */
const LOOKS_LIKE_STAT = /\d+\s*%|\d[\d.,]*\s*(mil|milhões|milhão|bilhões|thousand|million)|\bFortune\s*\d+|\d{3,}/i

test('afirmação de mercado com número declara fonte e data — em TODO idioma', () => {
  // A trava principal é o TIPO (`kind: 'sourced'` obriga source/sourceUrl/asOf,
  // não compila sem). Este teste fecha a brecha que o tipo sozinho não fecha:
  // escrever o número dentro do texto de um ATS marcado como `qualitative`.
  // Foi assim que "mais de 70% das vagas corporativas" da Gupy ficou meses no
  // ar (§2.80) — e agora vale para os 12 idiomas, não só o português onde o
  // defeito apareceu.
  for (const slug of ATS_SLUGS) {
    if (ATS_META[slug].marketShare.kind !== 'qualitative') continue
    for (const lang of atsLanguagesFor(slug)) {
      const content = atsContentFor(slug, lang)!
      assert.ok(
        !LOOKS_LIKE_STAT.test(content.marketShare),
        `'${slug}' [${lang}]: afirmação de mercado tem número mas o ATS está como ` +
          `'qualitative' — use kind: 'sourced' com source/sourceUrl/asOf, ou tire o ` +
          `número. Texto: "${content.marketShare}"`
      )
    }
  }
})

test('toda fonte declarada tem URL https e ano de 4 dígitos', () => {
  for (const slug of ATS_SLUGS) {
    const ms = ATS_META[slug].marketShare
    if (ms.kind !== 'sourced') continue
    assert.ok(ms.source.trim().length > 0, `'${slug}': fonte vazia`)
    assert.match(ms.sourceUrl, /^https:\/\/\S+$/, `'${slug}': sourceUrl não é URL https`)
    assert.match(ms.asOf, /^\d{4}$/, `'${slug}': asOf deveria ser o ano (ex.: '2024')`)
  }
})

test('todo ATS declara ao menos um idioma, e todo idioma declarado é válido', () => {
  for (const slug of ATS_SLUGS) {
    const langs = ATS_META[slug].languages
    assert.ok(langs.length > 0, `'${slug}': nenhum idioma declarado`)
    for (const l of langs) {
      assert.ok((LANGUAGES as string[]).includes(l), `'${slug}': idioma '${l}' não existe`)
    }
  }
})

test('nenhuma rota é gerada para combinação sem conteúdo escrito', () => {
  // `meta.languages` é intenção editorial; `content` é o que existe. Rota,
  // sitemap e hreflang têm de sair da interseção — declarar a intenção
  // apontaria hreflang para 404, e hreflang que não fecha faz o Google
  // descartar o bloco inteiro (§2.69).
  for (const { slug, lang } of atsRoutePairs()) {
    assert.ok(
      atsContentFor(slug, lang) != null,
      `rota /ats/${slug}?lang=${lang} seria gerada sem conteúdo`
    )
  }
})

test('idioma sem conteúdo devolve null em vez de recuar para português', () => {
  // Recuo silencioso para PT devolveria 200 numa página em idioma errado —
  // exatamente o defeito que o §2.49 tornou regra permanente.
  const semConteudo = (LANGUAGES as string[]).filter(
    (l) => !(availableAtsLanguages() as string[]).includes(l)
  )
  for (const lang of semConteudo) {
    for (const slug of ATS_SLUGS) {
      assert.equal(
        atsContentFor(slug, lang as never),
        null,
        `'${slug}' [${lang}]: deveria ser null, não recuo`
      )
    }
  }
})

test('conteúdo de cada ATS tem todos os campos preenchidos, sem string vazia', () => {
  const listas: (keyof AtsContent)[] = ['eliminationFactors', 'howGriffoWorkHelps']
  for (const { slug, lang } of atsRoutePairs()) {
    const c = atsContentFor(slug, lang)!
    for (const campo of ['marketName', 'description', 'marketShare'] as const) {
      assert.ok(c[campo].trim().length > 0, `'${slug}' [${lang}]: ${campo} vazio`)
    }
    for (const campo of listas) {
      const arr = c[campo] as string[]
      assert.ok(arr.length > 0, `'${slug}' [${lang}]: ${campo} vazio`)
      for (const item of arr) {
        assert.ok(item.trim().length > 0, `'${slug}' [${lang}]: item vazio em ${campo}`)
      }
    }
    assert.ok(c.howItWorks.length > 0, `'${slug}' [${lang}]: howItWorks vazio`)
    for (const s of c.howItWorks) {
      assert.ok(s.title.trim() && s.description.trim(), `'${slug}' [${lang}]: passo incompleto`)
    }
    assert.ok(c.faqs.length > 0, `'${slug}' [${lang}]: faqs vazio`)
    for (const f of c.faqs) {
      assert.ok(f.question.trim() && f.answer.trim(), `'${slug}' [${lang}]: FAQ incompleto`)
    }
  }
})

test('nenhum locale tem conteúdo órfão que nenhum meta declara', () => {
  // Conteúdo que existe mas nunca é servido é código morto que ninguém vê
  // envelhecer — e pior, dá a impressão de que a página existe naquele
  // idioma. `atsContentFor` filtra por `meta.languages`, então um órfão
  // jamais apareceria numa página nem quebraria um teste sem esta checagem.
  for (const lang of availableAtsLanguages()) {
    const declarados = new Set(atsSlugsForLanguage(lang))
    for (const slug of rawLocaleSlugs(lang)) {
      assert.ok(
        declarados.has(slug),
        `locale '${lang}' tem conteúdo para '${slug}', mas ATS_META não declara ` +
          `esse idioma — remova o conteúdo, ou acrescente '${lang}' em meta.languages`
      )
    }
  }
})

test('paridade: todo idioma com conteúdo tem os MESMOS ATS que declarou', () => {
  // Pega o caso de alguém adicionar `languages: [...,'de']` no meta e
  // esquecer de escrever o guia em `locales/de.ts` — a página sumiria do
  // sitemap em silêncio, sem nada falhar.
  for (const lang of availableAtsLanguages()) {
    const desejados = atsSlugsForLanguage(lang)
    const existentes = ATS_SLUGS.filter((s) => atsContentFor(s, lang) != null)
    assert.deepEqual(
      existentes.sort(),
      desejados.sort(),
      `idioma '${lang}': meta declara [${desejados.join(', ')}] mas o locale tem ` +
        `[${existentes.join(', ')}] — falta escrever o conteúdo, ou tirar o idioma do meta`
    )
  }
})
