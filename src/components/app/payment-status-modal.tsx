'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Loader2, AlertTriangle, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { internalFetch } from '@/lib/internal-fetch'
import { Badge } from '@/components/ui/badge'

interface PaymentStatusModalProps {
  sessionId: string
  expectedCredits?: number
  onComplete: (newBalance: number) => void
  onClose: () => void
}

type StepStatus = 'pending' | 'loading' | 'success' | 'error'

export function PaymentStatusModal({ sessionId, expectedCredits, onComplete, onClose }: PaymentStatusModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [step1Status, setStep1Status] = useState<StepStatus>('success')
  const [step2Status, setStep2Status] = useState<StepStatus>('loading')
  const [step3Status, setStep3Status] = useState<StepStatus>('pending')

  const [overallStatus, setOverallStatus] = useState<'validating' | 'success' | 'failed'>('validating')
  const [creditsAdded, setCreditsAdded] = useState<number>(expectedCredits || 0)
  const [newBalance, setNewBalance] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    async function runVerification() {
      // Step 1: Stripe Return Received (already success)
      await new Promise((r) => setTimeout(r, 600))
      if (!isMounted) return

      // Step 2: Validate transaction with Stripe API
      setStep(2)
      setStep2Status('loading')

      try {
        const res = await internalFetch('/api/credits/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          if (!isMounted) return
          setStep2Status('error')
          setOverallStatus('failed')
          setErrorMessage(data.error || 'Não foi possível validar a transação com o Stripe.')
          return
        }

        if (!isMounted) return
        setStep2Status('success')
        await new Promise((r) => setTimeout(r, 600))
        if (!isMounted) return

        // Step 3: Inject credits into account
        setStep(3)
        setStep3Status('loading')

        await new Promise((r) => setTimeout(r, 500))
        if (!isMounted) return

        setStep3Status('success')
        setOverallStatus('success')
        if (typeof data.creditsAdded === 'number' && data.creditsAdded > 0) {
          setCreditsAdded(data.creditsAdded)
        }
        if (typeof data.totalCredits === 'number') {
          setNewBalance(data.totalCredits)
          onComplete(data.totalCredits)
        }
      } catch (err: any) {
        if (!isMounted) return
        setStep2Status('error')
        setOverallStatus('failed')
        setErrorMessage(err.message || 'Falha de comunicação ao verificar o pagamento.')
      }
    }

    runVerification()

    return () => {
      isMounted = false
    }
  }, [sessionId, onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-900">
        {/* Header Banner */}
        <div className={`p-6 text-center text-white relative ${
          overallStatus === 'success'
            ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700'
            : overallStatus === 'failed'
            ? 'bg-gradient-to-br from-rose-600 to-red-700'
            : 'bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700'
        }`}>
          <div className="flex justify-center mb-3">
            {overallStatus === 'validating' && (
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-md animate-pulse">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {overallStatus === 'success' && (
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-md animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            )}
            {overallStatus === 'failed' && (
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-md">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold">
            {overallStatus === 'validating' && 'Verificando Pagamento'}
            {overallStatus === 'success' && 'Pagamento Confirmado! 🎉'}
            {overallStatus === 'failed' && 'Falha na Validação'}
          </h3>
          <p className="text-xs text-white/80 mt-1">
            {overallStatus === 'validating' && 'Acompanhe as etapas de verificação em tempo real'}
            {overallStatus === 'success' && 'Seus créditos já estão disponíveis para uso'}
            {overallStatus === 'failed' && (errorMessage || 'Verifique seus dados ou tente novamente')}
          </p>
        </div>

        {/* Traceability Steps */}
        <div className="p-6 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Rastreabilidade da Transação
          </div>

          {/* Step 1 */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex-shrink-0">
              {step1Status === 'success' ? (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                  1
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800">1. Retorno Seguro do Gateway</p>
              <p className="text-[11px] text-slate-500">Redirecionamento do Stripe efetuado</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
              CONCLUÍDO
            </Badge>
          </div>

          {/* Step 2 */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            step2Status === 'loading'
              ? 'bg-indigo-50/50 border-indigo-200'
              : step2Status === 'success'
              ? 'bg-slate-50 border-slate-100'
              : step2Status === 'error'
              ? 'bg-rose-50 border-rose-200'
              : 'bg-slate-50/40 border-slate-100 opacity-60'
          }`}>
            <div className="flex-shrink-0">
              {step2Status === 'loading' && <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />}
              {step2Status === 'success' && (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
              )}
              {step2Status === 'error' && (
                <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                  ✕
                </div>
              )}
              {step2Status === 'pending' && (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                  2
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800">2. Autenticação da Transação</p>
              <p className="text-[11px] text-slate-500">Consulta direta de status com a API do Stripe</p>
            </div>
            {step2Status === 'loading' && (
              <Badge className="bg-indigo-100 text-indigo-800 border-none font-bold text-[10px] animate-pulse">
                VALIDANDO...
              </Badge>
            )}
            {step2Status === 'success' && (
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                APROVADO
              </Badge>
            )}
            {step2Status === 'error' && (
              <Badge className="bg-rose-100 text-rose-800 border-none font-bold text-[10px]">
                FALHOU
              </Badge>
            )}
          </div>

          {/* Step 3 */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            step3Status === 'loading'
              ? 'bg-emerald-50/50 border-emerald-200'
              : step3Status === 'success'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-slate-50/40 border-slate-100 opacity-60'
          }`}>
            <div className="flex-shrink-0">
              {step3Status === 'loading' && <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />}
              {step3Status === 'success' && (
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
              )}
              {step3Status === 'pending' && (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                  3
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800">3. Injeção de Créditos no Banco</p>
              <p className="text-[11px] text-slate-500">Lançamento na conta do usuário</p>
            </div>
            {step3Status === 'success' && (
              <Badge className="bg-emerald-600 text-white border-none font-bold text-[10px]">
                + {creditsAdded} CRÉDITOS
              </Badge>
            )}
          </div>

          {/* Success summary box */}
          {overallStatus === 'success' && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-center space-y-1 animate-in zoom-in-95 duration-200">
              <p className="text-xs text-emerald-800 font-medium">Novo Saldo Disponível</p>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                {newBalance !== null ? `${newBalance} Créditos` : `+${creditsAdded} Créditos`}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          {overallStatus === 'success' ? (
            <Button
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs w-full sm:w-auto"
            >
              Começar a Usar Meus Créditos <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : overallStatus === 'failed' ? (
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-300 text-slate-700 text-xs font-bold w-full"
            >
              Fechar
            </Button>
          ) : (
            <p className="text-[11px] text-slate-400 text-center w-full italic">
              Aguarde a finalização da validação...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
