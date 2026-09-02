/**
 * Nome de país e período no idioma da tela.
 *
 * Estava dentro de `components/app/hiring-index-card.tsx` como duas funções
 * privadas. Saiu para cá quando o mapa público (§2.55) passou a precisar
 * exatamente das mesmas duas: copiá-las garantiria que um dia o cartão do laudo
 * e o mapa escrevessem "2026 Q2" e "T2 2026" para o mesmo trimestre.
 *
 * Sem `server-only`, de propósito: quem chama são componentes de cliente.
 */

import { localeForLang, type Language } from '@/lib/i18n'

/**
 * Nome do país no idioma ativo.
 *
 * `Intl.DisplayNames`, e não uma tabela própria: a única tabela de países do
 * projeto (`lib/market/countries.ts`) está em português por ser lista de um
 * formulário, e usá-la aqui colocaria português dentro das outras 11 telas. O
 * recuo é o próprio código ISO, que é o que se guarda de qualquer forma.
 */
export function displayCountry(code: string, lang: string): string {
  try {
    const names = new Intl.DisplayNames([localeForLang(lang as Language)], { type: 'region' })
    return names.of(code) ?? code
  } catch {
    return code
  }
}

/** Mês ou trimestre, no calendário do idioma ativo. */
export function formatPeriod(iso: string, periodType: string | null, lang: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return iso

  const locale = localeForLang(lang as Language)
  try {
    if (periodType === 'quarter') {
      const quarter = Math.floor(date.getUTCMonth() / 3) + 1
      return `${date.getUTCFullYear()} Q${quarter}`
    }
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(date)
  } catch {
    return iso.slice(0, 7)
  }
}

/** Data cheia (a da coleta), no calendário do idioma ativo. */
export function formatDate(iso: string, lang: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return iso
  try {
    return new Intl.DateTimeFormat(localeForLang(lang as Language), {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(date)
  } catch {
    return iso.slice(0, 10)
  }
}
