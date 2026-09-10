/**
 * Cliente Prisma falso, em memória, para os testes de cobrança.
 *
 * Por que ele existe: `lib/entitlements.ts` é o único lugar do produto onde
 * valor pago vira direito de uso, e a seção 10.1 do documento de continuidade
 * o classifica como "onde o erro não aparece como erro" — cobrar duas vezes ou
 * destravar sem cobrar não quebra tela nenhuma, não aparece em log, e só é
 * descoberto pelo usuário ou pela conciliação. Até 10/09/2026 nada o testava,
 * porque cada função fala com o banco.
 *
 * Como ele entra no lugar do banco: `lib/db.ts` guarda o cliente em
 * `globalThis.prisma` (o truque que faz o hot reload do Next não abrir uma
 * conexão nova a cada recompilação) e só o constrói se essa referência estiver
 * vazia. Preenchê-la ANTES da primeira consulta faz o `db` do produto usar
 * este objeto, sem que uma linha do código de produção mude. É o que
 * `withFakeDb` faz — e desfaz no fim, para um teste não contaminar o seguinte.
 *
 * ============================ O QUE ELE NÃO É ============================
 *
 * Não é um Postgres. Ele NÃO prova que o banco de verdade se comporta assim —
 * prova que o CÓDIGO reage certo ao que o banco responde. A diferença importa
 * em três pontos, e todos os três estão cobertos por restrição real no schema
 * ou na cláusula do update, não por este arquivo:
 *
 * - a unicidade de `AnalysisLedger.paymentRef` (é `@unique` no schema; aqui é
 *   imitada devolvendo um erro `P2002`);
 * - a atomicidade do `updateMany` com `unlockedAt: null` (no Postgres é a
 *   linha travada pela transação; aqui é um `if`);
 * - o rollback da transação (aqui é uma cópia do estado, restaurada no erro).
 *
 * Escrever isso no arquivo em vez de deixar implícito é o ponto: um teste que
 * finge ser garantia de banco é pior que teste nenhum, porque convence.
 *
 * Toda consulta com um formato que este fake não conhece LANÇA em vez de
 * devolver `undefined`. Se uma consulta do produto mudar de forma, o teste
 * quebra alto em vez de passar por acidente.
 */

export interface FakeUser {
  id: string
  role?: string
  disabled?: boolean
  analysisBalance: number
  paymentCountry?: string | null
}

export interface FakeResume {
  id: string
  userId: string
  unlockedAt?: Date | null
}

export interface FakeLedgerRow {
  id: string
  userId: string
  type: string
  delta: number
  description: string
  tier?: number | null
  priceUsd?: number | null
  paymentCountry?: string | null
  currency?: string | null
  amountLocal?: number | null
  paymentRef?: string | null
  stripeEventId?: string | null
  resumeId?: string | null
}

interface FakeState {
  users: FakeUser[]
  resumes: FakeResume[]
  ledger: FakeLedgerRow[]
  /** Telemetria do roteador de IA: uma linha por tarefa, com o veredito. */
  aiLogs: Record<string, any>[]
  /** Trilha de auditoria — é aqui que um failover deixa rastro. */
  auditLogs: Record<string, any>[]
}

export interface FakeDb {
  /** Estado atual — leia daqui nas asserções. */
  state: FakeState
  /** Nome de cada operação executada, na ordem. Útil para provar o que NÃO foi chamado. */
  calls: string[]
  /** O objeto que entra em `globalThis.prisma`. */
  client: any
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function project<T extends Record<string, any>>(row: T | undefined, select?: Record<string, boolean>) {
  if (!row) return null
  if (!select) return clone(row)
  const out: Record<string, any> = {}
  for (const [field, wanted] of Object.entries(select)) {
    if (wanted) out[field] = clone(row[field] ?? null)
  }
  return out
}

/** Erro no formato que o Prisma usa: o código é o que o produto inspeciona. */
function prismaError(code: string, message: string) {
  return Object.assign(new Error(message), { code })
}

export function createFakeDb(seed: { users?: FakeUser[]; resumes?: FakeResume[] } = {}): FakeDb {
  const state: FakeState = {
    users: (seed.users ?? []).map((u) => ({ role: 'user', disabled: false, paymentCountry: null, ...u })),
    resumes: (seed.resumes ?? []).map((r) => ({ unlockedAt: null, ...r })),
    ledger: [],
    aiLogs: [],
    auditLogs: [],
  }
  const calls: string[] = []
  let ledgerSeq = 0

  const user = {
    findUnique: async ({ where, select }: any) => {
      calls.push('user.findUnique')
      if (!where?.id) throw new Error(`fake-prisma: user.findUnique sem id: ${JSON.stringify(where)}`)
      return project(state.users.find((u) => u.id === where.id), select)
    },
    update: async ({ where, data, select }: any) => {
      calls.push('user.update')
      const found = state.users.find((u) => u.id === where?.id)
      // A cláusula condicional do destrave: `analysisBalance: { gte: 1 }` no
      // WHERE. Sem linha correspondente o Prisma lança P2025 — é essa exceção
      // que o `catch` de `unlockAnalysis` trata como corrida perdida.
      const gate = where?.analysisBalance?.gte
      if (!found || (gate !== undefined && found.analysisBalance < gate)) {
        throw prismaError('P2025', 'An operation failed because it depends on one or more records that were required but not found.')
      }
      if (data?.analysisBalance?.increment !== undefined) found.analysisBalance += data.analysisBalance.increment
      else if (data?.analysisBalance?.decrement !== undefined) found.analysisBalance -= data.analysisBalance.decrement
      else if (data?.analysisBalance !== undefined) found.analysisBalance = data.analysisBalance
      if (data?.paymentCountry !== undefined) found.paymentCountry = data.paymentCountry
      const conhecidos = new Set(['analysisBalance', 'paymentCountry'])
      for (const campo of Object.keys(data ?? {})) {
        if (!conhecidos.has(campo)) throw new Error(`fake-prisma: user.update com campo não suportado '${campo}'`)
      }
      return project(found, select)
    },
  }

  const resume = {
    findFirst: async ({ where, select }: any) => {
      calls.push('resume.findFirst')
      let candidatos = state.resumes
      if (where?.id) candidatos = candidatos.filter((r) => r.id === where.id)
      if (where?.userId) candidatos = candidatos.filter((r) => r.userId === where.userId)
      if (where?.unlockedAt !== undefined) {
        if (where.unlockedAt === null) candidatos = candidatos.filter((r) => !r.unlockedAt)
        else if (where.unlockedAt?.not === null) candidatos = candidatos.filter((r) => Boolean(r.unlockedAt))
        else throw new Error(`fake-prisma: resume.findFirst com filtro de unlockedAt desconhecido: ${JSON.stringify(where.unlockedAt)}`)
      }
      return project(candidatos[0], select)
    },
    update: async ({ where, data, select }: any) => {
      calls.push('resume.update')
      const found = state.resumes.find((r) => r.id === where?.id)
      if (!found) throw prismaError('P2025', 'Record to update not found.')
      if (data?.unlockedAt !== undefined) found.unlockedAt = data.unlockedAt
      return project(found, select)
    },
    updateMany: async ({ where, data }: any) => {
      calls.push('resume.updateMany')
      const alvos = state.resumes.filter(
        (r) =>
          (where?.id === undefined || r.id === where.id) &&
          (where?.userId === undefined || r.userId === where.userId) &&
          (where?.unlockedAt === undefined || (where.unlockedAt === null ? !r.unlockedAt : Boolean(r.unlockedAt)))
      )
      for (const alvo of alvos) {
        if (data?.unlockedAt !== undefined) alvo.unlockedAt = data.unlockedAt
      }
      return { count: alvos.length }
    },
  }

  const analysisLedger = {
    create: async ({ data }: any) => {
      calls.push('analysisLedger.create')
      // `paymentRef` é `@unique` no schema: é ELE que torna o crédito de compra
      // idempotente entre o webhook da Stripe e a verificação direta da sessão.
      if (data?.paymentRef && state.ledger.some((l) => l.paymentRef === data.paymentRef)) {
        throw prismaError('P2002', 'Unique constraint failed on the fields: (`paymentRef`)')
      }
      const row: FakeLedgerRow = { id: `ledger_${++ledgerSeq}`, ...data }
      state.ledger.push(row)
      return clone(row)
    },
  }

  // Modelos lidos/escritos pelo roteador de IA. `aiApiKey` e `systemConfig`
  // voltam vazios de propósito: assim a configuração de provedores vem das
  // variáveis de ambiente, sem passar pela decifragem de segredo — que é outro
  // assunto, com outro teste.
  const aiApiKey = {
    findMany: async () => {
      calls.push('aiApiKey.findMany')
      return []
    },
  }

  const systemConfig = {
    findMany: async () => {
      calls.push('systemConfig.findMany')
      return []
    },
  }

  const aiLog = {
    create: async ({ data, select }: any) => {
      calls.push('aiLog.create')
      const row = { id: `ailog_${state.aiLogs.length + 1}`, ...data }
      state.aiLogs.push(row)
      return project(row, select)
    },
  }

  const auditLog = {
    create: async ({ data, select }: any) => {
      calls.push('auditLog.create')
      const row = { id: `audit_${state.auditLogs.length + 1}`, ...data }
      state.auditLogs.push(row)
      return project(row, select)
    },
  }

  const client: any = {
    user,
    resume,
    analysisLedger,
    aiApiKey,
    systemConfig,
    aiLog,
    auditLog,
    /**
     * Transação interativa. O rollback é o ponto: `unlockAnalysis` conta com
     * ele para que a marca de destrave desapareça junto quando o decremento do
     * saldo falha. Um fake sem rollback aprovaria a implementação errada — a
     * que deixa o currículo destravado de graça.
     */
    $transaction: async (fn: any) => {
      if (typeof fn !== 'function') throw new Error('fake-prisma: $transaction só suporta a forma interativa (callback)')
      calls.push('$transaction')
      const snapshot = clone(state)
      try {
        return await fn(client)
      } catch (e) {
        state.users = snapshot.users
        state.resumes = snapshot.resumes
        state.ledger = snapshot.ledger
        throw e
      }
    },
  }

  return { state, calls, client }
}

/**
 * Instala o fake em `globalThis.prisma` durante a função e restaura depois,
 * mesmo se ela lançar. Restaurar não é detalhe: os arquivos de teste rodam em
 * processos separados, mas os testes DENTRO de um arquivo compartilham o
 * mesmo global.
 */
export async function withFakeDb<T>(fake: FakeDb, fn: () => Promise<T>): Promise<T> {
  const g = globalThis as any
  const anterior = g.prisma
  g.prisma = fake.client
  try {
    return await fn()
  } finally {
    if (anterior === undefined) delete g.prisma
    else g.prisma = anterior
  }
}
