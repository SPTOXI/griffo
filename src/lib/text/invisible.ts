/**
 * Caracteres que ocupam espaço no texto e não desenham nada.
 *
 * ## Por que isto virou módulo próprio
 *
 * O `ats-check` já acusava invisíveis desde as defesas anti-manipulação, com
 * uma classe escrita à mão ali dentro. Comparando com o levantamento de um
 * projeto independente (`linkedin-agent-skill`, MIT), duas coisas ficaram
 * claras: faltavam caracteres na nossa classe, e o mesmo conhecimento é
 * necessário em OUTRO lugar — na fronteira do prompt. Regra repetida em dois
 * arquivos é regra que vai divergir, então ela mora aqui.
 *
 * ## As três famílias, que NÃO são a mesma coisa
 *
 * Tratá-las com o mesmo peso seria errado nas duas direções: acusaria
 * currículo honesto e deixaria passar o ataque de verdade.
 *
 * 1. **Tag characters (U+E0000–U+E007F)** — um alfabeto ASCII inteiro,
 *    integralmente invisível. Não existe uso legítimo: nenhum editor, nenhuma
 *    fonte, nenhum idioma os produz. É o caminho conhecido para contrabandear
 *    texto dentro de outro texto, e o destinatário natural desse contrabando é
 *    um modelo de linguagem — o nosso. Tolerância **zero**.
 *
 * 2. **Formatação de largura zero** — junção, não-junção, marcas de direção,
 *    BOM. Aparecem por acidente de copiar-e-colar em currículo honesto, mas em
 *    QUANTIDADE só aparecem quando alguém está fatiando texto para driblar
 *    leitura. Tolerância baixa.
 *
 * 3. **Soft hyphen (U+00AD)** — este é hifenização de verdade. Word e
 *    LibreOffice o produzem aos montes em texto justificado, e um currículo de
 *    duas páginas pode ter dezenas sem que ninguém tenha feito nada de errado.
 *    Colocá-lo na família 2 seria fabricar acusação contra quem justificou o
 *    texto. Tolerância alta, contada à parte.
 *
 * ## O que ficou DE FORA, de propósito
 *
 * Espaço não-separável, espaço fino, espaço em quadratim (U+00A0, U+2009,
 * U+2003…). O levantamento de origem os lista, e para o propósito dele — achar
 * impressão digital de máquina num post — faz sentido. Para currículo, não:
 * são espaços VISÍVEIS, o Word os gera o tempo todo, e acusá-los seria uma
 * fábrica de falso positivo num achado de severidade crítica.
 */

/**
 * Contrabando: U+E0000–U+E007F.
 *
 * Precisa da flag `u` — está fora do plano básico, e sem ela o par substituto
 * seria contado como dois caracteres avulsos.
 *
 * Não exportada de propósito, junto com as outras duas: regex com `/g` guarda
 * `lastIndex` entre chamadas. `match` e `replace` o reiniciam, mas um detector
 * exportado convida a `SMUGGLING_RE.test(texto)`, que devolveria `false` em um
 * documento contrabandeado a cada dois. Só as funções saem daqui.
 */
const SMUGGLING_RE = /[\u{E0000}-\u{E007F}]/gu

/**
 * A exceção legítima: bandeira de subdivisão.
 *
 * Inglaterra, Escócia e País de Gales não têm codepoint próprio — são montadas
 * como U+1F3F4 seguido do código da região escrito em TAG CHARACTERS e fechado
 * por U+E007F. Ou seja, o emoji da bandeira da Inglaterra carrega seis
 * caracteres da faixa que esta casa trata como contrabando.
 *
 * Sem esta exceção, um currículo britânico que cite a bandeira levaria
 * acusação CRÍTICA de manipulação — exatamente o erro que a tolerância do soft
 * hyphen existe para não cometer — e o emoji ainda chegaria degradado ao
 * modelo, virando uma bandeira preta genérica.
 *
 * A sequência válida é estreita: só letras minúsculas e dígitos de tag, de dois
 * a seis, com terminador. Instrução contrabandeada não cabe nela — não começa
 * com U+1F3F4, não se limita a seis caracteres, e não sobrevive à exigência do
 * terminador.
 */
const EMOJI_TAG_SEQUENCE_RE = /\u{1F3F4}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{2,6}\u{E007F}/gu

/**
 * Formatação de largura zero.
 *
 * Inclui U+061C (marca de letra árabe) e U+180E (separador de vogal mongol),
 * que a classe anterior não cobria — ambos são formatação invisível sem uso
 * nenhum num currículo em alfabeto latino.
 */
const ZERO_WIDTH_RE = /[\u061c\u180e\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060-\u206f\ufeff]/g

/** Hifenização opcional. Legítima, e por isso separada. */
const SOFT_HYPHEN_RE = /\u00ad/g

/** Quantos invisíveis de formatação já deixam de ser acidente. */
export const ZERO_WIDTH_TOLERANCE = 15

/**
 * Quantos soft hyphens já deixam de ser hifenização.
 *
 * Folgado de propósito: o custo de errar para cima é mostrar um currículo
 * manipulado como limpo; para baixo, é dizer a alguém que justificou o texto
 * no Word que ele tentou fraudar. O segundo erro é muito pior.
 */
export const SOFT_HYPHEN_TOLERANCE = 40

export interface InvisibleCount {
  smuggling: number
  zeroWidth: number
  softHyphen: number
}

export function countInvisible(text: string): InvisibleCount {
  // Bandeira de subdivisão sai da conta antes de tudo: os tag characters dela
  // são parte do emoji, não texto escondido.
  const semBandeiras = text.replace(EMOJI_TAG_SEQUENCE_RE, '')
  return {
    smuggling: (semBandeiras.match(SMUGGLING_RE) || []).length,
    zeroWidth: (text.match(ZERO_WIDTH_RE) || []).length,
    softHyphen: (text.match(SOFT_HYPHEN_RE) || []).length,
  }
}

/**
 * O documento tem invisíveis além do que o acidente explica?
 *
 * Um único tag character basta. Ele não chega ali por acidente.
 */
export function hasSuspiciousInvisibles(text: string): boolean {
  const n = countInvisible(text)
  return (
    n.smuggling > 0 ||
    n.zeroWidth > ZERO_WIDTH_TOLERANCE ||
    n.softHyphen > SOFT_HYPHEN_TOLERANCE
  )
}

/**
 * Remove o contrabando antes de o texto entrar num prompt.
 *
 * Só a família 1. As outras duas ficam, porque apagar silenciosamente o que o
 * laudo vai citar faria a análise falar de um currículo que não é o que a
 * pessoa enviou.
 *
 * ATENÇÃO ao alcance real: `hasSuspiciousInvisibles` só é chamado pelo
 * `ats-check`, e o `ats-check` só é chamado pela rota pública gratuita. No
 * caminho PAGO — análise, reescrita, carta — ninguém acusa: o contrabando é
 * removido aqui e some sem deixar rastro. Por isso quem chama registra no log
 * quando de fato encontra algo; é o único sinal que existe nesse caminho.
 *
 * Aqui apagar é seguro justamente porque estes não desenham nada — nada que a
 * pessoa consiga ver no arquivo dela muda.
 */
export function stripSmuggling(text: string): string {
  // Preserva a bandeira de subdivisão inteira e limpa só o que está fora dela.
  // Um `replace` direto arrancaria o código da região e entregaria ao modelo
  // uma bandeira preta genérica no lugar da que a pessoa escreveu.
  const partes: string[] = []
  let fim = 0
  for (const m of text.matchAll(EMOJI_TAG_SEQUENCE_RE)) {
    partes.push(text.slice(fim, m.index).replace(SMUGGLING_RE, ''), m[0])
    fim = m.index + m[0].length
  }
  partes.push(text.slice(fim).replace(SMUGGLING_RE, ''))
  return partes.join('')
}
