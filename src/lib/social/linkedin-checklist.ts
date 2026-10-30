/**
 * O que um perfil de LinkedIn precisa ter, como lista de verificação para o
 * prompt — não como nota.
 *
 * ## Origem
 *
 * Adaptado do `rubric.json` do `/li-profile` do linkedin-agent-skill (Jake
 * Schincariol, MIT). Lá são doze itens somando 100 pontos; aqui ficam só os
 * critérios, sem pontos. Pelo mesmo motivo de `writing/slop.ts`: o peso de
 * cada item é escolha de alguém, e somar dá a uma escolha a aparência de
 * medição. O que o candidato precisa é saber o que falta, não um número.
 *
 * Ficaram de fora os itens que não conseguimos ver: foto e banner não chegam
 * no texto colado nem no PDF do LinkedIn. Pedir ao modelo que os avalie seria
 * pedir que inventasse — então entram só como "confira", nunca como achado.
 *
 * Puro e sem dependência, para poder ser testado sem servidor.
 */

/** Limite do headline no LinkedIn, em caracteres. */
export const LINKEDIN_HEADLINE_MAX = 220

/**
 * Teto recomendado para o "Sobre". O LinkedIn aceita 2.600; o texto que
 * alguém de fato lê até o fim é bem menor.
 */
export const LINKEDIN_ABOUT_MAX = 1400

export function linkedinChecklistPrompt(): string {
  return `CRITÉRIOS ESPECÍFICOS DO LINKEDIN (use para os achados, o texto pronto e as dicas):

- Headline (até ${LINKEDIN_HEADLINE_MAX} caracteres): diz o que a pessoa faz e para quem, traz UMA prova concreta tirada do currículo (número, empresa, sistema) e não é só o cargo. Estrutura que funciona: "o que faço, para quem | prova | área ou tipo de oportunidade". Não comece com "Ajudando..." nem com "Apaixonado por...".
- "Sobre", duas primeiras linhas: é tudo o que aparece antes do "ver mais" no celular, então para a maioria dos leitores é o "Sobre" inteiro. Elas precisam dizer, sozinhas, quem a pessoa é profissionalmente e o que entrega. Nada de "apaixonado", "proativo", "focado em resultados", bio em terceira pessoa ou começar pelo próprio nome.
- "Sobre", corpo: primeira pessoa, até ${LINKEDIN_ABOUT_MAX} caracteres, com pelo menos um resultado com número tirado do currículo e uma linha final dizendo que tipo de contato ou oportunidade a pessoa quer.
- Cargo atual: uma linha de escopo e dois ou três resultados — não a lista de tarefas da descrição de vaga.
- Coerência: cargos, empresas e datas iguais aos do currículo. Divergência aqui é o que mais derruba candidato na triagem.
- Habilidades: as que aparecem no currículo e nas vagas que a pessoa quer, e não uma lista genérica.
- Seção "Em destaque", foto e banner: NÃO dá para ver pelo texto. Não descreva como estão; se couber, sugira que a pessoa confira (destaque com um trabalho ou publicação real, foto recente com o rosto visível, banner que não seja o padrão).

No "aboutSummary", escreva as duas primeiras linhas pensando que serão as únicas lidas.`
}
