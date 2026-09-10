import test from 'node:test'
import assert from 'node:assert/strict'
import { createFakeDb, withFakeDb, type FakeDb } from './testing/fake-prisma'
import {
  getAnalysisBalance,
  grantAnalyses,
  requireAnyUnlockedResume,
  requireUnlockedResume,
  unlockAnalysis,
} from './entitlements'

/**
 * Cobrança — o caminho onde o erro não aparece como erro.
 *
 * A seção 10.1 do documento de continuidade diz por que este arquivo precisava
 * existir: aqui um defeito não quebra tela, não escreve no log e não derruba
 * requisição. Ele credita duas vezes o mesmo pagamento, ou entrega a Análise
 * Completa sem debitar, e continua verde até alguém conferir extrato.
 *
 * O que estes testes exercitam é o CÓDIGO DE PRODUÇÃO de `entitlements.ts`,
 * não uma cópia dele: o cliente do banco é substituído em `globalThis.prisma`,
 * que é o mesmo ponto que `lib/db.ts` usa para sobreviver ao hot reload. O que
 * o fake garante e o que ele não garante está escrito em `testing/fake-prisma.ts`
 * — em resumo: ele prova a reação do código à resposta do banco, não a
 * garantia do banco.
 */

const compra = (patch: Partial<Parameters<typeof grantAnalyses>[0]> = {}) => ({
  userId: 'u1',
  quantity: 5,
  tier: 1 as const,
  priceUsd: 24.9,
  paymentCountry: 'BR',
  currency: 'BRL',
  amountLocal: 129.5,
  paymentRef: 'cs_test_abc',
  description: 'Pacote de 5 análises',
  ...patch,
})

const cenario = (patch: { users?: any[]; resumes?: any[] } = {}): FakeDb =>
  createFakeDb({
    users: patch.users ?? [{ id: 'u1', analysisBalance: 0 }],
    resumes: patch.resumes ?? [{ id: 'r1', userId: 'u1' }],
  })

// ---------------------------------------------------------------- compra ---

test('compra credita o saldo e registra a linha de cobrança no ledger', async () => {
  const fake = cenario()
  await withFakeDb(fake, async () => {
    const res = await grantAnalyses(compra())
    assert.equal(res.granted, true)
    assert.equal(res.balance, 5)
  })

  assert.equal(fake.state.users[0].analysisBalance, 5)
  assert.equal(fake.state.ledger.length, 1)
  const linha = fake.state.ledger[0]
  assert.equal(linha.type, 'purchase')
  assert.equal(linha.delta, 5)
  // Os campos de valor têm que sobreviver inteiros: é com eles que a
  // conciliação com a Stripe é feita depois.
  assert.equal(linha.priceUsd, 24.9)
  assert.equal(linha.currency, 'BRL')
  assert.equal(linha.amountLocal, 129.5)
  assert.equal(linha.paymentRef, 'cs_test_abc')
})

test('o mesmo pagamento creditado duas vezes credita uma vez só', async () => {
  // O webhook da Stripe e a verificação direta da sessão correm em paralelo por
  // construção: o navegador volta do checkout no mesmo instante em que a Stripe
  // entrega o evento. Quem chega em segundo lugar colide com o índice único de
  // `paymentRef` e desiste — sem essa colisão, saldo nasce do nada.
  const fake = cenario()
  await withFakeDb(fake, async () => {
    const primeiro = await grantAnalyses(compra())
    const segundo = await grantAnalyses(compra())

    assert.equal(primeiro.granted, true)
    assert.equal(segundo.granted, false, 'a segunda entrega do mesmo pagamento não credita')
    assert.equal(segundo.balance, 5, 'e devolve o saldo real, não zero')
  })

  assert.equal(fake.state.users[0].analysisBalance, 5, 'saldo creditado uma única vez')
  assert.equal(fake.state.ledger.length, 1, 'uma linha de ledger por pagamento')
})

test('pagamentos diferentes do mesmo usuário somam', async () => {
  const fake = cenario()
  await withFakeDb(fake, async () => {
    await grantAnalyses(compra({ paymentRef: 'cs_1', quantity: 1 }))
    const res = await grantAnalyses(compra({ paymentRef: 'cs_2', quantity: 5 }))
    assert.equal(res.granted, true)
    assert.equal(res.balance, 6)
  })
  assert.equal(fake.state.ledger.length, 2)
})

test('o país do pagamento passa a mandar na faixa das compras seguintes', async () => {
  const fake = cenario()
  await withFakeDb(fake, async () => {
    await grantAnalyses(compra({ paymentCountry: 'PT' }))
  })
  assert.equal(fake.state.users[0].paymentCountry, 'PT')
})

test('país de pagamento vazio não apaga o que já estava gravado', async () => {
  const fake = cenario({ users: [{ id: 'u1', analysisBalance: 0, paymentCountry: 'BR' }] })
  await withFakeDb(fake, async () => {
    await grantAnalyses(compra({ paymentCountry: '' }))
  })
  assert.equal(fake.state.users[0].paymentCountry, 'BR')
})

test('falha que não é colisão de idempotência sobe — não vira "creditado"', async () => {
  // Engolir um erro de banco aqui seria o pior dos dois mundos: o pagamento
  // ficaria sem crédito e sem alarme. Só P2002 é tratado como "já creditado".
  const fake = cenario()
  fake.client.analysisLedger.create = async () => {
    throw Object.assign(new Error('connection reset'), { code: 'P1001' })
  }
  await withFakeDb(fake, async () => {
    await assert.rejects(() => grantAnalyses(compra()), /connection reset/)
  })
  assert.equal(fake.state.users[0].analysisBalance, 0, 'e nada foi creditado')
})

// -------------------------------------------------------------- destrave ---

test('destravar consome exatamente uma análise e registra o movimento', async () => {
  const fake = cenario({ users: [{ id: 'u1', analysisBalance: 2 }] })
  await withFakeDb(fake, async () => {
    const res = await unlockAnalysis('u1', 'r1')
    assert.equal(res.ok, true)
    assert.equal(res.alreadyUnlocked, false)
    assert.equal(res.balance, 1)
  })

  assert.ok(fake.state.resumes[0].unlockedAt, 'currículo destravado')
  assert.equal(fake.state.ledger.length, 1)
  assert.equal(fake.state.ledger[0].type, 'unlock')
  assert.equal(fake.state.ledger[0].delta, -1)
  assert.equal(fake.state.ledger[0].resumeId, 'r1')
})

test('destravar o mesmo currículo de novo não cobra de novo', async () => {
  // Duplo clique, reprocessamento, usuário voltando na tela: o destrave é um
  // ESTADO do currículo, não um evento repetível.
  const fake = cenario({ users: [{ id: 'u1', analysisBalance: 2 }] })
  await withFakeDb(fake, async () => {
    await unlockAnalysis('u1', 'r1')
    const segundo = await unlockAnalysis('u1', 'r1')
    assert.equal(segundo.ok, true)
    assert.equal(segundo.alreadyUnlocked, true)
    assert.equal(segundo.balance, 1, 'saldo intocado na segunda chamada')
  })
  assert.equal(fake.state.ledger.length, 1, 'um movimento de destrave, não dois')
})

test('sem saldo não destrava, e não deixa rastro de cobrança', async () => {
  const fake = cenario({ users: [{ id: 'u1', analysisBalance: 0 }] })
  await withFakeDb(fake, async () => {
    const res = await unlockAnalysis('u1', 'r1')
    assert.equal(res.ok, false)
    assert.match(res.error ?? '', /ainda não tem uma análise/i)
  })
  assert.equal(fake.state.resumes[0].unlockedAt ?? null, null)
  assert.equal(fake.state.ledger.length, 0)
})

test('administrador destrava sem consumir saldo e sem linha no ledger', async () => {
  // Não gerar linha é deliberado: não houve movimento de valor para auditar, e
  // uma linha de -1 sem cobrança sujaria a conciliação.
  const fake = cenario({ users: [{ id: 'u1', role: 'admin', analysisBalance: 3 }] })
  await withFakeDb(fake, async () => {
    const res = await unlockAnalysis('u1', 'r1')
    assert.equal(res.ok, true)
    assert.equal(res.balance, 3)
  })
  assert.ok(fake.state.resumes[0].unlockedAt)
  assert.equal(fake.state.ledger.length, 0)
})

test('conta suspensa não destrava nem gasta saldo', async () => {
  const fake = cenario({ users: [{ id: 'u1', analysisBalance: 5, disabled: true }] })
  await withFakeDb(fake, async () => {
    const res = await unlockAnalysis('u1', 'r1')
    assert.equal(res.ok, false)
    assert.match(res.error ?? '', /suspensa/i)
  })
  assert.equal(fake.state.users[0].analysisBalance, 5)
  assert.equal(fake.state.resumes[0].unlockedAt ?? null, null)
})

test('currículo de outro usuário não é destravável — e não cobra por tentar', async () => {
  const fake = cenario({
    users: [{ id: 'u1', analysisBalance: 5 }],
    resumes: [{ id: 'r1', userId: 'outro' }],
  })
  await withFakeDb(fake, async () => {
    const res = await unlockAnalysis('u1', 'r1')
    assert.equal(res.ok, false)
    assert.match(res.error ?? '', /não encontrado/i)
    assert.equal(res.balance, 5)
  })
  assert.equal(fake.state.users[0].analysisBalance, 5)
  assert.equal(fake.state.ledger.length, 0)
})

test('duas requisições no mesmo currículo: a segunda não cobra', async () => {
  // Simula a corrida real: entre a leitura e a escrita, OUTRA requisição
  // destravou o currículo. A cláusula `unlockedAt: null` do updateMany é o que
  // fecha a porta — aqui o count volta 0 e o saldo não pode ser tocado.
  const fake = cenario({ users: [{ id: 'u1', analysisBalance: 1 }] })
  const updateManyOriginal = fake.client.resume.updateMany
  fake.client.resume.updateMany = async (args: any) => {
    fake.state.resumes[0].unlockedAt = new Date('2026-09-10T12:00:00Z')
    return updateManyOriginal(args)
  }

  await withFakeDb(fake, async () => {
    const res = await unlockAnalysis('u1', 'r1')
    assert.equal(res.ok, true, 'para o usuário o currículo está destravado — e está')
  })

  assert.equal(fake.state.users[0].analysisBalance, 1, 'saldo NÃO foi debitado duas vezes')
  assert.equal(fake.state.ledger.length, 0, 'nem gerou um segundo movimento')
})

test('saldo que some entre a leitura e a escrita desfaz o destrave inteiro', async () => {
  // O caso oposto e mais perigoso: se o decremento condicional falhar depois de
  // a marca de destrave já ter sido gravada, o currículo não pode ficar
  // destravado de graça. É a transação que desfaz — e é isso que se verifica.
  const fake = cenario({ users: [{ id: 'u1', analysisBalance: 1 }] })
  const userUpdateOriginal = fake.client.user.update
  fake.client.user.update = async (args: any) => {
    fake.state.users[0].analysisBalance = 0 // outra requisição consumiu o último saldo
    return userUpdateOriginal(args)
  }

  await withFakeDb(fake, async () => {
    const res = await unlockAnalysis('u1', 'r1')
    assert.equal(res.ok, false)
    assert.match(res.error ?? '', /concorrente/i)
  })

  assert.equal(fake.state.resumes[0].unlockedAt ?? null, null, 'a marca de destrave foi revertida')
  assert.equal(fake.state.ledger.length, 0, 'e nenhum movimento sobrou no ledger')
})

test('saldo lido é o que está no banco, e usuário inexistente é zero', async () => {
  const fake = cenario({ users: [{ id: 'u1', analysisBalance: 7 }] })
  await withFakeDb(fake, async () => {
    assert.equal(await getAnalysisBalance('u1'), 7)
    assert.equal(await getAnalysisBalance('ninguem'), 0)
  })
})

// ---------------------------------------------------- guardas das rotas ---

test('rota derivada só passa com o currículo destravado', async () => {
  const fake = cenario({
    users: [{ id: 'u1', analysisBalance: 3 }],
    resumes: [{ id: 'r1', userId: 'u1' }],
  })
  await withFakeDb(fake, async () => {
    const bloqueado = await requireUnlockedResume('u1', 'r1')
    assert.equal(bloqueado.ok, false)
    assert.equal(bloqueado.status, 402)
    assert.equal(bloqueado.code, 'ANALYSIS_REQUIRED')
    assert.equal(bloqueado.balance, 3, 'a tela precisa do saldo para oferecer a compra certa')

    await unlockAnalysis('u1', 'r1')

    const liberado = await requireUnlockedResume('u1', 'r1')
    assert.equal(liberado.ok, true)
    assert.equal(liberado.status, 200)
  })
})

test('currículo inexistente é 404, não paywall', async () => {
  // A distinção não é cosmética: 402 manda a tela oferecer compra, e oferecer
  // compra de algo que não existe é pior que um erro honesto.
  const fake = cenario({ resumes: [] })
  await withFakeDb(fake, async () => {
    const res = await requireUnlockedResume('u1', 'r1')
    assert.equal(res.status, 404)
    assert.equal(res.code, 'RESUME_NOT_FOUND')
  })
})

test('administrador atravessa a guarda sem destrave', async () => {
  const fake = cenario({ users: [{ id: 'u1', role: 'admin', analysisBalance: 0 }] })
  await withFakeDb(fake, async () => {
    const res = await requireUnlockedResume('u1', 'r1')
    assert.equal(res.ok, true)
  })
})

test('busca avulsa pede "algum currículo destravado", não aquele currículo', async () => {
  // O Radar trabalha sobre o Perfil Profissional, não sobre um currículo: quem
  // já pagou uma análise alguma vez tem direito, mesmo que o currículo em foco
  // seja outro.
  const fake = cenario({
    users: [{ id: 'u1', analysisBalance: 0 }],
    resumes: [
      { id: 'r1', userId: 'u1' },
      { id: 'r2', userId: 'u1', unlockedAt: new Date('2026-09-01T10:00:00Z') },
    ],
  })
  await withFakeDb(fake, async () => {
    const res = await requireAnyUnlockedResume('u1')
    assert.equal(res.ok, true)
  })
})

test('sem nenhum currículo destravado, a busca avulsa é paywall', async () => {
  const fake = cenario({ users: [{ id: 'u1', analysisBalance: 0 }] })
  await withFakeDb(fake, async () => {
    const res = await requireAnyUnlockedResume('u1')
    assert.equal(res.ok, false)
    assert.equal(res.status, 402)
    assert.equal(res.code, 'ANALYSIS_REQUIRED')
  })
})
