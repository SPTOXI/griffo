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
    const storeId = configs.LEMON_STORE_ID
    
    // Determine variant based on credits
    let variantId = ''
    if (pkg.credits === 30) variantId = configs.LEMON_VARIANT_30 || ''
    if (pkg.credits === 100) variantId = configs.LEMON_VARIANT_100 || ''
    if (pkg.credits === 300) variantId = configs.LEMON_VARIANT_300 || ''

    if (!storeId || !variantId) {
      // Se não configurado, faz fallback pra compra local simulada para facilitar desenvolvimento
      const res = await purchaseCreditPackage(user.id, packageId)
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Erro ao processar compra.' }, { status: 400 })
      }
      return NextResponse.json({
        success: true,
        message: res.postPurchaseMessage || `${res.packageInfo?.name} ativado com sucesso!`,
        newBalance: res.newBalance,
        package: res.packageInfo,
      })
    }

    // Configuração do Lemon Squeezy via SDK
    setupLemonSqueezy()

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
        return NextResponse.json({ error: 'Erro ao gerar checkout seguro.' }, { status: 500 })
      }

      // Return the checkout URL
      return NextResponse.json({
        success: true,
        checkoutUrl: data?.data.attributes.url
      })
    } catch (checkoutErr) {
      console.error('Lemon Squeezy exception:', checkoutErr)
      return NextResponse.json({ error: 'Falha ao conectar com gateway de pagamento.' }, { status: 500 })
    }
  } catch (e: any) {
    console.error('credit purchase API error:', e)
    return NextResponse.json({ error: 'Erro ao processar aquisição de créditos.' }, { status: 500 })
  }
}
