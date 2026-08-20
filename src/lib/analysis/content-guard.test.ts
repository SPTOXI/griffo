import test from 'node:test'
import assert from 'node:assert/strict'
import { checkResumeContent, MIN_ANALYZABLE_CHARS } from './content-guard'

const curriculoDeVerdade =
  'ADVOGADA — Direito do Trabalho. Formada pela PUC em 2014, OAB/SP. ' +
  'Atuação em contencioso trabalhista, audiências e acordos, com carteira de 120 processos ' +
  'ativos. Experiência anterior em departamento jurídico de indústria têxtil.'

test('o marcador que a própria tela escrevia não é conteúdo', () => {
  // O caso real: o PDF não tinha camada de texto, e o que foi analisado (e
  // pontuado, e desenhado em gráfico) era este texto de 90 caracteres.
  const marcador =
    '[Arquivo PDF Anexado: Curriculo Natacha Reid Sulahian Ferreira.pdf] - ' +
    'O texto será processado e analisado automaticamente.'

  assert.ok(marcador.length > MIN_ANALYZABLE_CHARS, 'o marcador passava por qualquer piso de tamanho')

  const verdict = checkResumeContent(marcador)
  assert.equal(verdict.analyzable, false)
  assert.equal(verdict.analyzable === false && verdict.code, 'placeholder')
})

test('a recusa avisa que não houve cobrança', () => {
  // A pessoa precisa saber disso na mesma frase, senão a recusa parece um
  // prejuízo em vez de uma proteção.
  const verdict = checkResumeContent('')
  assert.equal(verdict.analyzable, false)
  assert.ok(verdict.analyzable === false && /nenhuma análise foi cobrada/i.test(verdict.message))
})

test('conteúdo vazio ou só espaço não é analisável', () => {
  assert.equal(checkResumeContent('').analyzable, false)
  assert.equal(checkResumeContent('   \n  ').analyzable, false)
  assert.equal(checkResumeContent(null).analyzable, false)
  assert.equal(checkResumeContent(undefined).analyzable, false)
})

test('duas linhas não são um currículo', () => {
  const verdict = checkResumeContent('João Silva\nEngenheiro')
  assert.equal(verdict.analyzable, false)
  assert.equal(verdict.analyzable === false && verdict.code, 'too_short')
})

test('currículo de verdade passa', () => {
  assert.equal(checkResumeContent(curriculoDeVerdade).analyzable, true)
})

test('o piso não julga qualidade, só existência', () => {
  // Currículo ruim é problema do candidato, e a análise existe para dizer isso.
  // Recusar um currículo legítimo é pior que analisar um ruim.
  const magroMasReal =
    'Maria Souza. Auxiliar administrativa, 3 anos na Transportes Lima. ' +
    'Ensino médio completo. Pacote Office. Disponibilidade imediata. São Paulo, SP.'
  assert.ok(magroMasReal.length >= MIN_ANALYZABLE_CHARS)
  assert.equal(checkResumeContent(magroMasReal).analyzable, true)
})

test('a palavra "anexado" no meio de um currículo não o invalida', () => {
  const texto = `${curriculoDeVerdade} Currículo anexado ao processo seletivo interno em 2023.`
  assert.equal(checkResumeContent(texto).analyzable, true)
})
