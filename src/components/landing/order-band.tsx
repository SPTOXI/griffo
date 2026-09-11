import { cn } from '@/lib/utils'
import type { TranslationDictionary } from '@/lib/i18n'

export interface OrderBandProps {
  t: TranslationDictionary
}

/**
 * Faixa "A ordem importa", logo abaixo do Hero D. Único destaque de cor é o
 * passo 06 (Radar) — ele é o último elo da cadeia, não o produto (ver
 * hero-d.tsx e o contexto de produto no prompt de handoff).
 */
export function OrderBand({ t }: OrderBandProps) {
  return (
    <section className="border-t border-white/10 bg-[#0B192E]">
      <div className="mx-auto max-w-[1200px] px-8 pt-14 pb-[72px]">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[#6f8fc4]">
          {t.orderBand.kicker}
        </p>
        <p className="mb-9 max-w-[640px] text-pretty text-[26px] font-semibold tracking-[-0.02em] text-white">
          {t.orderBand.intro}
        </p>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border border-white/[0.12] bg-white/[0.12] min-[480px]:grid-cols-2 min-[830px]:grid-cols-3 min-[1080px]:grid-cols-6">
          {t.orderBand.steps.map((step, i) => {
            const isRadar = i === t.orderBand.steps.length - 1
            return (
              <div key={i} className="flex flex-col gap-2 bg-[#0B192E] px-5 py-[22px]">
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    isRadar ? 'text-[#7fb0ff]' : 'text-white'
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'text-[15.5px] font-bold tracking-[-0.01em]',
                    isRadar ? 'text-[#7fb0ff]' : 'text-white'
                  )}
                >
                  {step.title}
                </span>
                <span className="text-[13px] leading-[1.5] text-[#a9bcd6]">{step.body}</span>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-[15px]">
          <span className="text-[#8fa6c4]">{t.orderBand.closingBrand}</span>{' '}
          <span className="text-white">{t.orderBand.closingTagline}</span>
        </p>
      </div>
    </section>
  )
}
