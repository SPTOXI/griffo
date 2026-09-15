'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, ShieldCheck, Download, TrendingUp, Target, CheckCircle2,
  ArrowRight, Brain, Search, Award, Lock, Users, BarChart3, Zap, Globe, Share2,
  Check, HelpCircle, ChevronDown, Star, MessageSquare, Menu, X, FileSearch, Edit3,
  Instagram, Radar as RadarIcon
} from 'lucide-react'
import { useAuth } from '@/store/auth'
import { useI18n } from '@/context/i18n-context'
import { DICTIONARIES, dirForLang, brandTaglineForLang, localeForLang, type Language } from '@/lib/i18n'
import { displayCountry } from '@/lib/hiring-index/display'
import { FOOTER_MARKET_SLUGS } from '@/lib/market/footer-markets'
import { DocumentLanguage } from '@/components/i18n/document-language'
import { LanguageSelector } from '@/components/ui/language-selector'
import { contactEmail, contactMailto, salesMailto } from '@/lib/i18n/contact'
import { priceFor } from '@/lib/pricing/catalog'
import { localMethodLabels } from '@/lib/pricing/payment-methods'
import type { CountryJobCount } from '@/lib/jobs/open-count.server'
import { countryLabel } from '@/lib/jobs/country-labels'
import { HiringIndexTeaser } from './hiring-index-teaser'
import { HeroD } from './hero-d'
import { OrderBand } from './order-band'

export interface LandingProps {
  onNavigate: (v: 'login' | 'signup' | 'app') => void
  countryCode?: string
  forcedLang?: Language
  /** Contagem real de vagas ativas (resolvida no servidor) — ver `src/app/page.tsx`. */
  openJobsCount?: number
  /** Vagas por país, mesma fonte — só a home (`src/app/page.tsx`) resolve
   *  isto hoje; as 41 rotas de país recebem lista vazia e a seção não
   *  aparece (ver `jobsByCountry` em `landing.tsx`). */
  jobsByCountry?: CountryJobCount[]
}

export function Landing({
  onNavigate,
  countryCode,
  forcedLang,
  openJobsCount = 0,
  jobsByCountry = [],
}: LandingProps) {
  const { user } = useAuth()
  const { t: contextT, lang: contextLang, detectedCountry: contextCountry, langManuallySet } = useI18n()
  // Palpite automático (geo-IP/navegador) nunca vence o idioma da rota de
  // país — é assim que `/br` não vira inglês sozinho pro visitante com
  // Chrome em inglês. Mas ESCOLHA MANUAL (seletor de idioma, ou preferência
  // já salva de uma visita anterior) precisa vencer, senão o seletor clica e
  // a página não muda — era exatamente esse o defeito antes desta linha.
  const lang = langManuallySet && contextLang ? contextLang : forcedLang || contextLang || 'pt'
  const t = DICTIONARIES[lang] || contextT || DICTIONARIES.pt
  const effectiveCountry = countryCode || contextCountry || 'BR'
  // O país da borda ou rota serve para ESCOLHER A MOEDA que a landing exibe, e para
  // nada além disso. Quem decide o que será cobrado é o país do meio de
  // pagamento, resolvido no servidor — ver lib/pricing/resolve.ts.
  const price = priceFor(effectiveCountry, 'single')
  const paymentMethods = localMethodLabels(effectiveCountry)
  // Piso de exibição por nome — mesma disciplina do mapa de contratação
  // (`hiring-map.tsx`): país com 1-2 vagas isolado pareceria mais fraco do
  // que o produto realmente é. O resto soma num "+N países", número real,
  // nunca omitido — ver `open-count.server.ts` para o porquê de o piso viver
  // aqui (decisão de apresentação) e não na consulta (decisão de dado).
  const MIN_COUNTRY_JOBS_TO_LIST = 30
  const shownCountries = jobsByCountry.filter((c) => c.count >= MIN_COUNTRY_JOBS_TO_LIST)
  const otherCountries = jobsByCountry.filter((c) => c.count < MIN_COUNTRY_JOBS_TO_LIST)
  const otherCountriesJobs = otherCountries.reduce((sum, c) => sum + c.count, 0)
  const numberFormat = new Intl.NumberFormat(localeForLang(lang))

  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div dir={dirForLang(lang)} className="min-h-screen flex flex-col bg-white font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* `lang` resolvido acima, e não o do contexto: em rota de país os dois
          divergem de propósito (ver o comentário da linha do `langManuallySet`),
          e é justamente ali que o `<html lang>` estava errado. */}
      <DocumentLanguage lang={lang} />
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 sm:min-h-22 py-2 flex items-center justify-between gap-4 flex-wrap transition-all">
          <div className="flex items-center gap-3.5 sm:gap-4 cursor-pointer group shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Image
              src="/logo-icon.png"
              alt="GriffoWork Logo"
              width={94}
              height={72}
              priority
              className="h-13 sm:h-16 md:h-18 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-[#0B192E] text-2xl sm:text-3xl tracking-tight">griffo<span className="text-[#0B63E5]">work</span></span>
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#0B63E5] mt-1">{brandTaglineForLang(lang)}</span>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex flex-wrap items-center justify-end gap-x-6 lg:gap-x-8 gap-y-1.5 text-sm font-medium">
            <a href="#features" className="whitespace-nowrap text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.features}</a>
            <a href="#social" className="whitespace-nowrap text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.social}</a>
            <a href="#how" className="whitespace-nowrap text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.howItWorks}</a>
            <a href="#pricing" className="whitespace-nowrap text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.plans}</a>
            <a href="#faq" className="whitespace-nowrap text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.faq}</a>
            <a href="/market-pulse" className="whitespace-nowrap text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.marketPulse}</a>
          </nav>

          {/* DESKTOP CTAS & LANGUAGE SELECTOR */}
          <div className="hidden md:flex items-center gap-3 shrink-0 flex-wrap justify-end">
            <LanguageSelector />

            {user ? (
              <Button onClick={() => onNavigate('app')} size="sm" className="bg-[#0B63E5] hover:bg-[#0052CC] text-white shadow-md font-semibold">
                {t.nav.myPanel} <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <>
                <Button onClick={() => onNavigate('login')} size="sm" variant="ghost" className="text-slate-700 hover:text-slate-900 font-medium">
                  {t.nav.login}
                </Button>
                <Button onClick={() => onNavigate('signup')} size="sm" className="bg-[#0B63E5] hover:bg-[#0052CC] text-white shadow-md font-semibold px-4">
                  {t.nav.freeAnalysis}
                </Button>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE BUTTON & LANGUAGE SELECTOR */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE NAV DROPDOWN MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 shadow-xl">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-50">{t.nav.features}</a>
              <a href="#social" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-50">{t.nav.social}</a>
              <a href="#how" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-50">{t.nav.howItWorks}</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-50">{t.nav.plans}</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-50">{t.nav.faq}</a>
              <a href="/market-pulse" className="px-3 py-2 rounded-md hover:bg-slate-50">{t.nav.marketPulse}</a>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <Button onClick={() => { setMobileMenuOpen(false); onNavigate('app') }} className="w-full bg-[#0B63E5] hover:bg-[#0052CC]">
                  {t.nav.myPanel} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <>
                  <Button onClick={() => { setMobileMenuOpen(false); onNavigate('login') }} variant="outline" className="w-full">
                    {t.nav.login}
                  </Button>
                  <Button onClick={() => { setMobileMenuOpen(false); onNavigate('signup') }} className="w-full bg-[#0B63E5] hover:bg-[#0052CC]">
                    {t.nav.freeAnalysis}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
      {/* HERO D — única direção aprovada do handoff de design; ver hero-d.tsx */}
      <HeroD t={t} lang={lang} openJobsCount={openJobsCount} onNavigate={onNavigate} />

      {/* "A ordem importa" — cadeia inteligência → análise → auditoria →
          otimização → direcionamento → Radar; ver order-band.tsx. Não confundir
          com a seção "HOW IT WORKS" mais abaixo, que fala do fluxo de uso do
          produto (envio → laudo → reescrita), não da tese de posicionamento. */}
      <OrderBand t={t} />

      {/* DIFERENCIAIS — foto de fundo (aperto de mão) sobre gradiente escuro;
          os 4 cards reaproveitam texto já aprovado em produção, sem cópia
          nova: Otimização/Radar/Preparação vêm de `orderBand` (mesmos
          `step4/6/7`), Orientação de Carreira vem de `features.f8` — ver
          handoff "imagem de fundo — seção Diferenciais". */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        <Image src="/diferenciais-bg.jpg" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B192E]/95 to-[#0B192E]/88" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="border-white/20 text-white/80 px-3 py-1 text-xs">
              {t.differentials.badge}
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-3">
              {t.differentials.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <DifferentialCard icon={<Target className="w-5 h-5" />} title={t.orderBand.step4Title} desc={t.orderBand.step4Body} />
            <DifferentialCard icon={<RadarIcon className="w-5 h-5" />} title={t.orderBand.step6Title} desc={t.orderBand.step6Body} />
            <DifferentialCard icon={<MessageSquare className="w-5 h-5" />} title={t.orderBand.step7Title} desc={t.orderBand.step7Body} />
            <DifferentialCard icon={<TrendingUp className="w-5 h-5" />} title={t.features.f8Title} desc={t.features.f8Desc} />
          </div>
        </div>
      </section>

      {/* VAGAS POR PAÍS — só a home resolve `jobsByCountry` hoje (ver
          `LandingProps`); nas rotas de país a lista vem vazia e a seção
          inteira não renderiza, de propósito (ver §2.127). */}
      {shownCountries.length > 0 && (
        <section className="relative border-t border-slate-200/80 bg-white overflow-hidden">
          {/* `<img>` puro, não `next/image`: SVG local não passa pelo
              otimizador sem `dangerouslyAllowSVG` (não configurado no
              projeto), e não há ganho de otimizar um vetor já leve. */}
          <img
            src="/world-map-bg.svg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.15] pointer-events-none select-none"
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
            <div className="text-center mb-10">
              <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs">
                {t.jobsByCountry.badge}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0B192E] mt-3">
                {t.jobsByCountry.title}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {shownCountries.map(({ country, count }) => (
                <div
                  key={country}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-center"
                >
                  <p className="text-lg font-bold text-[#0B192E] tabular-nums">
                    {numberFormat.format(count)}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{countryLabel(country, lang)}</p>
                </div>
              ))}
            </div>
            {otherCountries.length > 0 && (
              <p className="text-center text-sm text-slate-500 mt-6">
                {t.jobsByCountry.moreCountries
                  .replace('{jobs}', numberFormat.format(otherCountriesJobs))
                  .replace('{countries}', String(otherCountries.length))}
              </p>
            )}
          </div>
        </section>
      )}

      {/* STATS BAR */}
      <section className="border-y border-slate-200/80 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          <Stat icon={<Brain className="w-5 h-5" />} value={t.stats.dimTitle} label={t.stats.dimSub} />
          <Stat icon={<Target className="w-5 h-5" />} value={t.stats.atsTitle} label={t.stats.atsSub} />
          <Stat icon={<Globe className="w-5 h-5" />} value={t.stats.globalTitle} label={t.stats.globalSub} />
          <Stat icon={<Download className="w-5 h-5" />} value={t.stats.pdfTitle} label={t.stats.pdfSub} />
        </div>
      </section>

      <HiringIndexTeaser t={t} />

      {/* GLOBAL SOCIAL PRESENCE FEATURE HIGHLIGHT */}
      <section id="social" className="py-14 sm:py-20 md:py-24 bg-gradient-to-br from-[#0B192E] via-slate-950 to-[#0B192E] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-[#0B63E5]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="space-y-5">
              <Badge className="bg-[#0B63E5]/20 text-blue-300 border-blue-500/30 hover:bg-[#0B63E5]/20 px-3 py-1 font-bold">
                <Globe className="w-3.5 h-3.5 mr-1.5 text-[#0B63E5]" /> {t.social.badge}
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
                {t.social.title}
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                {t.social.subtitle}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <p className="font-semibold text-blue-400 text-sm flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-[#0B63E5]" /> {t.social.card1Title}
                  </p>
                  <p className="text-xs text-slate-300">{t.social.card1Sub}</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <p className="font-semibold text-blue-400 text-sm flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#0B63E5]" /> {t.social.card2Title}
                  </p>
                  <p className="text-xs text-slate-300">{t.social.card2Sub}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur space-y-3.5 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 leading-snug">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0B63E5]" /> {t.social.optInTitle}
                </span>
                <Badge className="bg-white/10 text-white shrink-0 w-fit">{t.social.lgpdBadge}</Badge>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1 leading-normal">{t.social.linkedInHead}</p>
                  <p className="text-xs text-white leading-relaxed break-words">{t.social.linkedInExample}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1 leading-normal">{t.social.behanceHead}</p>
                  <p className="text-xs text-white leading-relaxed break-words">{t.social.behanceExample}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1 leading-normal">{t.social.gupyHead}</p>
                  <p className="text-xs text-white leading-relaxed break-words">{t.social.gupyExample}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs">{t.features.badge}</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B192E] mt-3 mb-3">{t.features.title}</h2>
          <p className="text-sm sm:text-base text-slate-600">{t.features.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Diagnóstico e descoberta */}
          <Feature icon={<BarChart3 className="w-5 h-5" />} title={t.features.f1Title} desc={t.features.f1Desc} />
          <Feature icon={<FileSearch className="w-5 h-5" />} title={t.features.f7Title} desc={t.features.f7Desc} />
          <Feature icon={<Search className="w-5 h-5" />} title={t.features.f2Title} desc={t.features.f2Desc} />
          {/* Preparação */}
          <Feature icon={<Sparkles className="w-5 h-5" />} title={t.features.f3Title} desc={t.features.f3Desc} />
          <Feature icon={<TrendingUp className="w-5 h-5" />} title={t.features.f8Title} desc={t.features.f8Desc} />
          <Feature icon={<Edit3 className="w-5 h-5" />} title={t.features.f9Title} desc={t.features.f9Desc} />
          {/* Entrega e confiança */}
          <Feature icon={<Share2 className="w-5 h-5" />} title={t.features.f4Title} desc={t.features.f4Desc} />
          <Feature icon={<Download className="w-5 h-5" />} title={t.features.f5Title} desc={t.features.f5Desc} />
          <Feature icon={<ShieldCheck className="w-5 h-5" />} title={t.features.f6Title} desc={t.features.f6Desc} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-[#0B192E] text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="bg-white/10 text-blue-300 hover:bg-white/10 px-3 py-1 font-bold">{t.how.badge}</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mt-3 mb-3">{t.how.title}</h2>
            <p className="text-sm sm:text-base text-slate-300">{t.how.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { n: '01', t: t.how.s1Title, d: t.how.s1Desc },
              { n: '02', t: t.how.s2Title, d: t.how.s2Desc },
              { n: '03', t: t.how.s3Title, d: t.how.s3Desc },
              { n: '04', t: t.how.s4Title, d: t.how.s4Desc },
              { n: '05', t: t.how.s5Title, d: t.how.s5Desc },
            ].map((s) => (
              <div key={s.n} className="relative">
                <div className="rounded-xl bg-white/5 border border-white/10 p-5 h-full space-y-2">
                  <div className="text-[#0B63E5] text-xs font-bold">{s.n}</div>
                  <h3 className="font-bold text-base">{s.t}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING & CREDIT PACKAGES */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900 px-3 py-1 text-xs font-bold">{t.pricing.badge}</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B192E] mt-3 mb-3">{t.pricing.title}</h2>
          <p className="text-sm sm:text-base text-slate-600">{t.pricing.subtitle}</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <PlanCard
            name={t.pricing.productTitle}
            price={price.formatted}
            period={t.pricing.oneTime}
            features={t.pricing.items}
            cta={t.pricing.buyCta}
            onCta={() => onNavigate('signup')}
            footnote={t.pricing.localPayment
              .replace('{currency}', price.currency)
              .replace('{methods}', paymentMethods.join(' / '))}
            priceCaption={t.pricing.currencyFollowsAccess}
          />
        </div>

        {/* PRÉVIA GRATUITA — o que traz a pessoa para dentro */}
        <div className="mt-10 bg-gradient-to-br from-[#0B192E] via-slate-900 to-[#0B192E] text-white rounded-3xl p-6 sm:p-8 shadow-xl max-w-3xl mx-auto border border-blue-900/40 text-center space-y-3">
          <Badge variant="outline" className="border-emerald-400 text-emerald-300 bg-emerald-950/50 text-xs font-bold">
            {t.pricing.previewTitle}
          </Badge>
          <h3 className="text-xl sm:text-2xl font-bold text-white">{t.pricing.previewTitle}</h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">{t.pricing.previewDesc}</p>
          <Button
            onClick={() => onNavigate('signup')}
            className="bg-white text-[#0B192E] hover:bg-blue-50 font-extrabold h-11 px-6"
          >
            {t.pricing.previewCta} <ArrowRight className="w-4 h-4 ml-2 text-[#0B63E5]" />
          </Button>
        </div>

        {/* EMPRESAS E RH — sem autosserviço, por decisão.
            §7.9/§2.105: "workforce" como audiência nova (RH/planejamento de
            força de trabalho), não só quem compra laudo de currículo — daí o
            segundo link, pro /market-pulse, ao lado do CTA comercial que já
            existia. `businessDesc` também passou a citar o atlas. */}
        <div className="mt-6 max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="font-bold text-[#0B192E] text-sm">{t.pricing.businessTitle}</p>
            <p className="text-xs text-slate-600 mt-0.5">{t.pricing.businessDesc}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <Button asChild variant="ghost" className="text-[#0B63E5] font-semibold text-xs h-10">
              <a href="/market-pulse">{t.pricing.businessDataCta} <ArrowRight className="w-3.5 h-3.5 ml-1" /></a>
            </Button>
            <Button asChild variant="outline" className="border-slate-300 text-[#0B192E] font-bold text-xs h-10">
              <a href={salesMailto(lang)}>{t.pricing.businessCta}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="bg-slate-50 py-16 md:py-24 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs font-bold">{t.faq.badge}</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B192E] mt-3 mb-2">{t.faq.title}</h2>
            <p className="text-slate-600 text-sm">{t.faq.subtitle}</p>
          </div>

          <div className="space-y-3">
            {[
              { q: t.faq.q1, a: t.faq.a1 },
              { q: t.faq.q2, a: t.faq.a2 },
              { q: t.faq.q3, a: t.faq.a3 },
              { q: t.faq.q4, a: t.faq.a4 },
              { q: t.faq.q5, a: t.faq.a5 },
            ].map((faq, index) => (
              <div key={index} className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
                <button
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full p-4 text-left font-bold text-[#0B192E] text-sm flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <span className="pr-2">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${openFaq === index ? 'rotate-180 text-[#0B63E5]' : ''}`} />
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className={`px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 ${openFaq === index ? '' : 'hidden'}`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 text-center">
        <div className="bg-gradient-to-br from-[#0B192E] via-slate-900 to-[#0B63E5] rounded-3xl p-6 sm:p-12 text-white shadow-2xl space-y-5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            {t.ctaFinal.title}
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto text-sm sm:text-base">
            {t.ctaFinal.subtitle}
          </p>
          <div className="pt-2">
            <Button onClick={() => onNavigate('signup')} size="lg" className="w-full sm:w-auto bg-white text-[#0B192E] hover:bg-blue-50 h-auto min-h-12 sm:min-h-13 py-3 px-8 text-base font-extrabold shadow-lg whitespace-normal">
              {t.ctaFinal.button} <ArrowRight className="w-5 h-5 ml-2 text-[#0B63E5] shrink-0" />
            </Button>
          </div>
        </div>
      </section>
      </main>

      {/* FOOTER WITH OFFICIAL LOGO */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Image src="/logo-icon.png" alt="GriffoWork Logo" width={100} height={77} className="h-11 sm:h-12 w-auto object-contain shrink-0" />
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-[#0B192E] text-xl tracking-tight">griffo<span className="text-[#0B63E5]">work</span></span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#0B63E5] mt-0.5">{brandTaglineForLang(lang)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.footer.desc}
            </p>
          </div>
          <div>
            <h3 className="font-extrabold text-[#0B192E] text-xs uppercase tracking-wider mb-3">{t.footer.navTitle}</h3>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li><a href="#features" className="hover:text-[#0B63E5] transition-colors">{t.nav.features}</a></li>
              <li><a href="#social" className="hover:text-[#0B63E5] transition-colors">{t.nav.social}</a></li>
              <li><a href="#pricing" className="hover:text-[#0B63E5] transition-colors">{t.nav.plans}</a></li>
              <li><a href="#how" className="hover:text-[#0B63E5] transition-colors">{t.nav.howItWorks}</a></li>
              <li><a href="/market-pulse" className="hover:text-[#0B63E5] transition-colors">{t.nav.marketPulse}</a></li>
              {/* Link interno para `/hiring` — sem ele a página fica ÓRFÃ
                  (só no sitemap), e o Google despriorriza fortemente URL que
                  nenhuma página referencia. Confirmado no Search Console:
                  32 URLs paradas em "Detectada, mas não indexada", que é
                  exatamente o estado de quem foi descoberto pelo sitemap e
                  não tem link apontando. */}
              <li><a href="/hiring" className="hover:text-[#0B63E5] transition-colors">{t.nav.hiring}</a></li>
              {/* Griffo Enterprise (B2B) — Fase 4 do plano de SEO/GEO
                  (2026-09-10/11): único link interno do domínio consumer pra
                  seção nova, pra fluir link equity já indexado pro
                  `/enterprise`, que ainda não tem nenhum outro backlink
                  interno além do sitemap. */}
              <li><a href="/enterprise" className="hover:text-[#0B63E5] transition-colors">{t.footer.forCompanies}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-extrabold text-[#0B192E] text-xs uppercase tracking-wider mb-3">{t.footer.secTitle}</h3>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> LGPD & GDPR Compliant</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> Data Encryption</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> Privacy First</li>
            </ul>
          </div>
          <div>
            <h3 className="font-extrabold text-[#0B192E] text-xs uppercase tracking-wider mb-3">{t.footer.contactTitle}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {/* O endereço acompanha o idioma da página — ver lib/i18n/contact.ts. */}
              <a href={contactMailto(lang)} className="hover:text-[#0B63E5] transition-colors">
                {contactEmail(lang)}
              </a><br/>
              <strong>https://griffo.work</strong><br/>
              São Paulo, SP · Brasil
            </p>
            <a
              href="https://www.instagram.com/griffowork"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-600 font-medium hover:text-primary transition-colors mt-2"
            >
              <Instagram className="w-3.5 h-3.5 shrink-0" /> @griffowork
            </a>
          </div>
        </div>

        {/* SEO INTERNAL LINKS — Mercados & Guias ATS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 border-t border-slate-200/60 text-xs text-slate-500 space-y-2.5">
          {/* Nomes por `displayCountry`, no idioma da tela. Estavam escritos à
              mão em português — "Brasil (BR)", "Estados Unidos (US)",
              "Alemanha (DE)" — no rodapé das 54 páginas públicas, inclusive nas
              onze línguas que não são português. A lista de slugs vem de
              `FOOTER_MARKET_SLUGS`, que garante um link permanente para cada
              casa de idioma do hreflang: sem isso, `/ae` (a casa do árabe)
              ficava sem nenhum link interno apontando para ela. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
            <span className="font-bold text-slate-700">{t.footer.marketsTitle}</span>
            {FOOTER_MARKET_SLUGS.map((slug) => (
              <a key={slug} href={`/${slug}`} className="inline-block py-1.5 hover:text-primary transition-colors">
                {displayCountry(slug.toUpperCase(), lang)} ({slug.toUpperCase()})
              </a>
            ))}
            <a href="/global" className="inline-block py-1.5 hover:text-primary transition-colors">{t.footer.globalRemote}</a>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
            <span className="font-bold text-slate-700">{t.footer.atsTitle}</span>
            <a href="/ats/gupy" className="inline-block py-1.5 hover:text-primary transition-colors">Gupy</a>
            <a href="/ats/workday" className="inline-block py-1.5 hover:text-primary transition-colors">Workday</a>
            <a href="/ats/greenhouse" className="inline-block py-1.5 hover:text-primary transition-colors">Greenhouse</a>
            <a href="/ats/lever" className="inline-block py-1.5 hover:text-primary transition-colors">Lever</a>
            <a href="/ats/taleo" className="inline-block py-1.5 hover:text-primary transition-colors">Taleo</a>
            <a href="/ats/solides" className="inline-block py-1.5 hover:text-primary transition-colors">Solides</a>
            <a href="/ats/icims" className="inline-block py-1.5 hover:text-primary transition-colors">iCIMS</a>
            <a href="/ats/ashby" className="inline-block py-1.5 hover:text-primary transition-colors">Ashby</a>
            <a href="/ats/infojobs" className="inline-block py-1.5 hover:text-primary transition-colors">InfoJobs</a>
            <a href="/ats/personio" className="inline-block py-1.5 hover:text-primary transition-colors">Personio</a>
          </div>
        </div>

        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} {t.footer.rights}
        </div>
      </footer>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-blue-50 text-[#0B63E5] flex items-center justify-center mb-1 border border-blue-100">{icon}</div>
      <p className="text-xl sm:text-2xl font-bold text-[#0B192E]">{value}</p>
      <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">{label}</p>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="border-slate-200/90 hover:shadow-lg transition-all hover:border-blue-300 h-full bg-white">
      <CardContent className="p-5 sm:p-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B63E5] flex items-center justify-center mb-4 border border-blue-100">{icon}</div>
        <h3 className="font-bold text-[#0B192E] text-base mb-2">{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  )
}

/** Card da seção "Diferenciais" — mesmo formato do `Feature`, mas para o
 *  fundo escuro com foto (texto branco, translúcido, sem `Card`/`CardContent`
 *  porque não há necessidade de sombra/hover claro nesse contexto). */
function DifferentialCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.14] bg-white/[0.06] backdrop-blur p-5 sm:p-6 h-full">
      <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mb-4 border border-white/[0.14]">{icon}</div>
      <h3 className="font-bold text-white text-base mb-2">{title}</h3>
      <p className="text-xs text-white/70 leading-relaxed">{desc}</p>
    </div>
  )
}

/**
 * O cartão do produto. Um só.
 *
 * Recebia `perCredit` e `popular` porque havia quatro cartões lado a lado e um
 * deles precisava ser marcado como o mais vendido. Com um produto só não há
 * comparação a fazer nem preço unitário a exibir — o preço É o preço.
 */
function PlanCard({ name, price, period, features, cta, onCta, footnote, priceCaption }: {
  name: string
  price: string
  period: string
  features: string[]
  cta: string
  onCta: () => void
  footnote?: string
  priceCaption?: string
}) {
  return (
    <Card className="relative border-2 border-[#0B63E5] shadow-xl bg-white flex flex-col justify-between">
      <CardContent className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-[#0B192E] text-xl">{name}</h3>
          <p className="text-xs text-slate-500 mb-4">{period}</p>
          <div className="mb-6">
            <span className="text-4xl sm:text-5xl font-extrabold text-[#0B192E]">{price}</span>
            {priceCaption && <p className="text-[11px] text-slate-500 mt-1.5">{priceCaption}</p>}
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5 mb-6">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#0B63E5] shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <Button onClick={onCta} className="w-full h-12 font-bold bg-[#0B63E5] hover:bg-[#0052CC] text-white shadow-md">
            {cta}
          </Button>
          {footnote && <p className="text-[11px] text-slate-500 text-center">{footnote}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
