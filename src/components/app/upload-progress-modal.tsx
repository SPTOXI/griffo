'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Loader2, Cpu, Sparkles } from 'lucide-react'
import { ANALYSIS_STAGES, type SegmentId } from '@/lib/analysis/stages'

/**
 * O andamento real da análise.
 *
 * A versão anterior animava uma barra por tempo decorrido: subia 3,5% a cada
 * 200ms até travar em 96%, sem qualquer relação com o que o servidor estava
 * fazendo. Quando a análise levava 82s e a função era encerrada aos 60s, o
 * usuário via 96% e depois um erro — o pior desfecho possível, porque a barra
 * tinha acabado de prometer que estava quase pronto.
 *
 * Agora cada etapa acende quando o segmento correspondente termina de verdade,
 * e as notas aparecem na tela conforme chegam. A espera continua existindo, mas
 * deixa de ser opaca: dá para ver o laudo sendo escrito.
 */

export interface UploadProgressModalProps {
  isOpen: boolean
  /** 0 a 100, vindo do servidor — segmentos concluídos sobre o total. */
  progress: number
  completedSegments: SegmentId[]
  /** Laudo parcial: o que já foi gerado até agora. */
  partial?: { dimensions?: { label: string; score: number }[]; summary?: string } | null
  /** Texto do topo, para as fases que antecedem a análise (upload, gravação). */
  headline?: string
}

export function UploadProgressModal({
  isOpen,
  progress,
  completedSegments,
  partial,
  headline,
}: UploadProgressModalProps) {
  const elapsed = useElapsedSeconds(isOpen)

  if (!isOpen) return null

  const done = new Set(completedSegments)
  const scoreByLabel = new Map<string, number>(
    (partial?.dimensions ?? []).map((d) => [d.label, d.score])
  )

  // A primeira etapa ainda não concluída é a que aparece como "em andamento".
  // Os cinco segmentos rodam em paralelo, então isto é uma escolha de
  // apresentação: marcar todos como ativos de uma vez não ajudaria a ler a tela.
  const currentIndex = ANALYSIS_STAGES.findIndex((s) => !done.has(s.segment))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-xl bg-[#090E17] border-slate-800 shadow-2xl overflow-hidden relative ring-1 ring-white/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0B63E5]/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen" />
        </div>

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
            {headline ??
              'As oito dimensões e o parecer executivo são gerados em paralelo. Cada etapa acende quando fica pronta.'}
          </p>

          {/* Tempo DECORRIDO, nunca previsto. Uma animação sem número é
              indistinguível de tela travada, e uma barra estimada mente: a
              versão anterior chegava a 96% e terminava em "erro". */}
          <p className="text-[11px] text-slate-500 mt-3 font-mono">
            {elapsed}s decorridos
          </p>

          {/* A partir daqui a espera saiu do esperado, e calar sobre isso é o
              que faz a pessoa achar que travou e fechar a aba. */}
          {elapsed >= 30 && (
            <p className="text-[11px] text-amber-300/90 mt-2 max-w-sm mx-auto leading-relaxed">
              Está levando mais que o comum — currículos longos demoram mais.
              {elapsed >= 60
                ? ' O trabalho continua no servidor: se você fechar, ele termina e o resultado estará aqui quando voltar.'
                : ' Continue nesta tela.'}
            </p>
          )}
        </div>

        <CardContent className="p-6 space-y-6 relative z-10">
          <div className="space-y-3 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-[11px] font-bold tracking-wider uppercase">
              <span className="text-blue-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentIndex >= 0 ? ANALYSIS_STAGES[currentIndex].label : 'Consolidando laudo'}
              </span>
              {/* Sem segmento concluído não há progresso real a mostrar, e um
                  número inventado aqui seria a barra falsa de volta. */}
              <span className="text-amber-400 font-mono text-sm">
                {completedSegments.length > 0 ? `${Math.round(progress)}%` : '—'}
              </span>
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

          <div className="grid sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
            {ANALYSIS_STAGES.map((stage, index) => {
              const isCompleted = done.has(stage.segment)
              const isCurrent = index === currentIndex
              const score = scoreByLabel.get(stage.label)

              return (
                <div
                  key={stage.label}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 border ${
                    isCurrent
                      ? 'bg-blue-900/30 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                      : isCompleted
                      ? 'bg-emerald-900/10 border-emerald-500/30'
                      : 'bg-white/5 border-white/5 opacity-40'
                  }`}
                >
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
                        {index + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs font-bold truncate ${
                          isCurrent ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {stage.label}
                      </p>
                      {/* A nota real, assim que o segmento entrega. */}
                      {typeof score === 'number' && (
                        <span className="shrink-0 font-mono text-xs font-bold text-emerald-400 tabular-nums">
                          {score.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] mt-1 leading-relaxed ${
                        isCurrent ? 'text-blue-200' : 'text-slate-500'
                      } line-clamp-2`}
                    >
                      {stage.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* O parecer aparece assim que o segmento executivo termina, antes do
              laudo completo estar montado. */}
          {partial?.summary && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                Parecer executivo
              </p>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{partial.summary}</p>
            </div>
          )}

          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Pode fechar esta janela — o laudo continua sendo gerado
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

/**
 * Segundos decorridos desde que a espera começou.
 *
 * Existe porque uma animação sem referência nenhuma é indistinguível de uma
 * tela travada — e foi assim que a primeira análise se apresentava: giro
 * infinito, sem número, sem etapa, sem nada que dissesse "ainda está vivo".
 *
 * O que se mostra é o **tempo real decorrido**, nunca uma porcentagem estimada.
 * A versão anterior desta tela animava uma barra falsa calibrada num tempo
 * previsto: quando a função era encerrada, a barra estava em 96% e o usuário
 * lia "erro". Um relógio pode ser lento; ele não pode mentir.
 */
function useElapsedSeconds(running: boolean): number {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!running) {
      setSeconds(0)
      return
    }
    const startedAt = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [running])

  return seconds
}
