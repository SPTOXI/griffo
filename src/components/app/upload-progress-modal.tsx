'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Loader2, FileText, Cpu, BarChart3, Award, Sparkles } from 'lucide-react'

export interface UploadProgressModalProps {
  isOpen: boolean
  step: number // 1 to 4
  progress: number // 0 to 100
}

const PHASES = [
  {
    id: 1,
    title: 'Extração & Leitura do Documento',
    description: 'Digitalizando PDF/texto, sanitizando caracteres e estruturando seções.',
    icon: FileText,
  },
  {
    id: 2,
    title: 'Auditoria ATS & Palavras-Chave',
    description: 'Avaliando compatibilidade com robôs leitores de RH e jargões do setor.',
    icon: Cpu,
  },
  {
    id: 3,
    title: 'Avaliação de Impacto & Dimensões',
    description: 'Calculando notas em Relevância, Impacto de Experiência e Formatação.',
    icon: BarChart3,
  },
  {
    id: 4,
    title: 'Síntese do Veredito Executivo',
    description: 'Compilando pontos fortes, fragilidades, recomendações e nota final.',
    icon: Award,
  },
]

export function UploadProgressModal({ isOpen, step, progress }: UploadProgressModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200 overflow-hidden relative">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-[#0B192E] via-[#0B63E5] to-indigo-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center mb-3 border border-white/20 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">Analisando seu Currículo</h3>
            <p className="text-xs text-blue-100 mt-1 max-w-xs">
              Nossa Inteligência Artificial está auditando seu perfil em tempo real.
            </p>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-600">Progresso Geral</span>
              <span className="text-[#0B63E5] font-bold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2.5 bg-slate-100" />
          </div>

          {/* Stepper Phases List */}
          <div className="space-y-3.5">
            {PHASES.map((phase) => {
              const Icon = phase.icon
              const isCompleted = step > phase.id || progress >= 100
              const isCurrent = step === phase.id && progress < 100
              const isPending = step < phase.id

              return (
                <div
                  key={phase.id}
                  className={`flex items-start gap-3.5 p-3 rounded-xl transition-all duration-300 border ${
                    isCurrent
                      ? 'bg-blue-50/80 border-blue-200 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50/50 border-emerald-100 opacity-90'
                      : 'bg-slate-50/50 border-transparent opacity-50'
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div className="shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-7 h-7 rounded-full bg-[#0B63E5] text-white flex items-center justify-center shadow-xs animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
                        {phase.id}
                      </div>
                    )}
                  </div>

                  {/* Phase Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-4 h-4 ${
                          isCompleted
                            ? 'text-emerald-600'
                            : isCurrent
                            ? 'text-[#0B63E5]'
                            : 'text-slate-400'
                        }`}
                      />
                      <p
                        className={`text-xs font-bold truncate ${
                          isCurrent
                            ? 'text-[#0B192E]'
                            : isCompleted
                            ? 'text-emerald-950'
                            : 'text-slate-500'
                        }`}
                      >
                        {phase.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {phase.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100">
            ⏳ Isso pode levar alguns segundos. Por favor, mantenha esta janela aberta.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
