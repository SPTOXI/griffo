import type { MetadataRoute } from 'next'
import { ATS_SLUGS } from '@/lib/ats/meta'
import { atsLanguagesFor } from '@/lib/ats/content'
import { ATS_CHECK_LANGS, ATS_CHECK_PATH } from '@/lib/ats-check/copy'
import { localeForLang, LANGUAGES } from '@/lib/i18n'
import { SUPPORTED_COUNTRY_SLUGS } from '@/lib/market/supported-slugs'
import { MIN_JOBS_TO_INDEX, areaToUrl } from '@/lib/city-jobs/city-index'
import { MIN_CITIES_TO_INDEX_MAP } from '@/lib/city-jobs/city-coords'
import { CITY_JOBS_COUNTRY_SLUGS } from '@/lib/city-jobs/context'

// A MESMA lista que gera as rotas estáticas, não uma cópia.
//
// Aqui vivia um literal de 41 slugs, idêntico ao de `supported-slugs.ts` — e
// nada obrigava os dois a continuarem iguais. Ao acrescentar `se`, `cn` e `kr`
// às rotas pré-geradas (§2.86), eles nasceram pré-gerados e AUSENTES do
// sitemap: três páginas construídas que nenhum buscador seria avisado que
// existem. Duas listas que precisam concordar e não têm quem as obrigue é o
// mesmo defeito que o §2.86 acabara de corrigir no hreflang, reaparecendo no
// arquivo ao lado.
const COUNTRIES = SUPPORTED_COUNTRY_SLUGS

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // 2c. Griffo Enterprise (B2B) — landing + páginas-pilar da Fase 1/3 do
  // plano de SEO/GEO (2026-09-10/11). `changeFrequency: 'monthly'`, mesmo
  // raciocínio do `/market-pulse` e do `/hiring` acima: é copy institucional,
  // não dado que muda todo dia.
  //
  // Os 12 idiomas saem de `LANGUAGES`, igual às rotas acima — nunca lista
  // escrita à mão (§2.69 já custou caro ao projeto por causa disso).
  const enterpriseRoutes = [
    `${baseUrl}/enterprise`,
    `${baseUrl}/enterprise/external-recruitment`,
    `${baseUrl}/enterprise/internal-mobility`,
  ]
  for (const url of enterpriseRoutes) {
    routes.push({
      url,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          LANGUAGES.map((l) => [localeForLang(l), `${url}?lang=${l}`])
        ),
      },
    })
  }

  // 3. Country / Market specific pages
  for (const country of COUNTRIES) {
    routes.push({
      url: `${baseUrl}/${country}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: country === 'br' || country === 'us' || country === 'pt' || country === 'es' || country === 'mx' || country === 'de' || country === 'fr' || country === 'it' || country === 'jp' ? 0.9 : 0.8,
    })
  }

  // Teste ATS grátis — a porta de entrada sem cadastro.
  routes.push({
    url: `${baseUrl}${ATS_CHECK_PATH}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.9,
    alternates: {
      languages: Object.fromEntries(
        ATS_CHECK_LANGS.map((l) => [localeForLang(l), `${baseUrl}${ATS_CHECK_PATH}?lang=${l}`])
      ),
    },
  })

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

  // 5. Vagas por país, cidade e área (`/[país]/jobs/...`), em todos os países
  // com rota própria. Só as páginas com vagas suficientes para não serem
  // ralas — as outras existem com `noindex`. Se o banco falhar, o sitemap sai
  // sem elas em vez de não sair. Import dinâmico: o módulo é `server-only`, e
  // `submit-indexnow.ts` roda este arquivo fora do Next — lá a falha cai no
  // `catch` em vez de derrubar o script.
  try {
    const { loadCityIndex, listJobs } = await import('@/lib/city-jobs/city-index.server')
    const { loadMapPoints } = await import('@/lib/city-jobs/city-coords.server')
    const mapCities = new Map<string, number>()
    for (const p of await loadMapPoints().catch(() => [])) mapCities.set(p.c, (mapCities.get(p.c) ?? 0) + 1)
    for (const slug of CITY_JOBS_COUNTRY_SLUGS) {
      const code = slug.toUpperCase()
      const cities = (await loadCityIndex(code)).filter((c) => c.total >= MIN_JOBS_TO_INDEX)
      const remote = (await listJobs({ country: code, rawCities: null, area: null, work: 'remote', level: null, page: 1 })).total
      if (cities.length === 0 && remote < MIN_JOBS_TO_INDEX) continue
      routes.push({ url: `${baseUrl}/${slug}/jobs`, lastModified, changeFrequency: 'daily', priority: 0.8 })
      if (remote >= MIN_JOBS_TO_INDEX) {
        routes.push({ url: `${baseUrl}/${slug}/jobs/remote`, lastModified, changeFrequency: 'daily', priority: 0.7 })
      }
      if ((mapCities.get(code) ?? 0) >= MIN_CITIES_TO_INDEX_MAP) {
        routes.push({ url: `${baseUrl}/${slug}/jobs/map`, lastModified, changeFrequency: 'daily', priority: 0.6 })
      }
      for (const c of cities) {
        const city = `${baseUrl}/${slug}/jobs/${encodeURIComponent(c.slug)}`
        routes.push({ url: city, lastModified, changeFrequency: 'daily', priority: 0.7 })
        for (const a of c.areas) {
          if (a.count < MIN_JOBS_TO_INDEX) continue
          routes.push({ url: `${city}/${areaToUrl(a.area)}`, lastModified, changeFrequency: 'daily', priority: 0.6 })
        }
      }
    }
  } catch (e) {
    console.error('sitemap: city jobs index failed', e)
  }

  return routes
}
