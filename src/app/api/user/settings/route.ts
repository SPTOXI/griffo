import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { socialLinksSchema } from '@/lib/validation'

const schema = z.object({
  name: z.string().min(2).max(120).optional(),
  profession: z.string().max(120).optional(),
  recruiterOptIn: z.boolean().optional(),
  profileVisible: z.boolean().optional(),
  // Era `z.record(z.string(), z.string())`: sem teto de quantidade, de tamanho
  // de chave, de tamanho de valor nem de esquema de URL. `User.socialLinks` é
  // `String` sem limite no Postgres, então o que passava era o tamanho do
  // corpo da requisição. Ver `lib/validation.ts`.
  socialLinks: socialLinksSchema.optional(),
})

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    const data: any = {}
    if (parsed.data.name !== undefined) data.name = parsed.data.name
    if (parsed.data.profession !== undefined) data.profession = parsed.data.profession
    if (parsed.data.socialLinks !== undefined) data.socialLinks = JSON.stringify(parsed.data.socialLinks)
    if (parsed.data.recruiterOptIn !== undefined) {
      data.recruiterOptIn = parsed.data.recruiterOptIn
      if (!parsed.data.recruiterOptIn) data.profileVisible = false
    }
    if (parsed.data.profileVisible !== undefined) {
      // Only allow profileVisible=true if recruiterOptIn is true
      if (parsed.data.profileVisible && !user.recruiterOptIn && !parsed.data.recruiterOptIn) {
        return NextResponse.json({ error: 'Ative o opt-in de recrutadores primeiro.' }, { status: 400 })
      }
      data.profileVisible = parsed.data.profileVisible
    }

    const updated = await db.user.update({ where: { id: user.id }, data })
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'profile_update',
        meta: JSON.stringify({ fields: Object.keys(data) }),
      },
    })

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        profession: updated.profession,
        plan: updated.plan,
        planStartsAt: updated.planStartsAt,
        planEndsAt: updated.planEndsAt,
        recruiterOptIn: updated.recruiterOptIn,
        profileVisible: updated.profileVisible,
      },
    })
  } catch (e: any) {
    console.error('settings update error', e)
    return NextResponse.json({ error: 'Erro ao salvar.' }, { status: 500 })
  }
}
