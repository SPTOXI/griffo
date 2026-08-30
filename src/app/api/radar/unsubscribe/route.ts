export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAppUrl } from '@/lib/env'
import { digestLanguage, escapeHtml } from '@/lib/email/digest'
import { userIdFromRequestToken } from '@/lib/email/unsubscribe.server'
import type { Language } from '@/lib/i18n'

/**
 * Parar de receber o digest do Radar.
 *
 * ## Sem sessão, de propósito
 *
 * Exigir login para sair de uma lista é o mesmo que não oferecer a saída: quem
 * quer parar de receber e-mail não vai lembrar a senha para isso — vai clicar
 * em "marcar como spam", que é o que queima o domínio. O que substitui a
 * sessão é o token assinado (`lib/email/unsubscribe.ts`).
 *
 * ## Por que GET e POST fazem coisas diferentes
 *
 * **GET mostra uma página e não desliga nada.** Antivírus, pré-visualização de
 * link e verificadores corporativos abrem as URLs de um e-mail sozinhos. Se o
 * GET desligasse, uma parte dos usuários seria descadastrada sem nunca ter
 * clicado — e descobriria pelo silêncio.
 *
 * **POST desliga.** É o que a RFC 8058 pede para o botão nativo do Gmail e do
 * Outlook (`List-Unsubscribe-Post`), e ali o POST só sai por ação explícita da
 * pessoa. O formulário da página de confirmação usa o mesmo caminho.
 *
 * ## O que ele desliga
 *
 * `RadarPreference.frequency = 'off'`, e nada além disso. A conta continua, as
 * análises continuam, os alertas continuam aparecendo na tela do Radar. Sair do
 * e-mail não é sair do produto, e tratar as duas coisas como uma só apagaria
 * uma decisão que a pessoa não tomou.
 */

interface Copy {
  title: string
  done: string
  keeps: string
  invalidTitle: string
  invalid: string
  confirm: string
  button: string
  back: string
}

const COPY: Record<Language, Copy> = {
  pt: {
    title: 'Avisos do Radar',
    done: 'Pronto. Você não vai mais receber o e-mail do Radar.',
    keeps: 'Sua conta e suas análises continuam como estavam. Os alertas seguem disponíveis na tela do Radar, se você quiser vê-los.',
    invalidTitle: 'Link inválido',
    invalid: 'Este link de descadastro não é válido. Você pode desligar os avisos nas preferências do Radar, dentro da sua conta.',
    confirm: 'Quer parar de receber o e-mail do Radar?',
    button: 'Parar de receber',
    back: 'Voltar ao GriffoWork',
  },
  en: {
    title: 'Radar alerts',
    done: 'Done. You will no longer receive the Radar email.',
    keeps: 'Your account and analyses stay as they were. Alerts remain available on the Radar screen if you want to see them.',
    invalidTitle: 'Invalid link',
    invalid: 'This unsubscribe link is not valid. You can turn alerts off in your Radar preferences, inside your account.',
    confirm: 'Do you want to stop receiving the Radar email?',
    button: 'Stop receiving',
    back: 'Back to GriffoWork',
  },
  es: {
    title: 'Avisos del Radar',
    done: 'Listo. Ya no recibirás el correo del Radar.',
    keeps: 'Tu cuenta y tus análisis siguen igual. Los avisos continúan disponibles en la pantalla del Radar, si quieres verlos.',
    invalidTitle: 'Enlace inválido',
    invalid: 'Este enlace para darse de baja no es válido. Puedes desactivar los avisos en las preferencias del Radar, dentro de tu cuenta.',
    confirm: '¿Quieres dejar de recibir el correo del Radar?',
    button: 'Dejar de recibir',
    back: 'Volver a GriffoWork',
  },
  de: {
    title: 'Radar-Benachrichtigungen',
    done: 'Erledigt. Sie erhalten keine weiteren Radar-E-Mails mehr.',
    keeps: 'Ihr Konto und Ihre Analysen bleiben unverändert. Warnmeldungen bleiben auf dem Radar-Dashboard verfügbar.',
    invalidTitle: 'Ungültiger Link',
    invalid: 'Dieser Abmeldelink ist ungültig. Sie können Benachrichtigungen in Ihren Radar-Einstellungen deaktivieren.',
    confirm: 'Möchten Sie den Erhalt von Radar-E-Mails beenden?',
    button: 'Abmelden',
    back: 'Zurück zu GriffoWork',
  },
  fr: {
    title: 'Alertes du Radar',
    done: 'Terminé. Vous ne recevrez plus les e-mails du Radar.',
    keeps: 'Votre compte et vos analyses restent inchangés. Les alertes demeurent accessibles sur le tableau de bord du Radar.',
    invalidTitle: 'Lien invalide',
    invalid: 'Ce lien de désinscription n\'est pas valide. Vous pouvez désactiver les alertes dans vos préférences Radar.',
    confirm: 'Souhaitez-vous ne plus recevoir les e-mails du Radar ?',
    button: 'Se désinscrire',
    back: 'Retour à GriffoWork',
  },
  it: {
    title: 'Avvisi del Radar',
    done: 'Operazione completata. Non riceverai più le e-mail del Radar.',
    keeps: 'Il tuo account e le tue analisi restano invariati. Gli avvisi restano consultabili nella schermata del Radar.',
    invalidTitle: 'Link non valido',
    invalid: 'Questo link di disiscrizione non è valido. Puoi disattivare gli avvisi nelle preferenze del Radar nel tuo account.',
    confirm: 'Vuoi disattivare le e-mail del Radar?',
    button: 'Interrompi ricezione',
    back: 'Torna a GriffoWork',
  },
  ja: {
    title: '求人レーダー通知設定',
    done: '設定が完了しました。求人レーダーからのメール配信を停止しました。',
    keeps: 'アカウントと診断データは保持されます。求人情報はダッシュボード上で引き続きご確認いただけます。',
    invalidTitle: '無効なリンク',
    invalid: 'この配信停止リンクは無効です。マイページのレーダー設定から通知を停止できます。',
    confirm: '求人レーダーからのメール通知を停止しますか？',
    button: '配信を停止する',
    back: 'GriffoWorkへ戻る',
  },
}

function page(lang: Language, body: string, status = 200): NextResponse {
  const html = [
    '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${escapeHtml(COPY[lang].title)}</title></head>`,
    '<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#fafafa;margin:0;padding:48px 16px">',
    '<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;color:#18181b">',
    body,
    '</div></body></html>',
  ].join('')

  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/**
 * O idioma da página de descadastro.
 *
 * Vem do perfil de quem o token identifica, e não do cabeçalho do navegador: a
 * pessoa acabou de ler um e-mail num idioma, e a página que ele abre precisa
 * falar o mesmo. Sem token válido não há perfil, e aí vale o português.
 */
async function languageFor(userId: string | null): Promise<Language> {
  if (!userId) return 'pt'
  const profile = await db.professionalProfile.findUnique({
    where: { userId },
    select: { communicationLanguage: true },
  })
  return digestLanguage(profile?.communicationLanguage)
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  const userId = userIdFromRequestToken(token)
  const lang = await languageFor(userId)
  const copy = COPY[lang]

  if (!userId) {
    return page(
      lang,
      [
        `<h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(copy.invalidTitle)}</h1>`,
        `<p style="color:#3f3f46;line-height:1.6;margin:0">${escapeHtml(copy.invalid)}</p>`,
      ].join(''),
      400
    )
  }

  // A confirmação é um formulário POST para esta mesma URL. O token viaja no
  // corpo para não sobrar no histórico do navegador nem no `Referer`.
  return page(
    lang,
    [
      `<h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(copy.title)}</h1>`,
      `<p style="color:#3f3f46;line-height:1.6;margin:0 0 20px">${escapeHtml(copy.confirm)}</p>`,
      '<form method="post">',
      `<input type="hidden" name="t" value="${escapeHtml(token || '')}">`,
      '<button type="submit" style="background:#18181b;color:#fff;border:0;border-radius:8px;padding:12px 20px;font-size:15px;cursor:pointer">',
      escapeHtml(copy.button),
      '</button>',
      '</form>',
      `<p style="margin:24px 0 0"><a href="${escapeHtml(getAppUrl())}" style="color:#71717a;font-size:14px">${escapeHtml(copy.back)}</a></p>`,
    ].join('')
  )
}

export async function POST(req: NextRequest) {
  // Duas origens legítimas: o formulário da página (corpo) e o botão nativo do
  // cliente de e-mail, que faz um POST para a URL do `List-Unsubscribe` com o
  // token na query.
  let token = req.nextUrl.searchParams.get('t')
  if (!token) {
    try {
      const form = await req.formData()
      const fromForm = form.get('t')
      if (typeof fromForm === 'string') token = fromForm
    } catch {
      // Corpo ausente ou ilegível — o token da query é a última palavra.
    }
  }

  const userId = userIdFromRequestToken(token)
  const lang = await languageFor(userId)
  const copy = COPY[lang]

  if (!userId) {
    return page(
      lang,
      [
        `<h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(copy.invalidTitle)}</h1>`,
        `<p style="color:#3f3f46;line-height:1.6;margin:0">${escapeHtml(copy.invalid)}</p>`,
      ].join(''),
      400
    )
  }

  // `upsert` porque a preferência pode nunca ter sido criada: o Radar roda com
  // os padrões quando não há linha, e nesse caso desligar precisa CRIAR o "off"
  // em vez de não encontrar nada e não fazer nada.
  await db.radarPreference.upsert({
    where: { userId },
    create: { userId, frequency: 'off' },
    update: { frequency: 'off' },
  })

  return page(
    lang,
    [
      `<h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(copy.title)}</h1>`,
      `<p style="color:#3f3f46;line-height:1.6;margin:0 0 12px">${escapeHtml(copy.done)}</p>`,
      `<p style="color:#71717a;line-height:1.6;font-size:14px;margin:0">${escapeHtml(copy.keeps)}</p>`,
      `<p style="margin:24px 0 0"><a href="${escapeHtml(getAppUrl())}" style="color:#71717a;font-size:14px">${escapeHtml(copy.back)}</a></p>`,
    ].join('')
  )
}
