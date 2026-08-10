'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { internalFetch } from '@/lib/internal-fetch'
import type { SegmentId } from '@/lib/analysis/stages'

/**
 * Acompanha uma análise que roda no servidor, fora desta requisição.
 *
 * A tela antes segurava um `fetch` de até 82s e animava uma barra falsa por
 * cima da espera — calibrada num tempo estimado, não no trabalho real. Quando a
 * função era encerrada aos 60s, a barra estava em 96% e o que aparecia era
 * "erro de conexão".
 *
 * Aqui o POST volta em milissegundos com um `jobId`, e o progresso vem do
 * servidor: cada segmento concluído é um fato, não uma estimativa. Sair da
 * página não cancela nada — `attach` reencontra o job em andamento pelo id do
 * currículo e volta a acompanhá-lo.
 */

const POLL_INTERVAL_MS = 1500

/**
 * Teto de espera antes de desistir de acompanhar. Generoso de propósito: o
 * trabalho continua no servidor mesmo depois disto, e o laudo aparece na volta
 * — o limite é da tela, não do processamento.
 */
const MAX_WAIT_MS = 5 * 60 * 1000

export type AnalysisJobPhase = 'idle' | 'starting' | 'running' | 'completed' | 'failed'

export interface AnalysisJobState {
  phase: AnalysisJobPhase
  progress: number
  completedSegments: SegmentId[]
  /** Laudo montado com os segmentos que já chegaram. */
  partial: any | null
  analysis: any | null
  error: string | null
  errorCode: string | null
}

export interface UseAnalysisJobOptions {
  /**
   * Desfechos como retorno de chamada, e não como `useEffect` observando a
   * fase: assim quem usa o hook não precisa de um efeito que dispara setState
   * em cascata a cada transição.
   */
  onCompleted?: (analysis: any) => void
  onFailed?: (error: string, code: string | null) => void
}

const INITIAL: AnalysisJobState = {
  phase: 'idle',
  progress: 0,
  completedSegments: [],
  partial: null,
  analysis: null,
  error: null,
  errorCode: null,
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

export function useAnalysisJob(options: UseAnalysisJobOptions = {}) {
  const [state, setState] = useState<AnalysisJobState>(INITIAL)

  // Os retornos de chamada mudam a cada render; guardá-los num ref evita
  // recriar o laço de acompanhamento por causa disso.
  const callbacksRef = useRef<UseAnalysisJobOptions>(options)
  useEffect(() => {
    callbacksRef.current = options
  })

  // Job em acompanhamento. Serve de token de cancelamento: o laço para sozinho
  // assim que este valor deixa de ser o dele.
  const activeJobRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      activeJobRef.current = null
    }
  }, [])

  /**
   * Laço de acompanhamento, escrito como `while` e não como `setTimeout`
   * recursivo — a recursão precisaria referenciar a si mesma antes de existir.
   */
  const track = useCallback(async (jobId: string) => {
    const startedAt = Date.now()

    while (activeJobRef.current === jobId) {
      let keepWaiting = true

      try {
        const r = await internalFetch(`/api/resume/analyze/status?jobId=${jobId}`, {
          cache: 'no-store',
        })
        const data = await r.json().catch(() => ({}))

        if (activeJobRef.current !== jobId) return

        if (r.ok && data.status === 'completed') {
          activeJobRef.current = null
          setState({
            phase: 'completed',
            progress: 100,
            completedSegments: data.completedSegments ?? [],
            partial: null,
            analysis: data.analysis ?? null,
            error: null,
            errorCode: null,
          })
          callbacksRef.current.onCompleted?.(data.analysis ?? null)
          return
        }

        if (r.ok && data.status === 'failed') {
          const message = data.error || 'A análise não pôde ser concluída.'
          activeJobRef.current = null
          setState((s) => ({ ...s, phase: 'failed', error: message }))
          callbacksRef.current.onFailed?.(message, null)
          return
        }

        if (r.ok) {
          setState((s) => ({
            ...s,
            phase: 'running',
            progress: data.progress ?? s.progress,
            completedSegments: data.completedSegments ?? s.completedSegments,
            partial: data.partial ?? s.partial,
          }))
        }
        // Uma consulta que falha não condena o job: ele segue no servidor, e a
        // próxima volta do laço tenta de novo.
      } catch {
        keepWaiting = true
      }

      if (Date.now() - startedAt > MAX_WAIT_MS) {
        const message =
          'A análise está demorando mais que o previsto. Ela continua sendo processada — recarregue a página em instantes.'
        activeJobRef.current = null
        setState((s) => ({ ...s, phase: 'failed', error: message }))
        callbacksRef.current.onFailed?.(message, null)
        return
      }

      if (keepWaiting) await sleep(POLL_INTERVAL_MS)
    }
  }, [])

  const begin = useCallback(
    (jobId: string) => {
      activeJobRef.current = jobId
      setState({ ...INITIAL, phase: 'running' })
      void track(jobId)
    },
    [track]
  )

  /** Abre uma análise nova (ou reaproveita a que já estiver em andamento). */
  const start = useCallback(
    async (resumeId: string): Promise<boolean> => {
      activeJobRef.current = null
      setState({ ...INITIAL, phase: 'starting' })

      try {
        const r = await internalFetch('/api/resume/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeId }),
        })
        const data = await r.json().catch(() => ({}))

        if (!r.ok || !data.jobId) {
          const message = data.error || 'Não foi possível iniciar a análise.'
          setState({ ...INITIAL, phase: 'failed', error: message, errorCode: data.code ?? null })
          callbacksRef.current.onFailed?.(message, data.code ?? null)
          return false
        }

        begin(data.jobId)
        return true
      } catch {
        const message = 'Falha de conexão ao iniciar a análise.'
        setState({ ...INITIAL, phase: 'failed', error: message })
        callbacksRef.current.onFailed?.(message, null)
        return false
      }
    },
    [begin]
  )

  /**
   * Reencontra uma análise em andamento para este currículo, sem abrir outra —
   * o caso de quem fechou o navegador no meio e voltou.
   */
  const attach = useCallback(
    async (resumeId: string): Promise<boolean> => {
      try {
        const r = await internalFetch(`/api/resume/analyze/status?resumeId=${resumeId}`, {
          cache: 'no-store',
        })
        if (!r.ok) return false
        const data = await r.json().catch(() => ({}))
        if (data.status !== 'queued' && data.status !== 'running') return false

        begin(data.jobId)
        return true
      } catch {
        return false
      }
    },
    [begin]
  )

  const reset = useCallback(() => {
    activeJobRef.current = null
    setState(INITIAL)
  }, [])

  return { ...state, start, attach, reset }
}
