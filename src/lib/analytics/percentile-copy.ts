import type { Language } from '@/lib/i18n/types'

/**
 * "Sua nota é maior que a de X% dos currículos já testados" — usado no
 * resultado do envio da home e no teste ATS grátis. Arquivo próprio e pequeno
 * para as duas telas não carregarem o dicionário uma da outra. Marcador {p}.
 */
export const PERCENTILE_LINE: Record<Language, string> = {
  pt: 'Sua nota é maior que a de {p}% dos currículos já testados na GriffoWork.',
  en: 'Your score is higher than {p}% of the resumes already checked on GriffoWork.',
  es: 'Tu nota es mayor que la del {p}% de los currículums ya analizados en GriffoWork.',
  de: 'Ihre Bewertung liegt über der von {p} % der bereits bei GriffoWork geprüften Lebensläufe.',
  fr: 'Votre note est supérieure à celle de {p} % des CV déjà testés sur GriffoWork.',
  it: 'Il tuo punteggio è più alto di quello del {p}% dei CV già testati su GriffoWork.',
  nl: 'Je score is hoger dan die van {p}% van de cv’s die al op GriffoWork zijn getest.',
  sv: 'Ditt betyg är högre än {p} % av de cv:n som redan testats på GriffoWork.',
  ja: 'あなたのスコアは、GriffoWorkでチェック済みの履歴書の{p}%より高いです。',
  ko: '내 점수는 GriffoWork에서 이미 확인한 이력서의 {p}%보다 높습니다.',
  zh: '你的得分高于 GriffoWork 上已检测简历的 {p}%。',
  ar: 'درجتك أعلى من {p}% من السير الذاتية التي اختُبرت على GriffoWork.',
}

export function percentileLine(lang: string, p: number): string {
  return (PERCENTILE_LINE[lang as Language] ?? PERCENTILE_LINE.en).replace('{p}', String(p))
}
