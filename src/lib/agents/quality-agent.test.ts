import test from 'node:test'
import assert from 'node:assert/strict'
import { auditQualityOfAiResult } from './quality-agent'

/**
 * Cobre só o que este arquivo passou a fazer em 26/08/2026 (ver 2.34 na
 * auditoria): recuperar JSON com texto ao redor antes de reprovar a extração
 * de perfil. As demais tarefas deste agente não têm teste dedicado ainda.
 */

const completo = JSON.stringify({
  currentTitle: 'Analista de Dados',
  seniority: 'pleno',
  field: 'dados',
  specializations: [],
  skills: ['SQL'],
  yearsExperience: 4,
  educationLevel: 'bachelor',
  targetRoles: [],
})

test('profile_extraction: JSON limpo é aprovado', () => {
  const result = auditQualityOfAiResult('profile_extraction', completo)
  assert.equal(result.approved, true)
})

test('profile_extraction: JSON dentro de bloco markdown é aprovado', () => {
  const result = auditQualityOfAiResult('profile_extraction', '```json\n' + completo + '\n```')
  assert.equal(result.approved, true)
})

test('profile_extraction: texto antes e depois do JSON é recuperado pelo maior bloco {...}', () => {
  // Observado em produção: o modelo respondeu rápido (não é truncamento) mas
  // com uma frase extra além do que a limpeza de markdown cobre.
  const result = auditQualityOfAiResult(
    'profile_extraction',
    `Segue a leitura do currículo:\n${completo}\nQualquer coisa é só avisar.`
  )
  assert.equal(result.approved, true)
})

test('profile_extraction: array no lugar de objeto é reprovado', () => {
  const result = auditQualityOfAiResult(
    'profile_extraction',
    JSON.stringify(['currentTitle', 'seniority', 'field', 'specializations', 'skills'])
  )
  assert.equal(result.approved, false)
  assert.match(result.feedback!, /objeto JSON/)
})

test('profile_extraction: sem chave nenhuma na resposta é reprovado como JSON inválido', () => {
  const result = auditQualityOfAiResult(
    'profile_extraction',
    'Desculpe, não consegui extrair essas informações do currículo enviado.'
  )
  assert.equal(result.approved, false)
  assert.match(result.feedback!, /JSON válido/)
})

test('profile_extraction: bloco {...} encontrado mas ainda inválido é reprovado', () => {
  const result = auditQualityOfAiResult(
    'profile_extraction',
    'Aqui está: {chave: sem aspas, isso não fecha certo} — desculpe qualquer erro'
  )
  assert.equal(result.approved, false)
  assert.match(result.feedback!, /JSON válido/)
})
