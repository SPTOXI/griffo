/**
 * ISO 3166-1 alfa-3 → alfa-2, na fronteira dos conectores da ONU.
 *
 * ## Por que isto existe
 *
 * O produto guarda país em alfa-2 (`BR`, `DE`, `US`) — é o que `LaborMarketPoint`
 * declara, é o que o perfil grava e é o que `lib/market/countries.ts` conhece.
 * As duas fontes da fase 3 falam alfa-3: o ILOSTAT devolve `REF_AREA=BRA` e o
 * CEPALSTAT devolve `iso3: "BRA"`. Sem tradução, o Brasil viraria dois países no
 * banco — `BR` do Eurostat/BLS e `BRA` daqui —, que é exatamente o defeito que o
 * conector do Eurostat já evita traduzindo `EL`→`GR` e `UK`→`GB` na fronteira.
 *
 * Mora aqui, e não dentro de um dos dois conectores, porque os DOIS precisam
 * dela. Copiada em dois arquivos, ela divergiria na primeira correção.
 *
 * ## Por que a tabela é a lista do produto, e não a ISO inteira
 *
 * A ISO 3166-1 tem 249 códigos; `lib/market/countries.ts` conhece 173. Um par
 * alfa-3 que não tem alfa-2 correspondente na lista do produto não teria para
 * onde ir: `isKnownCountry` o descartaria uma linha adiante de qualquer jeito.
 * Escrever os 249 daria a impressão de cobertura que o resto do produto não tem.
 *
 * Cada par foi conferido contra os nomes oficiais em inglês que a própria API do
 * ILOSTAT publica (codelist `CL_AREA`, 335 códigos, lida em 01/09/2026) cruzados
 * com `Intl.DisplayNames` sobre o alfa-2 — não escritos de memória.
 *
 * ## Código que a tabela não conhece NÃO vira país
 *
 * Devolve `null`, e quem chama registra o código descartado no `error` do
 * resultado. Isso acontece de verdade e não é hipótese: o ILOSTAT publica `KOS`
 * (Kosovo), que não é código ISO 3166-1, e `PSE`, `GRD`, `LCA` e `SYC`, que são
 * ISO mas não estão na lista do produto. Inventar um alfa-2 para eles gravaria
 * país fantasma; silenciá-los esconderia a perda de cobertura. Nem um nem outro.
 */

import { isKnownCountry } from '../../market/countries'

/**
 * Alfa-3 → alfa-2, para os 173 países que `lib/market/countries.ts` conhece.
 *
 * A correspondência é bijetora e conferida por teste: nenhum país da lista fica
 * sem alfa-3, nenhum alfa-3 aponta para alfa-2 que a lista não conhece.
 *
 * Ordenada pelo alfa-3 para que a próxima adição tenha um lugar óbvio e a
 * conferência linha a linha seja possível.
 */
export const ISO3_TO_ISO2: Readonly<Record<string, string>> = {
  AFG: 'AF', AGO: 'AO', ALB: 'AL', AND: 'AD', ARE: 'AE', ARG: 'AR', ARM: 'AM',
  AUS: 'AU', AUT: 'AT', AZE: 'AZ', BDI: 'BI', BEL: 'BE', BEN: 'BJ', BFA: 'BF',
  BGD: 'BD', BGR: 'BG', BHR: 'BH', BHS: 'BS', BIH: 'BA', BLR: 'BY', BLZ: 'BZ',
  BOL: 'BO', BRA: 'BR', BRB: 'BB', BRN: 'BN', BTN: 'BT', BWA: 'BW', CAF: 'CF',
  CAN: 'CA', CHE: 'CH', CHL: 'CL', CHN: 'CN', CIV: 'CI', CMR: 'CM', COD: 'CD',
  COL: 'CO', CPV: 'CV', CRI: 'CR', CUB: 'CU', CYP: 'CY', CZE: 'CZ', DEU: 'DE',
  DNK: 'DK', DOM: 'DO', DZA: 'DZ', ECU: 'EC', EGY: 'EG', ERI: 'ER', ESP: 'ES',
  EST: 'EE', ETH: 'ET', FIN: 'FI', FJI: 'FJ', FRA: 'FR', GAB: 'GA', GBR: 'GB',
  GEO: 'GE', GHA: 'GH', GIN: 'GN', GMB: 'GM', GNB: 'GW', GNQ: 'GQ', GRC: 'GR',
  GTM: 'GT', GUY: 'GY', HKG: 'HK', HND: 'HN', HRV: 'HR', HTI: 'HT', HUN: 'HU',
  IDN: 'ID', IND: 'IN', IRL: 'IE', IRN: 'IR', IRQ: 'IQ', ISL: 'IS', ISR: 'IL',
  ITA: 'IT', JAM: 'JM', JOR: 'JO', JPN: 'JP', KAZ: 'KZ', KEN: 'KE', KGZ: 'KG',
  KHM: 'KH', KOR: 'KR', KWT: 'KW', LAO: 'LA', LBN: 'LB', LBR: 'LR', LBY: 'LY',
  LIE: 'LI', LKA: 'LK', LSO: 'LS', LTU: 'LT', LUX: 'LU', LVA: 'LV', MAR: 'MA',
  MCO: 'MC', MDA: 'MD', MDG: 'MG', MDV: 'MV', MEX: 'MX', MKD: 'MK', MLI: 'ML',
  MLT: 'MT', MMR: 'MM', MNE: 'ME', MNG: 'MN', MOZ: 'MZ', MRT: 'MR', MUS: 'MU',
  MWI: 'MW', MYS: 'MY', NAM: 'NA', NER: 'NE', NGA: 'NG', NIC: 'NI', NLD: 'NL',
  NOR: 'NO', NPL: 'NP', NZL: 'NZ', OMN: 'OM', PAK: 'PK', PAN: 'PA', PER: 'PE',
  PHL: 'PH', PNG: 'PG', POL: 'PL', PRI: 'PR', PRT: 'PT', PRY: 'PY', PYF: 'PF',
  QAT: 'QA', ROU: 'RO', RUS: 'RU', RWA: 'RW', SAU: 'SA', SDN: 'SD', SEN: 'SN',
  SGP: 'SG', SLE: 'SL', SLV: 'SV', SOM: 'SO', SRB: 'RS', SUR: 'SR', SVK: 'SK',
  SVN: 'SI', SWE: 'SE', SWZ: 'SZ', SYR: 'SY', TCD: 'TD', TGO: 'TG', THA: 'TH',
  TJK: 'TJ', TKM: 'TM', TLS: 'TL', TTO: 'TT', TUN: 'TN', TUR: 'TR', TWN: 'TW',
  TZA: 'TZ', UGA: 'UG', UKR: 'UA', URY: 'UY', USA: 'US', UZB: 'UZ', VEN: 'VE',
  VNM: 'VN', YEM: 'YE', ZAF: 'ZA', ZMB: 'ZM', ZWE: 'ZW',
}

/**
 * O alfa-2 correspondente, ou `null`.
 *
 * `null` cobre três casos que quem chama trata igual (descarta e denuncia) e que
 * vale distinguir ao ler: código que não é alfa-3, código alfa-3 fora da lista
 * do produto, e alfa-2 que a lista de países deixou de conhecer. A checagem
 * final contra `isKnownCountry` não é redundante com a tabela: ela mantém as
 * duas listas presas uma à outra se algum dia um país sair de `countries.ts`.
 */
export function iso2FromIso3(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const code = raw.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(code)) return null
  const iso2 = ISO3_TO_ISO2[code]
  if (!iso2) return null
  return isKnownCountry(iso2) ? iso2 : null
}
