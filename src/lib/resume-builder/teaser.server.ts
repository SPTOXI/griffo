import 'server-only'
import { executeAiTask } from '../ai-router/router'
import { wrapUntrustedDocument } from '../analysis/untrusted'
import { LANGUAGE_DIRECTIVE } from '../i18n/server'
import type { Language } from '../i18n/types'
import { bannedTermsPrompt, writingLangOf } from '../writing/slop'
import { cleanBullets, lockedPartsOf, type BuilderAnswers, type BuilderTeaser } from './answers'

/**
 * A amostra grátis do criador de currículo: a PRIMEIRA experiência reescrita
 * pela IA, e só ela. O resto do currículo só é escrito depois do pagamento,
 * pela reescrita da Análise Completa — quem não paga custa uma chamada curta.
 *
 * Mesmo modelo rápido da leitura do perfil na home (Haiku), porque a pessoa
 * está olhando a tela esperando.
 */

const TEASER_SCHEMA = {
  type: 'object',
  properties: { bullets: { type: 'array', items: { type: 'string' } } },
  required: ['bullets'],
  additionalProperties: false,
} as const

function systemPrompt(lang: Language, noFormalJob: boolean): string {
  const writingLang = writingLangOf(lang)
  return `Você é redator de currículos. Recebe a descrição informal, escrita pela própria pessoa, de UMA experiência e a transforma em 2 a 4 tópicos de currículo, curtos, em linguagem profissional e natural, começando por verbo de ação.

REGRAS OBRIGATÓRIAS:
1. Use SÓ o que está escrito. Não invente número, percentual, ferramenta, sistema, cliente, resultado ou responsabilidade que a pessoa não contou. Descrição curta vira menos tópicos, nunca tópicos inventados.
2. Sem emojis, sem símbolos decorativos, sem marcador no começo do tópico.
3. Cada tópico com no máximo 200 caracteres.${noFormalJob ? '\n4. A pessoa nunca teve emprego formal: trate bico, trabalho voluntário, ajuda em negócio da família ou projeto escolar como experiência legítima, sem fingir que foi emprego registrado.' : ''}
${writingLang ? `\n${bannedTermsPrompt(writingLang)}\n` : ''}
Responda APENAS com JSON no formato {"bullets": ["...", "..."]}.

${LANGUAGE_DIRECTIVE[lang] ?? LANGUAGE_DIRECTIVE.en}`
}

/**
 * Nunca lança. Sem resposta aproveitável da IA, a amostra sai com a frase da
 * própria pessoa: a tela ainda mostra a experiência e o cadeado do resto.
 */
export async function buildTeaser(
  a: BuilderAnswers,
  lang: Language,
  country: string | null
): Promise<BuilderTeaser> {
  const e = a.experiences[0]
  let bullets: string[] = []
  try {
    const ai = await executeAiTask({
      taskType: 'resume_builder_teaser',
      systemPrompt: systemPrompt(lang, a.noFormalJob),
      userPrompt: wrapUntrustedDocument(
        `Cargo pretendido: ${a.targetRole}\nFunção: ${e.role}\nOnde: ${e.company}\nO que fazia:\n${e.description}`,
        'experiência descrita pelo candidato'
      ),
      maxTokens: 600,
      disableThinking: true,
      jsonSchema: TEASER_SCHEMA as unknown as Record<string, unknown>,
      modelOverride: 'claude-haiku-4-5',
      userCountry: country,
      timeBudgetMs: 30_000,
    })
    const raw = ai.content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    const match = raw.match(/\{[\s\S]*\}/)
    bullets = cleanBullets(match ? JSON.parse(match[0]).bullets : [])
  } catch (err: any) {
    console.warn('[resume-builder] amostra da IA falhou:', err?.message || err)
  }
  if (bullets.length === 0) bullets = [e.description.slice(0, 280)]
  return {
    first: { role: e.role, company: e.company, period: e.period, bullets },
    locked: lockedPartsOf(a),
  }
}
