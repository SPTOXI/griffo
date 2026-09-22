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
   * ## A lista depende do motor, e o motor mudou
   *
   * Com o driver adapter (`src/lib/db.ts`), o cliente gerado tem exatamente
   * três dependências de runtime, todas verificáveis no `require` do próprio
   * arquivo gerado:
   *
   * ```
   * .prisma/client/index.js
   *   ├─ ./query_compiler_bg.js  →  ./query_compiler_bg.wasm   (1,9 MB)
   *   └─ @prisma/client/runtime/client.js  →  só builtins do Node
   * ```
   *
   * Isso INVERTE a lista que existia aqui antes. Com o motor nativo, o único
   * runtime necessário era `library.js` e `client.js` era descartável; agora é
   * o contrário. Uma lista de exclusão herdada sem reconferir teria removido
   * justamente o runtime em uso — e o erro apareceria só em produção, no
   * primeiro acesso ao banco.
   *
   * `libquery_engine-*.so.node` NÃO aparece nesta lista de propósito. Ele
   * simplesmente deixa de ser gerado quando o gerador roda com
   * `queryCompiler`, e é assim que ele deve sumir: por ausência, não por
   * exclusão. Excluí-lo por nome seria plantar uma armadilha — o dia em que
   * alguém voltasse ao motor nativo, o build continuaria verde e o site cairia
   * inteiro em runtime.
   *
   * ## Como isso foi verificado, e não deduzido
   *
   * Os arquivos foram REMOVIDOS de `node_modules` e o cliente foi exercitado
   * em CJS (`require`) e em ESM (`import`). Ver também o cabeçalho de
   * `src/lib/db.ts` para a prova de paridade entre os dois motores.
   *
   * Se algum dia o projeto ganhar um segundo banco, uma rota em runtime edge,
   * ou voltar ao motor nativo, esta lista é o primeiro lugar a olhar.
   */
  outputFileTracingExcludes: {
    '**': [
      // Runtime do motor nativo e do motor binário: não são mais o caminho.
      'node_modules/@prisma/client/runtime/library.js',
      'node_modules/@prisma/client/runtime/library.mjs',
      'node_modules/@prisma/client/runtime/binary.js',
      'node_modules/@prisma/client/runtime/binary.mjs',
      // Motores WASM por banco, do pacote publicado: o compilador em uso é o
      // `.prisma/client/query_compiler_bg.wasm`, gerado para ESTE schema.
      'node_modules/@prisma/client/runtime/query_engine_bg.*',
      'node_modules/@prisma/client/runtime/query_compiler_bg.*',
      // Runtimes de ambientes que não existem aqui.
      'node_modules/@prisma/client/runtime/edge.js',
      'node_modules/@prisma/client/runtime/edge-esm.js',
      'node_modules/@prisma/client/runtime/wasm-engine-edge.*',
      'node_modules/@prisma/client/runtime/wasm-compiler-edge.*',
      'node_modules/@prisma/client/runtime/react-native.js',
      'node_modules/@prisma/client/runtime/index-browser.js',
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
