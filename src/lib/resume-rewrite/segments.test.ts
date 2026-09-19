import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRewriteSegments, mergeRewriteSegments, REWRITE_SEGMENT_IDS } from './segments'

test('três seções fixas, nesta ordem', () => {
  assert.deepEqual(REWRITE_SEGMENT_IDS, ['header', 'experience', 'education'])
})

test('junta as seções na ordem certa, com uma linha em branco entre elas', () => {
  const merged = mergeRewriteSegments({
    header: '# Fulano de Tal',
    experience: '## Experiência Profissional\n- Vaga X',
    education: '## Formação Acadêmica\n- Curso Y',
  })
  assert.equal(
    merged,
    '# Fulano de Tal\n\n## Experiência Profissional\n- Vaga X\n\n## Formação Acadêmica\n- Curso Y'
  )
})

test('seção ausente não deixa buraco nem lança', () => {
  const merged = mergeRewriteSegments({ header: '# Fulano', education: '## Formação' })
  assert.equal(merged, '# Fulano\n\n## Formação')
})

test('seção vazia ou só espaço é descartada, não vira linha em branco solta', () => {
  const merged = mergeRewriteSegments({ header: '# Fulano', experience: '   ', education: '## Formação' })
  assert.equal(merged, '# Fulano\n\n## Formação')
})

test('nenhuma seção pronta ainda devolve string vazia, sem lançar', () => {
  assert.equal(mergeRewriteSegments({}), '')
})

test('cada seção instrui a IA a produzir só a sua fatia, nunca as outras', () => {
  const [header, experience, education] = buildRewriteSegments('')
  assert.match(header.instruction, /SÓ ela/)
  assert.match(header.instruction, /NÃO produza experiências, formação/)
  assert.match(experience.instruction, /NÃO produza cabeçalho, resumo, formação/)
  assert.match(education.instruction, /NÃO produza cabeçalho, resumo ou experiências/)
})

test('a dica de palavras-chave, quando presente, entra nas três seções', () => {
  const hint = '\n\nPalavras-Chave Estratégicas (ATS) obrigatórias: React, TypeScript.'
  const specs = buildRewriteSegments(hint)
  for (const spec of specs) {
    assert.match(spec.instruction, /React, TypeScript/)
  }
})

test('o prompt de reescrita proíbe clichê nos idiomas que têm léxico', () => {
  for (const lang of ['pt', 'en', 'es'] as const) {
    const specs = buildRewriteSegments('', lang)
    for (const spec of specs) {
      assert.match(spec.instruction, /NÃO use nenhuma|Do NOT use any|NO uses ninguna/)
    }
  }
})

test('IDIOMA SEM LÉXICO NÃO GANHA PROIBIÇÃO EM PORTUGUÊS', () => {
  // Pedir num idioma que o modelo evite expressões de outro é ruído no prompt
  // com aparência de cuidado — e a medição depois não acharia nada mesmo.
  for (const lang of ['de', 'fr', 'ja', 'ar'] as const) {
    for (const spec of buildRewriteSegments('', lang)) {
      assert.doesNotMatch(spec.instruction, /NÃO use nenhuma destas expressões/)
    }
  }
})
