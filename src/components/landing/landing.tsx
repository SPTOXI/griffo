'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Sparkles, ShieldCheck, Download, TrendingUp, Target, CheckCircle2,
  ArrowRight, Brain, Search, Award, Lock, Users, BarChart3, Zap, Globe, Share2,
  Check, HelpCircle, ChevronDown, Star, MessageSquare, Menu, X
} from 'lucide-react'
import { useAuth } from '@/store/auth'

export function Landing({ onNavigate }: { onNavigate: (v: 'login' | 'signup' | 'app') => void }) {
  const { user } = useAuth()
  const [period, setPeriod] = useState<'day' | 'monthly' | 'annual'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-slate-900 text-base tracking-tight">Griffo</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">Inteligência Profissional</span>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-slate-600 hover:text-emerald-600 transition-colors">Recursos</a>
            <a href="#social" className="text-slate-600 hover:text-emerald-600 transition-colors">Presença Digital</a>
            <a href="#how" className="text-slate-600 hover:text-emerald-600 transition-colors">Como funciona</a>
            <a href="#pricing" className="text-slate-600 hover:text-emerald-600 transition-colors">Planos</a>
            <a href="#faq" className="text-slate-600 hover:text-emerald-600 transition-colors">Dúvidas</a>
          </nav>

          {/* DESKTOP CTAS */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button onClick={() => onNavigate('app')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                Meu painel <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <>
                <Button onClick={() => onNavigate('login')} size="sm" variant="ghost" className="text-slate-700 hover:text-slate-900">
                  Entrar
                </Button>
                <Button onClick={() => onNavigate('signup')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                  Analisar grátis
                </Button>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* MOBILE NAV DROPDOWN MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 shadow-xl">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-50">Recursos</a>
              <a href="#social" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-50">Presença Digital</a>
              <a href="#how" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-50">Como funciona</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-50">Planos</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-50">Dúvidas</a>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <Button onClick={() => { setMobileMenuOpen(false); onNavigate('app') }} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Meu painel <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <>
                  <Button onClick={() => { setMobileMenuOpen(false); onNavigate('login') }} variant="outline" className="w-full">
                    Entrar
                  </Button>
                  <Button onClick={() => { setMobileMenuOpen(false); onNavigate('signup') }} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Analisar grátis
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-white to-white pointer-events-none" />
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 sm:w-[500px] h-80 sm:h-[500px] rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 sm:w-[500px] h-80 sm:h-[500px] rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
            <div className="space-y-5 sm:space-y-6 text-left">
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-1 text-xs font-semibold rounded-full shadow-sm max-w-full truncate">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0 inline" /> IA + Padrões Gupy, LinkedIn & Recrutamento Global
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Destaque seu <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">currículo</span> e conquiste as melhores vagas.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Envie seu currículo em segundos e receba um laudo técnico completo em 8 dimensões. Descubra sua nota de aprovação em filtros ATS (Gupy, Workday, Taleo) e receba recomendações exclusivas para otimizar seus perfis no LinkedIn e redes profissionais.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button onClick={() => onNavigate('signup')} size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-base h-12 sm:h-13 px-8 shadow-lg shadow-emerald-600/20 font-semibold">
                  Analisar meu currículo agora <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button onClick={() => onNavigate('login')} size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 sm:h-13 px-7 border-slate-300 text-slate-700 hover:bg-slate-50">
                  Já tenho conta
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-medium text-slate-600 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Análise Gratuita</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Sem Cartão</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> LGPD & GDPR</span>
                <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-600 shrink-0" /> 100% Seguro</span>
              </div>
            </div>

            {/* INTERACTIVE MOCKUP CARD */}
            <div className="relative lg:ml-4 mt-4 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-3xl transform rotate-1 blur-lg -z-10" />
              <Card className="shadow-2xl border-slate-200/90 rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="bg-slate-900 text-white px-4 sm:px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-medium text-slate-300 flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Relatório Técnico de Avaliação
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-semibold border-none shrink-0">ALTA PRECISÃO</Badge>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Nota Geral de Qualificação</p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">8.7</span>
                          <span className="text-slate-400 font-medium text-xs sm:text-sm">/ 10</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold px-2 py-0.5 text-[10px] sm:text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 inline" /> Aprovado em ATS
                        </Badge>
                        <p className="text-[10px] sm:text-[11px] text-slate-500">Compatível com Gupy & Workday</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { l: 'Estrutura & Leitura Automática (ATS)', s: 9.2, color: 'bg-emerald-500' },
                        { l: 'Impacto Quantificado (Fórmula STAR/XYZ)', s: 8.8, color: 'bg-emerald-500' },
                        { l: 'Match de Palavras-Chave de Mercado', s: 8.5, color: 'bg-emerald-500' },
                        { l: 'Trajetória & Plano de Carreira', s: 8.3, color: 'bg-teal-500' },
                      ].map((d) => (
                        <div key={d.l}>
                          <div className="flex justify-between text-[11px] sm:text-xs mb-1 font-medium">
                            <span className="text-slate-700 truncate pr-2">{d.l}</span>
                            <span className="font-bold text-slate-900 shrink-0">{d.s.toFixed(1)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.s * 10}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-violet-50/80 border border-violet-100 p-3 sm:p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
                        <Share2 className="w-3.5 h-3.5 text-violet-600 shrink-0" /> Sugestão de Headline Otimizada (LinkedIn / Gupy)
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        "Desenvolvedor Full Stack Sênior | React, Node.js, Cloud (AWS) | Especialista em Arquitetura Distribuída & Alta Escalabilidade"
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
          <Stat icon={<Brain className="w-5 h-5" />} value="8 Dimensões" label="Análise minuciosa de currículo" />
          <Stat icon={<Target className="w-5 h-5" />} value="Gupy & ATS" label="Verificação de filtros de recrutamento" />
          <Stat icon={<Globe className="w-5 h-5" />} value="Perfis Globais" label="LinkedIn, Behance, GitHub, Xing, etc." />
          <Stat icon={<Download className="w-5 h-5" />} value="PDF & Editável" label="Reescrita profissional pronta" />
        </div>
      </section>

      {/* GLOBAL SOCIAL PRESENCE FEATURE HIGHLIGHT */}
      <section id="social" className="py-14 sm:py-20 md:py-24 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="space-y-5">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 px-3 py-1">
                <Globe className="w-3.5 h-3.5 mr-1.5" /> Presença Digital & Otimização Global
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Sua carreira vai além do papel. Otimize seus perfis em qualquer plataforma.
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                Com o Griffo, você não apenas melhora seu currículo em PDF — você otimiza toda a sua imagem profissional nas redes sociais e plataformas estratégicas para o mercado onde deseja atuar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <p className="font-semibold text-emerald-400 text-sm flex items-center gap-1.5">
                    <Share2 className="w-4 h-4" /> LinkedIn & Gupy
                  </p>
                  <p className="text-xs text-slate-300">Sugestões de Título (Headline), seção 'Sobre' e termos para o algoritmo de recrutadores.</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <p className="font-semibold text-emerald-400 text-sm flex items-center gap-1.5">
                    <Globe className="w-4 h-4" /> Perfis Internacionais & Tech
                  </p>
                  <p className="text-xs text-slate-300">Recomendações para Behance, GitHub, StackOverflow, Kaggle, Xing, Portfólios e redes locais.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Otimização com Autorização do Usuário
                </span>
                <Badge className="bg-white/10 text-white shrink-0">LGPD / GDPR</Badge>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">LinkedIn — Título Profissional Sugerido</p>
                  <p className="text-xs text-white">"Engenheiro de Dados Sênior | Python, PySpark, Dataproc, BigQuery | Especialista em Data Lakes e Pipeline de Alta Performance"</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Behance / Portfólio — Dica de Posicionamento</p>
                  <p className="text-xs text-white">"Destaque os cases com dados de impacto (ex: 'Redesign que aumentou a conversão em +35%') na capa dos 3 primeiros projetos do perfil."</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Gupy — Palavras-chave de Triagem</p>
                  <p className="text-xs text-white">"Certifique-se de preencher as seções de testes técnicos e incluir exatamente os termos 'Scrum', 'Jest' e 'Micro-frontends'."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs">Recursos Completos</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-3">Tudo o que você precisa para se destacar nas seleções.</h2>
          <p className="text-sm sm:text-base text-slate-600">Construído com base nas melhores práticas de RH, LinkedIn Talent Solutions e algoritmos de triagem automática.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <Feature icon={<BarChart3 className="w-5 h-5" />} title="Laudo em 8 Dimensões"
            desc="Avaliação minuciosa de estrutura, resumo, resultados quantificados, hard/soft skills, experiência, palavras-chave ATS, trajetória e plano de capacitação." />
          <Feature icon={<Search className="w-5 h-5" />} title="Verificação de Filtros ATS"
            desc="Testamos se seu currículo é lido corretamente por robôs de recrutamento (Gupy, Workday, Taleo, Greenhouse) antes de chegar ao recrutador." />
          <Feature icon={<Sparkles className="w-5 h-5" />} title="Reescrita com Autorização"
            desc="Com sua aprovação explícita, a IA reescreve seu currículo aplicando a fórmula STAR e Google XYZ — preservando 100% da veracidade dos seus dados." />
          <Feature icon={<Share2 className="w-5 h-5" />} title="Otimização de Presença Digital"
            desc="Dicas sob medida para seu perfil do LinkedIn, Gupy, Behance, GitHub, Xing e redes profissionais para atrair recrutadores ativamente." />
          <Feature icon={<Download className="w-5 h-5" />} title="Download em PDF e Formato Editável"
            desc="Baixe seu currículo reescrito e laudo em PDF elegante e arquivo de texto editável — pronto para enviar a empresas ou salvar." />
          <Feature icon={<ShieldCheck className="w-5 h-5" />} title="Privacidade & Segurança Total"
            desc="Seus dados são criptografados e protegidos em conformidade rigorosa com a LGPD e GDPR. Seus dados nunca são vendidos a terceiros." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-slate-900 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="bg-white/10 text-emerald-300 hover:bg-white/10 px-3 py-1">Passo a Passo</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-3 mb-3">Do envio ao novo currículo em 5 passos simples.</h2>
            <p className="text-sm sm:text-base text-slate-300">Rápido, transparente e sob seu controle em todas as fases.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { n: '01', t: 'Envie o Currículo', d: 'Anexe um arquivo PDF, documento de texto ou cole diretamente o conteúdo.' },
              { n: '02', t: 'Informe seus Perfis', d: 'Insira opcionalmente seus links profissionais (LinkedIn, Gupy, etc.).' },
              { n: '03', t: 'Receba o Laudo', d: 'Confira a pontuação 0–10 em 8 dimensões, pontos fortes e fracos.' },
              { n: '04', t: 'Autorize a Reescrita', d: 'Se desejar, solicite a reescrita otimizada com a fórmula STAR.' },
              { n: '05', t: 'Baixe em PDF ou Editável', d: 'Baixe a versão final pronta para aplicar em vagas imediatamente.' },
            ].map((s, i) => (
              <div key={s.n} className="relative">
                <div className="rounded-xl bg-white/5 border border-white/10 p-5 h-full space-y-2">
                  <div className="text-emerald-400 text-xs font-semibold">{s.n}</div>
                  <h3 className="font-semibold text-base">{s.t}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-1 text-xs">Planos Acessíveis</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-3">Escolha o plano ideal para o seu momento profissional.</h2>
          <p className="text-sm sm:text-base text-slate-600">Sem pegadinhas ou fidelidade. Cancele quando quiser com apenas 1 clique.</p>
        </div>

        <div className="flex items-center justify-center gap-1 mb-8">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs sm:text-sm font-medium max-w-full overflow-x-auto">
            {(['day', 'monthly', 'annual'] as const).map(p => (
              <button key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 sm:px-5 py-2 rounded-lg transition-all whitespace-nowrap ${period === p ? 'bg-white shadow-sm font-semibold text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
                {p === 'day' ? 'Passe Diário' : p === 'monthly' ? 'Mensal' : 'Anual'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          <PlanCard
            name="Passe Diário"
            price="R$ 19,90"
            period="Acesso válido por 24 horas"
            features={[
              '5 análises completas de currículo',
              '3 reescritas profissionais',
              'Downloads ilimitados (PDF & Texto Editável)',
              'Otimização para LinkedIn & Gupy',
              'Verificação de aprovação em ATS',
            ]}
            highlight={period === 'day'}
            cta="Garantir Passe Diário"
            onCta={() => onNavigate('signup')}
          />
          <PlanCard
            name="Assinatura Mensal"
            price="R$ 39,90"
            period="por mês · cancele quando quiser"
            features={[
              '30 análises de currículo / mês',
              '20 reescritas profissionais / mês',
              'Otimização contínua de Redes Sociais',
              'Histórico completo de laudos',
              'Downloads ilimitados em PDF & Texto Editável',
              'Suporte prioritário por e-mail',
            ]}
            highlight={period === 'monthly'}
            popular
            cta="Começar Assinatura Mensal"
            onCta={() => onNavigate('signup')}
          />
          <PlanCard
            name="Assinatura Anual"
            price="R$ 299,90"
            period="por ano · equivalente a R$ 24,99/mês"
            features={[
              '365 análises de currículo / ano',
              '240 reescritas profissionais / ano',
              'Otimização ilimitada de Presença Digital',
              'Economize +37% em relação ao mensal',
              'Histórico vitalício durante a assinatura',
              'Suporte prioritário via canal direto',
            ]}
            highlight={period === 'annual'}
            cta="Garantir Plano Anual"
            onCta={() => onNavigate('signup')}
          />
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="bg-slate-50 py-16 md:py-24 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="border-slate-300 text-slate-600 px-3 py-1 text-xs">Perguntas Frequentes</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 mb-2">Ficou com alguma dúvida?</h2>
            <p className="text-slate-600 text-sm">Respostas para as perguntas mais comuns dos nossos usuários.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Como funciona a verificação de compatibilidade ATS (Gupy, Workday, Taleo)?',
                a: 'Nossa inteligência simula os algoritmos de leitura de sistemas ATS utilizados pelas maiores empresas. Ela checa se o cabeçalho, ordem cronológica, seções e densidade de palavras-chave estão legíveis para robôs de triagem.'
              },
              {
                q: 'A IA inventa informações ou experiências no meu currículo?',
                a: 'Não. O Griffo segue uma diretriz rígida de veracidade: mantemos 100% das suas empresas, cargos, datas e formação reais. A IA reestrutura a escrita aplicando métodos validados (fórmulas STAR e Google XYZ) para destacar os seus resultados reais de forma impactante.'
              },
              {
                q: 'Como funciona a otimização de perfis (LinkedIn, Gupy, Behance, GitHub)?',
                a: 'Se você fornecer os links dos seus perfis com autorização, a IA gera títulos otimizados (Headlines), resumos para a seção "Sobre" e dicas de algoritmo para atrair mais recrutadores no mercado de atuação que você busca.'
              },
              {
                q: 'Meus dados e meu currículo estão seguros?',
                a: 'Totalmente. Trabalhamos em conformidade rigorosa com a LGPD (Lei Geral de Proteção de Dados) e GDPR. Seus dados são criptografados e não são compartilhados nem vendidos a terceiros sem seu consentimento prévio.'
              },
              {
                q: 'Posso cancelar minha assinatura quando quiser?',
                a: 'Sim! Você pode cancelar a qualquer momento diretamente no seu painel de usuário sem taxas de cancelamento ou burocracia.'
              }
            ].map((faq, index) => (
              <div key={index} className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 text-left font-semibold text-slate-900 text-sm flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <span className="pr-2">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${openFaq === index ? 'rotate-180 text-emerald-600' : ''}`} />
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
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-12 text-white shadow-xl shadow-emerald-600/20 space-y-5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Pronto para transformar sua apresentação profissional?
          </h2>
          <p className="text-emerald-100 max-w-xl mx-auto text-sm sm:text-base">
            Crie sua conta gratuita agora e receba o laudo técnico do seu currículo em menos de 30 segundos. Sem cartão de crédito.
          </p>
          <div className="pt-2">
            <Button onClick={() => onNavigate('signup')} size="lg" className="w-full sm:w-auto bg-white text-emerald-900 hover:bg-slate-100 h-12 sm:h-13 px-8 text-base font-bold shadow-lg">
              Analisar meu currículo grátis <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-base">Griffo</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Plataforma de inteligência de carreira, análise de currículo e otimização de presença digital baseada nos melhores padrões de recrutamento.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Navegação</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><a href="#features" className="hover:text-emerald-600 transition-colors">Recursos</a></li>
              <li><a href="#social" className="hover:text-emerald-600 transition-colors">Presença Digital</a></li>
              <li><a href="#pricing" className="hover:text-emerald-600 transition-colors">Planos</a></li>
              <li><a href="#how" className="hover:text-emerald-600 transition-colors">Como funciona</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Segurança & Privacidade</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> LGPD & GDPR Compliant</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Criptografia de Dados</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Sem Venda de Dados</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Contato</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              contato@griffo.app<br/>
              São Paulo, SP · Brasil
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Griffo. Todos os direitos reservados. Em conformidade com a LGPD e GDPR.
        </div>
      </footer>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-1">{icon}</div>
      <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">{label}</p>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="border-slate-200/90 hover:shadow-lg transition-all hover:border-emerald-300 h-full bg-white">
      <CardContent className="p-5 sm:p-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">{icon}</div>
        <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
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
    <Card className={`relative border-2 transition-all flex flex-col justify-between ${popular ? 'border-emerald-500 shadow-xl scale-[1.02] bg-white' : highlight ? 'border-emerald-400 shadow-md bg-white' : 'border-slate-200 hover:border-emerald-300 bg-white'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 shadow-sm px-3 py-0.5 text-xs font-bold">Mais Vendido</Badge>
        </div>
      )}
      <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
          <p className="text-xs text-slate-500 mb-4">{period}</p>
          <div className="mb-6">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">{price}</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={onCta} className={`w-full h-11 font-semibold ${popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
          {cta}
        </Button>
      </CardContent>
    </Card>
  )
}
