import test from 'node:test'
import assert from 'node:assert/strict'
import { LANGUAGES } from '../i18n/types'
import { ISSUE_PENALTY, type AtsIssueCode } from '../ats-check/score'
import { MATCH_PREVIEW_COPY, fill, type MatchPreviewCopy } from './copy'
import { buildLeadEmail } from './email'
import { buildPublicResult, type PublicJobRow } from './result'
import {
  DELETE_AFTER_HOURS,
  ISSUE_CATEGORY,
  KEEP_FOR_DAYS,
  expiresAtFor,
  isValidToken,
  teaserFrom,
} from './rules'

const HOUR = 60 * 60 * 1000

test('quem escolhe apagar vence antes de 24h, com folga para a purga horária atrasar', () => {
  const now = new Date('2026-09-23T12:00:00Z')
  const expires = expiresAtFor(false, now).getTime() - now.getTime()
  assert.equal(expires, DELETE_AFTER_HOURS * HOUR)
  // A purga roda de hora em hora: vencer em 22h deixa duas execuções de margem
  // antes de a promessa pública ("até 24 horas") ser quebrada.
  assert.ok(expires + 2 * HOUR <= 24 * HOUR)
})

test('quem escolhe guardar fica o prazo do currículo inativo, não para sempre', () => {
  const now = new Date('2026-09-23T12:00:00Z')
  assert.equal(expiresAtFor(true, now).getTime() - now.getTime(), KEEP_FOR_DAYS * 24 * HOUR)
})

test('o token é 32 hex e nada mais chega ao banco', () => {
  assert.ok(isValidToken('0123456789abcdef0123456789abcdef'))
  for (const bad of [null, undefined, '', 'abc', '0123456789ABCDEF0123456789ABCDEF', "0123456789abcdef0123456789abcde'", 'cm1abcdefghijklmnopqrstuv']) {
    assert.equal(isValidToken(bad as any), false, String(bad))
  }
})

test('todo problema do teste ATS tem categoria na isca', () => {
  for (const code of Object.keys(ISSUE_PENALTY) as AtsIssueCode[]) {
    assert.ok(ISSUE_CATEGORY[code], code)
  }
})

test('a isca conta por categoria e nunca diz QUAL problema é', () => {
  const teaser = teaserFrom({
    issues: [
      { code: 'no_metrics', severity: 'tip' },
      { code: 'no_skills_section', severity: 'warning' },
      { code: 'columns_suspected', severity: 'warning' },
      { code: 'no_phone', severity: 'warning' },
    ],
  })
  assert.equal(teaser.total, 4)
  assert.deepEqual(teaser.byCategory, [
    { category: 'keywords', count: 2 },
    { category: 'formatting', count: 1 },
    { category: 'contact', count: 1 },
  ])
  assert.ok(!JSON.stringify(teaser).includes('no_metrics'))
})

test('currículo sem problema: isca vazia, e não "pode melhorar" inventado', () => {
  assert.deepEqual(teaserFrom({ issues: [] }), { total: 0, byCategory: [] })
})

function job(id: string, over: Partial<PublicJobRow> = {}): PublicJobRow {
  return {
    id,
    title: `Cargo ${id}`,
    company: `Empresa ${id}`,
    city: 'São Paulo',
    region: 'SP',
    country: 'BR',
    remoteType: 'hybrid',
    salaryMin: null,
    salaryMax: null,
    currency: null,
    salaryPeriod: null,
    publishedAt: new Date('2026-09-20T00:00:00Z'),
    applicationUrl: `https://vagas.example.com/${id}`,
    closedAt: null,
    ...over,
  }
}

const baseLead = {
  status: 'ready',
  failureCode: null,
  atsJson: JSON.stringify({ score: 72, level: 'attention', issues: [{ code: 'no_metrics', severity: 'tip' }] }),
  profileInsufficient: false,
  recruiterOptIn: false,
  expiresAt: new Date('2026-09-24T10:00:00Z'),
}

test('a lista trancada é trancada no servidor: só a grátis sai com nome', () => {
  const matches = ['a', 'b', 'c', 'd'].map((id, i) => ({
    jobId: id,
    overall: i < 2 ? 'strong' : 'good',
    recommendation: 'apply',
  }))
  const jobs = new Map(['a', 'b', 'c', 'd'].map((id) => [id, job(id)]))
  const result = buildPublicResult({ ...baseLead, matchesJson: JSON.stringify(matches) }, jobs)

  assert.equal(result.free.length, 1)
  assert.equal(result.free[0].title, 'Cargo a')
  assert.equal(result.lockedCount, 3)
  assert.equal(result.lockedStrong, 1)
  const serialized = JSON.stringify(result)
  for (const hidden of ['Cargo b', 'Empresa c', 'vagas.example.com/d', '"jobId"']) {
    assert.ok(!serialized.includes(hidden), `vazou ${hidden}`)
  }
})

test('vaga fechada, apagada ou com link não-http sai da conta, e a próxima vira a grátis', () => {
  const matches = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ jobId: id, overall: 'good', recommendation: 'apply' }))
  const jobs = new Map<string, PublicJobRow>([
    ['a', job('a', { closedAt: new Date() })],
    ['c', job('c', { applicationUrl: 'javascript:alert(1)' })],
    ['d', job('d')],
    ['e', job('e')],
  ])
  const result = buildPublicResult({ ...baseLead, matchesJson: JSON.stringify(matches) }, jobs)
  assert.equal(result.totalMatches, 2)
  assert.equal(result.free[0].title, 'Cargo d')
  assert.equal(result.lockedCount, 1)
})

test('status desconhecido vira falha, nunca "pronto"', () => {
  const result = buildPublicResult({ ...baseLead, status: 'weird', matchesJson: null }, new Map())
  assert.equal(result.status, 'failed')
})

const PLACEHOLDERS = /\{(\w+)\}/g

function placeholdersOf(value: string): string[] {
  return [...value.matchAll(PLACEHOLDERS)].map((m) => m[1]).sort()
}

function flatten(copy: MatchPreviewCopy): Record<string, string> {
  const out: Record<string, string> = {}
  const walk = (value: unknown, path: string) => {
    if (typeof value === 'string') out[path] = value
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k)
  }
  walk(copy, '')
  return out
}

test('os 12 idiomas têm todas as chaves, preenchidas, com os mesmos marcadores do português', () => {
  const source = flatten(MATCH_PREVIEW_COPY.pt)
  for (const lang of LANGUAGES) {
    const target = flatten(MATCH_PREVIEW_COPY[lang])
    assert.deepEqual(Object.keys(target).sort(), Object.keys(source).sort(), lang)
    for (const [key, value] of Object.entries(source)) {
      assert.ok(target[key].trim().length > 0, `${lang}.${key} vazio`)
      assert.deepEqual(placeholdersOf(target[key]), placeholdersOf(value), `${lang}.${key} marcadores`)
    }
  }
})

test('nenhum idioma promete número ou garantia de entrevista (§17)', () => {
  for (const lang of LANGUAGES) {
    const close = MATCH_PREVIEW_COPY[lang].teaserClose
    assert.ok(!/%|\d/.test(close), `${lang}: ${close}`)
  }
})

test('fill troca os marcadores e deixa à vista o que faltou', () => {
  assert.equal(fill('{n} em {x}', { n: 3 }), '3 em {x}')
})

test('o e-mail escapa HTML, leva o link e não cita vaga nenhuma', () => {
  const msg = buildLeadEmail({
    to: 'a@b.com',
    lang: 'pt',
    resultUrl: 'https://griffo.work/?lead=0123456789abcdef0123456789abcdef',
    matches: 5,
    recruiterOptIn: false,
  })
  assert.equal(msg.subject, MATCH_PREVIEW_COPY.pt.emailSubject)
  assert.ok(msg.html.includes('https://griffo.work/?lead=0123456789abcdef0123456789abcdef'))
  assert.ok(msg.text.includes('5'))
  assert.ok(msg.html.includes(MATCH_PREVIEW_COPY.pt.emailDeleteNote))

  const kept = buildLeadEmail({ to: 'a@b.com', lang: 'ar', resultUrl: 'https://x/"><script>', matches: 0, recruiterOptIn: true })
  assert.ok(!kept.html.includes('<script>'))
  assert.ok(kept.html.includes('dir="rtl"'))
  assert.ok(kept.html.includes(MATCH_PREVIEW_COPY.ar.emailKeepNote))
})
