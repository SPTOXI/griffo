import test from 'node:test'
import assert from 'node:assert/strict'
import { applySuggestion, detectProfileConflicts, parseProfileExtraction } from './extract'
import { deriveFromOrientation, parseStoredOrientation, rolesFromOrientation } from './from-orientation'
import { EMPTY_PROFILE } from './index'
import { COUNTRIES, countryName, groupedCountries, isKnownCountry } from '../market/countries'

const completo = JSON.stringify({
  currentTitle: 'Enfermeira Assistencial',
  seniority: 'senior',
  field: 'enfermagem',
  specializations: ['UTI adulto', 'urgência'],
  skills: ['ACLS', 'ventilação mecânica', 'ACLS'],
  yearsExperience: 9,
  educationLevel: 'bachelor',
  targetRoles: ['Coordenadora de Enfermagem'],
})

test('extrai o que o currículo diz', () => {
  const s = parseProfileExtraction(completo)
  assert.equal(s.currentTitle, 'Enfermeira Assistencial')
  assert.equal(s.seniority, 'senior')
  assert.equal(s.yearsExperience, 9)
  assert.equal(s.educationLevel, 'bachelor')
})

test('duplicata na lista entra uma vez só', () => {
  const s = parseProfileExtraction(completo)
  assert.deepEqual(s.skills, ['ACLS', 'ventilação mecânica'])
})

test('valor fora do conjunto permitido é DESCARTADO, não aproximado', () => {
  // "sênior demais" não vira 'senior'. Aproximar aqui poria no perfil um nível
  // que o currículo não declara, e a senioridade decide o filtro duro.
  const s = parseProfileExtraction(
    JSON.stringify({ seniority: 'guru', educationLevel: 'doutorado', currentTitle: 'X' })
  )
  assert.equal(s.seniority, undefined)
  assert.equal(s.educationLevel, undefined)
  assert.equal(s.currentTitle, 'X')
})

test('marcador não preenchido é ausência, não valor', () => {
  const s = parseProfileExtraction(
    JSON.stringify({ currentTitle: '[cargo]', field: 'não informado', skills: ['N/A'] })
  )
  assert.equal(s.currentTitle, undefined)
  assert.equal(s.field, undefined)
  assert.equal(s.skills, undefined)
})

test('anos de experiência impossíveis são recusados', () => {
  assert.equal(parseProfileExtraction(JSON.stringify({ yearsExperience: -3 })).yearsExperience, undefined)
  assert.equal(parseProfileExtraction(JSON.stringify({ yearsExperience: 200 })).yearsExperience, undefined)
  // Zero é resposta legítima: primeiro emprego.
  assert.equal(parseProfileExtraction(JSON.stringify({ yearsExperience: 0 })).yearsExperience, 0)
})

test('lista vazia é ausência, não "não tem competência nenhuma"', () => {
  assert.equal(parseProfileExtraction(JSON.stringify({ skills: [] })).skills, undefined)
})

test('resposta que não é JSON lança', () => {
  assert.throws(() => parseProfileExtraction('desculpe, não consegui'))
})

test('JSON com texto antes e depois é recuperado pelo maior bloco {...}', () => {
  // Observado em produção (ver 2.34 na auditoria): o modelo às vezes responde
  // rápido, mas com uma frase antes ou depois do objeto, além do que a
  // limpeza de markdown cobre. Descartar isso manda a pessoa preencher tudo à
  // mão por uma vaga sobra de texto, não por falta de dado real.
  const s = parseProfileExtraction(`Aqui está a leitura do currículo:\n${completo}\nEspero ter ajudado!`)
  assert.equal(s.currentTitle, 'Enfermeira Assistencial')
  assert.equal(s.yearsExperience, 9)
})

test('bloco {...} encontrado mas ainda inválido continua lançando', () => {
  // Tem chave e fecha-chave, mas o conteúdo não é JSON válido (chave e valor
  // sem aspas) — o recuo tenta e falha de novo, sem mascarar como sucesso.
  assert.throws(() => parseProfileExtraction('texto com {chave: sem aspas} no meio'))
})

test('sem chave nenhuma na resposta, nem tenta recuperar', () => {
  assert.throws(() => parseProfileExtraction('texto com { chave sem fechar corretamente'))
})

test('campo ruim não derruba os bons', () => {
  const s = parseProfileExtraction(JSON.stringify({ seniority: 'inventado', field: 'logística' }))
  assert.equal(s.field, 'logística')
})

test('a sugestão NÃO sobrescreve o que a pessoa escreveu', () => {
  // Ela sabe que mudou de área; o currículo não.
  const atual = { ...EMPTY_PROFILE, currentTitle: 'O que eu digitei', skills: ['minha'] }
  const { profile, filled } = applySuggestion(atual, {
    currentTitle: 'O que a IA leu',
    skills: ['outra'],
    field: 'enfermagem',
  })

  assert.equal(profile.currentTitle, 'O que eu digitei')
  assert.deepEqual(profile.skills, ['minha'])
  assert.equal(profile.field, 'enfermagem')
  assert.deepEqual(filled, ['field'])
})

test('preencher perfil vazio preenche tudo que veio', () => {
  const { filled } = applySuggestion(EMPTY_PROFILE, { currentTitle: 'X', skills: ['a'] })
  assert.deepEqual(filled.sort(), ['currentTitle', 'skills'])
})

// --- orientação vocacional ---

const orientacao = {
  profileSummary: 'texto',
  topMatchingAreas: [
    { role: 'Coordenação de Enfermagem', matchPercentage: 88, requiredSkillsToLearn: ['gestão de equipe'] },
    { role: 'Enfermagem do Trabalho', matchPercentage: 81, requiredSkillsToLearn: [] },
    { role: 'Coordenação de Enfermagem', matchPercentage: 70 },
  ],
  careerAdvice: 'texto',
}

test('os cargos-alvo saem das áreas recomendadas', () => {
  assert.deepEqual(rolesFromOrientation(orientacao), [
    'Coordenação de Enfermagem',
    'Enfermagem do Trabalho',
  ])
})

test('o percentual da orientação NÃO viaja para o perfil', () => {
  // Ele ordena a lista para leitura humana e não tem relação com os três eixos
  // do matching. Misturar os dois faria um número virar outro pelo caminho.
  const roles = rolesFromOrientation(orientacao)
  assert.ok(roles.every((r) => !/\d/.test(r)))
})

test('as competências A APRENDER não viram competências que a pessoa tem', () => {
  // São o que falta. Gravá-las em `skills` inventaria qualificação (§43).
  const { data } = deriveFromOrientation(EMPTY_PROFILE, orientacao)
  assert.equal((data as any).skills, undefined)
})

test('orientação malformada não deriva nada, e não lança', () => {
  assert.deepEqual(rolesFromOrientation(null), [])
  assert.deepEqual(rolesFromOrientation({ topMatchingAreas: 'não é lista' }), [])
  assert.deepEqual(rolesFromOrientation({ topMatchingAreas: [{}, { role: '' }] }), [])
  assert.equal(parseStoredOrientation('{quebrado'), null)
  assert.equal(parseStoredOrientation(null), null)
})

test('a derivação não sobrescreve cargos-alvo já escritos', () => {
  const atual = { ...EMPTY_PROFILE, targetRoles: ['O que eu quero'] }
  const { data, filled } = deriveFromOrientation(atual, orientacao)
  assert.equal(data.targetRoles, undefined)
  assert.ok(!filled.includes('targetRoles'))
})

test('o país de acesso entra só quando não há país declarado', () => {
  const semPais = deriveFromOrientation(EMPTY_PROFILE, orientacao, { fallbackCountry: 'br' })
  assert.equal(semPais.data.residenceCountry, 'BR')

  const comPais = deriveFromOrientation(
    { ...EMPTY_PROFILE, residenceCountry: 'PT' },
    orientacao,
    { fallbackCountry: 'BR' }
  )
  assert.equal(comPais.data.residenceCountry, undefined)
})

test('país de acesso inválido é ignorado', () => {
  const r = deriveFromOrientation(EMPTY_PROFILE, orientacao, { fallbackCountry: 'BRASIL' })
  assert.equal(r.data.residenceCountry, undefined)
})

// --- países ---

test('os países têm nome por extenso e código ISO de duas letras', () => {
  assert.ok(COUNTRIES.length > 100)
  assert.ok(COUNTRIES.every((c) => /^[A-Z]{2}$/.test(c.code)))
  assert.ok(COUNTRIES.every((c) => c.name.length > 2))
})

test('não há país repetido', () => {
  const codes = COUNTRIES.map((c) => c.code)
  assert.equal(new Set(codes).size, codes.length)
})

test('a lista vem em ordem alfabética de NOME, não de código', () => {
  const nomes = COUNTRIES.map((c) => c.name)
  assert.deepEqual(nomes, [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR')))
})

test('os países com adaptação aparecem separados, e nenhum se perde', () => {
  const { adapted, others } = groupedCountries()
  assert.ok(adapted.length > 0)
  assert.equal(adapted.length + others.length, COUNTRIES.length)
  assert.ok(adapted.some((c) => c.code === 'BR'))
})

test('countryName traduz, e devolve o código quando não conhece', () => {
  assert.equal(countryName('BR'), 'Brasil')
  assert.equal(countryName('br'), 'Brasil')
  assert.equal(countryName('XX'), 'XX')
  assert.equal(countryName(null), null)
})

test('isKnownCountry recusa o que não está na lista', () => {
  assert.ok(isKnownCountry('PT'))
  assert.ok(!isKnownCountry('ZZ'))
  assert.ok(!isKnownCountry(''))
})

test('currículo de outra profissão é conflito', () => {
  // O caso real: perfil preenchido a partir de um currículo de biomedicina,
  // seguido de um currículo de advogado.
  const perfil = { ...EMPTY_PROFILE, currentTitle: 'Biomédico', field: 'Saúde' }
  const conflitos = detectProfileConflicts(perfil, {
    currentTitle: 'Advogado',
    field: 'Direito',
  })

  assert.equal(conflitos.length, 2)
  assert.deepEqual(
    conflitos.map((c) => c.field).sort(),
    ['currentTitle', 'field']
  )
  assert.equal(conflitos[0].current, 'Biomédico')
  assert.equal(conflitos[0].suggested, 'Advogado')
})

test('campo vazio no perfil não é conflito, é lacuna', () => {
  // Falta não é contradição — é o caso que applySuggestion preenche calado.
  const conflitos = detectProfileConflicts(EMPTY_PROFILE, {
    currentTitle: 'Advogado',
    field: 'Direito',
  })
  assert.equal(conflitos.length, 0)
})

test('currículo que não diz o cargo não contradiz o perfil', () => {
  const perfil = { ...EMPTY_PROFILE, currentTitle: 'Biomédico', field: 'Saúde' }
  assert.equal(detectProfileConflicts(perfil, {}).length, 0)
})

test('diferença de grafia não é conflito', () => {
  const perfil = { ...EMPTY_PROFILE, currentTitle: 'Analista de Dados', field: 'Tecnologia' }
  const conflitos = detectProfileConflicts(perfil, {
    currentTitle: '  analista de dados ',
    field: 'tecnologia',
  })
  assert.equal(conflitos.length, 0)
})

test('cargo mais específico não é conflito', () => {
  // "Advogado" e "Advogado Trabalhista" são a mesma carreira com mais detalhe.
  // Perguntar aqui seria o ruído que faz a pergunta ser fechada sem ler.
  const perfil = { ...EMPTY_PROFILE, currentTitle: 'Advogado' }
  assert.equal(
    detectProfileConflicts(perfil, { currentTitle: 'Advogado Trabalhista' }).length,
    0
  )
})

test('só o cargo mudou: um conflito, não dois', () => {
  const perfil = { ...EMPTY_PROFILE, currentTitle: 'Enfermeiro', field: 'Saúde' }
  const conflitos = detectProfileConflicts(perfil, {
    currentTitle: 'Biomédico',
    field: 'Saúde',
  })
  assert.equal(conflitos.length, 1)
  assert.equal(conflitos[0].field, 'currentTitle')
})
