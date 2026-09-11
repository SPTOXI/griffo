import { cookies, headers } from 'next/headers'
import { LANGUAGES, detectLanguageFromCountry, type Language } from './index'

/**
 * Mesma ordem de resolução de `/market-pulse` (página sem país na URL):
 * `?lang=` explícito → cookie `griffo_lang` → país da borda → inglês.
 * O recuo é inglês, não `detectLanguageFromCountry()` vazio (que devolve
 * 'pt') — sem nenhum sinal, o padrão certo é o mesmo `x-default` do
 * `layout.tsx` raiz, que é a página global em inglês.
 *
 * Extraído para cá porque `/enterprise` precisa da mesma lógica em mais de
 * uma rota (landing + páginas-pilar da Fase 1) — duplicar de novo repetiria
 * o mesmo texto pela terceira vez.
 */
export async function resolveRequestLanguage(
  searchParams: Promise<{ lang?: string }>
): Promise<Language> {
  const { lang } = await searchParams
  const requested = lang?.toLowerCase().trim()
  if (requested && (LANGUAGES as string[]).includes(requested)) return requested as Language

  const jar = await cookies()
  const chosen = jar.get('griffo_lang')?.value?.toLowerCase().trim()
  if (chosen && (LANGUAGES as string[]).includes(chosen)) return chosen as Language

  const h = await headers()
  const country = (h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || '').trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(country)) return detectLanguageFromCountry(country)

  return 'en'
}
