'use client'

import { useEffect } from 'react'
import { dirForLang, localeForLang, type Language } from '@/lib/i18n'

/**
 * Sincroniza `<html lang>` e `<html dir>` com o idioma que a tela REALMENTE
 * está mostrando.
 *
 * ## Por que isto existe
 *
 * `app/layout.tsx` declara `<html lang="pt-BR">` fixo, e o layout raiz é
 * estático e compartilhado por todas as rotas — ele não tem como saber qual
 * idioma esta requisição serve. O resultado era o site inteiro afirmando ser
 * português: `/de` servindo "Ihre …", `/jp` servindo "あなたの…" e `/ae`
 * servindo "إنّ …", todos com `lang="pt-BR"`, contradizendo o bloco de
 * `hreflang` declarado 20 linhas acima no mesmo arquivo.
 *
 * Fazer o layout ler `headers()` resolveria no HTML servido, mas tornaria
 * TODAS as rotas dinâmicas e derrubaria o SSG das 41 páginas de país. A troca
 * escolhida foi consciente: o atributo passa a ficar certo no navegador (que é
 * onde o leitor de tela decide a pronúncia), e o sinal para o rastreador
 * continua vindo do `hreflang` e do conteúdo, que já estão corretos — o Google
 * documenta que usa esses dois, e não o atributo `lang`, para detectar idioma.
 *
 * ## Por que recebe o idioma por prop, e não do contexto
 *
 * Em rota de país o idioma do contexto e o da tela DIVERGEM de propósito:
 * `landing.tsx` resolve `langManuallySet ? contextLang : forcedLang`, então em
 * `/de` o contexto pode dizer `pt` (palpite de geo-IP) enquanto a página
 * desenha alemão. Ler o contexto aqui declararia o idioma errado exatamente
 * nas rotas que este componente existe para consertar. Quem chama já resolveu
 * a questão e passa o resultado.
 *
 * Não renderiza nada.
 */
export function DocumentLanguage({ lang }: { lang: Language }) {
  useEffect(() => {
    const el = document.documentElement
    el.lang = localeForLang(lang)
    el.dir = dirForLang(lang)
  }, [lang])

  return null
}
