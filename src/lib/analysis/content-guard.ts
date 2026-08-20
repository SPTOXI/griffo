/**
 * O currículo é analisável?
 *
 * ## O caso que criou este arquivo
 *
 * Um PDF sem camada de texto foi analisado, pontuado nas oito dimensões e
 * desenhado em gráfico. O parecer executivo dizia, com todas as letras, que
 * **apenas o nome do arquivo havia sido disponibilizado** e que qualquer
 * avaliação seria genérica. O sistema leu isso, guardou, e mostrou as notas.
 *
 * A origem era um texto de mentira que o próprio produto escrevia: ao anexar um
 * PDF, a tela preenchia o campo de conteúdo com
 * `[Arquivo PDF Anexado: nome.pdf] - O texto será processado...`. São uns 90
 * caracteres — o bastante para passar por todo piso de tamanho do servidor e
 * para desviar do caminho de transcrição por imagem, que só era tentado quando
 * o conteúdo vinha curto. O marcador não era conteúdo, mas era indistinguível
 * de conteúdo.
 *
 * ## A regra
 *
 * Pontuar um documento que não se conseguiu ler é inventar dado sobre o
 * candidato — §43 na forma mais direta possível. É melhor recusar alto e dizer
 * o que fazer.
 *
 * Este módulo é puro de propósito: ele roda ANTES de destravar o currículo, e
 * portanto antes de cobrar. Ninguém paga por um laudo que não pode existir.
 */

/**
 * Piso de tamanho para um currículo.
 *
 * Deliberadamente baixo. Não é um juízo sobre qualidade — currículo curto é
 * problema do candidato, e a análise existe justamente para dizer isso. É só o
 * ponto abaixo do qual não há documento nenhum: 120 caracteres são duas linhas.
 * Recusar um currículo legítimo é pior que analisar um ruim.
 */
export const MIN_ANALYZABLE_CHARS = 120

/**
 * Marcadores que a própria aplicação já gravou como se fossem conteúdo.
 *
 * Ficam aqui porque existem currículos com esse texto JÁ GRAVADO no banco.
 * Corrigir o upload impede novos; só esta lista impede que os antigos continuem
 * gerando laudo sobre um nome de arquivo.
 */
const PLACEHOLDER_PATTERNS = [
  /\[Arquivo PDF Anexado:/i,
  /^\s*\[?arquivo\s+(pdf\s+)?anexad[oa]/i,
]

export type ContentVerdict =
  | { analyzable: true }
  | { analyzable: false; code: 'empty' | 'too_short' | 'placeholder'; message: string }

const UNREADABLE_MESSAGE =
  'Não foi possível ler o texto deste currículo — o arquivo enviado não trouxe conteúdo ' +
  'aproveitável. Envie o currículo em texto, exporte novamente do editor onde ele foi ' +
  'escrito, ou cole o conteúdo no campo de texto. Nenhuma análise foi cobrada.'

export function checkResumeContent(content: string | null | undefined): ContentVerdict {
  const text = (content ?? '').trim()

  if (!text) {
    return { analyzable: false, code: 'empty', message: UNREADABLE_MESSAGE }
  }

  if (PLACEHOLDER_PATTERNS.some((re) => re.test(text))) {
    return { analyzable: false, code: 'placeholder', message: UNREADABLE_MESSAGE }
  }

  if (text.length < MIN_ANALYZABLE_CHARS) {
    return {
      analyzable: false,
      code: 'too_short',
      message:
        'O texto deste currículo é curto demais para ser analisado — parece que o conteúdo não ' +
        'foi extraído do arquivo. Cole o texto do currículo ou envie outro formato. Nenhuma ' +
        'análise foi cobrada.',
    }
  }

  return { analyzable: true }
}
