import Stripe from 'stripe'

export function getStripe(customSecretKey?: string) {
  const key = customSecretKey || process.env.STRIPE_SECRET_KEY || ''
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY não foi informada ou configurada no sistema.')
  }
  return new Stripe(key)
}
