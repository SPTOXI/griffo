'use client'

import { useEffect, useState } from 'react'
import { useAuth, useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCard, Check, Loader2, Sparkles, Zap, CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { CREDIT_PACKAGES, CREDIT_COSTS } from '@/lib/credits'

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
  const [credits, setCredits] = useState<number>(20)
  const [transactions, setTransactions] = useState<CreditTx[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    loadCreditsData()
  }, [])

  const loadCreditsData = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/credits/balance')
      const data = await r.json()
      if (typeof data.credits === 'number') {
        setCredits(data.credits)
      }
      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions)
      }
    } catch {
      toast.error('Erro ao carregar saldo de créditos.')
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async (packageId: 'starter' | 'carreira' | 'profissional') => {
    setBuyingId(packageId)
    try {
      const r = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erro ao adquirir pacote.')
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

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500 fill-amber-500" /> Saldo & Pacotes de Créditos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Adquira saldo sob demanda para utilizar as ferramentas de Inteligência Artificial do Griffo.
          </p>
        </div>

        {/* CURRENT BALANCE BANNER */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl px-5 py-3 text-white flex items-center gap-4 shadow-md">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Seu Saldo Disponível</p>
            <p className="text-2xl font-extrabold flex items-center gap-1.5">
              {credits} <span className="text-sm font-normal text-emerald-100">créditos</span>
            </p>
          </div>
          <Zap className="w-8 h-8 text-amber-300 fill-amber-300 opacity-90 shrink-0" />
        </div>
      </div>

      {/* CREDIT PACKAGES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {CREDIT_PACKAGES.filter((p) => p.id !== 'free').map((pkg) => {
          const isBuying = buyingId === pkg.id
          return (
            <Card
              key={pkg.id}
              className={`relative border-2 transition-all flex flex-col justify-between bg-white ${
                pkg.popular ? 'border-emerald-500 shadow-xl scale-[1.02]' : 'border-slate-200 hover:border-emerald-300 shadow-sm'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 shadow-sm px-3 py-0.5 text-xs font-bold">
                    Melhor Custo-Benefício
                  </Badge>
                </div>
              )}
              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">{pkg.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{pkg.desc}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">R$ {pkg.priceBrl.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      R$ {pkg.pricePerCredit.toFixed(3).replace('.', ',')} por crédito ({pkg.credits} créditos)
                    </p>
                  </div>

                  <ul className="space-y-2.5 mb-6 text-xs text-slate-700">
                    <li className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {pkg.credits} créditos adicionados ao saldo
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Sem expiração ou taxa mensal
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Acesso total a todas as IAs do Griffo
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => handleBuy(pkg.id as any)}
                  disabled={isBuying}
                  className={`w-full h-11 font-semibold ${
                    pkg.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isBuying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
                  Adquirir {pkg.credits} Créditos
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
                  <th className="px-4 py-3">Custo Aproximado (Pacote Carreira)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Download do currículo em PDF', cost: CREDIT_COSTS.pdf_download },
                  { name: 'Resumo Profissional / Melhoria de Trecho', cost: CREDIT_COSTS.professional_summary },
                  { name: 'Reescrever Experiência Profissional (STAR/XYZ)', cost: CREDIT_COSTS.rewrite_experience },
                  { name: 'Carta de Apresentação Personalizada', cost: CREDIT_COSTS.cover_letter },
                  { name: 'Análise Completa do Currículo em 8 Dimensões', cost: CREDIT_COSTS.full_analysis },
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
                      R$ {(item.cost * 0.199).toFixed(2).replace('.', ',')}
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
