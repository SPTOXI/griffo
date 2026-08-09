// This wrapper adds `credentials: 'include'`, `cache: 'no-store'`, and dynamic timestamp parameters for relative URLs.
export function internalFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const isRelative = typeof input === 'string' && input.startsWith('/')
  let finalInput = input

  if (isRelative && typeof input === 'string') {
    const sep = input.includes('?') ? '&' : '?'
    finalInput = `${input}${sep}_t=${Date.now()}`
  }

  // O idioma viaja aqui, e não em cada corpo de requisição, para que nenhum
  // ponto de chamada possa esquecer de enviá-lo. As rotas de IA leem este
  // cabeçalho para decidir o idioma da resposta e o mercado de referência.
  let lang = 'pt'
  try {
    const stored = localStorage.getItem('griffo_lang')
    if (stored && ['pt', 'en', 'es'].includes(stored)) lang = stored
  } catch {
    // localStorage indisponível (SSR ou navegador bloqueando) — mantém o padrão
  }

  const defaultHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Griffo-Lang': lang,
  }

  const defaultInit: RequestInit = isRelative
    ? { credentials: 'include', cache: 'no-store', headers: defaultHeaders }
    : {}

  const mergedHeaders = {
    ...(defaultInit.headers || {}),
    ...(init?.headers || {}),
  }

  const merged: RequestInit = {
    ...defaultInit,
    ...init,
    headers: mergedHeaders,
  }

  return fetch(finalInput, merged)
}
