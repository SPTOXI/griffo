export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { runForUserQuietly } from '@/lib/radar/runner'
import { getCurrentUser } from '@/lib/auth'
import {
  EMPTY_PROFILE,
  fromRecord,
  professionalProfileInputSchema,
  toRecordData,
} from '@/lib/profile'

/**
 * O Perfil Profissional do usuário autenticado.
 *
 * Uma linha por usuário, criada na primeira gravação. Não existir é um estado
 * normal — o `GET` devolve o perfil vazio em vez de 404, porque "ainda não
 * preenchi" não é erro e a tela não deveria precisar distinguir os dois casos.
 *
 * Isolamento por usuário é estrutural, não uma verificação: a chave da consulta
 * é sempre `userId` vindo da sessão, nunca um identificador do corpo da
 * requisição. Não há como pedir o perfil de outra pessoa porque não há onde
 * dizer de quem é o perfil.
 */

/** Colunas do perfil. Explícitas para não vazar `id`/`userId` na resposta. */
const PROFILE_SELECT = {
  currentTitle: true,
  seniority: true,
  field: true,
  specializations: true,
  skills: true,
  yearsExperience: true,
  educationLevel: true,
  targetRoles: true,
  targetFields: true,
  targetIndustries: true,
  careerGoal: true,
  residenceCountry: true,
  residenceRegion: true,
  residenceCity: true,
  primaryMarket: true,
  alternativeMarkets: true,
  openToRelocation: true,
  openToInternationalRemote: true,
  workModes: true,
  contractTypes: true,
  weeklyHours: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  salaryPeriod: true,
  resumeLanguage: true,
  communicationLanguage: true,
  spokenLanguages: true,
  displayCurrency: true,
  updatedAt: true,
} as const

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })

    const row = await db.professionalProfile.findUnique({
      where: { userId: user.id },
      select: PROFILE_SELECT,
    })

    return NextResponse.json({
      profile: row ? fromRecord(row) : { ...EMPTY_PROFILE },
      // Distingue "nunca preenchido" de "preenchido e depois esvaziado". A tela
      // usa isso para decidir entre convidar ao preenchimento e apenas exibir.
      exists: Boolean(row),
      updatedAt: row?.updatedAt ?? null,
    })
  } catch (e: any) {
    console.error('[professional-profile] GET falhou:', e?.message || e)
    return NextResponse.json({ error: 'Não foi possível carregar o perfil.' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
    }

    const parsed = professionalProfileInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
        { status: 400 }
      )
    }

    const data = toRecordData(parsed.data)
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para salvar.' }, { status: 400 })
    }

    // Upsert: a primeira gravação cria a linha, as seguintes atualizam só os
    // campos enviados. Gravação parcial não apaga o que não mencionou — ver
    // `toRecordData`.
    const row = await db.professionalProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
      select: PROFILE_SELECT,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'professional_profile_update',
        meta: JSON.stringify({ fields: Object.keys(data) }),
      },
    })

    /**
     * Perfil salvo, Radar avaliado na hora.
     *
     * A coleta continua sendo diária — ela varre a internet e é cara. Avaliar as
     * vagas que JÁ estão no banco contra este perfil não é: são quatro consultas
     * e cálculo em memória, sem rede.
     *
     * Sem isto, quem acabou de preencher o perfil abre o Radar e vê tela vazia
     * até a madrugada seguinte — indistinguível de produto quebrado.
     */
    const radar = await runForUserQuietly(user.id)

    return NextResponse.json({
      profile: fromRecord(row),
      exists: true,
      updatedAt: row.updatedAt,
      radar: radar ? { alerted: radar.alerted, evaluated: radar.evaluated } : null,
    })
  } catch (e: any) {
    console.error('[professional-profile] PUT falhou:', e?.message || e)
    return NextResponse.json({ error: 'Não foi possível salvar o perfil.' }, { status: 500 })
  }
}
