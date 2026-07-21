'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Sparkles, ShieldCheck, Download, TrendingUp, Target, CheckCircle2,
  ArrowRight, Brain, Search, Award, Lock, Users, BarChart3, Zap
} from 'lucide-react'
import { useAuth } from '@/store/auth'

export function Landing({ onNavigate }: { onNavigate: (v: 'login' | 'signup' | 'app') => void }) {
  const { user } = useAuth()
  const [period, setPeriod] = useState<'day' | 'monthly' | 'annual'>('monthly')

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/85 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-slate-900 text-base">Griffo</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Análise de Currículo</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Recursos</a>
            <a href="#how" className="text-slate-600 hover:text-slate-900 transition-colors">Como funciona</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Planos</a>
            <a href="#b2b" className="text-slate-600 hover:text-slate-900 transition-colors">Para empresas</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={() => onNavigate('app')} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                Meu painel <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button onClick={() => onNavigate('login')} size="sm" variant="ghost" className="text-slate-700">Entrar</Button>
                <Button onClick={() => onNavigate('signup')} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Criar conta grátis
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-white pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                <Sparkles className="w-3 h-3 mr-1" /> IA + melhores práticas de RH e LinkedIn
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
                Descubra o que seu <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">currículo</span> realmente diz sobre você.
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Envie seu currículo atual e receba em segundos um laudo técnico com nota de 0 a 10 em 8 dimensões, pontos fortes, pontos de atenção e recomendações acionáveis. Com sua autorização, reescrevemos tudo em uma versão otimizada para ATS e recrutadores — pronta para download em PDF e Markdown.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => onNavigate('signup')} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-base h-12 px-6">
                  Analisar meu currículo grátis <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={() => onNavigate('login')} size="lg" variant="outline" className="text-base h-12 px-6">
                  Já tenho conta
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Análise gratuita</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sem cartão de crédito</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dados criptografados</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> LGPD</span>
              </div>
            </div>

            {/* MOCK CARD */}
            <div className="relative">
              <Card className="shadow-2xl border-slate-200 rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs text-slate-500 font-mono">laudo_resumo.json</span>
                    <span className="text-xs text-slate-400">#A3F2</span>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Nota geral</p>
                        <p className="text-5xl font-bold text-slate-900">7.4<span className="text-lg text-slate-400">/10</span></p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">ATS OK</Badge>
                        <p className="text-xs text-slate-500 mt-1">Compatível</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { l: 'Impacto e Resultados', s: 8.5 },
                        { l: 'Palavras-chave / ATS', s: 9.0 },
                        { l: 'Estrutura', s: 7.0 },
                        { l: 'Resumo Profissional', s: 6.2 },
                      ].map((d) => (
                        <div key={d.l}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">{d.l}</span>
                            <span className="font-semibold text-slate-900">{d.s.toFixed(1)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${d.s * 10}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                      <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Ponto forte</p>
                      <p className="text-xs text-emerald-900">Resultados bem quantificados em 3 das 4 experiências recentes.</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Pontos de atenção</p>
                      <p className="text-xs text-amber-900">Resumo profissional genérico. Falta menção a stack técnica no topo.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="absolute -bottom-4 -right-4 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 hidden md:block">
                <p className="text-xs text-slate-500">Custo da análise</p>
                <p className="text-sm font-semibold text-slate-900">~ R$ 0,12 por laudo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <Stat icon={<Brain className="w-5 h-5" />} value="8" label="Dimensões avaliadas" />
          <Stat icon={<Target className="w-5 h-5" />} value="0–10" label="Escala objetiva por critério" />
          <Stat icon={<Zap className="w-5 h-5" />} value="< 30s" label="Tempo médio da análise" />
          <Stat icon={<Download className="w-5 h-5" />} value="PDF + MD" label="Download do laudo e do currículo reescrito" />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="border-slate-300 text-slate-600">Recursos</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-3">Tudo que um candidato precisa, nada que não precise.</h2>
          <p className="text-slate-600">Construído sobre as práticas recomendadas pelo LinkedIn Talent Solutions e por headhunters seniores.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Feature icon={<BarChart3 className="w-5 h-5" />} title="Laudo em 8 dimensões"
            desc="Estrutura, resumo, impacto, habilidades, experiência, palavras-chave/ATS, formação e linguagem — cada uma com nota 0–10 e justificativa." />
          <Feature icon={<Search className="w-5 h-5" />} title="Verificação ATS"
            desc="Detectamos se seu currículo sobrevive aos filtros automáticos (Workday, Greenhouse, Gupy, Kenoby) antes mesmo do recrutador ver." />
          <Feature icon={<Sparkles className="w-5 h-5" />} title="Reescrita autorizada"
            desc="Com sua autorização explícita, reescrevemos o currículo preservando fatos e quantificando impacto — sem inventar nada." />
          <Feature icon={<Users className="w-5 h-5" />} title="Tom de recrutador"
            desc="A IA foi treinada com o que recrutadores sênior realmente procuram: ação + contexto + resultado, verbos fortes, hierarquia clara." />
          <Feature icon={<Download className="w-5 h-5" />} title="PDF + Markdown"
            desc="Baixe o laudo e o currículo reescrito em PDF profissional e em Markdown editável — pronto para LinkedIn, portfólio ou e-mail." />
          <Feature icon={<ShieldCheck className="w-5 h-5" />} title="Privacidade primeiro"
            desc="Seus dados ficam criptografados e você controla se quer (ou não) aparecer para recrutadores parceiros no futuro." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="bg-white/10 text-emerald-300 hover:bg-white/10">Fluxo completo</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-3">Do envio ao download em 5 passos.</h2>
            <p className="text-slate-300">Transparente, rápido e com sua aprovação em cada etapa.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { n: '01', t: 'Envie o currículo', d: 'Cole o texto ou suba o arquivo. Suportamos texto e Markdown.' },
              { n: '02', t: 'Receba o laudo', d: 'Nota 0–10 em 8 dimensões, pontos fortes e fracos, recomendações.' },
              { n: '03', t: 'Autorize a reescrita', d: 'Você decide se quer que a IA reescreva ou apenas use o laudo como guia.' },
              { n: '04', t: 'Revise', d: 'Aprova, rejeita ou pede ajustes. Você está no controle.' },
              { n: '05', t: 'Baixe', d: 'PDF e Markdown prontos para enviar a recrutadores.' },
            ].map((s, i) => (
              <div key={s.n} className="relative">
                <div className="rounded-xl bg-white/5 border border-white/10 p-5 h-full">
                  <div className="text-emerald-400 text-xs font-mono mb-2">{s.n}</div>
                  <h3 className="font-semibold mb-1">{s.t}</h3>
                  <p className="text-sm text-slate-300">{s.d}</p>
                </div>
                {i < 4 && <ArrowRight className="hidden md:block w-4 h-4 text-slate-600 absolute top-1/2 -right-3 -translate-y-1/2" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Planos</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-3">Preço justo. Custo transparente.</h2>
          <p className="text-slate-600">Cobrimos só o necessário para manter a IA rodando e seus dados seguros. Veja o custo real e a margem de cada plano.</p>
        </div>

        <div className="flex items-center justify-center gap-1 mb-8">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-sm">
            {(['day', 'monthly', 'annual'] as const).map(p => (
              <button key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-md transition-colors ${period === p ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600'}`}>
                {p === 'day' ? '1 dia' : p === 'monthly' ? 'Mensal' : 'Anual'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <PlanCard
            name="Passe Diário"
            price="R$ 19,90"
            period="vigência de 24h"
            features={['5 análises completas', '3 reescritas', 'Downloads PDF + MD', 'Acesso ao laudo completo']}
            highlight={period === 'day'}
            cta="Comprar passe"
            onCta={() => onNavigate('signup')}
            cost={{ brl: '≈ R$ 1,08', usd: '$0,20', margin: '94%' }}
          />
          <PlanCard
            name="Mensal"
            price="R$ 39,90"
            period="por mês · cancele quando quiser"
            features={['30 análises/mês', '20 reescritas/mês', 'Downloads ilimitados', 'Histórico completo', 'Suporte prioritário']}
            highlight={period === 'monthly'}
            popular
            cta="Assinar mensal"
            onCta={() => onNavigate('signup')}
            cost={{ brl: '≈ R$ 9,72', usd: '$1,80', margin: '76%' }}
          />
          <PlanCard
            name="Anual"
            price="R$ 299,90"
            period="por ano · equivalente a R$ 24,99/mês"
            features={['365 análises/ano', '240 reescritas/ano', 'Downloads ilimitados', 'Histórico completo', '2 meses grátis', 'Suporte prioritário']}
            highlight={period === 'annual'}
            cta="Assinar anual"
            onCta={() => onNavigate('signup')}
            cost={{ brl: '≈ R$ 102,06', usd: '$18,90', margin: '66%' }}
          />
        </div>
        <p className="text-center text-xs text-slate-500 mt-6">
          Custos estimados com base em tokens GLM-4.6 (entrada $0,60/1M, saída $2,20/1M) + armazenamento SQLite local. Atualizado em {new Date().toLocaleDateString('pt-BR')}.
        </p>
      </section>

      {/* B2B */}
      <section id="b2b" className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20">Roadmap Fase 2</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Marketplace de talentos para recrutadores.</h2>
              <p className="text-slate-300 leading-relaxed">
                Na Fase 1, armazenamos currículos e laudos de forma segura e econômica — com opt-in explícito do usuário. Na Fase 2, recrutadores parceiros poderão buscar candidatos por pontuação, dimensões de força e palavras-chave — sempre com consentimento revogável.
              </p>
              <ul className="space-y-2 text-sm text-slate-200">
                <li className="flex items-start gap-2"><Lock className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" /> Consentimento granular: usuário escolhe se aparece ou não em buscas.</li>
                <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" /> Dados sensíveis (e-mail, telefone) só liberados após match aceito.</li>
                <li className="flex items-start gap-2"><TrendingUp className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" /> Modelo de receita B2B recorrente soma-se às assinaturas B2C.</li>
              </ul>
            </div>
            <Card className="bg-white/5 border-white/10 backdrop-blur">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4 text-emerald-400" /> Para recrutadores (Fase 2)</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white/5 p-3"><p className="text-slate-400 text-xs">Busca por score</p><p className="font-semibold">≥ 7.5 em impacto</p></div>
                  <div className="rounded-lg bg-white/5 p-3"><p className="text-slate-400 text-xs">Filtro por stack</p><p className="font-semibold">React, Node, Python…</p></div>
                  <div className="rounded-lg bg-white/5 p-3"><p className="text-slate-400 text-xs">Filtro por nível</p><p className="font-semibold">Júnior a Sênior</p></div>
                  <div className="rounded-lg bg-white/5 p-3"><p className="text-slate-400 text-xs">Consentimento</p><p className="font-semibold text-emerald-400">Obrigatório</p></div>
                </div>
                <p className="text-xs text-slate-400">Disponível apenas para empresas verificadas. Os candidatos sempre podem revogar o consentimento a qualquer momento.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Seu próximo emprego começa com um currículo que funciona.</h2>
        <p className="text-slate-600 mb-6">Crie sua conta gratuita e analise seu currículo agora. Sem cartão de crédito.</p>
        <Button onClick={() => onNavigate('signup')} size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base">
          Começar agora <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">Griffo</span>
            </div>
            <p className="text-slate-500">Análise de currículo com IA, baseada em práticas de RH e LinkedIn Talent Solutions.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Produto</h4>
            <ul className="space-y-1 text-slate-600">
              <li><a href="#features" className="hover:text-slate-900">Recursos</a></li>
              <li><a href="#pricing" className="hover:text-slate-900">Planos</a></li>
              <li><a href="#how" className="hover:text-slate-900">Como funciona</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Empresa</h4>
            <ul className="space-y-1 text-slate-600">
              <li><a href="#b2b" className="hover:text-slate-900">Para empresas</a></li>
              <li>LGPD</li>
              <li>Termos de uso</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Contato</h4>
            <p className="text-slate-500">contato@griffo.app<br/>São Paulo, Brasil</p>
          </div>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Griffo. Feito no Brasil. Em conformidade com a LGPD.
        </div>
      </footer>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow h-full">
      <CardContent className="p-6">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">{icon}</div>
        <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  )
}

function PlanCard({ name, price, period, features, highlight, popular, cta, onCta, cost }: {
  name: string
  price: string
  period: string
  features: string[]
  highlight: boolean
  popular?: boolean
  cta: string
  onCta: () => void
  cost: { brl: string; usd: string; margin: string }
}) {
  return (
    <Card className={`relative border-2 transition-all ${popular ? 'border-emerald-500 shadow-lg scale-[1.02]' : highlight ? 'border-emerald-300 shadow-md' : 'border-slate-200 hover:border-emerald-300'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Mais popular</Badge>
        </div>
      )}
      <CardContent className="p-6">
        <h3 className="font-semibold text-slate-900">{name}</h3>
        <p className="text-xs text-slate-500 mb-3">{period}</p>
        <p className="text-3xl font-bold text-slate-900 mb-4">{price}</p>
        <ul className="space-y-2 mb-5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> {f}
            </li>
          ))}
        </ul>
        <Button onClick={onCta} className={`w-full ${popular ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
          {cta}
        </Button>
        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-0.5">
          <p>Custo estimado: <span className="font-semibold text-slate-700">{cost.brl}</span> <span className="text-slate-400">({cost.usd})</span></p>
          <p>Margem: <span className="font-semibold text-emerald-700">{cost.margin}</span></p>
        </div>
      </CardContent>
    </Card>
  )
}
