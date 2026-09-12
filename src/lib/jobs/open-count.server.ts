import 'server-only'
import { db } from '@/lib/db'

/**
 * Contagem de vagas abertas citada no Hero D (home e as 41 rotas de país) —
 * "o número não precisa de segundo a segundo, só precisa de não mentir"
 * (ver comentário de `revalidate` em `src/app/page.tsx`).
 *
 * Antes, uma falha aqui virava `0` (capturada e escondida) e o ISR de 5
 * minutos cacheava esse zero como se fosse o dado real — que é exatamente o
 * "mentir" que o comentário original dizia evitar. Um soluço transitório de
 * conexão (cold start do Prisma logo após um deploy, hiccup do pooler do
 * Supabase) virava, por até 5 minutos, "0 vagas abertas" na home pública.
 *
 * A tentativa extra cobre esse soluço; se as duas falharem, a função agora
 * relança o erro em vez de mentir com `0` — e o comportamento padrão do ISR
 * do App Router para uma regeneração em segundo plano que lança é continuar
 * servindo a última página boa já gerada, tentando de novo na janela
 * seguinte. Nenhuma chamada síncrona depende do retorno mudar; só o efeito
 * colateral (o que fica em cache) muda.
 */
export async function getOpenJobsCount(): Promise<number> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await db.job.count({ where: { closedAt: null } })
    } catch (e) {
      if (attempt === 2) throw e
      console.error('open jobs count failed, retrying', e)
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }
  // Inalcançável (o laço acima sempre retorna ou relança), só para o TypeScript.
  throw new Error('unreachable')
}
