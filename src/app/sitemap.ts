import type { MetadataRoute } from 'next'
import { ATS_SLUGS } from '@/lib/ats/meta'
import { atsLanguagesFor } from '@/lib/ats/content'
import { localeForLang, LANGUAGES } from '@/lib/i18n'

const COUNTRIES = [
  'br', 'us', 'pt', 'es', 'mx', 'gb', 'ca', 'de', 'at', 'fr', 'be', 'lu',
  'it', 'au', 'nz', 'in', 'jp', 'global',
  'pl', 'cz', 'cl', 'my', 'tr', 'za', 'ae', 'co', 'ar', 'th', 'ro', 'bg',
  'id', 'ph', 'vn', 'ng', 'eg', 'pk', 'bd', 'ke', 'sg', 'nl', 'ie'
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://griffo.work'
  const lastModified = new Date()

  // 1. Root page
  //
  // Sem `alternates.languages` aqui de propósito (tinha, mas incompleto e não
  // bidirecional — o Google descarta hreflang assim). A raiz reescreve pro
  // país da borda (`middleware.ts`) e renderiza a MESMA página de
  // `[country]/page.tsx`, que agora carrega o hreflang completo das 41 rotas
  // via `generateMetadata` — uma fonte só, não duas listas que podem divergir.
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ]

  // 2. Mapa público de temperatura de contratação (§2.55).
  //
  // `changeFrequency: 'monthly'` porque é o ritmo REAL da fonte: BLS publica
  // mensalmente, Eurostat/ILOSTAT/CEPALSTAT por trimestre. Declarar 'daily'
  // aqui seria pedir rastreamento para uma página que não muda — e ensinar o
  // rastreador a desconfiar do resto do arquivo.
  //
  // As alternativas de idioma apontam para `?lang=`, que é como a própria
  // página resolve o idioma quando não há país na URL.
  routes.push({
    url: `${baseUrl}/market-pulse`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
    // Derivado de `LANGUAGES`, e não escrito à mão. Os 12 pares literais que
    // ficavam aqui eram idênticos ao que a derivação produz — conferido par a
    // par antes da troca —, mas nada os obrigava a continuar assim: um 13º
    // idioma entraria em `LANGUAGES`, passaria no `i18n.test.ts`, ganharia
    // `/ats` e `/hiring` funcionando, e sumiria calado deste bloco. Um
    // hreflang incompleto é o defeito que o §2.69 já custou a este projeto.
    alternates: {
      languages: Object.fromEntries(
        LANGUAGES.map((l) => [localeForLang(l), `${baseUrl}/market-pulse?lang=${l}`])
      ),
    },
  })

  // 2b. `/hiring` — porta de entrada para quem acabou de se candidatar.
  //
  // `changeFrequency: 'monthly'` porque é copy de captação, não dado que se
  // atualiza — declarar 'daily' pediria rastreamento para uma página que não
  // muda, e ensinaria o rastreador a desconfiar do resto do arquivo (mesma
  // razão do `/market-pulse` acima).
  //
  // Os 12 idiomas saem de `LANGUAGES`, não de lista escrita à mão: o bloco
  // do `/market-pulse` logo acima ainda é literal e vai divergir no dia em
  // que um 13º idioma entrar.
  routes.push({
    url: `${baseUrl}/hiring`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
    alternates: {
      languages: Object.fromEntries(
        LANGUAGES.map((l) => [localeForLang(l), `${baseUrl}/hiring?lang=${l}`])
      ),
    },
  })

  // 3. Country / Market specific pages
  for (const country of COUNTRIES) {
    routes.push({
      url: `${baseUrl}/${country}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: country === 'br' || country === 'us' || country === 'pt' || country === 'es' || country === 'mx' || country === 'de' || country === 'fr' || country === 'it' || country === 'jp' ? 0.9 : 0.8,
    })
  }

  // 4. ATS Systems & High-intent compatibility pages
  //
  // `alternates.languages` sai de `atsLanguagesFor`, que é a interseção
  // entre os idiomas que o guia declara e os que têm conteúdo escrito — não
  // da intenção editorial. Declarar um idioma sem conteúdo apontaria o
  // hreflang para 404, e hreflang que não fecha faz o Google descartar o
  // bloco INTEIRO (§2.69), não só a linha errada.
  for (const slug of ATS_SLUGS) {
    const langs = atsLanguagesFor(slug)
    if (langs.length === 0) continue
    routes.push({
      url: `${baseUrl}/ats/${slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85,
      ...(langs.length > 1
        ? {
            alternates: {
              languages: Object.fromEntries(
                langs.map((l) => [localeForLang(l), `${baseUrl}/ats/${slug}?lang=${l}`])
              ),
            },
          }
        : {}),
    })
  }

  return routes
}
