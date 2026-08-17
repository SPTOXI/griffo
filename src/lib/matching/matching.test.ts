import test from 'node:test'
import assert from 'node:assert/strict'
import { EMPTY_PROFILE, type ProfessionalProfile } from '../profile'
import { normalizeJob } from '../jobs/normalize'
import type { NormalizedJob, RawJob } from '../jobs/types'
import { applyHardFilters, filterJobs, targetMarketsOf } from './filters'
import {
  contextualAxis,
  internalSignalScore,
  jobFitAxis,
  matchJob,
  professionalAxis,
} from './compatibility'
import { buildJobFit, jobPromptContext } from './job-fit'

const profileWith = (patch: Partial<ProfessionalProfile>): ProfessionalProfile => ({
  ...EMPTY_PROFILE,
  ...patch,
})

const job = (patch: Partial<RawJob> = {}): NormalizedJob =>
  normalizeJob(
    {
      company: 'Empresa X',
      title: 'Data Analyst',
      applicationUrl: 'https://exemplo.com/v/1',
      ...patch,
    },
    { sourceSlug: 'test' }
  )

/* ================================================================== *
 * §16 — Filtro duro
 *
 * A regra que governa: DESCONHECIDO NUNCA ELIMINA. Descartar por
 * ausência de informação transforma silêncio da fonte em rejeição ao
 * candidato — e ele nunca fica sabendo que a vaga existiu.
 * ================================================================== */

test('modelo de trabalho desconhecido não elimina a vaga', () => {
  // Uma vaga que não diz o modelo não é uma vaga presencial.
  const profile = profileWith({ workModes: ['remote'] })
  const outcome = applyHardFilters(job({ remoteType: null }), profile)
  assert.equal(outcome.eligible, true)
})

test('modelo de trabalho declarado e recusado elimina', () => {
  const profile = profileWith({ workModes: ['remote'] })
  const outcome = applyHardFilters(job({ remoteType: 'onsite', country: 'BR' }), profile)
  assert.ok(outcome.reasons.includes('work_mode_rejected'))
})

test('senioridade desconhecida dos dois lados não elimina', () => {
  assert.equal(applyHardFilters(job(), profileWith({})).eligible, true)
})

test('senioridade abaixo da pedida elimina', () => {
  const profile = profileWith({ seniority: 'junior' })
  const outcome = applyHardFilters(job({ seniority: 'senior' }), profile)
  assert.ok(outcome.reasons.includes('seniority_below'))
})

test('senioridade acima da pedida passa', () => {
  const profile = profileWith({ seniority: 'senior' })
  assert.equal(applyHardFilters(job({ seniority: 'mid' }), profile).eligible, true)
})

test('perfil vazio vê todas as vagas', () => {
  // Melhor ver tudo que ver nada enquanto a pessoa ainda não disse o que quer.
  const outcome = applyHardFilters(job({ country: 'JP', remoteType: 'onsite', seniority: 'senior' }), EMPTY_PROFILE)
  assert.equal(outcome.eligible, true)
})

test('vaga de mercado fora dos alvos é eliminada', () => {
  const profile = profileWith({ primaryMarket: 'BR', alternativeMarkets: ['PT'] })
  const outcome = applyHardFilters(job({ country: 'JP' }), profile)
  assert.ok(outcome.reasons.includes('market_not_targeted'))
})

test('mercado alternativo declarado é aceito', () => {
  const profile = profileWith({ primaryMarket: 'BR', alternativeMarkets: ['PT'] })
  assert.equal(applyHardFilters(job({ country: 'PT' }), profile).eligible, true)
})

test('quem aceita remoto internacional recebe vaga remota de qualquer mercado', () => {
  // Declarar abertura ao mundo não pode excluir as vagas do mundo.
  const profile = profileWith({ primaryMarket: 'BR', openToInternationalRemote: true })
  const outcome = applyHardFilters(job({ country: 'US', remoteType: 'remote' }), profile)
  assert.equal(outcome.eligible, true)
})

test('remoto internacional inclui o mercado GLOBAL nos alvos', () => {
  const markets = targetMarketsOf(profileWith({ primaryMarket: 'BR', openToInternationalRemote: true }))
  assert.ok(markets.includes('GLOBAL'))
  assert.ok(markets.includes('BR'))
})

test('vaga presencial em outro país elimina quem não quer mudar', () => {
  const profile = profileWith({
    residenceCountry: 'BR',
    primaryMarket: 'BR',
    openToRelocation: false,
  })
  const outcome = applyHardFilters(job({ country: 'PT', remoteType: 'onsite' }), profile)
  assert.ok(outcome.reasons.includes('market_not_targeted') || outcome.reasons.includes('location_incompatible'))
})

test('vaga remota nunca é eliminada por localização', () => {
  // Vaga remota não tem localização incompatível.
  const profile = profileWith({
    residenceCountry: 'BR',
    primaryMarket: 'US',
    workModes: ['remote'],
  })
  const outcome = applyHardFilters(job({ country: 'US', remoteType: 'remote' }), profile)
  assert.equal(outcome.eligible, true)
  assert.ok(!outcome.reasons.includes('location_incompatible'))
})

test('vaga encerrada nunca é elegível', () => {
  const outcome = applyHardFilters({ ...job(), closedAt: new Date() }, EMPTY_PROFILE)
  assert.ok(outcome.reasons.includes('job_closed'))
})

test('contrato é comparado de forma frouxa', () => {
  // "CLT" e "Efetivo CLT" são o mesmo vínculo; exigir igualdade exata
  // eliminaria vagas boas por diferença de redação.
  const profile = profileWith({ contractTypes: ['CLT'] })
  assert.equal(applyHardFilters(job({ employmentType: 'Efetivo CLT' }), profile).eligible, true)
  assert.ok(
    applyHardFilters(job({ employmentType: 'Estágio' }), profile).reasons.includes('contract_type_rejected')
  )
})

test('o lote separa elegíveis de rejeitadas com motivo', () => {
  const profile = profileWith({ workModes: ['remote'], primaryMarket: 'BR' })
  const { eligible, rejected } = filterJobs(
    [
      job({ country: 'BR', remoteType: 'remote' }),
      job({ country: 'BR', remoteType: 'onsite', applicationUrl: 'https://exemplo.com/v/2' }),
    ],
    profile
  )
  assert.equal(eligible.length, 1)
  assert.equal(rejected.length, 1)
  assert.ok(rejected[0].outcome.reasons.length > 0)
  assert.match(rejected[0].outcome.explanation, /Não elegível/)
})

/* ================================================================== *
 * §9 — Três eixos, e §17 — sem promessa de contratação
 * ================================================================== */

test('§17: o veredito é qualitativo, nunca percentual de contratação', () => {
  const result = matchJob(profileWith({ skills: ['SQL'] }), job({ requirements: ['SQL'] }))
  assert.match(result.headline, /compatibilidade/)
  assert.ok(!/\d+%/.test(result.headline), 'a frase do veredito não pode conter percentual')
  assert.ok(!/chance|probabilidade|contratad/i.test(result.headline))
})

test('§9: os três eixos são independentes e não se somam na saída', () => {
  const result = matchJob(profileWith({ skills: ['SQL'] }), job({ requirements: ['SQL', 'Python'] }))
  assert.ok('professional' in result)
  assert.ok('jobFit' in result)
  assert.ok('contextual' in result)
  // Não existe campo de score único no resultado exibível.
  assert.ok(!('score' in result))
})

test('o sinal interno existe, mas fora do resultado exibível', () => {
  const result = matchJob(profileWith({ skills: ['SQL'] }), job({ requirements: ['SQL'] }))
  const signal = internalSignalScore(result)
  assert.ok(signal >= 0 && signal <= 100)
})

test('o eixo da vaga mede requisitos atendidos contra pedidos', () => {
  const axis = jobFitAxis(
    profileWith({ skills: ['SQL', 'Power BI'] }),
    job({ requirements: ['SQL', 'Power BI', 'Python', 'Inglês avançado'] })
  )
  assert.equal(axis.score, 50)
  assert.ok(axis.evidence[0].includes('2 de 4'))
  assert.ok(axis.gaps[0].includes('Python'))
})

test('vaga sem requisitos publicados não vira aderência alta', () => {
  // Vaga que não lista requisitos não é vaga sem requisitos.
  const axis = jobFitAxis(profileWith({ skills: ['SQL'] }), job({ requirements: [] }))
  assert.equal(axis.level, 'medium')
  assert.ok(axis.gaps[0].includes('não lista requisitos'))
})

test('a competência casa mesmo escrita de outro jeito', () => {
  const axis = jobFitAxis(profileWith({ skills: ['SQL'] }), job({ requirements: ['SQL avançado'] }))
  assert.equal(axis.score, 100)
})

test('o eixo profissional reconhece o cargo entre idiomas', () => {
  // É aqui que a taxonomia da Etapa 3 paga: o perfil diz "Analista de Dados",
  // a vaga diz "Data Analyst".
  const axis = professionalAxis(profileWith({ currentTitle: 'Analista de Dados' }), job({ title: 'Data Analyst' }))
  assert.ok(axis.evidence.some((e) => e.includes('mesmo cargo')))
  assert.ok(axis.score > 50)
})

test('o eixo contextual tem poder de veto sobre o veredito', () => {
  // Encaixe profissional perfeito, mas vaga inviável: não é "forte".
  const profile = profileWith({
    currentTitle: 'Data Analyst',
    seniority: 'senior',
    skills: ['SQL', 'Python'],
    residenceCountry: 'BR',
    openToRelocation: false,
    openToInternationalRemote: false,
  })
  const result = matchJob(
    profile,
    job({ title: 'Data Analyst', seniority: 'senior', requirements: ['SQL', 'Python'], country: 'JP', remoteType: 'onsite' })
  )
  assert.equal(result.overall, 'weak')
  assert.ok(result.blockers.length > 0)
})

test('salário só é comparado quando moeda e período batem', () => {
  // Comparar valores em moedas diferentes produz conclusão errada com aparência
  // de precisão.
  const profile = profileWith({ salaryMin: 15000, salaryCurrency: 'BRL', salaryPeriod: 'month' })
  const mesmaMoeda = contextualAxis(
    profile,
    job({ salaryMax: 8000, currency: 'BRL', salaryPeriod: 'mensal' })
  )
  assert.ok(mesmaMoeda.gaps.some((g) => g.includes('abaixo da sua pretensão')))

  const moedaDiferente = contextualAxis(
    profile,
    job({ salaryMax: 8000, currency: 'USD', salaryPeriod: 'mensal' })
  )
  assert.ok(!moedaDiferente.gaps.some((g) => g.includes('abaixo da sua pretensão')))
})

test('perfil bem preenchido em vaga aderente vira recomendação de candidatura', () => {
  const profile = profileWith({
    currentTitle: 'Data Analyst',
    seniority: 'senior',
    yearsExperience: 6,
    skills: ['SQL', 'Python', 'Power BI'],
    residenceCountry: 'BR',
    primaryMarket: 'BR',
    workModes: ['remote', 'hybrid'],
    spokenLanguages: [{ code: 'pt', level: 'native' }],
  })
  const result = matchJob(
    profile,
    job({
      title: 'Data Analyst',
      seniority: 'senior',
      requirements: ['SQL', 'Python', 'Power BI'],
      country: 'BR',
      remoteType: 'remote',
      language: 'pt',
    })
  )
  assert.equal(result.overall, 'strong')
  assert.equal(result.recommendation, 'apply')
})

test('toda lacuna é dita, não escondida atrás do veredito', () => {
  const result = matchJob(
    profileWith({ skills: ['SQL'] }),
    job({ requirements: ['SQL', 'Python', 'Inglês avançado'] })
  )
  const todasLacunas = [...result.professional.gaps, ...result.jobFit.gaps, ...result.contextual.gaps]
  assert.ok(todasLacunas.some((g) => g.includes('Python')))
})

test('perfil vazio produz diagnóstico honesto sobre a própria limitação', () => {
  const result = matchJob(EMPTY_PROFILE, job({ requirements: ['SQL'] }))
  const lacunas = [...result.professional.gaps, ...result.jobFit.gaps]
  assert.ok(lacunas.some((g) => /perfil profissional tem poucos dados|não declarou competências/.test(g)))
})

/* ================================================================== *
 * §18, §19, §20 — Job Fit: o match virando ação
 * ================================================================== */

test('§18: o Job Fit não para em "você combina"', () => {
  const profile = profileWith({ currentTitle: 'Data Analyst', skills: ['SQL'] })
  const j = job({ title: 'Data Analyst', requirements: ['SQL', 'Python'], country: 'BR', city: 'São Paulo', remoteType: 'hybrid' })
  const view = buildJobFit(j, matchJob(profile, j), profile)

  assert.ok(view.whyRecommended.length > 0, 'sem bloco "por que recomendamos"')
  assert.ok(view.attention.length > 0, 'sem bloco "atenção"')
  assert.ok(view.actions.length > 0, 'sem bloco "prepare-se"')
  assert.equal(view.workMode, 'Híbrido')
  assert.equal(view.location, 'São Paulo, BR')
})

test('§17: o card fala de compatibilidade, nunca de chance', () => {
  const profile = profileWith({ skills: ['SQL'] })
  const j = job({ requirements: ['SQL'] })
  const view = buildJobFit(j, matchJob(profile, j), profile)

  assert.ok(['Alta', 'Boa', 'Parcial', 'Baixa'].includes(view.compatibility))
  assert.ok(!/%|chance|probabilidade/i.test(view.compatibility))
  assert.ok(!/%|chance de ser contratad/i.test(view.recommendation))
})

test('§18: impedimento aparece separado do ponto de atenção', () => {
  // Os dois pedem reações opostas: um se resolve estudando, o outro não.
  const profile = profileWith({
    residenceCountry: 'BR',
    openToRelocation: false,
    openToInternationalRemote: false,
    skills: ['SQL'],
  })
  const j = job({ country: 'JP', remoteType: 'onsite', requirements: ['SQL'] })
  const view = buildJobFit(j, matchJob(profile, j), profile)

  assert.ok(view.blockers.length > 0)
  assert.ok(!view.attention.some((a) => view.blockers.includes(a)), 'impedimento vazou para atenção')
})

test('vaga desaconselhada não empurra o usuário para a candidatura', () => {
  const profile = profileWith({
    residenceCountry: 'BR',
    openToRelocation: false,
    openToInternationalRemote: false,
  })
  const j = job({ country: 'JP', remoteType: 'onsite' })
  const view = buildJobFit(j, matchJob(profile, j), profile)

  assert.equal(view.actions.filter((a) => a.primary).length, 0, 'destacou ação numa vaga que o diagnóstico desaconselha')
})

test('vaga aderente tem uma ação principal, e é o currículo', () => {
  // Candidatar-se antes de adaptar o currículo é o erro que o produto existe
  // para evitar.
  const profile = profileWith({
    currentTitle: 'Data Analyst',
    seniority: 'senior',
    skills: ['SQL', 'Python'],
    residenceCountry: 'BR',
    primaryMarket: 'BR',
  })
  const j = job({ title: 'Data Analyst', seniority: 'senior', requirements: ['SQL', 'Python'], country: 'BR' })
  const view = buildJobFit(j, matchJob(profile, j), profile)

  const primary = view.actions.filter((a) => a.primary)
  assert.equal(primary.length, 1)
  assert.equal(primary[0].id, 'tailor_resume')
})

test('§19: o contexto da vaga leva as lacunas para o prompt', () => {
  // Uma carta escrita sabendo o que falta pode tratar a ausência com
  // honestidade em vez de contorná-la.
  const profile = profileWith({ skills: ['SQL'] })
  const j = job({ requirements: ['SQL', 'Python'], description: 'Vaga de dados.' })
  const context = jobPromptContext(j, matchJob(profile, j))

  assert.match(context, /VAGA ENCONTRADA PELO RADAR/)
  assert.match(context, /LACUNAS IDENTIFICADAS/)
  assert.match(context, /não afirme que ele tem o que não tem/)
  assert.match(context, /Python/)
})
