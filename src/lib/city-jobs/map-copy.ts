import type { Language } from '@/lib/i18n/types'

/**
 * Textos do mapa de vagas (`/[país]/jobs/map`), nos 12 idiomas do produto, no
 * idioma do mercado do país, como as páginas de cidade. Os textos que o mapa
 * divide com elas (modelo de trabalho, "Ver vaga") vêm de `copy.ts`.
 *
 * A chamada de cada vaga explica o ATS entre parênteses: fora do mundo de RH
 * quase ninguém sabe a sigla, e todo mundo entende "a nota do currículo".
 *
 * Marcadores: {country}, {city}, {n}, {cities}.
 */
export interface JobsMapCopy {
  navLabel: string
  metaTitle: string
  metaDescription: string
  heading: string
  intro: string
  loading: string
  unavailable: string
  pickCity: string
  jobsIn: string
  seeAll: string
  close: string
  jobCta: string
  topCities: string
  listLink: string
  noData: string
  credit: string
}

const pt: JobsMapCopy = {
  navLabel: 'Mapa de vagas',
  metaTitle: 'Mapa de vagas – {country}',
  metaDescription: '{n} vagas abertas em {cities} cidades no mapa. Clique numa cidade para ver as vagas e se candidatar direto na empresa.',
  heading: 'Mapa de vagas: {country}',
  intro: 'Cada bolha é uma cidade com vaga aberta, e o número é quantas vagas ela tem. Aproxime, clique numa cidade e veja as vagas mais novas.',
  loading: 'Carregando o mapa…',
  unavailable: 'O mapa não abriu neste navegador. A lista de cidades abaixo tem as mesmas vagas.',
  pickCity: 'Clique numa cidade no mapa para ver as vagas.',
  jobsIn: 'Vagas em {city}',
  seeAll: 'Ver as {n} vagas de {city}',
  close: 'Fechar',
  jobCta: 'Veja a nota do seu currículo e se ele passa no filtro (ATS) desta vaga',
  topCities: 'Cidades com mais vagas',
  listLink: 'Ver em lista',
  noData: 'Ainda não há cidades no mapa deste país.',
  credit: 'Cidades: GeoNames (CC BY 4.0). Mapa: OpenFreeMap, dados © OpenStreetMap.',
}

const en: JobsMapCopy = {
  navLabel: 'Job map',
  metaTitle: 'Job map – {country}',
  metaDescription: '{n} open jobs in {cities} cities on a map. Click a city to see its jobs and apply directly with the employer.',
  heading: 'Job map: {country}',
  intro: 'Each bubble is a city with open jobs, and the number is how many it has. Zoom in, click a city and see the newest jobs.',
  loading: 'Loading the map…',
  unavailable: 'The map could not load in this browser. The city list below has the same jobs.',
  pickCity: 'Click a city on the map to see its jobs.',
  jobsIn: 'Jobs in {city}',
  seeAll: 'See all {n} jobs in {city}',
  close: 'Close',
  jobCta: 'See your resume score and whether it gets past this job’s screening system (ATS)',
  topCities: 'Cities with the most jobs',
  listLink: 'See as a list',
  noData: 'There are no cities on the map for this country yet.',
  credit: 'Cities: GeoNames (CC BY 4.0). Map: OpenFreeMap, data © OpenStreetMap.',
}

const es: JobsMapCopy = {
  navLabel: 'Mapa de empleos',
  metaTitle: 'Mapa de empleos – {country}',
  metaDescription: '{n} ofertas abiertas en {cities} ciudades en el mapa. Haz clic en una ciudad para ver las ofertas y postularte directamente en la empresa.',
  heading: 'Mapa de empleos: {country}',
  intro: 'Cada burbuja es una ciudad con ofertas abiertas, y el número indica cuántas tiene. Acércate, haz clic en una ciudad y mira las ofertas más recientes.',
  loading: 'Cargando el mapa…',
  unavailable: 'El mapa no se pudo abrir en este navegador. La lista de ciudades de abajo tiene las mismas ofertas.',
  pickCity: 'Haz clic en una ciudad del mapa para ver sus ofertas.',
  jobsIn: 'Ofertas en {city}',
  seeAll: 'Ver las {n} ofertas de {city}',
  close: 'Cerrar',
  jobCta: 'Mira la nota de tu currículum y si pasa el filtro (ATS) de esta oferta',
  topCities: 'Ciudades con más ofertas',
  listLink: 'Ver en lista',
  noData: 'Todavía no hay ciudades en el mapa de este país.',
  credit: 'Ciudades: GeoNames (CC BY 4.0). Mapa: OpenFreeMap, datos © OpenStreetMap.',
}

const de: JobsMapCopy = {
  navLabel: 'Jobkarte',
  metaTitle: 'Jobkarte – {country}',
  metaDescription: '{n} offene Stellen in {cities} Städten auf der Karte. Klicken Sie auf eine Stadt, um die Stellen zu sehen und sich direkt beim Unternehmen zu bewerben.',
  heading: 'Jobkarte: {country}',
  intro: 'Jede Blase ist eine Stadt mit offenen Stellen, die Zahl zeigt, wie viele es dort gibt. Zoomen Sie hinein, klicken Sie auf eine Stadt und sehen Sie die neuesten Stellen.',
  loading: 'Karte wird geladen…',
  unavailable: 'Die Karte ließ sich in diesem Browser nicht öffnen. Die Städteliste unten enthält dieselben Stellen.',
  pickCity: 'Klicken Sie auf eine Stadt auf der Karte, um ihre Stellen zu sehen.',
  jobsIn: 'Stellen in {city}',
  seeAll: 'Alle {n} Stellen in {city} ansehen',
  close: 'Schließen',
  jobCta: 'Sehen Sie die Bewertung Ihres Lebenslaufs und ob er den Bewerberfilter (ATS) dieser Stelle passiert',
  topCities: 'Städte mit den meisten Stellen',
  listLink: 'Als Liste ansehen',
  noData: 'Für dieses Land gibt es noch keine Städte auf der Karte.',
  credit: 'Städte: GeoNames (CC BY 4.0). Karte: OpenFreeMap, Daten © OpenStreetMap.',
}

const fr: JobsMapCopy = {
  navLabel: 'Carte des offres',
  metaTitle: 'Carte des offres d’emploi – {country}',
  metaDescription: '{n} offres d’emploi dans {cities} villes sur la carte. Cliquez sur une ville pour voir les offres et postuler directement auprès de l’entreprise.',
  heading: 'Carte des offres d’emploi : {country}',
  intro: 'Chaque bulle est une ville avec des offres ouvertes, et le nombre indique combien elle en compte. Zoomez, cliquez sur une ville et voyez les offres les plus récentes.',
  loading: 'Chargement de la carte…',
  unavailable: 'La carte n’a pas pu s’ouvrir dans ce navigateur. La liste des villes ci-dessous contient les mêmes offres.',
  pickCity: 'Cliquez sur une ville de la carte pour voir ses offres.',
  jobsIn: 'Offres – {city}',
  seeAll: 'Voir les {n} offres – {city}',
  close: 'Fermer',
  jobCta: 'Découvrez la note de votre CV et s’il passe le filtre (ATS) de cette offre',
  topCities: 'Villes avec le plus d’offres',
  listLink: 'Voir en liste',
  noData: 'Il n’y a pas encore de villes sur la carte pour ce pays.',
  credit: 'Villes : GeoNames (CC BY 4.0). Carte : OpenFreeMap, données © OpenStreetMap.',
}

const it: JobsMapCopy = {
  navLabel: 'Mappa delle offerte',
  metaTitle: 'Mappa delle offerte di lavoro – {country}',
  metaDescription: '{n} offerte di lavoro in {cities} città sulla mappa. Clicca su una città per vedere le offerte e candidarti direttamente presso l’azienda.',
  heading: 'Mappa delle offerte di lavoro: {country}',
  intro: 'Ogni bolla è una città con offerte aperte, e il numero indica quante ne ha. Ingrandisci, clicca su una città e guarda le offerte più recenti.',
  loading: 'Caricamento della mappa…',
  unavailable: 'Non è stato possibile aprire la mappa in questo browser. L’elenco delle città qui sotto contiene le stesse offerte.',
  pickCity: 'Clicca su una città della mappa per vederne le offerte.',
  jobsIn: 'Offerte – {city}',
  seeAll: 'Vedi tutte le {n} offerte – {city}',
  close: 'Chiudi',
  jobCta: 'Scopri il punteggio del tuo CV e se supera il filtro (ATS) di questa offerta',
  topCities: 'Città con più offerte',
  listLink: 'Vedi in elenco',
  noData: 'Non ci sono ancora città sulla mappa per questo paese.',
  credit: 'Città: GeoNames (CC BY 4.0). Mappa: OpenFreeMap, dati © OpenStreetMap.',
}

const nl: JobsMapCopy = {
  navLabel: 'Vacaturekaart',
  metaTitle: 'Vacaturekaart – {country}',
  metaDescription: '{n} openstaande vacatures in {cities} steden op de kaart. Klik op een stad om de vacatures te zien en direct bij het bedrijf te solliciteren.',
  heading: 'Vacaturekaart: {country}',
  intro: 'Elke bubbel is een stad met openstaande vacatures, en het getal laat zien hoeveel. Zoom in, klik op een stad en bekijk de nieuwste vacatures.',
  loading: 'Kaart wordt geladen…',
  unavailable: 'De kaart kon in deze browser niet worden geopend. De lijst met steden hieronder bevat dezelfde vacatures.',
  pickCity: 'Klik op een stad op de kaart om de vacatures te zien.',
  jobsIn: 'Vacatures in {city}',
  seeAll: 'Bekijk alle {n} vacatures in {city}',
  close: 'Sluiten',
  jobCta: 'Bekijk de score van je cv en of het door het selectiesysteem (ATS) van deze vacature heen komt',
  topCities: 'Steden met de meeste vacatures',
  listLink: 'Bekijk als lijst',
  noData: 'Er staan nog geen steden op de kaart voor dit land.',
  credit: 'Steden: GeoNames (CC BY 4.0). Kaart: OpenFreeMap, gegevens © OpenStreetMap.',
}

const sv: JobsMapCopy = {
  navLabel: 'Jobbkarta',
  metaTitle: 'Jobbkarta – {country}',
  metaDescription: '{n} lediga jobb i {cities} städer på kartan. Klicka på en stad för att se jobben och söka direkt hos arbetsgivaren.',
  heading: 'Jobbkarta: {country}',
  intro: 'Varje bubbla är en stad med lediga jobb, och siffran visar hur många. Zooma in, klicka på en stad och se de senaste jobben.',
  loading: 'Kartan laddas…',
  unavailable: 'Kartan kunde inte öppnas i den här webbläsaren. Listan med städer nedan har samma jobb.',
  pickCity: 'Klicka på en stad på kartan för att se jobben.',
  jobsIn: 'Jobb i {city}',
  seeAll: 'Se alla {n} jobb i {city}',
  close: 'Stäng',
  jobCta: 'Se ditt CV:s betyg och om det tar sig igenom jobbets urvalssystem (ATS)',
  topCities: 'Städer med flest jobb',
  listLink: 'Visa som lista',
  noData: 'Det finns inga städer på kartan för det här landet ännu.',
  credit: 'Städer: GeoNames (CC BY 4.0). Karta: OpenFreeMap, data © OpenStreetMap.',
}

const ja: JobsMapCopy = {
  navLabel: '求人マップ',
  metaTitle: '求人マップ – {country}',
  metaDescription: '{cities}都市の{n}件の求人を地図で表示。都市をクリックすると求人が見られ、企業に直接応募できます。',
  heading: '求人マップ：{country}',
  intro: '各バブルは求人のある都市で、数字は求人の件数です。拡大して都市をクリックすると、最新の求人が表示されます。',
  loading: '地図を読み込んでいます…',
  unavailable: 'このブラウザでは地図を表示できませんでした。下の都市一覧から同じ求人を見られます。',
  pickCity: '地図上の都市をクリックすると求人が表示されます。',
  jobsIn: '{city}の求人',
  seeAll: '{city}の求人{n}件をすべて見る',
  close: '閉じる',
  jobCta: '履歴書のスコアと、この求人の選考システム（ATS）を通過できるかを確認する',
  topCities: '求人の多い都市',
  listLink: '一覧で見る',
  noData: 'この国の地図にはまだ都市がありません。',
  credit: '都市：GeoNames（CC BY 4.0）。地図：OpenFreeMap、データ © OpenStreetMap。',
}

const zh: JobsMapCopy = {
  navLabel: '职位地图',
  metaTitle: '职位地图 – {country}',
  metaDescription: '在地图上查看 {cities} 个城市的 {n} 个在招职位。点击城市即可查看职位，并直接向企业投递。',
  heading: '职位地图：{country}',
  intro: '每个圆圈代表一个有在招职位的城市，数字是职位数量。放大地图，点击城市，查看最新职位。',
  loading: '地图加载中…',
  unavailable: '此浏览器无法打开地图。下方的城市列表包含相同的职位。',
  pickCity: '点击地图上的城市查看职位。',
  jobsIn: '{city}的职位',
  seeAll: '查看{city}的全部 {n} 个职位',
  close: '关闭',
  jobCta: '查看你的简历得分，以及它能否通过该职位的筛选系统（ATS）',
  topCities: '职位最多的城市',
  listLink: '以列表查看',
  noData: '该国家的地图上还没有城市。',
  credit: '城市：GeoNames（CC BY 4.0）。地图：OpenFreeMap，数据 © OpenStreetMap。',
}

const ar: JobsMapCopy = {
  navLabel: 'خريطة الوظائف',
  metaTitle: 'خريطة الوظائف – {country}',
  metaDescription: '{n} وظيفة شاغرة في {cities} مدينة على الخريطة. انقر على مدينة لرؤية الوظائف والتقديم مباشرة لدى الشركة.',
  heading: 'خريطة الوظائف: {country}',
  intro: 'كل دائرة مدينة فيها وظائف شاغرة، والرقم هو عدد الوظائف. كبّر الخريطة وانقر على مدينة لترى أحدث الوظائف.',
  loading: 'جارٍ تحميل الخريطة…',
  unavailable: 'تعذّر فتح الخريطة في هذا المتصفح. قائمة المدن أدناه تضم الوظائف نفسها.',
  pickCity: 'انقر على مدينة في الخريطة لرؤية وظائفها.',
  jobsIn: 'وظائف في {city}',
  seeAll: 'عرض جميع الوظائف في {city} ({n})',
  close: 'إغلاق',
  jobCta: 'اعرف تقييم سيرتك الذاتية وهل تجتاز نظام الفرز (ATS) لهذه الوظيفة',
  topCities: 'المدن الأكثر وظائف',
  listLink: 'عرض كقائمة',
  noData: 'لا توجد مدن على خريطة هذا البلد بعد.',
  credit: 'المدن: GeoNames (CC BY 4.0). الخريطة: OpenFreeMap، البيانات © OpenStreetMap.',
}

const ko: JobsMapCopy = {
  navLabel: '채용 지도',
  metaTitle: '채용 지도 – {country}',
  metaDescription: '{cities}개 도시의 채용 공고 {n}건을 지도에서 확인하세요. 도시를 클릭하면 공고를 보고 기업에 바로 지원할 수 있습니다.',
  heading: '채용 지도: {country}',
  intro: '각 버블은 채용 중인 도시이고, 숫자는 공고 수입니다. 지도를 확대하고 도시를 클릭하면 최신 공고가 보입니다.',
  loading: '지도를 불러오는 중…',
  unavailable: '이 브라우저에서는 지도를 열 수 없습니다. 아래 도시 목록에 같은 공고가 있습니다.',
  pickCity: '지도에서 도시를 클릭하면 공고가 보입니다.',
  jobsIn: '{city} 채용 공고',
  seeAll: '{city} 공고 {n}건 모두 보기',
  close: '닫기',
  jobCta: '이력서 점수와 이 공고의 서류 필터(ATS)를 통과하는지 확인하기',
  topCities: '공고가 많은 도시',
  listLink: '목록으로 보기',
  noData: '이 나라의 지도에는 아직 도시가 없습니다.',
  credit: '도시: GeoNames (CC BY 4.0). 지도: OpenFreeMap, 데이터 © OpenStreetMap.',
}

export const JOBS_MAP_COPY: Record<Language, JobsMapCopy> = { pt, en, es, de, fr, it, nl, sv, ja, zh, ar, ko }
