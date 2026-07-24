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

    const rawApiKey = body.apiKey || configMap.LEMON_API_KEY || process.env.LEMON_SQUEEZY_API_KEY || ''
    const apiKey = rawApiKey.trim()

    if (!apiKey) {
      return NextResponse.json({ error: 'Insira a Lemon Squeezy API Key antes de sincronizar.' }, { status: 400 })
    }

    // 1. Fetch Stores
    let storeId = ''
    const storesRes = await fetch('https://api.lemonsqueezy.com/v1/stores', {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (storesRes.ok) {
      const storesData = await storesRes.json()
      if (storesData.data && storesData.data.length > 0) {
        storeId = String(storesData.data[0].id)
      }
    } else {
      const errText = await storesRes.text()
      console.error('Lemon Squeezy Stores API error:', errText)
      return NextResponse.json({ error: 'Chave de API da Lemon Squeezy inválida ou sem permissão de acesso.' }, { status: 400 })
    }

    // 2. Fetch Products
    const productsRes = await fetch('https://api.lemonsqueezy.com/v1/products', {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      }
    })

    // 3. Fetch Variants
    const variantsRes = await fetch('https://api.lemonsqueezy.com/v1/variants', {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      }
    })

    const rawProducts = productsRes.ok ? (await productsRes.json()).data || [] : []
    const rawVariants = variantsRes.ok ? (await variantsRes.json()).data || [] : []

    // Map variants to products
    const productMap: Record<string, { name: string; storeId: string; price: number }> = {}
    rawProducts.forEach((p: any) => {
      if (!storeId && p.attributes?.store_id) {
        storeId = String(p.attributes.store_id)
      }
      productMap[String(p.id)] = {
        name: String(p.attributes?.name || 'Produto'),
        storeId: String(p.attributes?.store_id || ''),
        price: Number(p.attributes?.price || 0),
      }
    })

    const allVariants: Array<{ variantId: string; productId: string; productName: string; price: number }> = []

    rawVariants.forEach((v: any) => {
      const variantId = String(v.id)
      const productId = String(v.attributes?.product_id || '')
      const prodInfo = productMap[productId]
      const productName = prodInfo ? prodInfo.name : String(v.attributes?.name || 'Variante')
      const price = v.attributes?.price ? Number(v.attributes.price) : (prodInfo ? prodInfo.price : 0)

      allVariants.push({
        variantId,
        productId,
        productName,
        price: price / 100, // convert cents to main currency
      })
    })

    // Sort variants by price ascending
    const sortedVariants = [...allVariants].sort((a, b) => a.price - b.price)

    let variantEntrada = ''
    let variantStarter = ''
    let variantCarreira = ''
    let variantProfissional = ''

    // Name or price matching
    allVariants.forEach((v) => {
      const nameLower = v.productName.toLowerCase()
      if (nameLower.includes('entrada') || nameLower.includes('9.90') || nameLower.includes('9,90') || nameLower.includes('40')) {
        variantEntrada = v.variantId
      } else if (nameLower.includes('starter') || nameLower.includes('29.90') || nameLower.includes('29,90') || nameLower.includes('100')) {
        variantStarter = v.variantId
      } else if (nameLower.includes('carreira') || nameLower.includes('99.90') || nameLower.includes('99,90') || nameLower.includes('500')) {
        variantCarreira = v.variantId
      } else if (nameLower.includes('profissional') || nameLower.includes('249.90') || nameLower.includes('249,90') || nameLower.includes('1500')) {
        variantProfissional = v.variantId
      }
    })

    // Fallback assignment by price order if unassigned
    if (!variantEntrada && sortedVariants[0]) variantEntrada = sortedVariants[0].variantId
    if (!variantStarter && sortedVariants[1]) variantStarter = sortedVariants[1].variantId
    if (!variantCarreira && sortedVariants[2]) variantCarreira = sortedVariants[2].variantId
    if (!variantProfissional && sortedVariants[3]) variantProfissional = sortedVariants[3].variantId

    // Prepare configs to upsert
    const updates: Record<string, string> = {
      LEMON_API_KEY: apiKey,
    }

    if (storeId) updates.LEMON_STORE_ID = storeId
    if (body.webhookSecret) updates.LEMON_WEBHOOK_SECRET = body.webhookSecret.trim()
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
      message: `Loja #${storeId || 'N/A'} e ${allVariants.length} variante(s) encontradas e vinculadas com sucesso!`,
      storeId,
      variantsFoundCount: allVariants.length,
      variantsFoundList: allVariants.map(v => `${v.productName} (Variant #${v.variantId})`),
      updates
    })
  } catch (e: any) {
    console.error('lemon squeezy sync error', e)
    return NextResponse.json({ error: `Erro na sincronização: ${e.message || e}` }, { status: 500 })
  }
}
