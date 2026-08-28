import { NextResponse } from 'next/server'
import { clientIpFrom } from '@/lib/request-ip'
import { matchRule, type RateRule } from '@/lib/rate-rules'
import { validateSameOrigin } from '@/lib/csrf-guard'
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

type Rule = RateRule

// Vence o prefixo MAIS LONGO, não a ordem da lista — ver `lib/rate-rules.ts`.
// A ordem aqui é só de leitura.
const RULES: Rule[] = [
  // Força bruta de senha. Senhas têm mínimo de 6 caracteres, então este é o
  // limite mais importante do conjunto.
  { prefix: '/api/auth/login', limit: 10, windowMs: 5 * 60_000 },
  { prefix: '/api/auth/register', limit: 5, windowMs: 60 * 60_000 },
  // Rotas que gastam tokens de IA — cada chamada tem custo real.
  { prefix: '/api/resume/analyze', limit: 10, windowMs: 10 * 60_000 },
  /**
   * A consulta de status NÃO é a rota cara, e precisa de um limite próprio.
   *
   * Ela é de leitura, e a tela a chama a cada 1,5 segundo por desenho: são ~400
   * consultas em dez minutos numa análise longa, e o dobro com duas abas
   * abertas. Sob o limite da rota pai — 10 por 10 minutos — ela era bloqueada
   * quinze segundos depois de começar.
   *
   * O prejuízo ia muito além da barra parar: é esta rota que REATIVA um
   * trabalho cuja invocação a plataforma encerrou. Bloqueada, o laudo ficava
   * parado no primeiro segmento para sempre.
   */
  { prefix: '/api/resume/analyze/status', limit: 900, windowMs: 10 * 60_000 },
  { prefix: '/api/resume/rewrite', limit: 10, windowMs: 10 * 60_000 },
  { prefix: '/api/resume/career-orientation', limit: 10, windowMs: 10 * 60_000 },
  // Gasta tokens e ainda dispara buscas externas (GitHub, Jina) por perfil.
  { prefix: '/api/resume/social-analysis', limit: 8, windowMs: 10 * 60_000 },
  { prefix: '/api/support/chat', limit: 30, windowMs: 10 * 60_000 },
  // Usa o servidor como cliente HTTP para buscar páginas externas.
  { prefix: '/api/resume/job-fetch', limit: 20, windowMs: 10 * 60_000 },
  // Criação de checkout no Stripe.
  { prefix: '/api/checkout', limit: 20, windowMs: 10 * 60_000 },
  // Prévia gratuita: uma por conta, mas o limite fecha a porta de tentar
  // repetidamente antes que a cota do banco seja consultada.
  { prefix: '/api/resume/preview', limit: 10, windowMs: 10 * 60_000 },
  // Exportação lê todos os dados do titular de uma vez; exclusão é
  // irreversível. Ambas são legítimas e raras — o limite é baixo de propósito.
  { prefix: '/api/user/export', limit: 5, windowMs: 60 * 60_000 },
  { prefix: '/api/user', limit: 20, windowMs: 10 * 60_000 },
  /**
   * Descadastro do digest: pública, sem sessão, e escreve no banco — então
   * merece limite. Mas o limite é ALTO, e isso é a decisão, não um descuido.
   *
   * O botão nativo do Gmail e do Outlook faz o POST a partir dos servidores
   * DELES, não do computador de quem clicou. Todos os descadastros de um
   * provedor chegam do mesmo punhado de IPs. Um limite apertado por IP
   * bloquearia justamente o caminho que a RFC 8058 existe para oferecer — e o
   * sintoma seria gente que tentou sair, não conseguiu, e marcou como spam.
   *
   * O que o limite protege é o banco contra repetição em massa. Contra
   * descadastro alheio quem protege é a assinatura do token, não isto.
   */
  { prefix: '/api/radar/unsubscribe', limit: 300, windowMs: 10 * 60_000 },
  /**
   * Painel administrativo.
   *
   * O limite não substitui a verificação de sessão — ela é feita rota a rota,
   * com `getAdminUser` — mas o `/api/admin` inteiro estava FORA do `matcher`,
   * então nem o login de administrador nem as rotas que gastam IA (`ai-test`,
   * `jobs/dedup`, `director`) tinham qualquer teto. Um 403 repetido milhares de
   * vezes por segundo ainda é uma consulta ao banco por tentativa.
   *
   * 120 por 10 minutos é folgado para uso humano do painel — ele carrega
   * várias rotas de uma vez ao abrir — e apertado para um laço automatizado.
   */
  { prefix: '/api/admin', limit: 120, windowMs: 10 * 60_000 },
  /**
   * Crons. Autenticados por `CRON_SECRET`, e agora fechados quando ele falta;
   * o limite existe para que uma tentativa de adivinhar o segredo custe tempo,
   * já que a Vercel chama estas rotas uma vez por dia cada.
   */
  { prefix: '/api/cron', limit: 20, windowMs: 10 * 60_000 },
]

function clientIp(req: NextRequest): string {
  return clientIpFrom(req.headers)
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

  // 1. Defesa em profundidade contra CSRF para todas as mutações de estado (POST, PUT, PATCH, DELETE)
  const isOriginAllowed = validateSameOrigin({
    method: req.method,
    pathname: path,
    origin: req.headers.get('origin'),
    host: req.headers.get('host') || req.nextUrl.host,
    secFetchSite: req.headers.get('sec-fetch-site'),
  })

  if (!isOriginAllowed) {
    return NextResponse.json(
      { error: 'Requisição cross-origin não autorizada.' },
      { status: 403 }
    )
  }

  // 2. Rate limiting por IP nas rotas sensíveis
  const rule = matchRule(path, RULES)
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
    '/api/checkout/:path*',
    '/api/analyses/:path*',
    '/api/user/:path*',
    // Entra por causa do descadastro, que é público. As outras rotas de
    // `/api/radar` passam a atravessar o middleware sem regra que case, o que
    // as deixa exatamente como estavam — `matchRule` devolve nada e a
    // requisição segue.
    '/api/radar/:path*',
    // Entraram junto com as regras acima: sem estar no matcher, uma regra
    // declarada em RULES nunca é consultada — o middleware simplesmente não
    // roda para o caminho.
    '/api/admin/:path*',
    '/api/cron/:path*',
  ],
}
