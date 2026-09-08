import test from 'node:test'
import assert from 'node:assert/strict'
import { DICTIONARIES } from './index'

/**
 * Trava a pendência 20 do handoff: nove dos doze termos nativos de "ATS"
 * (ao lado da sigla, nas páginas de ATS e no `blufSummary` da home) tinham
 * sido escritos como "termo padrão corrente, plausível mas NÃO confirmado".
 * Verificados contra fonte oficial nesta sessão — cada valor abaixo é o que
 * a busca confirmou, não o que "parecia certo":
 *
 * - **pt** `rastreamento de candidatos` — "sistema de rastreamento de
 *   candidatos" é título literal de sap.com/brazil sobre ATS.
 * - **en** `Applicant Tracking System` — a própria expansão da sigla, sem
 *   ambiguidade a verificar.
 * - **es** `sistema de seguimiento de candidatos` — já verificado no §2.83.
 * - **de** `Bewerbermanagementsystem` — já verificado no §2.83.
 * - **fr** `logiciel de recrutement` — usado por Flatchr, Kelio e Candidatus
 *   (SaaS de recrutamento francês) como sinônimo corrente de ATS.
 * - **it** `selezione del personale` — categoria em que a Randstad Itália
 *   publica seu próprio guia de ATS.
 * - **ja** `採用管理システム` — já verificado no §2.83.
 * - **nl** `recruitmentsoftware` — termo usado por Zoho NL, BuddeeHR e
 *   Magnet.me para nomear um ATS.
 * - **sv** `rekryteringssystem` — título do glossário da Teamtailor
 *   ("Vad är ett rekryteringssystem (ATS)?").
 * - **zh** `招聘管理系统` — título da página da Zoho China sobre ATS.
 * - **ar** `نظام تتبع المتقدمين` — termo usado por SAP MENA, Qureos,
 *   Elevatus e Jisr. **Corrigido nesta sessão**: a página de ATS árabe
 *   usava uma descrição de função ("فرز السير الذاتية", "triagem de
 *   currículo") em vez do termo, inconsistente com o próprio FAQ do
 *   arquivo (`hiringPage.faq.a1`), que já usava o termo certo.
 * - **ko** `채용관리시스템` — título de artigo da GreetingHR (plataforma
 *   de RH coreana) sobre ATS.
 */
const NATIVE_ATS_TERM = {
  pt: 'rastreamento de candidatos',
  en: 'Applicant Tracking System',
  es: 'sistema de seguimiento de candidatos',
  de: 'Bewerbermanagementsystem',
  fr: 'logiciel de recrutement',
  it: 'selezione del personale',
  ja: '採用管理システム',
  nl: 'recruitmentsoftware',
  sv: 'rekryteringssystem',
  zh: '招聘管理系统',
  ar: 'نظام تتبع المتقدمين',
  ko: '채용관리시스템',
} as const

test('todo idioma cita o termo nativo de ATS verificado em fonte, não um chute', () => {
  for (const [lang, termo] of Object.entries(NATIVE_ATS_TERM)) {
    const dict = DICTIONARIES[lang as keyof typeof DICTIONARIES]
    const corpo = `${dict.hero.blufSummary} ${dict.atsPage.heroBadge} ${dict.atsPage.metaDescription}`
    assert.ok(
      corpo.includes(termo),
      `"${lang}": termo nativo "${termo}" não aparece em blufSummary/heroBadge/metaDescription`
    )
  }
})

test('árabe não repete "فرز السير الذاتية" (descrição de função) no lugar do termo nativo', () => {
  // Defeito corrigido nesta sessão: a página de ATS árabe descrevia a
  // FUNÇÃO do ATS entre parênteses em vez de nomear o sistema — diferente
  // de toda outra língua, que usa "ATS (termo nativo)" ou "termo nativo
  // (ATS)". O FAQ do mesmo arquivo (`a1`) já usava o termo certo; só o
  // `heroBadge`/`metaDescription` da página em si estavam desalinhados.
  const p = DICTIONARIES.ar.atsPage
  assert.ok(!p.heroBadge.includes('فرز السير الذاتية'), 'heroBadge árabe voltou a descrever função em vez de nomear o ATS')
  assert.ok(!p.metaDescription.includes('نظام ATS لفرز'), 'metaDescription árabe voltou ao texto sem o termo nativo')
})
