/**
 * Tudo o que a tela do mapa mostra, já resolvido e já no idioma da pessoa.
 *
 * ## Por que este arquivo existe, e o defeito concreto que ele corrige
 *
 * `HiringMapView` é um componente de cliente que o servidor também renderiza —
 * é assim que o HTML do mapa chega pronto para buscador e motor de resposta. O
 * problema é que ele formatava texto dependente de idioma DENTRO do render:
 * `Intl.DisplayNames` para o nome do país, `Intl.Collator` para a ordem da
 * tabela, `Intl.DateTimeFormat` para o período.
 *
 * As tabelas de idioma (ICU/CLDR) do Node e as do navegador **não são a mesma
 * versão**, e às vezes discordam. Conferido no dev server em 02/09/2026, em
 * alemão: o Node escreve `Falklandinseln` e o Chrome escreve
 * `Falklandinseln (Malwinen)` para `FK`. Uma letra de diferença é suficiente
 * para o React declarar `Hydration failed` e **jogar fora a árvore inteira
 * vinda do servidor**, refazendo-a no cliente. O mapa que o servidor mandou
 * pronto era descartado por causa do nome de uma ilha.
 *
 * A correção é estrutural, não um remendo: **nada dependente de idioma é
 * calculado no cliente**. O modelo é montado uma vez, no servidor, e o
 * componente só desenha o que recebe. Assim as duas passagens (HTML do
 * servidor e hidratação do cliente) leem exatamente as mesmas strings.
 *
 * ## Por que é um módulo puro, e não parte da página
 *
 * Pela mesma razão de `lookup.ts` e `atlas.ts`: aqui há decisão (que cor, que
 * rótulo, que ordem, quem é "sem dado"), e decisão tem de caber num teste sem
 * subir um servidor. A página só chama e passa adiante.
 */

import { PHASES, type HiringAtlas } from './atlas'
import { displayCountry, formatDate, formatPeriod } from './display'
import type { HiringPhase } from './phase'
import { WORLD_MAP_MARKERS, WORLD_MAP_SHAPES } from './world-map'
import { localeForLang, type Language, type TranslationDictionary } from '@/lib/i18n'

/**
 * Preenchimento por fase.
 *
 * As mesmas famílias de cor de `components/app/hiring-index-card.tsx`, e pelo
 * motivo que `globals.css` documenta: emerald = positivo, amber = atenção,
 * vermelho = queda, slate = neutro estrutural. Um mapa com paleta própria faria
 * a mesma fase aparecer de duas cores em duas telas do mesmo produto.
 */
export const PHASE_FILL: Record<HiringPhase, string> = {
  cooling: '#dc2626',
  bottoming_out: '#d97706',
  recovering: '#0284c7',
  heating_up: '#059669',
  stable: '#94a3b8',
}

/**
 * A MESMA cor, como classe do Tailwind.
 *
 * Existe porque **esta base de código não pode usar `style` em linha**, e isso
 * não é preferência de estilo: a CSP do `next.config.ts` declara
 * `default-src 'self'` e não declara `style-src`, então o navegador bloqueia
 * atributo `style` no HTML. Conferido no dev server em 02/09/2026: a primeira
 * versão desta tela produziu ~130 erros de CSP no console, e a legenda, as
 * barras e os pontos da tabela chegavam sem cor até o React reaplicá-los pelo
 * CSSOM — numa página cujo público é justamente quem lê o HTML antes de
 * qualquer JavaScript rodar.
 *
 * Dentro do `<svg>` o problema não existe: `fill` é atributo de apresentação do
 * SVG, não estilo em linha, e a CSP não o alcança. Por isso tudo que precisa de
 * cor calculada é desenhado em SVG, e só o selo do país selecionado usa classe.
 *
 * Os hexadecimais acima são exatamente estes tokens: red-600, amber-600,
 * sky-600, emerald-600, slate-400.
 */
export const PHASE_CHIP: Record<HiringPhase, string> = {
  cooling: 'bg-red-600',
  bottoming_out: 'bg-amber-600',
  recovering: 'bg-sky-600',
  heating_up: 'bg-emerald-600',
  stable: 'bg-slate-400',
}

/** `id` do padrão de hachura dos países sem cobertura. */
export const NO_DATA_PATTERN = 'gw-hiring-map-no-data'

/** Preenchimento de quem nenhuma fonte cobre. Nunca é uma cor de fase. */
export const NO_DATA_FILL = `url(#${NO_DATA_PATTERN})`

/** Cinza do país coberto que ainda não dá para classificar. Também não é fase. */
export const UNCLASSIFIED_FILL = '#cbd5e1'

/** Uma forma desenhada no mapa — coberta ou não. */
export interface HiringMapShape {
  code: string
  name: string
  fill: string
  /** Texto do `<title>` nativo: funciona sem JavaScript e em leitor de tela. */
  title: string
}

/** Um país coberto, com tudo que o painel e a tabela mostram dele. */
export interface HiringMapCountry {
  code: string
  name: string
  /** A página de país que já existe, em minúsculas: `/de`. */
  href: string
  fill: string
  /** Classe de fundo do selo. Cinza quando não há fase. */
  chipClass: string
  /** Rótulo da fase, ou "dado insuficiente". Nunca o nome do enum. */
  statusLabel: string
  /** A frase que explica a leitura. */
  statusHint: string
  sourceName: string | null
  /** `Fonte: X`, já montado. */
  sourceLine: string | null
  /** `Último período: 2026 Q2`, já montado. */
  periodLine: string | null
  periodLabel: string | null
  preliminary: boolean
  /** `Ver a página de X`, já montado. */
  linkLabel: string
}

/** Uma linha da distribuição de fases. */
export interface HiringMapBar {
  phase: HiringPhase
  label: string
  fill: string
  count: number
  countLabel: string
  /** 0 a 100, para a largura do `<rect>`. */
  sharePercent: number
  shareLabel: string
}

export interface HiringMapModel {
  text: {
    heading: string
    intro: string
    indexHeading: string
    indexSummary: string
    netBreadth: string
    netBreadthLabel: string
    netBreadthHint: string
    unclassifiedLabel: string
    /** Aviso de impressão preliminar — ver `revised` em `LaborMarketPoint`. */
    preliminaryNote: string
    unclassifiedCount: string
    legendHeading: string
    interactionHint: string
    noDataLabel: string
    noDataHint: string
    tableHeading: string
    colCountry: string
    colPhase: string
    colSource: string
    colPeriod: string
    methodHeading: string
    methodBody: string
    comparisonNote: string
    sourcesHeading: string
    mapCredit: string
    /** `null` quando o banco nunca registrou uma coleta. */
    updatedLine: string | null
  }
  bars: HiringMapBar[]
  legend: { fill: string; label: string }[]
  /** Uma entrada para CADA forma do mapa, coberta ou não. */
  shapes: Record<string, HiringMapShape>
  /** Só os países cobertos. */
  countries: Record<string, HiringMapCountry>
  /** Códigos dos países cobertos, na ordem de exibição. */
  ordered: string[]
  /** Nomes próprios das instituições. Não passam por i18n. */
  sources: string[]
}

/**
 * Monta o modelo. Chamada no servidor, uma vez por resposta.
 *
 * `map` e `index` são os dois blocos do dicionário que esta tela lê: o segundo
 * é o MESMO do cartão do laudo pago, e é de propósito — duas telas do produto
 * não podem nomear a mesma fase de dois jeitos.
 */
export function buildHiringMapModel(
  atlas: HiringAtlas,
  lang: Language,
  map: TranslationDictionary['hiringMap'],
  index: TranslationDictionary['hiringIndex']
): HiringMapModel {
  const locale = localeForLang(lang)
  const number = (value: number) => new Intl.NumberFormat(locale).format(value)
  const { distribution } = atlas

  const phaseLabels: Record<HiringPhase, { label: string; hint: string }> = {
    cooling: { label: index.phaseCooling, hint: index.phaseCoolingHint },
    bottoming_out: { label: index.phaseBottomingOut, hint: index.phaseBottomingOutHint },
    recovering: { label: index.phaseRecovering, hint: index.phaseRecoveringHint },
    heating_up: { label: index.phaseHeatingUp, hint: index.phaseHeatingUpHint },
    stable: { label: index.phaseStable, hint: index.phaseStableHint },
  }

  // -------------------------------------------------------------------------
  // Os países cobertos
  // -------------------------------------------------------------------------
  const countries: Record<string, HiringMapCountry> = {}

  for (const summary of atlas.countries) {
    if (!summary.covered) continue
    const name = displayCountry(summary.country, lang)
    const periodLabel = summary.latestPeriod
      ? formatPeriod(summary.latestPeriod, summary.periodType, lang)
      : null

    countries[summary.country] = {
      code: summary.country,
      name,
      href: `/${summary.country.toLowerCase()}`,
      fill: summary.phase ? PHASE_FILL[summary.phase] : UNCLASSIFIED_FILL,
      chipClass: summary.phase ? PHASE_CHIP[summary.phase] : 'bg-slate-400',
      statusLabel: summary.phase ? phaseLabels[summary.phase].label : index.insufficientLabel,
      statusHint: summary.phase ? phaseLabels[summary.phase].hint : index.insufficientDesc,
      sourceName: summary.sourceName,
      sourceLine: summary.sourceName ? index.sourceLabel.replace('{source}', summary.sourceName) : null,
      periodLine: periodLabel ? index.periodLabel.replace('{period}', periodLabel) : null,
      periodLabel,
      preliminary: summary.latestIsPreliminary,
      linkLabel: map.countryLinkLabel.replace('{country}', name),
    }
  }

  // -------------------------------------------------------------------------
  // As formas desenhadas — as cobertas e, principalmente, as que não são
  // -------------------------------------------------------------------------
  const shapes: Record<string, HiringMapShape> = {}
  const drawn = [...WORLD_MAP_SHAPES.map((s) => s.code), ...WORLD_MAP_MARKERS.map((m) => m.code)]

  for (const code of drawn) {
    if (shapes[code]) continue
    const country = countries[code]
    const name = country?.name ?? displayCountry(code, lang)
    shapes[code] = {
      code,
      name,
      fill: country?.fill ?? NO_DATA_FILL,
      title: `${name} — ${country ? country.statusLabel : map.noDataLabel}${
        country?.sourceName ? ` · ${country.sourceName}` : ''
      }`,
    }
  }

  // -------------------------------------------------------------------------
  // Ordem da tabela: pelo NOME no idioma ativo.
  //
  // Nem pelo código, nem pelo tamanho do mercado, nem pela ordem em que os
  // países entraram no produto. Nenhum mercado é listado primeiro.
  // -------------------------------------------------------------------------
  const collator = new Intl.Collator(locale)
  const ordered = Object.values(countries)
    .sort((a, b) => collator.compare(a.name, b.name))
    .map((c) => c.code)

  // -------------------------------------------------------------------------
  // A distribuição
  // -------------------------------------------------------------------------
  const bars: HiringMapBar[] = PHASES.map((phase) => {
    const count = distribution.counts[phase]
    const share = distribution.classified > 0 ? (count / distribution.classified) * 100 : 0
    return {
      phase,
      label: phaseLabels[phase].label,
      fill: PHASE_FILL[phase],
      count,
      countLabel: number(count),
      sharePercent: share,
      shareLabel: `${share.toFixed(0)}%`,
    }
  })

  const sources = [
    ...new Set(Object.values(countries).map((c) => c.sourceName).filter((s): s is string => !!s)),
  ].sort((a, b) => a.localeCompare(b))

  return {
    text: {
      heading: map.heading,
      intro: map.intro.replace('{count}', number(distribution.tracked)),
      indexHeading: map.indexHeading,
      indexSummary: map.indexSummary
        .replace('{classified}', number(distribution.classified))
        .replace('{tracked}', number(distribution.tracked)),
      // Com sinal explícito: `+12` é uma frase ("doze países a mais aquecendo
      // do que esfriando"); `12` sozinho é ambíguo.
      netBreadth: new Intl.NumberFormat(locale, { signDisplay: 'exceptZero' }).format(
        distribution.netBreadth
      ),
      netBreadthLabel: map.netBreadthLabel,
      netBreadthHint: map.netBreadthHint,
      unclassifiedLabel: index.insufficientLabel,
      preliminaryNote: index.preliminaryNote,
      unclassifiedCount: number(distribution.unclassified),
      legendHeading: map.legendHeading,
      interactionHint: map.interactionHint,
      noDataLabel: map.noDataLabel,
      noDataHint: map.noDataHint,
      tableHeading: map.tableHeading,
      colCountry: map.colCountry,
      colPhase: map.colPhase,
      colSource: map.colSource,
      colPeriod: map.colPeriod,
      methodHeading: map.methodHeading,
      methodBody: map.methodBody,
      comparisonNote: index.comparisonNote,
      sourcesHeading: map.sourcesHeading,
      mapCredit: map.mapCredit,
      updatedLine: atlas.updatedAt
        ? map.updatedLabel.replace('{date}', formatDate(atlas.updatedAt, lang))
        : null,
    },
    bars,
    legend: [
      ...PHASES.map((phase) => ({ fill: PHASE_FILL[phase], label: phaseLabels[phase].label })),
      { fill: NO_DATA_FILL, label: map.noDataLabel },
    ],
    shapes,
    countries,
    ordered,
    sources,
  }
}
