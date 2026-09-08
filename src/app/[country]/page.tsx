import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MARKETS, GLOBAL_MARKET, marketForCountry, marketById } from '@/lib/market'
import { countryName, COUNTRIES } from '@/lib/market/countries'
import { priceFor } from '@/lib/pricing/catalog'
import { DICTIONARIES, dirForLang } from '@/lib/i18n'
import { SUPPORTED_COUNTRY_SLUGS } from '@/lib/market/supported-slugs'
import { resumeTermFor } from '@/lib/market/regional-terms'
import { CountryPageClient } from './country-client'

export const dynamicParams = true

/**
 * Nome do país de cada rota, no idioma que a PRÓPRIA página usa
 * (`market.jobLanguage`) — nunca em português fixo.
 *
 * Achado ao investigar por que `/us` saía com o título "GriffoWork Estados
 * Unidos" (nome em português) grudado numa tagline em inglês: `countryName()`
 * de `lib/market/countries.ts` só tem nome em português, por design — é a
 * lista da tela de perfil, documentada como tal ali. Usá-la aqui, onde a
 * página muda de idioma por rota, misturava os dois.
 *
 * Cobre só as 40 rotas não-`global` de `SUPPORTED_COUNTRY_SLUGS` — não as
 * 173 da lista de perfil — porque é só disso que o título/description de
 * CADA página precisa: o nome de SI MESMA, no idioma que ela já renderiza.
 */
const COUNTRY_NAME_BY_SLUG: Record<string, string> = {
  br: 'Brasil',
  us: 'United States',
  pt: 'Portugal',
  es: 'España',
  mx: 'México',
  gb: 'United Kingdom',
  ca: 'Canada',
  de: 'Deutschland',
  at: 'Österreich',
  fr: 'France',
  be: 'Belgique',
  lu: 'Luxembourg',
  it: 'Italia',
  au: 'Australia',
  nz: 'New Zealand',
  in: 'India',
  jp: '日本',
  pl: 'Poland',
  cz: 'Czech Republic',
  cl: 'Chile',
  my: 'Malaysia',
  tr: 'Turkey',
  za: 'South Africa',
  ae: 'الإمارات العربية المتحدة',
  co: 'Colombia',
  ar: 'Argentina',
  th: 'Thailand',
  ro: 'Romania',
  bg: 'Bulgaria',
  id: 'Indonesia',
  ph: 'Philippines',
  vn: 'Vietnam',
  ng: 'Nigeria',
  eg: 'Egypt',
  pk: 'Pakistan',
  bd: 'Bangladesh',
  ke: 'Kenya',
  sg: 'Singapore',
  nl: 'Nederland',
  ie: 'Ireland',
}

/**
 * Só os casos em que o nome em inglês diverge do nativo acima — usada no
 * JSON-LD (`SoftwareApplication`/`Offer`) mais abaixo neste arquivo, cujo
 * texto ao redor já é em inglês fixo independente do idioma da página (outra
 * frente do mesmo problema, não corrigida agora por ser escopo maior: o
 * JSON-LD inteiro não varia por `market.jobLanguage`, só o nome do país
 * precisava parar de contradizer o resto da frase).
 */
const COUNTRY_NAME_EN_BY_SLUG: Partial<Record<string, string>> = {
  br: 'Brazil',
  es: 'Spain',
  mx: 'Mexico',
  de: 'Germany',
  at: 'Austria',
  be: 'Belgium',
  it: 'Italy',
  jp: 'Japan',
  ae: 'United Arab Emirates',
  nl: 'Netherlands',
}

/** Nome do país em inglês, pra texto que é sempre em inglês (o JSON-LD). */
function countryNameEn(slug: string, code: string): string {
  return COUNTRY_NAME_EN_BY_SLUG[slug] ?? COUNTRY_NAME_BY_SLUG[slug] ?? countryName(code) ?? code
}

/**
 * hreflang completo das 41 rotas de país, derivado de `SUPPORTED_COUNTRY_SLUGS`
 * + `marketForCountry` — nunca uma lista copiada à mão.
 *
 * Antes desta correção (achado ao investigar por que o site não tinha
 * NENHUMA página indexada), o único hreflang do site vivia numa entrada do
 * `sitemap.ts` (a home, com 15 pares) e não existia em nenhuma página real —
 * nem sequer apontava de volta pra si mesma. A documentação oficial do
 * Google é direta sobre o que isso significa na prática: "If two pages
 * don't both point to each other, the tags will be ignored" — ou seja, o
 * hreflang inteiro estava sendo descartado, não só incompleto.
 *
 * Esta tabela corrige isso construindo o conjunto INTEIRO — cada uma das 41
 * rotas listando a si mesma e todas as outras, bidirecionalmente, porque
 * `generateMetadata` usa a MESMA constante em toda página. `global` vira
 * `x-default`, exatamente o uso que o Google recomenda para essa chave: é
 * literalmente a página de fallback internacional do produto.
 */
const HREFLANG_ALTERNATES: Record<string, string> = (() => {
  const alternates: Record<string, string> = {}
  for (const slug of SUPPORTED_COUNTRY_SLUGS) {
    if (slug === 'global') {
      alternates['x-default'] = `https://griffo.work/${slug}`
      continue
    }
    const code = slug.toUpperCase()
    const market = marketForCountry(code)
    alternates[`${market.jobLanguage}-${code}`] = `https://griffo.work/${slug}`
  }
  return alternates
})()

export function generateStaticParams() {
  return SUPPORTED_COUNTRY_SLUGS.map((country) => ({
    country,
  }))
}

interface PageProps {
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params
  const slug = country.toLowerCase().trim()
  const code = slug.toUpperCase()

  const isGlobal = slug === 'global'
  const isKnown = isGlobal || COUNTRIES.some((c) => c.code === code)

  if (!isKnown && !SUPPORTED_COUNTRY_SLUGS.includes(slug)) {
    return {}
  }

  const market = isGlobal ? GLOBAL_MARKET : marketForCountry(code)
  const cName = isGlobal ? 'Global' : COUNTRY_NAME_BY_SLUG[slug] || countryName(code) || code
  const price = priceFor(isGlobal ? 'US' : code, 'single')
  const atsList = market.ats.slice(0, 4).join(', ')
  // "CV" no Reino Unido/Austrália, "Resume" nos EUA/Canadá — o mesmo
  // documento com o nome que a pessoa daquele mercado realmente digita na
  // busca. Só muda dentro do inglês; ver `regional-terms.ts`.
  const term = resumeTermFor(isGlobal ? 'US' : code, market.jobLanguage)

  const titles: Record<string, string> = {
    pt: `GriffoWork ${cName} — Análise de Currículo por IA e Pontuação ATS`,
    es: `GriffoWork ${cName} — Auditoría de Currículum con IA y Puntuación ATS`,
    en: `GriffoWork ${cName} — AI Career Intelligence & ATS ${term.noun} Audit`,
    de: `GriffoWork ${cName} — KI-Lebenslauf-Analyse & ATS-Score-Prüfung`,
    fr: `GriffoWork ${cName} — Audit de CV par IA & Score de Compatibilité ATS`,
    it: `GriffoWork ${cName} — Analisi del Curriculum con IA & Punteggio ATS`,
    ja: `GriffoWork ${cName} — AI職務経歴書診断＆ATS適合度スコア`,
    nl: `GriffoWork ${cName} — AI Cv-Analyse & ATS-Score Verificatie`,
    sv: `GriffoWork ${cName} — AI CV-Granskning & ATS-Kompatibilitetstest`,
    zh: `GriffoWork ${cName} — AI 简历智能诊断与 ATS 筛选适配评测`,
    ar: `GriffoWork ${cName} — تدقيق السيرة الذاتية بالذكاء الاصطناعي واختبار توافق ATS`,
    ko: `GriffoWork ${cName} — AI 이력서 정밀 기술 평가 및 ATS 채용 필터 검증`,
  }

  const descriptions: Record<string, string> = {
    pt: `Otimize seu currículo para os padrões de recrutamento de ${cName}. Avaliação de compatibilidade com ${atsList} e laudo executivo em 8 dimensões por apenas ${price.formatted}.`,
    es: `Optimiza tu currículum para los estándares de contratación en ${cName}. Evaluación de compatibilidad con ${atsList} e informe ejecutivo en 8 dimensiones por solo ${price.formatted}.`,
    en: `Optimize your ${term.nounLower} for hiring standards in ${cName}. Audit ATS compatibility with ${atsList} and get an 8-dimension executive career report for just ${price.formatted}.`,
    de: `Optimieren Sie Ihren Lebenslauf für den Arbeitsmarkt in ${cName}. ATS-Kompatibilitätsprüfung für ${atsList} und 8-Dimensionen-Prüfbericht für nur ${price.formatted}.`,
    fr: `Optimisez votre CV selon les standards de recrutement en ${cName}. Audit de compatibilité avec ${atsList} et rapport exécutif en 8 dimensions pour seulement ${price.formatted}.`,
    it: `Ottimizza il tuo curriculum per gli standard di selezione in ${cName}. Valutazione di compatibilità con ${atsList} e report esecutivo in 8 dimensioni per soli ${price.formatted}.`,
    ja: `${cName} の採用基準に合わせて職務経歴書を最適化。${atsList} のATS適合度判定と8次元診断レポートをわずか ${price.formatted} でご提供。`,
    nl: `Optimaliseer je cv voor wervingsstandaarden in ${cName}. ATS-compatibiliteitstest voor ${atsList} en analyserapport in 8 dimensies voor slechts ${price.formatted}.`,
    sv: `Optimera ditt CV för rekryteringsstandarder i ${cName}. ATS-kompatibilitetstest för ${atsList} och granskningsrapport i 8 dimensioner för endast ${price.formatted}.`,
    zh: `针对 ${cName} 的主流招聘标准优化您的简历。全方位检测 ${atsList} 等主流 ATS 适配度并出具 8 维度评估报告，仅需 ${price.formatted}。`,
    ar: `حسّن سيرتك الذاتية وفقاً لمعايير التوظيف في ${cName}. تقييم التوافق مع ${atsList} وتقرير تنفيذي في 8 أبعاد مقابل ${price.formatted} فقط.`,
    ko: `${cName} 현지 채용 표준에 맞춰 이력서를 최적화하세요. ${atsList} ATS 호환성 검증과 8개 차원 정밀 진단 보고서를 단 ${price.formatted}에 제공합니다.`,
  }

  // `/global` é a única das 41 rotas travada em inglês (`GLOBAL_MARKET.jobLanguage
  // = 'en'`, fixo — a página nunca resolve `?lang=`/cookie/geo como `/market-pulse`
  // e `/hiring` fazem, decisão mantida por enquanto: mudar isso tornaria a rota
  // dinâmica e derrubaria o SSG que ela tem hoje). Por isso o título/descrição de
  // "remote work" só existe em inglês — escrever nos outros 11 idiomas não teria
  // efeito, já que nenhum deles chega a renderizar (§2.96, seguinte).
  //
  // O template genérico (`titles.en`) fala de "hiring standards in Global" —
  // "Global" não é um mercado que alguém busca; "remote work" é. Quem cai
  // aqui não está mirando um país, está buscando trabalho remoto
  // internacional, e o produto não tinha nenhum título/meta que dissesse isso.
  const title = isGlobal
    ? 'GriffoWork Global — AI Career Intelligence for International Remote Work'
    : titles[market.jobLanguage] || titles.en
  const description = isGlobal
    ? `Optimize your resume for international remote work opportunities. Audit ATS compatibility with ${atsList} and get an 8-dimension executive career report for just ${price.formatted}.`
    : descriptions[market.jobLanguage] || descriptions.en

  return {
    title,
    description,
    keywords: isGlobal
      ? ['griffowork', 'griffowork global', 'remote work', 'international remote work', 'work from anywhere', `${term.nounLower.toLowerCase()} ATS`, 'ATS score', ...market.ats]
      : [
          'griffowork',
          `griffowork ${cName.toLowerCase()}`,
          // O termo do documento no idioma/mercado da rota, não "curriculo" +
          // "resume" fixos em toda página (que deixava `/gb` sem "CV" e `/de`
          // sem "Lebenslauf" — as duas palavras que aquele público digita).
          `${term.nounLower.toLowerCase()} ${cName.toLowerCase()}`,
          `${term.nounLower.toLowerCase()} ATS`,
          'ATS score',
          ...market.ats,
        ],
    alternates: {
      canonical: `https://griffo.work/${slug}`,
      languages: HREFLANG_ALTERNATES,
    },
    openGraph: {
      title,
      description,
      url: `https://griffo.work/${slug}`,
      siteName: 'GriffoWork',
      images: [
        {
          url: '/logo-full.png',
          width: 693,
          height: 694,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo-full.png'],
    },
  }
}

export default async function CountryPage({ params }: PageProps) {
  const { country } = await params
  const slug = country.toLowerCase().trim()
  const code = slug.toUpperCase()

  const isGlobal = slug === 'global'
  const isKnown = isGlobal || COUNTRIES.some((c) => c.code === code)

  if (!isKnown && !SUPPORTED_COUNTRY_SLUGS.includes(slug)) {
    notFound()
  }

  const market = isGlobal ? GLOBAL_MARKET : marketForCountry(code)
  const effectiveCountry = isGlobal ? 'US' : code
  const price = priceFor(effectiveCountry, 'single')

  // Schema.org com preço e moeda do mercado específico
  const countryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `GriffoWork ${isGlobal ? 'Global' : countryNameEn(slug, code)}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: String(price.amount),
      priceCurrency: price.currency,
      description: `Complete executive resume audit in 8 dimensions for ${isGlobal ? 'Global Remote' : countryNameEn(slug, code)} market.`,
    },
    description: `AI Career Intelligence and ATS Optimization (${market.ats.join(', ')}) for ${isGlobal ? 'Global Remote' : countryNameEn(slug, code)}.`,
  }

  // FAQPage no idioma real da rota — o layout raiz não tem como saber qual
  // país está sendo servido, então não pode declarar isto sem fixar um
  // idioma para toda a rota-dinâmica. Cada rota país gera a sua própria.
  const dict = DICTIONARIES[market.jobLanguage] || DICTIONARIES.en
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ([1, 2, 3, 4, 5] as const).map((n) => ({
      '@type': 'Question',
      name: dict.faq[`q${n}` as keyof typeof dict.faq],
      acceptedAnswer: {
        '@type': 'Answer',
        text: dict.faq[`a${n}` as keyof typeof dict.faq],
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(countryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* `dir` aqui, e não no `<html>`: o layout raiz é estático e compartilhado
          por todas as rotas, então ele não tem como saber que idioma esta rota
          serve sem virar dinâmico e derrubar o SSG das 41 páginas de país. Como
          `dir` é herdado, declará-lo no elemento que embrulha a página inteira
          tem o mesmo efeito visual — e vale também para o app autenticado, que
          o `CountryPageClient` monta neste mesmo lugar depois de hidratar. */}
      <div dir={dirForLang(market.jobLanguage)}>
        <CountryPageClient countryCode={effectiveCountry} lang={market.jobLanguage} />
      </div>
    </>
  )
}
