import 'server-only'
import { db } from './db'

/**
 * Registro de sessões ativas, para que o logout revogue de verdade.
 *
 * O cookie continua sendo a prova de identidade (HMAC), mas passa a carregar
 * um `sid` conferido no banco a cada requisição. Sem isso, "sair" só apagava o
 * cookie do navegador: um token copiado antes disso seguia válido até expirar.
 *
 * ---
 *
 * **Degradação durante a transição.** O projeto não usa `prisma migrate` — o
 * schema é aplicado com `prisma db push`, manualmente, e o build da Vercel
 * (`prisma generate && next build`) não aplica nada. Existe portanto uma
 * janela entre o deploy deste código e a criação da tabela `Session`.
 *
 * Se as funções abaixo simplesmente lançassem nessa janela, o login pararia de
 * funcionar em produção. Em vez disso elas detectam a tabela ausente, registram
 * um erro alto e devolvem o comportamento anterior (só HMAC). O sistema fica
 * temporariamente sem revogação — como já estava —, mas no ar.
 *
 * A detecção é reavaliada a cada 60s, então o recurso passa a valer sozinho
 * assim que `npm run db:push` for executado, sem precisar de novo deploy.
 */

const MISSING_TABLE_RECHECK_MS = 60_000

let tableMissingSince = 0

function noteTableMissing() {
  if (Date.now() - tableMissingSince > MISSING_TABLE_RECHECK_MS) {
    console.error(
      '[session-store] Tabela `Session` ausente: as sessões seguem válidas apenas ' +
        'pela assinatura do cookie e o logout NÃO revoga. Rode `npm run db:push` ' +
        'para aplicar o schema.'
    )
  }
  tableMissingSince = Date.now()
}

function tableKnownMissing(): boolean {
  return tableMissingSince > 0 && Date.now() - tableMissingSince < MISSING_TABLE_RECHECK_MS
}

/** Prisma sinaliza tabela inexistente com P2021; a mensagem crua cobre o resto. */
function isMissingTableError(e: any): boolean {
  return e?.code === 'P2021' || /does not exist|relation .* does not exist/i.test(String(e?.message || ''))
}

export interface SessionMeta {
  userAgent?: string | null
  ip?: string | null
}

/**
 * Cria o registro da sessão. Devolve o `sid`, ou `null` se a tabela ainda não
 * existe — nesse caso o cookie sai sem `sid` e vale só pela assinatura.
 */
export async function createSessionRecord(
  userId: string,
  expiresAt: Date,
  meta: SessionMeta = {}
): Promise<string | null> {
  if (tableKnownMissing()) return null
  try {
    const session = await db.session.create({
      data: {
        userId,
        expiresAt,
        userAgent: meta.userAgent?.slice(0, 500) ?? null,
        ip: meta.ip ?? null,
      },
    })
    tableMissingSince = 0
    return session.id
  } catch (e: any) {
    if (isMissingTableError(e)) {
      noteTableMissing()
      return null
    }
    // Falha real de banco: não emitir sessão é preferível a emitir uma que não
    // pode ser revogada.
    throw e
  }
}

/**
 * Confere se o `sid` continua valendo.
 *
 * Devolve `true` quando a tabela não existe (degradação descrita acima) — o
 * cookie já passou pela verificação de HMAC e de expiração antes de chegar
 * aqui, então isso equivale exatamente ao comportamento anterior.
 */
export async function isSessionActive(sid: string): Promise<boolean> {
  if (tableKnownMissing()) return true
  try {
    const session = await db.session.findUnique({
      where: { id: sid },
      select: { revokedAt: true, expiresAt: true },
    })
    tableMissingSince = 0
    if (!session) return false
    if (session.revokedAt) return false
    if (session.expiresAt.getTime() < Date.now()) return false
    return true
  } catch (e: any) {
    if (isMissingTableError(e)) {
      noteTableMissing()
      return true
    }
    // Banco indisponível: recusar a sessão transforma uma falha de leitura numa
    // deslogada geral. O cookie já está autenticado; devolve válido.
    console.error('[session-store] Falha ao verificar sessão:', e?.message || e)
    return true
  }
}

/** Revoga uma sessão (logout). Idempotente. */
export async function revokeSession(sid: string): Promise<void> {
  if (tableKnownMissing()) return
  try {
    await db.session.updateMany({
      where: { id: sid, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    tableMissingSince = 0
  } catch (e: any) {
    if (isMissingTableError(e)) {
      noteTableMissing()
      return
    }
    console.error('[session-store] Falha ao revogar sessão:', e?.message || e)
  }
}

/**
 * Revoga todas as sessões de um usuário. Usado ao desabilitar a conta e
 * disponível para "sair de todos os dispositivos".
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  if (tableKnownMissing()) return 0
  try {
    const result = await db.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    tableMissingSince = 0
    return result.count
  } catch (e: any) {
    if (isMissingTableError(e)) {
      noteTableMissing()
      return 0
    }
    console.error('[session-store] Falha ao revogar sessões do usuário:', e?.message || e)
    return 0
  }
}

/**
 * Expurga sessões antigas já expiradas ou revogadas há mais de 7 dias.
 * Mantém o banco limpo e evita acúmulo desnecessário de linhas de sessão.
 */
export async function cleanupExpiredSessions(retentionDays = 7): Promise<number> {
  if (tableKnownMissing()) return 0
  try {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const result = await db.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: cutoff } },
          { revokedAt: { lt: cutoff } },
        ],
      },
    })
    tableMissingSince = 0
    return result.count
  } catch (e: any) {
    if (isMissingTableError(e)) {
      noteTableMissing()
      return 0
    }
    console.error('[session-store] Falha na limpeza de sessões expiradas:', e?.message || e)
    return 0
  }
}
