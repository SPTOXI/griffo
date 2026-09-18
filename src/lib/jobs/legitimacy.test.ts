import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assessLegitimacy,
  EVERGREEN_AFTER_DAYS,
  RECIRCULATION_MIN_POSTINGS,
  type LegitimacyInput,
} from './legitimacy'

const NOW = new Date('2026-09-18T12:00:00Z')

function daysBefore(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000)
}

/** Uma vaga sadia: descrição de verdade, recém-publicada, cargo não repetido. */
function healthy(over: Partial<LegitimacyInput> = {}): LegitimacyInput {
  return {
    title: 'Pessoa Desenvolvedora Back-end Sênior',
    description:
      'Procuramos alguém para evoluir nossa plataforma de pagamentos, com foco ' +
      'em confiabilidade e observabilidade. O time é responsável pelo ciclo ' +
      'completo, do desenho à operação em produção, e trabalha em contato ' +
      'direto com as áreas de risco e de atendimento. Esperamos autonomia para ' +
      'conduzir projetos de ponta a ponta e disposição para revisar o código ' +
      'de outras pessoas com cuidado.',
    requirementsCount: 4,
    publishedAt: daysBefore(10),
    postingsForSameRole: 1,
    now: NOW,
    ...over,
  }
}

test('vaga sadia não acusa nada', () => {
  const r = assessLegitimacy(healthy())
  assert.equal(r.level, 'ok')
  assert.deepEqual(r.signals, [])
})

test('banco de talentos é suspect sozinho, mesmo sem nenhum outro sinal', () => {
  const r = assessLegitimacy(healthy({ title: 'Banco de Talentos — Tecnologia' }))
  assert.equal(r.level, 'suspect')
  assert.deepEqual(r.signals, ['talent_pool'])
})

test('banco de talentos declarado só no corpo, com título de cargo normal', () => {
  const r = assessLegitimacy(
    healthy({
      title: 'Analista de Dados Pleno',
      description:
        'Esta é uma candidatura espontânea: não há posição aberta no momento, ' +
        'mas guardamos seu currículo para futuras oportunidades no time de dados.',
    })
  )
  assert.equal(r.level, 'suspect')
  assert.deepEqual(r.signals, ['talent_pool'])
})

test('banco de talentos reconhecido nos 12 idiomas', () => {
  const titles = [
    'Banco de Talentos',            // pt
    'Talent Pool - Engineering',    // en
    'Bolsa de trabajo',             // es
    'Initiativbewerbung',           // de
    'Candidature spontanée',        // fr
    'Candidatura spontanea',        // it
    'Open sollicitatie',            // nl
    'Spontanansökan',               // sv
    '人材プール',                     // ja
    '인재풀 등록',                    // ko
    '人才库',                        // zh
    'قاعدة المواهب',                 // ar
  ]
  for (const title of titles) {
    const r = assessLegitimacy(healthy({ title }))
    assert.deepEqual(r.signals, ['talent_pool'], `não reconheceu: ${title}`)
  }
})

test('acento não decide: "candidatura espontanea" casa com e sem', () => {
  assert.deepEqual(assessLegitimacy(healthy({ title: 'Candidatura Espontânea' })).signals, [
    'talent_pool',
  ])
  assert.deepEqual(assessLegitimacy(healthy({ title: 'candidatura espontanea' })).signals, [
    'talent_pool',
  ])
})

test('anúncio perpétuo entra no limiar, não antes', () => {
  const justUnder = assessLegitimacy(healthy({ publishedAt: daysBefore(EVERGREEN_AFTER_DAYS - 1) }))
  assert.deepEqual(justUnder.signals, [])

  const atThreshold = assessLegitimacy(healthy({ publishedAt: daysBefore(EVERGREEN_AFTER_DAYS) }))
  assert.deepEqual(atThreshold.signals, ['evergreen'])
  assert.equal(atThreshold.level, 'attention')
})

test('recirculação entra no limiar, não antes', () => {
  const twice = assessLegitimacy(healthy({ postingsForSameRole: RECIRCULATION_MIN_POSTINGS - 1 }))
  assert.deepEqual(twice.signals, [])

  const thrice = assessLegitimacy(healthy({ postingsForSameRole: RECIRCULATION_MIN_POSTINGS }))
  assert.deepEqual(thrice.signals, ['recirculated'])
  assert.equal(thrice.level, 'attention')
})

test('descrição oca exige as duas condições: curta E sem requisito', () => {
  const shortWithRequirements = assessLegitimacy(
    healthy({ description: 'Vaga para pessoa desenvolvedora.', requirementsCount: 3 })
  )
  assert.deepEqual(shortWithRequirements.signals, [])

  const longWithoutRequirements = assessLegitimacy(healthy({ requirementsCount: 0 }))
  assert.deepEqual(longWithoutRequirements.signals, [])

  const hollow = assessLegitimacy(
    healthy({ description: 'Vaga para pessoa desenvolvedora.', requirementsCount: 0 })
  )
  assert.deepEqual(hollow.signals, ['thin_description'])
})

test('descrição ausente conta como oca só se também não houver requisito', () => {
  assert.deepEqual(
    assessLegitimacy(healthy({ description: null, requirementsCount: 0 })).signals,
    ['thin_description']
  )
  assert.deepEqual(
    assessLegitimacy(healthy({ description: null, requirementsCount: 5 })).signals,
    []
  )
})

test('dois indícios viram padrão e sobem para suspect', () => {
  const r = assessLegitimacy(
    healthy({
      publishedAt: daysBefore(EVERGREEN_AFTER_DAYS + 30),
      postingsForSameRole: RECIRCULATION_MIN_POSTINGS,
    })
  )
  assert.equal(r.level, 'suspect')
  assert.deepEqual(r.signals, ['evergreen', 'recirculated'])
})

// A regra que o types.ts fixou: "Eliminar por dado ausente transforma silêncio
// em rejeição". Salário não divulgado é a norma em boa parte dos mercados.
test('ausência de dado não pontua: sem salário, sem senioridade, sem data', () => {
  const r = assessLegitimacy(healthy({ publishedAt: null }))
  assert.equal(r.level, 'ok')
  assert.deepEqual(r.signals, [])
})

test('sem data de publicação, anúncio perpétuo não é inferido', () => {
  const r = assessLegitimacy(healthy({ publishedAt: null, postingsForSameRole: 1 }))
  assert.ok(!r.signals.includes('evergreen'))
})

test('postingsForSameRole = 1 (desconhecido) não acusa recirculação', () => {
  assert.ok(!assessLegitimacy(healthy({ postingsForSameRole: 1 })).signals.includes('recirculated'))
})

// A garantia estrutural do módulo: sem número, ninguém soma isto ao Job Fit
// por engano.
test('a avaliação não expõe número nenhum', () => {
  const r = assessLegitimacy(healthy({ title: 'Banco de Talentos' })) as unknown as Record<
    string,
    unknown
  >
  for (const value of Object.values(r)) {
    assert.notEqual(typeof value, 'number')
  }
  assert.deepEqual(Object.keys(r).sort(), ['level', 'signals'])
})

test('a ordem dos sinais é estável', () => {
  const input = healthy({
    title: 'Banco de Talentos',
    description: 'Curto.',
    requirementsCount: 0,
    publishedAt: daysBefore(EVERGREEN_AFTER_DAYS + 1),
    postingsForSameRole: RECIRCULATION_MIN_POSTINGS + 2,
  })
  assert.deepEqual(assessLegitimacy(input).signals, [
    'talent_pool',
    'evergreen',
    'recirculated',
    'thin_description',
  ])
  assert.deepEqual(assessLegitimacy(input).signals, assessLegitimacy(input).signals)
})
