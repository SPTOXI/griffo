export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { loadHiringAtlas } from '@/lib/hiring-index/atlas.server'

/**
 * O índice de temperatura de contratação INTEIRO, em uma chamada (§2.55).
 *
 * Irmã pública de `/api/hiring-index/[country]`. As duas leem a mesma tabela e
 * chamam a mesma `summarizeHiringIndex`; a diferença é o público.
 *
 * ## Por que esta NÃO exige sessão, se a de um país exige
 *
 * A rota de um país explica no cabeçalho dela que a sessão não está lá para
 * proteger o dado — estatística oficial não é de ninguém — mas para que uma
 * consulta ao Postgres por requisição não fique aberta ao mundo. Aqui esse
 * freio existe, e é outro: `loadHiringAtlas` guarda o resultado por uma hora na
 * memória do processo (ver o cabeçalho de `atlas.server.ts`), de modo que mil
 * visitantes anônimos numa hora custam UMA varredura da tabela, não mil. E a
 * página que ela alimenta (`/market-pulse`) só serve para alguma coisa se
 * buscador, rastreador e motor de resposta puderem lê-la sem conta — que é o
 * ponto inteiro de tê-la.
 *
 * ## O que sai daqui
 *
 * Enum de fase, código de país e nome próprio da fonte. **Nenhum texto de
 * tela**, pelo mesmo motivo da rota de um país: o rótulo que a pessoa lê é
 * escolhido pelo componente com o idioma ativo dela, e uma rota que devolvesse
 * texto pronto congelaria o idioma no servidor.
 *
 * Sai também `distribution`, a contagem de países por fase — o "índice
 * agregado". Ele é calculado no servidor a partir dos MESMOS resumos que vão em
 * `countries`, e não por uma segunda passada: a soma das contagens com
 * `unclassified` bate com `tracked` por construção, e quem quiser conferir
 * conta as linhas. Não é média, não é nota, não é blend — ver o cabeçalho de
 * `atlas.ts` para por que um número único seria mentira.
 *
 * ## Só países cobertos
 *
 * `countries` traz os ~98 países que têm linha na tabela. Os outros ~90 da
 * lista do produto não vêm com `covered: false` de enfeite: quem não está aqui
 * não tem dado, e é a TELA que desenha isso — sem cor de fase, com legenda
 * própria. Devolver 190 objetos vazios só engordaria a resposta.
 */
export async function GET() {
  try {
    const atlas = await loadHiringAtlas()
    return NextResponse.json(atlas)
  } catch (e: any) {
    console.error('[hiring-index] GET /api/hiring-index falhou:', e?.message || e)
    // 500, e não um atlas vazio: um corpo com zero país seria lido pela tela
    // como "nenhum país do mundo tem fonte oficial", que é uma afirmação — e
    // falsa. Falha de consulta e ausência de dado são frases diferentes.
    return NextResponse.json({ error: 'Não foi possível consultar o indicador.' }, { status: 500 })
  }
}
