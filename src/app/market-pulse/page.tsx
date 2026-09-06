import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { DICTIONARIES, LANGUAGES, detectLanguageFromCountry, dirForLang, localeForLang, type Language } from '@/lib/i18n'
import { loadHiringAtlas } from '@/lib/hiring-index/atlas.server'
import { displayCountry } from '@/lib/hiring-index/display'
import { buildHiringMapModel } from '@/lib/hiring-index/map-model'
import { HiringMapView } from '@/components/market/hiring-map'
import { DocumentLanguage } from '@/components/i18n/document-language'
import type { HiringAtlas } from '@/lib/hiring-index/atlas'

/**
 * `/market-pulse` — o mapa-múndi público de temperatura de contratação (§2.55).
 *
 * ## Por que esta rota, e por que ela é servidor
 *
 * `market-pulse` é segmento estático, então ele vence `[country]` no roteamento
 * do Next sem ambiguidade, e não colide: nenhuma entrada de
 * `lib/market/countries.ts` nem de `supported-slugs.ts` tem esse nome (país é
 * sempre sigla de duas letras, mais `global`).
 *
 * A página é renderizada no servidor pelo mesmo motivo de `[country]/page.tsx`:
 * ela existe para ser ENCONTRADA. Uma casca de cliente que busca o dado depois
 * de hidratar entrega HTML vazio para o Googlebot, para o GPTBot e para o
 * ClaudeBot — que é exatamente o público que esta página tem de alcançar. O
 * mapa, a distribuição e a tabela dos 98 países saem prontos na primeira
 * resposta.
 *
 * ## Idioma
 *
 * Sem país na URL, o idioma tem de ser resolvido aqui — e "resolvido" nunca
 * pode virar "português". O layout raiz já vazou português para `/us` e `/de`
 * uma vez (ver o comentário do `FAQPage` em `app/layout.tsx`), e esta página é
 * pública e indexável em 12 idiomas.
 *
 * A ordem é: `?lang=` explícito → cookie `griffo_lang` (escolha manual no
 * seletor) → país da borda (`cf-ipcountry`, depois `x-vercel-ip-country`, a
 * mesma ordem e o mesmo motivo de `lib/pricing/edge-country.ts`) → **inglês**.
 *
 * O recuo é inglês, e não o `'pt'` que `detectLanguageFromCountry` devolve para
 * entrada vazia: sem nenhum sinal, o padrão certo é o mesmo que o
 * `x-default` do `layout.tsx` já declara para tráfego sem correspondência de
 * idioma — a página global, que é em inglês. `detectLanguageFromCountry` só é
 * chamada quando há um país de verdade.
 */

const CANONICAL = 'https://griffo.work/market-pulse'

interface PageProps {
  searchParams: Promise<{ lang?: string }>
}

async function resolveLanguage(searchParams: Promise<{ lang?: string }>): Promise<Language> {
  const { lang } = await searchParams
  const requested = lang?.toLowerCase().trim()
  if (requested && (LANGUAGES as string[]).includes(requested)) return requested as Language

  const jar = await cookies()
  const chosen = jar.get('griffo_lang')?.value?.toLowerCase().trim()
  if (chosen && (LANGUAGES as string[]).includes(chosen)) return chosen as Language

  const h = await headers()
  const country = (h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || '').trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(country)) return detectLanguageFromCountry(country)

  return 'en'
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const lang = await resolveLanguage(searchParams)
  const dict = DICTIONARIES[lang]

  // O número de países vai no `<title>`/`description` porque é o que torna a
  // página citável — mas sai da MESMA consulta que desenha o mapa, nunca de uma
  // constante escrita à mão que envelheceria em silêncio na próxima coleta.
  let tracked = 0
  try {
    tracked = (await loadHiringAtlas()).distribution.tracked
  } catch {
    // Metadado não é lugar de derrubar a página. Sem o número, a descrição
    // ainda descreve a página; o corpo é que dirá que a consulta falhou.
  }

  const title = dict.hiringMap.pageTitle
  const description = dict.hiringMap.metaDescription.replace(
    '{count}',
    new Intl.NumberFormat(localeForLang(lang)).format(tracked)
  )

  return {
    title,
    description,
    alternates: {
      canonical: CANONICAL,
      languages: Object.fromEntries(
        LANGUAGES.map((l) => [localeForLang(l), `${CANONICAL}?lang=${l}`])
      ),
    },
    openGraph: {
      title,
      description,
      url: CANONICAL,
      siteName: 'GriffoWork',
      images: [{ url: '/logo-full.png', width: 693, height: 694, alt: title }],
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

/**
 * JSON-LD `Dataset`.
 *
 * É o formato que descreve "um conjunto de dados publicado", e é a diferença
 * entre um motor de resposta citar "o mapa da GriffoWork" e citar "98 países,
 * a partir de BLS, Eurostat, ILOSTAT e CEPALSTAT, atualizado em tal data".
 *
 * **Cada número aqui vem do atlas real.** Nada é escrito à mão: a contagem de
 * países, a lista de fontes, a cobertura geográfica e a data de atualização são
 * os mesmos valores que a tela desenha logo abaixo. Um JSON-LD que afirmasse
 * uma cobertura maior que a real seria a mesma fabricação que o produto
 * recusa na tela, só que dita para uma máquina.
 */
function datasetJsonLd(atlas: HiringAtlas, lang: Language) {
  const dict = DICTIONARIES[lang]
  const sources = [...new Set(atlas.countries.map((c) => c.sourceName).filter(Boolean))].sort()

  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${CANONICAL}#dataset`,
    name: dict.hiringMap.pageTitle,
    description: dict.hiringMap.metaDescription.replace(
      '{count}',
      String(atlas.distribution.tracked)
    ),
    url: CANONICAL,
    inLanguage: localeForLang(lang),
    creator: {
      '@type': 'Organization',
      name: 'GriffoWork',
      url: 'https://griffo.work',
    },
    ...(atlas.updatedAt ? { dateModified: atlas.updatedAt } : {}),
    ...(atlas.latestPeriod ? { temporalCoverage: `../${atlas.latestPeriod.slice(0, 10)}` } : {}),
    isBasedOn: sources.map((name) => ({ '@type': 'Dataset', name })),
    // Onde os dados podem ser BAIXADOS, não só vistos.
    //
    // O endpoint já era público e sem autenticação (é o mesmo que o teaser
    // da home consome a cada visita), mas nada no dado estruturado dizia
    // isso — então nem o Google Dataset Search nem um jornalista tinham
    // como descobrir que existe uma versão reutilizável. Um `Dataset` sem
    // `distribution` é uma página sobre dados; com ela, é uma fonte de
    // dados, que é o que se cita e linka.
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://griffo.work/api/hiring-index',
      },
    ],
    spatialCoverage: atlas.countries.map((summary) => ({
      '@type': 'Country',
      name: displayCountry(summary.country, lang),
      identifier: summary.country,
    })),
    variableMeasured: {
      '@type': 'PropertyValue',
      name: dict.hiringIndex.title,
      description: dict.hiringIndex.description,
      measurementTechnique: dict.hiringMap.methodBody,
    },
  }
}

export default async function MarketPulsePage({ searchParams }: PageProps) {
  const lang = await resolveLanguage(searchParams)
  const dict = DICTIONARIES[lang]

  let atlas: HiringAtlas | null = null
  try {
    atlas = await loadHiringAtlas()
  } catch (e: any) {
    console.error('[market-pulse] atlas indisponível:', e?.message || e)
  }

  return (
    <main
      dir={dirForLang(lang)}
      className="min-h-screen bg-white text-slate-900"
    >
      <DocumentLanguage lang={lang} />

      {atlas && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd(atlas, lang)) }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="mb-8">
          <Link href="/" className="text-sm font-bold text-brand-navy hover:underline">
            GriffoWork
          </Link>
        </nav>

        {atlas ? (
          /* O modelo é montado AQUI, no servidor, e o componente só desenha.
             Ver o cabeçalho de `lib/hiring-index/map-model.ts`: formatar nome
             de país no cliente fazia o React descartar a árvore inteira vinda
             do servidor, porque as tabelas de idioma do Node e do navegador
             discordam em alguns nomes. */
          <HiringMapView
            model={buildHiringMapModel(
              atlas,
              lang,
              dict.hiringMap,
              dict.hiringIndex,
              dict.continents
            )}
          />
        ) : (
          /* Consulta falhou. A página diz isso, e NÃO desenha um mapa inteiro
             sem cor — um mapa todo hachurado afirmaria que nenhum país do
             mundo tem fonte oficial, que é falso. */
          <p className="text-sm text-slate-700">{dict.hiringIndex.unavailable}</p>
        )}
      </div>
    </main>
  )
}
