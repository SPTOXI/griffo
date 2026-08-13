import { PrismaClient } from '@prisma/client'
import { loadEnvFile } from './load-env'
import { CREDITS_PER_ANALYSIS, analysesForCredits } from '../lib/pricing/migration'

/**
 * Converte o saldo de créditos em análises completas.
 *
 * 25 créditos = 1 análise, arredondando PARA CIMA. Quem tinha 40 créditos — o
 * antigo Plano de Entrada, que valia 2 avaliações — recebe 2 análises, não 1.
 * O arredondamento é a favor do usuário por decisão: ninguém pode sair perdendo
 * numa mudança de modelo que não pediu.
 *
 * Idempotente por `User.creditsMigratedAt`: rodar de novo não converte outra
 * vez, e quem entrou depois da primeira execução é pego na seguinte.
 *
 * O cliente do Prisma é instanciado AQUI, e não importado de `lib/db`, porque
 * aquele módulo carrega `server-only` — um pacote cujo `index.js` é um `throw`.
 * Ele existe para quebrar o build quando código de servidor vaza para o
 * navegador; num script de linha de comando, ele mata o processo no import.
 *
 * As URLs do banco saem do `.env` da raiz — ver `load-env.ts`.
 *
 *   npm run migrate:analyses -- --dry-run
 *   npm run migrate:analyses
 */

loadEnvFile()

const DRY_RUN = process.argv.includes('--dry-run')

if (!process.env.POSTGRES_PRISMA_URL) {
  throw new Error(
    'POSTGRES_PRISMA_URL não encontrada. Defina as URLs do banco no arquivo .env da raiz ' +
      'do projeto (ou no ambiente) antes de rodar este script.'
  )
}

const db = new PrismaClient()

/** Converte um usuário. Devolve quantas análises foram creditadas. */
async function migrateUser(userId: string, credits: number): Promise<number> {
  const analyses = analysesForCredits(credits)

  return db.$transaction(async (tx) => {
    // A condição `creditsMigratedAt: null` é o que impede converter duas vezes
    // — inclusive se o script for executado em paralelo com ele mesmo.
    const claimed = await tx.user.updateMany({
      where: { id: userId, creditsMigratedAt: null },
      data: { creditsMigratedAt: new Date(), analysisBalance: { increment: analyses } },
    })
    if (claimed.count === 0) return 0

    if (analyses > 0) {
      await tx.analysisLedger.create({
        data: {
          userId,
          type: 'migration',
          delta: analyses,
          description:
            `Conversão de ${credits} créditos em ${analyses} ` +
            `${analyses === 1 ? 'análise completa' : 'análises completas'} ` +
            `(${CREDITS_PER_ANALYSIS} créditos = 1 análise, arredondado a favor do usuário)`,
        },
      })
    }

    return analyses
  })
}

async function main() {
  console.log(
    DRY_RUN
      ? '=== SIMULAÇÃO (--dry-run): nenhum saldo será alterado ==='
      : '=== Convertendo saldos de crédito em análises completas ==='
  )
  console.log(`Taxa: ${CREDITS_PER_ANALYSIS} créditos = 1 análise, arredondando a favor do usuário.\n`)

  const pending = await db.user.findMany({
    where: { creditsMigratedAt: null },
    select: { id: true, email: true, credits: true },
    orderBy: { createdAt: 'asc' },
  })

  let usersWithBalance = 0
  let creditsConverted = 0
  let analysesGranted = 0

  for (const user of pending) {
    const analyses = analysesForCredits(user.credits)
    if (analyses > 0) {
      usersWithBalance += 1
      creditsConverted += user.credits
      analysesGranted += analyses
      // Esta lista é quem deve receber o comunicado — ver
      // docs/comunicado-migracao.md. Quem tinha saldo zero não é avisado.
      console.log(`${user.email}\t${user.credits} créditos\t→ ${analyses} análise(s)`)
    }

    // Contas sem saldo também são marcadas: sem isso, cada execução varreria
    // de novo a base inteira à procura de quem nunca teve crédito nenhum.
    if (!DRY_RUN) await migrateUser(user.id, user.credits)
  }

  console.log(
    `\n--- ${pending.length} conta(s) processada(s). ${usersWithBalance} tinha(m) saldo: ` +
      `${creditsConverted} créditos → ${analysesGranted} análises. ---`
  )
  if (DRY_RUN) {
    console.log('Nada foi alterado. Rode sem --dry-run para aplicar.')
  } else {
    console.log('\nAgora envie o comunicado (docs/comunicado-migracao.md) para os e-mails acima.')
  }
}

main()
  .catch((err) => {
    console.error('Erro na migração de saldos:', err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
