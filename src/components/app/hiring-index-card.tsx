'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Thermometer, TrendingDown, TrendingUp, ArrowDownToLine, Minus, Info, AlertCircle,
} from 'lucide-react'
import { useI18n } from '@/context/i18n-context'
import { internalFetch } from '@/lib/internal-fetch'
// `displayCountry` e `formatPeriod` moraram aqui como funções privadas até o
// mapa público (§2.55) precisar das duas. Ver `lib/hiring-index/display.ts`.
import { displayCountry, formatPeriod } from '@/lib/hiring-index/display'
import type { TranslationDictionary } from '@/lib/i18n'
import type { HiringPhase } from '@/lib/hiring-index/phase'
import type { HiringIndexSummary } from '@/lib/hiring-index/lookup'

/**
 * A temperatura de contratação do mercado-alvo, dentro do laudo pago.
 *
 * ## A regra que manda neste componente
 *
 * **Ele nunca some.** Não há renderização condicional que faça o cartão
 * desaparecer quando não há dado — sumir parece defeito, e o silêncio deixaria
 * a pessoa achando que a tela quebrou. Os três desfechos possíveis têm texto
 * próprio nos 12 idiomas: fase classificada, país coberto sem histórico
 * bastante (`covered && phase === null`) e país sem cobertura nenhuma
 * (`!covered`). Nenhum deles é um chute com cara de resposta.
 *
 * A única exceção é não haver mercado declarado no perfil: aí não existe país
 * sobre o qual dizer nada, e o cartão não é montado (ver `AnalysisView`).
 *
 * ## De onde vem o país
 *
 * Chega pronto, por `props`. Quem o descobre é a `AnalysisView`, lendo
 * `/api/user/professional-profile` — a mesma rota que
 * `professional-profile-view.tsx` e `profile-conflict-prompt.tsx` já usam, e
 * não um caminho novo de busca de perfil — e aplicando `targetMarketOf` abaixo.
 * O laudo não carregava o perfil, e embutir o mercado na resposta da análise
 * misturaria dado de currículo com dado de mercado numa rota só.
 *
 * ## Fonte sempre visível
 *
 * O nome do órgão de estatística aparece em toda leitura classificada, sem
 * tooltip nem "saiba mais". E quando a janela mais recente ainda tem impressão
 * preliminar, o aviso de revisão vem junto: a taxa de resposta do JOLTS caiu
 * para ~30% e a revisão da segunda divulgação vale ~180 mil vagas em média, de
 * modo que a primeira impressão de um mês é a menos confiável da série inteira.
 */

/** Só o que este cartão precisa do perfil. */
interface ProfileMarketFields {
  primaryMarket?: string | null
  residenceCountry?: string | null
}

/**
 * O país a consultar: mercado declarado, e a residência como recuo.
 *
 * Mesma ordem de `marketInputFrom` em `lib/profile`: `primaryMarket` é o
 * mercado onde a pessoa QUER trabalhar, e é ele que importa para saber se vale
 * a pena candidatar-se agora. Onde ela dorme só entra quando não declarou nada.
 * Nenhum país é tratado de forma especial — não há mercado padrão aqui.
 */
export function targetMarketOf(profile: ProfileMarketFields | null | undefined): string | null {
  const raw = profile?.primaryMarket || profile?.residenceCountry || null
  if (!raw) return null
  const code = raw.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

/** Cor e ícone por fase. Mesma linguagem visual dos blocos de aderência. */
const PHASE_SKIN: Record<HiringPhase, { card: string; chip: string; icon: typeof TrendingUp; iconBox: string }> = {
  cooling: {
    card: 'border-red-200 bg-gradient-to-br from-red-50/50 via-white to-rose-50/30',
    chip: 'bg-red-50 text-red-900 border-red-300',
    icon: TrendingDown,
    iconBox: 'bg-red-600',
  },
  bottoming_out: {
    card: 'border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30',
    chip: 'bg-amber-50 text-amber-900 border-amber-300',
    icon: ArrowDownToLine,
    iconBox: 'bg-amber-600',
  },
  recovering: {
    card: 'border-sky-200 bg-gradient-to-br from-sky-50/50 via-white to-blue-50/30',
    chip: 'bg-sky-50 text-sky-900 border-sky-300',
    icon: TrendingUp,
    iconBox: 'bg-sky-600',
  },
  heating_up: {
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-sky-50/30',
    chip: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    icon: TrendingUp,
    iconBox: 'bg-emerald-600',
  },
  stable: {
    card: 'border-slate-200 bg-gradient-to-br from-slate-50/60 via-white to-slate-50/30',
    chip: 'bg-slate-50 text-slate-800 border-slate-300',
    icon: Minus,
    iconBox: 'bg-slate-600',
  },
}

/** Estado sem classificação: cinza neutro, nunca a cor de uma fase. */
const NEUTRAL_SKIN = {
  card: 'border-slate-200 bg-slate-50/40',
  chip: 'bg-white text-slate-700 border-slate-300',
  iconBox: 'bg-slate-500',
}

/**
 * O cartão que busca o dado. Estado e requisição moram aqui; desenho, no
 * `HiringIndexCardView` abaixo.
 *
 * A separação existe para que o desenho possa ser conferido em teste: um
 * componente que busca no `useEffect` não renderiza nenhum dos seus desfechos
 * sob `renderToStaticMarkup`, e o desfecho é justamente o que precisa de trava
 * — a regra deste arquivo é que o cartão nunca fica vazio.
 */
export function HiringIndexCard({ country }: { country: string }) {
  const { t, lang } = useI18n()
  const [summary, setSummary] = useState<HiringIndexSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setFailed(false)

    internalFetch(`/api/hiring-index/${encodeURIComponent(country)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status))
        return (await r.json()) as HiringIndexSummary
      })
      .then((data) => {
        if (!alive) return
        setSummary(data)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        // Falha de rede não vira "sem dado para este país": são frases
        // diferentes, e trocar uma pela outra seria afirmar algo que não se
        // sabe.
        setFailed(true)
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [country])

  return (
    <HiringIndexCardView
      country={country}
      lang={lang}
      dict={t.hiringIndex}
      summary={summary}
      loading={loading}
      failed={failed}
    />
  )
}

export interface HiringIndexCardViewProps {
  country: string
  lang: string
  dict: TranslationDictionary['hiringIndex']
  summary: HiringIndexSummary | null
  loading: boolean
  failed: boolean
}

/** Só desenho. Recebe tudo pronto, não busca nada, não decide nada de dado. */
export function HiringIndexCardView({
  country,
  lang,
  dict: hi,
  summary,
  loading,
  failed,
}: HiringIndexCardViewProps) {
  const countryName = displayCountry(country, lang)

  const phase = summary?.phase ?? null
  const skin = phase ? PHASE_SKIN[phase] : null
  const PhaseIcon = skin?.icon ?? Thermometer

  const phaseLabels: Record<HiringPhase, { label: string; hint: string }> = {
    cooling: { label: hi.phaseCooling, hint: hi.phaseCoolingHint },
    bottoming_out: { label: hi.phaseBottomingOut, hint: hi.phaseBottomingOutHint },
    recovering: { label: hi.phaseRecovering, hint: hi.phaseRecoveringHint },
    heating_up: { label: hi.phaseHeatingUp, hint: hi.phaseHeatingUpHint },
    stable: { label: hi.phaseStable, hint: hi.phaseStableHint },
  }

  return (
    <Card className={`${skin?.card ?? NEUTRAL_SKIN.card} shadow-sm`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl ${skin?.iconBox ?? NEUTRAL_SKIN.iconBox} text-white flex items-center justify-center shrink-0 shadow-xs`}
            >
              <PhaseIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base text-brand-navy font-bold">{hi.title}</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                {hi.marketLabel.replace('{country}', countryName)}
              </CardDescription>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-8 w-36 self-start sm:self-auto" />
          ) : failed ? (
            /* Sem selo quando a CONSULTA falhou. "Dado insuficiente" é uma
               afirmação sobre a série do país, e não se sabe nada sobre ela
               quando a requisição nem chegou — o corpo do cartão já diz, com
               todas as letras, que não foi possível consultar. */
            null
          ) : (
            <Badge
              variant="outline"
              className={`${skin?.chip ?? NEUTRAL_SKIN.chip} font-bold text-xs px-3 py-1.5 self-start sm:self-auto`}
            >
              {phase ? phaseLabels[phase].label : hi.insufficientLabel}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-xs text-slate-500">{hi.loading}</p>
        ) : failed ? (
          <p className="flex items-start gap-2 text-sm text-slate-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
            <span>{hi.unavailable}</span>
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {phase
                ? phaseLabels[phase].hint
                : summary?.covered
                  ? hi.insufficientDesc
                  : hi.notCoveredDesc}
            </p>

            {/* O aviso de impressão preliminar vem antes da linha de fonte:
                é a ressalva que muda como o número deve ser lido. */}
            {summary?.latestIsPreliminary && (
              <p className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 text-xs text-amber-950 leading-relaxed flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{hi.preliminaryNote}</span>
              </p>
            )}

            <div className="pt-1 border-t border-slate-200/70 space-y-1 text-[11px] text-slate-500 leading-relaxed">
              {summary?.sourceName && (
                <p className="font-semibold text-slate-600">
                  {hi.sourceLabel.replace('{source}', summary.sourceName)}
                  {summary.latestPeriod && (
                    <span className="font-normal">
                      {' · '}
                      {hi.periodLabel.replace(
                        '{period}',
                        formatPeriod(summary.latestPeriod, summary.periodType, lang)
                      )}
                    </span>
                  )}
                </p>
              )}
              <p>{hi.description}</p>
              <p>{hi.comparisonNote}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

