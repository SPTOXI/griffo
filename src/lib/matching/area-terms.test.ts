import test from 'node:test'
import assert from 'node:assert/strict'
import { areaTermsOf, MAX_TEXT_TERMS, MAX_TITLE_TERMS } from './area-terms'
import { EMPTY_PROFILE } from '../profile'

test('perfil vazio não gera termo — a leitura cai na ordem por data, como antes', () => {
  assert.deepEqual(areaTermsOf(EMPTY_PROFILE), { title: [], text: [] })
})

test('frases inteiras, com e sem acento — o ILIKE do Postgres não ignora acento', () => {
  const terms = areaTermsOf({ ...EMPTY_PROFILE, field: 'Análises Clínicas', specializations: ['Hematologia'] })
  assert.deepEqual(terms.text, ['análises clínicas', 'analises clinicas', 'hematologia'])
})

test('siglas e termos curtos ficam de fora — "5S" e "RH" casariam com qualquer vaga', () => {
  const terms = areaTermsOf({ ...EMPTY_PROFILE, skills: ['5S', 'RH', 'SAP', 'Excel'] })
  assert.deepEqual(terms.text, ['excel'])
})

test('cargo entra no título, não no texto; área e competências nos dois', () => {
  const terms = areaTermsOf({
    ...EMPTY_PROFILE,
    currentTitle: 'Coordenadora de Unidade',
    targetRoles: ['Gerente de Laboratório'],
    field: 'análises clínicas',
  })
  assert.deepEqual(terms.title.slice(0, 2), ['gerente de laboratório', 'gerente de laboratorio'])
  assert.ok(terms.title.includes('coordenadora de unidade'))
  assert.ok(!terms.text.includes('coordenadora de unidade'))
  assert.ok(terms.text.includes('análises clínicas'))
})

test('tetos respeitados, cortando pelo menos específico (competências no fim)', () => {
  const skills = Array.from({ length: 40 }, (_, i) => `competência ${i}`)
  const terms = areaTermsOf({ ...EMPTY_PROFILE, field: 'hematologia', skills })
  assert.equal(terms.title.length, MAX_TITLE_TERMS)
  assert.equal(terms.text.length, MAX_TEXT_TERMS)
  assert.equal(terms.text[0], 'hematologia')
})
