// This wrapper adds `credentials: 'include'`, `cache: 'no-store'`, and dynamic timestamp parameters for relative URLs.
export function internalFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const isRelative = typeof input === 'string' && input.startsWith('/')
  let finalInput = input

  if (isRelative && typeof input === 'string') {
    const sep = input.includes('?') ? '&' : '?'
    finalInput = `${input}${sep}_t=${Date.now()}`
  }

  const defaultHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
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
