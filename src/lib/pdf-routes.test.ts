import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync, existsSync } from 'fs'
import { join, relative, sep } from 'path'
import { PDF_ROUTES, PDF_RUNTIME_FILES } from '../../next.config'

/**
 * Toda rota que lê PDF leva junto o que o pdfjs carrega em tempo de execução?
 *
 * ## O bug que criou este arquivo (§2.134)
 *
 * O pdfjs carrega `@napi-rs/canvas` e `pdf.worker.mjs` por caminho montado em
 * tempo de execução, e o rastreador da Vercel só copia para a função o que é
 * importado de forma estática. Em produção, todo PDF virava "sem texto" — o
 * `catch` de `parsePdfBuffer` devolve string vazia — e o sintoma era idêntico
 * ao de um PDF escaneado. Local funcionava, porque `node_modules` está inteiro.
 *
 * Uma rota nova que leia PDF sem entrar em `PDF_ROUTES` repetiria o bug em
 * silêncio. Este teste torna isso impossível de passar despercebido.
 */

const raiz = process.cwd()
const API = join(raiz, 'src/app/api')

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return routeFiles(full)
    return name === 'route.ts' ? [full] : []
  })
}

function routePath(file: string): string {
  const rel = relative(join(raiz, 'src/app'), file).split(sep).slice(0, -1).join('/')
  return `/${rel}`
}

test('toda rota que importa lib/pdf-text está em PDF_ROUTES, e só elas', () => {
  const readers = routeFiles(API)
    .filter((f) => /from ['"]@\/lib\/pdf-text['"]/.test(readFileSync(f, 'utf8')))
    .map(routePath)
    .sort()
  assert.deepEqual(readers, [...PDF_ROUTES].sort())
})

test('a lista leva o canvas (DOMMatrix) e o worker do pdfjs', () => {
  const files = PDF_RUNTIME_FILES.join('\n')
  assert.match(files, /@napi-rs\/canvas\//)
  assert.match(files, /@napi-rs\/canvas-linux-x64-gnu\//)
  assert.match(files, /pdfjs-dist\/legacy\/build\/pdf\.worker\.mjs/)
})

test('os caminhos declarados existem — um nome errado incluiria nada, em silêncio', () => {
  assert.ok(existsSync(join(raiz, 'node_modules/@napi-rs/canvas/package.json')))
  assert.ok(existsSync(join(raiz, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')))
})
