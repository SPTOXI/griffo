import { jsonLd } from '@/lib/json-ld'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MARKETS, GLOBAL_MARKET, marketForCountry, marketById } from '@/lib/market'
import { countryName, COUNTRIES } from '@/lib/market/countries'
import { priceFor } from '@/lib/pricing/catalog'
import { DICTIONARIES, dirForLang } from '@/lib/i18n'
import { SUPPORTED_COUNTRY_SLUGS } from '@/lib/market/supported-slugs'
import { resumeTermFor } from '@/lib/market/regional-terms'
import { getOpenJobsCount } from '@/lib/jobs/open-count.server'
import { CountryPageClient } from './country-client'

export const dynamicParams = true

// As 41 rotas continuam estaticamente geradas (`generateStaticParams` abaixo)
// — só passam a revalidar em segundo plano a cada 5 minutos, igual à home em
// `src/app/page.tsx`, para que a contagem de vagas do Hero D não fique presa
// no valor do último build. A contagem em si vive em
// `lib/jobs/open-count.server.ts`, compartilhada com a home.
export const revalidate = 300

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

  // Título/descrição repetem, por idioma, a MESMA frase de posicionamento já
  // aprovada e traduzida em `heroD.eyebrow`/`heroD.title` de cada dicionário
  // (`src/lib/i18n/locales/*.ts`) — não um texto novo. Antes, só o inglês
  // dizia "Career Intelligence"; as outras 11 línguas ainda falavam da versão
  // anterior do produto ("análise de currículo por IA e pontuação ATS"), que
  // vazava para o preview de link do WhatsApp/redes sociais sempre que a rota
  // resolvia para uma dessas línguas.
  // Só a frase de posicionamento (igual a `heroD.eyebrow` de cada dicionário),
  // sem sufixo de "auditoria ATS"/"IA" anexado — o título é o nome da marca
  // + o conceito, não um resumo de feature.
  const titles: Record<string, string> = {
    pt: `GriffoWork ${cName} — Inteligência de Carreira`,
    es: `GriffoWork ${cName} — Inteligencia de Carrera`,
    en: `GriffoWork ${cName} — Career Intelligence`,
    de: `GriffoWork ${cName} — Karriere-Intelligenz`,
    fr: `GriffoWork ${cName} — Intelligence de Carrière`,
    it: `GriffoWork ${cName} — Intelligenza di Carriera`,
    ja: `GriffoWork ${cName} — キャリア・インテリジェンス`,
    nl: `GriffoWork ${cName} — Carrière-intelligentie`,
    sv: `GriffoWork ${cName} — Karriärintelligens`,
    zh: `GriffoWork ${cName} — 职业智能`,
    ar: `GriffoWork ${cName} — ذكاء المسار المهني`,
    ko: `GriffoWork ${cName} — 커리어 인텔리전스`,
  }

  // 13/09/2026 — três palavras trocadas por sinônimo exato após pesquisa real
  // no Google Trends (ver o cabeçalho de `job-search-terms.ts`): a frase e a
  // posição continuam as mesmas do Hero D (§2.120, "conectamos a
  // oportunidades, não a vagas"), só a palavra da negação virou a que o
  // mercado de fato mais busca — `Stellenanzeigen`→`Stellenangeboten` (de),
  // `annunci di lavoro`→`offerte di lavoro` (it), `jobbannonser`→`lediga
  // jobb` (sv). As outras 9 línguas já usavam a palavra de maior volume
  // confirmada no Trends; nada mudou nelas.
  const descriptions: Record<string, string> = {
    pt: `Conectamos você a oportunidades em ${cName}, não a vagas. Auditoria de currículo por IA em 8 dimensões, compatibilidade com ${atsList}, por apenas ${price.formatted}.`,
    es: `Te conectamos con oportunidades en ${cName}, no con ofertas de empleo. Auditoría de currículum con IA en 8 dimensiones, compatibilidad con ${atsList}, por solo ${price.formatted}.`,
    en: `We connect you to opportunities in ${cName}, not job postings. An 8-dimension AI ${term.nounLower} audit, ATS compatibility with ${atsList}, for just ${price.formatted}.`,
    de: `Wir verbinden Sie mit Chancen in ${cName}, nicht mit Stellenangeboten. KI-Lebenslauf-Audit in 8 Dimensionen, ATS-Kompatibilität mit ${atsList}, für nur ${price.formatted}.`,
    fr: `Nous vous connectons à des opportunités en ${cName}, pas à des offres d’emploi. Audit de CV par IA en 8 dimensions, compatibilité ATS avec ${atsList}, pour seulement ${price.formatted}.`,
    it: `Ti connettiamo a opportunità in ${cName}, non ad offerte di lavoro. Audit del curriculum con IA in 8 dimensioni, compatibilità ATS con ${atsList}, per soli ${price.formatted}.`,
    ja: `「求人」ではなく「機会」へつなぐ。${cName} 向け、AIによる職務経歴書の8次元診断と ${atsList} とのATS適合度チェックを、わずか ${price.formatted} で。`,
    nl: `Wij verbinden je met kansen in ${cName}, niet met vacatures. AI-cv-audit in 8 dimensies, ATS-compatibiliteit met ${atsList}, voor slechts ${price.formatted}.`,
    sv: `Vi kopplar dig till möjligheter i ${cName}, inte lediga jobb. AI-granskning av ditt CV i 8 dimensioner, ATS-kompatibilitet med ${atsList}, för endast ${price.formatted}.`,
    zh: `我们连接的是 ${cName} 的机会，而不是职位空缺。AI 简历 8 维度审核，兼容 ${atsList} 等 ATS 系统，仅需 ${price.formatted}。`,
    ar: `نصلك بالفرص في ${cName}، لا بالوظائف المُعلنة. تدقيق للسيرة الذاتية بالذكاء الاصطناعي على 8 أبعاد، وتوافق مع أنظمة ATS مثل ${atsList}، مقابل ${price.formatted} فقط.`,
    ko: `채용 공고가 아닌, ${cName}의 기회로 연결합니다. AI 이력서 8차원 감사와 ${atsList} ATS 호환성 검증을 단 ${price.formatted}에 제공합니다.`,
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
  const openJobsCount = await getOpenJobsCount()

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
        dangerouslySetInnerHTML={{ __html: jsonLd(countryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }}
      />
      {/* `dir` aqui, e não no `<html>`: o layout raiz é estático e compartilhado
          por todas as rotas, então ele não tem como saber que idioma esta rota
          serve sem virar dinâmico e derrubar o SSG das 41 páginas de país. Como
          `dir` é herdado, declará-lo no elemento que embrulha a página inteira
          tem o mesmo efeito visual — e vale também para o app autenticado, que
          o `CountryPageClient` monta neste mesmo lugar depois de hidratar. */}
      <div dir={dirForLang(market.jobLanguage)}>
        <CountryPageClient countryCode={effectiveCountry} lang={market.jobLanguage} openJobsCount={openJobsCount} />
      </div>
    </>
  )
}
