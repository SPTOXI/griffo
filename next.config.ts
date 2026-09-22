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
   * Motores de banco que este projeto nunca vai usar.
   *
   * ## O problema, medido
   *
   * O `@prisma/client` publica os motores de TODOS os bancos que suporta, e o
   * rastreador do Next os copia para dentro de CADA função. São 61 rotas de
   * API aqui, e o rastro real do build mostrava, por deployment:
   *
   * | | por função | × 61 |
   * |---|---|---|
   * | `libquery_engine` nativo (necessário) | 17,5 MB | 1,07 GB |
   * | WASM de cockroachdb, mysql, sqlserver, sqlite | 9,0 MB | 0,55 GB |
   * | compiladores dos mesmos quatro | 7,5 MB | 0,46 GB |
   *
   * A conta fecha em ~2,4 GB de Prisma por deployment, e o plano Hobby dá
   * 10 GB de Functions Storage somando TODOS os deployments retidos — o que
   * significa que meia dúzia de previews estoura a cota.
   *
   * ## O recorte, e por que ele é seguro
   *
   * O `datasource` é `postgresql` (Supabase). Um motor de MySQL, SQLite,
   * SQL Server ou CockroachDB não tem como ser carregado em tempo de execução:
   * não existe caminho de código que o alcance com esta configuração.
   *
   * O que **fica**: o `libquery_engine` nativo, que é o motor de verdade, e os
   * arquivos `postgresql` — engine e compilador. Excluí-los quebraria a
   * aplicação inteira, e nenhuma economia justifica isso.
   *
   * Reduz ~16,5 MB por função, ~1 GB por deployment — cerca de 40% do peso do
   * Prisma, com zero risco. O resto do 1,07 GB só sai trocando o motor nativo
   * por driver adapter, que é migração de verdade e não cabe aqui.
   *
   * Se algum dia o projeto ganhar um segundo banco, esta lista é o primeiro
   * lugar a olhar — e o build vai falhar alto, não em silêncio.
   */
  outputFileTracingExcludes: {
    '**': [
      'node_modules/@prisma/client/runtime/query_engine_bg.mysql.*',
      'node_modules/@prisma/client/runtime/query_engine_bg.sqlite.*',
      'node_modules/@prisma/client/runtime/query_engine_bg.sqlserver.*',
      'node_modules/@prisma/client/runtime/query_engine_bg.cockroachdb.*',
      'node_modules/@prisma/client/runtime/query_compiler_bg.mysql.*',
      'node_modules/@prisma/client/runtime/query_compiler_bg.sqlite.*',
      'node_modules/@prisma/client/runtime/query_compiler_bg.sqlserver.*',
      'node_modules/@prisma/client/runtime/query_compiler_bg.cockroachdb.*',
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
