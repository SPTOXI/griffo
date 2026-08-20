import { createHmac, timingSafeEqual } from 'crypto'

/**
 * O token do link de descadastro do digest.
 *
 * ## Por que ele é assinado, e não um id na URL
 *
 * O descadastro precisa funcionar sem sessão: quem quer parar de receber
 * e-mail não vai fazer login para isso, e exigir login é o mesmo que não
 * oferecer a saída. Mas uma URL com o id do usuário em texto puro deixa
 * qualquer um desligar o Radar de qualquer pessoa trocando o id.
 *
 * A assinatura resolve os dois lados: o link vale sem sessão e só vale para
 * quem o recebeu.
 *
 * ## Por que não expira
 *
 * Um link de descadastro é obrigação legal (LGPD Art. 18, GDPR Art. 21), e a
 * pessoa pode agir sobre um e-mail de três meses atrás. Um token expirado
 * transformaria o direito de sair numa mensagem de erro — pior do que não ter
 * mandado o e-mail.
 *
 * O risco de um token eterno é pequeno e assimétrico: o pior que ele faz é
 * desligar um aviso, ação reversível na própria tela do Radar. Não dá acesso a
 * nada nem revela dado nenhum.
 *
 * ## Por que o segredo entra por parâmetro
 *
 * Este módulo não lê ambiente e não importa `server-only`, e é por isso que ele
 * tem teste. Quem monta a chave a partir do ambiente é `unsubscribe.server.ts`.
 */

const SCOPE = 'radar-digest-unsubscribe.v1'

/**
 * A chave de descadastro, derivada do segredo de sessão.
 *
 * Derivada, e não a própria: assim não há variável de ambiente nova para
 * alguém esquecer de configurar, e mesmo assim um token de descadastro nunca
 * compartilha material de chave com o cookie de sessão — quem obtiver um não
 * chega no outro.
 */
export function unsubscribeKey(sessionSecret: string): Buffer {
  return createHmac('sha256', sessionSecret).update(SCOPE).digest()
}

/** O token de um usuário. Estável: o mesmo usuário, o mesmo token. */
export function unsubscribeToken(userId: string, sessionSecret: string): string {
  const payload = Buffer.from(userId, 'utf-8').toString('base64url')
  const sig = createHmac('sha256', unsubscribeKey(sessionSecret)).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

/**
 * O userId de um token válido, ou `null`.
 *
 * Nunca lança: atende uma rota pública, e uma exceção aqui vira 500 para quem
 * só queria sair da lista.
 */
export function userIdFromToken(
  token: string | null | undefined,
  sessionSecret: string
): string | null {
  if (!token || typeof token !== 'string') return null

  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null

  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', unsubscribeKey(sessionSecret)).update(payload).digest('base64url')

  try {
    const sigBuf = Buffer.from(sig, 'base64url')
    const expBuf = Buffer.from(expected, 'base64url')
    // Comprimentos diferentes fazem `timingSafeEqual` lançar, então a
    // comparação de tamanho vem antes — e sai por `null`, como todo o resto.
    if (sigBuf.length !== expBuf.length) return null
    if (!timingSafeEqual(sigBuf, expBuf)) return null
  } catch {
    return null
  }

  const userId = Buffer.from(payload, 'base64url').toString('utf-8')
  return userId || null
}
