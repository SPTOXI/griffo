import test from 'node:test'
import assert from 'node:assert/strict'
import { createFakeDb, withFakeDb } from '../testing/fake-prisma'
import { clearProviderConfigCache } from './registry'
import { executeAiTask } from './router'

/**
 * Failover do roteador de IA — o outro caminho onde o erro não aparece como erro.
 *
 * A seção 10.7 do documento de continuidade trata os três números do roteador
 * (orçamento, teto por tentativa, número de tentativas) como um sistema. A
 * auditoria registra duas falhas reais dessa mecânica que ficaram VERDES por
 * semanas, porque nada quebrava na tela:
 *
 * - a cadeia de suplentes inteira virou decorativa quando o primário consumia o
 *   orçamento e o resto era descartado com "orçamento esgotado" (§ do laço de
 *   chamada, corrigido com a reserva de sobrecarga);
 * - o Kimi como primeiro suplente do Claude falhou 46 de 46 vezes em 30 dias
 *   sem que nada além do log soubesse.
 *
 * Estes testes exercitam `executeAiTask` de verdade. Duas substituições, as
 * duas fora do código de produção:
 *
 * - `globalThis.prisma` recebe o banco falso (mesmo ponto do hot reload);
 * - `globalThis.fetch` recebe um dublê. Ele cobre OS DOIS caminhos do roteador:
 *   o Claude, que chama `fetch` direto, e os provedores compatíveis com OpenAI,
 *   cujo SDK também usa o `fetch` global.
 *
 * Todas as requisições levam `internal: true` para não sortear o juiz de
 * qualidade (`shouldJudge` usa `Math.random`) — teste que depende de sorteio
 * não é teste.
 *
 * O que NÃO está coberto aqui, e é honesto dizer: o corte por orçamento de
 * tempo. Exercitá-lo exigiria esperar dezenas de segundos de verdade, e um
 * teste que dorme 25s não sobrevive a nenhum CI. Ele continua verificado só
 * pelo comportamento em produção.
 */

const CHAVES = {
  ANTHROPIC_API_KEY: 'sk-teste-claude',
  DEEPSEEK_API_KEY: 'sk-teste-deepseek',
  GEMINI_API_KEY: 'sk-teste-gemini',
  MOONSHOT_API_KEY: 'sk-teste-kimi',
}

/**
 * Resposta boa o bastante para o Agente de Qualidade.
 *
 * Ele reprova por dois motivos independentes, e os dois foram descobertos
 * escrevendo estes testes: menos de 50 caracteres, e — em `analysis_segment` —
 * qualquer coisa que não seja JSON válido. Um dublê de resposta que não passa por
 * essa porta testaria o failover errado: o roteador cairia para o suplente por
 * "qualidade", não pelo motivo que o teste quer exercitar.
 */
const TEXTO_OK = JSON.stringify({
  dimensions: [
    { name: 'Clareza', score: 8, justificativa: 'Trecho suficientemente longo para o agente aprovar.' },
  ],
})

const respostaClaude = (texto = TEXTO_OK) =>
  new Response(
    JSON.stringify({
      content: [{ type: 'text', text: texto }],
      usage: { input_tokens: 1000, output_tokens: 200 },
      stop_reason: 'end_turn',
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )

const respostaOpenAiCompat = (texto = TEXTO_OK) =>
  new Response(
    JSON.stringify({
      id: 'chatcmpl-teste',
      object: 'chat.completion',
      created: 0,
      model: 'modelo-teste',
      choices: [{ index: 0, message: { role: 'assistant', content: texto }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1000, completion_tokens: 200 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )

const erro = (status: number, mensagem: string) =>
  new Response(JSON.stringify({ error: { message: mensagem } }), {
    status,
    headers: { 'content-type': 'application/json' },
  })

/** Para qual provedor cada chamada foi, na ordem — é a asserção central destes testes. */
function provedorDaUrl(url: string): string {
  if (url.includes('anthropic.com')) return 'claude'
  if (url.includes('deepseek.com')) return 'deepseek'
  if (url.includes('moonshot')) return 'kimi'
  if (url.includes('googleapis.com') || url.includes('generativelanguage')) return 'gemini'
  return `desconhecido(${url})`
}

interface Cenario {
  destinos: string[]
  corpos: string[]
}

/**
 * Monta o ambiente: banco falso, chaves nas variáveis de ambiente, `fetch`
 * dublê, cache de configuração de provedores limpo (o TTL é de 30s e vazaria
 * de um teste para o outro). Restaura tudo no fim, mesmo se o teste lançar.
 */
async function comRoteador(
  responder: (provedor: string, chamada: number, body: string) => Response,
  fn: (cenario: Cenario, fake: ReturnType<typeof createFakeDb>) => Promise<void>,
  opts: { semChaveDe?: string[] } = {}
) {
  const fake = createFakeDb({ users: [{ id: 'u1', analysisBalance: 0 }] })
  const cenario: Cenario = { destinos: [], corpos: [] }
  const fetchOriginal = globalThis.fetch
  const envAnterior: Record<string, string | undefined> = {}

  for (const [nome, valor] of Object.entries(CHAVES)) {
    envAnterior[nome] = process.env[nome]
    if (opts.semChaveDe?.includes(nome)) delete process.env[nome]
    else process.env[nome] = valor
  }

  clearProviderConfigCache()
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input)
    const provedor = provedorDaUrl(url)
    cenario.destinos.push(provedor)
    cenario.corpos.push(typeof init?.body === 'string' ? init.body : '')
    return responder(provedor, cenario.destinos.length, cenario.corpos.at(-1) ?? '')
  }) as any

  try {
    await withFakeDb(fake, () => fn(cenario, fake))
  } finally {
    globalThis.fetch = fetchOriginal
    for (const [nome, valor] of Object.entries(envAnterior)) {
      if (valor === undefined) delete process.env[nome]
      else process.env[nome] = valor
    }
    clearProviderConfigCache()
  }
}

const tarefa = (patch: Record<string, any> = {}) => ({
  taskType: 'analysis_segment' as const,
  systemPrompt: 'Você avalia currículos.',
  userPrompt: 'Avalie este trecho.',
  userId: 'u1',
  internal: true,
  ...patch,
})

// ------------------------------------------------------- caminho normal ---

test('primário respondendo: nenhum suplente é chamado', async () => {
  await comRoteador(
    () => respostaClaude(),
    async (cenario, fake) => {
      const res = await executeAiTask(tarefa())

      assert.equal(res.usedProvider, 'claude')
      assert.equal(res.status, 'success')
      assert.equal(res.failoverCount, 0)
      assert.deepEqual(cenario.destinos, ['claude'], 'um provedor, uma chamada')
      assert.equal(fake.state.aiLogs.length, 1)
      assert.equal(fake.state.aiLogs[0].status, 'success')
      assert.equal(
        fake.state.auditLogs.length,
        0,
        'sucesso no primário não gera trilha de failover'
      )
    }
  )
})

// ------------------------------------------------------------- failover ---

test('primário fora do ar cai para o suplente e entrega a resposta', async () => {
  await comRoteador(
    (provedor) => (provedor === 'claude' ? erro(500, 'Internal server error') : respostaOpenAiCompat()),
    async (cenario, fake) => {
      const res = await executeAiTask(tarefa())

      assert.equal(res.usedProvider, 'deepseek', 'DeepSeek é o primeiro suplente do Claude (§2.34)')
      assert.equal(res.status, 'failover')
      assert.equal(res.failoverCount, 1)
      assert.deepEqual(cenario.destinos, ['claude', 'deepseek'])

      // Failover não pode ser silencioso: quem paga a conta precisa conseguir
      // ver que o primário está caindo, sem depender de log de aplicação.
      assert.equal(fake.state.auditLogs.length, 1)
      assert.equal(fake.state.auditLogs[0].action, 'failover')
      const meta = JSON.parse(fake.state.auditLogs[0].meta)
      assert.equal(meta.primaryProvider, 'claude')
      assert.equal(meta.usedProvider, 'deepseek')
      assert.match(meta.attemptDiagnostics.join(' '), /CLAUDE/)
    }
  )
})

test('o AiLog do failover guarda o primário pretendido e o que de fato respondeu', async () => {
  // Sem os dois campos o painel não consegue distinguir "o Claude está caindo"
  // de "esta tarefa sempre rodou no DeepSeek".
  await comRoteador(
    (provedor) => (provedor === 'claude' ? erro(503, 'Overloaded') : respostaOpenAiCompat()),
    async (_cenario, fake) => {
      await executeAiTask(tarefa())
      const log = fake.state.aiLogs[0]
      assert.equal(log.provider, 'deepseek')
      assert.equal(log.primaryModel, 'claude-sonnet-5-5')
      assert.equal(log.usedModel, 'deepseek-flash')
      assert.equal(log.failoverCount, 1)
      assert.equal(log.status, 'failover')
    }
  )
})

test('resposta reprovada pelo agente de qualidade também dispara o suplente', async () => {
  // Um provedor que responde 200 com lixo é pior que um que falha: sem esta
  // porta, o lixo seguiria para o usuário como se fosse laudo.
  await comRoteador(
    (provedor) => (provedor === 'claude' ? respostaClaude('ok') : respostaOpenAiCompat()),
    async (cenario, fake) => {
      const res = await executeAiTask(tarefa())
      assert.equal(res.usedProvider, 'deepseek')
      assert.deepEqual(cenario.destinos, ['claude', 'deepseek'])
      const meta = JSON.parse(fake.state.auditLogs[0].meta)
      assert.match(meta.attemptDiagnostics.join(' '), /Qualidade insuficiente|Agente de Qualidade/i)
    }
  )
})

test('resposta truncada em max_tokens é falha, não conteúdo parcial', async () => {
  // Truncamento produz JSON que não fecha. Aceitar isso como resposta manda
  // procurar defeito no prompt em vez de no orçamento de saída.
  await comRoteador(
    (provedor) =>
      provedor === 'claude'
        ? new Response(
            JSON.stringify({
              content: [{ type: 'text', text: TEXTO_OK }],
              usage: { input_tokens: 10, output_tokens: 3500 },
              stop_reason: 'max_tokens',
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        : respostaOpenAiCompat(),
    async (cenario, fake) => {
      const res = await executeAiTask(tarefa())
      assert.equal(res.usedProvider, 'deepseek')
      assert.deepEqual(cenario.destinos, ['claude', 'deepseek'])
      const meta = JSON.parse(fake.state.auditLogs[0].meta)
      assert.match(meta.attemptDiagnostics.join(' '), /truncada/i)
    }
  )
})

test('provedor sem chave é pulado sem consumir tentativa de rede', async () => {
  await comRoteador(
    (provedor) => (provedor === 'claude' ? erro(500, 'Internal server error') : respostaOpenAiCompat()),
    async (cenario) => {
      await assert.rejects(() => executeAiTask(tarefa()), /Falha ao processar com as IAs ativas/)
      assert.deepEqual(cenario.destinos, ['claude'], 'sem chave, o DeepSeek nem é chamado')
    },
    { semChaveDe: ['DEEPSEEK_API_KEY'] }
  )
})

// ------------------------------------------------- todos os provedores ---

test('quando todos falham, o erro do usuário não vaza detalhe de provedor', async () => {
  await comRoteador(
    () => erro(500, 'Internal server error'),
    async (cenario, fake) => {
      await assert.rejects(
        () => executeAiTask(tarefa()),
        (err: any) => {
          assert.equal(err.message, 'Falha ao processar com as IAs ativas.')
          // O diagnóstico técnico existe, mas separado da mensagem: é o que a
          // seção 10.9 exige — o que vai para a tela é ESCRITO, nunca o erro cru.
          assert.match(err.diagnostic, /CLAUDE/)
          assert.match(err.diagnostic, /DEEPSEEK/)
          assert.equal(err.attemptDiagnostics.length, 2)
          return true
        }
      )
      assert.deepEqual(cenario.destinos, ['claude', 'deepseek'])
      assert.equal(fake.state.aiLogs[0].usedModel, 'ALL_PROVIDERS_FAILED')
      assert.equal(fake.state.aiLogs[0].status, 'error')
      assert.equal(fake.state.auditLogs[0].action, 'ai_error')
    }
  )
})

test('falha total ainda registra a tarefa — a rodada não some do painel', async () => {
  await comRoteador(
    () => erro(429, 'Rate limited'),
    async (_cenario, fake) => {
      await assert.rejects(() => executeAiTask(tarefa({ taskType: 'rewrite' })))
      assert.equal(fake.state.aiLogs.length, 1)
      assert.equal(fake.state.aiLogs[0].taskType, 'rewrite')
      assert.equal(fake.state.aiLogs[0].costUsd, 0)
      assert.ok(fake.state.aiLogs[0].errorMessage, 'com o diagnóstico por provedor junto')
    }
  )
})

// ------------------------------------------------- residência de dados ---

test('usuário na UE nunca cai para provedor da China, mesmo com o primário fora', async () => {
  // Não é preferência técnica: DeepSeek e Kimi processam na China, que não tem
  // decisão de adequação da UE. O suplente do europeu é o Gemini — e o teste
  // prova pelo DESTINO das chamadas, não pela intenção do código.
  await comRoteador(
    (provedor) => (provedor === 'claude' ? erro(500, 'Internal server error') : respostaOpenAiCompat()),
    async (cenario, fake) => {
      const res = await executeAiTask(tarefa({ userCountry: 'PT' }))

      assert.equal(res.usedProvider, 'gemini')
      assert.deepEqual(cenario.destinos, ['claude', 'gemini'])
      assert.ok(!cenario.destinos.includes('deepseek'), 'DeepSeek fora para residente na UE')
      assert.ok(!cenario.destinos.includes('kimi'), 'Kimi fora para residente na UE')
      assert.equal(fake.state.aiLogs[0].provider, 'gemini')
    }
  )
})

test('fora da UE o suplente continua sendo o mais barato da cadeia', async () => {
  await comRoteador(
    (provedor) => (provedor === 'claude' ? erro(500, 'Internal server error') : respostaOpenAiCompat()),
    async (cenario) => {
      const res = await executeAiTask(tarefa({ userCountry: 'BR' }))
      assert.equal(res.usedProvider, 'deepseek')
      assert.deepEqual(cenario.destinos, ['claude', 'deepseek'])
    }
  )
})

// ------------------------------------------------------ PDF e cache -------

test('PDF anexado desvia para o Claude mesmo numa tarefa roteada para outro provedor', async () => {
  // `profile_extraction` roda no DeepSeek por decisão de custo — mas um PDF
  // enviado ao endpoint compatível com OpenAI seria descartado em silêncio, e o
  // modelo responderia sobre um prompt SEM o anexo. A escolha da tarefa aqui é
  // deliberada: com uma tarefa que já vai para o Claude, este teste passaria
  // mesmo com o desvio removido do roteador — foi o que uma mutação mostrou.
  await comRoteador(
    () => respostaClaude(),
    async (cenario) => {
      const res = await executeAiTask(tarefa({ taskType: 'profile_extraction', pdfBase64: 'JVBERi0xLjQK' }))
      assert.equal(res.usedProvider, 'claude')
      assert.deepEqual(cenario.destinos, ['claude'])
      // O primário REGISTRADO também muda, e não é detalhe de log: sem isto o
      // AiLog diria que a tarefa pretendia o DeepSeek e "caiu" para o Claude,
      // inventando um failover que nunca houve. Segunda mutação necessária para
      // fechar este teste — a asserção de destino sozinha não pegava.
      assert.equal(res.primaryModel, 'claude-sonnet-5-5')
    }
  )
})

test('com documento anexado não existe suplente — falhar é melhor que responder sem ler', async () => {
  await comRoteador(
    () => erro(500, 'Internal server error'),
    async (cenario) => {
      await assert.rejects(() => executeAiTask(tarefa({ pdfBase64: 'JVBERi0xLjQK' })))
      assert.deepEqual(cenario.destinos, ['claude'], 'nenhum suplente é tentado com documento anexado')
    }
  )
})

test('cache de prompt recusado com 400 é repetido sem cache, no mesmo provedor', async () => {
  // O cache é otimização de custo. Derrubar a análise inteira porque a conta
  // não aceita o bloco de cache seria trocar centavos por um laudo.
  await comRoteador(
    (provedor, chamada) => {
      if (provedor !== 'claude') return respostaOpenAiCompat()
      return chamada === 1 ? erro(400, 'cache_control not supported') : respostaClaude()
    },
    async (cenario) => {
      const res = await executeAiTask(tarefa({ cacheableContext: 'Currículo completo do candidato.' }))

      assert.equal(res.usedProvider, 'claude')
      assert.equal(res.failoverCount, 0, 'repetir sem cache não conta como failover')
      assert.deepEqual(cenario.destinos, ['claude', 'claude'])
      assert.match(cenario.corpos[0], /cache_control/, 'a primeira tentativa pede cache')
      assert.ok(!cenario.corpos[1].includes('cache_control'), 'a segunda não')
    }
  )
})
