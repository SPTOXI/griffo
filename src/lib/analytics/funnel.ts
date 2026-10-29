/**
 * Eventos do funil — a lista única que o painel e as rotas compartilham.
 *
 * Divididos em dois grupos por um motivo de confiança:
 *
 * - `CLIENT_EVENTS` podem ser enviados pelo navegador para `/api/analytics/track`.
 *   São sinais de atenção (viu a página, viu o preço), baratos de forjar e sem
 *   consequência se forjados.
 * - `SERVER_EVENTS` só são gravados pelo próprio servidor, no momento em que a
 *   coisa acontece (cadastro, upload, prévia, compra). A rota pública os
 *   recusa: um funil em que o navegador pode declarar "comprei" não serve para
 *   decidir preço.
 */

export const CLIENT_EVENTS = [
  'page_view',
  'upsell_viewed',
  'pricing_viewed',
  'ats_check_shared',
  // Clique em "ver todas as oportunidades" no resultado do envio da landing.
  'lead_unlock_clicked',
  // Envio da landing que falhou antes de virar lead: o servidor não vê esses
  // casos (leitura do arquivo no aparelho, rede, bloqueio antes da rota).
  'lead_submit_failed',
  // Clique na chamada "veja a nota do seu currículo" de uma vaga do mapa de vagas.
  'jobs_map_cta_clicked',
  // Clique na chamada do mapa da home ("envie seu currículo..."), que leva ao envio.
  'home_map_cta_clicked',
  // Abriu o criador de currículo da home (§2.160). O envio dele é o
  // `lead_submitted` do servidor, com `builder: true` em `meta`.
  'builder_opened',
  // Mantido por compatibilidade: versões antigas da tela ainda o enviam.
  'checkout_initiated',
] as const

export const SERVER_EVENTS = [
  'ats_check_done',
  // Tentativa de robô: conta para a cota do teste, mas fica fora do funil.
  'ats_check_bot',
  // Envio do currículo no topo da landing (§2.132), sem conta. É também a
  // cota: um por pessoa a cada 24h, contado aqui como o `ats_check_done`.
  'lead_submitted',
  'lead_bot',
  // O resultado ficou pronto com ao menos uma oportunidade para mostrar.
  'lead_matched',
  // E-mails do envio sem conta: o de resultado e os 3 da sequência. `meta.step`
  // é `result`, `nurture1`, `nurture2` ou `nurture3`. O clique passa por
  // `/api/public/lead-click`, que grava e redireciona — por isso é do servidor.
  'lead_email_sent',
  'lead_email_clicked',
  'signup_done',
  'cv_uploaded',
  'preview_viewed',
  'purchase_done',
] as const

export type ClientEvent = (typeof CLIENT_EVENTS)[number]
export type ServerEvent = (typeof SERVER_EVENTS)[number]
export type FunnelEvent = ClientEvent | ServerEvent

/** Ordem do funil, do topo ao fundo, como o painel mostra. */
export const FUNNEL_STEPS = [
  { event: 'page_view', label: 'Visitantes' },
  { event: 'lead_submitted', label: 'Currículos na landing' },
  { event: 'lead_matched', label: 'Com oportunidade encontrada' },
  { event: 'lead_email_clicked', label: 'Voltaram por um e-mail' },
  { event: 'lead_unlock_clicked', label: 'Quiseram ver todas' },
  { event: 'ats_check_done', label: 'Teste ATS grátis' },
  { event: 'signup_done', label: 'Cadastros' },
  { event: 'cv_uploaded', label: 'Currículos enviados' },
  { event: 'preview_viewed', label: 'Prévias vistas' },
  { event: 'pricing_viewed', label: 'Viram o preço' },
  { event: 'checkout_initiated', label: 'Checkouts' },
  { event: 'purchase_done', label: 'Compras' },
] as const satisfies ReadonlyArray<{ event: FunnelEvent; label: string }>

/**
 * Robôs conhecidos e pré-visualizadores de link.
 *
 * Em set/2026 a maior parte das "visitas" vinha de Instagram/Facebook com uma
 * página só — o padrão do robô que gera a miniatura do link. Contá-las como
 * gente inflava o topo do funil e escondia a conversão real.
 */
const BOT_PATTERN =
  /bot\b|crawler|spider|crawling|facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|twitterbot|embedly|preview|headless|lighthouse|pagespeed|gtmetrix|python-requests|curl\/|wget|axios\/|node-fetch|go-http-client|okhttp|java\//i

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  const ua = (userAgent || '').trim()
  if (!ua) return true
  return BOT_PATTERN.test(ua)
}

export interface FunnelRow {
  event: string
  userId: string | null
  visitorId: string | null
}

export interface FunnelStepSummary {
  event: FunnelEvent
  label: string
  people: number
  /** % em relação ao passo anterior com gente (null no primeiro). */
  fromPrevious: number | null
}

/**
 * Pessoas distintas por passo — conta a pessoa, não o clique. A chave é o
 * usuário quando existe, senão o visitante anônimo; linhas sem nenhum dos
 * dois contam uma vez cada (eventos antigos de checkout).
 */
export function summarizeFunnel(rows: FunnelRow[]): FunnelStepSummary[] {
  const byEvent = new Map<string, Set<string>>()
  rows.forEach((r, i) => {
    const key = r.userId ? `u:${r.userId}` : r.visitorId ? `v:${r.visitorId}` : `row:${i}`
    if (!byEvent.has(r.event)) byEvent.set(r.event, new Set())
    byEvent.get(r.event)!.add(key)
  })
  let previous: number | null = null
  return FUNNEL_STEPS.map((step) => {
    const people = byEvent.get(step.event)?.size ?? 0
    const fromPrevious = previous === null ? null : previous > 0 ? Math.round((people / previous) * 1000) / 10 : 0
    if (people > 0 || previous === null) previous = people
    return { event: step.event, label: step.label, people, fromPrevious }
  })
}
