import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveMarket } from '../market'
import {
  EMPTY_PROFILE,
  fromRecord,
  marketInputFrom,
  professionalProfileInputSchema,
  profilePromptContext,
  resumeLanguageFor,
  toRecordData,
  type ProfessionalProfile,
} from './index'

const profileWith = (patch: Partial<ProfessionalProfile>): ProfessionalProfile => ({
  ...EMPTY_PROFILE,
  ...patch,
})

/* ------------------------------------------------------------------ *
 * Derivação de mercado — a razão de ser desta etapa
 * ------------------------------------------------------------------ */

test('o mercado-alvo declarado vence a residência', () => {
  // O caso central do produto global: mora no Brasil, quer trabalhar nos EUA.
  // Antes desta etapa, `targetCountry` nunca era preenchido e o mercado caía
  // na residência — devolvendo conselho de mercado brasileiro a quem será
  // triado nos Estados Unidos.
  const profile = profileWith({ residenceCountry: 'BR', primaryMarket: 'US' })
  const { market, source } = resolveMarket(marketInputFrom(profile, { language: 'pt' }))

  assert.equal(market.id, 'US')
  assert.equal(source, 'target')
})

test('sem mercado declarado, a residência do perfil vale', () => {
  const profile = profileWith({ residenceCountry: 'PT' })
  const { market, source } = resolveMarket(marketInputFrom(profile, { language: 'en' }))

  assert.equal(market.id, 'PT')
  assert.equal(source, 'residence')
})

test('a residência do perfil vence a do país de acesso', () => {
  // Quem viaja não muda de mercado. O declarado no perfil é mais confiável que
  // o IP do momento.
  const profile = profileWith({ residenceCountry: 'BR' })
  const { market } = resolveMarket(
    marketInputFrom(profile, { residenceCountry: 'DE', language: 'en' })
  )

  assert.equal(market.id, 'BR')
})

test('sem perfil nenhum, cai no país de acesso', () => {
  const { market, source } = resolveMarket(
    marketInputFrom(null, { residenceCountry: 'ES', language: 'pt' })
  )

  assert.equal(market.id, 'ES')
  assert.equal(source, 'residence')
})

test('quem aceita remoto internacional e não declarou mercado vai para o global', () => {
  // Concorrer a vaga remota mundo afora não deve ser avaliado pelas convenções
  // do país onde a pessoa dorme.
  const profile = profileWith({ residenceCountry: 'BR', openToInternationalRemote: true })
  const { market, source } = resolveMarket(marketInputFrom(profile, { language: 'pt' }))

  assert.equal(market.id, 'GLOBAL')
  assert.equal(source, 'target')
})

test('mercado declarado vence o remoto internacional', () => {
  const profile = profileWith({
    residenceCountry: 'BR',
    primaryMarket: 'PT',
    openToInternationalRemote: true,
  })
  assert.equal(resolveMarket(marketInputFrom(profile, { language: 'pt' })).market.id, 'PT')
})

test('o país de pagamento não entra na derivação de mercado', () => {
  // A regra estrutural: `marketInputFrom` não tem por onde receber
  // `paymentCountry`. Este teste falha se alguém acrescentar o campo.
  const input = marketInputFrom(profileWith({ primaryMarket: 'US' }), { language: 'pt' })
  assert.deepEqual(Object.keys(input).sort(), ['language', 'residenceCountry', 'targetCountry'])
})

/* ------------------------------------------------------------------ *
 * Idioma do currículo ≠ idioma da interface (§32)
 * ------------------------------------------------------------------ */

test('a preferência declarada decide o idioma do currículo', () => {
  const profile = profileWith({ resumeLanguage: 'en', primaryMarket: 'BR' })
  assert.equal(resumeLanguageFor(profile, 'pt', 'pt'), 'en')
})

test('com mercado-alvo e sem preferência, vale o idioma das vagas do mercado', () => {
  // Tela em português, mercado alvo nos EUA: o currículo sai em inglês.
  const profile = profileWith({ primaryMarket: 'US' })
  assert.equal(resumeLanguageFor(profile, 'en', 'pt'), 'en')
})

test('sem perfil, o idioma da interface é o último recurso', () => {
  assert.equal(resumeLanguageFor(null, 'en', 'pt'), 'pt')
  assert.equal(resumeLanguageFor(profileWith({}), 'en', 'es'), 'es')
})

/* ------------------------------------------------------------------ *
 * Leitura tolerante
 * ------------------------------------------------------------------ */

test('perfil ausente devolve o perfil vazio, não erro', () => {
  assert.deepEqual(fromRecord(null), EMPTY_PROFILE)
  assert.deepEqual(fromRecord(undefined), EMPTY_PROFILE)
})

test('campo JSON corrompido vira lista vazia em vez de derrubar a rota', () => {
  // O perfil é lido no caminho da análise, que já foi paga. Lançar aqui
  // trocaria um dado perdido por um laudo perdido.
  const parsed = fromRecord({ skills: '{isso não é json', targetRoles: '"nem isso"' })
  assert.deepEqual(parsed.skills, [])
  assert.deepEqual(parsed.targetRoles, [])
})

test('valor fora do conjunto permitido é descartado, não propagado', () => {
  const parsed = fromRecord({ seniority: 'imperador', weeklyHours: 'quando der' })
  assert.equal(parsed.seniority, null)
  assert.equal(parsed.weeklyHours, null)
})

test('códigos de país e mercado são normalizados para maiúsculas', () => {
  const parsed = fromRecord({
    residenceCountry: ' br ',
    primaryMarket: 'pt',
    alternativeMarkets: '["es","us"]',
  })
  assert.equal(parsed.residenceCountry, 'BR')
  assert.equal(parsed.primaryMarket, 'PT')
  assert.deepEqual(parsed.alternativeMarkets, ['ES', 'US'])
})

test('idioma falado sem nível declarado é descartado', () => {
  const parsed = fromRecord({
    spokenLanguages: '[{"code":"en","level":"advanced"},{"code":"fr"},{"level":"native"}]',
  })
  assert.deepEqual(parsed.spokenLanguages, [{ code: 'en', level: 'advanced' }])
})

/* ------------------------------------------------------------------ *
 * Gravação parcial
 * ------------------------------------------------------------------ */

test('gravação parcial não apaga o que não mencionou', () => {
  // A tela salva em partes. Se `toRecordData` devolvesse o objeto inteiro,
  // salvar só o cargo zeraria competências, mercados e pretensão.
  const data = toRecordData({ currentTitle: 'Analista de Dados' })
  assert.deepEqual(Object.keys(data), ['currentTitle'])
})

test('null explícito limpa o campo', () => {
  const data = toRecordData({ currentTitle: null })
  assert.equal(data.currentTitle, null)
})

test('listas são serializadas como JSON', () => {
  const data = toRecordData({ skills: ['SQL', 'Python'] })
  assert.equal(data.skills, '["SQL","Python"]')
})

test('mercados são gravados em maiúsculas', () => {
  const data = toRecordData({ primaryMarket: 'us', alternativeMarkets: ['pt', 'es'] })
  assert.equal(data.primaryMarket, 'US')
  assert.equal(data.alternativeMarkets, '["PT","ES"]')
})

/* ------------------------------------------------------------------ *
 * Validação de entrada
 * ------------------------------------------------------------------ */

test('pretensão máxima menor que a mínima é recusada', () => {
  const result = professionalProfileInputSchema.safeParse({ salaryMin: 9000, salaryMax: 5000 })
  assert.equal(result.success, false)
})

test('pretensão só com mínimo é aceita', () => {
  assert.equal(professionalProfileInputSchema.safeParse({ salaryMin: 9000 }).success, true)
})

test('perfil vazio é entrada válida', () => {
  // Preencher aos poucos precisa ser possível — inclusive não preencher nada.
  assert.equal(professionalProfileInputSchema.safeParse({}).success, true)
})

test('senioridade inventada é recusada na entrada', () => {
  assert.equal(professionalProfileInputSchema.safeParse({ seniority: 'imperador' }).success, false)
})

/* ------------------------------------------------------------------ *
 * Bloco de prompt
 * ------------------------------------------------------------------ */

test('perfil vazio não produz bloco de prompt', () => {
  // Uma seção dizendo que não há informação gasta atenção do modelo à toa.
  assert.equal(profilePromptContext(null), '')
  assert.equal(profilePromptContext(EMPTY_PROFILE), '')
})

test('o bloco só cita o que foi declarado', () => {
  // `career` por extenso: cargo atual e cargos-alvo só existem nesse escopo.
  const prompt = profilePromptContext(
    profileWith({ currentTitle: 'Analista de Dados', targetRoles: ['Data Analyst'] }),
    'career'
  )
  assert.ok(prompt.includes('Analista de Dados'))
  assert.ok(prompt.includes('Data Analyst'))
  assert.ok(!prompt.includes('Pretensão salarial'), 'citou campo que não foi preenchido')
  assert.ok(!prompt.includes('Jornada'), 'citou campo que não foi preenchido')
})

test('a pretensão salarial entra com moeda e período', () => {
  const prompt = profilePromptContext(
    profileWith({ salaryMin: 8000, salaryMax: 12000, salaryCurrency: 'BRL', salaryPeriod: 'month' })
  )
  assert.ok(prompt.includes('BRL 8000 a 12000/month'), prompt)
})

test('escopo de documento não afirma quem o candidato é', () => {
  // O caso real: o perfil foi preenchido a partir de um currículo de
  // biomedicina, e depois um currículo de advogado foi enviado. O bloco de
  // perfil ia inteiro para o prompt, ANTES do currículo, e o laudo do advogado
  // saía sobre biomedicina.
  const biomedico = {
    ...EMPTY_PROFILE,
    currentTitle: 'Biomédico',
    field: 'Saúde',
    seniority: 'senior' as const,
    yearsExperience: 12,
    specializations: ['Análises clínicas'],
    targetRoles: ['Biomédico'],
    residenceCountry: 'BR',
    openToRelocation: true,
  }

  const prompt = profilePromptContext(biomedico, 'document')

  assert.ok(!/Biomédico/i.test(prompt), 'cargo não pode vazar para a análise de outro currículo')
  assert.ok(!/Saúde/i.test(prompt))
  assert.ok(!/Análises clínicas/i.test(prompt))
  // Rótulo não, VALOR: o cabeçalho novo cita "senioridade" ao dizer que ela sai
  // do currículo, e é exatamente isso que se quer.
  assert.ok(!/- Senioridade:/i.test(prompt))
  assert.ok(!/- Anos de experiência:/i.test(prompt))
  assert.ok(!/12/.test(prompt))
})

test('escopo de documento mantém as preferências que o currículo não declara', () => {
  const prompt = profilePromptContext(
    {
      ...EMPTY_PROFILE,
      residenceCountry: 'BR',
      openToInternationalRemote: true,
      workModes: ['remote'],
      currentTitle: 'Biomédico',
    },
    'document'
  )

  assert.ok(/BR/.test(prompt))
  assert.ok(/remoto/i.test(prompt))
  assert.ok(!/Biomédico/i.test(prompt))
})

test('escopo de documento manda seguir o currículo, não o perfil', () => {
  // O cabeçalho antigo dizia "não contradiga sem motivo" — era ele que fazia a
  // IA preferir o perfil desatualizado ao documento que tinha à frente.
  const prompt = profilePromptContext(
    { ...EMPTY_PROFILE, residenceCountry: 'BR' },
    'document'
  )

  assert.ok(/siga o currículo/i.test(prompt))
  assert.ok(!/não contradiga/i.test(prompt))
})

test('escopo de carreira continua trazendo o perfil inteiro', () => {
  // A orientação vocacional fala sobre a PESSOA: aqui o perfil declarado é o
  // assunto, e omiti-lo esvaziaria a entrega.
  const prompt = profilePromptContext(
    { ...EMPTY_PROFILE, currentTitle: 'Biomédico', careerGoal: 'Migrar para gestão' },
    'career'
  )

  assert.ok(/Biomédico/.test(prompt))
  assert.ok(/Migrar para gestão/.test(prompt))
})

test('sem escopo declarado, o padrão é o lado seguro', () => {
  // Esquecer de declarar não pode reintroduzir o vazamento.
  const prompt = profilePromptContext({ ...EMPTY_PROFILE, currentTitle: 'Biomédico' })
  assert.ok(!/Biomédico/.test(prompt))
})
