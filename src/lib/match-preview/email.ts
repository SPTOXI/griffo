import { escapeHtml } from '../email/digest'
import type { EmailMessage } from '../email/send'
import { fill, matchPreviewCopy } from './copy'

/**
 * O e-mail de "resultado pronto" do envio sem conta da landing.
 *
 * É transacional: a pessoa pediu o resultado e deu o endereço para recebê-lo.
 * Por isso não passa pela chave `RADAR_DIGEST_ENABLED`, que governa o envio em
 * massa do Radar, e não leva `List-Unsubscribe`: não há lista, é uma mensagem.
 *
 * Não cita vaga nenhuma pelo nome. O e-mail pode ser encaminhado, e a lista é
 * o que se vende; o link leva à tela, que decide o que mostrar.
 */
export interface LeadEmailInput {
  to: string
  lang: string
  resultUrl: string
  matches: number
  recruiterOptIn: boolean
}

export function buildLeadEmail(input: LeadEmailInput): EmailMessage {
  const c = matchPreviewCopy(input.lang)
  const body =
    input.matches > 1 ? fill(c.emailBodyMatches, { count: input.matches })
    : input.matches === 1 ? c.emailBodyOne
    : c.emailBodyNone
  const retention = input.recruiterOptIn ? c.emailKeepNote : c.emailDeleteNote
  const dir = input.lang === 'ar' ? 'rtl' : 'ltr'

  const html = [
    `<div dir="${dir}" style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0B192E">`,
    `<p style="font-size:22px;font-weight:bold;margin:24px 0 8px">${escapeHtml(c.emailHeading)}</p>`,
    `<p style="font-size:15px;line-height:1.5;margin:0 0 20px">${escapeHtml(body)}</p>`,
    `<p style="margin:0 0 24px"><a href="${escapeHtml(input.resultUrl)}" style="display:inline-block;background:#0B63E5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">${escapeHtml(c.emailCta)}</a></p>`,
    `<p style="font-size:12px;color:#64748b;line-height:1.5;margin:0 0 8px">${escapeHtml(retention)}</p>`,
    `<p style="font-size:12px;color:#64748b;line-height:1.5;margin:0">${escapeHtml(c.emailIgnore)}</p>`,
    `</div>`,
  ].join('')

  const text = [c.emailHeading, '', body, '', `${c.emailCta}: ${input.resultUrl}`, '', retention, c.emailIgnore].join('\n')

  return { to: input.to, subject: c.emailSubject, html, text }
}
