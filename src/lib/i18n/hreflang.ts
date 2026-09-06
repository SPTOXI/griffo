import { LANGUAGES, localeForLang, type Language } from './index'

/**
 * A rota de país que representa cada idioma no `hreflang` da raiz.
 *
 * ## Por que este mapa é literal, e não derivado
 *
 * Os outros blocos de idioma do projeto (`sitemap.ts`, `/hiring`, `/ats`)
 * saem de `LANGUAGES` porque a URL É o idioma: `?lang=de` e pronto. Aqui não.
 * A raiz aponta para ROTAS DE PAÍS, e escolher qual país representa um idioma
 * é decisão editorial, não derivação: o alemão poderia ser `/de` ou `/at`, o
 * português `/br` ou `/pt`, o espanhol `/es` ou `/mx`. Derivar isso seria
 * inventar a decisão em vez de registrá-la.
 *
 * O que NÃO pode ficar por conta da disciplina é a completude do mapa — e era
 * exatamente isso que estava frouxo. O bloco vivia inline no `layout.tsx`, sem
 * nenhum teste: um 13º idioma entraria em `LANGUAGES`, passaria no
 * `i18n.test.ts`, ganharia `/ats` e `/hiring` funcionando, e sumiria calado
 * daqui. Como o Google descarta o bloco INTEIRO de hreflang quando ele não
 * fecha (§2.69, que já custou "nenhuma página indexada" a este projeto), o
 * dano de um idioma faltando não é perder um idioma — é perder os doze.
 *
 * `hreflang.test.ts` cobra a completude e a coerência: todo idioma tem rota,
 * toda rota é pré-gerada por SSG, e toda rota serve de fato o idioma que
 * declara representar.
 */
export const HREFLANG_COUNTRY_ROUTE: Record<Language, string> = {
  pt: 'br',
  en: 'us',
  es: 'es',
  de: 'de',
  fr: 'fr',
  it: 'it',
  ja: 'jp',
  nl: 'nl',
  sv: 'se',
  zh: 'cn',
  ar: 'ae',
  ko: 'kr',
}

const BASE = 'https://griffo.work'

/**
 * O bloco `alternates.languages` da raiz, incluindo o `x-default`.
 *
 * `x-default` aponta para `/global` — a página sem preço nem ATS de país
 * específico — e não para a raiz em português: é o destino certo para tráfego
 * que não casa com nenhum idioma declarado.
 */
export function rootHreflang(): Record<string, string> {
  return {
    ...Object.fromEntries(
      LANGUAGES.map((l) => [localeForLang(l), `${BASE}/${HREFLANG_COUNTRY_ROUTE[l]}`])
    ),
    'x-default': `${BASE}/global`,
  }
}

/** Os locales que o site declara falar, para o `inLanguage` do JSON-LD. */
export function declaredLocales(): string[] {
  return LANGUAGES.map(localeForLang)
}
