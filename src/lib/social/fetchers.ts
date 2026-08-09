import 'server-only'
import { fetchPublicUrl, assertPublicUrl } from '../url-guard'

/**
 * Busca real do conteúdo dos perfis profissionais.
 *
 * Até aqui a "análise de redes sociais" recebia apenas a URL como texto: o
 * modelo nunca abria nada. O conselho saía do currículo e da suposição sobre o
 * que costuma haver naquela plataforma — plausível, específico na aparência, e
 * sem qualquer relação com o perfil real da pessoa.
 *
 * As plataformas se dividem em três situações, e a diferença é honesta:
 *
 * - **GitHub** — API pública oficial. Dados estruturados e confiáveis.
 * - **Portfólio, Medium, Substack, Dev.to, Behance, Dribbble, Stack Overflow** —
 *   leitura via Jina Reader, o mesmo caminho já usado na importação de vagas.
 * - **Gupy** — páginas públicas são legíveis (a importação de vagas usa o mesmo
 *   caminho e funciona). O *perfil do candidato*, porém, fica dentro do portal
 *   da empresa, atrás de login: é tentada a leitura e, se não vier conteúdo,
 *   o usuário cola o texto.
 * - **LinkedIn** — bloqueia raspagem por terceiros e os termos de uso a
 *   proíbem. Não há caminho técnico legítimo: o usuário fornece o conteúdo,
 *   colando o texto ou subindo o PDF que o próprio LinkedIn gera em
 *   "Mais → Salvar como PDF".
 *
 * O que não pôde ser lido é reportado como não lido. Nada aqui inventa conteúdo
 * para preencher lacuna.
 */

export type SocialPlatform =
  | 'github'
  | 'linkedin'
  | 'gupy'
  | 'behance'
  | 'dribbble'
  | 'stackoverflow'
  | 'medium'
  | 'substack'
  | 'devto'
  | 'portfolio'

export type FetchStatus =
  /** Conteúdo real obtido. */
  | 'fetched'
  /** Plataforma que exige conteúdo fornecido pelo usuário. */
  | 'needs_user_input'
  /** Tentou e não conseguiu (bloqueio, fora do ar, perfil privado). */
  | 'failed'

export interface SocialProfileData {
  platform: SocialPlatform
  url: string
  status: FetchStatus
  /** Conteúdo real do perfil. Ausente quando `status` não é `fetched`. */
  content?: string
  /** Motivo apresentável ao usuário quando não deu para ler. */
  note?: string
}

/**
 * Plataformas que bloqueiam raspagem por design e cujos termos de uso a
 * proíbem. Nem tentamos: a requisição voltaria bloqueada e gastaria tempo.
 *
 * A Gupy NÃO está aqui. Páginas públicas dela são legíveis — a importação de
 * vagas (`job-fetch`) faz isso e funciona. O que fica fora de alcance é o
 * *perfil do candidato*, que vive dentro do portal da empresa
 * (`empresa.gupy.io`) atrás de login. Por isso a Gupy é tentada como qualquer
 * página pública, e só cai no caminho manual se a leitura não trouxer nada.
 */
const USER_SUPPLIED_PLATFORMS: SocialPlatform[] = ['linkedin']

const HOST_MAP: [RegExp, SocialPlatform][] = [
  [/(^|\.)github\.com$/i, 'github'],
  [/(^|\.)linkedin\.com$/i, 'linkedin'],
  [/(^|\.)gupy\.io$/i, 'gupy'],
  [/(^|\.)behance\.net$/i, 'behance'],
  [/(^|\.)dribbble\.com$/i, 'dribbble'],
  [/(^|\.)stackoverflow\.com$/i, 'stackoverflow'],
  [/(^|\.)medium\.com$/i, 'medium'],
  [/(^|\.)substack\.com$/i, 'substack'],
  [/(^|\.)dev\.to$/i, 'devto'],
]

export function detectPlatform(rawUrl: string): SocialPlatform {
  try {
    const host = new URL(normalizeUrl(rawUrl)).hostname.toLowerCase()
    for (const [pattern, platform] of HOST_MAP) {
      if (pattern.test(host)) return platform
    }
  } catch {
    // cai no padrão
  }
  return 'portfolio'
}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** Limite por perfil. Mantém o prompt dentro do orçamento de tokens. */
const MAX_CONTENT_CHARS = 4000
const FETCH_TIMEOUT_MS = 8000

// --- GitHub -----------------------------------------------------------------

function githubUsername(url: string): string | null {
  try {
    const path = new URL(normalizeUrl(url)).pathname.split('/').filter(Boolean)
    const candidate = path[0]
    if (!candidate) return null
    // Rotas do próprio site que não são usuários.
    if (['orgs', 'topics', 'sponsors', 'features', 'about'].includes(candidate.toLowerCase())) {
      return null
    }
    return candidate
  } catch {
    return null
  }
}

/**
 * Lê o perfil pela API pública do GitHub.
 *
 * Sem chave o limite é 60 requisições/hora por IP — suficiente na escala atual,
 * e o motivo de o resultado ser reportado como falha em vez de derrubar a rota
 * quando o limite estoura.
 */
async function fetchGithub(url: string): Promise<SocialProfileData> {
  const username = githubUsername(url)
  if (!username) {
    return { platform: 'github', url, status: 'failed', note: 'URL do GitHub sem nome de usuário reconhecível.' }
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'GriffoWork-ProfileAnalysis',
  }

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=10`, {
        headers,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }),
    ])

    if (userRes.status === 404) {
      return { platform: 'github', url, status: 'failed', note: 'Perfil não encontrado no GitHub.' }
    }
    if (!userRes.ok) {
      // Um 403 aqui pode ser limite de taxa ou qualquer outra recusa. O
      // cabeçalho `x-ratelimit-remaining` é o que distingue os dois — sem
      // conferi-lo, a mensagem seria um palpite apresentado como diagnóstico.
      const rateLimited =
        userRes.status === 403 && userRes.headers.get('x-ratelimit-remaining') === '0'
      return {
        platform: 'github',
        url,
        status: 'failed',
        note: rateLimited
          ? 'Limite de consultas do GitHub atingido. Tente novamente em alguns minutos.'
          : `O GitHub recusou a consulta (HTTP ${userRes.status}).`,
      }
    }

    const profile: any = await userRes.json()
    const repos: any[] = reposRes.ok ? await reposRes.json() : []

    const lines = [
      `Usuário: ${profile.login}`,
      profile.name ? `Nome: ${profile.name}` : null,
      profile.bio ? `Bio: ${profile.bio}` : 'Bio: (vazia)',
      profile.company ? `Empresa: ${profile.company}` : null,
      profile.location ? `Localização: ${profile.location}` : null,
      profile.blog ? `Site: ${profile.blog}` : null,
      `Repositórios públicos: ${profile.public_repos ?? 0}`,
      `Seguidores: ${profile.followers ?? 0}`,
      `Conta criada em: ${profile.created_at?.slice(0, 10) ?? 'desconhecido'}`,
      '',
      'Repositórios recentes (por último push):',
    ].filter(Boolean)

    if (repos.length === 0) {
      lines.push('(nenhum repositório público)')
    } else {
      for (const r of repos) {
        lines.push(
          `- ${r.name}${r.fork ? ' [fork]' : ''} — ${r.language || 'linguagem não definida'} — ` +
            `${r.stargazers_count || 0} estrelas — ${r.description ? r.description : 'sem descrição'}`
        )
      }
    }

    return {
      platform: 'github',
      url,
      status: 'fetched',
      content: lines.join('\n').slice(0, MAX_CONTENT_CHARS),
    }
  } catch (e: any) {
    return { platform: 'github', url, status: 'failed', note: `Falha ao consultar o GitHub: ${e?.message || 'erro de rede'}` }
  }
}

// --- Leitura genérica via Jina Reader ---------------------------------------

async function fetchViaReader(url: string, platform: SocialPlatform): Promise<SocialProfileData> {
  try {
    // Valida o destino antes de pedir a leitura: a URL vem do usuário.
    await assertPublicUrl(normalizeUrl(url))

    const res = await fetch(`https://r.jina.ai/${normalizeUrl(url)}`, {
      headers: { Accept: 'text/plain', 'User-Agent': 'GriffoWork-ProfileAnalysis' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    if (!res.ok) {
      return { platform, url, status: 'failed', note: `A página respondeu ${res.status}.` }
    }

    const text = (await res.text()).trim()
    if (text.length < 80) {
      return { platform, url, status: 'failed', note: 'A página não devolveu conteúdo legível.' }
    }

    return { platform, url, status: 'fetched', content: text.slice(0, MAX_CONTENT_CHARS) }
  } catch (e: any) {
    return { platform, url, status: 'failed', note: `Não foi possível ler a página: ${e?.message || 'erro de rede'}` }
  }
}

// --- Entrada pública ---------------------------------------------------------

export async function fetchSocialProfile(rawUrl: string): Promise<SocialProfileData> {
  const url = normalizeUrl(rawUrl)
  const platform = detectPlatform(url)

  if (USER_SUPPLIED_PLATFORMS.includes(platform)) {
    return {
      platform,
      url,
      status: 'needs_user_input',
      note:
        'O LinkedIn bloqueia leitura automática por terceiros e seus termos de uso a proíbem. ' +
        'Use "Mais → Salvar como PDF" no seu perfil e envie o arquivo, ou cole o texto do seu ' +
        '"Sobre" e headline.',
    }
  }

  if (platform === 'github') return fetchGithub(url)

  const result = await fetchViaReader(url, platform)

  // Perfil de candidato na Gupy fica atrás do login do portal da empresa, então
  // a leitura tende a devolver a página pública de vagas — ou nada. Quando não
  // trouxer conteúdo, o caminho manual é oferecido com o motivo correto, em vez
  // de reportar uma falha genérica de rede.
  if (platform === 'gupy' && result.status !== 'fetched') {
    return {
      platform,
      url,
      status: 'needs_user_input',
      note:
        'Não foi possível ler este endereço da Gupy. O perfil do candidato costuma ficar atrás do ' +
        'login do portal da empresa. Cole o texto do seu perfil para que ele seja analisado.',
    }
  }

  return result
}

/**
 * Busca todos os perfis em paralelo, com teto de concorrência implícito pelo
 * número de links. Nenhuma falha individual derruba as demais.
 */
export async function fetchAllProfiles(urls: string[]): Promise<SocialProfileData[]> {
  const unique = [...new Set(urls.map(normalizeUrl).filter(Boolean))]
  return Promise.all(unique.map((u) => fetchSocialProfile(u)))
}
