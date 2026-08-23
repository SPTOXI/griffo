import { z } from 'zod'
import { safeProfileUrl } from './safe-url'

/**
 * Esquemas de entrada compartilhados entre rotas.
 *
 * O que motivou o arquivo: `socialLinks` era declarado como
 * `z.record(z.string(), z.string())` em DOIS lugares — `/api/resume/upload` e
 * `/api/user/settings` — e essa forma não impõe limite nenhum. Nem de
 * quantidade de chaves, nem de tamanho de chave, nem de tamanho de valor, nem
 * de conteúdo. Um único POST podia gravar dezenas de milhares de entradas de
 * megabytes cada na coluna `User.socialLinks`, que é `String` sem tamanho.
 *
 * Duas definições iguais em arquivos diferentes divergem na primeira correção
 * que só um dos dois recebe. Uma definição só, importada nos dois, não.
 */

/** Teto de perfis. Doze cobre com folga toda rede que a tela oferece. */
export const MAX_SOCIAL_LINKS = 12
/** Nome da plataforma ("LinkedIn", "GitHub"). */
export const MAX_SOCIAL_PLATFORM_CHARS = 40
/** URL do perfil. 300 caracteres é mais que qualquer URL de perfil real. */
export const MAX_SOCIAL_URL_CHARS = 300

/**
 * Links de perfil declarados pelo usuário: `{ "LinkedIn": "linkedin.com/in/x" }`.
 *
 * O valor aceita a forma abreviada, sem `https://`, porque é assim que a tela
 * pede e é assim que as pessoas digitam — `normalizeUrl`, em
 * `lib/social/fetchers.ts`, completa o esquema depois. O que NÃO passa é um
 * esquema escrito por extenso que não seja http ou https: `javascript:` e
 * `data:` são recusados aqui, na entrada, e não em cada tela que exibir o
 * valor mais tarde.
 */
export const socialLinksSchema = z
  .record(
    z.string().trim().min(1).max(MAX_SOCIAL_PLATFORM_CHARS),
    z.string().trim().max(MAX_SOCIAL_URL_CHARS)
  )
  .refine(
    (value) => Object.keys(value).length <= MAX_SOCIAL_LINKS,
    `Informe no máximo ${MAX_SOCIAL_LINKS} perfis.`
  )
  .refine(
    (value) => Object.values(value).every((url) => !url || safeProfileUrl(url) !== null),
    'Um dos links de perfil não é um endereço http/https válido.'
  )
  // Entrada em branco é descartada em vez de gravada: um campo que a pessoa
  // abriu e não preencheu não deve virar um perfil vazio no banco.
  .transform((value) =>
    Object.fromEntries(Object.entries(value).filter(([, url]) => url.trim() !== ''))
  )

/**
 * Teto do texto do currículo, em caracteres.
 *
 * Não havia nenhum. `checkResumeContent` só conferia o MÍNIMO, e
 * `cleanAndOptimizeTextForAi` normaliza sem truncar — então o corpo da
 * requisição ia inteiro para `Resume.originalContent`, que é `String` sem
 * limite no Postgres.
 *
 * 200 mil caracteres são cerca de 60 páginas de currículo: um teto que nenhum
 * currículo real encosta e que fecha a porta de usar a conta como depósito.
 * A análise já recorta em 15 mil (`lib/analysis/job.ts`), então este número não
 * muda nem o resultado nem o custo de IA — muda o que a conta consegue gravar.
 */
export const MAX_RESUME_CHARS = 200_000

/** Cargo alvo: uma linha. */
export const MAX_TARGET_JOB_CHARS = 200

/** Descrição da vaga alvo colada pelo usuário. */
export const MAX_JOB_DESCRIPTION_CHARS = 30_000
