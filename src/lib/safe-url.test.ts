import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isSafeHttpUrl, safeHttpUrl, safeProfileUrl } from './safe-url'

test('aceita http e https absolutos', () => {
  assert.equal(isSafeHttpUrl('https://exemplo.com/vaga/1'), true)
  assert.equal(isSafeHttpUrl('http://exemplo.com'), true)
  assert.equal(safeHttpUrl('  https://exemplo.com  '), 'https://exemplo.com')
})

test('recusa os esquemas que executam script', () => {
  // O caso que motivou o módulo: `escapeHtml` não altera nenhum destes.
  assert.equal(safeHttpUrl('javascript:alert(1)'), null)
  assert.equal(safeHttpUrl('JaVaScRiPt:alert(1)'), null)
  assert.equal(safeHttpUrl('data:text/html;base64,PHNjcmlwdD4='), null)
  assert.equal(safeHttpUrl('vbscript:msgbox(1)'), null)
  assert.equal(safeHttpUrl('file:///etc/passwd'), null)
})

test('recusa vazio, relativo e não-string', () => {
  assert.equal(safeHttpUrl(''), null)
  assert.equal(safeHttpUrl('   '), null)
  assert.equal(safeHttpUrl('/vagas/1'), null)
  assert.equal(safeHttpUrl(null), null)
  assert.equal(safeHttpUrl(42), null)
})

test('safeProfileUrl completa o esquema da forma abreviada', () => {
  // É como a tela de configurações pede o link, sem "https://".
  assert.equal(safeProfileUrl('linkedin.com/in/fulano'), 'https://linkedin.com/in/fulano')
  assert.equal(safeProfileUrl('https://github.com/fulano'), 'https://github.com/fulano')
})

test('safeProfileUrl não conserta esquema perigoso prefixando https', () => {
  // Prefixar produziria "https://javascript:alert(1)" — string inválida em vez
  // de recusa explícita.
  assert.equal(safeProfileUrl('javascript:alert(1)'), null)
  assert.equal(safeProfileUrl('data:text/html,<script>'), null)
})
