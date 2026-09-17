import test from 'node:test'
import assert from 'node:assert/strict'
import { LANGUAGES } from '../i18n/types'
import { ATS_CHECK_COPY, GLOBAL_ATS_NAMES } from './copy'

const REGIONAL = ['Gupy', 'Kenoby', 'Sólides', 'Solides', 'InfoJobs', 'Computrabajo', 'Personio']

test('o teste existe nos 12 idiomas', () => {
  for (const l of LANGUAGES) assert.ok(ATS_CHECK_COPY[l], l)
})

test('nenhum idioma cita ATS regional — o teste é global', () => {
  for (const l of LANGUAGES) {
    const all = JSON.stringify(ATS_CHECK_COPY[l])
    for (const name of REGIONAL) assert.ok(!all.includes(name), `${l} cita ${name}`)
    assert.equal(ATS_CHECK_COPY[l].bullets[0], GLOBAL_ATS_NAMES)
  }
})

test('texto de compartilhamento tem o marcador da nota', () => {
  for (const l of LANGUAGES) assert.ok(ATS_CHECK_COPY[l].shareText.includes('{score}'), l)
})

test('todo idioma explica o limite de um teste por pessoa', () => {
  for (const l of LANGUAGES) {
    assert.ok(ATS_CHECK_COPY[l].limitTitle.length > 5, l)
    assert.ok(ATS_CHECK_COPY[l].limitText.length > 20, l)
  }
})
