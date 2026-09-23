'use client'

import { useId, useRef, useState } from 'react'
import { ArrowRight, Check, Radar as RadarIcon, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LANGUAGES, localeForLang, type Language, type TranslationDictionary } from '@/lib/i18n'

export interface HeroDProps {
  t: TranslationDictionary
  lang: Language
  openJobsCount: number
  onNavigate: (v: 'login' | 'signup' | 'app') => void
}

type View = 'human' | 'ats'

/**
 * Hero D — única direção aprovada do handoff de design (`design_handoff_hero_griffowork/`).
 * A narrativa é inteligência → análise → auditoria → otimização → direcionamento → Radar;
 * este hero fala da auditoria (o cartão), não da vaga. Ver `order-band.tsx` para a cadeia
 * completa, que fica logo abaixo na página.
 */
export function HeroD({ t, lang, openJobsCount, onNavigate }: HeroDProps) {
  const [view, setView] = useState<View>('human')
  const uid = useId()
  const humanTabRef = useRef<HTMLButtonElement>(null)
  const atsTabRef = useRef<HTMLButtonElement>(null)

  const humanTabId = `${uid}-tab-human`
  const atsTabId = `${uid}-tab-ats`
  const humanPanelId = `${uid}-panel-human`
  const atsPanelId = `${uid}-panel-ats`

  function handleTablistKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next: View = view === 'human' ? 'ats' : 'human'
    setView(next)
    ;(next === 'human' ? humanTabRef : atsTabRef).current?.focus()
  }

  const jobsCount = new Intl.NumberFormat(localeForLang(lang)).format(openJobsCount)
  const [paragraphBeforeCount, paragraphAfterCount] = t.heroD.paragraph.split('{N}')
  const trustLanguages = t.heroD.trustLanguages.replace('{count}', String(LANGUAGES.length))

  const score = view === 'human' ? 91 : 43

  // Chaves planas no dicionário (requirement1Title...requirement4Evidence), não
  // array de objetos — `i18n.test.ts` exige que todo array de tradução seja
  // `string[]`, então a lista é remontada aqui só para o render.
  const requirements = [
    { title: t.heroD.requirement1Title, evidence: t.heroD.requirement1Evidence },
    { title: t.heroD.requirement2Title, evidence: t.heroD.requirement2Evidence },
    { title: t.heroD.requirement3Title, evidence: t.heroD.requirement3Evidence },
    { title: t.heroD.requirement4Title, evidence: t.heroD.requirement4Evidence },
  ]

  return (
    <section className="relative overflow-hidden bg-[#0B192E]">
      {/* Textura de fundo (handoff "Hero background — circuit pattern") — classe
          Tailwind compilada, não `style` inline: a CSP do projeto não declara
          `style-src` e bloqueia atributo `style` em linha (mesmo motivo já
          documentado no scan-line do cartão ATS logo abaixo e em
          `hiring-index-teaser.tsx`). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/circuit-pattern.svg')] bg-repeat [background-size:240px_240px]"
      />
      <div className="relative z-10 mx-auto max-w-[1200px] px-8 py-20">
        <div className="grid grid-cols-1 gap-14 min-[830px]:grid-cols-2 min-[830px]:items-center">
          {/* COLUNA ESQUERDA */}
          <div className="flex min-w-0 flex-col gap-[26px]">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-[#6f8fc4]">
              {t.heroD.eyebrow}
            </p>

            {/* `h2` desde o §2.132: o `h1` da página passou a ser o envio de
                currículo (`match-hero.tsx`), que vem antes deste bloco. */}
            <h2 className="text-pretty text-[34px] font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-[40px] min-[830px]:text-[58px]">
              {t.heroD.title}
            </h2>

            <p className="max-w-[520px] text-[19px] leading-[1.6] text-[#a9bcd6]">
              {paragraphBeforeCount}
              <span className="text-white [font-variant-numeric:tabular-nums]">{jobsCount}</span>
              {paragraphAfterCount}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => onNavigate('signup')}
                size="lg"
                className="h-[54px] gap-2.5 rounded-lg bg-[#0B63E5] px-[26px] text-base font-semibold text-white hover:bg-[#0a58cc]"
              >
                {t.heroD.ctaPrimary}
                <ArrowRight className="size-[18px]" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-[54px] rounded-lg border-white/[0.22] bg-transparent px-[22px] text-base font-medium text-white hover:bg-white/[0.06] hover:text-white"
              >
                <a href="/market-pulse">{t.heroD.ctaSecondary}</a>
              </Button>
            </div>

            <p className="max-w-[520px] border-s-2 border-[#0B63E5] ps-4 text-[16.5px] leading-[1.55] text-[#e2ebf7]">
              {t.heroD.quote}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-[#8fa6c4]">
              <ShieldCheck className="size-[15px] shrink-0 text-[#6f8fc4]" />
              <span>
                {t.heroD.trustFree} · {trustLanguages} ·{' '}
                <a href="/privacy" className="underline decoration-dotted underline-offset-2 hover:text-white">
                  {t.heroD.trustCompliance}
                </a>
              </span>
            </div>
          </div>

          {/* COLUNA DIREITA — cartão de demonstração */}
          <div className="min-w-0">
            <div
              role="tablist"
              className="mb-3.5 inline-flex gap-[3px] rounded-[9px] bg-white/[0.08] p-[3px]"
              onKeyDown={handleTablistKeyDown}
            >
              <button
                ref={humanTabRef}
                type="button"
                role="tab"
                id={humanTabId}
                aria-selected={view === 'human'}
                aria-controls={humanPanelId}
                tabIndex={view === 'human' ? 0 : -1}
                onClick={() => setView('human')}
                className={cn(
                  'whitespace-nowrap rounded-[7px] px-[14px] py-[7px] text-[13px] transition-colors',
                  view === 'human' ? 'bg-white font-semibold text-[#0B192E]' : 'font-medium text-[#a9bcd6]'
                )}
              >
                {t.heroD.toggleHuman}
              </button>
              <button
                ref={atsTabRef}
                type="button"
                role="tab"
                id={atsTabId}
                aria-selected={view === 'ats'}
                aria-controls={atsPanelId}
                tabIndex={view === 'ats' ? 0 : -1}
                onClick={() => setView('ats')}
                className={cn(
                  'whitespace-nowrap rounded-[7px] px-[14px] py-[7px] text-[13px] transition-colors',
                  view === 'ats' ? 'bg-white font-semibold text-[#0B192E]' : 'font-medium text-[#a9bcd6]'
                )}
              >
                {t.heroD.toggleAts}
              </button>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)]">
              {/* Linha de varredura — cobre o cartão inteiro (cabeçalho + faixa
                  do número + corpo), só na aba "Como o ATS te vê". Vive aqui,
                  fora do "Corpo" de 320px, para o `top: 0%→100%` do keyframe
                  (ver `hero-ats-scan` em globals.css) ser relativo à altura
                  real do cartão — que muda de idioma para idioma — não a um
                  pixel fixo. Roda mesmo com `prefers-reduced-motion`: é um
                  flourish decorativo de baixa opacidade, sem flash nem
                  parallax — não o tipo de movimento que essa preferência visa
                  evitar, e "reduzir animações" no Windows é uma opção que
                  muita gente desliga por preferência de performance, sem
                  relação com sensibilidade a movimento. */}
              {view === 'ats' && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 z-10 h-3.5 animate-[hero-ats-scan_3.4s_linear_infinite] bg-gradient-to-b from-[#0B63E5]/[0.22] to-transparent"
                />
              )}
              {/* Cabeçalho */}
              <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] px-[22px] py-4">
                <div className="min-w-0">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#64748b]">
                    {t.heroD.cardKicker}
                  </p>
                  <p className="mt-1 text-[14.5px] font-bold text-[#0B192E]">{t.heroD.cardTitle}</p>
                  <p className="mt-0.5 text-[12.5px] text-[#64748b]">{t.heroD.cardMeta}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap text-[#0B63E5]">
                    <RadarIcon className="size-[13px]" /> {t.heroD.cardRadarBadge}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">
                    {t.heroD.cardIllustrativeBadge}
                  </span>
                </div>
              </div>

              {/* Faixa do número */}
              <div className="flex items-end justify-between gap-5 border-b border-[#eef2f6] px-[22px] py-6">
                <div>
                  <p className="text-[13px] text-[#64748b]">
                    {view === 'human' ? t.heroD.humanLabel : t.heroD.atsLabel}
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className={cn(
                        'text-[60px] leading-none font-bold tracking-[-0.045em]',
                        view === 'human' ? 'text-[#0B192E]' : 'text-[#b91c1c]'
                      )}
                    >
                      {score}%
                    </span>
                    <span className="font-mono text-sm whitespace-nowrap text-[#64748b]">
                      {t.heroD.compatibleUnit}
                    </span>
                  </div>
                </div>
                <p className="max-w-[160px] text-right text-[12.5px] leading-[1.5] text-[#64748b]">
                  {view === 'human' ? t.heroD.humanNote : t.heroD.atsNote}
                </p>
              </div>

              {/* Corpo — as duas abas ficam empilhadas na mesma célula de grid
                  (`col-start-1 row-start-1`), as duas sempre montadas. Isso faz
                  a altura da linha ser o MAIOR conteúdo entre as duas, em vez
                  de só a aba ativa: sem isso, trocar de aba mudava a altura
                  real do cartão (min-h era só piso, não teto), e como a coluna
                  esquerda é centralizada verticalmente contra a direita
                  (`items-center` na grid do hero), o texto lateral pulava de
                  posição a cada clique. A aba inativa vira invisível
                  (`invisible`, não `hidden`/`display:none`) para continuar
                  contribuindo com a altura sem aparecer nem ser focável. */}
              <div className="relative grid min-h-[320px]">
                <div
                  role="tabpanel"
                  id={humanPanelId}
                  aria-labelledby={humanTabId}
                  aria-hidden={view !== 'human'}
                  tabIndex={view === 'human' ? 0 : -1}
                  className={cn(
                    'col-start-1 row-start-1 flex flex-col gap-3.5 p-[22px]',
                    view !== 'human' && 'invisible'
                  )}
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#64748b]">
                    {t.heroD.humanKicker}
                  </p>
                  {requirements.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-3.5 border-b border-[#f4f7fa] pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-[#0B192E]">{r.title}</p>
                        <p className="mt-1 text-[12.5px] leading-[1.5] text-[#5b6878]">{r.evidence}</p>
                      </div>
                      <Check className="mt-0.5 size-4 shrink-0 text-[#0B63E5]" />
                    </div>
                  ))}
                  <p className="text-[12.5px] text-[#5b6878]">{t.heroD.humanClosing}</p>
                </div>
                <div
                  role="tabpanel"
                  id={atsPanelId}
                  aria-labelledby={atsTabId}
                  aria-hidden={view !== 'ats'}
                  tabIndex={view === 'ats' ? 0 : -1}
                  className={cn(
                    'col-start-1 row-start-1 overflow-hidden bg-[#f7f9fc] p-[22px] font-mono text-[12.5px] leading-[1.75] text-[#26313f]',
                    view !== 'ats' && 'invisible'
                  )}
                >
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#64748b]">
                    {t.heroD.atsKicker}
                  </p>
                  <p className="mt-2 text-[#b91c1c]">
                    {t.heroD.atsLine1} <span className="text-[#64748b]">{t.heroD.atsLine1Note}</span>
                  </p>
                  <p className="text-[#b91c1c]">{t.heroD.atsLine2}</p>
                  <p className="text-[#b45309]">{t.heroD.atsLine3}</p>
                  <p className="text-[#b91c1c]">{t.heroD.atsLine4}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-[#64748b]">
                    {t.heroD.extractedKicker}
                  </p>
                  <p className="text-[#475569]">{t.heroD.extractedShuffled}</p>
                  <p className="text-[#b91c1c]">{t.heroD.ignoredLine}</p>
                  <p className="mt-3.5 border-t border-[#e2e8f0] pt-3.5">
                    <span className="text-[#0B192E]">{t.heroD.resultLabel}</span>{' '}
                    <span className="font-semibold text-[#b91c1c]">{t.heroD.resultValue}</span>
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[12.5px] text-[#8fa6c4]">{t.heroD.legend}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
