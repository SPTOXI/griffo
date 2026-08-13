import { db } from '../lib/db'
import { CREDITS_PER_ANALYSIS, analysesForCredits, migrateCreditBalance } from '../lib/entitlements'

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
 *   bun run src/scripts/migrate-credits-to-analyses.ts --dry-run
 *   bun run src/scripts/migrate-credits-to-analyses.ts
 */

const DRY_RUN = process.argv.includes('--dry-run')

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
      console.log(`${user.email}: ${user.credits} créditos → ${analyses} análise(s)`)
    }

    // Contas sem saldo também são marcadas: sem isso, cada execução varreria
    // de novo a base inteira à procura de quem nunca teve crédito nenhum.
    if (!DRY_RUN) await migrateCreditBalance(user.id)
  }

  console.log(
    `\n--- ${pending.length} conta(s) processada(s). ${usersWithBalance} tinha(m) saldo: ` +
      `${creditsConverted} créditos → ${analysesGranted} análises. ---`
  )
  if (DRY_RUN) console.log('Nada foi alterado. Rode sem --dry-run para aplicar.')
  console.log('\nLembre de comunicar por e-mail: ninguém perdeu nada.')
}

main()
  .catch((err) => {
    console.error('Erro na migração de saldos:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
