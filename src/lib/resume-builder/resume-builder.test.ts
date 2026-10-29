import test from 'node:test'
import assert from 'node:assert/strict'
import { LANGUAGES } from '../i18n/types'
import { scoreAtsReadability } from '../ats-check/score'
import { checkResumeContent } from '../analysis/content-guard'
import {
  assembleResumeText,
  builderAnswersSchema,
  cleanBullets,
  lockedPartsOf,
  parseBuilderTeaser,
  type BuilderAnswers,
} from './answers'
import { RESUME_BUILDER_COPY, type ResumeBuilderCopy } from './copy'

const answers: BuilderAnswers = builderAnswersSchema.parse({
  fullName: 'Maria Souza',
  phone: '11 99999-0000',
  city: 'Campinas',
  targetRole: 'Atendente',
  experiences: [
    { role: 'Atendente de loja', company: 'Padaria Central', period: '2021 a 2023', description: 'atendia clientes no balcão e fechava o caixa' },
    { role: 'Voluntária', company: 'Igreja do bairro', period: '2020', description: 'organizava doações de alimentos' },
  ],
  education: [{ course: 'Ensino médio', institution: 'E.E. João XXIII', period: '2019' }],
  skills: 'Excel básico',
  languages: '',
})

test('o currículo montado tem as palavras da pessoa, nas seções do idioma', () => {
  const text = assembleResumeText(answers, 'pt')
  assert.match(text, /^Maria Souza\nCampinas · 11 99999-0000\nObjetivo: Atendente/)
  assert.match(text, /## Experiência Profissional\nAtendente de loja — Padaria Central \(2021 a 2023\)\natendia clientes/)
  assert.match(text, /## Formação Acadêmica\nEnsino médio — E\.E\. João XXIII \(2019\)/)
  assert.match(text, /## Habilidades Técnicas e Comportamentais\nExcel básico/)
  // Sem idiomas informados, sem seção vazia.
  assert.doesNotMatch(text, /Idiomas/)
  assert.match(assembleResumeText(answers, 'de'), /## Berufserfahrung/)
})

test('o currículo montado passa pela mesma guarda do envio no app', () => {
  const text = assembleResumeText(answers, 'pt')
  assert.equal(checkResumeContent(text).analyzable, true)
  assert.ok(scoreAtsReadability(text).score > 0)
})

test('do resto vai só a contagem, nunca o texto', () => {
  assert.deepEqual(lockedPartsOf(answers), { experiences: 1, education: 1, skills: true, languages: false })
  const stored = JSON.stringify({ first: { role: 'a', company: 'b', period: 'c', bullets: ['x'] }, locked: lockedPartsOf(answers) })
  assert.ok(!stored.includes('doações'))
  assert.deepEqual(parseBuilderTeaser(stored)?.locked, lockedPartsOf(answers))
  assert.equal(parseBuilderTeaser(null), null)
  assert.equal(parseBuilderTeaser('{"x":1}'), null)
  assert.equal(parseBuilderTeaser('não é json'), null)
})

test('tópicos da IA saem limpos e com teto', () => {
  assert.deepEqual(cleanBullets(['- Atendimento ao cliente no balcão', '• Fechamento de caixa diário', '', 'ok', 42]), [
    'Atendimento ao cliente no balcão',
    'Fechamento de caixa diário',
  ])
  assert.equal(cleanBullets(Array(9).fill('Atendimento ao cliente')).length, 5)
  assert.equal(cleanBullets(['x'.repeat(500)])[0].length, 280)
  assert.deepEqual(cleanBullets('texto'), [])
})

test('o esquema exige o mínimo para escrever um currículo', () => {
  assert.equal(builderAnswersSchema.safeParse({ ...answers, experiences: [] }).success, false)
  assert.equal(builderAnswersSchema.safeParse({ ...answers, targetRole: '' }).success, false)
  assert.equal(
    builderAnswersSchema.safeParse({ ...answers, experiences: [{ role: 'Caixa', description: 'curto' }] }).success,
    false
  )
})

test('os 12 idiomas têm os mesmos textos e os mesmos marcadores', () => {
  const flat = (c: ResumeBuilderCopy) => {
    const out: Record<string, string> = {}
    const walk = (v: unknown, p: string) => {
      if (typeof v === 'string') out[p] = v
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k)
    }
    walk(c, '')
    return out
  }
  const marks = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
  const source = flat(RESUME_BUILDER_COPY.pt)
  for (const lang of LANGUAGES) {
    const target = flat(RESUME_BUILDER_COPY[lang])
    assert.deepEqual(Object.keys(target).sort(), Object.keys(source).sort(), lang)
    for (const [k, v] of Object.entries(source)) {
      assert.ok(target[k].trim().length > 0, `${lang}.${k} vazio`)
      assert.deepEqual(marks(target[k]), marks(v), `${lang}.${k} marcadores`)
    }
  }
})
