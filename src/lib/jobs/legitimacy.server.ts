import 'server-only'
import { db } from '@/lib/db'
import {
  assessJobsWithCounts,
  roleKey,
  type LegitimacyAssessment,
  type LegitimacyJobRow,
} from './legitimacy'

/**
 * A metade do sinal de legitimidade que precisa do banco: quantas vezes cada
 * par (empresa, cargo) do lote já foi publicado.
 *
 * Tudo o que decide está em `legitimacy.ts`, testado sem banco. Aqui só a
 * consulta — de propósito, porque é a parte que não dá para provar com teste
 * unitário e é onde um erro é mais barato de ler do que de cobrir.
 *
 * ## Por que não guardar o nível numa coluna
 *
 * A fase 2 estava planejada como "persistir o nível". Ao escrever, o plano se
 * mostrou errado para metade dos sinais: `evergreen` depende de `now` (uma
 * vaga gravada como `ok` no dia 1 vira anúncio perpétuo no dia 120 sem que
 * nada nela mude) e `recirculated` depende de quantas irmãs já existem, que
 * cresce. Um nível gravado na coleta estaria desatualizado na leitura seguinte
 * — e um dado errado no banco é pior que dado nenhum, porque parece confiável.
 *
 * Então nada é persistido: o lote é avaliado na leitura, com UMA consulta
 * agregada para o lote inteiro. Se um dia for preciso FILTRAR por nível em
 * SQL, aí sim vale uma coluna desnormalizada — e ela terá de ser recalculada
 * na coleta, com o custo de staleness assumido de olhos abertos.
 */

/**
 * Uma consulta agregada para o lote inteiro.
 *
 * O filtro é o produto cartesiano das empresas pelos cargos do lote, não a
 * lista exata de pares — SQL não recebe `(a, b) IN ((…), (…))` pelo Prisma. O
 * excesso é inofensivo: volta a contagem de alguns pares que ninguém consulta,
 * e cada par continua contado corretamente. O que importa é que não falta par.
 *
 * **A contagem inclui vaga fechada, de propósito.** Recirculação é justamente
 * o histórico: uma empresa que abriu, fechou e reabriu o mesmo cargo três
 * vezes é o caso que o sinal procura. Contar só as abertas cegaria o sinal
 * exatamente onde ele serve.
 *
 * Ressalva honesta sobre o que a contagem é: linhas de `Job` com aquele par.
 * Como `dedupeKey` é única, cada linha é uma publicação distinta — mas se a
 * deduplicação entre fontes falhar, uma publicação real vira duas linhas e
 * infla a contagem. O piso de 3 dá folga para isso; é o motivo de ele não ser 2.
 */
async function countPostingsByRole(
  jobs: readonly LegitimacyJobRow[]
): Promise<Map<string, number>> {
  const companyKeys = new Set<string>()
  const normalizedTitles = new Set<string>()

  for (const job of jobs) {
    if (!job.normalizedTitle) continue
    companyKeys.add(job.companyKey)
    normalizedTitles.add(job.normalizedTitle)
  }

  // Lote sem nenhum cargo reconhecido não tem o que agrupar. Sem esta saída, o
  // `in: []` viraria uma consulta que varre para devolver nada.
  if (normalizedTitles.size === 0) return new Map()

  const grouped = await db.job.groupBy({
    by: ['companyKey', 'normalizedTitle'],
    where: {
      companyKey: { in: [...companyKeys] },
      normalizedTitle: { in: [...normalizedTitles] },
    },
    _count: { _all: true },
  })

  const counts = new Map<string, number>()
  for (const row of grouped) {
    const key = roleKey(row.companyKey, row.normalizedTitle)
    if (key) counts.set(key, row._count._all)
  }
  return counts
}

/**
 * Avalia a legitimidade de um lote de vagas abertas.
 *
 * Devolve um mapa `id da vaga → avaliação`. Toda vaga do lote entra no mapa,
 * inclusive as `ok`: quem chama não precisa distinguir "avaliada e limpa" de
 * "não avaliada".
 */
export async function assessLegitimacyForJobs(
  jobs: readonly LegitimacyJobRow[],
  now: Date = new Date()
): Promise<Map<string, LegitimacyAssessment>> {
  if (jobs.length === 0) return new Map()
  return assessJobsWithCounts(jobs, await countPostingsByRole(jobs), now)
}
