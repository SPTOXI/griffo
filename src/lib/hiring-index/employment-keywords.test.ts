import test from 'node:test'
import assert from 'node:assert/strict'
import { employmentKeywords } from './employment-keywords'
import { LANGUAGES, DICTIONARIES } from '../i18n'

test('todo idioma tem ao menos uma keyword de mercado de trabalho', () => {
  for (const lang of LANGUAGES) {
    const kw = employmentKeywords(lang)
    assert.ok(
      kw.length > 0,
      `"${lang}" cairia no recuo em inglês — o /market-pulse desapareceria ` +
        `para quem busca em registro institucional no próprio idioma`
    )
  }
})

test('a frase de mercado de trabalho já existe no copy visível do próprio idioma', () => {
  // Ao menos uma keyword por idioma vem literalmente do
  // `hiringMap.metaDescription`/`intro`, não é inventada aqui — este teste é
  // a trava contra divergir sem perceber. (O inglês usa "labour-market" com
  // hífen no copy; a keyword solta "labour market" cobre a mesma busca sem
  // precisar bater caractere a caractere.)
  for (const lang of LANGUAGES) {
    const corpo = DICTIONARIES[lang].hiringMap.metaDescription + DICTIONARIES[lang].hiringMap.intro
    const algumaVemDoCopy = employmentKeywords(lang).some((termo) => corpo.includes(termo))
    assert.ok(
      algumaVemDoCopy,
      `"${lang}": nenhuma keyword aparece no copy real de hiringMap — todas foram inventadas`
    )
  }
})

test('japonês, chinês, coreano e árabe usam a palavra verificada em fonte oficial, não um composto inventado', () => {
  // 雇用/就业/고용/العمالة confirmados contra fonte oficial (ver cabeçalho do
  // arquivo); "雇用統計"/"就业统计"/"고용 통계" não foram confirmados como termo
  // padrão, por isso não entram.
  assert.deepEqual(employmentKeywords('ja'), ['労働市場', '雇用'])
  assert.deepEqual(employmentKeywords('zh'), ['劳动力市场', '就业'])
  assert.deepEqual(employmentKeywords('ko'), ['노동시장', '고용'])
  assert.deepEqual(employmentKeywords('ar'), ['سوق العمل', 'العمالة'])
})

test('árabe não repete a palavra de "contratação" já usada no pageTitle', () => {
  // `التوظيف` é a palavra de contratação (usada no pageTitle, "خريطة عالمية
  // لحرارة التوظيف") — mesma distinção de direção do §2.84 entre "hiring" e
  // "employment", só que dentro do próprio árabe.
  const kw = employmentKeywords('ar')
  assert.ok(!kw.includes('التوظيف'), 'keywords de emprego em árabe reusando a palavra de contratação')
})
