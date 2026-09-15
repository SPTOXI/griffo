/**
 * Gera `public/world-map-bg.svg` — silhueta decorativa do mapa-múndi para o
 * fundo da seção "Vagas por país" da home (`landing.tsx`).
 *
 * Roda uma vez, à mão (`npx tsx src/scripts/build-world-map-bg-svg.ts`), não
 * a cada build: o resultado é um arquivo estático versionado, sem custo de
 * JS no cliente — mesmos paths de `lib/hiring-index/world-map.ts` (Natural
 * Earth 1:110m, domínio público), só que aqui vira imagem, não dado
 * interativo. Sem cor por país, sem legenda: é decoração, não o mapa de
 * contratação que já existe em `/market-pulse`.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { WORLD_MAP_SHAPES, WORLD_MAP_VIEWBOX } from '../lib/hiring-index/world-map'

const FILL = '#CBD5E1' // slate-300 — visível mas discreto sobre bg-white

const paths = WORLD_MAP_SHAPES.map((shape) => `<path d="${shape.d}"/>`).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WORLD_MAP_VIEWBOX}" fill="${FILL}">${paths}</svg>\n`

const outPath = resolve(__dirname, '../../public/world-map-bg.svg')
writeFileSync(outPath, svg, 'utf-8')

console.log(`Escrito: ${outPath} (${(svg.length / 1024).toFixed(1)} KB)`)
