import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ATS_DATABASE } from '@/lib/ats/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, ShieldCheck, Target, CheckCircle2, ArrowRight, Brain,
  AlertTriangle, Check, HelpCircle, ChevronRight, Globe
} from 'lucide-react'

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(ATS_DATABASE).map((slug) => ({
    slug,
  }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const ats = ATS_DATABASE[slug]

  if (!ats) return {}

  const title = `Compatibilidade com ATS ${ats.name} — Como Funciona a Triagem & Diagnóstico por IA | GriffoWork`
  const description = `Entenda como o algoritmo de triagem do ${ats.fullName} analisa currículos e descubra como o GriffoWork audita e prepara seu documento em 8 dimensões executivas.`

  return {
    title,
    description,
    keywords: [
      `ats ${ats.name.toLowerCase()}`,
      `como funciona o ${ats.name.toLowerCase()}`,
      `triagem ${ats.name.toLowerCase()}`,
      `compatibilidade ${ats.name.toLowerCase()}`,
      'analise de curriculo ia',
      'auditoria de curriculo ats',
      'griffowork',
    ],
    alternates: {
      canonical: `https://griffo.work/ats/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://griffo.work/ats/${slug}`,
      siteName: 'GriffoWork',
      images: [
        {
          url: '/logo-full.png',
          width: 693,
          height: 694,
          alt: title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo-full.png'],
    },
  }
}

export default async function AtsPage({ params }: PageProps) {
  const { slug } = await params
  const ats = ATS_DATABASE[slug]

  if (!ats) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `https://griffo.work/ats/${slug}#article`,
        headline: `Guia de Funcionamento e Compatibilidade com o ATS ${ats.fullName}`,
        description: ats.description,
        author: {
          '@type': 'Organization',
          name: 'GriffoWork',
          url: 'https://griffo.work',
        },
        publisher: {
          '@type': 'Organization',
          name: 'GriffoWork',
          logo: {
            '@type': 'ImageObject',
            url: 'https://griffo.work/logo.png',
          },
        },
        mainEntityOfPage: `https://griffo.work/ats/${slug}`,
      },
      {
        '@type': 'FAQPage',
        '@id': `https://griffo.work/ats/${slug}#faq`,
        mainEntity: ats.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://griffo.work',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Sistemas ATS',
            item: 'https://griffo.work/ats',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: ats.name,
            item: `https://griffo.work/ats/${slug}`,
          },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <img
              src="/logo-icon.png"
              alt="GriffoWork Logo"
              width={553}
              height={424}
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-[#0B192E] text-2xl tracking-tight">
                griffo<span className="text-[#0B63E5]">work</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B63E5] mt-0.5">
                ATS COMPATIBILITY
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button asChild size="sm" className="bg-[#0B63E5] hover:bg-[#0052CC] text-white shadow-md font-semibold px-4">
              <Link href="/">
                Auditar meu currículo <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="bg-slate-50 border-b border-slate-200/60 py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Sistemas ATS</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">{ats.name}</span>
        </div>
      </div>

      {/* HERO */}
      <section className="relative pt-12 pb-16 md:py-20 overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary px-3.5 py-1 text-xs font-bold rounded-full">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary inline" /> Sistema de Triagem ATS & Diagnóstico por IA
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0B192E] leading-tight">
            Como funciona o processo de triagem no <span className="text-[#0B63E5]">{ats.name}</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {ats.description}
          </p>

          <div className="inline-flex items-center gap-2 bg-slate-100/80 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700">
            <Globe className="w-4 h-4 text-primary shrink-0" />
            <span>Mercado: <strong>{ats.marketName}</strong> ({ats.marketShare})</span>
          </div>

          <div className="pt-4">
            <Button asChild size="lg" className="bg-[#0B63E5] hover:bg-[#0052CC] text-white text-base h-13 px-8 shadow-xl font-bold">
              <Link href="/">
                Auditar meu currículo no GriffoWork <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs">Mecanismo do Sistema</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B192E] mt-2 mb-2">
              Como o {ats.name} processa e classifica candidaturas
            </h2>
            <p className="text-sm text-slate-600">
              Conheça os critérios técnicos que o software utiliza para ler, ordenar e avaliar currículos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ats.howItWorks.map((step, idx) => (
              <Card key={idx} className="border-slate-200 shadow-xs hover:shadow-md transition-shadow bg-white">
                <CardContent className="p-6 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary font-bold flex items-center justify-center text-sm border border-blue-100">
                    0{idx + 1}
                  </div>
                  <h3 className="font-bold text-base text-[#0B192E]">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ELIMINATION & GRIFFOWORK VALUE */}
      <section className="py-14 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
          {/* ELIMINATION FACTORS */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-red-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" /> Principais Fatores de Descarte no {ats.name}
            </div>
            <ul className="space-y-3">
              {ats.eliminationFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          {/* HOW GRIFFOWORK HELPS */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-blue-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#0B63E5] font-bold text-base">
              <Brain className="w-5 h-5" /> Como a IA do GriffoWork ajuda você
            </div>
            <ul className="space-y-3">
              {ats.howGriffoWorkHelps.map((help, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  {help}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 8 DIMENSIONS AUDIT */}
      <section className="py-14 bg-[#0B192E] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge className="bg-[#0B63E5]/20 text-blue-300 border-blue-500/30 px-3 py-1 font-bold">
            Auditoria Executiva GriffoWork
          </Badge>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            Diagnóstico completo em 8 dimensões para aprovação em ATS
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            O GriffoWork analisa a estrutura do seu documento, aderência de palavras-chave, densidade de métricas e posicionamento de carreira para garantir que seu perfil supere os filtros automatizados de recrutamento.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {[
              'Compatibilidade ATS',
              'Impacto & Métricas',
              'Densidade Semântica',
              'Posicionamento de Carreira',
            ].map((dim, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <Brain className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-white">{dim}</p>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Button asChild size="lg" className="bg-white text-[#0B192E] hover:bg-blue-50 font-extrabold h-12 px-8">
              <Link href="/">
                Fazer auditoria gratuita agora <ArrowRight className="w-4 h-4 ml-2 text-primary" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section className="py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs">Perguntas Frequentes</Badge>
            <h2 className="text-2xl font-extrabold text-[#0B192E] mt-2">
              Dúvidas sobre o {ats.name} e a Avaliação do GriffoWork
            </h2>
          </div>

          <div className="space-y-3">
            {ats.faqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                <h3 className="font-bold text-sm text-[#0B192E] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" /> {faq.question}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="GriffoWork Logo" width={553} height={424} className="h-6 w-auto object-contain" />
            <span>© {new Date().getFullYear()} GriffoWork — Global AI Career Intelligence.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-primary transition-colors">Página Inicial</Link>
            <Link href="/br" className="hover:text-primary transition-colors">Brasil</Link>
            <Link href="/us" className="hover:text-primary transition-colors">Estados Unidos</Link>
            <Link href="/pt" className="hover:text-primary transition-colors">Portugal</Link>
            <Link href="/es" className="hover:text-primary transition-colors">Espanha</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
