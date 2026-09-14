import { cn } from '@/lib/utils'
import type { TranslationDictionary } from '@/lib/i18n'

export interface OrderBandProps {
  t: TranslationDictionary
}

/**
 * Faixa "A ordem importa", logo abaixo do Hero D. Único destaque de cor é o
 * ÚLTIMO elo da cadeia — não um passo nomeado fixo — porque é o desfecho do
 * funil que merece ênfase, e o desfecho muda conforme o produto cresce: era
 * o Radar (achar a vaga) até o preparo de entrevista existir; agora é a
 * Preparação (passo 07), que estende o funil até onde o produto realmente
 * vai hoje (ver hero-d.tsx e o contexto de produto no prompt de handoff).
 */
export function OrderBand({ t }: OrderBandProps) {
  // Chaves planas no dicionário (step1Title...step7Body), não array de
  // objetos — `i18n.test.ts` exige que todo array de tradução seja
  // `string[]`, então a lista é remontada aqui só para o render.
  const steps = [
    { title: t.orderBand.step1Title, body: t.orderBand.step1Body },
    { title: t.orderBand.step2Title, body: t.orderBand.step2Body },
    { title: t.orderBand.step3Title, body: t.orderBand.step3Body },
    { title: t.orderBand.step4Title, body: t.orderBand.step4Body },
    { title: t.orderBand.step5Title, body: t.orderBand.step5Body },
    { title: t.orderBand.step6Title, body: t.orderBand.step6Body },
    { title: t.orderBand.step7Title, body: t.orderBand.step7Body },
  ]

  return (
    <section className="border-t border-white/10 bg-[#0B192E]">
      <div className="mx-auto max-w-[1200px] px-8 pt-14 pb-[72px]">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[#6f8fc4]">
          {t.orderBand.kicker}
        </p>
        <p className="mb-3 max-w-[640px] text-pretty text-[26px] font-semibold tracking-[-0.02em] text-white">
          {t.orderBand.intro}
        </p>
        <div className="mb-9 h-[3px] w-full max-w-[640px] bg-gradient-to-r from-[#0B63E5] to-transparent" />

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border border-white/[0.12] bg-white/[0.12] min-[480px]:grid-cols-2 min-[830px]:grid-cols-4 min-[1080px]:grid-cols-7">
          {steps.map((step, i) => {
            const isLastStep = i === steps.length - 1
            return (
              <div
                key={i}
                className={cn(
                  'relative flex flex-col gap-2 px-5 py-[22px]',
                  isLastStep
                    ? 'bg-gradient-to-br from-[#0B63E5]/[0.28] to-[#0B63E5]/[0.08]'
                    : 'bg-[#0B192E]'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none absolute top-1.5 right-3.5 font-mono text-[44px] font-bold leading-none',
                    isLastStep ? 'text-[#7fb0ff]/10' : 'text-white/[0.06]'
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    isLastStep ? 'text-[#7fb0ff]' : 'text-white'
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'text-[15.5px] font-bold tracking-[-0.01em]',
                    isLastStep ? 'text-[#7fb0ff]' : 'text-white'
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
