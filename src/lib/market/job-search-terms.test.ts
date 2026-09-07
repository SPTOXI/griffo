import test from 'node:test'
import assert from 'node:assert/strict'
import { jobSearchKeywords, JOB_SEARCH_HASHTAGS } from './job-search-terms'
import { LANGUAGES, DICTIONARIES } from '../i18n'

test('todo idioma tem termo nativo de busca de emprego', () => {
  for (const lang of LANGUAGES) {
    const kw = jobSearchKeywords(lang)
    const nativos = kw.filter((k) => !(JOB_SEARCH_HASHTAGS as readonly string[]).includes(k))
    assert.ok(
      nativos.length > 0,
      `"${lang}" cairia no recuo em inglês — a página apareceria para quem ` +
        `busca em inglês e desapareceria para quem busca no próprio idioma, ` +
        `que é o defeito que o §2.79 pegou com "CV" vs "resume"`
    )
  }
})

test('a hashtag entra em inglês em TODO idioma, nunca traduzida', () => {
  // `#OpenToWork` é selo do LinkedIn e circula em inglês em todos os mercados;
  // o que muda de idioma é o rótulo descritivo. Mesmo padrão do §2.83 com
  // "ATS": sigla em inglês junto do termo nativo, nunca um dos dois sozinho.
  for (const lang of LANGUAGES) {
    const kw = jobSearchKeywords(lang)
    for (const h of JOB_SEARCH_HASHTAGS) {
      assert.ok(kw.includes(h), `"${lang}" perdeu a hashtag "${h}"`)
    }
  }
})

test('japonês usa 転職活動, não 就職活動', () => {
  // 就職活動/就活 é a caça a emprego de recém-formado, num calendário anual
  // fixo, onde a empresa avalia POTENCIAL. 転職活動 é mudança de carreira, com
  // timing próprio, onde a empresa procura 即戦力. O público é o segundo —
  // trocar miraria estudante.
  const kw = jobSearchKeywords('ja').join(' ')
  const corpo = DICTIONARIES.ja.hiringPage.searchBody + DICTIONARIES.ja.hiringPage.searchTitle
  assert.ok(kw.includes('転職'), 'japonês perdeu 転職')
  assert.ok(!kw.includes('就職活動'), 'keywords em japonês mirando recém-formado')
  assert.ok(!corpo.includes('就職活動'), 'texto em japonês mirando recém-formado')
})

test('chinês usa 求职, não 跳槽', () => {
  // 跳槽 carrega a conotação de sair antes de cumprir o contrato — palavra de
  // conversa, não de página institucional.
  const kw = jobSearchKeywords('zh').join(' ')
  assert.ok(kw.includes('求职'))
  assert.ok(!kw.includes('跳槽'))
})

test('o bloco visível existe nos 12 idiomas e cita a hashtag', () => {
  // O que de fato trabalha por estes termos é o texto visível: o Google ignora
  // a meta `keywords` desde 2009. Se o bloco sumir, as keywords sozinhas não
  // sustentam nada.
  for (const lang of LANGUAGES) {
    const p = DICTIONARIES[lang].hiringPage
    assert.ok(p.searchTitle.trim().length > 0, `searchTitle vazio em "${lang}"`)
    assert.ok(p.searchBody.trim().length > 0, `searchBody vazio em "${lang}"`)
    assert.ok(
      `${p.searchTitle}${p.searchBody}`.includes('OpenToWork'),
      `"${lang}" não cita #OpenToWork no texto visível — só nas keywords, que ` +
        `o Google ignora`
    )
  }
})

test('a página não promete vaga em nenhum idioma', () => {
  // A linha que o §2.84 traçou: `#hiring` é sinal de quem OFERECE vaga, e o
  // GriffoWork não oferece nenhuma. Atrair por esses termos não pode virar
  // insinuação de que aqui se encontra vaga.
  const PROIBIDO = [
    /vagas? (disponíve|abert)/i,
    /jobs? (available|openings)/i,
    /ofertas de empleo disponibles/i,
    /offene stellen/i,
  ]
  for (const lang of LANGUAGES) {
    const p = DICTIONARIES[lang].hiringPage
    const texto = `${p.searchTitle} ${p.searchBody}`
    for (const re of PROIBIDO) {
      assert.ok(!re.test(texto), `"${lang}" promete vaga: ${re}`)
    }
  }
})
