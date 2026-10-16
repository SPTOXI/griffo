export const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000
/**
 * Duas contagens de falha, e as duas na mesma janela.
 *
 * Por conta E origem (10): é a que barra a força bruta comum. Contar só por
 * conta deixava qualquer pessoa que soubesse o e-mail trancar o dono fora —
 * dez senhas erradas e o dono recebia 429 mesmo acertando a senha, de novo a
 * cada 15 minutos, para sempre. Com a origem na chave, quem erra fica de fora
 * e o dono, vindo de outro endereço, entra.
 *
 * Só por conta (100): teto para força bruta espalhada por muitos endereços
 * (o limitador do middleware é por IP e em memória por instância, e sozinho
 * não segura isso). Passado o teto, só entra quem chega de uma origem SEM
 * falha na janela: o dono, de casa, continua entrando; cada endereço novo do
 * atacante ganha uma tentativa e fica de fora.
 *
 * A origem entra como hash (`ipKeyFor`, que já agrupa o /64 do IPv6), nunca
 * como IP em texto.
 */
export const MAX_FAILED_LOGINS_PER_ORIGIN = 10
export const MAX_FAILED_LOGINS_PER_ACCOUNT = 100

/** `true` se esta tentativa de login deve receber 429, dadas as falhas recentes. */
export function loginBlocked(failuresFromOrigin: number, failuresOnAccount: number): boolean {
  if (failuresFromOrigin >= MAX_FAILED_LOGINS_PER_ORIGIN) return true
  return failuresOnAccount >= MAX_FAILED_LOGINS_PER_ACCOUNT && failuresFromOrigin > 0
}
