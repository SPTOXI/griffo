import test from 'node:test'
import assert from 'node:assert/strict'
import { LINKEDIN_ABOUT_MAX, LINKEDIN_HEADLINE_MAX, linkedinChecklistPrompt } from './linkedin-checklist'

test('a lista carrega os limites que o código usa', () => {
  const p = linkedinChecklistPrompt()
  assert.ok(p.includes(String(LINKEDIN_HEADLINE_MAX)))
  assert.ok(p.includes(String(LINKEDIN_ABOUT_MAX)))
})

// Foto, banner e "Em destaque" não chegam no texto. Se o prompt pedisse que
// fossem avaliados, o modelo inventaria o que não viu.
test('o que não é visível no texto é marcado como não avaliável', () => {
  assert.match(linkedinChecklistPrompt(), /NÃO dá para ver pelo texto/)
})
