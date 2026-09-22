import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

/**
 * Toda rota de cron tem alguém que a chama?
 *
 * ## O bug que criou este arquivo
 *
 * `/api/cron/retention` não existia, mas `runRetentionPurge` sim — e o único
 * caminho até ele era um humano clicando no painel de admin. A documentação
 * afirmava que o gatilho era o cron do Radar. Não era, nunca foi, e o sintoma
 * foi nenhum: o cron rodava, respondia 200, coletava vagas, e o expurgo
 * simplesmente não acontecia. Descoberto só quando alguém foi conferir o
 * NÚMERO no banco e viu que nada tinha sido apagado.
 *
 * Rota de cron sem gatilho é código que parece agendado e não está. Não falha,
 * não avisa, não aparece em log — só não acontece. Este teste torna esse
 * estado impossível de passar despercebido.
 *
 * ## Os dois gatilhos legítimos
 *
 * - `vercel.json`, para o que a Vercel agenda;
 * - `.github/workflows/*.yml`, para o que não coube lá — o plano Hobby dá
 *   direito a DOIS crons, e o terceiro em diante vive no GitHub Actions
 *   (precedente do §2.101, `hiring-index`).
 */

const raiz = process.cwd()

function rotasDeCron(): string[] {
  return readdirSync(join(raiz, 'src/app/api/cron'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
}

function vercelJson(): { crons?: { path: string }[] } {
  return JSON.parse(readFileSync(join(raiz, 'vercel.json'), 'utf8'))
}

function workflows(): string {
  const dir = join(raiz, '.github/workflows')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n')
}

test('TODA ROTA DE CRON TEM GATILHO — no Vercel ou no GitHub Actions', () => {
  const agendadosNoVercel = new Set((vercelJson().crons ?? []).map((c) => c.path))
  const textoDosWorkflows = workflows()

  for (const rota of rotasDeCron()) {
    const caminho = `/api/cron/${rota}`
    const temGatilho = agendadosNoVercel.has(caminho) || textoDosWorkflows.includes(caminho)
    assert.ok(
      temGatilho,
      `${caminho} não é chamada por vercel.json nem por nenhum workflow — ` +
        `é uma rota que parece agendada e não está`
    )
  }
})

test('o vercel.json respeita o teto de dois crons do plano Hobby', () => {
  // Um terceiro cron ali não falha ruidosamente: é ignorado. Se algum dia o
  // plano virar Pro, este teste é o lugar certo para relaxar a regra — de
  // propósito, e não por acidente.
  assert.ok(
    (vercelJson().crons ?? []).length <= 2,
    'o plano Hobby agenda no máximo dois crons; o excedente é ignorado em silêncio'
  )
})

test('nenhuma rota de cron fica sem autenticação', () => {
  // Rotas de cron apagam dado, gastam IA paga e escrevem no banco. Todas
  // precisam passar por `cronAuthorized` — e responder 503, não 200, quando o
  // segredo não está configurado.
  for (const rota of rotasDeCron()) {
    const fonte = readFileSync(join(raiz, 'src/app/api/cron', rota, 'route.ts'), 'utf8')
    assert.match(fonte, /cronAuthorized/, `/api/cron/${rota} não confere o segredo`)
    assert.match(fonte, /503/, `/api/cron/${rota} não fecha quando falta CRON_SECRET`)
  }
})

test('a retenção não divide os 60s com a coleta do Radar', () => {
  // `purgeAgedJobs` sozinho pode gastar quase o orçamento inteiro (até 20
  // transações de 20s). Pendurá-lo no cron do Radar faria as duas cargas
  // terminarem pela metade, e a cortada seria sempre a última.
  const radar = readFileSync(join(raiz, 'src/app/api/cron/radar/route.ts'), 'utf8')
  assert.doesNotMatch(radar, /runRetentionPurge/)
})
