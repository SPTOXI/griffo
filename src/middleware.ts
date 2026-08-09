import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Rate limiting por IP nas rotas sensíveis.
 *
 * Limitação conhecida: o contador vive na memória da instância. Em execução
 * serverless cada instância tem o seu, então o limite efetivo é maior que o
 * configurado quando há várias instâncias quentes, e zera em instâncias frias.
 *
 * Isso ainda cobre o caso que importa — um atacante martelando o login tende a
 * cair na mesma instância quente — mas não é um limite global. Para garantia
 * real, trocar o Map por um store compartilhado (Upstash/Redis) mantendo esta
 * mesma interface.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Evita crescimento sem limite da memória em instâncias de vida longa.
const MAX_BUCKETS = 10_000

interface Rule {
  /** Prefixo do caminho ao qual a regra se aplica. */
  prefix: string
  /** Requisições permitidas dentro da janela. */
  limit: number
  /** Tamanho da janela em milissegundos. */
  windowMs: number
}

// Ordem importa: a primeira regra cujo prefixo casa é a aplicada.
const RULES: Rule[] = [
  // Força bruta de senha. Senhas têm mínimo de 6 caracteres, então este é o
  // limite mais importante do conjunto.
  { prefix: '/api/auth/login', limit: 10, windowMs: 5 * 60_000 },
  { prefix: '/api/auth/register', limit: 5, windowMs: 60 * 60_000 },
  // Rotas que gastam tokens de IA — cada chamada tem custo real.
  { prefix: '/api/resume/analyze', limit: 10, windowMs: 10 * 60_000 },
  { prefix: '/api/resume/rewrite', limit: 10, windowMs: 10 * 60_000 },
  { prefix: '/api/resume/career-orientation', limit: 10, windowMs: 10 * 60_000 },
  // Gasta tokens e ainda dispara buscas externas (GitHub, Jina) por perfil.
  { prefix: '/api/resume/social-analysis', limit: 8, windowMs: 10 * 60_000 },
  { prefix: '/api/support/chat', limit: 30, windowMs: 10 * 60_000 },
  // Usa o servidor como cliente HTTP para buscar páginas externas.
  { prefix: '/api/resume/job-fetch', limit: 20, windowMs: 10 * 60_000 },
  // Criação de checkout no Stripe.
  { prefix: '/api/credits/purchase', limit: 20, windowMs: 10 * 60_000 },
  // Exportação lê todos os dados do titular de uma vez; exclusão é
  // irreversível. Ambas são legítimas e raras — o limite é baixo de propósito.
  { prefix: '/api/user/export', limit: 5, windowMs: 60 * 60_000 },
  { prefix: '/api/user', limit: 20, windowMs: 10 * 60_000 },
]

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'desconhecido'
}

function check(key: string, rule: Rule): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now >= existing.resetAt) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, v] of buckets) {
        if (now >= v.resetAt) buckets.delete(k)
      }
      // Se a limpeza não liberou espaço, deixa passar em vez de bloquear tudo.
      if (buckets.size >= MAX_BUCKETS) return { allowed: true, retryAfterSec: 0 }
    }
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }

  existing.count += 1
  if (existing.count > rule.limit) {
    return { allowed: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) }
  }
  return { allowed: true, retryAfterSec: 0 }
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const rule = RULES.find((r) => path.startsWith(r.prefix))
  if (!rule) return NextResponse.next()

  const { allowed, retryAfterSec } = check(`${clientIp(req)}:${rule.prefix}`, rule)
  if (allowed) return NextResponse.next()

  return NextResponse.json(
    { error: 'Muitas requisições em pouco tempo. Aguarde alguns instantes e tente novamente.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
  )
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/resume/:path*',
    '/api/support/:path*',
    '/api/credits/:path*',
    '/api/user/:path*',
  ],
}
