/**
 * Avisos sobre modelos que não cabem no prazo das rotas.
 *
 * Vivia dentro do catálogo de créditos, por acidente de história: era o único
 * módulo client-safe à mão quando o painel precisou do aviso. O catálogo de
 * créditos deixou de existir; o aviso não tem nada a ver com preço e passa a
 * morar em arquivo próprio.
 *
 * Continua fora de `ai-router/registry.ts` pelo motivo original: o registry
 * importa Prisma e não pode ir para o navegador.
 */

/**
 * Modelos que não terminam dentro do `maxDuration` de 60s das rotas de IA.
 *
 * O painel administrativo aceita qualquer modelo da lista de correntes, e o
 * roteador honra a escolha. Isso já derrubou o produto uma vez: o relatório
 * `docs/RELATORIO-TIMEOUT-ANALISE.md` documenta a troca de `claude-sonnet-5`
 * por `claude-opus-5` como causa raiz de timeouts reprodutíveis, com o commit
 * anterior registrando 1,8s de latência medida no Sonnet.
 *
 * A escolha continua permitida — pode haver razão para fazê-la, e travá-la
 * seria decidir pelo administrador. O que muda é que a consequência passa a
 * estar visível NO MOMENTO da escolha, em vez de aparecer depois como falha
 * operacional sem causa aparente.
 */
export const SLOW_MODEL_WARNINGS: Record<string, string> = {
  'claude-opus-5':
    'O Opus 5 não termina dentro do limite de 60s das rotas de análise e reescrita. ' +
    'Já foi causa de timeout reprodutível neste projeto (ver RELATORIO-TIMEOUT-ANALISE.md). ' +
    'Para essas rotas, o claude-sonnet-5 é o modelo indicado.',
}

/** Aviso de lentidão do modelo, ou `null` quando não há ressalva conhecida. */
export function slowModelWarning(model: string | null | undefined): string | null {
  if (!model) return null
  return SLOW_MODEL_WARNINGS[model.trim().toLowerCase()] ?? null
}
