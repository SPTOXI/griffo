import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { purchaseCreditPackage, CREDIT_PACKAGES } from '@/lib/credits'
import { getGlobalSettings } from '@/lib/settings'
import { setupLemonSqueezy } from '@/lib/lemonsqueezy'
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js'

const schema = z.object({
  packageId: z.enum(['entrada', 'starter', 'carreira', 'profissional']),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para adquirir créditos.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Pacote de créditos inválido.' }, { status: 400 })
    }

    const packageId = parsed.data.packageId
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Pacote não encontrado.' }, { status: 400 })
    }

    // Load configs
    const configs = await getGlobalSettings()
    const apiKey = configs.LEMON_API_KEY || process.env.LEMON_SQUEEZY_API_KEY || process.env.LEMON_API_KEY || ''
    const storeId = configs.LEMON_STORE_ID || process.env.LEMON_SQUEEZY_STORE_ID || process.env.LEMON_STORE_ID || ''
    
    // Determine variant based on credits
    let variantId = ''
    if (packageId === 'entrada') variantId = configs.LEMON_VARIANT_ENTRADA || process.env.LEMON_VARIANT_ENTRADA || ''
    if (packageId === 'starter') variantId = configs.LEMON_VARIANT_STARTER || process.env.LEMON_VARIANT_STARTER || ''
    if (packageId === 'carreira') variantId = configs.LEMON_VARIANT_CARREIRA || process.env.LEMON_VARIANT_CARREIRA || ''
    if (packageId === 'profissional') variantId = configs.LEMON_VARIANT_PROFISSIONAL || process.env.LEMON_VARIANT_PROFISSIONAL || ''

    const missing: string[] = []
    if (!apiKey) missing.push('API Key')
    if (!storeId) missing.push('Store ID')
    if (!variantId) missing.push(`Variant ID (${pkg.name})`)

    if (missing.length > 0) {
      return NextResponse.json({
        error: `Configuração do Lemon Squeezy pendente no Painel Admin: Falta cadastrar ${missing.join(', ')}.`
      }, { status: 400 })
    }

    // Configuração do Lemon Squeezy via SDK
    setupLemonSqueezy(apiKey)

    try {
      const { data, error } = await createCheckout(storeId, variantId, {
        checkoutData: {
          email: user.email || '',
          custom: {
            user_id: user.id,
            credit_amount: pkg.credits.toString()
          }
        },
        productOptions: {
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://griffo.vercel.app'}/dashboard`,
          receiptButtonText: 'Voltar para o GriffoWork',
          receiptThankYouNote: `Obrigado! Seus ${pkg.credits} créditos foram adicionados à sua conta.`
        }
      })

      if (error) {
        console.error('Lemon Squeezy Checkout Error:', error)
        const errMsg = typeof error === 'object' && error !== null && 'message' in error
          ? (error as any).message
          : 'Erro ao gerar checkout no Lemon Squeezy'
        return NextResponse.json({ error: `Erro no gateway de pagamento: ${errMsg}` }, { status: 400 })
      }

      // Return the checkout URL
      return NextResponse.json({
        success: true,
        checkoutUrl: data?.data.attributes.url
      })
    } catch (checkoutErr: any) {
      console.error('Lemon Squeezy exception:', checkoutErr)
      return NextResponse.json({ error: `Falha ao conectar com Lemon Squeezy: ${checkoutErr?.message || checkoutErr}` }, { status: 500 })
    }
  } catch (e: any) {
    console.error('credit purchase API error:', e)
    return NextResponse.json({ error: 'Erro ao processar aquisição de créditos.' }, { status: 500 })
  }
}
