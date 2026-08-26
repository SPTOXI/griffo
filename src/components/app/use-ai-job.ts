'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { internalFetch } from '@/lib/internal-fetch'

/**
 * Acompanha um job de IA fora do laudo principal (perfil social, extração de
 * perfil, orientação vocacional, carta, reescrita — ver
 * `lib/ai-jobs/engine.ts` e HANDOFF-CONTINUIDADE.md, "Nunca dar sensação de
 * travamento").
 *
 * Mesmo esqueleto de polling de `use-analysis-job.ts` — que continua intacto,
 * dedicado ao laudo —, parametrizado por rota de início e de status em vez de
 * cravado em `/api/resume/analyze`. Repetir o desenho aqui, em vez de
 * generalizar o hook do laudo, é o que garante que ele continua funcionando
 * exatamente como está.
 */

const POLL_INTERVAL_MS = 1500
const SLOW_POLL_AFTER_MS = 5 * 60 * 1000
const SLOW_POLL_INTERVAL_MS = 10_000
const MAX_WAIT_MS = 20 * 60 * 1000

export type AiJobPhase = 'idle' | 'starting' | 'running' | 'completed' | 'failed'

export interface AiJobState<TResult> {
  phase: AiJobPhase
  progress: number
  completedSteps: number
  totalSteps: number
  result: TResult | null
  error: string | null
  errorCode: string | null
}

export interface UseAiJobOptions<TResult> {
  /** Rota que abre o job — POST, devolve `{ jobId }`. */
  startUrl: string
  /** Rota de status — GET, recebe `?jobId=`. */
  statusUrl: string
  onCompleted?: (result: TResult) => void
  /**
   * `data` é o corpo bruto da resposta que falhou — só preenchido na falha de
   * `start()` (antes de existir job), nunca na falha vinda do status. Existe
   * para chamadores que precisam de mais que `error`/`code` num caso especial
   * (ex.: a leitura de perfil social lê `data.profiles` no 422), sem duplicar
   * a chamada só para inspecionar o corpo.
   */
  onFailed?: (error: string, code: string | null, data?: any) => void
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

function initialState<TResult>(): AiJobState<TResult> {
  return {
    phase: 'idle',
    progress: 0,
    completedSteps: 0,
    totalSteps: 0,
    result: null,
    error: null,
    errorCode: null,
  }
}

export function useAiJob<TResult = unknown>(options: UseAiJobOptions<TResult>) {
  const [state, setState] = useState<AiJobState<TResult>>(initialState<TResult>())

  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  const activeJobRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      activeJobRef.current = null
    }
  }, [])

  const track = useCallback(async (jobId: string) => {
    const startedAt = Date.now()
    let throttled = false

    while (activeJobRef.current === jobId) {
      let keepWaiting = true

      try {
        const r = await internalFetch(`${optionsRef.current.statusUrl}?jobId=${jobId}`, {
          cache: 'no-store',
        })
        const data = await r.json().catch(() => ({}))

        if (activeJobRef.current !== jobId) return

        if (r.ok && data.status === 'completed') {
          activeJobRef.current = null
          setState({
            phase: 'completed',
            progress: 100,
            completedSteps: data.completedSteps ?? 0,
            totalSteps: data.totalSteps ?? 0,
            result: data.result ?? null,
            error: null,
            errorCode: null,
          })
          optionsRef.current.onCompleted?.(data.result ?? null)
          return
        }

        if (r.ok && data.status === 'failed') {
          const message = data.error || 'A tarefa não pôde ser concluída.'
          activeJobRef.current = null
          setState((s) => ({ ...s, phase: 'failed', error: message }))
          optionsRef.current.onFailed?.(message, null)
          return
        }

        if (r.ok) {
          throttled = false
          setState((s) => ({
            ...s,
            phase: 'running',
            progress: data.progress ?? s.progress,
            completedSteps: data.completedSteps ?? s.completedSteps,
            totalSteps: data.totalSteps ?? s.totalSteps,
          }))
        } else if (r.status === 429) {
          throttled = true
        }
        // Uma consulta que falha não condena o job: ele segue no servidor, e
        // a próxima volta do laço tenta de novo.
      } catch {
        keepWaiting = true
      }

      const waited = Date.now() - startedAt

      if (waited > MAX_WAIT_MS) {
        const message =
          'Isso está demorando muito mais que o previsto. O trabalho continua sendo processado — recarregue a página em instantes.'
        activeJobRef.current = null
        setState((s) => ({ ...s, phase: 'failed', error: message }))
        optionsRef.current.onFailed?.(message, null)
        return
      }

      if (keepWaiting) {
        const interval =
          throttled || waited > SLOW_POLL_AFTER_MS ? SLOW_POLL_INTERVAL_MS : POLL_INTERVAL_MS
        await sleep(interval)
      }
    }
  }, [])

  const begin = useCallback(
    (jobId: string) => {
      activeJobRef.current = jobId
      setState({ ...initialState<TResult>(), phase: 'running' })
      void track(jobId)
    },
    [track]
  )

  const start = useCallback(
    async (body: Record<string, unknown>): Promise<boolean> => {
      activeJobRef.current = null
      setState({ ...initialState<TResult>(), phase: 'starting' })

      try {
        const r = await internalFetch(optionsRef.current.startUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await r.json().catch(() => ({}))

        if (!r.ok || !data.jobId) {
          const message = data.error || 'Não foi possível iniciar.'
          setState({ ...initialState<TResult>(), phase: 'failed', error: message, errorCode: data.code ?? null })
          optionsRef.current.onFailed?.(message, data.code ?? null, data)
          return false
        }

        begin(data.jobId)
        return true
      } catch {
        const message = 'Falha de conexão ao iniciar.'
        setState({ ...initialState<TResult>(), phase: 'failed', error: message })
        optionsRef.current.onFailed?.(message, null)
        return false
      }
    },
    [begin]
  )

  const reset = useCallback(() => {
    activeJobRef.current = null
    setState(initialState<TResult>())
  }, [])

  return { ...state, start, reset }
}
