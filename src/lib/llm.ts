import OpenAI from 'openai'
import { db } from './db'
import { executeAiTask } from './ai-router/router'
import { tryDecryptSecret } from './crypto'
import { MODEL_PRICING, PROVIDER_CONFIGS } from './ai-router/registry'
import { FX_TO_BRL } from './currency'

export async function getLlmConfig() {
  let apiKey = process.env.MOONSHOT_API_KEY || process.env.LLM_API_KEY || ''
  let baseURL = process.env.MOONSHOT_BASE_URL || process.env.LLM_BASE_URL || 'https://api.moonshot.ai/v1'
  let model = process.env.MOONSHOT_MODEL || process.env.LLM_MODEL || 'kimi-k3'

  try {
    const configs = await db.systemConfig.findMany()
    for (const c of configs) {
      if ((c.key === 'MOONSHOT_API_KEY' || c.key === 'LLM_API_KEY') && c.value) {
        apiKey = tryDecryptSecret(c.value, `SystemConfig.${c.key}`) || apiKey
      }
      if ((c.key === 'KIMI_MODEL' || c.key === 'LLM_MODEL') && c.value) {
        model = c.value
      }
      if ((c.key === 'MOONSHOT_BASE_URL' || c.key === 'LLM_BASE_URL') && c.value) {
        baseURL = c.value
      }
    }
  } catch (e) {
    // If DB is unreachable or during build, fallback to env vars
  }

  return { apiKey: apiKey.trim(), baseURL: baseURL.trim(), model: model.trim() }
}

export async function getClient(): Promise<{ client: OpenAI; model: string }> {
  const config = await getLlmConfig()
  if (!config.apiKey) {
    throw new Error(
      'Chave de API não configurada. Por favor, adicione a MOONSHOT_API_KEY no painel Admin ou no arquivo .env.'
    )
  }
  return {
    client: new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    }),
    model: config.model,
  }
}

// Custo por token (USD), derivado do modelo que de fato roda a análise e a
// reescrita — ambas roteadas para `claude` em INITIAL_TASK_ROUTING.
//
// Antes era uma cópia literal dos números, mantida à mão. Uma tabela duplicada
// só fica correta por coincidência: quando o preço do Opus 5 estava errado no
// registry, esta não acompanhou, e as duas divergiram sem que nada acusasse.
export const TOKEN_COST =
  MODEL_PRICING[PROVIDER_CONFIGS.claude.defaultModel] ?? PROVIDER_CONFIGS.claude.pricing

export function costPerCycleUsd(): number {
  const analysisIn = (1800 / 1000) * TOKEN_COST.inputPer1k
  const analysisOut = (1500 / 1000) * TOKEN_COST.outputPer1k
  const rewriteIn = (2500 / 1000) * TOKEN_COST.inputPer1k
  const rewriteOut = (2200 / 1000) * TOKEN_COST.outputPer1k
  return analysisIn + analysisOut + rewriteIn + rewriteOut
}

export function computePricing() {
  const brlRate = FX_TO_BRL.usd
  const cycleUsd = costPerCycleUsd()
  const cycleBrl = cycleUsd * brlRate

  return {
    day: {
      priceBrl: 19.90,
      estimatedCycles: 5,
      estimatedAiCostBrl: cycleBrl * 5,
      marginBrl: 19.90 - cycleBrl * 5,
      marginPercent: Math.round(((19.90 - cycleBrl * 5) / 19.90) * 100),
    },
    monthly: {
      priceBrl: 39.90,
      estimatedCycles: 15,
      estimatedAiCostBrl: cycleBrl * 15,
      marginBrl: 39.90 - cycleBrl * 15,
      marginPercent: Math.round(((39.90 - cycleBrl * 15) / 39.90) * 100),
    },
    annual: {
      priceBrl: 299.90,
      estimatedCycles: 100,
      estimatedAiCostBrl: cycleBrl * 100,
      marginBrl: 299.90 - cycleBrl * 100,
      marginPercent: Math.round(((299.90 - cycleBrl * 100) / 299.90) * 100),
    },
  }
}

export interface AnalysisDimension {
  key: string
  label: string
  score: number // 0-10
  rationale: string
}

export interface SocialProfileAdvice {
  platform: string // 'LinkedIn' | 'Gupy' | 'GitHub' | 'Instagram' | 'Portfólio'
  url: string
  headline?: string
  aboutSummary?: string
  tips: string[]
}

export interface ResumeAnalysis {
  overall: number // 0-10 weighted overall
  dimensions: AnalysisDimension[] // each dimension scored 0-10
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  keywords: string[] // suggested ATS keywords
  atsFriendly: boolean
  summary: string
  socialAdvice?: SocialProfileAdvice[]
}

const ANALYSIS_SYSTEM = `Você é o avaliador de carreiras e inteligência de recrutamento do Griffo. Você combina as melhores práticas de triagem automática de ATS (Gupy, LinkedIn Talent Solutions, Workday, Taleo, Greenhouse, Lever), critérios rigorosos de recrutadores executivos, métodos de mensuração de impacto (Fórmula STAR & Google XYZ), análise de presença digital (LinkedIn/Gupy/Social) e sistemas validados de plano de carreira e capacitação profissional.

Sua missão: analisar o currículo do usuário com alta precisão e gerar um laudo técnico completo e objetivo em formato JSON.

AVALIE ESTAS DIMENSÕES FUNDAMENTAIS (nota de 0 a 10 cada uma):
1. "structure": Estrutura & Compatibilidade ATS
   - Nomes de seções padrão ("Resumo Profissional", "Experiência Profissional", "Formação Acadêmica", "Habilidades Técnicas", "Certificações"). Ordem cronológica inversa. Ausência de tabelas ou formatos que quebram a leitura robótica.
2. "summary": Resumo Profissional & Posicionamento
   - Proposta de valor clara, nível de senioridade perceptível (Júnior, Pleno, Sênior, Especialista, Liderança), especializações e diferenciais competitivos.
3. "impact": Resultados Quantificados (STAR & Google XYZ)
   - Uso de dados e métricas concretas (%, R$, prazos, volumes, entregas). Aplicação da fórmula: "Alcancei [Resultado] medido por [Métrica] realizando [Ação]".
4. "skills": Habilidades Técnicas & Competências
   - Relevância, profundidade e atualização da stack tecnológica, ferramentas, frameworks e metodologias com base nas demandas atuais de mercado.
5. "experience": Experiência Profissional & Verbos de Ação
   - Clareza no escopo de responsabilidade, autonomia e uso de verbos de ação marcantes no início das descrições.
6. "keywords": Palavras-Chave & Match com Vagas (Gupy/LinkedIn)
   - Termos técnicos estratégicos do setor essenciais para passar nos filtros automáticos de busca de recrutadores.
7. "career": Trajetória & Plano de Carreira
   - Coerência da evolução de cargos, estabilidade, identificação de lacunas de crescimento e projeção do próximo cargo/passo de carreira recomendado.
8. "upskilling": Capacitação & Cursos Recomendados
   - Identificação de garras/gaps de conhecimento e sugestão objetiva de cursos, certificações de mercado (ex: AWS, Azure, Scrum Master, PMP, especializações) ou projetos práticos para acelerar o desenvolvimento.

REGRAS DE PRESENÇA DIGITAL & REDES SOCIAIS GLOBAIS (SE FORNECIDAS):
Se o usuário forneceu links para perfis profissionais (LinkedIn, Gupy, Behance, Dribbble, GitHub, StackOverflow, Kaggle, Xing, Medium, Substack, Portfólio próprio) e autorizou a análise de presença digital, avalie esses canais no contexto da meta profissional dele e gere uma chave "socialAdvice" no JSON contendo sugestões de Headline (Título), seção 'Sobre' e dicas de algoritmos/SEO para cada perfil.

FORMATO DE SAÍDA EXIGIDO:
Você deve retornar APENAS um objeto JSON válido, sem qualquer texto fora do JSON, sem marcações markdown extra. O JSON deve ter a estrutura exata:
{
  "overall": 8.5,
  "dimensions": [
    { "key": "structure", "label": "Estrutura & Compatibilidade ATS", "score": 9, "rationale": "Explicação..." },
    { "key": "summary", "label": "Resumo & Posicionamento", "score": 8, "rationale": "Explicação..." },
    { "key": "impact", "label": "Resultados Quantificados (STAR/XYZ)", "score": 8, "rationale": "Explicação..." },
    { "key": "skills", "label": "Habilidades & Ferramentas", "score": 9, "rationale": "Explicação..." },
    { "key": "experience", "label": "Experiência & Verbos de Ação", "score": 8, "rationale": "Explicação..." },
    { "key": "keywords", "label": "Palavras-Chave (Gupy/LinkedIn)", "score": 9, "rationale": "Explicação..." },
    { "key": "career", "label": "Trajetória & Plano de Carreira", "score": 8, "rationale": "Explicação..." },
    { "key": "upskilling", "label": "Capacitação & Cursos Recomendados", "score": 8, "rationale": "Explicação..." }
  ],
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "weaknesses": ["Ponto a melhorar 1", "Ponto a melhorar 2"],
  "recommendations": ["Recomendação prática 1", "Recomendação prática 2"],
  "keywords": ["React", "TypeScript", "Node.js", "Jest", "Docker"],
  "atsFriendly": true,
  "summary": "Resumo executivo com diagnóstico geral...",
  "socialAdvice": [
    {
      "platform": "LinkedIn",
      "url": "...",
      "headline": "Título Profissional Recomendado",
      "aboutSummary": "Texto sugerido para o Sobre...",
      "tips": ["Dica de algoritmo 1", "Dica de palavras-chave 2"]
    }
  ]
}`

const REWRITE_SYSTEM = `Você é o especialista master em reescrita e otimização de currículos do Griffo, alinhado aos padrões da Gupy, LinkedIn Talent Solutions e consultorias de recolocação executiva.

Sua tarefa: reescrever o currículo do usuário elevando a qualidade ao nível top 5% dos candidatos do mercado.

REGRAS RÍGIDAS DE REESCRITA:
1. FIDELIDADE AOS FATOS: Mantenha 100% dos dados reais (empresas, datas, cargos, formação). NÃO invente experiências ou dados fictícios.
2. FÓRMULA DE IMPACTO (STAR / GOOGLE XYZ): Reescreva todos os tópicos de experiência no padrão: Verbo de Ação + Contexto/Escopo + Resultado Mensurável ou Valor Qualitativo Sólido.
3. ESTRUTURA PADRONIZADA ATS (GUPY / LINKEDIN):
   # Nome Completo
   Contato: Cidade/UF | E-mail | Telefone | LinkedIn | GitHub/Portfólio (se aplicável)
   
   ## Resumo Profissional
   (3 a 5 linhas destacando senioridade, áreas de domínio, conquistas principais e objetivo profissional)
   
   ## Experiência Profissional
   ### Cargo | Nome da Empresa (Mês/Ano – Mês/Ano ou Presente)
   - Bullet point com verbo de ação e resultado...
   
   ## Formação Acadêmica
   - Nome do Curso - Instituição (Ano de Conclusão)
   
   ## Certificações & Capacitação
   - Nome do Curso / Certificação - Instituição (Ano)
   
   ## Habilidades Técnicas & Ferramentas
   - Categorias claras (Linguagens, Frameworks, Ferramentas, Metodologias, Idiomas)

4. PALAVRAS-CHAVE E LINGUAGEM: Incorpore termos estratégicos do setor para superação dos algoritmos de busca.
5. FORMATO: Retorne APENAS o currículo reescrito em Markdown limpo, sem textos introdutórios ou comentários.`

export async function analyzeResume(
  resumeText: string,
  socialLinks?: Record<string, string> | null,
  socialConsent?: boolean,
  userId?: string,
  resumeId?: string
): Promise<{ analysis: ResumeAnalysis; tokensIn: number; tokensOut: number }> {
  let userPrompt = `Analise o currículo abaixo de acordo com todas as diretrizes de avaliação, plano de carreira e capacitação:\n\n--- CURRÍCULO ---\n${resumeText}`

  if (socialConsent && socialLinks && Object.keys(socialLinks).length > 0) {
    userPrompt += `\n\n--- PERFIS EM REDES SOCIAIS & PLATAFORMAS (Autorizado pelo usuário para análise e otimização de presença digital) ---`
    for (const [platform, url] of Object.entries(socialLinks)) {
      if (url && url.trim().length > 0) {
        userPrompt += `\n- ${platform}: ${url.trim()}`
      }
    }
    userPrompt += `\n\nComo o usuário autorizou a análise de suas redes/perfis profissionais, por favor inclua o campo "socialAdvice" no JSON gerando orientações diretas de otimização para cada plataforma (especialmente sugestões de Título/Headline, seção 'Sobre' e dicas para algoritmos do LinkedIn e Gupy).`
  }

  // Execute via AI Router
  const res = await executeAiTask({
    taskType: 'full_analysis',
    systemPrompt: ANALYSIS_SYSTEM,
    userPrompt,
    temperature: 0.3,
    maxTokens: 3500,
    userId,
    resumeId,
  })

  // Extract JSON string cleanly
  let cleaned = res.content.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }

  let analysis: ResumeAnalysis
  try {
    analysis = JSON.parse(cleaned) as ResumeAnalysis
  } catch (e) {
    analysis = {
      overall: 5,
      dimensions: [
        { key: 'structure', label: 'Estrutura & Compatibilidade ATS', score: 5, rationale: 'Falha ao processar a resposta do modelo.' },
        { key: 'summary', label: 'Resumo & Posicionamento', score: 5, rationale: '—' },
        { key: 'impact', label: 'Resultados Quantificados (STAR/XYZ)', score: 5, rationale: '—' },
        { key: 'skills', label: 'Habilidades & Ferramentas', score: 5, rationale: '—' },
        { key: 'experience', label: 'Experiência & Verbos de Ação', score: 5, rationale: '—' },
        { key: 'keywords', label: 'Palavras-Chave (Gupy/LinkedIn)', score: 5, rationale: '—' },
        { key: 'career', label: 'Trajetória & Plano de Carreira', score: 5, rationale: '—' },
        { key: 'upskilling', label: 'Capacitação & Cursos Recomendados', score: 5, rationale: '—' },
      ],
      strengths: [],
      weaknesses: ['Houve uma inconsistência no formato de saída da IA. Tente novamente.'],
      recommendations: [],
      keywords: [],
      atsFriendly: false,
      summary: 'Não foi possível interpretar os dados detalhados da análise.',
    }
  }

  return { analysis, tokensIn: res.tokensIn, tokensOut: res.tokensOut }
}

export async function rewriteResume(
  originalText: string,
  analysisJson: string,
  userId?: string,
  resumeId?: string
): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  const userPrompt = `Currículo original:\n\n${originalText}\n\n--- Laudo de análise (use para priorizar correções) ---\n${analysisJson}\n\nReescreva o currículo em Markdown conforme as instruções.`

  // Execute via AI Router
  const res = await executeAiTask({
    taskType: 'rewrite',
    systemPrompt: REWRITE_SYSTEM,
    userPrompt,
    temperature: 0.5,
    maxTokens: 3500,
    userId,
    resumeId,
  })

  return { content: res.content.trim(), tokensIn: res.tokensIn, tokensOut: res.tokensOut }
}

// Pricing model
export interface PlanPricing {
  id: string
  name: string
  priceBrl: number
  period: string
  features: string[]
}

export const PRICING_PLANS: Record<string, PlanPricing> = {
  day: {
    id: 'day',
    name: 'Passe Diário',
    priceBrl: 19.90,
    period: '24 horas',
    features: [
      '5 análises completas de currículo',
      '3 reescritas profissionais',
      'Downloads ilimitados (PDF & Texto Editável)',
      'Otimização para LinkedIn & Gupy',
      'Verificação de aprovação em ATS',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Assinatura Mensal',
    priceBrl: 39.90,
    period: 'por mês',
    features: [
      '30 análises de currículo / mês',
      '20 reescritas profissionais / mês',
      'Otimização contínua de Redes Sociais',
      'Histórico completo de laudos',
      'Downloads ilimitados em PDF & Texto Editável',
      'Suporte prioritário por e-mail',
    ],
  },
  annual: {
    id: 'annual',
    name: 'Assinatura Anual',
    priceBrl: 299.90,
    period: 'por ano (equivalente a R$ 24,99/mês)',
    features: [
      '365 análises de currículo / ano',
      '240 reescritas profissionais / ano',
      'Otimização ilimitada de Presença Digital',
      'Economize +37% em relação ao mensal',
      'Histórico vitalício durante a assinatura',
      'Suporte prioritário via canal direto',
    ],
  },
}
