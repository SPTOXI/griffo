import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import {
  DICTIONARIES,
  LANGUAGES,
  detectLanguageFromCountry,
  dirForLang,
  localeForLang,
  type Language,
} from '@/lib/i18n'
import { jobSearchKeywords } from '@/lib/market/job-search-terms'
import { DocumentLanguage } from '@/components/i18n/document-language'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle2, FileSearch, ListOrdered, UserCheck } from 'lucide-react'

/**
 * `/hiring` — porta de entrada para quem acabou de se candidatar.
 *
 * ## Por que esta rota existe, e por que NÃO usa a palavra como se fôssemos
 * um empregador
 *
 * "Hiring" carrega uma direção: quem publica `#hiring` está OFERECENDO vaga.
 * O GriffoWork não oferece vaga nenhuma, então competir por esse termo como
 * anunciante seria atrair quem procura emprego e entregar outra coisa —
 * tráfego que não converte e sinal ruim para o buscador.
 *
 * O que a palavra captura de verdade é o instante SEGUINTE: a pessoa viu o
 * anúncio, se candidatou, e ficou com a dúvida "meu currículo passa?". Essa
 * dúvida é exatamente o que o produto responde. A página fala com esse
 * momento — daí o título ser "você respondeu à vaga", não "temos vagas".
 *
 * ## Idioma
 *
 * Mesmo padrão de `/market-pulse` e `/ats/[slug]` (§2.55, §2.82): `?lang=`
 * explícito → cookie de escolha manual → país da borda → inglês. Não se
 * inventa um quarto esquema de URL.
 */

const CANONICAL = 'https://griffo.work/hiring'

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
  const t = DICTIONARIES[lang].hiringPage

  return {
    title: t.metaTitle,
    description: t.metaDescription,
    // A hashtag em inglês MAIS o termo nativo — ver o cabeçalho de
    // `job-search-terms.ts`. Vale a ressalva honesta: o Google ignora a meta
    // `keywords` desde 2009, então o que de fato trabalha por estes termos é o
    // bloco visível `searchTitle`/`searchBody` no corpo da página. Isto aqui
    // acompanha o que `/ats` e o layout já fazem, e o Bing ainda considera.
    keywords: [...jobSearchKeywords(lang), 'ATS', 'GriffoWork'],
    alternates: {
      canonical: CANONICAL,
      languages: Object.fromEntries(
        LANGUAGES.map((l) => [localeForLang(l), `${CANONICAL}?lang=${l}`])
      ),
    },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      url: CANONICAL,
      siteName: 'GriffoWork',
      images: [{ url: '/logo-full.png', width: 693, height: 694, alt: t.metaTitle }],
      type: 'website',
      locale: localeForLang(lang),
    },
    twitter: {
      card: 'summary_large_image',
      title: t.metaTitle,
      description: t.metaDescription,
      images: ['/logo-full.png'],
    },
  }
}

export default async function HiringPage({ searchParams }: PageProps) {
  const lang = await resolveLanguage(searchParams)
  const t = DICTIONARIES[lang].hiringPage

  const steps = [
    { icon: FileSearch, title: t.step1Title, desc: t.step1Desc },
    { icon: ListOrdered, title: t.step2Title, desc: t.step2Desc },
    { icon: UserCheck, title: t.step3Title, desc: t.step3Desc },
  ]

  return (
    <div dir={dirForLang(lang)} className="min-h-screen flex flex-col bg-white font-sans overflow-x-hidden">
      <DocumentLanguage lang={lang} />
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo-icon.png" alt="GriffoWork" width={553} height={424} className="h-9 w-auto object-contain" />
            <span className="font-extrabold text-[#0B192E] text-lg tracking-tight">
              griffo<span className="text-[#0B63E5]">work</span>
            </span>
          </Link>
        </div>
      </header>

      {/* HERO — fala com quem acabou de se candidatar, não com quem contrata */}
      <section className="relative pt-12 pb-14 md:py-20 bg-gradient-to-b from-blue-50/60 via-white to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary px-3.5 py-1 text-xs font-bold rounded-full whitespace-normal leading-snug">
            {t.badge}
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0B192E] leading-tight">
            {t.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">{t.subtitle}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="w-full sm:w-auto bg-[#0B63E5] hover:bg-[#0052CC] text-white text-base h-auto min-h-12 py-3 px-8 shadow-lg font-bold whitespace-normal">
              <Link href="/">
                {t.ctaPrimary} <ArrowRight className="w-5 h-5 ml-2 shrink-0" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base h-auto min-h-12 py-3 px-7 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold whitespace-normal">
              <Link href="/">{t.ctaSecondary}</Link>
            </Button>
          </div>

          <p className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5 pt-1">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {t.trustNote}
          </p>
        </div>
      </section>

      {/* O QUE ACONTECE DEPOIS DO "CANDIDATAR-SE" — o mecanismo, sem número
          inventado: circula muito "X% nunca chega a um humano", e nada disso
          foi verificado por nós (§43). Descreve-se o processo, não a
          magnitude. */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B192E] text-center max-w-2xl mx-auto">
            {t.stepsTitle}
          </h2>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <li key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-primary font-bold flex items-center justify-center text-sm border border-blue-100 shrink-0">
                    {idx + 1}
                  </span>
                  <step.icon className="w-5 h-5 text-primary shrink-0" />
                </div>
                <h3 className="font-bold text-base text-[#0B192E]">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* OS DOIS MOMENTOS DA BUSCA
          A página nasceu falando com quem acabou de se candidatar. Este bloco
          alcança o outro lado do mesmo momento — quem ligou o `#OpenToWork` e
          espera ser encontrado — sem prometer vaga nenhuma, que é a linha que
          o §2.84 traçou. O que ele diz é factual e vale para os dois: o filtro
          automático é o mesmo. */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B192E]">{t.searchTitle}</h2>
          <p className="text-base text-slate-600 leading-relaxed">{t.searchBody}</p>
        </div>
      </section>

      {/* FECHAMENTO */}
      <section className="py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192E]">{t.closingTitle}</h2>
          <p className="text-base text-slate-600 leading-relaxed">{t.closingSubtitle}</p>
          <div className="pt-2">
            <Button asChild size="lg" className="w-full sm:w-auto bg-[#0B63E5] hover:bg-[#0052CC] text-white text-base h-auto min-h-12 py-3 px-8 shadow-lg font-bold whitespace-normal">
              <Link href="/">
                {t.ctaPrimary} <ArrowRight className="w-5 h-5 ml-2 shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} GriffoWork
        </div>
      </footer>
    </div>
  )
}
