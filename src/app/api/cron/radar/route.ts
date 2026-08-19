export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { runRadar } from '@/lib/radar/runner'
import { greenhouseAdapters } from '@/lib/jobs/adapters/greenhouse'
import { leverAdapters } from '@/lib/jobs/adapters/lever'
import { createGupyAdapter } from '@/lib/jobs/adapters/gupy'
import { adzunaLastCollections, searchTermsByCountry, searchTermsFromProfiles } from '@/lib/jobs/search-terms.server'
import { estimatedRequests, planAdzunaRound } from '@/lib/jobs/adzuna-plan'
import { careerPageAdapters } from '@/lib/jobs/adapters/jsonld'
import { adzunaCredentials, createAdzunaAdapter } from '@/lib/jobs/adapters/adzuna'

/**
 * O gatilho do Radar (§28).
 *
 * O Radar "precisa funcionar mesmo quando ninguém estiver olhando a tela", e é
 * por isso que a entrada é um cron e não uma ação de usuário.
 *
 * ## Autenticação
 *
 * `CRON_SECRET`, comparado por igualdade simples com o cabeçalho
 * `Authorization`. A Vercel envia esse cabeçalho automaticamente nos crons
 * declarados em `vercel.json`.
 *
 * Sem o segredo configurado a rota responde 503 e NÃO roda. Uma rota que
 * dispara coleta e escreve no banco não pode ficar aberta porque alguém
 * esqueceu de definir uma variável de ambiente.
 *
 * ## As fontes
 *
 * O Greenhouse foi conferido contra a API real e está ligado — o que foi
 * observado, e o que continua sem observação, está no cabeçalho de
 * `lib/jobs/adapters/greenhouse.ts`.
 *
 * Quais boards a instalação varre sai de `GREENHOUSE_BOARDS` e `LEVER_BOARDS`;
 * sem essas variáveis valem os boards já conferidos. Acrescentar um board é
 * mudar a variável, não o código — mas conferir o board antes continua sendo
 * obrigatório, pelo motivo descrito lá.
 *
 * O Lever começa SEM board nenhum: o único conferido é o `leverdemo`, board de
 * demonstração do próprio Lever, e encher o Radar de vaga de mentira é pior que
 * silêncio. A fonte fica pronta esperando o primeiro token real.
 *
 * A lista é montada **dentro** do handler, e não no módulo: assim ela lê o
 * ambiente de execução, e não o do build.
 *
 * ## Limites do plano, não do desenho
 *
 * O agendamento é DIÁRIO e o teto da função é 60s porque a conta Vercel é
 * Hobby, que não aceita mais que um cron por dia nem função além de um minuto.
 * A primeira tentativa usava `0 * * * *` e 300s, e o deploy foi recusado com
 * essa mensagem.
 *
 * Isso tem custo real e visível: com uma rodada por dia e `USERS_PER_RUN`
 * usuários por rodada, a fila gira devagar. No plano Pro basta trocar o cron
 * para de hora em hora, subir `maxDuration` e aumentar `USERS_PER_RUN` — nada
 * na lógica muda.
 */
/** Prazo de cada fonte. Precisa deixar folga dentro dos 60s para a avaliação. */
const COLLECTION_BUDGET_MS = 12_000

/**
 * Quanto da janela de 60s a rodada pode usar antes de parar por conta própria.
 *
 * A margem existe para que a função **responda** em vez de ser morta pela
 * plataforma. Um 504 não diz o que rodou nem o que faltou; uma resposta com
 * `ranOutOfTime: true` diz as duas coisas — e é ela que permite saber se a
 * fila está girando.
 */
const RUN_BUDGET_MS = 45_000

/**
 * O orçamento da Adzuna, em três números.
 *
 * A cota gratuita é de 2.500 requisições por mês, ~83 por dia. Multiplicados,
 * estes três dão **12 requisições por rodada** — folga proposital, porque o que
 * sobra é o que sustenta a busca sob demanda de quem não quer esperar a
 * madrugada.
 *
 * Mexer em qualquer um deles mexe direto na conta do mês. O teste de
 * `adzuna-plan.ts` trava o resultado para que a mudança seja consciente.
 */
const ADZUNA_COUNTRIES_PER_RUN = 4
const ADZUNA_TERMS_PER_COUNTRY = 3
const ADZUNA_PAGES_PER_TERM = 1

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET não configurado. A rodada não é executada sem ele.' },
      { status: 503 }
    )
  }

  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const startedAt = Date.now()
  /**
   * A Gupy é fonte de BUSCA: precisa de termos, e eles saem dos cargos que a
   * orientação profissional recomendou aos usuários brasileiros. Sem nenhum
   * cargo declarado a fonte simplesmente não roda — buscar por palavra chutada
   * encheria o banco de vaga que ninguém pediu.
   */
  const gupyTerms = await searchTermsFromProfiles({ country: 'BR', limit: 6 })
  const adzuna = adzunaCredentials(process.env.ADZUNA_APP_ID, process.env.ADZUNA_APP_KEY)

  /**
   * O rodízio da Adzuna.
   *
   * Uma página por termo, três termos por país, quatro países por rodada — doze
   * requisições, contra as ~83 diárias que a cota mensal permite. A folga é
   * deliberada: ela é o que sobra para a busca sob demanda, que serve uma pessoa
   * enquanto esta rodada serve todas.
   */
  const [termsByCountry, lastCollections] = adzuna
    ? await Promise.all([searchTermsByCountry(), adzunaLastCollections()])
    : [new Map<string, string[]>(), new Map<string, Date | null>()]

  const adzunaPlans = planAdzunaRound(
    [...termsByCountry.entries()].map(([country, terms]) => ({
      country: country.toLowerCase(),
      terms,
      lastCollectionAt: lastCollections.get(country.toLowerCase()) ?? null,
    })),
    { maxCountries: ADZUNA_COUNTRIES_PER_RUN, maxTermsPerCountry: ADZUNA_TERMS_PER_COUNTRY }
  )

  const adapters = [
    ...greenhouseAdapters(process.env.GREENHOUSE_BOARDS),
    ...leverAdapters(process.env.LEVER_BOARDS),
    ...(gupyTerms.length > 0 ? [createGupyAdapter({ terms: gupyTerms })] : []),
    ...careerPageAdapters(process.env.CAREER_PAGES),
    // A Adzuna atende dez mercados, mas a cota gratuita não cabe todos toda
    // noite. O rodízio escolhe quem esperou mais — ver `adzuna-plan.ts`.
    ...adzunaPlans.map((plan) =>
      createAdzunaAdapter({
        credentials: adzuna!,
        country: plan.country,
        terms: plan.terms,
        maxPagesPerTerm: ADZUNA_PAGES_PER_TERM,
      })
    ),
  ]

  try {
    const summary = await runRadar({
      adapters,
      collectionBudgetMs: COLLECTION_BUDGET_MS,
      deadlineAt: startedAt + RUN_BUDGET_MS,
    })

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      sourcesConfigured: adapters.length,
      sources: adapters.map((a) => a.descriptor.slug),
      // Declarado para que uma rodada sem resultado na Gupy possa ser
      // explicada: nenhum termo é diferente de nenhuma vaga.
      gupyTerms,
      // O mesmo para a Adzuna, mais o consumo de cota da rodada — sem isso,
      // saber quanto do mês já foi gasto exigiria adivinhação.
      adzunaPlans,
      adzunaRequests: estimatedRequests(adzunaPlans, ADZUNA_PAGES_PER_TERM),
      ...summary,
    })
  } catch (e: any) {
    console.error('[cron/radar] rodada falhou:', e?.message || e)
    return NextResponse.json(
      { ok: false, error: e?.message || 'Falha na rodada do Radar.', durationMs: Date.now() - startedAt },
      { status: 500 }
    )
  }
}
