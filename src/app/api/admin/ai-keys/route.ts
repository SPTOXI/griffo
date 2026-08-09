import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { encryptSecret, maskSecret } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

// GET /api/admin/ai-keys - List registered AI API keys
export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const keys = await db.aiApiKey.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // A chave em si nunca sai da rota: a resposta leva apenas uma prévia.
    const sanitizedKeys = keys.map((k) => ({
      id: k.id,
      name: k.name,
      provider: k.provider,
      baseUrl: k.baseUrl,
      model: k.model,
      status: k.status,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
      maskedKey: maskSecret(k.apiKey),
    }))

    return NextResponse.json({ keys: sanitizedKeys })
  } catch (e: any) {
    console.error('ai-keys get error', e)
    return NextResponse.json({ error: 'Erro ao buscar chaves de API de IA' }, { status: 500 })
  }
}

// POST /api/admin/ai-keys - Register a new AI API key
export async function POST(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const body = await req.json()
    const { name, provider, apiKey, baseUrl, model } = body

    if (!name || !provider || !apiKey || !model) {
      return NextResponse.json({ error: 'Preencha nome, provedor, chave de API e modelo.' }, { status: 400 })
    }

    const validProviders = ['moonshot', 'anthropic', 'deepseek', 'gemini']
    if (!validProviders.includes(provider.toLowerCase())) {
      return NextResponse.json({ error: 'Provedor de IA inválido. Escolha: Moonshot, Anthropic, DeepSeek ou Gemini.' }, { status: 400 })
    }

    const newKey = await db.aiApiKey.create({
      data: {
        name: name.trim(),
        provider: provider.toLowerCase().trim(),
        apiKey: encryptSecret(apiKey.trim()),
        baseUrl: baseUrl ? baseUrl.trim() : null,
        model: model.trim(),
        status: 'active',
      },
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_add_ai_key',
        meta: JSON.stringify({ keyId: newKey.id, name: newKey.name, provider: newKey.provider, model: newKey.model }),
      },
    })

    return NextResponse.json({
      success: true,
      key: {
        id: newKey.id,
        name: newKey.name,
        provider: newKey.provider,
        baseUrl: newKey.baseUrl,
        model: newKey.model,
        status: newKey.status,
        createdAt: newKey.createdAt,
        updatedAt: newKey.updatedAt,
        maskedKey: maskSecret(newKey.apiKey),
      },
      message: `Chave da API "${newKey.name}" para ${newKey.provider.toUpperCase()} cadastrada com sucesso!`,
    })
  } catch (e: any) {
    console.error('ai-keys post error', e)
    // `encryptSecret` lança quando ENCRYPTION_KEY não está configurada; a
    // mensagem diz o que fazer e não expõe nada.
    const message = String(e?.message || '')
    if (message.includes('ENCRYPTION_KEY')) {
      return NextResponse.json({ error: message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Erro ao cadastrar chave de API' }, { status: 500 })
  }
}

// PATCH /api/admin/ai-keys - Pause/Activate an API key
export async function PATCH(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const body = await req.json()
    const { id, status } = body

    if (!id || !['active', 'paused'].includes(status)) {
      return NextResponse.json({ error: 'ID e status (active/paused) são obrigatórios.' }, { status: 400 })
    }

    const updated = await db.aiApiKey.update({
      where: { id },
      data: { status },
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_toggle_ai_key',
        meta: JSON.stringify({ keyId: id, status }),
      },
    })

    return NextResponse.json({
      success: true,
      key: {
        id: updated.id,
        name: updated.name,
        provider: updated.provider,
        baseUrl: updated.baseUrl,
        model: updated.model,
        status: updated.status,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        maskedKey: maskSecret(updated.apiKey),
      },
      message: `Status da API "${updated.name}" alterado para ${status === 'active' ? 'ATIVA' : 'PAUSADA'}.`,
    })
  } catch (e: any) {
    console.error('ai-keys patch error', e)
    return NextResponse.json({ error: 'Erro ao atualizar status da chave de API' }, { status: 500 })
  }
}

// DELETE /api/admin/ai-keys - Delete an API key
export async function DELETE(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID da chave é obrigatório.' }, { status: 400 })
    }

    const deleted = await db.aiApiKey.delete({
      where: { id },
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_delete_ai_key',
        meta: JSON.stringify({ keyId: id, name: deleted.name }),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Chave de API "${deleted.name}" removida com sucesso.`,
    })
  } catch (e: any) {
    console.error('ai-keys delete error', e)
    return NextResponse.json({ error: 'Erro ao deletar chave de API' }, { status: 500 })
  }
}
