export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { executeAiTask } from '@/lib/ai-router/router'
import { getRequestLanguage, LANGUAGE_DIRECTIVE } from '@/lib/i18n/server'
import {
  detectProfileConflicts,
  parseProfileExtraction,
  PROFILE_EXTRACTION_JSON_SCHEMA,
} from '@/lib/profile/extract'
import { fromRecord } from '@/lib/profile'
import { parseStoredOrientation, rolesFromOrientation } from '@/lib/profile/from-orientation'
import { EDUCATION_LEVELS, SENIORITY_LEVELS } from '@/lib/profile'

/**
 * Sugere o Perfil Profissional a partir do currículo mais recente.
 *
 * ## Por que
 *
 * O currículo já diz cargo, área, competências, formação e tempo de carreira. O
 * perfil pedia tudo de novo. Pior: `runRadar` só avalia quem TEM perfil, então
 * o formulário em branco não era só chateação — era a porta fechada do Radar.
 *
 * ## Sugere, não grava
 *
 * A resposta é devolvida para a tela preencher os campos VAZIOS do formulário,
 * que a pessoa revisa e salva. Gravar direto faria o perfil mudar sozinho, e o
 * §30 é explícito quanto a não alterar o perfil sem que a pessoa saiba — ali
 * sobre o feedback do Radar, mas o motivo é o mesmo.
 *
 * ## Não custa nada, e não exige currículo destravado
 *
 * Diferente das rotas de entrega, esta não pede `requireUnlockedResume`: ela
 * não devolve análise nem texto novo, só reorganiza o que a pessoa já enviou
 * sobre si mesma. Cobrar por ler o próprio currículo de volta seria cobrar duas
 * vezes pelo mesmo upload.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })
    }

    /**
     * O currículo pedido, ou o mais recente.
     *
     * A tela do perfil não sabe de currículos, e a pergunta que ela faz é "o
     * que você sabe sobre mim" — para ela, o mais recente é a resposta certa.
     *
     * Quem passa `resumeId` é a tela do laudo, perguntando outra coisa: "este
     * currículo aqui contradiz o perfil?". Aí o currículo tem de ser
     * exatamente o que está aberto, e não o último enviado — senão a pergunta
     * seria feita sobre um documento que a pessoa não está olhando.
     */
    const body = await req.json().catch(() => ({}))
    const requestedId = typeof body?.resumeId === 'string' ? body.resumeId : null

    const resume = await db.resume.findFirst({
      where: requestedId
        ? { id: requestedId, userId: user.id }
        : { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, originalContent: true, careerOrientationJson: true },
    })

    if (!resume || !resume.originalContent?.trim()) {
      return NextResponse.json(
        {
          error:
            'Você ainda não enviou um currículo. Envie um e depois volte aqui para preencher o perfil a partir dele.',
          code: 'no_resume',
        },
        { status: 404 }
      )
    }

    const lang = getRequestLanguage(req)

    const systemPrompt = `${LANGUAGE_DIRECTIVE[lang]}

Você lê currículos e extrai o que ESTÁ ESCRITO neles. Você não avalia, não recomenda e não melhora nada.

REGRA ÚNICA E INEGOCIÁVEL: se o currículo não diz, o campo é null (ou lista vazia). Não deduza, não estime, não complete com o que "costuma ser". Um campo nulo é uma resposta correta; um campo inventado corrompe o perfil da pessoa e muda as vagas que ela vai receber.

CAMPOS:

- "currentTitle": o cargo mais recente, exatamente como escrito. Se a pessoa está entre empregos, o último que teve.
- "seniority": um de ${SENIORITY_LEVELS.join(', ')}. Baseie-se no cargo declarado e no tempo de carreira — NÃO em quão impressionante o currículo parece. Se o cargo não indica nível, null.
- "field": a área de atuação em duas ou três palavras (ex: "enfermagem", "engenharia de software", "logística").
- "specializations": até 8 subáreas ou domínios em que a pessoa efetivamente trabalhou.
- "skills": até 20 competências, ferramentas e tecnologias CITADAS no currículo. Não acrescente as que "quem faz isso costuma ter".
- "yearsExperience": anos de experiência profissional, somando os períodos declarados. Se as datas não permitem somar, null. Nunca arredonde para cima.
- "educationLevel": um de ${EDUCATION_LEVELS.join(', ')} — a MAIOR formação CONCLUÍDA. Curso em andamento não conta.
- "targetRoles": cargos que a pessoa declara buscar, se o currículo tiver objetivo profissional. Se não tiver, lista vazia — NÃO deduza a partir do cargo atual.

Responda APENAS o JSON do schema, sem texto antes ou depois.`

    const aiResponse = await executeAiTask({
      taskType: 'profile_extraction',
      userId: user.id,
      resumeId: resume.id,
      systemPrompt,
      userPrompt: `CURRÍCULO:\n${resume.originalContent.slice(0, 14000)}`,
      maxTokens: 1200,
      disableThinking: true,
      jsonSchema: PROFILE_EXTRACTION_JSON_SCHEMA,
      /**
       * Três tentativas, e não as duas do padrão.
       *
       * A cadeia desta tarefa é DeepSeek → Kimi → Claude. Com duas tentativas
       * ela parava no Kimi, e o Claude — o único que nunca falhou nesta tarefa
       * — jamais era alcançado: a rota falhava inteira com os dois provedores
       * baratos, tendo um confiável na fila logo atrás.
       *
       * Cabe no prazo porque a tarefa é curta: o orçamento dividido por três
       * ainda dá ~16s por tentativa, acima do mínimo do roteador. E o custo de
       * chegar ao Claude só existe quando os dois primeiros falham — no caminho
       * feliz continua sendo a extração barata de sempre.
       */
      maxProviderAttempts: 3,
    })

    const suggestion = parseProfileExtraction(aiResponse.content)

    /**
     * Os cargos-alvo vêm do diagnóstico vocacional, não da IA que lê o
     * currículo — e sobrescrevem o que ela tiver dito.
     *
     * O diagnóstico é a recomendação do próprio produto, feita com mais
     * contexto e já vista pela pessoa. Uma leitura de currículo adivinhando
     * "para onde essa carreira vai" competiria com ela e às vezes ganharia,
     * dizendo à pessoa algo diferente do que a tela do diagnóstico disse.
     *
     * Esta rota também serve quem rodou o diagnóstico ANTES de ele passar a
     * semear o perfil sozinho: para essas pessoas, é por aqui que os cargos
     * recomendados chegam ao perfil.
     */
    const roles = rolesFromOrientation(parseStoredOrientation(resume.careerOrientationJson))
    if (roles.length > 0) suggestion.targetRoles = roles

    if (Object.keys(suggestion).length === 0) {
      return NextResponse.json(
        {
          error:
            'Não consegui extrair nada aproveitável do seu currículo. Preencha o perfil à mão — é mais rápido que tentar de novo.',
          code: 'empty_extraction',
        },
        { status: 422 }
      )
    }

    /**
     * O que este currículo CONTRADIZ no perfil gravado.
     *
     * Vem junto da sugestão, e não numa rota própria, porque depende da mesma
     * extração — que é uma chamada de IA. Separar em duas rotas faria a tela
     * pagar duas vezes pela mesma leitura do mesmo currículo.
     *
     * Lista vazia é o caso comum e não é erro: quer dizer que o currículo
     * combina com o perfil, ou que ainda não há perfil com que conflitar.
     */
    const record = await db.professionalProfile.findUnique({ where: { userId: user.id } })
    const conflicts = detectProfileConflicts(fromRecord(record), suggestion)

    return NextResponse.json({ suggestion, conflicts, resumeId: resume.id })
  } catch (e: any) {
    // `diagnostic` primeiro, e não `message`: o roteador de IA guarda em
    // `message` um texto seguro para mostrar ao usuário — "Falha ao processar
    // com as IAs ativas" — e em `diagnostic` o motivo por provedor, com código
    // de status e latência de cada tentativa. Registrar só o primeiro produz um
    // log que confirma a falha e não ajuda a resolvê-la, que foi exatamente o
    // que aconteceu aqui: a rota falhou em produção e o log não dizia por quê.
    console.error('[professional-profile/suggest]', e?.diagnostic || e?.message || e)
    /**
     * A mensagem que vai para a tela é ESCRITA, nunca a do erro.
     *
     * Esta rota devolvia `e?.message`, e o que chegava ao usuário era o texto
     * interno do roteador de IA — "Falha ao processar com as IAs ativas", ou
     * pior, o nome do modelo, o teto de `max_tokens` e o tamanho do raciocínio.
     * Nada disso quer dizer coisa alguma para quem está montando o próprio
     * perfil, e ainda expõe como o sistema é feito por dentro.
     *
     * O detalhe técnico não se perde: ele está no log desta rota, em
     * `AiLog.errorMessage` e no painel de admin.
     *
     * O texto abaixo tem um trabalho a fazer além de avisar do erro — dizer
     * que a pessoa não está travada. Preencher à mão continua disponível, e é
     * o que ela precisa saber para não abandonar a tela.
     */
    return NextResponse.json(
      {
        error:
          'Não consegui ler seu currículo agora — isso costuma ser temporário. ' +
          'Tente de novo em alguns instantes, ou preencha os campos à mão: o perfil ' +
          'funciona igual dos dois jeitos.',
        code: 'SUGGESTION_FAILED',
      },
      { status: 500 }
    )
  }
}
