import test from 'node:test'
import assert from 'node:assert/strict'
import { DICTIONARIES } from './index'
import type { Language } from './index'
import { SALES_EMAIL, contactEmail, contactMailto, salesMailto } from './contact'

const LANGUAGES = Object.keys(DICTIONARIES) as Language[]

test('cada idioma do produto tem um endereço de contato', () => {
  for (const lang of LANGUAGES) {
    assert.match(
      contactEmail(lang),
      /^[a-z]+@griffo\.work$/,
      `idioma ${lang} sem endereço de contato válido`
    )
  }
})

test('os endereços seguem a grafia de cada idioma', () => {
  assert.equal(contactEmail('pt'), 'contato@griffo.work')
  assert.equal(contactEmail('es'), 'contacto@griffo.work')
  assert.equal(contactEmail('en'), 'contact@griffo.work')
})

test('trocar de idioma troca o endereço', () => {
  const enderecos = new Set(LANGUAGES.map(contactEmail))
  assert.equal(
    enderecos.size,
    LANGUAGES.length,
    'dois idiomas compartilham o mesmo endereço — a troca de idioma não muda nada na página'
  )
})

test('o mailto de contato aponta para o endereço do idioma', () => {
  assert.equal(contactMailto('es'), 'mailto:contacto@griffo.work')
})

// Vendas é o caso oposto e proposital: uma caixa só, assunto no idioma de quem
// clica. Se alguém traduzir o endereço junto com o assunto, as mensagens passam
// a cair numa caixa que não existe.
test('vendas mantém uma caixa só e traduz apenas o assunto', () => {
  for (const lang of LANGUAGES) {
    assert.ok(
      salesMailto(lang).startsWith(`mailto:${SALES_EMAIL}?subject=`),
      `idioma ${lang} apontou vendas para outro endereço`
    )
  }
  assert.notEqual(salesMailto('en'), salesMailto('pt'))
})
