import test from 'node:test'
import assert from 'node:assert/strict'
import { DICTIONARIES } from './index'
import type { Language } from './index'
import { CONTACT_EMAIL, SALES_EMAIL, contactEmail, contactMailto, salesMailto } from './contact'

const LANGUAGES = Object.keys(DICTIONARIES) as Language[]

test('o e-mail de contato é padronizado como contact@griffo.work em todos os idiomas', () => {
  assert.equal(CONTACT_EMAIL, 'contact@griffo.work')
  for (const lang of LANGUAGES) {
    assert.equal(contactEmail(lang), 'contact@griffo.work')
  }
})

test('o mailto de contato aponta para contact@griffo.work com o assunto localizado', () => {
  for (const lang of LANGUAGES) {
    assert.ok(
      contactMailto(lang).startsWith(`mailto:${CONTACT_EMAIL}?subject=`),
      `idioma ${lang} não apontou para ${CONTACT_EMAIL}`
    )
  }
  assert.notEqual(contactMailto('en'), contactMailto('pt'))
  assert.notEqual(contactMailto('ja'), contactMailto('de'))
})

test('vendas mantém caixa padrão e traduz apenas o assunto', () => {
  assert.equal(SALES_EMAIL, 'sales@griffo.work')
  for (const lang of LANGUAGES) {
    assert.ok(
      salesMailto(lang).startsWith(`mailto:${SALES_EMAIL}?subject=`),
      `idioma ${lang} apontou vendas para outro endereço`
    )
  }
  assert.notEqual(salesMailto('en'), salesMailto('pt'))
})
