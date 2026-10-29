/**
 * O currículo criado na home, guardado NO APARELHO da pessoa até ela entrar no
 * app (§2.160). É o que liga o "liberar currículo completo" ao envio no app:
 * depois do cadastro, a tela de envio abre já preenchida com ele.
 *
 * Fica no navegador, não no servidor: o servidor só guarda currículo de quem
 * pediu (`recruiterOptIn`), e esta ponte não pode mudar essa regra. Vence em
 * 2 dias e é apagado assim que o envio no app dá certo.
 */

const KEY = 'gw_resume_draft'
const TTL_MS = 2 * 24 * 60 * 60 * 1000

export interface ResumeDraft {
  text: string
  targetJob: string
  at: number
}

export function saveResumeDraft(text: string, targetJob: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ text, targetJob, at: Date.now() } satisfies ResumeDraft))
  } catch {
    // Navegador sem armazenamento: o app abre sem o rascunho, e a pessoa cola o texto.
  }
}

export function readResumeDraft(now: number = Date.now()): ResumeDraft | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as ResumeDraft
    if (typeof d?.text !== 'string' || typeof d.at !== 'number' || now - d.at > TTL_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return { text: d.text, targetJob: typeof d.targetJob === 'string' ? d.targetJob : '', at: d.at }
  } catch {
    return null
  }
}

export function clearResumeDraft(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nada a apagar
  }
}
