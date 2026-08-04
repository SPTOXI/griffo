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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-xl bg-[#090E17] border-slate-800 shadow-2xl overflow-hidden relative ring-1 ring-white/10">
        
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0B63E5]/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen" />
        </div>

        {/* Top Decorative Banner */}
        <div className="p-6 text-center relative z-10 border-b border-white/10">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-inner relative">
              <div className="absolute inset-0 rounded-2xl border border-[#0B63E5]/50 animate-ping opacity-20" />
              <Cpu className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Auditoria IA em Tempo Real
          </h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto font-medium">
            Mecanismo preditivo processando seu perfil em 8 dimensões através de métricas de recrutamento executivo e filtros ATS.
          </p>
        </div>

        <CardContent className="p-6 space-y-6 relative z-10">
          {/* Main Progress Bar & Sub-Status */}
          <div className="space-y-3 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-[11px] font-bold tracking-wider uppercase">
              <span className="text-blue-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando: {DIMENSIONS_LIST[currentDimIndex - 1]?.name}
              </span>
              <span className="text-amber-400 font-mono text-sm">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400 transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-[2px]" />
              </div>
            </div>
          </div>

          {/* Stepper 8-Dimensions Grid */}
          <div className="grid sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
            {DIMENSIONS_LIST.map((dim) => {
              const Icon = dim.icon
              const isCompleted = progress >= (dim.id / 8) * 100 || (progress >= 98)
              const isCurrent = currentDimIndex === dim.id && progress < 98

              return (
                <div
                  key={dim.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 border ${
                    isCurrent
                      ? 'bg-blue-900/30 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                      : isCompleted
                      ? 'bg-emerald-900/10 border-emerald-500/30'
                      : 'bg-white/5 border-white/5 opacity-40'
                  }`}
                >
                  {/* Icon Indicator */}
                  <div className="shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-inner">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400 text-blue-400 flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                        {dim.id}
                      </div>
                    )}
                  </div>

                  {/* Dimension Text */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isCompleted ? 'text-emerald-400' : isCurrent ? 'text-blue-400' : 'text-slate-500'
                        }`}
                      />
                      <p
                        className={`text-xs font-bold truncate ${
                          isCurrent ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {dim.name}
                      </p>
                    </div>
                    <p className={`text-[10px] mt-1 leading-relaxed ${isCurrent ? 'text-blue-200' : 'text-slate-500'} line-clamp-2`}>
                      {dim.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Analisando conexões semânticas e extraindo metadados
            </p>
          </div>
        </CardContent>
      </Card>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
      `}} />
    </div>
  )
}
