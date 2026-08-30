import type { Language } from '../i18n'
import type { OverallFit } from '../matching/compatibility'
import { safeHttpUrl } from '../safe-url'

/**
 * O conteúdo do e-mail do digest do Radar.
 *
 * Este módulo é puro de propósito: recebe o que vai ser dito e devolve assunto,
 * HTML e texto. Não lê banco, não envia nada, não consulta ambiente. É o que
 * permite testar o que a pessoa vai ler sem subir infraestrutura — e o que a
 * pessoa lê é a parte deste recurso que erra sem fazer barulho.
 *
 * ## O que este e-mail NÃO faz
 *
 * **Não inventa dado para a mensagem parecer completa (§43).** Vaga sem local
 * declarado sai sem linha de local; não vira "remoto", não vira "Brasil", não
 * vira "local não informado" com cara de campo preenchido. Vaga sem salário
 * não ganha faixa estimada.
 *
 * **Não mostra número nenhum.** Não existe "87% de compatibilidade" aqui,
 * porque não existe no produto: a compatibilidade é de três eixos e a nota
 * única seria uma invenção. O `signalScore` é sinal interno de ordenação e
 * nunca é exibido.
 *
 * **Não fala de contratação.** "Compatível com o seu perfil" é o que se pode
 * afirmar. "Você tem grandes chances" é o que não se pode.
 *
 * ## Por que tudo é escapado
 *
 * Título e empresa vêm de fonte externa — Greenhouse, Lever, Gupy, Adzuna — e
 * são texto que ninguém aqui escreveu. Interpolado cru num corpo HTML, um
 * título com `<` quebra a mensagem no melhor caso e injeta marcação no pior.
 * Toda interpolação passa por `escapeHtml`, sem exceção.
 */

export interface DigestOpportunity {
  title: string
  company: string
  /** Cidade/país já formatado. Ausente quando a vaga não declarou — e aí não sai linha. */
  location?: string | null
  overallFit: OverallFit
  /** A frase do matcher. Fala de compatibilidade, nunca de contratação. */
  headline: string
  /** Link para o Job Fit dentro do produto, não para a vaga na fonte. */
  url: string
}

export interface DigestInput {
  lang: Language
  /** Primeiro nome, quando existe. Sem ele o cumprimento é impessoal, não inventado. */
  firstName?: string | null
  opportunities: DigestOpportunity[]
  radarUrl: string
  unsubscribeUrl: string
}

export interface DigestContent {
  subject: string
  html: string
  text: string
}

interface Strings {
  subjectOne: string
  subjectMany: (n: number) => string
  greetingNamed: (name: string) => string
  greeting: string
  intro: (n: number) => string
  fit: Record<OverallFit, string>
  seeAll: string
  why: string
  unsubscribe: string
  unsubscribeNote: string
  signature: string
}

const STRINGS: Record<Language, Strings> = {
  pt: {
    subjectOne: 'O Radar encontrou uma oportunidade compatível com o seu perfil',
    subjectMany: (n) => `O Radar encontrou ${n} oportunidades compatíveis com o seu perfil`,
    greetingNamed: (name) => `Olá, ${name}.`,
    greeting: 'Olá.',
    intro: (n) =>
      n === 1
        ? 'Uma vaga apareceu desde o último aviso e é compatível com o que você declarou:'
        : `${n} vagas apareceram desde o último aviso e são compatíveis com o que você declarou:`,
    fit: {
      strong: 'Compatibilidade alta',
      good: 'Compatibilidade boa',
      partial: 'Compatibilidade parcial',
      weak: 'Compatibilidade baixa',
    },
    seeAll: 'Ver no Radar',
    why: 'Você recebe este aviso porque ativou o Radar do GriffoWork.',
    unsubscribe: 'Parar de receber',
    unsubscribeNote: 'Você continua com a conta e as análises; só o aviso por e-mail para.',
    signature: 'GriffoWork',
  },
  en: {
    subjectOne: 'Radar found an opportunity that matches your profile',
    subjectMany: (n) => `Radar found ${n} opportunities that match your profile`,
    greetingNamed: (name) => `Hello, ${name}.`,
    greeting: 'Hello.',
    intro: (n) =>
      n === 1
        ? 'One job has appeared since the last alert and matches what you declared:'
        : `${n} jobs have appeared since the last alert and match what you declared:`,
    fit: {
      strong: 'Strong match',
      good: 'Good match',
      partial: 'Partial match',
      weak: 'Weak match',
    },
    seeAll: 'Open in Radar',
    why: 'You are receiving this because you turned on GriffoWork Radar.',
    unsubscribe: 'Stop receiving these',
    unsubscribeNote: 'Your account and analyses stay as they are — only the email alerts stop.',
    signature: 'GriffoWork',
  },
  es: {
    subjectOne: 'El Radar encontró una oportunidad compatible con tu perfil',
    subjectMany: (n) => `El Radar encontró ${n} oportunidades compatibles con tu perfil`,
    greetingNamed: (name) => `Hola, ${name}.`,
    greeting: 'Hola.',
    intro: (n) =>
      n === 1
        ? 'Una vacante apareció desde el último aviso y es compatible con lo que declaraste:'
        : `${n} vacantes aparecieron desde el último aviso y son compatibles con lo que declaraste:`,
    fit: {
      strong: 'Compatibilidad alta',
      good: 'Compatibilidad buena',
      partial: 'Compatibilidad parcial',
      weak: 'Compatibilidad baja',
    },
    seeAll: 'Ver en el Radar',
    why: 'Recibes este aviso porque activaste el Radar de GriffoWork.',
    unsubscribe: 'Dejar de recibir',
    unsubscribeNote: 'Tu cuenta y tus análisis siguen igual; solo se detiene el aviso por correo.',
    signature: 'GriffoWork',
  },
  de: {
    subjectOne: 'Radar hat ein passendes Stellenangebot für Ihr Profil gefunden',
    subjectMany: (n) => `Radar hat ${n} passende Stellenangebote für Ihr Profil gefunden`,
    greetingNamed: (name) => `Hallo, ${name}.`,
    greeting: 'Hallo.',
    intro: (n) =>
      n === 1
        ? 'Ein neues Stellenangebot ist verfügbar, das zu Ihrem Profil passt:'
        : `${n} neue Stellenangebote sind verfügbar, die zu Ihrem Profil passen:`,
    fit: {
      strong: 'Sehr hohe Übereinstimmung',
      good: 'Gute Übereinstimmung',
      partial: 'Teilweise Übereinstimmung',
      weak: 'Geringe Übereinstimmung',
    },
    seeAll: 'Im Radar öffnen',
    why: 'Sie erhalten diese Benachrichtigung, weil Sie das GriffoWork Radar aktiviert haben.',
    unsubscribe: 'Abmelden',
    unsubscribeNote: 'Ihr Konto und Ihre Analysen bleiben bestehen — nur die E-Mail-Benachrichtigungen enden.',
    signature: 'GriffoWork',
  },
  fr: {
    subjectOne: 'Le Radar a trouvé une opportunité correspondant à votre profil',
    subjectMany: (n) => `Le Radar a trouvé ${n} opportunités correspondant à votre profil`,
    greetingNamed: (name) => `Bonjour, ${name}.`,
    greeting: 'Bonjour.',
    intro: (n) =>
      n === 1
        ? 'Une nouvelle offre d\'emploi correspond à vos critères depuis la dernière alerte :'
        : `${n} nouvelles offres d\'emploi correspondent à vos critères depuis la dernière alerte :`,
    fit: {
      strong: 'Forte correspondance',
      good: 'Bonne correspondance',
      partial: 'Correspondance partielle',
      weak: 'Faible correspondance',
    },
    seeAll: 'Ouvrir dans le Radar',
    why: 'Vous recevez cet e-mail car vous avez activé le Radar GriffoWork.',
    unsubscribe: 'Se désinscrire',
    unsubscribeNote: 'Votre compte et vos analyses restent intacts — seules les alertes par e-mail s\'arrêtent.',
    signature: 'GriffoWork',
  },
  it: {
    subjectOne: 'Il Radar ha trovato un\'opportunità compatibile con il tuo profilo',
    subjectMany: (n) => `Il Radar ha trovato ${n} opportunità compatibili con il tuo profilo`,
    greetingNamed: (name) => `Ciao, ${name}.`,
    greeting: 'Ciao.',
    intro: (n) =>
      n === 1
        ? 'Una nuova offerta di lavoro è compatibile con i tuoi criteri:'
        : `${n} nuove offerte di lavoro sono compatibili con i tuoi criteri:`,
    fit: {
      strong: 'Alta compatibilità',
      good: 'Buona compatibilità',
      partial: 'Compatibilità parziale',
      weak: 'Bassa compatibilità',
    },
    seeAll: 'Apri nel Radar',
    why: 'Ricevi questa e-mail perché hai attivato il Radar di GriffoWork.',
    unsubscribe: 'Disiscriviti',
    unsubscribeNote: 'Il tuo account e le tue analisi restano invariati — si interrompono solo le notifiche via e-mail.',
    signature: 'GriffoWork',
  },
  ja: {
    subjectOne: '求人レーダーがあなたのプロファイルに合致する新着求人を発見しました',
    subjectMany: (n) => `求人レーダーがあなたのプロファイルに合致する${n}件の新着求人を発見しました`,
    greetingNamed: (name) => `${name} 様`,
    greeting: 'こんにちは。',
    intro: (n) =>
      n === 1
        ? '前回の通知以降、条件に一致する新しい求人が1件見つかりました：'
        : `前回の通知以降、条件に一致する新しい求人が${n}件見つかりました：`,
    fit: {
      strong: '非常に高いマッチ度',
      good: '好相性',
      partial: '一部一致',
      weak: '低いマッチ度',
    },
    seeAll: '求人レーダーで確認',
    why: 'このメールはGriffoWork求人レーダーを設定されている方にお届けしています。',
    unsubscribe: 'メール配信を停止する',
    unsubscribeNote: 'アカウントや診断履歴は保持されます。メール配信のみ停止されます。',
    signature: 'GriffoWork',
  },
}

/**
 * O idioma da mensagem.
 *
 * `communicationLanguage` pode vir nulo (perfil antigo), com região (`pt-BR`)
 * ou com algo que o produto não fala. Nos casos suportados devolve o idioma correspondente,
 * com fallback para português.
 */
export function digestLanguage(declared: string | null | undefined): Language {
  const code = (declared || '').trim().toLowerCase().split(/[-_]/)[0] as Language
  const supported: Language[] = ['pt', 'en', 'es', 'de', 'fr', 'it', 'ja']
  if (supported.includes(code)) return code
  return 'pt'
}

/**
 * `href` seguro para o corpo do e-mail.
 *
 * `escapeHtml` sozinho NÃO cobre um atributo `href`: ele impede a saída do
 * atributo, mas `javascript:alert(1)` atravessa sem um caractere alterado e
 * continua sendo um esquema executável dentro de um `href` bem formado. Um link
 * assim é recusado pela maioria dos clientes de e-mail modernos, mas "a maioria"
 * não é uma garantia que valha a pena assinar, e o mesmo valor alimenta a versão
 * em texto puro, que a pessoa copia e cola no navegador.
 *
 * URL vazia ou de esquema recusado vira `#`: o cartão da vaga continua legível,
 * só não leva a lugar nenhum.
 */
function safeHref(value: string): string {
  return escapeHtml(safeHttpUrl(value) || '#')
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** O primeiro nome, quando o cadastro tem um. Nome vazio não vira cumprimento inventado. */
export function firstNameOf(name: string | null | undefined): string | null {
  const first = (name || '').trim().split(/\s+/)[0]
  return first || null
}

export function buildDigest(input: DigestInput): DigestContent {
  const s = STRINGS[input.lang] || STRINGS.pt
  const jobs = input.opportunities
  const n = jobs.length

  const subject = n === 1 ? s.subjectOne : s.subjectMany(n)
  const greeting = input.firstName ? s.greetingNamed(input.firstName) : s.greeting

  const htmlCards = jobs
    .map((job) => {
      // A linha de local só existe quando a vaga declarou um. Ver §43.
      const location = job.location?.trim()
      const locationLine = location
        ? `<div style="color:#52525b;font-size:14px;margin-top:2px">${escapeHtml(location)}</div>`
        : ''

      return [
        '<div style="border:1px solid #e4e4e7;border-radius:8px;padding:16px;margin-bottom:12px">',
        `<div style="font-size:16px;font-weight:600;color:#18181b">${escapeHtml(job.title)}</div>`,
        `<div style="color:#3f3f46;font-size:14px;margin-top:2px">${escapeHtml(job.company)}</div>`,
        locationLine,
        `<div style="color:#3f3f46;font-size:13px;margin-top:10px">${escapeHtml(s.fit[job.overallFit])} — ${escapeHtml(job.headline)}</div>`,
        `<div style="margin-top:12px"><a href="${safeHref(job.url)}" style="color:#1d4ed8;font-size:14px">${escapeHtml(s.seeAll)}</a></div>`,
        '</div>',
      ].join('')
    })
    .join('')

  const html = [
    '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b">',
    `<p style="font-size:16px;margin:0 0 4px">${escapeHtml(greeting)}</p>`,
    `<p style="font-size:15px;color:#3f3f46;margin:0 0 20px">${escapeHtml(s.intro(n))}</p>`,
    htmlCards,
    `<p style="margin:20px 0 0"><a href="${safeHref(input.radarUrl)}" style="color:#1d4ed8;font-size:15px">${escapeHtml(s.seeAll)}</a></p>`,
    '<hr style="border:none;border-top:1px solid #e4e4e7;margin:28px 0 16px">',
    `<p style="font-size:12px;color:#71717a;margin:0 0 6px">${escapeHtml(s.why)}</p>`,
    `<p style="font-size:12px;color:#71717a;margin:0">`,
    `<a href="${safeHref(input.unsubscribeUrl)}" style="color:#71717a">${escapeHtml(s.unsubscribe)}</a>`,
    ` — ${escapeHtml(s.unsubscribeNote)}`,
    '</p>',
    `<p style="font-size:12px;color:#a1a1aa;margin:16px 0 0">${escapeHtml(s.signature)}</p>`,
    '</div>',
  ].join('')

  const textCards = jobs
    .map((job) => {
      const lines = [`* ${job.title} — ${job.company}`]
      const location = job.location?.trim()
      if (location) lines.push(`  ${location}`)
      lines.push(`  ${s.fit[job.overallFit]} — ${job.headline}`)
      lines.push(`  ${job.url}`)
      return lines.join('\n')
    })
    .join('\n\n')

  // A versão em texto não é enfeite: cliente que não renderiza HTML mostra ela,
  // e mensagem só-HTML pontua pior nos filtros de spam.
  const text = [
    greeting,
    '',
    s.intro(n),
    '',
    textCards,
    '',
    `${s.seeAll}: ${input.radarUrl}`,
    '',
    '---',
    s.why,
    `${s.unsubscribe}: ${input.unsubscribeUrl}`,
    s.unsubscribeNote,
    '',
    s.signature,
  ].join('\n')

  return { subject, html, text }
}
