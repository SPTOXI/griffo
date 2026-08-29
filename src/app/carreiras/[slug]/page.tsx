import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CAREERS_DATABASE, type CareerGuide } from '@/lib/careers/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, ShieldCheck, Target, CheckCircle2, ArrowRight, Brain,
  AlertTriangle, Check, HelpCircle, ChevronRight, FileText, Globe,
  Briefcase, TrendingUp, Award, Layers
} from 'lucide-react'

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(CAREERS_DATABASE).map((slug) => ({
    slug,
  }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const career = CAREERS_DATABASE[slug]

  if (!career) return {}

  const title = `Currículo de ${career.title} — Guia de Palavras-Chave e Aprovação em ATS | GriffoWork`
  const description = `Guia completo para estruturar seu currículo de ${career.title}. Descubra as palavras-chave obrigatórias para ATS, modelos de métricas de impacto e audite seu perfil com IA.`

  return {
    title,
    description,
    keywords: [
      `curriculo ${career.title.toLowerCase()}`,
      `resume ${slug}`,
      `ats ${slug}`,
      'palavras chave ats',
      'modelo de curriculo tech',
      'griffowork',
      ...career.keyAtsKeywords.slice(0, 6),
    ],
    alternates: {
      canonical: `https://griffo.work/carreiras/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://griffo.work/carreiras/${slug}`,
      siteName: 'GriffoWork',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo.png'],
    },
  }
}

export default async function CareerPage({ params }: PageProps) {
  const { slug } = await params
  const career = CAREERS_DATABASE[slug]

  if (!career) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `https://griffo.work/carreiras/${slug}#article`,
        headline: `Guia de Estruturação de Currículo e Palavras-Chave para ${career.title}`,
        description: career.description,
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
        mainEntityOfPage: `https://griffo.work/carreiras/${slug}`,
      },
      {
        '@type': 'FAQPage',
        '@id': `https://griffo.work/carreiras/${slug}#faq`,
        mainEntity: career.faqs.map((faq) => ({
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
            name: 'Carreiras',
            item: 'https://griffo.work/carreiras',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: career.title,
            item: `https://griffo.work/carreiras/${slug}`,
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
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-[#0B192E] text-2xl tracking-tight">
                griffo<span className="text-[#0B63E5]">work</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B63E5] mt-0.5">
                CAREER INTELLIGENCE
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
          <span>Carreiras</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">{career.title}</span>
        </div>
      </div>

      {/* HERO */}
      <section className="relative pt-12 pb-16 md:py-20 overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary px-3.5 py-1 text-xs font-bold rounded-full">
              <Briefcase className="w-3.5 h-3.5 mr-1.5 text-primary inline" /> {career.category}
            </Badge>
            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs font-bold">
              Demanda: {career.demandLevel}
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0B192E] leading-tight">
            Como montar um currículo de alto impacto para <span className="text-[#0B63E5]">{career.title}</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {career.description}
          </p>

          <div className="pt-3">
            <Button asChild size="lg" className="bg-[#0B63E5] hover:bg-[#0052CC] text-white text-base h-13 px-8 shadow-xl font-bold">
              <Link href="/">
                Auditar meu currículo agora <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KEYWORDS SECTION */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs">Otimização de ATS</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B192E] mt-2 mb-2">
              Palavras-Chave Obrigatórias para a Triagem
            </h2>
            <p className="text-sm text-slate-600">
              Termos técnicos e metodologias que os robôs de recrutamento rastreiam no seu currículo.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto">
            {career.keyAtsKeywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs font-bold text-[#0B63E5] shadow-2xs hover:bg-blue-100 transition-colors"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* METRIC EXAMPLES & COMMON MISTAKES */}
      <section className="py-14 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
          {/* METRIC EXAMPLES */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-emerald-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
              <TrendingUp className="w-5 h-5" /> Exemplos de Métricas que Impressionam Recrutadores
            </div>
            <ul className="space-y-3">
              {career.metricExamples.map((metric, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>&quot;{metric}&quot;</span>
                </li>
              ))}
            </ul>
          </div>

          {/* COMMON MISTAKES */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-red-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" /> Erros que Causam Reprovação nesta Área
            </div>
            <ul className="space-y-3">
              {career.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  {mistake}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* MANDATORY SECTIONS */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center">
          <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs">Estrutura Ideal</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B192E]">
            Seções Essenciais no Currículo de {career.title}
          </h2>

          <div className="grid sm:grid-cols-2 gap-3 text-left pt-2">
            {career.mandatorySections.map((sec, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                  {idx + 1}
                </div>
                <span className="text-xs font-semibold text-slate-800">{sec}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section className="py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs">Dúvidas Frequentes</Badge>
            <h2 className="text-2xl font-extrabold text-[#0B192E] mt-2">
              Perguntas Frequentes sobre Currículo de {career.title}
            </h2>
          </div>

          <div className="space-y-3">
            {career.faqs.map((faq, idx) => (
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
            <img src="/logo-icon.png" alt="GriffoWork Logo" className="h-6 w-auto object-contain" />
            <span>© {new Date().getFullYear()} GriffoWork — Global AI Career Intelligence.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-primary transition-colors">Página Inicial</Link>
            <Link href="/br" className="hover:text-primary transition-colors">Brasil</Link>
            <Link href="/us" className="hover:text-primary transition-colors">Estados Unidos</Link>
            <Link href="/ats/gupy" className="hover:text-primary transition-colors">Gupy</Link>
            <Link href="/ats/workday" className="hover:text-primary transition-colors">Workday</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
