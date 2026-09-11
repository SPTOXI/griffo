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
  // Chaves planas no dicionário (step1Title...step6Body), não array de
  // objetos — `i18n.test.ts` exige que todo array de tradução seja
  // `string[]`, então a lista é remontada aqui só para o render.
  const steps = [
    { title: t.orderBand.step1Title, body: t.orderBand.step1Body },
    { title: t.orderBand.step2Title, body: t.orderBand.step2Body },
    { title: t.orderBand.step3Title, body: t.orderBand.step3Body },
    { title: t.orderBand.step4Title, body: t.orderBand.step4Body },
    { title: t.orderBand.step5Title, body: t.orderBand.step5Body },
    { title: t.orderBand.step6Title, body: t.orderBand.step6Body },
  ]

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
          {steps.map((step, i) => {
            const isRadar = i === steps.length - 1
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
