'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Info } from 'lucide-react'
import {
  CONTINENT_NO_DATA_PATTERN,
  NO_DATA_PATTERN,
  type HiringMapModel,
} from '@/lib/hiring-index/map-model'
import { WORLD_MAP_MARKERS, WORLD_MAP_SHAPES, WORLD_MAP_VIEWBOX } from '@/lib/hiring-index/world-map'

/**
 * O mapa-múndi público de temperatura de contratação (§2.55).
 *
 * ## Este componente não decide nada, e isso é a arquitetura
 *
 * Ele recebe o modelo pronto de `lib/hiring-index/map-model.ts` — cor, rótulo,
 * ordem, nome de país, período formatado, tudo — e só desenha. `'use client'`
 * está aqui por UMA razão: o `useState` do país selecionado.
 *
 * A regra existe porque a alternativa quebrou de verdade. Formatando texto no
 * render, o componente chamava `Intl.DisplayNames` nas duas passagens — a do
 * servidor e a da hidratação — e as tabelas de idioma do Node e do navegador
 * discordam: em alemão, `FK` sai `Falklandinseln` no Node e
 * `Falklandinseln (Malwinen)` no Chrome. O React declarava `Hydration failed` e
 * **descartava a árvore inteira vinda do servidor**. O mapa que o servidor
 * entregou pronto era jogado fora por causa do nome de uma ilha.
 *
 * ## O que ainda é decidido aqui
 *
 * Só a interação. O App Router renderiza este componente no servidor de
 * qualquer forma, então os ~200 `<path>` já saem coloridos no HTML da primeira
 * resposta — que é a razão de a página existir: ser lida por buscador e por
 * motor de resposta, não só por navegador com JavaScript ligado.
 *
 * ## O país sem cobertura tem DESENHO próprio, não uma cor mais fraca
 *
 * Ele é preenchido com uma hachura diagonal, e não com um cinza qualquer.
 * Cinza claro seria só mais uma cor da escala, e a pessoa leria "morno". A
 * hachura não se confunde com nenhuma das cinco fases nem em preto e branco
 * nem para quem não distingue vermelho de verde, e diz o que precisa dizer:
 * aqui não há medição.
 *
 * Os países pequenos demais para ter polígono na escala 1:110m (Malta,
 * Singapura, Barbados, Maurício, entre outros) entram como círculo, pela camada
 * de pontos do próprio Natural Earth. Sumir do mapa e não ter dado seriam
 * indistinguíveis, e um deles é falso.
 *
 * ## Por que o clique no mapa não navega
 *
 * Porque no celular só existe o toque: se a forma fosse um link, quem tocasse
 * para VER a leitura de um país seria levado embora da página antes de lê-la.
 * O toque seleciona; o link para `/{código}` fica no painel do país selecionado
 * e na tabela abaixo — que tem todos os países cobertos, é HTML de verdade e é
 * por onde rastreador e leitor de tela chegam a cada mercado.
 *
 * ## Sem variante escura
 *
 * Seguindo o cartão do laudo: o aplicativo tem a classe `.dark` no
 * `globals.css` herdada do shadcn, mas nenhum `ThemeProvider` montado — não há
 * modo escuro para respeitar hoje, e inventar um só para esta página criaria um
 * segundo tema que ninguém consegue ligar.
 */

export interface HiringMapViewProps {
  model: HiringMapModel
}

/** Quadradinho de cor. SVG, e não `<span style>` — ver `PHASE_CHIP`. */
function Swatch({ fill, size = 14 }: { fill: string; size?: number }) {
  return (
    <svg width={size} height={size} aria-hidden="true" className="shrink-0 rounded-sm">
      <rect width={size} height={size} rx="2" fill={fill} />
    </svg>
  )
}

export function HiringMapView({ model }: HiringMapViewProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const t = model.text
  const selectedCountry = selected ? model.countries[selected] ?? null : null
  const selectedShape = selected ? model.shapes[selected] ?? null : null

  return (
    <div className="space-y-10">
      {/* ------------------------------------------------------------------ */}
      {/* Cabeçalho                                                          */}
      {/* ------------------------------------------------------------------ */}
      <header className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">{t.heading}</h1>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">{t.intro}</p>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* O agregado: distribuição de fases + amplitude líquida               */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label={t.indexHeading}
        className="rounded-2xl border border-slate-200 bg-white shadow-xs p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">{t.indexHeading}</h2>
            <p className="text-xs text-slate-600 mt-1">{t.indexSummary}</p>
          </div>
          <div className="text-start sm:text-end">
            <div className="text-3xl font-bold text-brand-navy tabular-nums">{t.netBreadth}</div>
            <div className="text-xs font-semibold text-slate-600">{t.netBreadthLabel}</div>
          </div>
        </div>

        <ul className="space-y-2">
          {model.bars.map((bar) => (
            <li key={bar.phase} className="flex items-center gap-3">
              <Swatch fill={bar.fill} size={12} />
              <span className="text-xs font-medium text-slate-700 w-32 sm:w-40 shrink-0">
                {bar.label}
              </span>
              {/* Barra em SVG: a largura é calculada, e atributo de
                  apresentação do SVG passa pela CSP — `style` não passa. */}
              <svg className="flex-1 h-2" preserveAspectRatio="none" aria-hidden="true">
                <rect width="100%" height="100%" rx="4" fill="#f1f5f9" />
                <rect width={`${bar.sharePercent}%`} height="100%" rx="4" fill={bar.fill} />
              </svg>
              <span className="text-xs tabular-nums text-slate-600 w-24 text-end shrink-0">
                {bar.countLabel} · {bar.shareLabel}
              </span>
            </li>
          ))}

          {/* Coberto mas sem histórico bastante. Não é fase, e não é "sem
              fonte" — as três frases são diferentes e as três aparecem. */}
          <li className="flex items-center gap-3 pt-1 border-t border-slate-100">
            <Swatch fill="#cbd5e1" size={12} />
            <span className="text-xs font-medium text-slate-700 w-32 sm:w-40 shrink-0">
              {t.unclassifiedLabel}
            </span>
            <span className="flex-1" />
            <span className="text-xs tabular-nums text-slate-600 w-24 text-end shrink-0">
              {t.unclassifiedCount}
            </span>
          </li>
        </ul>

        <p className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{t.netBreadthHint}</span>
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* O mapa                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label={t.heading} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-2 sm:p-4">
          <svg viewBox={WORLD_MAP_VIEWBOX} role="img" aria-label={t.heading} className="w-full h-auto">
            <defs>
              <pattern
                id={NO_DATA_PATTERN}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" fill="#eef2f7" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="2" />
              </pattern>
            </defs>

            {WORLD_MAP_SHAPES.map((shape) => (
              <path
                key={shape.code}
                d={shape.d}
                fill={model.shapes[shape.code].fill}
                stroke="#ffffff"
                strokeWidth={0.5}
                opacity={selected && selected !== shape.code ? 0.85 : 1}
                onPointerEnter={() => setSelected(shape.code)}
                onClick={() => setSelected(shape.code)}
              >
                <title>{model.shapes[shape.code].title}</title>
              </path>
            ))}

            {WORLD_MAP_MARKERS.map((marker) => (
              <circle
                key={marker.code}
                cx={marker.cx}
                cy={marker.cy}
                r={3.5}
                fill={model.shapes[marker.code].fill}
                stroke="#ffffff"
                strokeWidth={1}
                onPointerEnter={() => setSelected(marker.code)}
                onClick={() => setSelected(marker.code)}
              >
                <title>{model.shapes[marker.code].title}</title>
              </circle>
            ))}
          </svg>
        </div>

        <p className="text-xs text-slate-500">{t.interactionHint}</p>

        {/* Painel do país selecionado. Nunca fica vazio: sem seleção ele mostra
            a legenda inteira, que é o que a pessoa precisa para ler o mapa. */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          {selectedCountry ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-brand-navy">{selectedCountry.name}</h3>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${selectedCountry.chipClass}`}
                >
                  {selectedCountry.statusLabel}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedCountry.statusHint}</p>

              {/* O aviso de impressão preliminar vem antes da linha de fonte:
                  é a ressalva que muda como o número deve ser lido. */}
              {selectedCountry.preliminary && (
                <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  {t.preliminaryNote}
                </p>
              )}

              <p className="text-[11px] text-slate-500">
                {selectedCountry.sourceLine}
                {selectedCountry.sourceLine && selectedCountry.periodLine ? ' · ' : ''}
                {selectedCountry.periodLine}
              </p>

              <Link
                href={selectedCountry.href}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                {selectedCountry.linkLabel}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          ) : selectedShape ? (
            <div className="space-y-1">
              <h3 className="text-base font-bold text-brand-navy">{selectedShape.name}</h3>
              <p className="text-sm text-slate-700">{t.noDataLabel}</p>
              <p className="text-xs text-slate-500">{t.noDataHint}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-brand-navy">{t.legendHeading}</h3>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {model.legend.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-xs text-slate-700">
                    {/* A hachura da legenda é a MESMA do mapa, para o estado
                        "sem dado" não ser descrito por um quadrado que ele não
                        usa. */}
                    <Swatch fill={item.fill} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Por continente — a distribuição SEMPRE ao lado da cobertura        */}
      {/*                                                                    */}
      {/* O §2.56 recusou este recorte com um argumento certo: "África: 60%  */}
      {/* aquecendo" seria uma afirmação sobre os 12 países medidos          */}
      {/* apresentada como afirmação sobre 54. Ele volta aqui só porque a    */}
      {/* barra tem como denominador o CONTINENTE INTEIRO, não os países     */}
      {/* cobertos: o pedaço sem fonte sai hachurado, com a mesma hachura do */}
      {/* mapa, e a contagem absoluta fica na coluna ao lado. Uma barra      */}
      {/* quase toda hachurada é uma frase, e é a frase verdadeira.          */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label={t.continentHeading} className="space-y-3">
        <h2 className="text-lg font-bold text-brand-navy">{t.continentHeading}</h2>

        {/* A hachura desta seção, declarada por ela. Ver
            `CONTINENT_NO_DATA_PATTERN`: depender do `<defs>` do mapa faria as
            barras perderem exatamente o pedaço que elas existem para mostrar
            se o mapa saísse do ar ou mudasse de lugar. */}
        <svg width="0" height="0" aria-hidden="true" className="absolute h-0 w-0">
          <defs>
            <pattern
              id={CONTINENT_NO_DATA_PATTERN}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill="#eef2f7" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="2" />
            </pattern>
          </defs>
        </svg>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="text-start font-semibold px-3 py-2">{t.colContinent}</th>
                <th scope="col" className="text-start font-semibold px-3 py-2">{t.colPhase}</th>
                <th scope="col" className="text-start font-semibold px-3 py-2 whitespace-nowrap">
                  {t.colCoverage}
                </th>
              </tr>
            </thead>
            <tbody>
              {model.continents.map((row) => (
                <tr key={row.continent} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                    {row.name}
                  </td>
                  <td className="px-3 py-2 min-w-[10rem]">
                    {/* SVG, e não `<div style={{width}}>`: a CSP do projeto não
                        declara `style-src` e bloqueia estilo em linha. */}
                    <svg
                      className="w-full h-2.5"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label={row.barLabel}
                    >
                      <title>{row.barLabel}</title>
                      <rect width="100%" height="100%" rx="4" fill="#f1f5f9" />
                      {row.bar.map((segment, i) => (
                        <rect
                          key={`${segment.kind}-${i}`}
                          x={`${segment.xPercent}%`}
                          width={`${segment.widthPercent}%`}
                          height="100%"
                          fill={segment.fill}
                        />
                      ))}
                    </svg>
                  </td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap tabular-nums">
                    {row.coverageLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{t.continentHint}</span>
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Tabela — todos os países cobertos, com link para a página de cada   */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label={t.tableHeading} className="space-y-3">
        <h2 className="text-lg font-bold text-brand-navy">{t.tableHeading}</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="text-start font-semibold px-3 py-2">{t.colCountry}</th>
                <th scope="col" className="text-start font-semibold px-3 py-2">{t.colPhase}</th>
                <th scope="col" className="text-start font-semibold px-3 py-2">{t.colSource}</th>
                <th scope="col" className="text-start font-semibold px-3 py-2">{t.colPeriod}</th>
              </tr>
            </thead>
            <tbody>
              {model.ordered.map((code) => {
                const country = model.countries[code]
                return (
                  <tr key={code} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <Link href={country.href} className="font-medium text-primary hover:underline">
                        {country.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Swatch fill={country.fill} size={10} />
                        {country.statusLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{country.sourceName ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {country.periodLabel ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Método, fontes e créditos                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4 text-sm text-slate-700">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-brand-navy">{t.methodHeading}</h2>
          <p className="leading-relaxed max-w-3xl">{t.methodBody}</p>
          <p className="leading-relaxed max-w-3xl text-slate-600">{t.comparisonNote}</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-brand-navy">{t.sourcesHeading}</h2>
          <ul className="list-disc ps-5 space-y-1 text-slate-600">
            {model.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500 space-x-2">
          {t.updatedLine && <span>{t.updatedLine}</span>}
          <span>{t.mapCredit}</span>
        </p>
      </section>
    </div>
  )
}
