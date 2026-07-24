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

    // 1. Fetch Products with Variants included
    const productsRes = await fetch('https://api.lemonsqueezy.com/v1/products?include=variants', {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!productsRes.ok) {
      const errText = await productsRes.text()
      console.error('Lemon Squeezy Sync Products error:', errText)
      return NextResponse.json({ error: 'Chave de API da Lemon Squeezy inválida ou sem permissão.' }, { status: 400 })
    }

    const productsData = await productsRes.json()
    const rawProducts = productsData.data || []
    const includedVariants = productsData.included || []

    if (rawProducts.length === 0) {
      // Fallback: If no products, try fetching stores to at least save storeId
      const storesRes = await fetch('https://api.lemonsqueezy.com/v1/stores', {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${apiKey}`
        }
      })
      if (storesRes.ok) {
        const storesData = await storesRes.json()
        const stores = storesData.data || []
        if (stores.length > 0) {
          const storeId = String(stores[0].id)
          await db.systemConfig.upsert({
            where: { key: 'LEMON_STORE_ID' },
            update: { value: storeId },
            create: { key: 'LEMON_STORE_ID', value: storeId }
          })
          await db.systemConfig.upsert({
            where: { key: 'LEMON_API_KEY' },
            update: { value: apiKey },
            create: { key: 'LEMON_API_KEY', value: apiKey }
          })
          return NextResponse.json({
            success: true,
            message: `Store ID (${storeId}) encontrado! Porém nenhum produto foi cadastrado na Lemon Squeezy ainda.`,
            storeId,
            updates: { LEMON_API_KEY: apiKey, LEMON_STORE_ID: storeId }
          })
        }
      }
      return NextResponse.json({ error: 'Nenhum produto cadastrado na sua conta Lemon Squeezy.' }, { status: 404 })
    }

    // Get Store ID from first product
    const storeId = String(rawProducts[0].attributes.store_id)

    // Build structured product list
    const parsedProducts = rawProducts.map((p: any) => {
      const pName = String(p.attributes.name || '')
      const pPrice = Number(p.attributes.price || 0)
      const variantIdData = p.relationships?.variants?.data?.[0]?.id
      const variantId = variantIdData ? String(variantIdData) : ''

      return {
        productId: String(p.id),
        variantId,
        name: pName,
        price: pPrice,
        priceFormatted: p.attributes.price_formatted || '',
      }
    }).filter((p: any) => Boolean(p.variantId))

    // Sort products by price ascending
    const sortedByPrice = [...parsedProducts].sort((a, b) => a.price - b.price)

    let variantEntrada = ''
    let variantStarter = ''
    let variantCarreira = ''
    let variantProfissional = ''

    // Name-based matching first
    parsedProducts.forEach((p: any) => {
      const lowerName = p.name.toLowerCase()
      if (lowerName.includes('entrada') || lowerName.includes('9.90') || lowerName.includes('9,90') || lowerName.includes('40')) {
        variantEntrada = p.variantId
      } else if (lowerName.includes('starter') || lowerName.includes('29.90') || lowerName.includes('29,90') || lowerName.includes('100')) {
        variantStarter = p.variantId
      } else if (lowerName.includes('carreira') || lowerName.includes('99.90') || lowerName.includes('99,90') || lowerName.includes('500')) {
        variantCarreira = p.variantId
      } else if (lowerName.includes('profissional') || lowerName.includes('249.90') || lowerName.includes('249,90') || lowerName.includes('1500')) {
        variantProfissional = p.variantId
      }
    })

    // Fallback: Position-based / price-based assignment for unassigned ones
    if (!variantEntrada && sortedByPrice[0]) variantEntrada = sortedByPrice[0].variantId
    if (!variantStarter && sortedByPrice[1]) variantStarter = sortedByPrice[1].variantId
    if (!variantCarreira && sortedByPrice[2]) variantCarreira = sortedByPrice[2].variantId
    if (!variantProfissional && sortedByPrice[3]) variantProfissional = sortedByPrice[3].variantId

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
      message: `Sucesso! Loja #${storeId} e ${parsedProducts.length} produto(s) sincronizados automaticamente!`,
      storeId,
      productsFound: parsedProducts.map((p: any) => `${p.name} (Variant #${p.variantId})`),
      syncedCount: Object.keys(updates).length,
      updates
    })
  } catch (e: any) {
    console.error('lemon squeezy sync error', e)
    return NextResponse.json({ error: `Erro na sincronização: ${e.message || e}` }, { status: 500 })
  }
}
