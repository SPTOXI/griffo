/**
 * Links dos e-mails do envio sem conta.
 *
 * Todo link de e-mail passa por `/api/public/lead-click`, que grava o clique
 * (`lead_email_clicked`, por passo) e redireciona ao resultado com UTM. Assim
 * o painel mostra, por e-mail, quantos saíram e quantos voltaram.
 */
export const LEAD_EMAIL_STEPS = ['result', 'nurture1', 'nurture2', 'nurture3'] as const
export type LeadEmailStep = (typeof LEAD_EMAIL_STEPS)[number]

export function isLeadEmailStep(v: string | null | undefined): v is LeadEmailStep {
  return (LEAD_EMAIL_STEPS as readonly string[]).includes(v ?? '')
}

/** O link que vai no e-mail. */
export function leadClickUrl(appUrl: string, token: string, step: LeadEmailStep): string {
  return `${appUrl}/api/public/lead-click?t=${token}&s=${step}`
}

/** Para onde o clique leva: o resultado, com UTM para a visita entrar no funil. */
export function leadResultUrl(appUrl: string, token: string, step: LeadEmailStep): string {
  return `${appUrl}/?lead=${token}&utm_source=email&utm_medium=lead&utm_campaign=${step}`
}
