import type { Language } from '@/lib/i18n/types'

/**
 * Textos que a própria biblioteca do mapa (MapLibre) mostra: o aviso de que é
 * preciso Ctrl + rolagem (ou dois dedos) para mexer no mapa, e os botões de
 * zoom. Sem isto saem em inglês em todas as páginas.
 */
type Keys =
  | 'CooperativeGesturesHandler.WindowsHelpText'
  | 'CooperativeGesturesHandler.MacHelpText'
  | 'CooperativeGesturesHandler.MobileHelpText'
  | 'NavigationControl.ZoomIn'
  | 'NavigationControl.ZoomOut'

const t = (win: string, mac: string, mobile: string, zoomIn: string, zoomOut: string): Record<Keys, string> => ({
  'CooperativeGesturesHandler.WindowsHelpText': win,
  'CooperativeGesturesHandler.MacHelpText': mac,
  'CooperativeGesturesHandler.MobileHelpText': mobile,
  'NavigationControl.ZoomIn': zoomIn,
  'NavigationControl.ZoomOut': zoomOut,
})

export const MAP_LOCALE: Record<Language, Record<Keys, string>> = {
  pt: t('Use Ctrl + rolagem para dar zoom no mapa', 'Use ⌘ + rolagem para dar zoom no mapa', 'Use dois dedos para mover o mapa', 'Aproximar', 'Afastar'),
  en: t('Use Ctrl + scroll to zoom the map', 'Use ⌘ + scroll to zoom the map', 'Use two fingers to move the map', 'Zoom in', 'Zoom out'),
  es: t('Usa Ctrl + desplazamiento para hacer zoom en el mapa', 'Usa ⌘ + desplazamiento para hacer zoom en el mapa', 'Usa dos dedos para mover el mapa', 'Acercar', 'Alejar'),
  de: t('Strg + Scrollen zum Zoomen der Karte', '⌘ + Scrollen zum Zoomen der Karte', 'Mit zwei Fingern die Karte bewegen', 'Vergrößern', 'Verkleinern'),
  fr: t('Utilisez Ctrl + molette pour zoomer sur la carte', 'Utilisez ⌘ + molette pour zoomer sur la carte', 'Utilisez deux doigts pour déplacer la carte', 'Zoom avant', 'Zoom arrière'),
  it: t('Usa Ctrl + scorrimento per ingrandire la mappa', 'Usa ⌘ + scorrimento per ingrandire la mappa', 'Usa due dita per spostare la mappa', 'Ingrandisci', 'Riduci'),
  nl: t('Gebruik Ctrl + scrollen om in te zoomen op de kaart', 'Gebruik ⌘ + scrollen om in te zoomen op de kaart', 'Gebruik twee vingers om de kaart te verplaatsen', 'Inzoomen', 'Uitzoomen'),
  sv: t('Använd Ctrl + skrolla för att zooma kartan', 'Använd ⌘ + skrolla för att zooma kartan', 'Använd två fingrar för att flytta kartan', 'Zooma in', 'Zooma ut'),
  ja: t('地図を拡大・縮小するには Ctrl キーを押しながらスクロールしてください', '地図を拡大・縮小するには ⌘ キーを押しながらスクロールしてください', '地図を動かすには2本の指を使ってください', '拡大', '縮小'),
  zh: t('按住 Ctrl 并滚动以缩放地图', '按住 ⌘ 并滚动以缩放地图', '用两根手指移动地图', '放大', '缩小'),
  ar: t('استخدم Ctrl مع التمرير لتكبير الخريطة', 'استخدم ⌘ مع التمرير لتكبير الخريطة', 'استخدم إصبعين لتحريك الخريطة', 'تكبير', 'تصغير'),
  ko: t('Ctrl 키를 누른 채 스크롤하면 지도를 확대·축소할 수 있습니다', '⌘ 키를 누른 채 스크롤하면 지도를 확대·축소할 수 있습니다', '두 손가락으로 지도를 움직이세요', '확대', '축소'),
}
