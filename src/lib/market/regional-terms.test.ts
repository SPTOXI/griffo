import test from 'node:test'
import assert from 'node:assert/strict'
import { resumeTermFor } from './regional-terms'
import { LANGUAGES } from '../i18n'

test('mercados de convenção britânica dizem "CV", não "resume"', () => {
  for (const code of ['GB', 'IE', 'AU', 'NZ', 'ZA']) {
    assert.equal(resumeTermFor(code, 'en').noun, 'CV', `${code} deveria usar "CV"`)
  }
})

test('EUA e Canadá continuam em "Resume"', () => {
  assert.equal(resumeTermFor('US', 'en').noun, 'Resume')
  assert.equal(resumeTermFor('CA', 'en').noun, 'Resume')
})

test('mercado de inglês sem convenção clara cai no padrão, não num palpite', () => {
  // Índia, Singapura, Filipinas e Nigéria usam os dois termos conforme o
  // setor — o módulo NÃO tenta adivinhar, por decisão documentada.
  for (const code of ['IN', 'SG', 'PH', 'NG']) {
    assert.equal(resumeTermFor(code, 'en').noun, 'Resume')
  }
})

test('cada idioma não-inglês usa a palavra nativa, nunca "resume"', () => {
  const esperado: Record<string, string> = {
    pt: 'Currículo',
    es: 'Currículum',
    de: 'Lebenslauf',
    fr: 'CV',
    it: 'Curriculum',
    ja: '職務経歴書',
    nl: 'Cv',
    sv: 'CV',
    zh: '简历',
    ar: 'السيرة الذاتية',
    ko: '이력서',
  }
  for (const [lang, noun] of Object.entries(esperado)) {
    // O país não deve influenciar fora do inglês: `de` é Lebenslauf tanto em
    // /de quanto em /at.
    assert.equal(resumeTermFor('DE', lang).noun, noun, `idioma '${lang}'`)
    assert.equal(resumeTermFor('AT', lang).noun, noun, `idioma '${lang}' (outro país)`)
  }
})

test('os 12 idiomas suportados têm termo próprio — nenhum cai em "resume" por omissão', () => {
  // Trava contra idioma novo entrar em `LANGUAGES` sem alguém decidir como o
  // documento se chama nele: sem isto, a página nova sairia com keywords em
  // inglês sem ninguém perceber.
  for (const lang of LANGUAGES) {
    if (lang === 'en') continue
    const term = resumeTermFor('US', lang)
    assert.notEqual(
      term.noun,
      'Resume',
      `idioma '${lang}' não tem termo nativo declarado em NATIVE_TERM`
    )
  }
})

test('código de país aceita minúscula (as rotas são slugs minúsculos)', () => {
  assert.equal(resumeTermFor('gb', 'en').noun, 'CV')
  assert.equal(resumeTermFor('us', 'en').noun, 'Resume')
})
