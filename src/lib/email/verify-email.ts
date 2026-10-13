import { createHmac, timingSafeEqual } from 'crypto'
import { escapeHtml } from './digest'
import type { EmailMessage } from './send'

/**
 * Confirmação de e-mail do cadastro.
 *
 * ## Por que existe
 *
 * O cadastro devolvia 409 ("E-mail já cadastrado") quando o endereço já tinha
 * conta, e 200 quando não tinha. Isso permitia a qualquer pessoa descobrir
 * quem usa um serviço de busca de emprego, o que já expõe que a pessoa está
 * procurando emprego, e de quebra entregava uma lista de logins válidos para
 * ataque de senha. Agora a resposta é a mesma nos dois casos ("enviamos um link
 * para o seu e-mail"), e só quem lê a caixa de entrada sabe o que aconteceu: a
 * conta nova recebe o link de confirmação, e a conta que já existia recebe um
 * aviso.
 *
 * ## O token
 *
 * Mesmo desenho do descadastro (`unsubscribe.ts`): assinado com chave
 * derivada do segredo de sessão, para não haver variável de ambiente nova, e
 * sem material de chave compartilhado com o cookie. A diferença é que este
 * EXPIRA: ele abre uma sessão, e um link de login que vale para sempre numa
 * caixa de entrada antiga é uma porta aberta.
 *
 * Sem `server-only` e sem ler ambiente, para ter teste. Quem liga ao ambiente é
 * `verify-email.server.ts`.
 */

const SCOPE = 'email-verification.v1'
export const VERIFY_TOKEN_TTL_MS = 48 * 60 * 60 * 1000

function verifyKey(sessionSecret: string): Buffer {
  return createHmac('sha256', sessionSecret).update(SCOPE).digest()
}

export function emailVerificationToken(userId: string, sessionSecret: string, now = Date.now()): string {
  const payload = Buffer.from(`${userId}.${now + VERIFY_TOKEN_TTL_MS}`, 'utf-8').toString('base64url')
  const sig = createHmac('sha256', verifyKey(sessionSecret)).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

/** O userId de um token válido e não expirado, ou `null`. Nunca lança: atende rota pública. */
export function userIdFromVerificationToken(
  token: string | null | undefined,
  sessionSecret: string,
  now = Date.now()
): string | null {
  if (!token || typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', verifyKey(sessionSecret)).update(payload).digest('base64url')
  try {
    const sigBuf = Buffer.from(sig, 'base64url')
    const expBuf = Buffer.from(expected, 'base64url')
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
    const sep = decoded.lastIndexOf('.')
    if (sep <= 0) return null
    const expiresAt = Number(decoded.slice(sep + 1))
    if (!Number.isFinite(expiresAt) || expiresAt < now) return null
    return decoded.slice(0, sep)
  } catch {
    return null
  }
}

interface VerifyCopy {
  verifySubject: string
  verifyHeading: string
  verifyBody: string
  verifyCta: string
  verifyExpiry: string
  existsSubject: string
  existsHeading: string
  existsBody: string
  existsCta: string
  ignore: string
}

const COPY: Record<string, VerifyCopy> = {
  pt: {
    verifySubject: 'Confirme seu e-mail no GriffoWork',
    verifyHeading: 'Falta só confirmar seu e-mail',
    verifyBody: 'Clique no botão abaixo para ativar sua conta no GriffoWork.',
    verifyCta: 'Confirmar e entrar',
    verifyExpiry: 'O link vale por 48 horas.',
    existsSubject: 'Tentativa de cadastro com seu e-mail no GriffoWork',
    existsHeading: 'Você já tem uma conta',
    existsBody: 'Alguém tentou criar uma conta no GriffoWork com este e-mail, que já está cadastrado. Se foi você, é só entrar com sua senha.',
    existsCta: 'Entrar no GriffoWork',
    ignore: 'Se não foi você, ignore este e-mail. Nenhuma alteração foi feita.',
  },
  en: {
    verifySubject: 'Confirm your email on GriffoWork',
    verifyHeading: 'Just confirm your email',
    verifyBody: 'Click the button below to activate your GriffoWork account.',
    verifyCta: 'Confirm and sign in',
    verifyExpiry: 'The link is valid for 48 hours.',
    existsSubject: 'Sign-up attempt with your email on GriffoWork',
    existsHeading: 'You already have an account',
    existsBody: 'Someone tried to create a GriffoWork account with this email, which is already registered. If it was you, just sign in with your password.',
    existsCta: 'Sign in to GriffoWork',
    ignore: "If this wasn't you, ignore this email. Nothing was changed.",
  },
  es: {
    verifySubject: 'Confirma tu correo en GriffoWork',
    verifyHeading: 'Solo falta confirmar tu correo',
    verifyBody: 'Haz clic en el botón de abajo para activar tu cuenta en GriffoWork.',
    verifyCta: 'Confirmar y entrar',
    verifyExpiry: 'El enlace es válido durante 48 horas.',
    existsSubject: 'Intento de registro con tu correo en GriffoWork',
    existsHeading: 'Ya tienes una cuenta',
    existsBody: 'Alguien intentó crear una cuenta en GriffoWork con este correo, que ya está registrado. Si fuiste tú, solo inicia sesión con tu contraseña.',
    existsCta: 'Entrar en GriffoWork',
    ignore: 'Si no fuiste tú, ignora este correo. No se ha cambiado nada.',
  },
  fr: {
    verifySubject: 'Confirmez votre e-mail sur GriffoWork',
    verifyHeading: 'Il ne reste qu’à confirmer votre e-mail',
    verifyBody: 'Cliquez sur le bouton ci-dessous pour activer votre compte GriffoWork.',
    verifyCta: 'Confirmer et se connecter',
    verifyExpiry: 'Le lien est valable 48 heures.',
    existsSubject: 'Tentative d’inscription avec votre e-mail sur GriffoWork',
    existsHeading: 'Vous avez déjà un compte',
    existsBody: 'Quelqu’un a tenté de créer un compte GriffoWork avec cet e-mail, qui est déjà enregistré. Si c’était vous, connectez-vous simplement avec votre mot de passe.',
    existsCta: 'Se connecter à GriffoWork',
    ignore: 'Si ce n’était pas vous, ignorez cet e-mail. Rien n’a été modifié.',
  },
  de: {
    verifySubject: 'Bestätigen Sie Ihre E-Mail bei GriffoWork',
    verifyHeading: 'Nur noch Ihre E-Mail bestätigen',
    verifyBody: 'Klicken Sie auf die Schaltfläche unten, um Ihr GriffoWork-Konto zu aktivieren.',
    verifyCta: 'Bestätigen und anmelden',
    verifyExpiry: 'Der Link ist 48 Stunden gültig.',
    existsSubject: 'Registrierungsversuch mit Ihrer E-Mail bei GriffoWork',
    existsHeading: 'Sie haben bereits ein Konto',
    existsBody: 'Jemand hat versucht, mit dieser bereits registrierten E-Mail ein GriffoWork-Konto zu erstellen. Wenn Sie das waren, melden Sie sich einfach mit Ihrem Passwort an.',
    existsCta: 'Bei GriffoWork anmelden',
    ignore: 'Wenn Sie das nicht waren, ignorieren Sie diese E-Mail. Es wurde nichts geändert.',
  },
  it: {
    verifySubject: 'Conferma la tua email su GriffoWork',
    verifyHeading: 'Manca solo la conferma della tua email',
    verifyBody: 'Fai clic sul pulsante qui sotto per attivare il tuo account GriffoWork.',
    verifyCta: 'Conferma ed entra',
    verifyExpiry: 'Il link è valido per 48 ore.',
    existsSubject: 'Tentativo di registrazione con la tua email su GriffoWork',
    existsHeading: 'Hai già un account',
    existsBody: 'Qualcuno ha provato a creare un account GriffoWork con questa email, che è già registrata. Se eri tu, accedi semplicemente con la tua password.',
    existsCta: 'Accedi a GriffoWork',
    ignore: 'Se non eri tu, ignora questa email. Non è stato modificato nulla.',
  },
  nl: {
    verifySubject: 'Bevestig je e-mail bij GriffoWork',
    verifyHeading: 'Alleen je e-mail nog bevestigen',
    verifyBody: 'Klik op de knop hieronder om je GriffoWork-account te activeren.',
    verifyCta: 'Bevestigen en inloggen',
    verifyExpiry: 'De link is 48 uur geldig.',
    existsSubject: 'Registratiepoging met je e-mail bij GriffoWork',
    existsHeading: 'Je hebt al een account',
    existsBody: 'Iemand probeerde een GriffoWork-account aan te maken met dit e-mailadres, dat al geregistreerd is. Was jij dat, log dan gewoon in met je wachtwoord.',
    existsCta: 'Inloggen bij GriffoWork',
    ignore: 'Was jij dit niet, negeer deze e-mail dan. Er is niets gewijzigd.',
  },
  sv: {
    verifySubject: 'Bekräfta din e-post hos GriffoWork',
    verifyHeading: 'Bekräfta bara din e-post',
    verifyBody: 'Klicka på knappen nedan för att aktivera ditt GriffoWork-konto.',
    verifyCta: 'Bekräfta och logga in',
    verifyExpiry: 'Länken gäller i 48 timmar.',
    existsSubject: 'Registreringsförsök med din e-post hos GriffoWork',
    existsHeading: 'Du har redan ett konto',
    existsBody: 'Någon försökte skapa ett GriffoWork-konto med den här e-postadressen, som redan är registrerad. Om det var du, logga bara in med ditt lösenord.',
    existsCta: 'Logga in på GriffoWork',
    ignore: 'Om det inte var du kan du ignorera det här e-postmeddelandet. Inget har ändrats.',
  },
  ja: {
    verifySubject: 'GriffoWork のメールアドレスを確認してください',
    verifyHeading: 'メールアドレスの確認だけです',
    verifyBody: '下のボタンをクリックして GriffoWork のアカウントを有効にしてください。',
    verifyCta: '確認してログイン',
    verifyExpiry: 'リンクの有効期限は48時間です。',
    existsSubject: 'あなたのメールアドレスで GriffoWork への登録が試みられました',
    existsHeading: 'すでにアカウントをお持ちです',
    existsBody: '登録済みのこのメールアドレスで GriffoWork のアカウント作成が試みられました。ご本人の場合は、パスワードでログインしてください。',
    existsCta: 'GriffoWork にログイン',
    ignore: '心当たりがない場合は、このメールを無視してください。変更は何も行われていません。',
  },
  ko: {
    verifySubject: 'GriffoWork 이메일을 확인해 주세요',
    verifyHeading: '이메일 확인만 남았습니다',
    verifyBody: '아래 버튼을 눌러 GriffoWork 계정을 활성화하세요.',
    verifyCta: '확인하고 로그인',
    verifyExpiry: '링크는 48시간 동안 유효합니다.',
    existsSubject: '회원님의 이메일로 GriffoWork 가입이 시도되었습니다',
    existsHeading: '이미 계정이 있습니다',
    existsBody: '이미 등록된 이 이메일로 누군가 GriffoWork 계정 생성을 시도했습니다. 본인이라면 비밀번호로 로그인하세요.',
    existsCta: 'GriffoWork 로그인',
    ignore: '본인이 아니라면 이 이메일을 무시하세요. 변경된 사항은 없습니다.',
  },
  zh: {
    verifySubject: '请确认您在 GriffoWork 的邮箱',
    verifyHeading: '只差确认您的邮箱',
    verifyBody: '点击下方按钮激活您的 GriffoWork 账户。',
    verifyCta: '确认并登录',
    verifyExpiry: '链接有效期为 48 小时。',
    existsSubject: '有人尝试用您的邮箱注册 GriffoWork',
    existsHeading: '您已有账户',
    existsBody: '有人尝试用这个已注册的邮箱创建 GriffoWork 账户。如果是您本人，直接用密码登录即可。',
    existsCta: '登录 GriffoWork',
    ignore: '如果不是您本人，请忽略此邮件。没有任何更改。',
  },
  ar: {
    verifySubject: 'أكّد بريدك الإلكتروني على GriffoWork',
    verifyHeading: 'بقي فقط تأكيد بريدك الإلكتروني',
    verifyBody: 'انقر على الزر أدناه لتفعيل حسابك على GriffoWork.',
    verifyCta: 'تأكيد وتسجيل الدخول',
    verifyExpiry: 'الرابط صالح لمدة 48 ساعة.',
    existsSubject: 'محاولة تسجيل ببريدك الإلكتروني على GriffoWork',
    existsHeading: 'لديك حساب بالفعل',
    existsBody: 'حاول شخص ما إنشاء حساب على GriffoWork بهذا البريد الإلكتروني المسجّل مسبقًا. إذا كنت أنت، فسجّل الدخول بكلمة المرور.',
    existsCta: 'تسجيل الدخول إلى GriffoWork',
    ignore: 'إذا لم تكن أنت، فتجاهل هذه الرسالة. لم يتم تغيير أي شيء.',
  },
}

export function verifyEmailCopy(lang: string | null | undefined): VerifyCopy {
  return COPY[(lang || '').slice(0, 2).toLowerCase()] ?? COPY.en
}

function layout(lang: string, heading: string, lines: string[], cta: string, url: string, footer: string[]): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  return [
    `<div dir="${dir}" style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0B192E">`,
    `<p style="font-size:22px;font-weight:bold;margin:24px 0 8px">${escapeHtml(heading)}</p>`,
    ...lines.map((l) => `<p style="font-size:15px;line-height:1.5;margin:0 0 20px">${escapeHtml(l)}</p>`),
    `<p style="margin:0 0 24px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#0B63E5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">${escapeHtml(cta)}</a></p>`,
    ...footer.map((l) => `<p style="font-size:12px;color:#64748b;line-height:1.5;margin:0 0 8px">${escapeHtml(l)}</p>`),
    `</div>`,
  ].join('')
}

/** E-mail com o link de confirmação da conta nova. */
export function buildVerificationEmail(input: { to: string; lang: string; verifyUrl: string }): EmailMessage {
  const c = verifyEmailCopy(input.lang)
  return {
    to: input.to,
    subject: c.verifySubject,
    html: layout(input.lang, c.verifyHeading, [c.verifyBody], c.verifyCta, input.verifyUrl, [c.verifyExpiry, c.ignore]),
    text: [c.verifyHeading, '', c.verifyBody, '', `${c.verifyCta}: ${input.verifyUrl}`, '', c.verifyExpiry, c.ignore].join('\n'),
  }
}

/** Aviso para quem já tem conta e teve o e-mail usado num novo cadastro. */
export function buildAccountExistsEmail(input: { to: string; lang: string; loginUrl: string }): EmailMessage {
  const c = verifyEmailCopy(input.lang)
  return {
    to: input.to,
    subject: c.existsSubject,
    html: layout(input.lang, c.existsHeading, [c.existsBody], c.existsCta, input.loginUrl, [c.ignore]),
    text: [c.existsHeading, '', c.existsBody, '', `${c.existsCta}: ${input.loginUrl}`, '', c.ignore].join('\n'),
  }
}
