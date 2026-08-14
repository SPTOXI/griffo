import type { Language } from './index'

/**
 * Os endereços de contato, por idioma.
 *
 * A caixa muda com o idioma do site porque o endereço faz parte do que a página
 * diz: quem lê em espanhol escreve para `contacto@`, e receber "contato@" numa
 * página em espanhol é o mesmo tipo de descuido que deixar um botão sem
 * traduzir. O domínio é o mesmo nos três.
 *
 * Ficam aqui, e não espalhados pelo JSX, por uma razão prática: quando uma
 * caixa mudar — ou quando um quarto idioma entrar —, o lugar a corrigir é um
 * só, e o teste ao lado impede que um idioma novo entre sem endereço.
 */
const CONTACT_EMAILS: Record<Language, string> = {
  pt: 'contato@griffo.work',
  es: 'contacto@griffo.work',
  en: 'contact@griffo.work',
}

export function contactEmail(lang: Language): string {
  return CONTACT_EMAILS[lang] || CONTACT_EMAILS.pt
}

/**
 * Vendas para empresas e RH.
 *
 * O endereço NÃO é traduzido: `comercial@` é uma caixa que existe, e apontar a
 * página para um `sales@` que ninguém criou não deixaria o link mais correto —
 * deixaria as mensagens sem destino. O assunto, esse sim, sai no idioma de quem
 * clica, que é o que o destinatário vai ler.
 */
export const SALES_EMAIL = 'comercial@griffo.work'

const SALES_SUBJECTS: Record<Language, string> = {
  pt: 'Griffo para empresas',
  es: 'Griffo para empresas',
  en: 'Griffo for companies',
}

export function salesMailto(lang: Language): string {
  const subject = SALES_SUBJECTS[lang] || SALES_SUBJECTS.pt
  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}`
}

export function contactMailto(lang: Language): string {
  return `mailto:${contactEmail(lang)}`
}
