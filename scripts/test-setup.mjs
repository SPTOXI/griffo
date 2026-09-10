/**
 * Carregado por `npm test` (via --import). Só neutraliza o pacote-marcador
 * `server-only`; nenhum comportamento de produto muda aqui.
 *
 * `server-only` não tem implementação: seu `index.js` lança um erro e nada
 * mais. É assim que o Next impede que um módulo de servidor (`lib/db.ts`,
 * `lib/entitlements.ts`, o roteador de IA) seja arrastado para o bundle do
 * cliente. Fora do Next, porém, QUALQUER import dele lança — e era isso que
 * deixava justamente os módulos mais críticos do produto sem como serem
 * testados.
 *
 * `registerHooks` (síncrono, no mesmo thread) intercepta tanto `import` quanto
 * `require`, o que importa aqui: o tsx transpila os `.ts` deste projeto para
 * CommonJS, e um hook só de ESM (`module.register`) não é consultado no
 * `require('server-only')` — testado, não suposto.
 *
 * Alternativas descartadas antes desta:
 *
 * - `--conditions=react-server` (o pacote publica essa condição apontando para
 *   um `empty.js`): resolveria o `server-only`, mas muda a resolução de TODOS
 *   os pacotes que publicam a condição. Medido: a suíte caiu de 938 para 907
 *   testes, com 2 falhas — encolher em silêncio é o cenário que a seção 8 do
 *   documento de continuidade classifica como grave.
 * - `mock.module` do `node:test`: experimental no Node 22, exige outra flag e
 *   tem o mesmo alcance global.
 *
 * Este arquivo NÃO substitui módulo nenhum do produto. Quem precisa trocar o
 * cliente do banco num teste faz isso pelo `globalThis.prisma`, que é o mesmo
 * ponto que `lib/db.ts` já usa para sobreviver ao hot reload.
 */
import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'

const NEUTRALIZADOS = new Set(['server-only', 'client-only'])
const VAZIO = pathToFileURL(new URL('./empty-module.js', import.meta.url).pathname).href

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (NEUTRALIZADOS.has(specifier)) {
      return { url: VAZIO, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})
