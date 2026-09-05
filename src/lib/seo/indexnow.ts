const INDEXNOW_KEY = '5aa728fe6a274c0d8fb10530a78312fa'
const HOST = 'griffo.work'
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`
const ENDPOINT = 'https://api.indexnow.org/indexnow'

export interface IndexNowResult {
  ok: boolean
  status: number
  body: string
}

/**
 * Avisa os motores de busca que participam do protocolo IndexNow (Bing,
 * Yandex, Seznam, Naver...) de que uma URL é nova ou mudou, sem esperar o
 * próximo rastreio. O endpoint genérico `api.indexnow.org` distribui pra
 * todos os participantes numa chamada só.
 *
 * `fetchImpl` recebido por parâmetro pelo mesmo motivo de `lib/email/send.ts`
 * (§7.3): a chamada real nunca foi observada em teste, só documentação.
 */
export async function submitUrlsToIndexNow(
  urls: string[],
  fetchImpl: typeof fetch = fetch
): Promise<IndexNowResult> {
  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    }),
  })
  const body = await res.text().catch(() => '')
  return { ok: res.ok, status: res.status, body }
}
