import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ROLE_CONCEPTS,
  conceptForTitle,
  foldTitle,
  isSameRole,
  matchTitle,
  seniorityFromTitle,
  seniorityMeets,
  titleForMarket,
  translateTitle,
} from './taxonomy'

/**
 * O exemplo literal do §8 do prompt mestre.
 *
 * "O mesmo candidato pode possuir: Cargo no Brasil: Analista de Dados; Cargo
 * equivalente nos EUA: Data Analyst; em Portugal: Analista de Dados; na
 * Alemanha: Data Analyst / Datenanalyst."
 */
test('o exemplo do §8 atravessa os quatro mercados', () => {
  assert.equal(translateTitle('Analista de Dados', 'BR'), 'Analista de Dados')
  assert.equal(translateTitle('Analista de Dados', 'US'), 'Data Analyst')
  assert.equal(translateTitle('Analista de Dados', 'PT'), 'Analista de Dados')
  assert.equal(translateTitle('Analista de Dados', 'DE'), 'Data Analyst / Datenanalyst')
})

test('a tradução funciona nos dois sentidos', () => {
  assert.equal(translateTitle('Data Analyst', 'BR'), 'Analista de Dados')
  assert.equal(translateTitle('Datenanalyst', 'BR'), 'Analista de Dados')
  assert.equal(translateTitle('Analyste de données', 'US'), 'Data Analyst')
})

test('mercado sem rótulo próprio cai no global, em inglês', () => {
  // Um mercado não declarado nos labels ainda precisa de resposta utilizável.
  assert.equal(titleForMarket('data_analyst', 'ZZ'), 'Data Analyst')
  assert.equal(titleForMarket('data_analyst', 'GLOBAL'), 'Data Analyst')
})

test('título desconhecido devolve null, não o conceito mais parecido', () => {
  // Forçar um desconhecido no vizinho mais próximo é a mesma classe de invenção
  // que a Etapa 1 arrancou do laudo.
  assert.equal(conceptForTitle('Domador de Leões'), null)
  assert.equal(translateTitle('Domador de Leões', 'US'), null)
  assert.equal(conceptForTitle(''), null)
})

test('dois títulos desconhecidos não são "o mesmo cargo"', () => {
  assert.equal(isSameRole('Domador de Leões', 'Astronauta Sênior'), false)
})

test('reconhece o mesmo trabalho em idiomas diferentes', () => {
  assert.ok(isSameRole('Desenvolvedor Back-end', 'Backend Engineer'))
  assert.ok(isSameRole('Enfermeiro', 'Registered Nurse'))
  assert.ok(isSameRole('Contador', 'Comptable'))
  assert.ok(!isSameRole('Data Analyst', 'Data Engineer'))
})

test('ruído de senioridade e contrato não atrapalha a identificação', () => {
  // "Desenvolvedor Back-end Sênior (PJ)" e "Backend Developer" são o mesmo cargo.
  assert.equal(conceptForTitle('Desenvolvedor Back-end Sênior (PJ)')?.id, 'backend_engineer')
  assert.equal(conceptForTitle('Senior Frontend Developer - Remote')?.id, 'frontend_engineer')
  assert.equal(conceptForTitle('Analista de Dados Jr')?.id, 'data_analyst')
})

test('o alias mais específico vence o mais genérico', () => {
  // "engenheiro de dados" não pode ser capturado por um alias de outra família
  // que por acaso apareça dentro dele.
  assert.equal(conceptForTitle('Engenheiro de Dados')?.id, 'data_engineer')
  assert.equal(conceptForTitle('Cientista de Dados')?.id, 'data_scientist')
  assert.equal(conceptForTitle('Analista de Dados')?.id, 'data_analyst')
})

test('correspondência exata é distinguida da parcial', () => {
  assert.equal(matchTitle('Data Analyst')?.how, 'exact')
  assert.equal(matchTitle('Data Analyst para o time de Growth')?.how, 'contains')
})

test('acentuação e caixa não mudam o resultado', () => {
  assert.equal(foldTitle('Analista de Dados Sênior'), 'analista de dados senior')
  assert.equal(conceptForTitle('ANALISTA DE DADOS')?.id, 'data_analyst')
  assert.equal(conceptForTitle('análista de dados'.replace('á', 'a'))?.id, 'data_analyst')
})

test('todo conceito declara rótulo global e ao menos um alias', () => {
  for (const concept of ROLE_CONCEPTS) {
    assert.ok(concept.labels.GLOBAL, `${concept.id} sem rótulo global`)
    assert.ok(concept.aliases.length > 0, `${concept.id} sem alias`)
    assert.ok(concept.family, `${concept.id} sem família`)
  }
})

test('nenhum identificador de conceito se repete', () => {
  const ids = ROLE_CONCEPTS.map((c) => c.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('todo alias declarado resolve para o próprio conceito', () => {
  // Um alias que resolve para outro conceito é colisão — e colisão silenciosa
  // aqui vira cargo errado no matching.
  for (const concept of ROLE_CONCEPTS) {
    for (const alias of concept.aliases) {
      const found = conceptForTitle(alias)
      assert.equal(
        found?.id,
        concept.id,
        `alias "${alias}" de ${concept.id} resolveu para ${found?.id ?? 'nada'}`
      )
    }
  }
})

/* ------------------------------------------------------------------ *
 * Senioridade
 * ------------------------------------------------------------------ */

test('extrai senioridade do título em vários idiomas', () => {
  assert.equal(seniorityFromTitle('Desenvolvedor Sênior'), 'senior')
  assert.equal(seniorityFromTitle('Analista de Dados Pleno'), 'mid')
  assert.equal(seniorityFromTitle('Junior Data Analyst'), 'junior')
  assert.equal(seniorityFromTitle('Estagiário de Marketing'), 'intern')
  assert.equal(seniorityFromTitle('Head of Engineering'), 'director')
  assert.equal(seniorityFromTitle('Tech Lead'), 'lead')
})

test('termos altos vencem os que aparecem no meio do título', () => {
  // "Head of Data Engineering" é diretoria, não engenharia júnior.
  assert.equal(seniorityFromTitle('Head of Data Engineering'), 'director')
  assert.equal(seniorityFromTitle('VP of Product'), 'executive')
})

test('título sem marca de senioridade devolve null', () => {
  assert.equal(seniorityFromTitle('Data Analyst'), null)
  assert.equal(seniorityFromTitle('Enfermeiro'), null)
})

test('senioridade acima atende a vaga; abaixo não', () => {
  assert.ok(seniorityMeets('senior', 'mid'))
  assert.ok(seniorityMeets('senior', 'senior'))
  assert.ok(!seniorityMeets('junior', 'senior'))
})

test('na dúvida o filtro duro não elimina', () => {
  // Dado ausente não pode virar rejeição: descartar por falta de informação é
  // pior que avaliar a mais.
  assert.ok(seniorityMeets(null, 'senior'))
  assert.ok(seniorityMeets('junior', null))
  assert.ok(seniorityMeets(null, null))
})
