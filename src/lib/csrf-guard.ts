/**
 * Defesa em profundidade contra CSRF (Cross-Site Request Forgery).
 *
 * Valida os cabeçalhos `Origin` e `Sec-Fetch-Site` para todas as requisições que
 * alteram estado (POST, PUT, PATCH, DELETE), garantindo que requisições cross-site
 * maliciosas sejam bloqueadas antes de atingir qualquer handler da aplicação.
 */

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Rotas isentas de verificação de Origin:
 * - Webhooks externos assinados por HMAC (ex: Stripe).
 * - Descadastro público do Radar via RFC 8058 (POST do Gmail/Outlook).
 * - Rotas de Cron protegidas por token Bearer secreto.
 */
const CSRF_EXEMPT_PREFIXES = [
  '/api/webhooks/',
  '/api/radar/unsubscribe',
  '/api/cron/',
]

export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function isMutatingMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase())
}

export interface RequestOriginHeaders {
  method: string
  pathname: string
  origin?: string | null
  host?: string | null
  secFetchSite?: string | null
}

/**
 * Verifica se a requisição é de mesma origem (same-origin).
 * Devolve `true` se permitida, `false` se for tentativa cross-site não autorizada.
 */
export function validateSameOrigin(req: RequestOriginHeaders): boolean {
  if (!isMutatingMethod(req.method)) return true
  if (isCsrfExempt(req.pathname)) return true

  // Bloqueia se o navegador explicitamente sinalizar requisição cross-site
  if (req.secFetchSite === 'cross-site') {
    return false
  }

  // Se o cabeçalho Origin estiver presente, deve corresponder ao Host da aplicação
  if (req.origin) {
    try {
      const originUrl = new URL(req.origin)
      const expectedHost = req.host
      if (!expectedHost) return false

      // Normaliza portas caso presentes
      const originHost = originUrl.host.toLowerCase()
      const host = expectedHost.toLowerCase()

      if (originHost !== host) {
        return false
      }
    } catch {
      // Origin malformado
      return false
    }
  }

  return true
}
