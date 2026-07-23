import OpenAI from 'openai'
import { db } from './db'

export async function getLlmConfig() {
  let apiKey = process.env.MOONSHOT_API_KEY || process.env.LLM_API_KEY || ''
  let baseURL = process.env.MOONSHOT_BASE_URL || process.env.LLM_BASE_URL || 'https://api.moonshot.ai/v1'
  let model = process.env.MOONSHOT_MODEL || process.env.LLM_MODEL || 'kimi-k3'

  try {
    const configs = await db.systemConfig.findMany()
    for (const c of configs) {
      if ((c.key === 'MOONSHOT_API_KEY' || c.key === 'LLM_API_KEY') && c.value) {
        apiKey = c.value
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

// Cost estimation per token (USD)
// Kimi K3 / LLM default pricing model
export const TOKEN_COST = {
  inputPer1k: 0.003, // $3.00 / 1M tokens
  outputPer1k: 0.015, // $15.00 / 1M tokens
}

export interface AnalysisDimension {
  key: string
  label: string
  score: number // 0-10
  rationale: string
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
}

const ANALYSIS_SYSTEM = `Você é o avaliador de carreiras e inteligência de recrutamento do Griffo. Você combina as melhores práticas de triagem automática de ATS (Gupy, LinkedIn Talent Solutions, Workday, Taleo, Greenhouse, Lever), critérios rigorosos de recrutadores executivos, métodos de mensuração de impacto (Fórmula STAR & Google XYZ) e sistemas validados de plano de carreira e capacitação profissional.

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

REGRAS DE RESPOSTA:
- Seja franco, técnico e altamente específico.
- "strengths": 3 a 6 pontos fortes concretos evidenciados no currículo.
- "weaknesses": 3 a 6 pontos de atenção acionáveis (evite obviedades genéricas).
- "recommendations": 4 a 8 recomendações diretas cobrindo ajustes de currículo, plano de carreira e capacitação técnica.
- "keywords": 6 a 12 palavras-chave de alto valor no setor para otimização ATS.
- "atsFriendly": true apenas se o currículo usar estrutura padrão facilmente interpretável por ATS.
- "summary": Um parágrafo executivo de 4 a 6 frases com o veredito geral, nível de senioridade percebido e projeção de carreira.
- "overall": Média ponderada das dimensões (pesos maiores em impacto, estrutura/ATS e palavras-chave), arredondada para 1 casa decimal.

Retorne EXCLUSIVAMENTE JSON válido no formato:
{
  "overall": number,
  "dimensions": [
    { "key": "structure", "label": "Estrutura & Compatibilidade ATS", "score": number, "rationale": "..." },
    { "key": "summary", "label": "Resumo & Posicionamento", "score": number, "rationale": "..." },
    { "key": "impact", "label": "Resultados Quantificados (STAR/XYZ)", "score": number, "rationale": "..." },
    { "key": "skills", "label": "Habilidades & Ferramentas", "score": number, "rationale": "..." },
    { "key": "experience", "label": "Experiência & Verbos de Ação", "score": number, "rationale": "..." },
    { "key": "keywords", "label": "Palavras-Chave (Gupy/LinkedIn)", "score": number, "rationale": "..." },
    { "key": "career", "label": "Trajetória & Plano de Carreira", "score": number, "rationale": "..." },
    { "key": "upskilling", "label": "Capacitação & Cursos Recomendados", "score": number, "rationale": "..." }
  ],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "keywords": ["..."],
  "atsFriendly": boolean,
  "summary": "..."
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
  resumeText: string
): Promise<{ analysis: ResumeAnalysis; tokensIn: number; tokensOut: number }> {
  const { client, model } = await getClient()
  const userPrompt = `Analise o currículo abaixo de acordo com todas as diretrizes de avaliação, plano de carreira e capacitação:\n\n--- CURRÍCULO ---\n${resumeText}`

  let completion
  try {
    completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    })
  } catch (err: any) {
    console.error('LLM API Call Error:', err)
    if (err.status === 401 || err.message?.includes('Invalid Authentication') || err.message?.includes('API key')) {
      throw new Error(
        'Chave de API inválida ou expirada (Erro 401 Authentication). Por favor, verifique ou atualize a MOONSHOT_API_KEY no painel Admin ou no arquivo .env.'
      )
    }
    throw new Error(err.message || 'Falha ao conectar com o serviço de Inteligência Artificial.')
  }

  const content = completion.choices?.[0]?.message?.content || ''
  const tokensIn = completion.usage?.prompt_tokens || Math.ceil(userPrompt.length / 4)
  const tokensOut = completion.usage?.completion_tokens || Math.ceil(content.length / 4)

  // Extract JSON string cleanly
  let cleaned = content.trim()
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

  return { analysis, tokensIn, tokensOut }
}

export async function rewriteResume(
  originalText: string,
  analysisJson: string
): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  const { client, model } = await getClient()
  const userPrompt = `Currículo original:\n\n${originalText}\n\n--- Laudo de análise (use para priorizar correções) ---\n${analysisJson}\n\nReescreva o currículo em Markdown conforme as instruções.`

  let completion
  try {
    completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: REWRITE_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 3500,
    })
  } catch (err: any) {
    console.error('LLM Rewrite Error:', err)
    if (err.status === 401 || err.message?.includes('Invalid Authentication') || err.message?.includes('API key')) {
      throw new Error(
        'Chave de API inválida ou expirada (Erro 401 Authentication). Por favor, verifique ou atualize a MOONSHOT_API_KEY no painel Admin ou no arquivo .env.'
      )
    }
    throw new Error(err.message || 'Falha ao reescrever o currículo com a IA.')
  }

  const content = completion.choices?.[0]?.message?.content || ''
  const tokensIn = completion.usage?.prompt_tokens || Math.ceil(userPrompt.length / 4)
  const tokensOut = completion.usage?.completion_tokens || Math.ceil(content.length / 4)
  return { content: content.trim(), tokensIn, tokensOut }
}

// Pricing model
export interface PlanPricing {
  plan: 'day' | 'monthly' | 'annual'
  label: string
  analysesIncluded: number
  rewritesIncluded: number
  estimatedCostUsd: number
  priceBrl: number
  marginBrl: number
  marginPct: number
}

const COST_PER_ANALYSIS_IN_TOKENS = 1800
const COST_PER_ANALYSIS_OUT_TOKENS = 1500
const COST_PER_REWRITE_IN_TOKENS = 2500
const COST_PER_REWRITE_OUT_TOKENS = 2200
const STORAGE_COST_PER_USER_PER_DAY_USD = 0.0008

export function costPerCycleUsd(): number {
  const analysisIn = (COST_PER_ANALYSIS_IN_TOKENS / 1000) * TOKEN_COST.inputPer1k
  const analysisOut = (COST_PER_ANALYSIS_OUT_TOKENS / 1000) * TOKEN_COST.outputPer1k
  const rewriteIn = (COST_PER_REWRITE_IN_TOKENS / 1000) * TOKEN_COST.inputPer1k
  const rewriteOut = (COST_PER_REWRITE_OUT_TOKENS / 1000) * TOKEN_COST.outputPer1k
  return analysisIn + analysisOut + rewriteIn + rewriteOut
}

export function computePricing(): PlanPricing[] {
  const cycleCost = costPerCycleUsd()
  const brlUsd = 5.4

  const day: PlanPricing = {
    plan: 'day',
    label: 'Passe Diário',
    analysesIncluded: 5,
    rewritesIncluded: 3,
    estimatedCostUsd: cycleCost * 5 + STORAGE_COST_PER_USER_PER_DAY_USD * 1,
    priceBrl: 19.9,
    marginBrl: 0,
    marginPct: 0,
  }
  day.marginBrl = day.priceBrl - day.estimatedCostUsd * brlUsd
  day.marginPct = (day.marginBrl / day.priceBrl) * 100

  const monthly: PlanPricing = {
    plan: 'monthly',
    label: 'Assinatura Mensal',
    analysesIncluded: 30,
    rewritesIncluded: 20,
    estimatedCostUsd: cycleCost * 30 + STORAGE_COST_PER_USER_PER_DAY_USD * 30,
    priceBrl: 39.9,
    marginBrl: 0,
    marginPct: 0,
  }
  monthly.marginBrl = monthly.priceBrl - monthly.estimatedCostUsd * brlUsd
  monthly.marginPct = (monthly.marginBrl / monthly.priceBrl) * 100

  const annual: PlanPricing = {
    plan: 'annual',
    label: 'Assinatura Anual',
    analysesIncluded: 365,
    rewritesIncluded: 240,
    estimatedCostUsd: cycleCost * 365 + STORAGE_COST_PER_USER_PER_DAY_USD * 365,
    priceBrl: 299.9,
    marginBrl: 0,
    marginPct: 0,
  }
  annual.marginBrl = annual.priceBrl - annual.estimatedCostUsd * brlUsd
  annual.marginPct = (annual.marginBrl / annual.priceBrl) * 100

  return [day, monthly, annual]
}
