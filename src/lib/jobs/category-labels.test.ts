import test from 'node:test'
import assert from 'node:assert/strict'
import { LANGUAGES } from '@/lib/i18n'
import { JOB_CATEGORY_SLUGS, categoryLabel } from './category-labels'

test('todo idioma tem rótulo pra todas as 20 categorias, sem string vazia', () => {
  for (const lang of LANGUAGES) {
    for (const slug of JOB_CATEGORY_SLUGS) {
      const label = categoryLabel(slug, lang)
      assert.ok(label && label.trim().length > 0, `"${lang}"/"${slug}" sem rótulo`)
    }
  }
})

test('slug desconhecido cai em "outros", nunca mostra o slug cru', () => {
  assert.equal(categoryLabel('categoria-inventada', 'pt'), categoryLabel('outros', 'pt'))
  assert.equal(categoryLabel('categoria-inventada', 'en'), categoryLabel('outros', 'en'))
})

test('vaga_remota tem rótulo próprio, diferente de "outros"', () => {
  for (const lang of LANGUAGES) {
    assert.notEqual(categoryLabel('vaga_remota', lang), categoryLabel('outros', lang))
  }
})
