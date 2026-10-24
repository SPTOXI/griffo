/**
 * Qual ATS recebe a candidatura, pelo endereço do link da vaga.
 *
 * Usado nas páginas de vagas por cidade para ligar cada vaga ao guia do ATS
 * (`/ats/[slug]`): quem vai se candidatar numa vaga da Gupy quer saber como a
 * Gupy lê o currículo. Só reconhece pelo domínio do próprio fornecedor; link
 * de site de carreira próprio, agregador ou encurtador fica sem guia (`null`),
 * em vez de chutar.
 */
const HOSTS: [RegExp, string][] = [
  [/(^|\.)gupy\.io$/, 'gupy'],
  [/(^|\.)myworkdayjobs\.com$|(^|\.)myworkdaysite\.com$|(^|\.)workday\.com$/, 'workday'],
  [/(^|\.)greenhouse\.io$/, 'greenhouse'],
  [/(^|\.)lever\.co$/, 'lever'],
  [/(^|\.)taleo\.net$/, 'taleo'],
  [/(^|\.)solides\.jobs$|(^|\.)vagas\.solides\.com\.br$/, 'solides'],
  [/(^|\.)icims\.com$/, 'icims'],
  [/(^|\.)ashbyhq\.com$/, 'ashby'],
  [/(^|\.)infojobs\.(net|com\.br|it)$/, 'infojobs'],
  [/(^|\.)jobs\.personio\.(de|com)$/, 'personio'],
  [/(^|\.)smartrecruiters\.com$/, 'smartrecruiters'],
  [/(^|\.)successfactors\.(com|eu)$|(^|\.)sapsf\.(com|eu)$/, 'successfactors'],
  [/(^|\.)workable\.com$/, 'workable'],
  [/(^|\.)teamtailor\.com$/, 'teamtailor'],
  [/(^|\.)oraclecloud\.com$/, 'oraclerecruiting'],
  [/(^|\.)bamboohr\.com$/, 'bamboohr'],
  [/(^|\.)jobvite\.com$/, 'jobvite'],
  [/(^|\.)recruitee\.com$/, 'recruitee'],
  [/(^|\.)breezy\.hr$/, 'breezyhr'],
  [/(^|\.)softgarden\.(io|de)$/, 'softgarden'],
  [/(^|\.)join\.com$/, 'join'],
  [/(^|\.)rexx-systems\.com$/, 'rexx'],
  [/(^|\.)zohorecruit\.(com|eu|in)$/, 'zohorecruit'],
  [/(^|\.)applytojob\.com$/, 'jazzhr'],
  [/(^|\.)bullhornstaffing\.com$/, 'bullhorn'],
]

export function atsFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
  for (const [re, slug] of HOSTS) if (re.test(host)) return slug
  return null
}
