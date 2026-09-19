import test from 'node:test'
import assert from 'node:assert/strict'
import { buildResumeContext } from './resume-context'

const base = {
  resumeContent: 'Enfermeira com 9 anos de UTI adulto.',
  targetJob: 'Coordenadora de Enfermagem',
  targetJobDescription: 'Liderar equipe de 20 pessoas.',
  lang: 'pt' as const,
  profileContext: 'PERFIL: senioridade sênior.',
}

test('a MESMA entrada produz os MESMOS bytes', () => {
  // É a única propriedade que faz o cache existir. O casamento é de prefixo:
  // um caractere diferente invalida tudo dali para frente, e a chamada seguinte
  // grava um cache novo em vez de ler o anterior.
  assert.equal(buildResumeContext(base), buildResumeContext(base))
})

test('nada de data, hora ou identificador no bloco', () => {
  // Um `new Date()` aqui faria toda chamada gravar cache e nunca ler nenhum —
  // pior que não cachear, porque gravar custa mais caro.
  const texto = buildResumeContext(base)
  const anoCorrente = String(new Date().getUTCFullYear())

  assert.ok(!texto.includes(anoCorrente), 'ano corrente encontrado no bloco cacheável')
  assert.ok(!/\d{2}:\d{2}:\d{2}/.test(texto), 'horário encontrado no bloco cacheável')
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}/i.test(texto), 'identificador encontrado no bloco cacheável')
})

test('o currículo e a vaga estão no bloco', () => {
  const texto = buildResumeContext(base)
  assert.match(texto, /9 anos de UTI/)
  assert.match(texto, /Coordenadora de Enfermagem/)
  assert.match(texto, /equipe de 20 pessoas/)
})

test('sem vaga alvo, o bloco diz isso — e continua estável', () => {
  const semVaga = { ...base, targetJob: null, targetJobDescription: null }
  assert.match(buildResumeContext(semVaga), /nenhuma vaga específica/i)
  assert.equal(buildResumeContext(semVaga), buildResumeContext(semVaga))
})

test('NÃO carrega papel de nenhuma tarefa', () => {
  // Se carregasse, a reescrita e a orientação receberiam o papel do avaliador
  // junto com o próprio — duas instruções contraditórias. O papel vive no
  // `systemPrompt`, depois do marcador de cache.
  const texto = buildResumeContext(base)
  assert.ok(!/você é/i.test(texto), 'o bloco cacheável não deve atribuir papel')
})

test('currículo diferente produz bloco diferente', () => {
  // O oposto também precisa valer: dois currículos não podem compartilhar
  // cache, ou um receberia a análise do outro.
  assert.notEqual(
    buildResumeContext(base),
    buildResumeContext({ ...base, resumeContent: 'Outro currículo.' })
  )
})

test('perfil ausente não muda o resto do bloco de posição', () => {
  const semPerfil = buildResumeContext({ ...base, profileContext: null })
  // O currículo entra embrulhado como dado não confiável — ver
  // `untrusted.ts`. O delimitador antigo (`=== CURRÍCULO DO CANDIDATO ===`)
  // saiu de propósito: ele não era escapado, e um currículo contendo a linha
  // de fechamento saía do bloco.
  assert.match(semPerfil, /<<<DOCUMENTO_DO_USUARIO>>>/)
  assert.equal(semPerfil, buildResumeContext({ ...base, profileContext: null }))
})

test('o currículo chega ao prompt marcado como dado, nunca como instrução', () => {
  const prompt = buildResumeContext({ ...base, profileContext: null })
  assert.match(prompt, /DADO A ANALISAR/)
  assert.match(prompt, /IGNORE o pedido/i)
})
