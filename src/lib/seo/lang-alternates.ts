/**
 * Canonical + hreflang das páginas cujo idioma vem de `?lang=`.
 *
 * O defeito que isto fecha: essas páginas declaravam o canonical SEMPRE sem
 * parâmetro (`/ats/taleo`), mas o hreflang apontava para `/ats/taleo?lang=de`.
 * Então a variante alemã dizia "minha versão preferida é a inglesa" e, ao mesmo
 * tempo, "eu sou a versão alemã" — contradição que faz o Google ignorar o
 * hreflang e tratar `?lang=de` como duplicata. O Search Console de
 * 2026-10-07 mostra a consequência: as variantes `?lang=` aparecem com
 * impressão, mas o conteúdo em cada idioma não consegue ranquear como tal.
 *
 * Regra: `?lang=` explícito e válido → canonical autorreferente
 * (`?lang=de`); sem parâmetro (ou parâmetro inválido) → canonical limpo, que
 * também é o `x-default`. O hreflang lista cada idioma apontando para o seu
 * próprio `?lang=`, então fecha de volta em si mesmo.
 */
export function langCanonical(
  base: string,
  requested: string | undefined,
  available: readonly string[]
): string {
  const v = requested?.toLowerCase().trim()
  return v && available.includes(v) ? `${base}?lang=${v}` : base
}

export function langAlternates(
  base: string,
  requested: string | undefined,
  available: readonly string[],
  localeFor: (lang: never) => string
): { canonical: string; languages: Record<string, string> } {
  const toLocale = localeFor as unknown as (lang: string) => string
  return {
    canonical: langCanonical(base, requested, available),
    languages: {
      ...Object.fromEntries(available.map((l) => [toLocale(l), `${base}?lang=${l}`])),
      'x-default': base,
    },
  }
}
