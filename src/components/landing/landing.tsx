'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Sparkles, ShieldCheck, Download, TrendingUp, Target, CheckCircle2,
  ArrowRight, Brain, Search, Award, Lock, Users, BarChart3, Zap, Globe, Share2,
  Check, HelpCircle, ChevronDown, Star, MessageSquare, Menu, X, FileSearch, Edit3
} from 'lucide-react'
import { useAuth } from '@/store/auth'
import { useI18n } from '@/context/i18n-context'
import { LanguageSelector } from '@/components/ui/language-selector'

export function Landing({ onNavigate }: { onNavigate: (v: 'login' | 'signup' | 'app') => void }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png" alt="GriffoWork Logo" className="h-10 w-auto object-contain rounded-md shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-[#0B192E] text-xl tracking-tight">griffo<span className="text-[#0B63E5]">work</span></span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#0B63E5] mt-0.5">Análise de Currículo por IA</span>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.features}</a>
            <a href="#social" className="text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.social}</a>
            <a href="#how" className="text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.howItWorks}</a>
            <a href="#pricing" className="text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.plans}</a>
            <a href="#faq" className="text-slate-600 hover:text-[#0B63E5] transition-colors">{t.nav.faq}</a>
          </nav>

          {/* DESKTOP CTAS & LANGUAGE SELECTOR */}
          <div className="hidden md:flex items-center gap-3">
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

      {/* HERO */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-white pointer-events-none" />
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 sm:w-[500px] h-80 sm:h-[500px] rounded-full bg-blue-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 sm:w-[500px] h-80 sm:h-[500px] rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
            <div className="space-y-5 sm:space-y-6 text-left">
              <Badge variant="outline" className="border-blue-300 bg-blue-50 text-[#0B63E5] px-3 py-1 text-xs font-bold rounded-full shadow-xs max-w-full truncate">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#0B63E5] shrink-0 inline" /> {t.hero.badge}
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B192E] leading-[1.1]">
                {t.hero.title1}<span className="bg-gradient-to-r from-[#0B192E] via-[#0B63E5] to-[#2563EB] bg-clip-text text-transparent">{t.hero.titleAccent}</span>{t.hero.title2}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                {t.hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button onClick={() => onNavigate('signup')} size="lg" className="w-full sm:w-auto bg-[#0B63E5] hover:bg-[#0052CC] text-white text-base h-12 sm:h-13 px-8 shadow-lg shadow-blue-600/25 font-bold">
                  {t.hero.ctaPrimary} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button onClick={() => onNavigate('login')} size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 sm:h-13 px-7 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold">
                  {t.hero.ctaSecondary}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#0B63E5] shrink-0" /> {t.hero.badgeFree}</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#0B63E5] shrink-0" /> {t.hero.badgeNoCard}</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#0B63E5] shrink-0" /> {t.hero.badgeSecurity}</span>
                <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-[#0B63E5] shrink-0" /> {t.hero.badgeSafe}</span>
              </div>
            </div>

            {/* INTERACTIVE MOCKUP CARD */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 rounded-3xl transform rotate-1 blur-lg -z-10" />
              <Card className="shadow-2xl border-slate-200/90 rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="bg-[#0B192E] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500/80" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-medium text-slate-300 flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> {t.mockup.title}
                    </span>
                    <Badge className="bg-[#0B63E5]/20 text-blue-300 text-[9px] sm:text-[10px] font-semibold border-none shrink-0">{t.mockup.precision}</Badge>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">{t.mockup.overallScore}</p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-4xl sm:text-5xl font-extrabold text-[#0B192E]">8.7</span>
                          <span className="text-slate-400 font-medium text-xs sm:text-sm">/ 10</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className="bg-blue-100 text-[#0B63E5] border-blue-200 font-bold px-2 py-0.5 text-[10px] sm:text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-[#0B63E5] inline" /> {t.mockup.atsApproved}
                        </Badge>
                        <p className="text-[10px] sm:text-[11px] text-slate-500">{t.mockup.atsSub}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { l: t.mockup.dim1, s: 9.2, color: 'bg-[#0B63E5]' },
                        { l: t.mockup.dim2, s: 8.8, color: 'bg-[#0B63E5]' },
                        { l: t.mockup.dim3, s: 8.5, color: 'bg-[#0B63E5]' },
                        { l: t.mockup.dim4, s: 8.3, color: 'bg-indigo-600' },
                      ].map((d) => (
                        <div key={d.l}>
                          <div className="flex justify-between text-[11px] sm:text-xs mb-1 font-medium">
                            <span className="text-slate-700 truncate pr-2">{d.l}</span>
                            <span className="font-bold text-[#0B192E] shrink-0">{d.s.toFixed(1)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.s * 10}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-3 sm:p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B192E]">
                        <Share2 className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> {t.mockup.suggestionTitle}
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {t.mockup.suggestionText}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-slate-200/80 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          <Stat icon={<Brain className="w-5 h-5" />} value={t.stats.dimTitle} label={t.stats.dimSub} />
          <Stat icon={<Target className="w-5 h-5" />} value={t.stats.atsTitle} label={t.stats.atsSub} />
          <Stat icon={<Globe className="w-5 h-5" />} value={t.stats.globalTitle} label={t.stats.globalSub} />
          <Stat icon={<Download className="w-5 h-5" />} value={t.stats.pdfTitle} label={t.stats.pdfSub} />
        </div>
      </section>

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

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0B63E5]" /> {t.social.optInTitle}
                </span>
                <Badge className="bg-white/10 text-white shrink-0">{t.social.lgpdBadge}</Badge>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">{t.social.linkedInHead}</p>
                  <p className="text-xs text-white">"Senior Data Engineer | Python, PySpark, Dataproc, BigQuery | High-Performance Data Pipeline Specialist"</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">{t.social.behanceHead}</p>
                  <p className="text-xs text-white">"Highlight case studies with quantified impact (e.g. 'Redesign that boosted conversion by +35%') on portfolio covers."</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">{t.social.gupyHead}</p>
                  <p className="text-xs text-white">"Ensure exact keyword alignment with terms like 'Scrum', 'Jest', and 'Micro-frontends'."</p>
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
          <Feature icon={<BarChart3 className="w-5 h-5" />} title={t.features.f1Title} desc={t.features.f1Desc} />
          <Feature icon={<Search className="w-5 h-5" />} title={t.features.f2Title} desc={t.features.f2Desc} />
          <Feature icon={<Sparkles className="w-5 h-5" />} title={t.features.f3Title} desc={t.features.f3Desc} />
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto items-stretch mb-12">
          <PlanCard
            name={t.pricing.entryTitle}
            price="R$ 9,90 / $1.99"
            period={t.pricing.entryDesc}
            features={[
              '40 credits / créditos',
              '2 complete audit reports',
              'Audit & AI Rewrite choice',
              'PDF & Editable downloads',
              'Exclusive welcome offer',
            ]}
            highlight={true}
            cta={t.pricing.buyCta}
            onCta={() => onNavigate('signup')}
          />
          <PlanCard
            name={t.pricing.starterTitle}
            price="R$ 29,90 / $5.99"
            period={t.pricing.starterDesc}
            features={[
              '100 credits / créditos',
              '5 complete audit reports',
              'Audit & AI Rewrite choice',
              'PDF & Editable downloads',
              'No expiration or monthly fees',
            ]}
            highlight={false}
            cta={t.pricing.buyCta}
            onCta={() => onNavigate('signup')}
          />
          <PlanCard
            name={t.pricing.carreiraTitle}
            price="R$ 99,90 / $19.99"
            period={t.pricing.carreiraDesc}
            features={[
              '500 credits / créditos',
              '25 complete audit reports',
              'Audit & AI Rewrite choice',
              'LinkedIn & ATS Optimization',
              'Best platform value',
              'No expiration of credits',
            ]}
            highlight={true}
            popular
            cta={t.pricing.buyCta}
            onCta={() => onNavigate('signup')}
          />
          <PlanCard
            name={t.pricing.profTitle}
            price="R$ 249,90 / $49.99"
            period={t.pricing.profDesc}
            features={[
              '1,500 credits / créditos',
              '75 complete audit reports',
              'Audit & AI Rewrite choice',
              'Power user & agency access',
              'Highest credit discount',
              'Priority dedicated support',
            ]}
            highlight={false}
            cta={t.pricing.buyCta}
            onCta={() => onNavigate('signup')}
          />
        </div>

        {/* GUIA EXPLICATIVO: AVALIAÇÃO VS REESCRITA */}
        <div className="bg-gradient-to-br from-[#0B192E] via-slate-900 to-[#0B192E] text-white rounded-3xl p-6 sm:p-8 shadow-xl max-w-5xl mx-auto border border-blue-900/40">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <Badge variant="outline" className="border-blue-400 text-blue-300 bg-blue-950/60 text-xs mb-2 font-bold">
              GriffoWork
            </Badge>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {t.pricing.guideTitle}
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm">
              {t.pricing.guideSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 space-y-3 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-blue-400 font-bold text-base">
                <FileSearch className="w-6 h-6 shrink-0 text-[#0B63E5]" />
                <span>{t.pricing.tool1Title}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {t.pricing.tool1Desc}
              </p>
              <div className="text-xs text-blue-300 font-semibold pt-1">
                {t.pricing.tool1Ideal}
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 space-y-3 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-base">
                <Edit3 className="w-6 h-6 shrink-0 text-indigo-400" />
                <span>{t.pricing.tool2Title}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {t.pricing.tool2Desc}
              </p>
              <div className="text-xs text-indigo-300 font-semibold pt-1">
                {t.pricing.tool2Ideal}
              </div>
            </div>
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
                  className="w-full p-4 text-left font-bold text-[#0B192E] text-sm flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <span className="pr-2">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${openFaq === index ? 'rotate-180 text-[#0B63E5]' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
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
            <Button onClick={() => onNavigate('signup')} size="lg" className="w-full sm:w-auto bg-white text-[#0B192E] hover:bg-blue-50 h-12 sm:h-13 px-8 text-base font-extrabold shadow-lg">
              {t.ctaFinal.button} <ArrowRight className="w-5 h-5 ml-2 text-[#0B63E5]" />
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER WITH OFFICIAL LOGO */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="GriffoWork Logo" className="h-9 w-auto object-contain rounded-md shrink-0" />
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-[#0B192E] text-base tracking-tight">griffo<span className="text-[#0B63E5]">work</span></span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#0B63E5]">Global AI Career Intelligence</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.footer.desc}
            </p>
          </div>
          <div>
            <h4 className="font-extrabold text-[#0B192E] text-xs uppercase tracking-wider mb-3">{t.footer.navTitle}</h4>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li><a href="#features" className="hover:text-[#0B63E5] transition-colors">{t.nav.features}</a></li>
              <li><a href="#social" className="hover:text-[#0B63E5] transition-colors">{t.nav.social}</a></li>
              <li><a href="#pricing" className="hover:text-[#0B63E5] transition-colors">{t.nav.plans}</a></li>
              <li><a href="#how" className="hover:text-[#0B63E5] transition-colors">{t.nav.howItWorks}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-extrabold text-[#0B192E] text-xs uppercase tracking-wider mb-3">{t.footer.secTitle}</h4>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> LGPD & GDPR Compliant</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> Data Encryption</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> Privacy First</li>
            </ul>
          </div>
          <div>
            <h4 className="font-extrabold text-[#0B192E] text-xs uppercase tracking-wider mb-3">{t.footer.contactTitle}</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              contato@griffo.work<br/>
              <strong>https://griffo.work</strong><br/>
              São Paulo, SP · Brasil
            </p>
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

function PlanCard({ name, price, period, features, highlight, popular, cta, onCta }: {
  name: string
  price: string
  period: string
  features: string[]
  highlight: boolean
  popular?: boolean
  cta: string
  onCta: () => void
}) {
  return (
    <Card className={`relative border-2 transition-all flex flex-col justify-between ${popular ? 'border-[#0B63E5] shadow-xl scale-[1.02] bg-white' : highlight ? 'border-amber-400 shadow-md bg-white' : 'border-slate-200 hover:border-blue-300 bg-white'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-[#0B63E5] text-white hover:bg-[#0B63E5] shadow-sm px-3 py-0.5 text-xs font-bold">Popular</Badge>
        </div>
      )}
      <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-[#0B192E] text-lg">{name}</h3>
          <p className="text-xs text-slate-500 mb-4">{period}</p>
          <div className="mb-6">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#0B192E]">{price}</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#0B63E5] shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={onCta} className={`w-full h-11 font-bold ${popular ? 'bg-[#0B63E5] hover:bg-[#0052CC] text-white shadow-md' : 'bg-[#0B192E] hover:bg-slate-800 text-white'}`}>
          {cta}
        </Button>
      </CardContent>
    </Card>
  )
}
