/**
 * País → continente, para os 173 países que `lib/market/countries.ts` conhece.
 *
 * ## Por que isto existe
 *
 * A pendência 14(e) pedia "agregação por continente". O §2.56 respondeu que
 * agregam-se as FASES e não os valores, e recusou o corte continental com um
 * argumento que continua valendo: *"África: 60% aquecendo" seria uma afirmação
 * sobre os 12 que têm dado apresentada como afirmação sobre 54*.
 *
 * O que muda agora não é a estatística, é o **denominador**. Um continente só
 * pode aparecer na tela se o número de países SEM fonte aparecer junto, com a
 * mesma força visual do número de países com fonte. Para isso é preciso saber
 * quantos países cada continente tem — e a resposta honesta para "quantos" é
 * *quantos o produto conhece*, não quantos existem no mundo nem quantos têm
 * linha em `LaborMarketPoint`. Por isso a tabela abaixo cobre a lista inteira
 * de `lib/market/countries.ts`, e não só os ~98 cobertos: o numerador sai do
 * banco, o denominador sai daqui, e os dois são ditos juntos.
 *
 * ## A regra de atribuição, e por que ela é uma regra e não uma opinião por país
 *
 * **UN M49** (o geoesquema da Divisão de Estatística das Nações Unidas), sem
 * redução nenhuma a partir do §2.65: cada região intermediária do M49 dentro
 * de *Americas* vira um continente próprio do produto — inclusive *Central
 * America* e *Caribbean*, que antes do §2.65 ficavam junto de *Northern
 * America* só porque o produto tinha seis caixas e não sete. A hierarquia do
 * M49 é seguida sem inventar critério:
 *
 * | região M49 | vira |
 * |---|---|
 * | Africa | África |
 * | Asia | Ásia |
 * | Europe | Europa |
 * | Oceania | Oceania |
 * | Americas, região intermediária *Northern America* | América do Norte |
 * | Americas, *Central America* + *Caribbean* (M49 as separa; aqui somadas) | América Central e Caribe |
 * | Americas, região intermediária *South America* | América do Sul |
 *
 * A única redução que resta é juntar *Central America* com *Caribbean* — o
 * M49 as trata como duas sub-regiões distintas, mas nenhuma das duas sozinha
 * justificaria um oitavo continente na tela, e as duas já viviam juntas desde
 * o §2.59. É a mesma disciplina de antes, só que com uma costura a menos.
 *
 * Uma regra única aplicada a todos, e não caso a caso, é o ponto: país
 * transcontinental é onde a atribuição "de bom senso" vira preferência de quem
 * escreve o código. Com o M49 mandando, os casos difíceis se resolvem sozinhos
 * e ficam conferíveis:
 *
 * | país | M49 | aqui | observação |
 * |---|---|---|---|
 * | Rússia (RU) | Europe / Eastern Europe | **EU** | o M49 a põe inteira na Europa |
 * | Turquia (TR) | Asia / Western Asia | **AS** | |
 * | Cazaquistão (KZ) | Asia / Central Asia | **AS** | |
 * | Geórgia (GE), Armênia (AM), Azerbaijão (AZ) | Asia / Western Asia | **AS** | |
 * | Chipre (CY) | Asia / Western Asia | **AS** | membro da UE, mas o M49 é geográfico |
 * | Egito (EG) | Africa / Northern Africa | **AF** | o Sinai não muda a região M49 |
 * | Timor-Leste (TL) | Asia / South-eastern Asia | **AS** | |
 * | México (MX), Panamá (PA) | Americas / Central America | **CA** | não é Northern America no M49, apesar do senso comum |
 * | Porto Rico (PR), Cuba, Jamaica, Barbados, Trinidad… | Americas / Caribbean | **CA** | |
 * | Guiana (GY), Suriname (SR) | Americas / South America | **SA** | |
 *
 * **O que a regra NÃO tenta resolver.** Chipre é membro da União Europeia e a
 * Rússia tem a maior parte do território na Ásia — nas duas, a resposta daqui
 * discorda de uma leitura política ou de uma leitura de área. É o preço de ter
 * uma regra só, e é mais barato que 173 decisões individuais que ninguém
 * consegue reconferir depois.
 *
 * ## §2.65 — por que a separação, e por que não é "correção de um erro"
 *
 * O operador apontou que juntar *América do Norte* com *América Central e
 * Caribe* sob um rótulo só ("América do Norte") estava errado. A investigação
 * mostrou uma distinção que vale registrar: pela geografia FÍSICA (onde a
 * maioria dos atlas escolares traça a linha, na fronteira Panamá–Colômbia),
 * Central America e Caribbean SÃO parte do continente América do Norte — os
 * 18 países de antes do §2.65 não eram um erro de continente. O problema era
 * outro: o M49 (citado como regra deste arquivo) não é uma classificação de
 * continente, é uma convenção ESTATÍSTICA da ONU que agrupa Central America e
 * Caribbean junto de South America sob "Latin America and the Caribbean" —
 * uma categoria socioeconômica, não geográfica. Como o arquivo já cita o M49
 * como a regra e não a geografia física, a separação em sete continentes é a
 * aplicação mais fiel dessa MESMA regra, não uma opinião nova por cima dela.
 *
 * ## Conferência: dois conjuntos independentes, não memória
 *
 * Mesma disciplina de `connectors/iso3.ts`. Os 173 pares foram derivados de
 * `datasets/country-codes` (`data/country-codes.csv`, colunas `Region Name`,
 * `Sub-region Name`, `Intermediate Region Name`, lida em 03/09/2026) e depois
 * conferidos par a par contra um segundo conjunto de outro mantenedor,
 * `lukes/ISO-3166-Countries-with-Regional-Codes` (`all/all.csv`) — os dois
 * publicam o M49 da UNSD. Resultado: **172 de 173 idênticos**.
 *
 * A única diferença é **Taiwan (TW)**, e ela não é um erro de nenhum dos dois:
 * a UNSD não dá entrada própria a Taiwan no M49 (o território é contado dentro
 * do código 156, China), então o segundo conjunto o deixa sem região. Fica
 * `AS`, que é onde a China está e onde a geografia o põe — sem ambiguidade de
 * continente, ao contrário da questão de status que o M49 evita.
 *
 * A coluna `Continent` do primeiro conjunto (esquema CIA/GeoNames) discorda do
 * M49 em dois casos, e o M49 prevalece por ser a regra declarada acima:
 * **Chipre** (`EU` lá, `AS` aqui) e **Timor-Leste** (`OC` lá, `AS` aqui).
 *
 * ## Sem tradução aqui
 *
 * A tabela guarda o CÓDIGO do continente, nunca o nome. O nome legível sai do
 * dicionário (`i18n/types.ts`, bloco `continents`) nos 12 idiomas — e
 * deliberadamente **não** de `Intl.DisplayNames`: é a mesma armadilha que fez o
 * mapa perder a árvore do servidor por causa de `Falklandinseln` contra
 * `Falklandinseln (Malwinen)` (ver o cabeçalho de `map-model.ts`). Seis
 * palavras por idioma num dicionário estático não têm versão de ICU.
 */

import { COUNTRIES } from '../market/countries'

/**
 * Os sete continentes povoados.
 *
 * A Antártida não está aqui porque nenhum país da lista fica nela — e um
 * continente sempre vazio na tela seria uma linha afirmando cobertura zero de
 * uma coisa que não existe para medir.
 *
 * A ordem é a alfabética do código, e não a de tamanho, população ou mercado.
 * Nenhum continente é listado primeiro.
 */
export const CONTINENTS = ['AF', 'AS', 'CA', 'EU', 'NA', 'OC', 'SA'] as const

export type Continent = (typeof CONTINENTS)[number]

/**
 * ISO2 → continente, pela regra do cabeçalho.
 *
 * Agrupada por continente e ordenada por código dentro de cada grupo, para que
 * a próxima adição tenha um lugar óbvio e a conferência linha a linha seja
 * possível. O teste companheiro trava as duas metades: nenhum país da lista do
 * produto sem continente, nenhum código aqui que a lista não conheça.
 */
export const CONTINENT_BY_COUNTRY: Readonly<Record<string, Continent>> = {
  // África — 48
  AO: 'AF', BF: 'AF', BI: 'AF', BJ: 'AF', BW: 'AF', CD: 'AF', CF: 'AF',
  CI: 'AF', CM: 'AF', CV: 'AF', DZ: 'AF', EG: 'AF', ER: 'AF', ET: 'AF',
  GA: 'AF', GH: 'AF', GM: 'AF', GN: 'AF', GQ: 'AF', GW: 'AF', KE: 'AF',
  LR: 'AF', LS: 'AF', LY: 'AF', MA: 'AF', MG: 'AF', ML: 'AF', MR: 'AF',
  MU: 'AF', MW: 'AF', MZ: 'AF', NA: 'AF', NE: 'AF', NG: 'AF', RW: 'AF',
  SD: 'AF', SL: 'AF', SN: 'AF', SO: 'AF', SZ: 'AF', TD: 'AF', TG: 'AF',
  TN: 'AF', TZ: 'AF', UG: 'AF', ZA: 'AF', ZM: 'AF', ZW: 'AF',

  // Ásia — 48
  AE: 'AS', AF: 'AS', AM: 'AS', AZ: 'AS', BD: 'AS', BH: 'AS', BN: 'AS',
  BT: 'AS', CN: 'AS', CY: 'AS', GE: 'AS', HK: 'AS', ID: 'AS', IL: 'AS',
  IN: 'AS', IQ: 'AS', IR: 'AS', JO: 'AS', JP: 'AS', KG: 'AS', KH: 'AS',
  KR: 'AS', KW: 'AS', KZ: 'AS', LA: 'AS', LB: 'AS', LK: 'AS', MM: 'AS',
  MN: 'AS', MV: 'AS', MY: 'AS', NP: 'AS', OM: 'AS', PH: 'AS', PK: 'AS',
  QA: 'AS', SA: 'AS', SG: 'AS', SY: 'AS', TH: 'AS', TJ: 'AS', TL: 'AS',
  TM: 'AS', TR: 'AS', TW: 'AS', UZ: 'AS', VN: 'AS', YE: 'AS',

  // Europa — 42
  AD: 'EU', AL: 'EU', AT: 'EU', BA: 'EU', BE: 'EU', BG: 'EU', BY: 'EU',
  CH: 'EU', CZ: 'EU', DE: 'EU', DK: 'EU', EE: 'EU', ES: 'EU', FI: 'EU',
  FR: 'EU', GB: 'EU', GR: 'EU', HR: 'EU', HU: 'EU', IE: 'EU', IS: 'EU',
  IT: 'EU', LI: 'EU', LT: 'EU', LU: 'EU', LV: 'EU', MC: 'EU', MD: 'EU',
  ME: 'EU', MK: 'EU', MT: 'EU', NL: 'EU', NO: 'EU', PL: 'EU', PT: 'EU',
  RO: 'EU', RS: 'EU', RU: 'EU', SE: 'EU', SI: 'EU', SK: 'EU', UA: 'EU',

  // América do Norte — 2 (M49 Northern America; ver §2.65 no cabeçalho)
  CA: 'NA', US: 'NA',

  // América Central e Caribe — 16 (M49 Central America + Caribbean, ver §2.65)
  BB: 'CA', BS: 'CA', BZ: 'CA', CR: 'CA', CU: 'CA', DO: 'CA', GT: 'CA',
  HN: 'CA', HT: 'CA', JM: 'CA', MX: 'CA', NI: 'CA', PA: 'CA', PR: 'CA',
  SV: 'CA', TT: 'CA',

  // Oceania — 5
  AU: 'OC', FJ: 'OC', NZ: 'OC', PF: 'OC', PG: 'OC',

  // América do Sul — 12
  AR: 'SA', BO: 'SA', BR: 'SA', CL: 'SA', CO: 'SA', EC: 'SA', GY: 'SA',
  PE: 'SA', PY: 'SA', SR: 'SA', UY: 'SA', VE: 'SA',
}

/**
 * O continente de um código ISO2, ou `null`.
 *
 * `null` é o comportamento correto para código que a lista do produto não
 * conhece — chutar um continente colocaria o país numa contagem que o
 * denominador não previu, e o total do continente deixaria de fechar.
 */
export function continentOf(code: string | null | undefined): Continent | null {
  if (typeof code !== 'string') return null
  const upper = code.trim().toUpperCase()
  return CONTINENT_BY_COUNTRY[upper] ?? null
}

/**
 * Quantos países de cada continente o produto conhece — **o denominador**.
 *
 * Calculado a partir de `COUNTRIES`, e não escrito à mão: uma constante
 * copiada envelheceria em silêncio no dia em que um país entrasse na lista, e
 * a tela passaria a dizer "30 de 44" quando já são 45.
 */
export const COUNTRIES_PER_CONTINENT: Readonly<Record<Continent, number>> = (() => {
  const counts = Object.fromEntries(CONTINENTS.map((c) => [c, 0])) as Record<Continent, number>
  for (const country of COUNTRIES) {
    const continent = CONTINENT_BY_COUNTRY[country.code]
    if (continent) counts[continent]++
  }
  return counts
})()
