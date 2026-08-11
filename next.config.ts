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
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
