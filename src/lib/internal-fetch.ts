// This wrapper adds `credentials: 'include'` and `cache: 'no-store'` for relative URLs.
// No internal API endpoints require omitting credentials; if a special case arises, callers can pass their own `init` overriding these defaults.
export function internalFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const isRelative = typeof input === 'string' && input.startsWith('/')
  const defaultInit: RequestInit = isRelative ? { credentials: 'include', cache: 'no-store' } : {}
  const merged = { ...defaultInit, ...init };
  return fetch(input, merged);
}
