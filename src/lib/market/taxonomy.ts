/**
 * Taxonomia profissional — o mesmo trabalho, com nomes diferentes.
 *
 * O prompt mestre dá o exemplo exato (§8): um candidato é "Analista de Dados"
 * no Brasil, "Data Analyst" nos Estados Unidos, "Analista de Dados" em Portugal
 * e "Data Analyst / Datenanalyst" na Alemanha. É a MESMA pessoa e o MESMO
 * trabalho. Sem uma camada que saiba disso, o produto trata os quatro como
 * profissões distintas — e o matching de vagas erra em todos os mercados que
 * não sejam o de origem do texto.
 *
 * ## O que esta camada resolve, e o que ela não resolve
 *
 * Ela **normaliza** um título livre para um conceito, e **traduz** um conceito
 * para o vocabulário de um mercado. Não é dicionário de tradução: "Analista"
 * sozinho não vira nada, porque não é profissão — é metade de uma.
 *
 * Ela **não** entende títulos que não estão declarados aqui. Um título
 * desconhecido devolve `null`, e quem chama deve tratar isso como "não sei",
 * nunca como "não existe". Inventar um conceito para um título desconhecido
 * seria a mesma classe de erro dos fallbacks que a Etapa 1 removeu.
 *
 * ## Como crescer
 *
 * Acrescentar profissão é acrescentar entrada em `ROLE_CONCEPTS`. Acrescentar
 * mercado a uma profissão existente é acrescentar uma chave em `labels`. Nada
 * mais no código muda.
 */

import type { MarketId } from './index'

/** Identificador estável de um conceito profissional. Nunca exibido ao usuário. */
export type RoleConceptId = string

export interface RoleConcept {
  id: RoleConceptId
  /** Família à qual pertence. Usado para sugerir vizinhança quando não há match exato. */
  family: string
  /**
   * Como o cargo é chamado em cada mercado. A chave é o `MarketId`; `GLOBAL` é
   * o rótulo usado em mercado sem entrada própria, e é sempre em inglês porque
   * é a língua franca das vagas remotas internacionais.
   */
  labels: Partial<Record<MarketId, string>> & { GLOBAL: string }
  /**
   * Termos que identificam este conceito num título livre, em qualquer idioma.
   * Comparados sem acento e sem caixa. Um termo aqui precisa ser específico o
   * suficiente para não colidir com outro conceito — "analista" não serve,
   * "analista de dados" serve.
   */
  aliases: string[]
}

export const ROLE_CONCEPTS: RoleConcept[] = [
  {
    id: 'data_analyst',
    family: 'data',
    labels: {
      GLOBAL: 'Data Analyst',
      BR: 'Analista de Dados',
      PT: 'Analista de Dados',
      ES: 'Analista de Datos',
      MX: 'Analista de Datos',
      US: 'Data Analyst',
      CA: 'Data Analyst',
      GB: 'Data Analyst',
      DE: 'Data Analyst / Datenanalyst',
      FR: 'Data Analyst / Analyste de données',
      IN: 'Data Analyst',
      AU: 'Data Analyst',
      JP: 'Data Analyst / データアナリスト',
    },
    aliases: [
      'data analyst', 'analista de dados', 'analista de datos', 'datenanalyst',
      'analyste de donnees', 'analista bi', 'business intelligence analyst', 'analista de bi',
    ],
  },
  {
    id: 'data_engineer',
    family: 'data',
    labels: {
      GLOBAL: 'Data Engineer',
      BR: 'Engenheiro de Dados',
      PT: 'Engenheiro de Dados',
      ES: 'Ingeniero de Datos',
      MX: 'Ingeniero de Datos',
      US: 'Data Engineer',
      CA: 'Data Engineer',
      GB: 'Data Engineer',
      DE: 'Data Engineer / Dateningenieur',
      FR: 'Data Engineer / Ingénieur données',
      IN: 'Data Engineer',
      AU: 'Data Engineer',
      JP: 'Data Engineer / データエンジニア',
    },
    aliases: [
      'data engineer', 'engenheiro de dados', 'engenheira de dados', 'ingeniero de datos',
      'dateningenieur', 'ingenieur donnees', 'etl developer', 'analytics engineer',
    ],
  },
  {
    id: 'data_scientist',
    family: 'data',
    labels: {
      GLOBAL: 'Data Scientist',
      BR: 'Cientista de Dados',
      PT: 'Cientista de Dados',
      ES: 'Científico de Datos',
      MX: 'Científico de Datos',
      US: 'Data Scientist',
      CA: 'Data Scientist',
      GB: 'Data Scientist',
      DE: 'Data Scientist',
      FR: 'Data Scientist',
      IN: 'Data Scientist',
      AU: 'Data Scientist',
      JP: 'Data Scientist / データサイエンティスト',
    },
    aliases: [
      'data scientist', 'cientista de dados', 'cientifico de datos', 'machine learning engineer',
      'engenheiro de machine learning', 'ml engineer',
    ],
  },
  {
    id: 'software_engineer',
    family: 'engineering',
    labels: {
      GLOBAL: 'Software Engineer',
      BR: 'Desenvolvedor de Software',
      PT: 'Programador / Engenheiro de Software',
      ES: 'Desarrollador de Software',
      MX: 'Desarrollador de Software',
      US: 'Software Engineer',
      CA: 'Software Engineer',
      GB: 'Software Engineer / Developer',
      DE: 'Softwareentwickler / Software Engineer',
      FR: 'Développeur / Ingénieur logiciel',
      IN: 'Software Engineer',
      AU: 'Software Engineer',
      JP: 'Software Engineer / ソフトウェアエンジニア',
    },
    aliases: [
      'software engineer', 'software developer', 'desenvolvedor de software', 'desenvolvedor',
      'desenvolvedora', 'programador', 'programadora', 'desarrollador de software', 'desarrollador',
      'softwareentwickler', 'developpeur', 'ingenieur logiciel', 'engenheiro de software',
    ],
  },
  {
    id: 'frontend_engineer',
    family: 'engineering',
    labels: {
      GLOBAL: 'Frontend Engineer',
      BR: 'Desenvolvedor Front-end',
      PT: 'Programador Front-end',
      ES: 'Desarrollador Front-end',
      MX: 'Desarrollador Front-end',
      US: 'Frontend Engineer',
      CA: 'Frontend Engineer',
      GB: 'Frontend Developer',
      DE: 'Frontend-Entwickler',
      FR: 'Développeur Front-end',
      IN: 'Frontend Engineer',
      AU: 'Frontend Engineer',
      JP: 'Frontend Engineer / フロントエンドエンジニア',
    },
    aliases: [
      'frontend engineer', 'front end engineer', 'frontend developer', 'front-end developer',
      'desenvolvedor front-end', 'desenvolvedor frontend', 'desarrollador front-end',
      'frontend entwickler', 'developpeur front-end',
    ],
  },
  {
    id: 'backend_engineer',
    family: 'engineering',
    labels: {
      GLOBAL: 'Backend Engineer',
      BR: 'Desenvolvedor Back-end',
      PT: 'Programador Back-end',
      ES: 'Desarrollador Back-end',
      MX: 'Desarrollador Back-end',
      US: 'Backend Engineer',
      CA: 'Backend Engineer',
      GB: 'Backend Developer',
      DE: 'Backend-Entwickler',
      FR: 'Développeur Back-end',
      IN: 'Backend Engineer',
      AU: 'Backend Engineer',
      JP: 'Backend Engineer / バックエンドエンジニア',
    },
    aliases: [
      'backend engineer', 'back end engineer', 'backend developer', 'back-end developer',
      'desenvolvedor back-end', 'desenvolvedor backend', 'desarrollador back-end',
      'backend entwickler', 'developpeur back-end',
    ],
  },
  {
    id: 'product_manager',
    family: 'product',
    labels: {
      GLOBAL: 'Product Manager',
      BR: 'Gerente de Produto',
      PT: 'Gestor de Produto',
      ES: 'Gerente de Producto',
      MX: 'Gerente de Producto',
      US: 'Product Manager',
      CA: 'Product Manager',
      GB: 'Product Manager',
      DE: 'Product Manager / Produktmanager',
      FR: 'Product Manager / Chef de produit',
      IN: 'Product Manager',
      AU: 'Product Manager',
      JP: 'Product Manager / プロダクトマネージャー',
    },
    aliases: [
      'product manager', 'gerente de produto', 'gestor de produto', 'gerente de producto',
      'produktmanager', 'chef de produit', 'product owner', 'dono do produto',
    ],
  },
  {
    id: 'project_manager',
    family: 'delivery',
    labels: {
      GLOBAL: 'Project Manager',
      BR: 'Gerente de Projetos',
      PT: 'Gestor de Projetos',
      ES: 'Gerente de Proyectos',
      MX: 'Gerente de Proyectos',
      US: 'Project Manager',
      CA: 'Project Manager',
      GB: 'Project Manager',
      DE: 'Projektmanager',
      FR: 'Chef de projet',
      IN: 'Project Manager',
      AU: 'Project Manager',
      JP: 'Project Manager / プロジェクトマネージャー',
    },
    aliases: [
      'project manager', 'gerente de projetos', 'gestor de projetos', 'gerente de proyectos',
      'projektmanager', 'chef de projet', 'scrum master',
    ],
  },
  {
    id: 'ux_designer',
    family: 'design',
    labels: {
      GLOBAL: 'UX Designer',
      BR: 'Designer de UX',
      PT: 'Designer de UX',
      ES: 'Diseñador UX',
      MX: 'Diseñador UX',
      US: 'UX Designer',
      CA: 'UX Designer',
      GB: 'UX Designer',
      DE: 'UX Designer',
      FR: 'UX Designer',
      IN: 'UX Designer',
      AU: 'UX Designer',
      JP: 'UX Designer / UXデザイナー',
    },
    aliases: [
      'ux designer', 'designer de ux', 'disenador ux', 'product designer', 'designer de produto',
      'ui ux designer', 'ux ui designer',
    ],
  },
  {
    id: 'marketing_analyst',
    family: 'marketing',
    labels: {
      GLOBAL: 'Marketing Analyst',
      BR: 'Analista de Marketing',
      PT: 'Analista de Marketing',
      ES: 'Analista de Marketing',
      MX: 'Analista de Marketing',
      US: 'Marketing Analyst',
      CA: 'Marketing Analyst',
      GB: 'Marketing Analyst',
      DE: 'Marketing Analyst',
      FR: 'Analyste marketing',
      IN: 'Marketing Analyst',
      AU: 'Marketing Analyst',
      JP: 'Marketing Analyst / マーケティングアナリスト',
    },
    aliases: [
      'marketing analyst', 'analista de marketing', 'analyste marketing',
      'growth analyst', 'analista de growth', 'digital marketing analyst',
    ],
  },
  {
    id: 'accountant',
    family: 'finance',
    labels: {
      GLOBAL: 'Accountant',
      BR: 'Contador',
      PT: 'Contabilista',
      ES: 'Contador',
      MX: 'Contador',
      US: 'Accountant',
      CA: 'Accountant',
      GB: 'Accountant',
      DE: 'Buchhalter',
      FR: 'Comptable',
      IN: 'Accountant',
      AU: 'Accountant',
      JP: 'Accountant / 会計士',
    },
    aliases: [
      'accountant', 'contador', 'contadora', 'contabilista', 'buchhalter', 'comptable',
      'analista contabil', 'analista contable',
    ],
  },
  {
    id: 'nurse',
    family: 'health',
    labels: {
      GLOBAL: 'Registered Nurse',
      BR: 'Enfermeiro',
      PT: 'Enfermeiro',
      ES: 'Enfermero',
      MX: 'Enfermero',
      US: 'Registered Nurse',
      CA: 'Registered Nurse',
      GB: 'Registered Nurse',
      DE: 'Pflegefachkraft',
      FR: 'Infirmier',
      IN: 'Staff Nurse',
      AU: 'Registered Nurse',
      JP: 'Nurse / 看護師',
    },
    // `nurse` sozinho é alias de propósito: "staff nurse" perde o "staff" na
    // remoção de ruído de senioridade (que existe por causa de "Staff
    // Engineer"), e sem o termo simples o cargo ficaria irreconhecível.
    aliases: [
      'nurse', 'registered nurse', 'staff nurse', 'enfermeiro', 'enfermeira', 'enfermero',
      'enfermera', 'pflegefachkraft', 'krankenpfleger', 'infirmier', 'infirmiere',
    ],
  },
]

const BY_ID = new Map(ROLE_CONCEPTS.map((c) => [c.id, c]))

/** Sem acento, sem caixa, sem pontuação — a forma em que títulos são comparados. */
export function foldTitle(raw: string): string {
  return (raw || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Ruído de senioridade e de vínculo que atrapalha a identificação do cargo.
 * "Desenvolvedor Back-end Sênior (PJ)" e "Backend Developer" são o mesmo cargo.
 */
const TITLE_NOISE = [
  'senior', 'sênior', 'sr', 'junior', 'jr', 'pleno', 'mid level', 'midlevel', 'mid',
  'lead', 'principal', 'staff', 'especialista', 'specialist', 'estagiario', 'estagio',
  'intern', 'internship', 'trainee', 'aprendiz', 'clt', 'pj', 'freelance', 'freelancer',
  'remoto', 'remote', 'hibrido', 'hybrid', 'presencial', 'onsite', 'home office',
  'i', 'ii', 'iii', 'iv',
]

function stripNoise(folded: string): string {
  const noise = new Set(TITLE_NOISE.map(foldTitle))
  return folded
    .split(' ')
    .filter((token) => !noise.has(token))
    .join(' ')
    .trim()
}

export interface TitleMatch {
  concept: RoleConcept
  /** Como o título casou: exato, ou por conter o termo. */
  how: 'exact' | 'contains'
}

/**
 * O conceito por trás de um título livre — ou `null`.
 *
 * `null` significa "não reconheço", e é uma resposta legítima. Quem chama deve
 * seguir usando o título original: um cargo desconhecido não é um cargo
 * inexistente, e forçá-lo no conceito mais parecido produziria o mesmo tipo de
 * invenção que a Etapa 1 arrancou do laudo.
 *
 * A correspondência prefere o alias mais longo, para que "engenheiro de dados"
 * não seja capturado por um alias curto de outra profissão que por acaso apareça
 * dentro dele.
 */
export function matchTitle(rawTitle: string): TitleMatch | null {
  const folded = stripNoise(foldTitle(rawTitle))
  if (!folded) return null

  let best: { concept: RoleConcept; how: 'exact' | 'contains'; length: number } | null = null

  for (const concept of ROLE_CONCEPTS) {
    for (const alias of concept.aliases) {
      const foldedAlias = foldTitle(alias)
      if (!foldedAlias) continue

      let how: 'exact' | 'contains' | null = null
      if (folded === foldedAlias) how = 'exact'
      else if (folded.includes(foldedAlias)) how = 'contains'
      if (!how) continue

      // Exato sempre vence; entre parciais, vence o alias mais específico.
      const better =
        !best ||
        (how === 'exact' && best.how !== 'exact') ||
        (how === best.how && foldedAlias.length > best.length)

      if (better) best = { concept, how, length: foldedAlias.length }
    }
  }

  return best ? { concept: best.concept, how: best.how } : null
}

/** O conceito de um título, sem o detalhe de como casou. */
export function conceptForTitle(rawTitle: string): RoleConcept | null {
  return matchTitle(rawTitle)?.concept ?? null
}

/** Como este conceito se chama neste mercado. Cai no rótulo global. */
export function titleForMarket(conceptId: RoleConceptId, marketId: MarketId): string | null {
  const concept = BY_ID.get(conceptId)
  if (!concept) return null
  return concept.labels[marketId] ?? concept.labels.GLOBAL
}

/**
 * O mesmo cargo, dito no vocabulário de outro mercado.
 *
 * É a função do exemplo do §8: entra "Analista de Dados" e o mercado alemão,
 * sai "Data Analyst / Datenanalyst". Título desconhecido devolve `null` — e
 * quem chama mantém o original, porque um nome que não sabemos traduzir ainda é
 * o nome certo no mercado de origem.
 */
export function translateTitle(rawTitle: string, targetMarket: MarketId): string | null {
  const concept = conceptForTitle(rawTitle)
  if (!concept) return null
  return concept.labels[targetMarket] ?? concept.labels.GLOBAL
}

/** Dois títulos, possivelmente em idiomas diferentes, são o mesmo trabalho? */
export function isSameRole(titleA: string, titleB: string): boolean {
  const a = conceptForTitle(titleA)
  const b = conceptForTitle(titleB)
  // Dois desconhecidos não são "iguais": são dois desconhecidos.
  if (!a || !b) return false
  return a.id === b.id
}

/* ------------------------------------------------------------------ *
 * Senioridade
 * ------------------------------------------------------------------ */

export const SENIORITY_ORDER = [
  'intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'director', 'executive',
] as const
export type SeniorityLevel = (typeof SENIORITY_ORDER)[number]

/** Termos de senioridade por nível, em vários idiomas. */
const SENIORITY_TERMS: Record<SeniorityLevel, string[]> = {
  intern: ['intern', 'internship', 'estagiario', 'estagio', 'trainee', 'aprendiz', 'praktikant', 'stagiaire', 'becario'],
  junior: ['junior', 'jr', 'entry level', 'iniciante', 'assistente', 'auxiliar', 'einsteiger', 'debutant'],
  mid: ['pleno', 'mid', 'mid level', 'intermediate', 'intermediario', 'regular'],
  senior: ['senior', 'sr', 'senior level', 'experiente', 'erfahren'],
  lead: ['lead', 'tech lead', 'team lead', 'coordenador', 'coordenadora', 'supervisor', 'teamleiter'],
  principal: ['principal', 'staff', 'especialista', 'specialist', 'expert', 'referente tecnico'],
  director: ['director', 'diretor', 'diretora', 'head of', 'head', 'gerente senior', 'direktor'],
  executive: ['executive', 'chief', 'cto', 'ceo', 'cfo', 'coo', 'cpo', 'vp', 'vice president', 'presidente'],
}

/**
 * O nível de senioridade indicado por um título — ou `null`.
 *
 * Percorre do topo para a base porque os termos altos são mais específicos:
 * "head of engineering" contém "engineering" mas o que decide é "head of", e um
 * varredura de baixo para cima poderia parar antes de chegar lá.
 */
export function seniorityFromTitle(rawTitle: string): SeniorityLevel | null {
  const folded = ` ${foldTitle(rawTitle)} `
  const levels = [...SENIORITY_ORDER].reverse()

  for (const level of levels) {
    for (const term of SENIORITY_TERMS[level]) {
      if (folded.includes(` ${foldTitle(term)} `)) return level
    }
  }
  return null
}

/**
 * A senioridade do candidato atende à pedida pela vaga?
 *
 * Um nível acima é aceito: quem é sênior atende vaga de pleno, ainda que possa
 * não querer. Abaixo, não — e é isso que o filtro duro do Radar (§16) usa para
 * descartar antes de gastar IA.
 *
 * Qualquer lado desconhecido devolve `true`: na dúvida, não elimine. Um filtro
 * duro que descarta por falta de informação transforma dado ausente em rejeição,
 * que é pior do que avaliar a mais.
 */
export function seniorityMeets(
  candidate: SeniorityLevel | null,
  required: SeniorityLevel | null
): boolean {
  if (!candidate || !required) return true
  return SENIORITY_ORDER.indexOf(candidate) >= SENIORITY_ORDER.indexOf(required)
}
