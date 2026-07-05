import ZAI from 'z-ai-web-dev-sdk'

let _clientPromise: Promise<any> | null = null

function getClient(): Promise<any> {
  if (!_clientPromise) {
    _clientPromise = ZAI.create()
  }
  return _clientPromise
}

// Cost estimation per token (USD)
// GLM-4.6 / Flash pricing approximated for cost calculation
export const TOKEN_COST = {
  inputPer1k: 0.0006,   // $0.60 / 1M tokens
  outputPer1k: 0.0022,  // $2.20 / 1M tokens
}

export interface AnalysisDimension {
  key: string
  label: string
  score: number       // 0-10
  rationale: string
}

export interface ResumeAnalysis {
  overall: number                  // 0-10 weighted overall
  dimensions: AnalysisDimension[]  // each dimension scored 0-10
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  keywords: string[]               // suggested ATS keywords
  atsFriendly: boolean
  summary: string
}

const ANALYSIS_SYSTEM = `Você é um analista sênior de currículos e carreiras, com expertise em RH, recrutamento tech,ATS parsing e melhores práticas do LinkedIn Talent Solutions.

Sua tarefa: analisar o currículo do usuário e produzir um laudo técnico objetivo em JSON.

Avalie estas dimensões (cada uma com nota 0-10, onde 0 = crítico, 10 = excelente):
1. "structure" - Estrutura e organização visual (seções claras, hierarquia, ordem cronológica)
2. "summary" - Resumo profissional / objetivo (clareza, posicionamento, diferenciação)
3. "impact" - Resultados e impacto quantificado (números, métricas, conquistas vs. tarefas)
4. "skills" - Habilidades e competências (relevância, atualização, profundidade)
5. "experience" - Experiência profissional (descrição, verbos de ação, escopo)
6. "keywords" - Palavras-chave / compatibilidade ATS (termos do setor, ferramentas, cargos)
7. "education" - Formação acadêmica e certificações (relevância, completude)
8. "language" - Linguagem e português (concisão, gramática, tom profissional)

Regras:
- Seja franco e específico. Cite trechos do currículo quando relevante.
- Em "strengths" liste de 3 a 6 pontos fortes concretos.
- Em "weaknesses" liste de 3 a 6 pontos fracos acionáveis (não genéricos).
- Em "recommendations" liste de 4 a 8 ações de melhoria específicas.
- Em "keywords" sugira de 6 a 12 palavras-chave ATS relevantes ao perfil.
- "atsFriendly" = true apenas se o currículo for claramente parseável por ATS (sem tabelas, sem imagens de texto, fontes padrão, seções nomeadas convencionalmente).
- "summary" deve ser um parágrafo de 3 a 5 frases com o veredito geral.
- Calcule "overall" como média ponderada (impacto e keywords pesam mais), arredondada a 1 casa decimal.

Retorne SOMENTE JSON válido, sem markdown, sem comentários, no formato:
{
  "overall": number,
  "dimensions": [{ "key": "structure", "label": "Estrutura e Organização", "score": number, "rationale": "..." }, ...],
  "strengths": ["...","..."],
  "weaknesses": ["...","..."],
  "recommendations": ["...","..."],
  "keywords": ["...","..."],
  "atsFriendly": boolean,
  "summary": "..."
}`

const REWRITE_SYSTEM = `Você é um especialista em reescrita de currículos, certificado em outplacement e executive search, alinhado às melhores práticas LinkedIn.

Reescreva o currículo do usuário aplicando estas regras:
- Mantenha TODAS as informações factuais (datas, empresas, formação). NÃO invente nada.
- Use verbos de ação no início das bullets (Liderei, Implementei, Aumentei, Reduzi, etc.).
- Quantifique impacto sempre que possível (use %, R$, prazos, volumes). Se não houver número no original, mantenha qualitativo mas mais forte.
- Aplique a fórmula "Ação + Contexto + Resultado" em cada bullet de experiência.
- Reorganize a hierarquia: cabeçalho > resumo > experiência > formação > habilidades > certificações > idiomas.
- Inclua um resumo profissional de 3-4 linhas forte no topo.
- Otimize para ATS: nomes de seção padrão ("Experiência Profissional", "Formação Acadêmica", "Habilidades").
- Use Markdown com # para nome, ## para seções, ### para cargos e - para bullets.
- Português do Brasil, tom profissional mas humano.

Retorne APENAS o currículo reescrito em Markdown, sem comentários adicionais.`

export async function analyzeResume(resumeText: string): Promise<{ analysis: ResumeAnalysis; tokensIn: number; tokensOut: number }> {
  const client = await getClient()
  const userPrompt = `Analise o currículo abaixo e produza o laudo JSON conforme as instruções.\n\n--- CURRÍCULO ---\n${resumeText}`

  const completion = await client.chat.completions.create({
    messages: [
      { role: 'assistant', content: ANALYSIS_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
    temperature: 0.3,
    max_tokens: 2400,
  })

  const content = completion.choices?.[0]?.message?.content || ''
  const tokensIn = completion.usage?.prompt_tokens || Math.ceil(userPrompt.length / 4)
  const tokensOut = completion.usage?.completion_tokens || Math.ceil(content.length / 4)

  // Try to extract JSON even if wrapped in code fences
  let cleaned = content.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace > 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }

  let analysis: ResumeAnalysis
  try {
    analysis = JSON.parse(cleaned) as ResumeAnalysis
  } catch (e) {
    // Fallback: minimal analysis so the user still gets something
    analysis = {
      overall: 5,
      dimensions: [
        { key: 'structure', label: 'Estrutura e Organização', score: 5, rationale: 'Não foi possível interpretar a resposta do modelo. Tente reenviar.' },
        { key: 'summary', label: 'Resumo Profissional', score: 5, rationale: '—' },
        { key: 'impact', label: 'Impacto e Resultados', score: 5, rationale: '—' },
        { key: 'skills', label: 'Habilidades', score: 5, rationale: '—' },
        { key: 'experience', label: 'Experiência', score: 5, rationale: '—' },
        { key: 'keywords', label: 'Palavras-chave / ATS', score: 5, rationale: '—' },
        { key: 'education', label: 'Formação', score: 5, rationale: '—' },
        { key: 'language', label: 'Linguagem', score: 5, rationale: '—' },
      ],
      strengths: [],
      weaknesses: ['Houve uma falha ao processar a análise. Tente novamente.'],
      recommendations: [],
      keywords: [],
      atsFriendly: false,
      summary: 'Não foi possível gerar o laudo automaticamente.',
    }
  }

  return { analysis, tokensIn, tokensOut }
}

export async function rewriteResume(originalText: string, analysisJson: string): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  const client = await getClient()
  const userPrompt = `Currículo original:\n\n${originalText}\n\n--- Laudo de análise (use para priorizar correções) ---\n${analysisJson}\n\nReescreva o currículo em Markdown conforme as instruções.`

  const completion = await client.chat.completions.create({
    messages: [
      { role: 'assistant', content: REWRITE_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
    temperature: 0.6,
    max_tokens: 3200,
  })

  const content = completion.choices?.[0]?.message?.content || ''
  const tokensIn = completion.usage?.prompt_tokens || Math.ceil(userPrompt.length / 4)
  const tokensOut = completion.usage?.completion_tokens || Math.ceil(content.length / 4)
  return { content: content.trim(), tokensIn, tokensOut }
}

// Pricing model
export interface PlanPricing {
  plan: 'day' | 'monthly' | 'annual'
  label: string
  analysesIncluded: number     // how many analyses user can run
  rewritesIncluded: number     // how many rewrites user can run
  estimatedCostUsd: number     // LLM + storage cost per period
  priceBrl: number             // sale price in BRL
  marginBrl: number
  marginPct: number
}

// Cost assumptions per analysis+rewrite cycle (USD)
const COST_PER_ANALYSIS_IN_TOKENS = 1800
const COST_PER_ANALYSIS_OUT_TOKENS = 1500
const COST_PER_REWRITE_IN_TOKENS = 2500
const COST_PER_REWRITE_OUT_TOKENS = 2200
const STORAGE_COST_PER_USER_PER_DAY_USD = 0.0008 // SQLite local - very low

export function costPerCycleUsd(): number {
  const analysisIn = (COST_PER_ANALYSIS_IN_TOKENS / 1000) * TOKEN_COST.inputPer1k
  const analysisOut = (COST_PER_ANALYSIS_OUT_TOKENS / 1000) * TOKEN_COST.outputPer1k
  const rewriteIn = (COST_PER_REWRITE_IN_TOKENS / 1000) * TOKEN_COST.inputPer1k
  const rewriteOut = (COST_PER_REWRITE_OUT_TOKENS / 1000) * TOKEN_COST.outputPer1k
  return analysisIn + analysisOut + rewriteIn + rewriteOut
}

export function computePricing(): PlanPricing[] {
  const cycleCost = costPerCycleUsd()
  const brlUsd = 5.4 // approx BRL per USD - update periodically

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
