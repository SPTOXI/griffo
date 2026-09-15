import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MASS_DISAPPEARANCE_MIN_JOBS,
  decideCollection,
  sourceStateAfter,
} from './collection'
import { canonicalUrl, dedupeBatch, dedupeKeyFor, looksLikeSameJob, withDedupeKey } from './dedup'
import { absenceReason, companyKeyOf, normalizeJob, normalizeRemoteType, normalizeSalaryPeriod } from './normalize'
import { JobNormalizationError, type NormalizedJob, type RawJob } from './types'

const opts = { sourceSlug: 'greenhouse' }

const rawJob = (patch: Partial<RawJob> = {}): RawJob => ({
  company: 'Griffo Tecnologia Ltda',
  title: 'Analista de Dados',
  applicationUrl: 'https://exemplo.com/vagas/1',
  ...patch,
})

/* ================================================================== *
 * §12 — A REGRA CRÍTICA
 *
 * "NUNCA marcar vagas como encerradas simplesmente porque uma coleta
 * retornou zero resultados."
 *
 * O erro aqui é assimétrico: fechar uma vaga aberta tira do usuário uma
 * oportunidade real e é invisível depois. Estes testes são a proteção.
 * ================================================================== */

test('§12: coleta vazia com HTTP 200 NÃO fecha vagas', () => {
  const decision = decideCollection({
    outcome: 'complete',
    seenKeys: [],
    previouslyOpenKeys: ['a', 'b', 'c'],
  })

  assert.deepEqual(decision.keysToClose, [], 'FECHOU VAGAS COM COLETA VAZIA — o defeito que o §12 proíbe')
  assert.equal(decision.status, 'empty_unexpected')
  assert.equal(decision.reliable, false)
})

test('§12: coleta que falhou não fecha nada', () => {
  const decision = decideCollection({
    outcome: 'failed',
    seenKeys: [],
    previouslyOpenKeys: ['a', 'b'],
    error: 'ETIMEDOUT',
  })

  assert.deepEqual(decision.keysToClose, [])
  assert.equal(decision.status, 'error')
  assert.equal(decision.reliable, false)
  assert.match(decision.explanation, /não é evidência de encerramento/)
})

test('§12: coleta parcial não usa ausência como critério', () => {
  // O que faltou pode estar exatamente na página que não veio.
  const decision = decideCollection({
    outcome: 'partial',
    seenKeys: ['a'],
    previouslyOpenKeys: ['a', 'b', 'c'],
  })

  assert.deepEqual(decision.keysToClose, [])
  assert.equal(decision.status, 'partial')
  assert.equal(decision.reliable, false)
})

test('§12: desaparecimento em massa suspende o encerramento', () => {
  // 8 abertas, 7 sumiram de uma vez: paginação truncada é mais provável que
  // sete encerramentos simultâneos.
  const previouslyOpenKeys = Array.from({ length: MASS_DISAPPEARANCE_MIN_JOBS }, (_, i) => `k${i}`)
  const decision = decideCollection({
    outcome: 'complete',
    seenKeys: ['k0'],
    previouslyOpenKeys,
  })

  assert.deepEqual(decision.keysToClose, [])
  assert.equal(decision.status, 'empty_unexpected')
  assert.match(decision.explanation, /massa/)
})

test('§12: fonte pequena não é afetada pelo limite de proporção', () => {
  // 2 abertas, 1 sumiu = 50%, mas com esse volume a proporção não diz nada.
  const decision = decideCollection({
    outcome: 'complete',
    seenKeys: ['a'],
    previouslyOpenKeys: ['a', 'b'],
  })

  assert.deepEqual(decision.keysToClose, ['b'])
  assert.equal(decision.status, 'ok')
})

test('§12: coleta confiável encerra o que sumiu', () => {
  // O caso legítimo: coleta completa, com resultados, perda pequena.
  const previouslyOpenKeys = Array.from({ length: 10 }, (_, i) => `k${i}`)
  const decision = decideCollection({
    outcome: 'complete',
    seenKeys: previouslyOpenKeys.slice(0, 9),
    previouslyOpenKeys,
  })

  assert.deepEqual(decision.keysToClose, ['k9'])
  assert.equal(decision.closeReason, 'absent_from_reliable_collection')
  assert.equal(decision.reliable, true)
})

test('§12: encerramento declarado pela fonte vale mesmo em coleta suspeita', () => {
  // A fonte dizer "esta vaga acabou" é a evidência mais forte que existe, e não
  // depende de a coleta ter vindo inteira.
  const decision = decideCollection({
    outcome: 'complete',
    seenKeys: [],
    previouslyOpenKeys: ['a', 'b'],
    reportedClosedKeys: ['a'],
  })

  assert.deepEqual(decision.keysToClose, ['a'])
  assert.equal(decision.closeReason, 'source_reported')
  // Continua não confiável: só 'a' fechou, e por declaração, não por ausência.
  assert.equal(decision.reliable, false)
})

test('§12: fonte não pode encerrar vaga que não estava aberta', () => {
  const decision = decideCollection({
    outcome: 'complete',
    seenKeys: ['x'],
    previouslyOpenKeys: [],
    reportedClosedKeys: ['fantasma'],
  })
  assert.deepEqual(decision.keysToClose, [])
})

test('§12: fonte vazia sem nada aberto antes é normal', () => {
  const decision = decideCollection({ outcome: 'complete', seenKeys: [], previouslyOpenKeys: [] })
  assert.equal(decision.status, 'ok')
  assert.equal(decision.reliable, true)
  assert.deepEqual(decision.keysToClose, [])
})

test('§12: só coleta confiável avança lastSuccessfulCollection', () => {
  const now = new Date('2026-08-17T12:00:00Z')

  const suspeita = sourceStateAfter(
    decideCollection({ outcome: 'complete', seenKeys: [], previouslyOpenKeys: ['a'] }),
    { consecutiveFailures: 2 },
    now
  )
  assert.equal(suspeita.lastSuccessfulCollection, undefined, 'coleta suspeita não pode contar como sucesso')
  assert.equal(suspeita.consecutiveFailures, 3)
  assert.ok(suspeita.collectionError)

  const boa = sourceStateAfter(
    decideCollection({ outcome: 'complete', seenKeys: ['a'], previouslyOpenKeys: ['a'] }),
    { consecutiveFailures: 3 },
    now
  )
  assert.equal(boa.lastSuccessfulCollection?.getTime(), now.getTime())
  assert.equal(boa.consecutiveFailures, 0)
  assert.equal(boa.collectionError, null)
})

test('coleta parcial com vaga real não conta como falha de saúde da fonte', () => {
  // O caso da Adzuna: fonte grande, estoura o teto de páginas TODA rodada,
  // por desenho — não é a fonte falhando. Antes deste teste, `partial`
  // incrementava `consecutiveFailures` e nunca avançava
  // `lastSuccessfulCollection`, fazendo uma fonte que traz vaga real a cada
  // coleta aparecer no painel como "nunca teve sucesso".
  const now = new Date('2026-08-24T12:00:00Z')

  const decision = decideCollection({
    outcome: 'partial',
    seenKeys: ['a', 'b', 'c'],
    previouslyOpenKeys: ['a'],
  })
  assert.equal(decision.reliable, false, 'parcial continua não autorizando encerramento por ausência')
  assert.equal(decision.healthy, true, 'mas trouxe vaga real — a fonte está funcionando')

  const state = sourceStateAfter(decision, { consecutiveFailures: 8 }, now)
  assert.equal(state.consecutiveFailures, 0)
  assert.equal(state.lastSuccessfulCollection?.getTime(), now.getTime())
  // O texto informativo continua aparecendo — só o contador de saúde que muda.
  assert.ok(state.collectionError)
})

test('coleta parcial SEM nenhuma vaga não é saudável', () => {
  // Diferente do caso acima: parcial com zero resultado nenhum não é "fonte
  // grande demais para uma rodada", é mais parecido com falha no meio do
  // caminho — continua contando contra a saúde da fonte.
  const decision = decideCollection({ outcome: 'partial', seenKeys: [], previouslyOpenKeys: [] })
  assert.equal(decision.healthy, false)
})

/* ================================================================== *
 * §13 — Normalização
 * ================================================================== */

test('vaga sem o mínimo é recusada, não gravada pela metade', () => {
  // Uma vaga sem URL não é uma vaga com um campo faltando: é uma vaga em que
  // ninguém consegue se candidatar.
  assert.throws(() => normalizeJob(rawJob({ company: null }), opts), JobNormalizationError)
  assert.throws(() => normalizeJob(rawJob({ title: '  ' }), opts), JobNormalizationError)
  assert.throws(() => normalizeJob(rawJob({ applicationUrl: null }), opts), JobNormalizationError)
})

test('ausência é registrada com motivo, não colapsada em null', () => {
  const job = normalizeJob(rawJob(), opts)
  assert.equal(absenceReason(job, 'salary'), 'unknown')
  assert.equal(absenceReason(job, 'country'), 'unknown')
  assert.equal(job.salaryMin, null)
})

test('"não divulgado" é distinto de "desconhecido"', () => {
  // O filtro duro precisa da diferença: não dá para eliminar por pretensão
  // salarial uma vaga cuja empresa declarou que não divulga salário.
  const job = normalizeJob(rawJob({ notDisclosed: ['salary'] }), opts)
  assert.equal(absenceReason(job, 'salary'), 'not_disclosed')
})

test('campo presente não entra em unknownFields', () => {
  const job = normalizeJob(rawJob({ salaryMin: 8000, currency: 'BRL', salaryPeriod: 'mensal' }), opts)
  assert.equal(absenceReason(job, 'salary'), null)
  assert.equal(job.salaryMin, 8000)
  assert.equal(job.salaryPeriod, 'month')
})

test('o cargo é ligado à taxonomia quando reconhecido', () => {
  assert.equal(normalizeJob(rawJob({ title: 'Analista de Dados' }), opts).normalizedTitle, 'data_analyst')
  assert.equal(normalizeJob(rawJob({ title: 'Data Analyst' }), opts).normalizedTitle, 'data_analyst')
})

test('cargo desconhecido não é forçado num conceito', () => {
  const job = normalizeJob(rawJob({ title: 'Domador de Leões' }), opts)
  assert.equal(job.normalizedTitle, null)
  assert.equal(absenceReason(job, 'normalizedTitle'), 'unknown')
  assert.equal(job.title, 'Domador de Leões', 'o título original tem que sobreviver')
})

test('modelo de trabalho não assume presencial quando a vaga não diz', () => {
  // Chutar 'onsite' descartaria vagas remotas de quem só aceita remoto.
  assert.equal(normalizeRemoteType(null, null), 'unknown')
  assert.equal(normalizeRemoteType(null, 'São Paulo - Remoto'), 'remote')
  assert.equal(normalizeRemoteType('Hybrid', null), 'hybrid')
  assert.equal(normalizeRemoteType(null, 'Presencial - Belo Horizonte'), 'onsite')
})

test('vaga remota sempre sobrepõe a categoria de função (pedido do operador, 15/09/2026)', () => {
  const remota = normalizeJob(rawJob({ remoteType: 'remote', category: 'ti' }), opts)
  assert.equal(remota.category, 'vaga_remota', 'remoto tem que vencer a categoria de função declarada')

  const naoRemota = normalizeJob(rawJob({ remoteType: 'onsite', category: 'ti' }), opts)
  assert.equal(naoRemota.category, 'ti', 'sem ser remoto, a categoria declarada passa direto')

  const semCategoria = normalizeJob(rawJob({}), opts)
  assert.equal(semCategoria.category, null, 'fonte que não categoriza fica null, sem inventar setor')
  assert.equal(absenceReason(semCategoria, 'category'), 'unknown')
})

test('salário é lido em formatos de mercados diferentes', () => {
  assert.equal(normalizeJob(rawJob({ salaryMin: 'R$ 8.000,00' }), opts).salaryMin, 8000)
  assert.equal(normalizeJob(rawJob({ salaryMin: '$80,000' }), opts).salaryMin, 80000)
  assert.equal(normalizeJob(rawJob({ salaryMin: '95000' }), opts).salaryMin, 95000)
})

test('período do salário é reconhecido em vários idiomas', () => {
  assert.equal(normalizeSalaryPeriod('per year'), 'year')
  assert.equal(normalizeSalaryPeriod('mensal'), 'month')
  assert.equal(normalizeSalaryPeriod('por hora'), 'hour')
  assert.equal(normalizeSalaryPeriod('qualquer coisa'), null)
})

test('senioridade sai do título quando a fonte silencia', () => {
  assert.equal(normalizeJob(rawJob({ title: 'Analista de Dados Sênior' }), opts).seniority, 'senior')
  // Mas o que a fonte declarou tem precedência sobre a leitura do título.
  assert.equal(
    normalizeJob(rawJob({ title: 'Analista de Dados Sênior', seniority: 'mid' }), opts).seniority,
    'mid'
  )
})

test('o mercado da vaga sai do país', () => {
  assert.equal(normalizeJob(rawJob({ country: 'br' }), opts).market, 'BR')
  assert.equal(normalizeJob(rawJob({ country: 'ZZ' }), opts).market, 'GLOBAL')
  assert.equal(normalizeJob(rawJob(), opts).market, null)
})

test('nome de empresa é canonizado para deduplicar', () => {
  assert.equal(companyKeyOf('Griffo Tecnologia Ltda.'), 'griffo tecnologia')
  assert.equal(companyKeyOf('GRIFFO TECNOLOGIA'), 'griffo tecnologia')
  assert.equal(companyKeyOf('Griffo Tecnologia Inc'), 'griffo tecnologia')
})

/* ================================================================== *
 * §14 — Deduplicação
 * ================================================================== */

test('company + sourceJobId é a chave preferida', () => {
  const job = normalizeJob(rawJob({ sourceJobId: 'ABC-123' }), opts)
  const { strategy, key } = dedupeKeyFor(job)
  assert.equal(strategy, 'source_id')
  assert.ok(key.startsWith('sid:griffo tecnologia:'))
})

test('sem identificador, a URL canônica decide', () => {
  const job = normalizeJob(rawJob(), opts)
  assert.equal(dedupeKeyFor(job).strategy, 'canonical_url')
})

test('rastreamento na URL não cria vaga nova', () => {
  const a = canonicalUrl('https://Exemplo.com/vagas/1?utm_source=linkedin&gh_src=abc')
  const b = canonicalUrl('https://exemplo.com/vagas/1/')
  assert.equal(a, b)
})

test('a mesma vaga por duas fontes entra uma vez só', () => {
  const daEmpresa = normalizeJob(rawJob({ sourceJobId: 'ABC-123' }), opts)
  const doAgregador = normalizeJob(
    rawJob({
      sourceJobId: 'ABC-123',
      company: 'GRIFFO TECNOLOGIA S.A.',
      title: 'Data Analyst',
      applicationUrl: 'https://agregador.com/j/999',
    }),
    opts
  )

  const { unique, duplicates } = dedupeBatch([daEmpresa, doAgregador])
  assert.equal(unique.length, 1)
  assert.equal(duplicates, 1)
})

test('a primeira ocorrência vence — a ordem das fontes é a ordem de confiança', () => {
  const primeira = normalizeJob(rawJob({ sourceJobId: 'X', description: 'da empresa' }), opts)
  const segunda = normalizeJob(rawJob({ sourceJobId: 'X', description: 'do agregador' }), opts)
  const { unique } = dedupeBatch([primeira, segunda])
  assert.equal(unique[0].description, 'da empresa')
})

test('vagas diferentes da mesma empresa NÃO são agrupadas', () => {
  // Dois "Data Analyst" na mesma empresa e cidade, para times diferentes, são
  // duas vagas. Agrupá-las esconde uma oportunidade de forma invisível.
  const a = normalizeJob(rawJob({ sourceJobId: 'TIME-A', country: 'BR', city: 'São Paulo' }), opts)
  const b = normalizeJob(rawJob({ sourceJobId: 'TIME-B', country: 'BR', city: 'São Paulo' }), opts)
  const { unique, duplicates } = dedupeBatch([a, b])
  assert.equal(unique.length, 2)
  assert.equal(duplicates, 0)
})

test('a chave é determinística entre execuções', () => {
  const job = normalizeJob(rawJob({ sourceJobId: 'ABC' }), opts)
  assert.equal(dedupeKeyFor(job).key, dedupeKeyFor({ ...job }).key)
})

test('withDedupeKey preenche a chave que vai para o banco', () => {
  const job = withDedupeKey(normalizeJob(rawJob({ sourceJobId: 'ABC' }), opts))
  assert.ok(job.dedupeKey)
  assert.equal(job.dedupeStrategy, 'source_id')
})

test('similaridade é diagnóstico, e exige mesma empresa e mesmo cargo', () => {
  const base = normalizeJob(rawJob({ country: 'BR', city: 'São Paulo' }), opts)
  const outraEmpresa = normalizeJob(rawJob({ company: 'Outra Empresa', country: 'BR', city: 'São Paulo' }), opts)
  const outroCargo = normalizeJob(rawJob({ title: 'Engenheiro de Dados', country: 'BR', city: 'São Paulo' }), opts)

  assert.ok(looksLikeSameJob(base, normalizeJob(rawJob({ title: 'Data Analyst', country: 'BR', city: 'São Paulo' }), opts)))
  assert.ok(!looksLikeSameJob(base, outraEmpresa))
  assert.ok(!looksLikeSameJob(base, outroCargo))
})

test('URL inválida não derruba a coleta', () => {
  // Numa coleta de milhares de itens, uma URL malformada não pode lançar.
  assert.equal(canonicalUrl('nao é uma url'), 'nao é uma url')
  assert.equal(canonicalUrl(''), '')
})

test('lista de requisitos é limpa e desduplicada', () => {
  const job: NormalizedJob = normalizeJob(
    rawJob({ requirements: ['SQL', ' SQL ', '', 'Python'] as string[] }),
    opts
  )
  assert.deepEqual(job.requirements, ['SQL', 'Python'])
})
