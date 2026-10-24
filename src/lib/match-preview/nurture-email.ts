import { escapeHtml } from '../email/digest'
import { listUnsubscribeHeaders, type EmailMessage } from '../email/send'
import { fill } from './copy'
import { nurtureCopy } from './nurture-copy'
import type { NurtureStep } from './rules'

/**
 * Os e-mails da sequência para quem pediu vagas e dicas por e-mail ao enviar o
 * currículo na página inicial. Diferente do e-mail de resultado, isto é uma
 * lista: leva `List-Unsubscribe` e um link de descadastro visível.
 *
 * Como o e-mail de resultado, não cita vaga pelo nome: o link leva à tela, e é
 * a tela que decide o que mostrar.
 */
export interface NurtureEmailInput {
  to: string
  lang: string
  step: NurtureStep
  resultUrl: string
  unsubscribeUrl: string
  /** Dia 1: o problema principal e quantos mais existem. */
  issue?: { title: string; why: string } | null
  moreIssues?: number
  /** Dia 3: vagas novas desde o envio, e quantas ainda abertas no total. */
  newJobs?: number
  openJobs?: number
}

export function buildNurtureEmail(input: NurtureEmailInput): EmailMessage {
  const c = nurtureCopy(input.lang)
  let subject: string
  let lines: string[]
  let cta: string

  if (input.step === 1) {
    const more = input.moreIssues ?? 0
    subject = c.tipSubject
    lines = [c.tipIntro]
    if (input.issue) lines.push(`${input.issue.title}. ${input.issue.why}`)
    if (more > 0) lines.push(more === 1 ? c.tipMoreOne : fill(c.tipMore, { n: more }))
    cta = c.tipCta
  } else if (input.step === 2) {
    const fresh = input.newJobs ?? 0
    if (fresh > 0) {
      subject = fresh === 1 ? c.jobsSubjectNewOne : fill(c.jobsSubjectNew, { n: fresh })
      lines = [c.jobsBodyNew]
    } else {
      subject = c.jobsSubjectOpen
      lines = [fill(c.jobsBodyOpen, { n: input.openJobs ?? 0 })]
    }
    cta = c.jobsCta
  } else {
    subject = c.lastSubject
    lines = [c.lastBody]
    cta = c.lastCta
  }

  const dir = input.lang === 'ar' ? 'rtl' : 'ltr'
  const html = [
    `<div dir="${dir}" style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0B192E">`,
    `<p style="font-size:20px;font-weight:bold;margin:24px 0 12px">${escapeHtml(subject)}</p>`,
    ...lines.map((l) => `<p style="font-size:15px;line-height:1.5;margin:0 0 14px">${escapeHtml(l)}</p>`),
    `<p style="margin:8px 0 28px"><a href="${escapeHtml(input.resultUrl)}" style="display:inline-block;background:#0B63E5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">${escapeHtml(cta)}</a></p>`,
    `<p style="font-size:12px;color:#64748b;line-height:1.5;margin:0 0 6px">${escapeHtml(c.footer)}</p>`,
    `<p style="font-size:12px;margin:0"><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#64748b">${escapeHtml(c.unsubscribe)}</a></p>`,
    `</div>`,
  ].join('')

  const text = [subject, '', ...lines, '', `${cta}: ${input.resultUrl}`, '', c.footer, `${c.unsubscribe}: ${input.unsubscribeUrl}`].join('\n')

  return { to: input.to, subject, html, text, headers: listUnsubscribeHeaders(input.unsubscribeUrl) }
}
