import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança.
 *
 * A CSP aqui é deliberadamente parcial. As diretivas abaixo restringem de
 * verdade e não dependem de nonce; `script-src` depende, porque o Next injeta
 * scripts inline para hidratação — declará-lo sem nonce exigiria
 * `'unsafe-inline'`, que não protege contra nada e só daria aparência de
 * proteção. O `script-src` com nonce gerado no middleware fica para quando
 * houver orçamento de teste para ele (E7 continua parcialmente aberto no
 * PLANO-MELHORIAS).
 */
const securityHeaders = [
  {
    // Só tem efeito sobre HTTPS; o navegador ignora em localhost.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Impede que o navegador adivinhe o tipo de um download (ex.: tratar um
    // currículo enviado como HTML e executá-lo).
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Clickjacking. `frame-ancestors` na CSP é o mecanismo moderno; este fica
    // para navegadores que só entendem o antigo.
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Não vaza o caminho completo (que inclui IDs de currículo) para terceiros.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Isola o contexto de navegação da janela contra ataques XS-Leaks e Spectre (OWASP ASVS).
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    // Impede que outros domínios carreguem recursos desta aplicação sem autorização explícita.
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    // Impede vazamento de requisições DNS especulativas do navegador.
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  {
    // A sintaxe de Permissions-Policy é "structured header": itens de
    // allowlist exigem aspas DUPLAS. A aspa simples (estilo CSP) que estava
    // aqui não é um item válido para o parser e derruba a diretiva inteira —
    // é exatamente o erro "Parse of permissions policy failed" reportado
    // pelo Chrome DevTools/Lighthouse.
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com"), usb=(), interest-cohort=()',
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      // Sem `style-src` explícito, `default-src 'self'` vira o fallback e
      // bloqueia todo `style=` inline — inclusive o que bibliotecas de UI
      // (Radix, sonner, recharts) injetam em runtime para posicionamento e
      // animação, fora do nosso controle. Mesmo nível de permissividade já
      // aceito em `script-src` acima.
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https: wss:",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https:",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/**
 * Política de cache.
 *
 * O Next serve página prerenderizada com `Cache-Control: s-maxage=31536000` —
 * um ano de cache compartilhado no DOCUMENTO HTML. A CDN da própria Vercel
 * expurga isso a cada deploy, então lá o problema é invisível; um cache
 * intermediário na frente do domínio, não. Ele nunca fica sabendo que houve
 * deploy, continua servindo o HTML antigo, e esse HTML aponta para chunks de
 * JavaScript com hash de conteúdo que **não existem mais**. O sintoma é o pior
 * possível: um deploy que corrigiu o problema ainda renderiza como página
 * quebrada, e nada no servidor indica isso.
 *
 * São três casos, e tratá-los junto é que estava errado nas duas pontas — o
 * `no-store` genérico que existiu aqui até o commit `2888b3d` marcava também os
 * assets com hash como não-cacheáveis, jogando fora a performance, e teria
 * marcado as rotas de API como `public`.
 *
 * | Alvo            | Política                              | Por quê |
 * |-----------------|---------------------------------------|---------|
 * | Documento HTML  | `public, max-age=0, must-revalidate`   | Cache pode guardar, mas revalida na origem: deploy aparece na hora, e página sem mudança custa só um 304 |
 * | `/api/*`        | `no-store, no-cache, must-revalidate`  | Resposta por usuário (cookie de sessão) ou de admin; nunca pode cair em cache compartilhado |
 * | `/_next/static` | `public, max-age=31536000, immutable`  | O nome do arquivo muda quando os bytes mudam; cachear para sempre é o comportamento correto |
 *
 * O `source` do documento exclui os outros dois por expressão regular em vez de
 * depender da ordem das regras: assim não há dúvida sobre qual valor prevalece
 * quando mais de uma casa com o mesmo caminho.
 */
const HTML_ONLY = '/:path((?!api/|_next/static/).*)'

const nextConfig: NextConfig = {
  /**
   * O que o rastreador copia para dentro de cada função — e o que não precisa.
   *
   * ## O problema, medido
   *
   * O `@prisma/client` publica, num diretório só, os runtimes de TODOS os
   * ambientes que suporta (Node, edge, WASM, React Native, browser) e os
   * motores de TODOS os bancos. O rastreador do Next não sabe qual deles o
   * processo vai carregar, então copia tudo — para CADA função. São 61 rotas
   * de API aqui, e o trace real do build (`.nft.json`, somando os arquivos de
   * todas as funções) dava **1.677 MB por deployment**, dos quais **1.508 MB
   * eram Prisma**. O plano Hobby dá 10 GB de Functions Storage somando TODOS
   * os deployments retidos: meia dúzia de previews estoura a cota.
   *
   * ## O que sai, e por quê
   *
   * A configuração aqui é `provider = "postgresql"`, `prisma-client-js`, motor
   * de biblioteca, runtime de Node. O cliente gerado
   * (`node_modules/.prisma/client/index.js`) tem UM require de runtime, fixo no
   * código: `require('@prisma/client/runtime/library.js')`. Todo o resto do
   * diretório `runtime/` é alcançável apenas por caminhos que esta configuração
   * não tem — e nenhuma rota declara `export const runtime = 'edge'`, nem o
   * middleware toca no banco.
   *
   * | Saiu | Por função | × 61 | Só é alcançado por |
   * |---|---|---|---|
   * | `query_engine_bg.postgresql.*` | 2,2 MB | 138 MB | `wasm-engine-edge` (runtime edge) |
   * | `query_compiler_bg.postgresql.*` | 1,8 MB | 115 MB | preview `queryCompiler`, não habilitado |
   * | `binary.*` | 1,3 MB | 80 MB | `engineType = "binary"` |
   * | `client.js` / `client.mjs` | 0,4 MB | 26 MB | gerador `prisma-client` (novo), não este |
   * | `wasm-compiler-edge.*` | 0,4 MB | 23 MB | runtime edge |
   * | `edge.js` / `edge-esm.js` | 0,3 MB | 20 MB | `@prisma/client/edge` |
   * | `wasm-engine-edge.*` | 0,3 MB | 16 MB | runtime edge |
   * | `*.d.ts` / `*.d.mts` do runtime | 0,2 MB | 15 MB | TypeScript — nunca executa |
   * | `react-native.js` | 0,2 MB | 11 MB | React Native |
   * | `.prisma/client/edge.js` | 0,2 MB | 13 MB | `@prisma/client/edge` |
   * | `index-browser.js` (os dois) | 0,05 MB | 4 MB | bundle de browser |
   * | motores de mysql/sqlite/sqlserver/cockroachdb | 16,5 MB | 1.000 MB | outros bancos |
   *
   * ## Como isso foi verificado, e não deduzido
   *
   * Os 27 arquivos foram REMOVIDOS de `node_modules` e o cliente foi exercitado
   * em CJS (`require`) e em ESM (`import`), com `findMany` + `include` de
   * relação, `$transaction` e `$queryRaw`. Nos dois casos o cliente carregou, o
   * motor nativo subiu e a query foi compilada — o único erro foi de conexão
   * (`PrismaClientInitializationError: Can't reach database server`), que é o
   * esperado sem banco. Se algum deles fosse necessário, o erro teria sido de
   * módulo ausente, antes de chegar à conexão.
   *
   * ## O que FICA, e não pode sair
   *
   * - `.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node` — 16,7 MB
   *   por função, 1.019 MB por deployment: o motor de verdade. É o maior item
   *   isolado que resta, e o único jeito de tirá-lo é trocar o motor nativo por
   *   driver adapter (`@prisma/adapter-pg` + preview `queryCompiler`), que é
   *   migração com risco de runtime e precisa de banco para ser testada.
   * - `runtime/library.js` — o require fixo do cliente gerado.
   * - `runtime/library.mjs` — o gêmeo ESM do ÚNICO arquivo que é usado de fato.
   *   As sondas passaram sem ele, mas é o único do diretório onde uma condição
   *   de exports do empacotador poderia virar a escolha; 12 MB somados não
   *   pagam esse risco.
   * - `.prisma/client/schema.prisma`, `index.js`, `default.js`, `package.json`.
   *
   * Se algum dia o projeto ganhar um segundo banco, ou uma rota em runtime
   * edge, esta lista é o primeiro lugar a olhar.
   */
  outputFileTracingExcludes: {
    '**': [
      // Bancos que este projeto não usa.
      'node_modules/@prisma/client/runtime/query_engine_bg.mysql.*',
      'node_modules/@prisma/client/runtime/query_engine_bg.sqlite.*',
      'node_modules/@prisma/client/runtime/query_engine_bg.sqlserver.*',
      'node_modules/@prisma/client/runtime/query_engine_bg.cockroachdb.*',
      'node_modules/@prisma/client/runtime/query_compiler_bg.mysql.*',
      'node_modules/@prisma/client/runtime/query_compiler_bg.sqlite.*',
      'node_modules/@prisma/client/runtime/query_compiler_bg.sqlserver.*',
      'node_modules/@prisma/client/runtime/query_compiler_bg.cockroachdb.*',
      // Postgres em WASM: só o runtime edge o carrega, e não há rota edge.
      'node_modules/@prisma/client/runtime/query_engine_bg.postgresql.*',
      // Compilador de query: só com o preview `queryCompiler`, não habilitado.
      'node_modules/@prisma/client/runtime/query_compiler_bg.postgresql.*',
      // Runtimes de ambientes que não existem aqui.
      'node_modules/@prisma/client/runtime/binary.*',
      'node_modules/@prisma/client/runtime/edge.js',
      'node_modules/@prisma/client/runtime/edge-esm.js',
      'node_modules/@prisma/client/runtime/wasm-engine-edge.*',
      'node_modules/@prisma/client/runtime/wasm-compiler-edge.*',
      'node_modules/@prisma/client/runtime/react-native.js',
      'node_modules/@prisma/client/runtime/index-browser.js',
      // Runtime do gerador `prisma-client`; aqui o gerador é `prisma-client-js`.
      'node_modules/@prisma/client/runtime/client.js',
      'node_modules/@prisma/client/runtime/client.mjs',
      // Tipos não executam.
      'node_modules/@prisma/client/runtime/*.d.ts',
      'node_modules/@prisma/client/runtime/*.d.mts',
      // Entradas do cliente gerado para edge e para browser.
      'node_modules/.prisma/client/edge.js',
      'node_modules/.prisma/client/index-browser.js',
      'node_modules/.prisma/client/wasm.js',
    ],
  },

  /**
   * Pacotes que o servidor carrega do disco, sem passar pelo empacotador.
   *
   * `pdf-parse` depende de `@napi-rs/canvas` — um binário nativo `.node` — e
   * carrega um worker do próprio pacote. Nenhum dos dois sobrevive ao webpack:
   * ele os reescreve como módulos empacotados, o `require` falha em tempo de
   * execução, e `parsePdfBuffer` cai no `catch` que devolve string vazia.
   *
   * O efeito era invisível em desenvolvimento e sistemático em produção: o PDF
   * era declarado "sem texto selecionável", caía na transcrição por imagem —
   * cara e lenta — e essa, por sua vez, estourava o tempo. Um PDF do LinkedIn
   * com 8.130 caracteres de texto perfeitamente extraível chegava ao usuário
   * como ilegível.
   *
   * `pdfkit` está aqui pelo mesmo motivo: lê arquivos de fonte do disco.
   */
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas', 'pdfkit'],
  images: {
    /**
     * O padrão do Next pula de 128 para 256 — para um logo fixo de ~94px
     * exibido (188px em tela retina), isso força o otimizador a servir
     * 256px, quase o dobro do necessário. Os 192 aqui fecham esse buraco
     * só para imagens de largura fixa nessa faixa (ícones, logo do
     * cabeçalho); não afeta imagens que já usam `sizes`/`fill`.
     */
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 384],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: HTML_ONLY,
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
