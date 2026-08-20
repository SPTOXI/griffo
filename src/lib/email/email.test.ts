import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDigest, digestLanguage, escapeHtml, firstNameOf, type DigestOpportunity } from './digest'
import { listUnsubscribeHeaders, sendEmail, EmailSendError, type ResendConfig } from './send'
import { unsubscribeToken, userIdFromToken } from './unsubscribe'
import type { Language } from '../i18n'

/**
 * Os testes do e-mail do digest.
 *
 * O nome de cada teste é a regra que ele defende. O que está em jogo aqui não é
 * layout: é conteúdo que sai do produto e vai para a caixa de outra pessoa, sem
 * ninguém revisando antes.
 */

const SECRET = 'segredo-de-teste-nao-usar-em-producao'

const RESEND: ResendConfig = {
  apiKey: 'chave-de-teste',
  from: 'GriffoWork <radar@send.griffo.work>',
  replyTo: 'contato@griffo.work',
}

const OPPORTUNITY: DigestOpportunity = {
  title: 'Analista de Dados Pleno',
  company: 'Empresa Exemplo',
  location: 'São Paulo, BR',
  overallFit: 'good',
  headline: 'Compatível com a sua experiência em análise de dados.',
  url: 'https://exemplo.com/vaga/1',
}

function digest(overrides: Partial<Parameters<typeof buildDigest>[0]> = {}) {
  return buildDigest({
    lang: 'pt',
    firstName: 'Silvio',
    opportunities: [OPPORTUNITY],
    radarUrl: 'https://griffo.work/?view=radar',
    unsubscribeUrl: 'https://griffo.work/api/radar/unsubscribe?t=abc',
    ...overrides,
  })
}

// --- O que a mensagem não pode fazer ---

test('a mensagem nunca mostra nota, porcentagem ou sinal interno', () => {
  // §43 e §17. A compatibilidade do produto tem três eixos; qualquer número
  // único aqui seria uma invenção, e `signalScore` é ordenação interna.
  const { html, text, subject } = digest()
  for (const [nome, conteudo] of Object.entries({ html, text, subject })) {
    assert.doesNotMatch(conteudo, /\d+\s*%/, `${nome} exibe uma porcentagem de compatibilidade`)
    assert.doesNotMatch(conteudo, /signalScore/i, `${nome} vaza o sinal interno de ordenação`)
  }
})

test('vaga sem local declarado não ganha local inventado', () => {
  // §43: campo ausente é campo ausente. "Remoto" ou "não informado" com cara de
  // dado preenchido é exatamente o que essa regra proíbe.
  const semLocal = digest({ opportunities: [{ ...OPPORTUNITY, location: null }] })
  assert.doesNotMatch(semLocal.html, /São Paulo/)
  assert.doesNotMatch(semLocal.text, /não informado|Remoto|remote/i)

  const comLocal = digest()
  assert.match(comLocal.html, /São Paulo, BR/)
})

test('local em branco tem o mesmo tratamento de local ausente', () => {
  const conteudo = digest({ opportunities: [{ ...OPPORTUNITY, location: '   ' }] })
  // Espaço em branco não é um local. Sem o `trim`, saía uma linha vazia com
  // aparência de campo que ficou faltando carregar.
  assert.doesNotMatch(conteudo.html, /margin-top:2px">\s*<\/div>/)
})

test('a mensagem não promete contratação', () => {
  const { html, text } = digest()
  for (const conteudo of [html, text]) {
    assert.doesNotMatch(conteudo, /vaga certa|garantid|você vai ser contratad|contratação certa/i)
  }
})

// --- Segurança do conteúdo externo ---

test('título e empresa vindos da fonte são escapados', () => {
  // Título e empresa vêm de Greenhouse, Lever, Gupy e Adzuna — texto que
  // ninguém aqui escreveu. Interpolado cru, quebra o corpo do e-mail no melhor
  // caso e injeta marcação no pior.
  const malicioso: DigestOpportunity = {
    ...OPPORTUNITY,
    title: '<script>alert(1)</script>',
    company: 'Acme " onmouseover="x',
  }
  const { html } = digest({ opportunities: [malicioso] })

  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
  assert.doesNotMatch(html, /onmouseover="x/)
})

test('escapeHtml cobre os cinco caracteres que importam', () => {
  assert.equal(escapeHtml(`<&>"'`), '&lt;&amp;&gt;&quot;&#39;')
})

test('o & é escapado antes dos demais, sem escapar duas vezes', () => {
  // Ordem errada transforma `<` em `&amp;lt;` e o leitor vê a entidade crua.
  assert.equal(escapeHtml('a<b'), 'a&lt;b')
})

// --- Descadastro ---

test('todo digest carrega o link de descadastro nas duas versões', () => {
  // Obrigação legal (LGPD Art. 18, GDPR Art. 21) e, na prática, o que evita que
  // a saída seja feita pelo botão de spam.
  const { html, text } = digest()
  assert.match(html, /api\/radar\/unsubscribe/)
  assert.match(text, /api\/radar\/unsubscribe/)
})

test('o token de descadastro identifica quem o recebeu', () => {
  const token = unsubscribeToken('user-123', SECRET)
  assert.equal(userIdFromToken(token, SECRET), 'user-123')
})

test('token adulterado não descadastra ninguém', () => {
  // Sem assinatura, trocar o id na URL desligaria o Radar de qualquer pessoa.
  const token = unsubscribeToken('user-123', SECRET)
  const outro = unsubscribeToken('user-456', SECRET)

  const corpoTrocado = `${outro.split('.')[0]}.${token.split('.')[1]}`
  assert.equal(userIdFromToken(corpoTrocado, SECRET), null)

  assert.equal(userIdFromToken(`${token}x`, SECRET), null)
  assert.equal(userIdFromToken(token.split('.')[0], SECRET), null)
})

test('entrada inválida devolve null em vez de lançar', () => {
  // Esta função atende uma rota pública: uma exceção aqui vira 500 para quem
  // só queria sair da lista.
  for (const entrada of [null, undefined, '', '.', 'abc', 'a.b', '....']) {
    assert.equal(userIdFromToken(entrada as any, SECRET), null, `entrada ${JSON.stringify(entrada)} lançou ou passou`)
  }
})

test('os cabeçalhos de descadastro habilitam o botão nativo do cliente', () => {
  const headers = listUnsubscribeHeaders('https://griffo.work/api/radar/unsubscribe?t=abc')
  assert.equal(headers['List-Unsubscribe'], '<https://griffo.work/api/radar/unsubscribe?t=abc>')
  assert.equal(headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click')
})

// --- Idioma ---

test('o idioma do e-mail sai do perfil, e o desconhecido cai no português', () => {
  assert.equal(digestLanguage('en'), 'en')
  assert.equal(digestLanguage('pt-BR'), 'pt')
  assert.equal(digestLanguage('es_AR'), 'es')
  // Nem null, nem idioma que o produto não fala, viram um idioma "parecido".
  assert.equal(digestLanguage(null), 'pt')
  assert.equal(digestLanguage('fr'), 'pt')
  assert.equal(digestLanguage(''), 'pt')
})

test('cada idioma produz um assunto próprio', () => {
  const idiomas: Language[] = ['pt', 'en', 'es']
  const assuntos = idiomas.map((lang) => digest({ lang }).subject)
  assert.equal(new Set(assuntos).size, idiomas.length, 'dois idiomas compartilham o mesmo assunto')
})

test('o assunto concorda com a quantidade de oportunidades', () => {
  // "1 oportunidades" é o tipo de detalhe que faz a mensagem parecer automática
  // — e mensagem que parece automática é lida como spam.
  const uma = digest().subject
  assert.match(uma, /uma oportunidade|^O Radar encontrou uma/i)

  const duas = digest({ opportunities: [OPPORTUNITY, OPPORTUNITY] }).subject
  assert.match(duas, /2 oportunidades/)
})

test('sem nome no cadastro o cumprimento não inventa um', () => {
  assert.equal(firstNameOf(null), null)
  assert.equal(firstNameOf('   '), null)
  assert.equal(firstNameOf('Silvio Luis Morais'), 'Silvio')

  const semNome = digest({ firstName: null })
  assert.match(semNome.html, /Olá\./)
  assert.doesNotMatch(semNome.html, /Olá, \./)
})

// --- As duas versões do corpo ---

test('toda mensagem tem versão em texto, e ela contém as mesmas vagas', () => {
  // Cliente que não renderiza HTML mostra o texto, e mensagem só-HTML pontua
  // pior nos filtros de spam.
  const { text, html } = digest({ opportunities: [OPPORTUNITY, { ...OPPORTUNITY, title: 'Cientista de Dados' }] })

  for (const titulo of ['Analista de Dados Pleno', 'Cientista de Dados']) {
    assert.ok(text.includes(titulo), `versão em texto sem a vaga "${titulo}"`)
    assert.ok(html.includes(titulo), `versão em HTML sem a vaga "${titulo}"`)
  }
})

test('cada vaga leva o próprio link', () => {
  const { html } = digest({
    opportunities: [OPPORTUNITY, { ...OPPORTUNITY, url: 'https://exemplo.com/vaga/2' }],
  })
  assert.match(html, /https:\/\/exemplo\.com\/vaga\/1/)
  assert.match(html, /https:\/\/exemplo\.com\/vaga\/2/)
})

// --- O transporte ---

test('o envio monta a requisição que o Resend espera', async () => {
  let capturado: { url: string; init: RequestInit } | null = null
  const fakeFetch = (async (url: any, init: any) => {
    capturado = { url: String(url), init }
    return new Response(JSON.stringify({ id: 'email-1' }), { status: 200 })
  }) as unknown as typeof globalThis.fetch

  const resultado = await sendEmail(
    { to: 'pessoa@exemplo.com', subject: 'Assunto', html: '<p>oi</p>', text: 'oi' },
    RESEND,
    { fetch: fakeFetch }
  )

  assert.equal(resultado.id, 'email-1')
  assert.equal(capturado!.url, 'https://api.resend.com/emails')
  assert.equal((capturado!.init.headers as any).Authorization, 'Bearer chave-de-teste')

  const corpo = JSON.parse(capturado!.init.body as string)
  assert.deepEqual(corpo.to, ['pessoa@exemplo.com'])
  // O `Reply-To` existe porque `send.griffo.work` só envia: sem ele, quem
  // responder fala com o vazio e aprende a ignorar as próximas mensagens.
  assert.equal(corpo.reply_to, 'contato@griffo.work')
  // Texto E html: a versão em texto não é opcional.
  assert.equal(corpo.text, 'oi')
  assert.equal(corpo.html, '<p>oi</p>')
})

test('recusa do Resend vira erro com o motivo, e o motivo fica no log', async () => {
  const fakeFetch = (async () =>
    new Response('{"message":"domain is not verified"}', {
      status: 403,
    })) as unknown as typeof globalThis.fetch

  await assert.rejects(
    () => sendEmail({ to: 'a@b.com', subject: 's', html: 'h', text: 't' }, RESEND, { fetch: fakeFetch }),
    (e: unknown) => {
      assert.ok(e instanceof EmailSendError)
      assert.equal((e as EmailSendError).status, 403)
      // O corpo do erro é o que distingue "chave errada" de "domínio não
      // verificado". Perdê-lo transforma configuração errada em investigação.
      assert.match((e as EmailSendError).message, /domain is not verified/)
      return true
    }
  )
})

test('rede indisponível também vira EmailSendError, e não exceção solta', async () => {
  const fakeFetch = (async () => {
    throw new Error('getaddrinfo ENOTFOUND api.resend.com')
  }) as unknown as typeof globalThis.fetch

  await assert.rejects(
    () => sendEmail({ to: 'a@b.com', subject: 's', html: 'h', text: 't' }, RESEND, { fetch: fakeFetch }),
    (e: unknown) => e instanceof EmailSendError
  )
})
