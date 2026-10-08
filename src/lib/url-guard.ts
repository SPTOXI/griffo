import 'server-only'
import { isIP } from 'net'
import { lookup } from 'dns/promises'
import { lookup as lookupCallback, type LookupAddress } from 'dns'
import http from 'http'
import https from 'https'
import { Readable } from 'stream'

/**
 * Defesa contra SSRF para as duas rotas que buscam URLs fornecidas por
 * usuários: a importação de vagas de emprego (`job-fetch`) e o webhook de
 * alerta do agente de diagnóstico.
 *
 * A verificação anterior comparava o *texto* do hostname contra uma lista de
 * prefixos (`10.`, `192.168.`, …). Isso deixava passar, entre outros:
 *
 *   - nomes públicos que resolvem para IP interno (`internal.exemplo.com`)
 *   - notação decimal e hexadecimal (`http://2130706433/` = 127.0.0.1)
 *   - IPv6 fora da forma exata `::1` (`http://[::ffff:127.0.0.1]/`)
 *   - o serviço de metadados da nuvem via redirecionamento — o `fetch` seguia
 *     redirects automaticamente e nenhum salto era revalidado
 *
 * Aqui o hostname é resolvido por DNS e **todos** os endereços retornados são
 * conferidos contra as faixas reservadas, e cada salto de redirecionamento
 * passa pela mesma checagem.
 *
 * Limite conhecido: entre a resolução e a conexão existe uma janela de DNS
 * rebinding, porque o `fetch` do Node resolve o nome de novo por conta
 * própria. Fechá-la exigiria conectar pelo IP já validado com o header `Host`
 * preservado — trabalho para quando houver motivo. O que está aqui elimina a
 * exploração trivial.
 */

const MAX_REDIRECTS = 3

const BLOCKED_HOST_SUFFIXES = ['.local', '.internal', '.localdomain', '.home.arpa']
const BLOCKED_HOSTNAMES = ['localhost', 'metadata.google.internal']

/** Portas permitidas. Sem isso a rota vira um scanner de portas da rede interna. */
const ALLOWED_PORTS = new Set(['', '80', '443'])

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BlockedUrlError'
  }
}

function ipv4IsReserved(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p))
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true // não deveria acontecer; na dúvida, bloqueia
  }
  const [a, b] = parts

  if (a === 0) return true // "este" host
  if (a === 10) return true // privada
  if (a === 127) return true // loopback
  if (a === 169 && b === 254) return true // link-local (inclui metadados 169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true // privada
  if (a === 192 && b === 168) return true // privada
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
  if (a === 192 && b === 0) return true // IETF (192.0.0/24 e 192.0.2/24)
  if (a === 198 && (b === 18 || b === 19)) return true // benchmarking
  if (a === 198 && b === 51) return true // documentação
  if (a === 203 && b === 0) return true // documentação
  if (a >= 224) return true // multicast (224/4) e reservada (240/4), inclui broadcast

  return false
}

/**
 * Expande um IPv6 nos seus 8 grupos de 16 bits, resolvendo a compressão `::`
 * e a cauda em notação decimal (`::ffff:1.2.3.4`). Devolve `null` se não for
 * um IPv6 reconhecível.
 */
function expandIpv6(ip: string): number[] | null {
  let text = ip.toLowerCase().replace(/^\[|\]$/g, '')
  if (text.includes('%')) text = text.slice(0, text.indexOf('%')) // zona (fe80::1%eth0)

  // Cauda IPv4 embutida: converte em dois grupos de 16 bits.
  const tail = text.match(/(?:^|:)((?:\d{1,3}\.){3}\d{1,3})$/)
  if (tail) {
    const octets = tail[1].split('.').map(Number)
    if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
    const hex = [
      ((octets[0] << 8) | octets[1]).toString(16),
      ((octets[2] << 8) | octets[3]).toString(16),
    ].join(':')
    text = text.slice(0, text.length - tail[1].length) + hex
  }

  const halves = text.split('::')
  if (halves.length > 2) return null

  const parseGroups = (part: string) =>
    part ? part.split(':').filter((g) => g !== '').map((g) => parseInt(g, 16)) : []

  const head = parseGroups(halves[0])
  const rear = halves.length === 2 ? parseGroups(halves[1]) : []

  if ([...head, ...rear].some((n) => !Number.isInteger(n) || n < 0 || n > 0xffff)) return null

  if (halves.length === 1) return head.length === 8 ? head : null

  const missing = 8 - head.length - rear.length
  if (missing < 0) return null
  return [...head, ...Array(missing).fill(0), ...rear]
}

function ipv6IsReserved(ip: string): boolean {
  const groups = expandIpv6(ip)
  if (!groups) return true // não decodificou: na dúvida, bloqueia

  const isZero = (from: number, to: number) => groups.slice(from, to).every((g) => g === 0)

  // Endereços que carregam um IPv4 dentro: a checagem tem de recair sobre ele,
  // ou `::ffff:127.0.0.1` passa como público. O parser de URL normaliza essa
  // forma para `::ffff:7f00:1`, então comparar o texto não funciona — é
  // preciso olhar os 32 bits finais.
  const embeddedIpv4 = () =>
    [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join('.')

  if (isZero(0, 5) && groups[5] === 0xffff) return ipv4IsReserved(embeddedIpv4()) // ::ffff:0:0/96
  if (isZero(0, 6)) return true // :: , ::1 e ::x.y.z.w (IPv4-compatível, obsoleto)
  if (groups[0] === 0x0064 && groups[1] === 0xff9b) return ipv4IsReserved(embeddedIpv4()) // NAT64 64:ff9b::/96

  if ((groups[0] & 0xfe00) === 0xfc00) return true // unique local fc00::/7
  if ((groups[0] & 0xffc0) === 0xfe80) return true // link-local fe80::/10
  if ((groups[0] & 0xff00) === 0xff00) return true // multicast ff00::/8
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) return true // documentação 2001:db8::/32

  return false
}

function addressIsReserved(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) return ipv4IsReserved(ip)
  if (version === 6) return ipv6IsReserved(ip)
  return true // não é um IP reconhecível: bloqueia
}

/**
 * Valida que a URL aponta para um destino público. Lança `BlockedUrlError`
 * com uma mensagem apresentável ao usuário quando não aponta.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new BlockedUrlError('URL inválida.')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BlockedUrlError('Apenas endereços http e https são aceitos.')
  }

  if (!ALLOWED_PORTS.has(parsed.port)) {
    throw new BlockedUrlError('Porta não permitida. Utilize apenas as portas padrão (80 ou 443).')
  }

  // Credenciais embutidas (http://user:senha@host) servem sobretudo para
  // confundir a leitura de qual é o host real.
  if (parsed.username || parsed.password) {
    throw new BlockedUrlError('URL não permitida: remova as credenciais do endereço.')
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')

  if (!hostname) {
    throw new BlockedUrlError('URL inválida.')
  }
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new BlockedUrlError('URL não permitida. Utilize apenas endereços públicos.')
  }
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new BlockedUrlError('URL não permitida. Utilize apenas endereços públicos.')
  }

  // Literal de IP: confere direto, sem consultar DNS.
  if (isIP(hostname)) {
    if (addressIsReserved(hostname)) {
      throw new BlockedUrlError('URL não permitida. Utilize apenas endereços públicos.')
    }
    return parsed
  }

  // Nome: resolve e confere todos os endereços. Cobre também as notações
  // numéricas (decimal, octal, hexadecimal), que o resolvedor normaliza.
  let addresses: { address: string }[]
  try {
    addresses = await lookup(hostname, { all: true })
  } catch {
    throw new BlockedUrlError('Não foi possível resolver o endereço informado.')
  }

  if (addresses.length === 0) {
    throw new BlockedUrlError('Não foi possível resolver o endereço informado.')
  }
  if (addresses.some((a) => addressIsReserved(a.address))) {
    throw new BlockedUrlError('URL não permitida. Utilize apenas endereços públicos.')
  }

  return parsed
}

/**
 * `fetch` que valida o destino a cada salto.
 *
 * O `fetch` padrão segue redirecionamentos sozinho, então validar só a URL
 * inicial não protege nada: basta um destino público responder 302 apontando
 * para `169.254.169.254`. Aqui os redirecionamentos são manuais e cada
 * `Location` volta para `assertPublicUrl`.
 */
export async function fetchPublicUrl(
  rawUrl: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 10000, ...rest } = init
  let currentUrl = (await assertPublicUrl(rawUrl)).toString()

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await pinnedFetch(currentUrl, rest, timeoutMs)

    if (res.status < 300 || res.status >= 400) return res

    const location = res.headers.get('location')
    if (!location) return res
    await res.body?.cancel().catch(() => {})

    const next = new URL(location, currentUrl)
    currentUrl = (await assertPublicUrl(next.toString())).toString()
  }

  throw new BlockedUrlError('Excesso de redirecionamentos.')
}

/**
 * O `lookup` que a conexão usa, conferindo de novo cada endereço resolvido.
 *
 * `assertPublicUrl` resolve o nome uma vez e o `fetch` resolveria de novo ao
 * conectar: um DNS de TTL curto responde um IP público na checagem e
 * `169.254.169.254` na conexão (DNS rebinding). Aqui a conexão só segue com
 * endereços que passam pela mesma regra, na mesma resolução que ela usa.
 */
export function guardedLookup(
  hostname: string,
  options: object,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void
): void {
  lookupCallback(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, [])
    const list = addresses as LookupAddress[]
    if (list.length === 0 || list.some((a) => addressIsReserved(a.address))) {
      return callback(new BlockedUrlError('URL não permitida. Utilize apenas endereços públicos.'), [])
    }
    if ((options as { all?: boolean }).all) return callback(null, list)
    callback(null, list[0].address, list[0].family)
  })
}

async function pinnedFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const target = new URL(url)
  const client = target.protocol === 'https:' ? https : http
  // `http.request` não descomprime como o `fetch`: pede o corpo sem compressão.
  const headers = { ...Object.fromEntries(new Headers(init.headers).entries()), 'accept-encoding': 'identity' }
  const body = init.body == null ? undefined : typeof init.body === 'string' ? init.body : String(init.body)

  return new Promise<Response>((resolve, reject) => {
    const req = client.request(
      target,
      { method: init.method || 'GET', headers, lookup: guardedLookup, timeout: timeoutMs },
      (res) => {
        const responseHeaders = new Headers()
        for (const [key, value] of Object.entries(res.headers)) {
          if (Array.isArray(value)) value.forEach((v) => responseHeaders.append(key, v))
          else if (value != null) responseHeaders.set(key, String(value))
        }
        const status = res.statusCode || 500
        const noBody = status === 204 || status === 304 || (init.method || 'GET').toUpperCase() === 'HEAD'
        resolve(
          new Response(noBody ? null : (Readable.toWeb(res) as unknown as ReadableStream<Uint8Array>), {
            status,
            statusText: res.statusMessage,
            headers: responseHeaders,
          })
        )
      }
    )
    req.on('timeout', () => req.destroy(new Error('Tempo esgotado.')))
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}
