import test from 'node:test'
import assert from 'node:assert/strict'
import { LANGUAGES } from '../i18n/types'
import { cleanImprovedBlock, isHeadingOnly, joinBlocks, splitBlocks } from './sections'
import { RESUME_EDITOR_COPY } from './copy'

const md = `# Maria Souza
Campinas · maria@email.com

## Resumo Profissional
Atendente com experiência em balcão e caixa.

## Experiência Profissional

### Atendente — Padaria Pão Quente (2021–2023)
- Atendimento de clientes no balcão
- Fechamento de caixa

### Ajudante — Feira (2020)
- Montagem da barraca

## Formação Acadêmica
Ensino médio completo`

test('cada experiência vira um bloco, e o topo fica com nome e contato', () => {
  const blocks = splitBlocks(md)
  assert.deepEqual(
    blocks.map((b) => [b.level, b.heading]),
    [
      [1, null],
      [2, '## Resumo Profissional'],
      [2, '## Experiência Profissional'],
      [3, '### Atendente — Padaria Pão Quente (2021–2023)'],
      [3, '### Ajudante — Feira (2020)'],
      [2, '## Formação Acadêmica'],
    ]
  )
  assert.ok(blocks[0].text.startsWith('# Maria Souza'))
  assert.equal(isHeadingOnly(blocks[2]), true)
  assert.equal(isHeadingOnly(blocks[3]), false)
})

test('dividir e juntar devolve o mesmo currículo', () => {
  assert.equal(joinBlocks(splitBlocks(md)), md)
  assert.equal(joinBlocks(splitBlocks(md.replace(/\n/g, '\r\n'))), md)
  assert.deepEqual(splitBlocks(''), [])
})

test('a resposta da IA mantém o título original do bloco', () => {
  const block = splitBlocks(md)[3]
  assert.equal(
    cleanImprovedBlock('```markdown\n### Outro título\n- Atendimento ao cliente no balcão\n```', block),
    '### Atendente — Padaria Pão Quente (2021–2023)\n- Atendimento ao cliente no balcão'
  )
  assert.equal(
    cleanImprovedBlock('- Atendimento ao cliente no balcão', block),
    '### Atendente — Padaria Pão Quente (2021–2023)\n- Atendimento ao cliente no balcão'
  )
  // Só o título de volta não é melhoria.
  assert.equal(cleanImprovedBlock('### Atendente', block), null)
  assert.equal(cleanImprovedBlock('', block), null)
  // Bloco do topo não tem título a preservar.
  assert.equal(cleanImprovedBlock('# Maria Souza\nCampinas', splitBlocks(md)[0]), '# Maria Souza\nCampinas')
})

test('os 12 idiomas do editor têm as mesmas chaves e marcadores', () => {
  const marks = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
  const source = RESUME_EDITOR_COPY.pt
  for (const lang of LANGUAGES) {
    const target = RESUME_EDITOR_COPY[lang]
    assert.deepEqual(Object.keys(target).sort(), Object.keys(source).sort(), lang)
    for (const [k, v] of Object.entries(source)) {
      const t = target[k as keyof typeof target]
      assert.ok(t.trim().length > 0, `${lang}.${k} vazio`)
      assert.deepEqual(marks(t), marks(v), `${lang}.${k} marcadores`)
    }
  }
})
