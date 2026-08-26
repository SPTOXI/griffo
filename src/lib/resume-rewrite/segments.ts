/**
 * A reescrita do currículo em três pedidos independentes, em vez de um só.
 *
 * A versão anterior pedia o currículo INTEIRO reescrito numa chamada de até
 * 8.000 tokens de saída, com uma tentativa só — o próprio código já registrava
 * por quê: "nenhum provedor reescreve um currículo completo em 25s", e dividir
 * o orçamento por duas tentativas garantia duas falhas em vez de um sucesso.
 *
 * Mesmo raciocínio de `lib/analysis/segments.ts`: três chamadas menores rodando
 * ao mesmo tempo terminam no tempo da mais lenta, não na soma, e cada uma cabe
 * folgada dentro do teto por tentativa do roteador — o que permite voltar a ter
 * suplente real por seção, em vez de abrir mão dele.
 *
 * A divisão é por CATEGORIA de conteúdo, não por item variável (uma chamada por
 * experiência, por exemplo): cada seção ainda recebe o currículo INTEIRO no
 * contexto compartilhado e produz só a fatia que lhe cabe. Isso evita duas
 * armadilhas de uma divisão mais fina — perder ou duplicar conteúdo ao tentar
 * separar o currículo em pedaços de tamanho variável, e quebrar a instrução de
 * "varie a redação entre os itens", que só funciona se o modelo vir todas as
 * experiências juntas numa chamada só.
 */

export type RewriteSegmentId = 'header' | 'experience' | 'education'

export const REWRITE_SEGMENT_IDS: RewriteSegmentId[] = ['header', 'experience', 'education']

export interface RewriteSegmentSpec {
  id: RewriteSegmentId
  instruction: string
  maxTokens: number
}

/** Regras válidas para as três seções — idênticas às da chamada única anterior. */
function sharedRules(keywordsHint: string): string {
  return `Você é um Redator Executivo Sênior especialista em currículos de alto impacto e otimização para sistemas de triagem (ATS).

REGRAS OBRIGATÓRIAS, válidas para o que você produzir:
1. Mantenha 100% da veracidade dos fatos originais. Só cite número, percentual ou indicador que exista no currículo original — quando não houver métrica, descreva o escopo real (tamanho da equipe, número de unidades, sistemas operados, porte da operação). Inventar métrica é falsificar o currículo do candidato.${keywordsHint}
2. Estruture a resposta usando formatação Markdown rica (títulos '## ', marcadores '- ', negritos '**').
3. NÃO invente dados de contato. Se o currículo original não traz e-mail, telefone ou LinkedIn, omita o campo — nunca escreva marcadores como "[seu e-mail]" ou "[link]", que chegam ao recrutador exatamente assim, como se fossem o conteúdo.
4. NÃO use emojis, ícones ou símbolos decorativos em nenhuma parte do documento. Ele é lido por sistemas de triagem (ATS), que os descartam ou corrompem, e a exportação em PDF não possui glifo para eles.
5. Responda APENAS a seção pedida, em Markdown puro, sem comentário antes ou depois.`
}

export function buildRewriteSegments(keywordsHint: string): RewriteSegmentSpec[] {
  return [
    {
      id: 'header',
      maxTokens: 1200,
      instruction: `${sharedRules(keywordsHint)}

SUA SEÇÃO: Cabeçalho e Resumo Profissional — e SÓ ela.

- Comece com '# ' seguido do nome do candidato (se estiver no currículo original) ou do cargo principal.
- Logo abaixo, os dados de contato disponíveis (sem inventar nenhum).
- Em seguida, '## Resumo Profissional': um parágrafo de resumo executivo reescrito, direcionado à vaga/área do currículo original.

NÃO produza experiências, formação, habilidades, idiomas ou certificações — isso é responsabilidade de outra seção.`,
    },
    {
      id: 'experience',
      maxTokens: 5000,
      instruction: `${sharedRules(keywordsHint)}

SUA SEÇÃO: '## Experiência Profissional' — e SÓ ela, completa, sem cortar nenhuma vaga do currículo original.

Reescreva TODAS as experiências profissionais do currículo original, com empresa, cargo e datas. Em cada uma, escreva realizações que tragam o RESULTADO alcançado, a EVIDÊNCIA desse resultado e a AÇÃO que o produziu — é o conteúdo das metodologias STAR e XYZ.
NÃO reproduza a fórmula como texto. As construções "medido por ..." e "fazendo ..." estão PROIBIDAS: repetidas em várias experiências seguidas, elas produzem um currículo de sintaxe idêntica do começo ao fim, que é exatamente o oposto do efeito pretendido. Varie a construção entre as experiências e escreva em português natural, como um profissional sênior escreveria.

NÃO produza cabeçalho, resumo, formação, habilidades, idiomas ou certificações — isso é responsabilidade de outra seção.`,
    },
    {
      id: 'education',
      maxTokens: 2000,
      instruction: `${sharedRules(keywordsHint)}

SUA SEÇÃO: Formação Acadêmica, Habilidades e Idiomas/Certificações — e SÓ elas.

Produza, nesta ordem, só o que o currículo original de fato tiver:
- '## Formação Acadêmica'
- '## Habilidades Técnicas e Comportamentais'
- '## Idiomas e Certificações' (se houver)

NÃO produza cabeçalho, resumo ou experiências profissionais — isso é responsabilidade de outra seção.`,
    },
  ]
}

/**
 * Junta as três seções na ordem certa.
 *
 * Simples concatenação — nenhuma seção depende do resultado de outra, e cada
 * uma já devolve Markdown pronto. `mergeSegments` do laudo principal calcula
 * uma nota geral a partir dos pedaços; aqui não há nada a derivar.
 */
export function mergeRewriteSegments(done: Partial<Record<RewriteSegmentId, string>>): string {
  return REWRITE_SEGMENT_IDS.map((id) => done[id]?.trim())
    .filter((text): text is string => Boolean(text))
    .join('\n\n')
}
