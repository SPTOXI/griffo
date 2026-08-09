import { NextResponse } from 'next/server'
import { computePricing, costPerCycleUsd, TOKEN_COST } from '@/lib/llm'
import { FX_TO_BRL } from '@/lib/currency'

export async function GET() {
  const plans = computePricing()
  const brlUsd = FX_TO_BRL.usd
  return NextResponse.json({
    plans,
    costPerCycleUsd: costPerCycleUsd(),
    costPerCycleBrl: costPerCycleUsd() * brlUsd,
    tokenCost: TOKEN_COST,
    brlUsdRate: brlUsd,
    assumptions: {
      analysisTokensIn: 1800,
      analysisTokensOut: 1500,
      rewriteTokensIn: 2500,
      rewriteTokensOut: 2200,
      storageCostPerUserPerDayUsd: 0.0008,
    },
  })
}
