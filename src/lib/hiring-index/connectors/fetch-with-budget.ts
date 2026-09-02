/**
 * `fetch` com teto de tempo, compartilhado entre os conectores.
 *
 * Extraído depois de existir copiado, quase byte a byte, no BLS e no Eurostat
 * (o mesmo `AbortController` + `setTimeout` + `try/catch/finally` que também
 * já existia em `lib/jobs/adapters/jobbase.ts` antes deste módulo — aqui só se
 * resolve a duplicação ENTRE os dois conectores novos, não a mais antiga).
 */

export interface FetchJsonWithBudgetOptions {
  /** Teto de tempo da chamada, em ms. Abaixo de 1s não teria chance real de terminar. */
  timeBudgetMs: number
  /** Nome da fonte, só para a mensagem de erro (`"HTTP 500 no BLS"`). */
  sourceName: string
  /** Injetado nos testes. */
  fetchImpl?: typeof fetch
  /** Repassado ao `fetch` — método, corpo, cabeçalhos. Nunca `signal`: este módulo cuida disso. */
  init?: Omit<RequestInit, 'signal'>
}

export type FetchJsonWithBudgetResult =
  | { ok: true; json: unknown }
  | { ok: false; error: string }

export async function fetchJsonWithBudget(
  url: string,
  options: FetchJsonWithBudgetOptions
): Promise<FetchJsonWithBudgetResult> {
  const doFetch = options.fetchImpl ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.max(1000, options.timeBudgetMs))

  try {
    const response = await doFetch(url, { ...options.init, signal: controller.signal })

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status} no ${options.sourceName}` }
    }

    return { ok: true, json: await response.json() }
  } catch (e: any) {
    return {
      ok: false,
      error: e?.name === 'AbortError' ? `Tempo esgotado no ${options.sourceName}` : e?.message || String(e),
    }
  } finally {
    clearTimeout(timer)
  }
}
