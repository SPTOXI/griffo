/**
 * O envio pelo Resend.
 *
 * ## Por que `fetch` e não o pacote `resend`
 *
 * A API é um POST com JSON. O pacote acrescentaria uma dependência, um ciclo de
 * atualização e uma camada a mais entre o erro e o log — em troca de nada que
 * este caminho use. Com `fetch` o corpo da resposta de erro chega inteiro ao
 * log, que é exatamente o que se quer quando uma mensagem não sai.
 *
 * ## Nunca observado contra a API real
 *
 * O ambiente de desenvolvimento não tem saída de rede para hosts externos, e a
 * regra desta casa é escrever contra o payload OBSERVADO. Este módulo é a
 * exceção declarada: foi escrito contra a documentação, e o primeiro envio de
 * verdade é o primeiro teste de verdade.
 *
 * Por isso o `deps.fetch` existe. Não é abstração por gosto: é o que permite
 * exercitar a montagem da requisição — cabeçalhos, corpo, tratamento de erro —
 * sem rede, e o que vai permitir corrigir o formato depressa quando a primeira
 * resposta real mostrar algo diferente do esperado.
 *
 * ## O prazo
 *
 * A rodada inteira cabe em 60s. Um `fetch` sem prazo pendura a invocação até a
 * plataforma matá-la, e aí não há log nem resultado — só um 504 que não conta
 * o que aconteceu.
 *
 * ## Por que a configuração entra por parâmetro
 *
 * `lib/env.ts` importa `server-only`, e módulo que o importe não pode ser
 * exercitado por teste unitário. Como a montagem da requisição é justamente o
 * que este arquivo precisa acertar sem nunca ter visto a API real, ela fica
 * aqui, testável, e quem lê o ambiente é quem chama.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const SEND_TIMEOUT_MS = 10_000

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
  /** Cabeçalhos extras — é por aqui que passa o `List-Unsubscribe`. */
  headers?: Record<string, string>
}

export interface SendDeps {
  fetch: typeof globalThis.fetch
}

export interface ResendConfig {
  apiKey: string
  /** Remetente. O domínio precisa estar verificado no Resend. */
  from: string
  /** Para onde vai a resposta — o remetente é uma caixa que só envia. */
  replyTo: string
}

/**
 * Falha de envio.
 *
 * Tipo próprio porque quem chama precisa distinguir "não saiu" de qualquer
 * outra coisa que der errado na rodada: um alerta cujo e-mail não saiu NÃO
 * pode ser marcado como avisado.
 *
 * A mensagem é para o log. §10.9: nada disto vai para tela nenhuma.
 */
export class EmailSendError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'EmailSendError'
  }
}

export async function sendEmail(
  message: EmailMessage,
  config: ResendConfig,
  deps: SendDeps = { fetch: globalThis.fetch }
): Promise<{ id: string }> {
  const body = {
    from: config.from,
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
    reply_to: config.replyTo,
    ...(message.headers ? { headers: message.headers } : {}),
  }

  let response: Response
  try {
    response = await deps.fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    })
  } catch (e: any) {
    throw new EmailSendError(`Resend inacessível: ${e?.message || e}`)
  }

  if (!response.ok) {
    // O corpo do erro do Resend diz o que está errado — domínio não verificado,
    // chave inválida, destinatário recusado. Perder isso transforma uma
    // configuração errada numa investigação.
    const detail = await response.text().catch(() => '')
    throw new EmailSendError(
      `Resend recusou o envio (HTTP ${response.status}): ${detail.slice(0, 500)}`,
      response.status
    )
  }

  const payload = (await response.json().catch(() => null)) as { id?: string } | null
  return { id: payload?.id || '' }
}

/**
 * Os cabeçalhos que fazem o descadastro aparecer no cliente de e-mail.
 *
 * O Gmail e o Outlook mostram um botão próprio de "cancelar inscrição" quando
 * estes dois cabeçalhos estão presentes (RFC 8058). Isso importa por um motivo
 * prático de reputação: sem o botão, quem quer parar de receber clica em
 * "marcar como spam", e é a marcação de spam — não o descadastro — que queima
 * o domínio.
 *
 * O `List-Unsubscribe-Post` faz o clique virar um POST direto, sem página de
 * confirmação. É por isso que a rota trata GET e POST de formas diferentes: o
 * POST vem de uma ação explícita da pessoa dentro do cliente de e-mail, e o GET
 * pode ser um verificador de link abrindo a URL sozinho.
 */
export function listUnsubscribeHeaders(url: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}
