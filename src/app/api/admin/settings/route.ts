import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { encryptSecret, maskSecret } from '@/lib/crypto'
import { clearProviderConfigCache } from '@/lib/ai-router/registry'
import {
  isKnownConfigKey,
  isSensitiveConfigKey,
  looksLikeMask,
  SYSTEM_CONFIG_MAX_VALUE_LENGTH,
} from '@/lib/system-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const configs = await db.systemConfig.findMany()

    // Valores sensíveis saem mascarados. Antes a resposta trazia a chave
    // secreta da Stripe e as chaves das IAs em texto puro — bastava abrir a
    // aba de rede do navegador na página do painel para lê-las, e qualquer
    // extensão instalada no navegador do administrador enxergava o mesmo.
    const configMap = configs.reduce((acc, curr) => {
      acc[curr.key] = isSensitiveConfigKey(curr.key) ? maskSecret(curr.value) : curr.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json({ config: configMap })
  } catch (e: any) {
    console.error('admin settings get error', e)
    return NextResponse.json({ error: 'Erro ao obter configurações' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const body = (await req.json()) as Record<string, unknown>
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
    }

    const updated: string[] = []
    const rejected: string[] = []
    const unchanged: string[] = []

    for (const [key, rawValue] of Object.entries(body)) {
      // Allowlist: antes qualquer chave enviada era gravada, o que permitia
      // sobrescrever as que o roteador de IA e a Stripe leem.
      if (!isKnownConfigKey(key)) {
        rejected.push(key)
        continue
      }
      if (typeof rawValue !== 'string') {
        rejected.push(key)
        continue
      }

      const value = rawValue.trim()
      if (value.length > SYSTEM_CONFIG_MAX_VALUE_LENGTH) {
        rejected.push(key)
        continue
      }

      const sensitive = isSensitiveConfigKey(key)

      // O painel recarrega as configurações mascaradas e reenvia o objeto
      // inteiro ao salvar. Sem estas duas guardas, todo segredo não editado
      // seria sobrescrito pela própria máscara — ou apagado — no primeiro save.
      if (sensitive && (looksLikeMask(value) || !value)) {
        unchanged.push(key)
        continue
      }

      const stored = sensitive ? encryptSecret(value) : value

      await db.systemConfig.upsert({
        where: { key },
        update: { value: stored },
        create: { key, value: stored },
      })
      updated.push(key)
    }

    // O roteador guarda esta tabela em cache por até 30s; sem isto, a troca de
    // chave no painel só valeria na expiração.
    if (updated.length > 0) clearProviderConfigCache()

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_config_update',
        meta: JSON.stringify({ keysUpdated: updated, keysRejected: rejected }),
      },
    })

    return NextResponse.json({ ok: true, updated, rejected, unchanged })
  } catch (e: any) {
    console.error('admin settings post error', e)
    // A cifragem lança quando ENCRYPTION_KEY não está configurada. Nesse caso
    // a mensagem é acionável e não expõe nada — vale devolvê-la.
    const message = String(e?.message || '')
    if (message.includes('ENCRYPTION_KEY')) {
      return NextResponse.json({ error: message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
