/**
 * O texto parece escrito por máquina?
 *
 * ## Por que isto existe, e por que aponta primeiro para NÓS
 *
 * O `content-guard` protege a ENTRADA — "dá para ler este currículo?". Na
 * SAÍDA não havia nada: a carta de apresentação e a reescrita são prosa gerada
 * por IA e iam direto para a pessoa, sem crivo nenhum. O juiz de qualidade
 * (`agents/quality-judge.ts`) existe, mas julga `full_analysis`, `rewrite`,
 * `social_advice` e `career_orientation` — a carta não está na lista — e ainda
 * assim só a 10% de amostragem, porque custa uma chamada de LLM.
 *
 * Ou seja: o GriffoWork escrevia carta com IA e não tinha como saber se ela
 * saía com cara de IA. Em 2026 isso não é detalhe de estilo — recrutador lê
 * dezenas por dia e reconhece o padrão, e a carta genérica queima a
 * candidatura que a pessoa pagou para melhorar.
 *
 * Este módulo é determinístico e sem custo, então pode rodar em 100% do que
 * geramos, diferente do juiz por amostragem.
 *
 * ## O que ele NÃO faz, de propósito
 *
 * **Não reescreve.** Existe ferramenta pública que "humaniza" texto para
 * derrotar detector de IA; a metade do problema que ela resolve é legítima
 * (soar como a própria pessoa) e a outra metade é fraude (enganar quem lê).
 * Trocar palavra por palavra em cima da saída também quebra concordância em
 * português com facilidade. Aqui só se MEDE. Quem corrige é o prompt, antes.
 *
 * **Não devolve nota composta.** Densidade é fato medido; nível é juízo nosso.
 * Somar as duas coisas num número de 0 a 100 daria aparência de precisão a uma
 * escolha de limiar — o mesmo motivo pelo qual `jobs/legitimacy.ts` não tem
 * número nenhum.
 *
 * **Não julga texto curto.** Abaixo do piso, variação de frase e densidade são
 * ruído. Dado insuficiente não acusa, como no resto da casa.
 *
 * ## Origem
 *
 * A ideia das heurísticas veio do `detect.py` do linkedin-agent-skill (Jake
 * Schincariol, MIT). Das cinco de lá, três sobreviveram ao português e ao
 * currículo:
 *
 * - *burstiness* e densidade de clichê passam inteiras;
 * - concretude passa (nós já tínhamos `no_metrics`, mas binário — densidade é
 *   melhor);
 * - impressão digital tipográfica NÃO passa: travessão e aspas curvas em
 *   currículo são normais, e a parte que importa (invisíveis) já é de
 *   `text/invisible.ts`;
 * - voz por contrações NÃO EXISTE em português. "don't"/"I'm" são escolha de
 *   registro; "da", "no", "pelo" são obrigatórias. O check seria ruído puro.
 *
 * O léxico é escrito daqui — "delve into" e "leverage" não têm tradução útil.
 */

export type WritingLevel = 'ok' | 'attention' | 'suspect'

/** Idiomas em que geramos prosa hoje (carta e reescrita). */
export type WritingLang = 'pt' | 'en' | 'es'

/**
 * Termos de enchimento: dizem algo sobre o autor e nada sobre o candidato.
 *
 * O critério de entrada é duplo — precisa ser (a) vazio de conteúdo e (b)
 * desproporcionalmente produzido por modelo. Vocabulário profissional de
 * verdade fica FORA, ainda que soe corporativo: "otimizar" num currículo de
 * desenvolvedor é o verbo certo, "liderar" descreve um fato, "resiliência" é
 * uma qualidade real. Acusá-los seria trocar clichê por censura de vocabulário.
 */
export const SLOP_TERMS: Record<WritingLang, readonly string[]> = {
  pt: [
    'é importante ressaltar',
    'vale ressaltar',
    'vale destacar',
    'cabe destacar',
    'no cenário atual',
    'no atual cenário',
    'em um mundo cada vez mais',
    'em um mercado cada vez mais',
    'em busca de novos desafios',
    'sou apaixonado por',
    'paixão por desafios',
    'profissional dedicado',
    'profissional proativo',
    'vasta experiência',
    'amplo conhecimento',
    'sólidos conhecimentos',
    'agregar valor',
    'alavancar resultados',
    'impulsionar resultados',
    'potencializar',
    'sinergia',
    'abordagem holística',
    'visão holística',
    'buscar a excelência',
    'excelência operacional',
    'pensar fora da caixa',
    'mão na massa',
    'transformar desafios em oportunidades',
    'aprimoramento contínuo',
    'em suma',
    'em síntese',
    'por fim, mas não menos importante',
    'dito isso',
    'nesse sentido',
    'diante do exposto',
  ],
  en: [
    'delve into',
    'deep dive into',
    'leverage my',
    'leveraging my',
    'harness the power',
    'embark on',
    'foster a culture',
    'in today',
    'ever-evolving landscape',
    'ever-changing world',
    'passionate about',
    'proven track record',
    'results-driven',
    'detail-oriented',
    'team player',
    'go-getter',
    'think outside the box',
    'wear many hats',
    'hit the ground running',
    'value-add',
    'best-in-class',
    'cutting-edge',
    'state-of-the-art',
    'game-changer',
    'seamlessly',
    'synergy',
    'holistic approach',
    'in summary',
    'last but not least',
    'that being said',
  ],
  es: [
    'cabe destacar',
    'es importante resaltar',
    'vale la pena destacar',
    'en el escenario actual',
    'en un mundo cada vez más',
    'en un mercado cada vez más',
    'en busca de nuevos desafíos',
    'apasionado por',
    'pasión por los desafíos',
    'profesional dedicado',
    'profesional proactivo',
    'amplia experiencia',
    'amplios conocimientos',
    'sólidos conocimientos',
    'aportar valor',
    'impulsar resultados',
    'potenciar',
    'sinergia',
    'enfoque holístico',
    'visión holística',
    'buscar la excelencia',
    'excelencia operativa',
    'pensar fuera de la caja',
    'en resumen',
    'en síntesis',
    'por último, pero no menos importante',
    'dicho esto',
    'en este sentido',
  ],
}

/**
 * Formas estruturais que o modelo produz muito mais que uma pessoa.
 *
 * Poucas e de alta precisão: estrutura genérica demais acusaria prosa honesta.
 */
const STRUCTURES: readonly { id: string; re: RegExp }[] = [
  { id: 'nao-apenas', re: /\bn[ãa]o (?:apenas|s[óo])\b[^.!?]{0,80}\bmas tamb[ée]m\b/giu },
  { id: 'not-just', re: /\bnot (?:just|only)\b[^.!?]{0,80}\bbut (?:also)?\b/giu },
  { id: 'no-solo', re: /\bno s[óo]lo\b[^.!?]{0,80}\bsino (?:tambi[ée]n)?\b/giu },
  /**
   * O delator absoluto: o modelo falando de si dentro do entregável.
   *
   * SEM a flag `i`, e isso é a regra inteira: "IA" em maiúscula é a sigla;
   * "ia" em minúscula é o imperfeito de IR. "Expliquei como ia conduzir a
   * migração" é português perfeitamente honesto, e como este achado reprova
   * sozinho, ignorar a caixa transformaria a frase mais comum do mundo em
   * acusação de texto gerado.
   */
  { id: 'como-ia', re: /\b(?:[Cc]omo (?:uma? )?(?:IA\b|[Ii]ntelig[êe]ncia [Aa]rtificial\b)|[Aa]s an AI(?: language model)?\b)/gu },
]

/**
 * Piso para julgar. Abaixo disto, variação e densidade são ruído.
 *
 * Uma carta de apresentação tem 220–350 palavras por especificação do prompt,
 * então o piso não a exclui — exclui fragmento e título.
 */
export const MIN_WORDS_TO_JUDGE = 60

/** Frases mínimas para que variação de comprimento signifique alguma coisa. */
export const MIN_SENTENCES_TO_JUDGE = 4

/**
 * Limiares — PROVISÓRIOS, e é importante que estejam ditos como tais.
 *
 * Foram ancorados na escala do `detect.py` de origem (que trata ~4 clichês por
 * 100 palavras como escrita de máquina e variação de frase abaixo de ~0,22
 * como tal) e ajustados para baixo porque carta é texto curto e formal, onde
 * um clichê pesa mais que num post.
 *
 * Nenhum deles foi calibrado contra produção ainda. É por isso que este módulo
 * hoje MEDE e não bloqueia nada: primeiro se observa a distribuição do que nós
 * mesmos geramos, depois se escolhe um limiar. Medir antes de automatizar.
 */
export const SLOP_ATTENTION_PER_100 = 1.5
export const SLOP_SUSPECT_PER_100 = 3.0
export const BURSTINESS_FLOOR = 0.35
export const CONCRETE_FLOOR_PER_100 = 2.0

export interface WritingAssessment {
  /**
   * O juízo. Só tem significado quando `judged` é verdadeiro — abaixo do piso
   * ele é sempre 'ok', no sentido de "não avaliado", nunca de "aprovado".
   */
  level: WritingLevel
  /**
   * O texto era longo o bastante para ser avaliado?
   *
   * Falso NÃO zera `hits` nem `structures`: clichê encontrado é fato literal,
   * e some do relatório só se a gente jogar fora. O que o piso protege é a
   * INFERÊNCIA — densidade e variação de frase em texto curto são ruído.
   */
  judged: boolean
  words: number
  sentences: number
  /** Clichês do léxico por 100 palavras. */
  slopPer100: number
  /** Quais clichês, para a mensagem poder ser específica. */
  hits: string[]
  /** Coeficiente de variação do comprimento das frases. Pessoa varia; modelo não. */
  burstiness: number
  /** Números e nomes próprios por 100 palavras. O oposto de texto abstrato. */
  concretePer100: number
  /** Formas estruturais encontradas. */
  structures: string[]
}

const SENTENCE_RE = /[^.!?\n]+[.!?]*/g
const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu
const NUMBER_RE = /\b\d[\d.,]*\s?%?|\b(?:R\$|US\$|€|\$)\s?\d/g

/**
 * Frases do texto.
 *
 * O piso é de DUAS palavras, não de três. A fonte original descartava frases
 * de até três palavras para não contar fragmento como frase — mas frase curta
 * é exatamente o que a variação de comprimento existe para premiar. "Deu
 * certo." e "Isso durou." são o que uma pessoa escreve e um modelo não;
 * descartá-las tirava os valores baixos da distribuição, reduzia a variância
 * e empurrava texto humano para 'suspect'. Medido: 0,61 contra 0,77 numa
 * carta de teste, 26% de subestimação na direção da acusação falsa.
 *
 * Uma palavra ainda não conta, porque "Ltda.", "S.A." e "Dr." quebram frase
 * onde não há frase e inventariam variação que o autor não escreveu.
 */
function sentencesOf(text: string): string[] {
  return (text.match(SENTENCE_RE) || [])
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 2)
}

function wordsOf(text: string): string[] {
  return text.match(WORD_RE) || []
}

/**
 * Nomes próprios: maiúscula que não está abrindo frase.
 *
 * Heurística grosseira de propósito — reconhecer entidade de verdade exigiria
 * modelo, e o que se quer aqui é só "o texto cita coisas concretas ou fala no
 * abstrato".
 */
function properNouns(text: string): Set<string> {
  const out = new Set<string>()
  for (const sentence of sentencesOf(text)) {
    const words = sentence.split(/\s+/)
    // Pula a primeira palavra: maiúscula ali é pontuação, não nome próprio.
    for (const w of words.slice(1)) {
      const clean = w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
      if (clean.length >= 3 && /^\p{Lu}\p{Ll}+$/u.test(clean)) out.add(clean)
    }
  }
  return out
}

/**
 * Siglas: AWS, ETL, SAP, CRM.
 *
 * Ficavam DE FORA porque `properNouns` exige maiúscula seguida de minúscula.
 * O efeito era o inverso do pretendido: a carta mais densa em fato técnico
 * — a que cita os sistemas que a pessoa opera — media concretude ZERO e caía
 * no piso. Quem escreve "migrei o ERP para SAP e integrei o CRM via REST"
 * está sendo o mais concreto possível.
 *
 * Varre o texto inteiro, sem pular a primeira palavra da frase: maiúscula
 * inicial é ambígua numa palavra comum, mas "AWS" no começo da frase não é
 * outra coisa. O teto de seis letras mantém título gritado de fora
 * ("EXPERIÊNCIA PROFISSIONAL" não é sigla).
 */
const ACRONYM_RE = /\b\p{Lu}{2,6}\b/gu

function acronyms(text: string): Set<string> {
  return new Set(text.match(ACRONYM_RE) || [])
}

function coefficientOfVariation(lengths: number[]): number {
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length
  if (!mean) return 0
  const variance = lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length
  return Math.sqrt(variance) / mean
}

/** Escapa o termo para busca literal, tolerando espaço variável entre palavras. */
function termPattern(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  return new RegExp(escaped, 'giu')
}

/**
 * Mede o texto. Não decide nada sobre ele além do nível.
 */
export function assessWriting(input: string | null | undefined, lang: WritingLang): WritingAssessment {
  const text = (input ?? '').trim()
  const words = wordsOf(text)
  const sentences = sentencesOf(text)

  const base: WritingAssessment = {
    level: 'ok',
    judged: false,
    words: words.length,
    sentences: sentences.length,
    slopPer100: 0,
    hits: [],
    burstiness: 0,
    concretePer100: 0,
    structures: [],
  }

  // Os FATOS são levantados sempre: um clichê está no texto ou não está, e
  // isso não depende de o texto ser longo o bastante para inferir tendência.
  let slopCount = 0
  const hits: string[] = []
  for (const term of SLOP_TERMS[lang]) {
    const n = (text.match(termPattern(term)) || []).length
    if (n > 0) {
      slopCount += n
      hits.push(term)
    }
  }

  const structures: string[] = []
  for (const s of STRUCTURES) {
    if ((text.match(s.re) || []).length > 0) structures.push(s.id)
  }

  if (words.length === 0) return { ...base, hits, structures }

  const per100 = 100 / words.length
  const concreteCount =
    (text.match(NUMBER_RE) || []).length + properNouns(text).size + acronyms(text).size

  const measured: WritingAssessment = {
    ...base,
    hits,
    structures,
    slopPer100: slopCount * per100,
    concretePer100: concreteCount * per100,
    burstiness: sentences.length
      ? coefficientOfVariation(sentences.map((s) => s.split(/\s+/).filter(Boolean).length))
      : 0,
  }

  // O JUÍZO depende do piso. Densidade e variação em texto curto são ruído, e
  // transformar ruído em veredito é exatamente o que esta casa não faz.
  if (words.length < MIN_WORDS_TO_JUDGE || sentences.length < MIN_SENTENCES_TO_JUDGE) {
    return measured
  }

  const judged: WritingAssessment = { ...measured, judged: true }
  return { ...judged, level: levelFor(judged) }
}

/**
 * O juízo, separado da medição.
 *
 * "como-ia" reprova sozinho: é o modelo falando de si dentro do entregável, e
 * nenhuma densidade justifica isso passar.
 */
function levelFor(a: WritingAssessment): WritingLevel {
  if (a.structures.includes('como-ia')) return 'suspect'
  if (a.slopPer100 >= SLOP_SUSPECT_PER_100) return 'suspect'

  // Dois sinais fracos juntos valem mais que um forte sozinho: texto sem
  // clichê nenhum pode ser monótono por ser técnico, e texto com um clichê
  // pode ser só um deslize.
  const weak = [
    a.slopPer100 >= SLOP_ATTENTION_PER_100,
    a.burstiness < BURSTINESS_FLOOR,
    a.concretePer100 < CONCRETE_FLOOR_PER_100,
    a.structures.length > 0,
  ].filter(Boolean).length

  if (weak >= 2) return 'suspect'
  if (weak === 1) return 'attention'
  return 'ok'
}

/**
 * O idioma tem léxico próprio?
 *
 * O produto gera currículo em 12 idiomas e este módulo cobre 3. Aplicar a
 * lista portuguesa a um texto em alemão não seria cobertura parcial — seria
 * pedir ao modelo, em português, que evite expressões que ele não ia escrever,
 * e depois medir densidade de clichê português num texto alemão. Zero achado,
 * aparência de vigilância.
 *
 * Melhor devolver nulo e o chamador não fazer nada. Quem quiser cobrir os
 * outros nove escreve os léxicos; não há atalho.
 */
export function writingLangOf(lang: string): WritingLang | null {
  return lang === 'pt' || lang === 'en' || lang === 'es' ? lang : null
}

/**
 * Lista de proibidos para colar no prompt.
 *
 * Esta é a defesa que de fato funciona: é mais barato o modelo não escrever o
 * clichê do que nós detectarmos depois. A medição existe para saber se isto
 * adiantou.
 */
export function bannedTermsPrompt(lang: WritingLang): string {
  const label = {
    pt: 'NÃO use nenhuma destas expressões — são enchimento que denuncia texto gerado e não dizem nada sobre o candidato:',
    en: 'Do NOT use any of these expressions — they are filler that marks generated text and say nothing about the candidate:',
    es: 'NO uses ninguna de estas expresiones — son relleno que delata texto generado y no dicen nada del candidato:',
  }[lang]

  return `${label}\n${SLOP_TERMS[lang].map((t) => `"${t}"`).join(', ')}`
}
