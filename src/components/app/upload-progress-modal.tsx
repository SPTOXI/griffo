'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2, Loader2, FileText, Cpu, BarChart3, Award, Sparkles, Key, Target, GraduationCap, Share2
} from 'lucide-react'

export interface UploadProgressModalProps {
  isOpen: boolean
  step: number // 1 to 4 or 1 to 8
  progress: number // 0 to 100
}

const DIMENSIONS_LIST = [
  { id: 1, name: 'Estrutura & Compatibilidade ATS', desc: 'Formatos, parseabilidade de PDF e robôs de RH', icon: Cpu },
  { id: 2, name: 'Resumo & Posicionamento Executivo', desc: 'Headline, objetivo e síntese de carreira', icon: FileText },
  { id: 3, name: 'Impacto & Métricas STAR/XYZ', desc: 'Quantificação de resultados e indicadores numéricos', icon: BarChart3 },
  { id: 4, name: 'Palavras-Chave Estratégicas ATS', desc: 'Vocabulário técnico, Gupy e busca Booleana', icon: Key },
  { id: 5, name: 'Relevância para a Vaga Alvo', desc: 'Aderência a pré-requisitos e senioridade', icon: Target },
  { id: 6, name: 'Formação & Certificações', desc: 'Graduação, pós-graduação, certificações e idiomas', icon: GraduationCap },
  { id: 7, name: 'Presença Digital & Mídias Sociais', desc: 'LinkedIn, Gupy, bio profissional e links', icon: Share2 },
  { id: 8, name: 'Síntese do Veredito & Parecer Final', desc: 'Pontos fortes, fragilidades e recomendações', icon: Award },
]

export function UploadProgressModal({ isOpen, step, progress }: UploadProgressModalProps) {
  if (!isOpen) return null

  // Map 0-100% progress smoothly to the active dimension index (1..8)
  const currentDimIndex = Math.min(8, Math.max(1, Math.ceil((progress / 100) * 8)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <Card className="w-full max-w-xl bg-white shadow-2xl border-slate-200 overflow-hidden relative">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-[#0B192E] via-[#0B63E5] to-indigo-900 p-5 text-white text-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center mb-2.5 border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">Auditando Currículo em 8 Dimensões</h3>
            <p className="text-xs text-blue-100 mt-0.5 max-w-sm">
              Nossa Inteligência Artificial está analisando seu perfil em tempo real sob critérios executivos e algoritmos ATS.
            </p>
          </div>
        </div>

        <CardContent className="p-5 space-y-5">
          {/* Main Progress Bar & Sub-Status */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-[#0B63E5] animate-spin" />
                Auditando Dimensão {currentDimIndex}/8: {DIMENSIONS_LIST[currentDimIndex - 1]?.name}
              </span>
              <Badge variant="outline" className="bg-blue-100 text-[#0B63E5] border-blue-200 font-bold font-mono text-[11px]">
                {Math.round(progress)}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2.5 bg-slate-200/70" />
          </div>

          {/* Stepper 8-Dimensions Grid */}
          <div className="grid sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
            {DIMENSIONS_LIST.map((dim) => {
              const Icon = dim.icon
              const isCompleted = progress >= (dim.id / 8) * 100 || (progress >= 98)
              const isCurrent = currentDimIndex === dim.id && progress < 98

              return (
                <div
                  key={dim.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg transition-all duration-200 border ${
                    isCurrent
                      ? 'bg-blue-50/90 border-blue-300 shadow-2xs ring-1 ring-blue-400/30'
                      : isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200 opacity-95'
                      : 'bg-slate-50/50 border-slate-100 opacity-50'
                  }`}
                >
                  {/* Icon Indicator */}
                  <div className="shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-[#0B63E5] text-white flex items-center justify-center shadow-2xs animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                        {dim.id}
                      </div>
                    )}
                  </div>

                  {/* Dimension Text */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
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
                            : 'text-slate-600'
                        }`}
                      >
                        {dim.name}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">
                      {dim.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Processando auditoria com IA em tempo real. Por favor, aguarde...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
