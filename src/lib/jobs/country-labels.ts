import type { Language } from '@/lib/i18n'

/**
 * Nome do país no idioma da tela, para a lista "vagas por país" da home
 * (§2.127) e onde mais precisar de nome de país fora de um formulário em
 * português.
 *
 * ## Por que não é `Intl.DisplayNames`
 *
 * É a MESMA armadilha que `map-model.ts` já pagou (ver o comentário lá):
 * chamar `Intl.DisplayNames` dentro de um componente que roda tanto no
 * servidor quanto na hidratação do cliente pode divergir — as tabelas de
 * idioma do Node e do navegador nem sempre concordam, e o React descarta a
 * árvore inteira do servidor por causa do nome de um país. A tabela fixa
 * abaixo nunca diverge: mesmo texto, sempre.
 *
 * ## Por que não são todos os ~150 países de `lib/market/countries.ts`
 *
 * Aquela lista é de formulário (nome único, em português, pra digitar
 * onde a pessoa mora) e cobre o mundo inteiro de propósito. Esta aqui é
 * fechada contra os países que REALMENTE têm vaga aberta hoje (consulta ao
 * banco, 15/09/2026) — a mesma disciplina de `location-country.ts` e
 * `category-labels.ts`: lista pequena e verificável, não geocoding
 * genérico. Código sem entrada aqui devolve o próprio código ISO — nunca
 * gera erro, só fica menos bonito até entrar na lista.
 */
const NAMES: Record<Language, Record<string, string>> = {
  pt: {
    BR: 'Brasil', US: 'Estados Unidos', GB: 'Reino Unido', AU: 'Austrália', SG: 'Singapura',
    CA: 'Canadá', IN: 'Índia', IE: 'Irlanda', JP: 'Japão', DE: 'Alemanha', MX: 'México',
    BE: 'Bélgica', AT: 'Áustria', EE: 'Estônia', FR: 'França', NL: 'Holanda', KR: 'Coreia do Sul',
    ES: 'Espanha', IT: 'Itália', CN: 'China', PL: 'Polônia', ID: 'Indonésia', TH: 'Tailândia',
    VN: 'Vietnã', PH: 'Filipinas', HU: 'Hungria', ZA: 'África do Sul', AE: 'Emirados Árabes Unidos',
    NZ: 'Nova Zelândia', TR: 'Turquia', CZ: 'República Tcheca',
  },
  en: {
    BR: 'Brazil', US: 'United States', GB: 'United Kingdom', AU: 'Australia', SG: 'Singapore',
    CA: 'Canada', IN: 'India', IE: 'Ireland', JP: 'Japan', DE: 'Germany', MX: 'Mexico',
    BE: 'Belgium', AT: 'Austria', EE: 'Estonia', FR: 'France', NL: 'Netherlands', KR: 'South Korea',
    ES: 'Spain', IT: 'Italy', CN: 'China', PL: 'Poland', ID: 'Indonesia', TH: 'Thailand',
    VN: 'Vietnam', PH: 'Philippines', HU: 'Hungary', ZA: 'South Africa', AE: 'United Arab Emirates',
    NZ: 'New Zealand', TR: 'Turkey', CZ: 'Czech Republic',
  },
  es: {
    BR: 'Brasil', US: 'Estados Unidos', GB: 'Reino Unido', AU: 'Australia', SG: 'Singapur',
    CA: 'Canadá', IN: 'India', IE: 'Irlanda', JP: 'Japón', DE: 'Alemania', MX: 'México',
    BE: 'Bélgica', AT: 'Austria', EE: 'Estonia', FR: 'Francia', NL: 'Países Bajos', KR: 'Corea del Sur',
    ES: 'España', IT: 'Italia', CN: 'China', PL: 'Polonia', ID: 'Indonesia', TH: 'Tailandia',
    VN: 'Vietnam', PH: 'Filipinas', HU: 'Hungría', ZA: 'Sudáfrica', AE: 'Emiratos Árabes Unidos',
    NZ: 'Nueva Zelanda', TR: 'Turquía', CZ: 'República Checa',
  },
  de: {
    BR: 'Brasilien', US: 'Vereinigte Staaten', GB: 'Vereinigtes Königreich', AU: 'Australien',
    SG: 'Singapur', CA: 'Kanada', IN: 'Indien', IE: 'Irland', JP: 'Japan', DE: 'Deutschland',
    MX: 'Mexiko', BE: 'Belgien', AT: 'Österreich', EE: 'Estland', FR: 'Frankreich',
    NL: 'Niederlande', KR: 'Südkorea', ES: 'Spanien', IT: 'Italien', CN: 'China', PL: 'Polen',
    ID: 'Indonesien', TH: 'Thailand', VN: 'Vietnam', PH: 'Philippinen', HU: 'Ungarn',
    ZA: 'Südafrika', AE: 'Vereinigte Arabische Emirate', NZ: 'Neuseeland', TR: 'Türkei',
    CZ: 'Tschechien',
  },
  fr: {
    BR: 'Brésil', US: 'États-Unis', GB: 'Royaume-Uni', AU: 'Australie', SG: 'Singapour',
    CA: 'Canada', IN: 'Inde', IE: 'Irlande', JP: 'Japon', DE: 'Allemagne', MX: 'Mexique',
    BE: 'Belgique', AT: 'Autriche', EE: 'Estonie', FR: 'France', NL: 'Pays-Bas',
    KR: 'Corée du Sud', ES: 'Espagne', IT: 'Italie', CN: 'Chine', PL: 'Pologne',
    ID: 'Indonésie', TH: 'Thaïlande', VN: 'Vietnam', PH: 'Philippines', HU: 'Hongrie',
    ZA: 'Afrique du Sud', AE: 'Émirats Arabes Unis', NZ: 'Nouvelle-Zélande', TR: 'Turquie',
    CZ: 'République Tchèque',
  },
  it: {
    BR: 'Brasile', US: 'Stati Uniti', GB: 'Regno Unito', AU: 'Australia', SG: 'Singapore',
    CA: 'Canada', IN: 'India', IE: 'Irlanda', JP: 'Giappone', DE: 'Germania', MX: 'Messico',
    BE: 'Belgio', AT: 'Austria', EE: 'Estonia', FR: 'Francia', NL: 'Paesi Bassi',
    KR: 'Corea del Sud', ES: 'Spagna', IT: 'Italia', CN: 'Cina', PL: 'Polonia',
    ID: 'Indonesia', TH: 'Tailandia', VN: 'Vietnam', PH: 'Filippine', HU: 'Ungheria',
    ZA: 'Sudafrica', AE: 'Emirati Arabi Uniti', NZ: 'Nuova Zelanda', TR: 'Turchia',
    CZ: 'Repubblica Ceca',
  },
  ja: {
    BR: 'ブラジル', US: 'アメリカ合衆国', GB: 'イギリス', AU: 'オーストラリア', SG: 'シンガポール',
    CA: 'カナダ', IN: 'インド', IE: 'アイルランド', JP: '日本', DE: 'ドイツ', MX: 'メキシコ',
    BE: 'ベルギー', AT: 'オーストリア', EE: 'エストニア', FR: 'フランス', NL: 'オランダ',
    KR: '韓国', ES: 'スペイン', IT: 'イタリア', CN: '中国', PL: 'ポーランド',
    ID: 'インドネシア', TH: 'タイ', VN: 'ベトナム', PH: 'フィリピン', HU: 'ハンガリー',
    ZA: '南アフリカ', AE: 'アラブ首長国連邦', NZ: 'ニュージーランド', TR: 'トルコ', CZ: 'チェコ',
  },
  nl: {
    BR: 'Brazilië', US: 'Verenigde Staten', GB: 'Verenigd Koninkrijk', AU: 'Australië',
    SG: 'Singapore', CA: 'Canada', IN: 'India', IE: 'Ierland', JP: 'Japan', DE: 'Duitsland',
    MX: 'Mexico', BE: 'België', AT: 'Oostenrijk', EE: 'Estland', FR: 'Frankrijk',
    NL: 'Nederland', KR: 'Zuid-Korea', ES: 'Spanje', IT: 'Italië', CN: 'China', PL: 'Polen',
    ID: 'Indonesië', TH: 'Thailand', VN: 'Vietnam', PH: 'Filipijnen', HU: 'Hongarije',
    ZA: 'Zuid-Afrika', AE: 'Verenigde Arabische Emiraten', NZ: 'Nieuw-Zeeland', TR: 'Turkije',
    CZ: 'Tsjechië',
  },
  sv: {
    BR: 'Brasilien', US: 'USA', GB: 'Storbritannien', AU: 'Australien', SG: 'Singapore',
    CA: 'Kanada', IN: 'Indien', IE: 'Irland', JP: 'Japan', DE: 'Tyskland', MX: 'Mexiko',
    BE: 'Belgien', AT: 'Österrike', EE: 'Estland', FR: 'Frankrike', NL: 'Nederländerna',
    KR: 'Sydkorea', ES: 'Spanien', IT: 'Italien', CN: 'Kina', PL: 'Polen', ID: 'Indonesien',
    TH: 'Thailand', VN: 'Vietnam', PH: 'Filippinerna', HU: 'Ungern', ZA: 'Sydafrika',
    AE: 'Förenade Arabemiraten', NZ: 'Nya Zeeland', TR: 'Turkiet', CZ: 'Tjeckien',
  },
  zh: {
    BR: '巴西', US: '美国', GB: '英国', AU: '澳大利亚', SG: '新加坡', CA: '加拿大', IN: '印度',
    IE: '爱尔兰', JP: '日本', DE: '德国', MX: '墨西哥', BE: '比利时', AT: '奥地利', EE: '爱沙尼亚',
    FR: '法国', NL: '荷兰', KR: '韩国', ES: '西班牙', IT: '意大利', CN: '中国', PL: '波兰',
    ID: '印度尼西亚', TH: '泰国', VN: '越南', PH: '菲律宾', HU: '匈牙利', ZA: '南非',
    AE: '阿拉伯联合酋长国', NZ: '新西兰', TR: '土耳其', CZ: '捷克',
  },
  ar: {
    BR: 'البرازيل', US: 'الولايات المتحدة', GB: 'المملكة المتحدة', AU: 'أستراليا',
    SG: 'سنغافورة', CA: 'كندا', IN: 'الهند', IE: 'أيرلندا', JP: 'اليابان', DE: 'ألمانيا',
    MX: 'المكسيك', BE: 'بلجيكا', AT: 'النمسا', EE: 'إستونيا', FR: 'فرنسا', NL: 'هولندا',
    KR: 'كوريا الجنوبية', ES: 'إسبانيا', IT: 'إيطاليا', CN: 'الصين', PL: 'بولندا',
    ID: 'إندونيسيا', TH: 'تايلاند', VN: 'فيتنام', PH: 'الفلبين', HU: 'المجر',
    ZA: 'جنوب أفريقيا', AE: 'الإمارات العربية المتحدة', NZ: 'نيوزيلندا', TR: 'تركيا',
    CZ: 'التشيك',
  },
  ko: {
    BR: '브라질', US: '미국', GB: '영국', AU: '오스트레일리아', SG: '싱가포르', CA: '캐나다',
    IN: '인도', IE: '아일랜드', JP: '일본', DE: '독일', MX: '멕시코', BE: '벨기에', AT: '오스트리아',
    EE: '에스토니아', FR: '프랑스', NL: '네덜란드', KR: '대한민국', ES: '스페인', IT: '이탈리아',
    CN: '중국', PL: '폴란드', ID: '인도네시아', TH: '태국', VN: '베트남', PH: '필리핀',
    HU: '헝가리', ZA: '남아프리카공화국', AE: '아랍에미리트', NZ: '뉴질랜드', TR: '튀르키예',
    CZ: '체코',
  },
}

/** Nome do país no idioma pedido. Código sem entrada na tabela devolve o
 *  próprio código ISO — nunca lança, nunca inventa nome. */
export function countryLabel(code: string, lang: Language): string {
  const upper = code.toUpperCase()
  return NAMES[lang]?.[upper] ?? NAMES.en[upper] ?? upper
}
