'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Globe2 } from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'
import { PHASES, type HiringAtlas } from '@/lib/hiring-index/atlas'
import { PHASE_FILL } from '@/lib/hiring-index/map-model'
import type { HiringPhase } from '@/lib/hiring-index/phase'
import type { TranslationDictionary } from '@/lib/i18n'

/**
 * Versão leve do Índice GriffoWork para a home — não o mapa inteiro.
 *
 * ## Por que não é o mapa completo aqui
 *
 * A home precisa carregar rápido e converter pro CTA principal (analisar
 * currículo). O mapa interativo de `/market-pulse` (98 formas de SVG, tabela de
 * 98 linhas) compete por atenção e peso sem ganho proporcional numa seção que é
 * só um chamariz. Este componente busca o mesmo agregado, mas desenha só a
 * barra de distribuição — e linka pra página cheia pra quem quiser o mapa de
 * verdade.
 *
 * ## Por que some em vez de mostrar erro
 *
 * É decoração, não a fonte de dado (essa é `/market-pulse`). Uma falha de rede
 * aqui não merece ocupar espaço na home com um estado de erro — some, e a home
 * continua funcionando pro que importa.
 *
 * ## Por que a barra é SVG, não `<div style={{width}}>`
 *
 * A CSP do projeto (`next.config.ts`) não declara `style-src`, e bloqueia
 * atributo `style` em linha — o mesmo defeito que `map-model.ts` documenta e
 * corrigiu pro mapa inteiro. `width`/`x` de um `<rect>` são atributos de
 * apresentação do SVG, não `style`, e por isso passam pela CSP.
 *
 * ## Por que `t` chega por prop, e não de `useI18n()` aqui dentro
 *
 * `Landing` resolve o idioma como `forcedLang || contextLang || 'pt'` — é
 * assim que uma rota de país (`forcedLang` fixo) não muda de idioma se o
 * contexto do navegador detectar outro. Um componente que chamasse
 * `useI18n()` por conta própria leria só `contextLang`, ignorando o
 * `forcedLang` — e mostraria inglês numa página inteira em português. Foi
 * exatamente o defeito visto ao testar `/br` sem idioma salvo no
 * `localStorage`: o resto da página em português, este bloco em inglês.
 *
 * ## Por que logo abaixo do hero, e com fundo escuro
 *
 * Pedido do operador: o índice precisa "ficar nos olhos" de quem abre a
 * página, não só existir em algum lugar dela. Mora entre a faixa de
 * estatísticas e a seção de Presença Digital — é o segundo bloco que
 * aparece, sem entrar DENTRO do hero e disputar espaço com o CTA principal.
 * O fundo em gradiente escuro repete a mesma linguagem visual do bloco de
 * "Pronto para transformar..." no fim da página — o único outro lugar que já
 * usa esse contraste — para que o índice pareça algo que a empresa quer
 * mostrar, não um rodapé de informação.
 */
export function HiringIndexTeaser({ t }: { t: TranslationDictionary }) {
  const hi = t.hiringMap
  const [atlas, setAtlas] = useState<HiringAtlas | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    internalFetch('/api/hiring-index')
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status))
        return (await r.json()) as HiringAtlas
      })
      .then((data) => {
        if (alive) setAtlas(data)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  if (failed || !atlas) return null

  const { distribution } = atlas
  const total = distribution.tracked
  if (total === 0) return null

  const phaseLabels: Record<HiringPhase, string> = {
    cooling: t.hiringIndex.phaseCooling,
    bottoming_out: t.hiringIndex.phaseBottomingOut,
    recovering: t.hiringIndex.phaseRecovering,
    heating_up: t.hiringIndex.phaseHeatingUp,
    stable: t.hiringIndex.phaseStable,
  }

  const segments = PHASES.reduce<{ phase: HiringPhase; count: number; width: number; x: number }[]>(
    (acc, phase) => {
      const count = distribution.counts[phase]
      const width = (count / total) * 100
      if (width === 0) return acc
      const previous = acc[acc.length - 1]
      const x = previous ? previous.x + previous.width : 0
      return [...acc, { phase, count, width, x }]
    },
    []
  )

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="rounded-3xl bg-gradient-to-br from-[#0B192E] via-slate-900 to-[#0B63E5] text-white shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center shrink-0">
              <Globe2 className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <p className="font-extrabold text-white text-lg sm:text-xl truncate">{hi.indexHeading}</p>
              </div>
              <p className="text-sm text-blue-100/90">
                {hi.indexSummary
                  .replace('{classified}', String(distribution.classified))
                  .replace('{tracked}', String(distribution.tracked))}
              </p>
            </div>
          </div>
          <a
            href="/market-pulse"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-bold bg-white text-[#0B192E] hover:bg-blue-50 rounded-full px-5 py-2.5 shadow-lg shrink-0 transition-colors"
          >
            {hi.viewFullMapCta} <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="w-full h-3.5 mt-6 rounded-full overflow-hidden">
          <rect x={0} y={0} width={100} height={8} fill="rgba(255,255,255,0.12)" />
          {segments.map((s) => (
            <rect key={s.phase} x={s.x} y={0} width={s.width} height={8} fill={PHASE_FILL[s.phase]}>
              <title>
                {phaseLabels[s.phase]}: {s.count}
              </title>
            </rect>
          ))}
        </svg>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {segments.map((s) => (
            <span key={s.phase} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-50/90">
              <svg viewBox="0 0 8 8" className="w-2.5 h-2.5 shrink-0">
                <circle cx={4} cy={4} r={4} fill={PHASE_FILL[s.phase]} />
              </svg>
              {phaseLabels[s.phase]} · {s.count}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
