import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    
    // Get API Key from body or DB
    const existingConfigs = await db.systemConfig.findMany()
    const configMap = existingConfigs.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    const apiKey = body.apiKey || configMap.LEMON_API_KEY || process.env.LEMON_SQUEEZY_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ error: 'Insira a Lemon Squeezy API Key antes de sincronizar.' }, { status: 400 })
    }

    // 1. Fetch Stores from Lemon Squeezy
    const storesRes = await fetch('https://api.lemonsqueezy.com/v1/stores', {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!storesRes.ok) {
      const errText = await storesRes.text()
      console.error('Lemon Squeezy Sync Stores error:', errText)
      return NextResponse.json({ error: 'Chave de API da Lemon Squeezy inválida ou sem permissão.' }, { status: 400 })
    }

    const storesData = await storesRes.json()
    const stores = storesData.data || []
    if (stores.length === 0) {
      return NextResponse.json({ error: 'Nenhuma loja encontrada na sua conta da Lemon Squeezy.' }, { status: 404 })
    }

    const storeId = stores[0].id

    // 2. Fetch Products and Variants
    const variantsRes = await fetch('https://api.lemonsqueezy.com/v1/variants?include=product', {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      }
    })

    let variantsList: Array<{ id: string; name: string; productName: string; price: number }> = []

    if (variantsRes.ok) {
      const variantsData = await variantsRes.json()
      const rawVariants = variantsData.data || []
      const included = variantsData.included || []

      const productMap: Record<string, string> = {}
      included.forEach((item: any) => {
        if (item.type === 'products') {
          productMap[item.id] = item.attributes.name
        }
      })

      variantsList = rawVariants.map((v: any) => {
        const prodId = v.attributes.product_id?.toString()
        const productName = (prodId && productMap[prodId]) || v.attributes.name || 'Produto'
        return {
          id: v.id.toString(),
          name: v.attributes.name,
          productName,
          price: v.attributes.price / 100, // cents to main currency
        }
      })
    }

    // 3. Map variants to GriffoWork packages
    let variantEntrada = ''
    let variantStarter = ''
    let variantCarreira = ''
    let variantProfissional = ''

    variantsList.forEach((v) => {
      const pName = (v.productName + ' ' + v.name).toLowerCase()
      if (pName.includes('entrada') || (v.price >= 8 && v.price <= 15)) {
        variantEntrada = v.id
      } else if (pName.includes('starter') || (v.price >= 20 && v.price <= 45)) {
        variantStarter = v.id
      } else if (pName.includes('carreira') || (v.price >= 70 && v.price <= 130)) {
        variantCarreira = v.id
      } else if (pName.includes('profissional') || (v.price >= 180 && v.price <= 350)) {
        variantProfissional = v.id
      }
    })

    // Prepare configs to upsert
    const updates: Record<string, string> = {
      LEMON_API_KEY: apiKey,
      LEMON_STORE_ID: storeId,
    }

    if (body.webhookSecret) {
      updates.LEMON_WEBHOOK_SECRET = body.webhookSecret
    }
    if (variantEntrada) updates.LEMON_VARIANT_ENTRADA = variantEntrada
    if (variantStarter) updates.LEMON_VARIANT_STARTER = variantStarter
    if (variantCarreira) updates.LEMON_VARIANT_CARREIRA = variantCarreira
    if (variantProfissional) updates.LEMON_VARIANT_PROFISSIONAL = variantProfissional

    for (const [key, value] of Object.entries(updates)) {
      await db.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronização com Lemon Squeezy realizada com sucesso!',
      storeId,
      syncedCount: Object.keys(updates).length,
      variantsFound: variantsList.length,
      updates
    })
  } catch (e: any) {
    console.error('lemon squeezy sync error', e)
    return NextResponse.json({ error: `Erro na sincronização: ${e.message || e}` }, { status: 500 })
  }
}
