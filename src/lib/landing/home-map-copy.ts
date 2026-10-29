import type { Language } from '@/lib/i18n/types'

/**
 * Textos do mapa da home, a isca do envio de currículo: passar o mouse (ou
 * tocar) numa cidade mostra só o nome de até 3 vagas e o total, sem empresa
 * nem link. Depois do envio, a vaga grátis aparece em vermelho e as
 * compatíveis trancadas com cadeado.
 *
 * Marcadores: {n}, {cities}, {city}.
 */
export interface HomeMapCopy {
  heading: string
  intro: string
  more: string
  clusterTip: string
  cta: string
  freePin: string
  lockedOne: string
  lockedMany: string
  lockedCta: string
  seeOnMap: string
  legendFree: string
  legendLocked: string
}

const pt: HomeMapCopy = {
  heading: 'Onde estão as vagas agora',
  intro: '{n} vagas abertas em {cities} cidades. Passe o mouse ou toque numa cidade para ver algumas delas.',
  more: 'e mais {n} vagas em {city}',
  clusterTip: '{n} vagas nesta região. Aproxime para ver as cidades.',
  cta: 'Envie seu currículo e veja quais combinam com você',
  freePin: 'Sua vaga gratuita',
  lockedOne: '1 vaga compatível com você em {city}',
  lockedMany: '{n} vagas compatíveis com você em {city}',
  lockedCta: 'Desbloquear para ver',
  seeOnMap: 'Ver no mapa onde estão suas vagas',
  legendFree: 'Sua vaga gratuita',
  legendLocked: 'Vagas compatíveis travadas',
}

const en: HomeMapCopy = {
  heading: 'Where the jobs are right now',
  intro: '{n} open jobs in {cities} cities. Hover over or tap a city to see some of them.',
  more: 'and {n} more jobs in {city}',
  clusterTip: '{n} jobs in this area. Zoom in to see the cities.',
  cta: 'Send your resume and see which ones fit you',
  freePin: 'Your free job match',
  lockedOne: '1 job that fits you in {city}',
  lockedMany: '{n} jobs that fit you in {city}',
  lockedCta: 'Unlock to see them',
  seeOnMap: 'See on the map where your jobs are',
  legendFree: 'Your free job match',
  legendLocked: 'Matching jobs, locked',
}

const es: HomeMapCopy = {
  heading: 'Dónde están las ofertas ahora',
  intro: '{n} ofertas abiertas en {cities} ciudades. Pasa el cursor o toca una ciudad para ver algunas.',
  more: 'y {n} ofertas más en {city}',
  clusterTip: '{n} ofertas en esta zona. Acércate para ver las ciudades.',
  cta: 'Envía tu currículum y descubre cuáles encajan contigo',
  freePin: 'Tu oferta gratuita',
  lockedOne: '1 oferta compatible contigo en {city}',
  lockedMany: '{n} ofertas compatibles contigo en {city}',
  lockedCta: 'Desbloquear para verlas',
  seeOnMap: 'Mira en el mapa dónde están tus ofertas',
  legendFree: 'Tu oferta gratuita',
  legendLocked: 'Ofertas compatibles bloqueadas',
}

const de: HomeMapCopy = {
  heading: 'Wo es gerade Stellen gibt',
  intro: '{n} offene Stellen in {cities} Städten. Fahren Sie mit der Maus über eine Stadt oder tippen Sie darauf, um einige davon zu sehen.',
  more: 'und {n} weitere Stellen in {city}',
  clusterTip: '{n} Stellen in dieser Region. Zoomen Sie hinein, um die Städte zu sehen.',
  cta: 'Lebenslauf hochladen und sehen, welche zu Ihnen passen',
  freePin: 'Ihre kostenlose Stelle',
  lockedOne: '1 passende Stelle in {city}',
  lockedMany: '{n} passende Stellen in {city}',
  lockedCta: 'Freischalten und ansehen',
  seeOnMap: 'Auf der Karte sehen, wo Ihre Stellen sind',
  legendFree: 'Ihre kostenlose Stelle',
  legendLocked: 'Passende Stellen, gesperrt',
}

const fr: HomeMapCopy = {
  heading: 'Où sont les offres en ce moment',
  intro: '{n} offres ouvertes dans {cities} villes. Survolez ou touchez une ville pour en voir quelques-unes.',
  more: 'et {n} autres offres – {city}',
  clusterTip: '{n} offres dans cette zone. Zoomez pour voir les villes.',
  cta: 'Envoyez votre CV et découvrez celles qui vous correspondent',
  freePin: 'Votre offre gratuite',
  lockedOne: '1 offre qui vous correspond – {city}',
  lockedMany: '{n} offres qui vous correspondent – {city}',
  lockedCta: 'Débloquer pour les voir',
  seeOnMap: 'Voir sur la carte où sont vos offres',
  legendFree: 'Votre offre gratuite',
  legendLocked: 'Offres compatibles verrouillées',
}

const it: HomeMapCopy = {
  heading: 'Dove sono le offerte adesso',
  intro: '{n} offerte aperte in {cities} città. Passa il mouse o tocca una città per vederne alcune.',
  more: 'e altre {n} offerte – {city}',
  clusterTip: '{n} offerte in questa zona. Ingrandisci per vedere le città.',
  cta: 'Invia il tuo curriculum e scopri quali fanno per te',
  freePin: 'La tua offerta gratuita',
  lockedOne: '1 offerta adatta a te – {city}',
  lockedMany: '{n} offerte adatte a te – {city}',
  lockedCta: 'Sblocca per vederle',
  seeOnMap: 'Guarda sulla mappa dove sono le tue offerte',
  legendFree: 'La tua offerta gratuita',
  legendLocked: 'Offerte compatibili bloccate',
}

const nl: HomeMapCopy = {
  heading: 'Waar de vacatures nu zijn',
  intro: '{n} openstaande vacatures in {cities} steden. Beweeg met de muis over een stad of tik erop om er een paar te zien.',
  more: 'en nog {n} vacatures in {city}',
  clusterTip: '{n} vacatures in deze regio. Zoom in om de steden te zien.',
  cta: 'Stuur je cv en zie welke bij je passen',
  freePin: 'Je gratis vacature',
  lockedOne: '1 passende vacature in {city}',
  lockedMany: '{n} passende vacatures in {city}',
  lockedCta: 'Ontgrendelen om ze te zien',
  seeOnMap: 'Zie op de kaart waar je vacatures zijn',
  legendFree: 'Je gratis vacature',
  legendLocked: 'Passende vacatures, vergrendeld',
}

const sv: HomeMapCopy = {
  heading: 'Var jobben finns just nu',
  intro: '{n} lediga jobb i {cities} städer. Håll muspekaren över eller tryck på en stad för att se några av dem.',
  more: 'och {n} jobb till i {city}',
  clusterTip: '{n} jobb i det här området. Zooma in för att se städerna.',
  cta: 'Skicka ditt CV och se vilka som passar dig',
  freePin: 'Ditt kostnadsfria jobb',
  lockedOne: '1 jobb som passar dig i {city}',
  lockedMany: '{n} jobb som passar dig i {city}',
  lockedCta: 'Lås upp för att se dem',
  seeOnMap: 'Se på kartan var dina jobb finns',
  legendFree: 'Ditt kostnadsfria jobb',
  legendLocked: 'Matchande jobb, låsta',
}

const ja: HomeMapCopy = {
  heading: 'いま求人がある場所',
  intro: '{cities}都市で{n}件の求人を掲載中。都市にカーソルを合わせるかタップすると、求人の一部が見られます。',
  more: '{city}にはほかに{n}件の求人',
  clusterTip: 'この地域には{n}件の求人があります。拡大すると都市が表示されます。',
  cta: '履歴書を送って、自分に合う求人を確認する',
  freePin: '無料で見られる求人',
  lockedOne: '{city}にあなたに合う求人が1件',
  lockedMany: '{city}にあなたに合う求人が{n}件',
  lockedCta: 'ロックを解除して見る',
  seeOnMap: 'あなたの求人の場所を地図で見る',
  legendFree: '無料で見られる求人',
  legendLocked: 'ロック中のマッチした求人',
}

const zh: HomeMapCopy = {
  heading: '现在哪里有职位',
  intro: '{cities} 个城市共有 {n} 个在招职位。将鼠标悬停在城市上或点击城市，即可查看部分职位。',
  more: '{city}还有 {n} 个职位',
  clusterTip: '该地区有 {n} 个职位。放大地图查看城市。',
  cta: '上传简历，看看哪些职位适合你',
  freePin: '你的免费匹配职位',
  lockedOne: '{city}有 1 个适合你的职位',
  lockedMany: '{city}有 {n} 个适合你的职位',
  lockedCta: '解锁查看',
  seeOnMap: '在地图上查看你的职位在哪里',
  legendFree: '你的免费匹配职位',
  legendLocked: '已锁定的匹配职位',
}

const ar: HomeMapCopy = {
  heading: 'أين الوظائف الآن',
  intro: '{n} وظيفة شاغرة في {cities} مدينة. مرّر المؤشر فوق مدينة أو انقر عليها لترى بعضها.',
  more: 'والمزيد من الوظائف في {city} ({n})',
  clusterTip: 'عدد الوظائف في هذه المنطقة: {n}. كبّر الخريطة لترى المدن.',
  cta: 'أرسل سيرتك الذاتية واعرف أيها يناسبك',
  freePin: 'وظيفتك المجانية',
  lockedOne: 'وظيفة واحدة تناسبك في {city}',
  lockedMany: 'وظائف تناسبك في {city}: {n}',
  lockedCta: 'افتح القفل لرؤيتها',
  seeOnMap: 'شاهد على الخريطة أين توجد وظائفك',
  legendFree: 'وظيفتك المجانية',
  legendLocked: 'وظائف مناسبة مقفلة',
}

const ko: HomeMapCopy = {
  heading: '지금 채용 중인 곳',
  intro: '{cities}개 도시에서 {n}건의 채용 공고가 진행 중입니다. 도시에 마우스를 올리거나 탭하면 일부 공고를 볼 수 있습니다.',
  more: '{city}에 공고 {n}건 더',
  clusterTip: '이 지역에 공고가 {n}건 있습니다. 확대하면 도시가 보입니다.',
  cta: '이력서를 보내고 나에게 맞는 공고를 확인하세요',
  freePin: '무료로 공개된 공고',
  lockedOne: '{city}에 나에게 맞는 공고 1건',
  lockedMany: '{city}에 나에게 맞는 공고 {n}건',
  lockedCta: '잠금 해제하고 보기',
  seeOnMap: '내 공고가 있는 곳을 지도에서 보기',
  legendFree: '무료로 공개된 공고',
  legendLocked: '잠긴 맞춤 공고',
}

export const HOME_MAP_COPY: Record<Language, HomeMapCopy> = { pt, en, es, de, fr, it, nl, sv, ja, zh, ar, ko }
