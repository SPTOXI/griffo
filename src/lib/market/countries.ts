/**
 * Países com nome por extenso.
 *
 * ## Por que este arquivo existe
 *
 * A tela do perfil pedia "código de 2 letras (BR, PT, US...)" e um campo de
 * texto. Isso presume que a pessoa conheça a tabela ISO — e quem não conhece
 * ou erra, ou desiste, ou escreve algo que o normalizador descarta em silêncio.
 * Um país escolhido de uma lista com o nome escrito não tem esse problema.
 *
 * ## O código continua sendo o que se guarda
 *
 * O nome é para ler; o `code` é o que vai para o banco e o que o
 * `lib/market` resolve. Guardar o nome traduzido seria guardar a tradução junto
 * do dado, e um dia a tradução muda.
 *
 * ## Nem todo país tem adaptação de mercado
 *
 * `MARKETS` cobre doze países hoje. Os demais existem aqui porque as pessoas
 * moram neles: alguém no Chile precisa poder dizer que mora no Chile. O que ele
 * não tem é convenção de currículo própria — cai no perfil global, o que a tela
 * diz com todas as letras em vez de fingir cobertura que não existe.
 */

import { MARKETS } from './index'

export interface CountryOption {
  /** ISO 3166-1 alfa-2. É isto que se guarda. */
  code: string
  /** Nome em português, para leitura. */
  name: string
}

/**
 * Ordenado por nome depois de montado, não à mão: uma lista escrita em ordem
 * manual sai de ordem no primeiro país acrescentado no lugar errado.
 */
const RAW: [string, string][] = [
  ['AF', 'Afeganistão'], ['ZA', 'África do Sul'], ['AL', 'Albânia'], ['DE', 'Alemanha'],
  ['AD', 'Andorra'], ['AO', 'Angola'], ['SA', 'Arábia Saudita'], ['DZ', 'Argélia'],
  ['AR', 'Argentina'], ['AM', 'Armênia'], ['AU', 'Austrália'], ['AT', 'Áustria'],
  ['AZ', 'Azerbaijão'], ['BS', 'Bahamas'], ['BD', 'Bangladesh'], ['BB', 'Barbados'],
  ['BH', 'Barein'], ['BE', 'Bélgica'], ['BZ', 'Belize'], ['BJ', 'Benin'],
  ['BY', 'Bielorrússia'], ['BO', 'Bolívia'], ['BA', 'Bósnia e Herzegovina'],
  ['BW', 'Botsuana'], ['BR', 'Brasil'], ['BN', 'Brunei'], ['BG', 'Bulgária'],
  ['BF', 'Burquina Faso'], ['BI', 'Burundi'], ['BT', 'Butão'], ['CV', 'Cabo Verde'],
  ['CM', 'Camarões'], ['KH', 'Camboja'], ['CA', 'Canadá'], ['QA', 'Catar'],
  ['KZ', 'Cazaquistão'], ['TD', 'Chade'], ['CL', 'Chile'], ['CN', 'China'],
  ['CY', 'Chipre'], ['SG', 'Cingapura'], ['CO', 'Colômbia'], ['KR', 'Coreia do Sul'],
  ['CI', 'Costa do Marfim'], ['CR', 'Costa Rica'], ['HR', 'Croácia'], ['CU', 'Cuba'],
  ['DK', 'Dinamarca'], ['EG', 'Egito'], ['SV', 'El Salvador'], ['AE', 'Emirados Árabes Unidos'],
  ['EC', 'Equador'], ['ER', 'Eritreia'], ['SK', 'Eslováquia'], ['SI', 'Eslovênia'],
  ['ES', 'Espanha'], ['US', 'Estados Unidos'], ['EE', 'Estônia'], ['ET', 'Etiópia'],
  ['FJ', 'Fiji'], ['PH', 'Filipinas'], ['FI', 'Finlândia'], ['FR', 'França'],
  ['GA', 'Gabão'], ['GM', 'Gâmbia'], ['GH', 'Gana'], ['GE', 'Geórgia'],
  ['GR', 'Grécia'], ['GT', 'Guatemala'], ['GY', 'Guiana'], ['GN', 'Guiné'],
  ['GQ', 'Guiné Equatorial'], ['GW', 'Guiné-Bissau'], ['HT', 'Haiti'], ['NL', 'Holanda'],
  ['HN', 'Honduras'], ['HK', 'Hong Kong'], ['HU', 'Hungria'], ['YE', 'Iêmen'],
  ['IN', 'Índia'], ['ID', 'Indonésia'], ['IQ', 'Iraque'], ['IR', 'Irã'],
  ['IE', 'Irlanda'], ['IS', 'Islândia'], ['IL', 'Israel'], ['IT', 'Itália'],
  ['JM', 'Jamaica'], ['JP', 'Japão'], ['JO', 'Jordânia'], ['KW', 'Kuwait'],
  ['LA', 'Laos'], ['LS', 'Lesoto'], ['LV', 'Letônia'], ['LB', 'Líbano'],
  ['LR', 'Libéria'], ['LY', 'Líbia'], ['LI', 'Liechtenstein'], ['LT', 'Lituânia'],
  ['LU', 'Luxemburgo'], ['MK', 'Macedônia do Norte'], ['MG', 'Madagascar'],
  ['MY', 'Malásia'], ['MW', 'Malaui'], ['MV', 'Maldivas'], ['ML', 'Mali'],
  ['MT', 'Malta'], ['MA', 'Marrocos'], ['MU', 'Maurício'], ['MR', 'Mauritânia'],
  ['MX', 'México'], ['MM', 'Mianmar'], ['MZ', 'Moçambique'], ['MD', 'Moldávia'],
  ['MC', 'Mônaco'], ['MN', 'Mongólia'], ['ME', 'Montenegro'], ['NA', 'Namíbia'],
  ['NP', 'Nepal'], ['NI', 'Nicarágua'], ['NE', 'Níger'], ['NG', 'Nigéria'],
  ['NO', 'Noruega'], ['NZ', 'Nova Zelândia'], ['OM', 'Omã'], ['PA', 'Panamá'],
  ['PG', 'Papua-Nova Guiné'], ['PK', 'Paquistão'], ['PY', 'Paraguai'], ['PE', 'Peru'],
  ['PF', 'Polinésia Francesa'], ['PL', 'Polônia'], ['PR', 'Porto Rico'],
  ['PT', 'Portugal'], ['KE', 'Quênia'], ['KG', 'Quirguistão'], ['GB', 'Reino Unido'],
  ['CF', 'República Centro-Africana'], ['CD', 'República Democrática do Congo'],
  ['DO', 'República Dominicana'], ['CZ', 'República Tcheca'], ['RO', 'Romênia'],
  ['RW', 'Ruanda'], ['RU', 'Rússia'], ['SN', 'Senegal'], ['SL', 'Serra Leoa'],
  ['RS', 'Sérvia'], ['SY', 'Síria'], ['SO', 'Somália'], ['LK', 'Sri Lanka'],
  ['SZ', 'Essuatíni'], ['SD', 'Sudão'], ['SE', 'Suécia'], ['CH', 'Suíça'],
  ['SR', 'Suriname'], ['TH', 'Tailândia'], ['TW', 'Taiwan'], ['TJ', 'Tajiquistão'],
  ['TZ', 'Tanzânia'], ['TL', 'Timor-Leste'], ['TG', 'Togo'], ['TT', 'Trinidad e Tobago'],
  ['TN', 'Tunísia'], ['TM', 'Turcomenistão'], ['TR', 'Turquia'], ['UA', 'Ucrânia'],
  ['UG', 'Uganda'], ['UY', 'Uruguai'], ['UZ', 'Uzbequistão'], ['VE', 'Venezuela'],
  ['VN', 'Vietnã'], ['ZM', 'Zâmbia'], ['ZW', 'Zimbábue'],
]

/** Todos os países, em ordem alfabética de nome. */
export const COUNTRIES: CountryOption[] = RAW.map(([code, name]) => ({ code, name })).sort((a, b) =>
  a.name.localeCompare(b.name, 'pt-BR')
)

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]))

/** Códigos que têm adaptação de mercado própria. Os demais caem no global. */
export const ADAPTED_COUNTRY_CODES: ReadonlySet<string> = new Set(MARKETS.flatMap((m) => m.countries))

/** O nome do país, ou o próprio código quando ele não está na lista. */
export function countryName(code: string | null | undefined): string | null {
  if (!code) return null
  return BY_CODE.get(code.toUpperCase())?.name ?? code.toUpperCase()
}

/** Um país que a lista conhece? Usado para não guardar lixo digitado. */
export function isKnownCountry(code: string | null | undefined): boolean {
  return !!code && BY_CODE.has(code.toUpperCase())
}

/**
 * Os países separados em dois grupos, na ordem em que a tela os mostra.
 *
 * Os adaptados vêm primeiro porque escolher um deles muda o comportamento do
 * produto — e quem mora num deles deve encontrá-lo sem rolar a lista inteira.
 */
export function groupedCountries(): { adapted: CountryOption[]; others: CountryOption[] } {
  return {
    adapted: COUNTRIES.filter((c) => ADAPTED_COUNTRY_CODES.has(c.code)),
    others: COUNTRIES.filter((c) => !ADAPTED_COUNTRY_CODES.has(c.code)),
  }
}

const CODE_BY_NAME = new Map<string, string>([
  ...COUNTRIES.map((c) => [c.name.toLowerCase(), c.code] as [string, string]),
  // Fontes brasileiras escrevem "Brasil"; dados vindos de fora escrevem "Brazil".
  ['brazil', 'BR'],
  ['united states', 'US'],
  ['united kingdom', 'GB'],
])

/**
 * Nome de país por extenso vira ISO2.
 *
 * Mora aqui, junto dos nomes, e não em cada adapter: a Gupy manda "Brasil" e a
 * Adzuna manda "Brasil" dentro de uma hierarquia — duas tabelas separadas
 * divergiriam no primeiro país acrescentado a uma só.
 *
 * Nome desconhecido devolve `null`. Um país errado é pior que país nenhum,
 * porque o filtro duro age sobre ele.
 */
export function countryCodeFromName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  if (!key) return null
  if (/^[a-z]{2}$/.test(key)) {
    const upper = key.toUpperCase()
    return BY_CODE.has(upper) ? upper : null
  }
  return CODE_BY_NAME.get(key) ?? null
}
