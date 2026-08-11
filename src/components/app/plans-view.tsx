'use client'

import { useEffect, useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { internalFetch } from '@/lib/internal-fetch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCard, Check, Loader2, Sparkles, Zap, CheckCircle2, ShoppingBag, FileSearch, Edit3, ArrowRight, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/context/i18n-context'
import { CREDIT_PACKAGES, CREDIT_COSTS, getPackagePriceDisplay } from '@/lib/credits-catalog'

interface CreditTx {
  id: string
  amount: number
  type: string
  description: string
  costBrl?: number
  createdAt: string
}

export function PlansView() {
  const { user, hydrate } = useAuth()
  const { setView } = useNav()
  const { detectedCountry, lang } = useI18n()
  const [credits, setCredits] = useState<number>(0)
  const [transactions, setTransactions] = useState<CreditTx[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  // Quem já comprou não vê mais a oferta de entrada: o servidor recusa a
  // compra (`ENTRY_OFFER_USED`), e oferecer um botão que só devolve erro é
  // pior do que não oferecer.
  const [entryOfferAvailable, setEntryOfferAvailable] = useState(true)

  useEffect(() => {
    loadCreditsData()
  }, [])

  const loadCreditsData = async () => {
    setLoading(true);
    try {
      const r = await internalFetch('/api/credits/balance');
      const data = await r.json();
      if (typeof data.credits === 'number') setCredits(data.credits);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (typeof data.entryOfferAvailable === 'boolean') setEntryOfferAvailable(data.entryOfferAvailable);
    } catch {
      toast.error('Erro ao carregar saldo de créditos.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (packageId: 'entrada' | 'starter' | 'carreira' | 'profissional') => {
    setBuyingId(packageId)
    try {
      const pkgObj = CREDIT_PACKAGES.find(p => p.id === packageId)
      const display = pkgObj ? getPackagePriceDisplay(pkgObj, detectedCountry, lang) : null
      const targetCurrency = display ? display.code.toLowerCase() : 'brl'

      const r = await internalFetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, currency: targetCurrency }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erro ao adquirir pacote.')
        return
      }
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return
      }

      toast.success(data.message || 'Créditos adicionados com sucesso!')
      await hydrate()
      await loadCreditsData()
    } catch {
      toast.error('Falha de conexão ao adquirir créditos.')
    } finally {
      setBuyingId(null)
    }
  }

  const visiblePackages = CREDIT_PACKAGES.filter((pkg) => !pkg.entryOnly || entryOfferAvailable)

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500 fill-amber-500" /> Saldo & Pacotes de Créditos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {entryOfferAvailable
              ? 'Adquira o Plano de Entrada ou escolha um pacote maior para utilizar as ferramentas de IA do Griffo.'
              : 'Recarregue seu saldo para continuar utilizando as ferramentas de IA do Griffo.'}
          </p>
        </div>

        {/* CURRENT BALANCE BANNER */}
        <div className="bg-gradient-to-r from-[#0B192E] to-[#0B63E5] rounded-2xl px-5 py-3.5 text-white flex items-center gap-4 shadow-md">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Seu Saldo Disponível</p>
            <p className="text-2xl font-extrabold flex items-center gap-1.5">
              {credits} <span className="text-sm font-normal text-blue-100">créditos</span>
            </p>
          </div>
          <Zap className="w-8 h-8 text-amber-300 fill-amber-300 opacity-90 shrink-0" />
        </div>
      </div>

      {/* CREDIT PACKAGES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
        {visiblePackages.map((pkg) => {
          const isBuying = buyingId === pkg.id
          const isEntry = pkg.id === 'entrada'
          const display = getPackagePriceDisplay(pkg, detectedCountry, lang)
          return (
            <Card
              key={pkg.id}
              className={`relative border-2 transition-all flex flex-col justify-between bg-white ${
                isEntry
                  ? 'border-amber-400 shadow-lg bg-gradient-to-b from-amber-50/40 via-white to-white'
                  : pkg.popular
                  ? 'border-[#0B63E5] shadow-xl scale-[1.02]'
                  : 'border-slate-200 hover:border-blue-300 shadow-sm'
              }`}
            >
              {isEntry && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-500 shadow-sm px-2.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap">
                    ⭐ Melhor Oferta de Entrada
                  </Badge>
                </div>
              )}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#0B63E5] text-white hover:bg-[#0B63E5] shadow-sm px-3 py-0.5 text-xs font-bold whitespace-nowrap">
                    Mais Vendido
                  </Badge>
                </div>
              )}
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{pkg.name}</h3>
                  <p className="text-[11px] text-slate-500 mb-3 min-h-[32px]">{pkg.desc}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900">{display.priceFormatted}</span>
                    </div>
                    <p className="text-[11px] text-[#0B63E5] font-semibold mt-0.5">
                      {display.perCreditFormatted} {lang === 'pt' ? 'por crédito' : 'per credit'}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-5 text-xs text-slate-700">
                    <li className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> {pkg.credits} {lang === 'pt' ? 'créditos no saldo' : 'credits included'}
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> {lang === 'pt' ? 'Uso livre em Avaliação ou Reescrita' : 'Flexibility across Audit & AI Rewrite'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> {lang === 'pt' ? 'Sem mensalidade ou expiração' : 'No monthly fees or expiration'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0B63E5] shrink-0" /> {lang === 'pt' ? 'Acesso total a todas as IAs' : 'Full access to all AI models'}
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => handleBuy(pkg.id as any)}
                  disabled={isBuying}
                  className={`w-full h-10 text-xs font-bold ${
                    isEntry
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md'
                      : pkg.popular
                      ? 'bg-[#0B63E5] hover:bg-[#0052CC] text-white shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isBuying ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <ShoppingBag className="w-4 h-4 mr-1.5" />}
                  Adquirir {pkg.name} ({display.priceFormatted})
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* GUIA EXPLICATIVO: AVALIAÇÃO VS REESCRITA */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border-none shadow-lg">
        <CardHeader className="pb-3">
          <Badge variant="outline" className="w-fit border-indigo-400 text-indigo-300 bg-indigo-950/60 text-xs mb-1">
            Guia Explicativo
          </Badge>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            Entenda as Diferenças entre Avaliação e Reescrita do Currículo
          </CardTitle>
          <CardDescription className="text-slate-300 text-xs">
            Você é livre para escolher como utilizar seu saldo de créditos entre a avaliação técnica ou a reescrita de experiências.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-white/10 rounded-xl p-4 space-y-2.5 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <FileSearch className="w-5 h-5 shrink-0" />
              <span>Avaliação do Currículo (20 créditos)</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              <strong>Diagnóstico Completo em 8 Dimensões:</strong> Analisa seu currículo atual como um recrutador técnico e robô ATS. Aponta Nota Geral, pontos fortes, vulnerabilidades, palavras-chave faltantes e nível de atratividade comercial.
            </p>
            <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1 pt-1">
              <span>Indicado para: Saber onde melhorar antes de enviar currículos.</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 space-y-2.5 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Edit3 className="w-5 h-5 shrink-0" />
              <span>Reescrita do Currículo (10 créditos)</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              <strong>Reformulação Prática de Experiências:</strong> Reescreve suas experiências profissionais aplicando a <strong>Fórmula STAR (Situação, Tarefa, Ação, Resultado)</strong> e a <strong>Fórmula Google XYZ</strong>, garantindo 100% de veracidade dos fatos com máximo impacto executivo.
            </p>
            <div className="text-[11px] text-indigo-300 font-medium flex items-center gap-1 pt-1">
              <span>Indicado para: Transformar textos simples em realizações de alto impacto.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CONSUMPTION TABLE GUIDE */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" /> Tabela de Consumo de Créditos
          </CardTitle>
          <CardDescription>
            Veja o custo em créditos para cada funcionalidade da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">Funcionalidade / Ação</th>
                  <th className="px-4 py-3">Consumo em Créditos</th>
                  <th className="px-4 py-3">Custo Aproximado (Plano de Entrada R$ 9,90)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Download do currículo em PDF', cost: CREDIT_COSTS.pdf_download },
                  { name: 'Resumo Profissional / Melhoria de Trecho', cost: CREDIT_COSTS.professional_summary },
                  { name: 'Reescrever Experiência Profissional (STAR/XYZ)', cost: CREDIT_COSTS.rewrite_experience },
                  { name: 'Carta de Apresentação Personalizada', cost: CREDIT_COSTS.cover_letter },
                  { name: 'Avaliação Completa do Currículo em 8 Dimensões', cost: CREDIT_COSTS.full_analysis },
                  { name: 'Orientação de Carreira (áreas, aderência e capacitação)', cost: CREDIT_COSTS.career_orientation },
                  { name: 'Otimização de Perfil (LinkedIn, Gupy, etc.)', cost: CREDIT_COSTS.social_optimization },
                  { name: 'Comparar Currículo com Vaga Alvo', cost: CREDIT_COSTS.resume_comparison },
                ].map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-emerald-200 text-emerald-800 bg-emerald-50 font-bold">
                        {item.cost} {item.cost === 1 ? 'crédito' : 'créditos'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      R$ {(item.cost * 0.2475).toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* EXTRATO DE CRÉDITOS */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico de Transações de Crédito</CardTitle>
            <CardDescription>Extrato de aquisições e consumo de saldo no Griffo.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Descrição / Ação</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Créditos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(tx.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{tx.description}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            tx.amount > 0
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                          }
                        >
                          {tx.type === 'welcome' ? 'Boas-Vindas' : tx.type === 'purchase' ? 'Compra' : 'Consumo'}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 font-mono font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
