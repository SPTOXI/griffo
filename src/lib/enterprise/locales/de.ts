import type { EnterpriseLocale } from '../content-types'

export const de: EnterpriseLocale = {
  breadcrumbHome: 'Start',
  landing: {
    metaTitle: 'Griffo Enterprise — KI-Lebenslauf-Matching für Recruiting-Teams',
    metaDescription:
      'Finden Sie den richtigen Kandidaten — intern oder extern — mit derselben KI-Kompatibilitäts-Engine, die auch GriffoWork antreibt. Für Recruiter und HR-Teams, die über Einstellung und interne Mobilität entscheiden.',
    keywords: [
      'griffo enterprise',
      'ki-lebenslauf-matching für recruiter',
      'software für kandidaten-job-matching',
      'software für interne mobilität',
      'ki für externes recruiting',
      'hr-tech mit ki',
    ],
    eyebrow: 'Griffo Enterprise',
    title: 'Finden Sie den richtigen Kandidaten — intern oder extern',
    subtitle:
      'Griffo Enterprise nutzt dieselbe KI-Engine für Lebenslauf-Job-Kompatibilität wie GriffoWork auf Ihrer eigenen Recruiting-Pipeline — zuerst wird das interne Team geprüft, dann die registrierten Bewerber, bevor der breitere Griffo-Kandidatenpool einbezogen wird. Jeder Treffer zeigt genau, woher er stammt.',
    useCases: [
      {
        title: 'Externes Recruiting',
        body: 'Bewerten Sie jeden Bewerber automatisch gegen die Stelle, mit Ranking und Begründung — nicht nur ein Keyword-Abgleich.',
      },
      {
        title: 'Interne Mobilität',
        body: 'Finden Sie Mitarbeitende, die bereits zu einer neuen Stelle passen, bevor Sie extern suchen — anhand des Profils, das sie bereits bei Griffo pflegen.',
      },
    ],
    ctaLabel: 'Vertrieb kontaktieren',
    faqs: [
      {
        question: 'Was ist KI-basiertes Lebenslauf-Job-Matching?',
        answer:
          'Es ist dieselbe Kompatibilitäts-Engine, die auch GriffoWork antreibt, angewendet auf Ihre Recruiting-Pipeline: Ein KI-Modell liest das berufliche Profil eines Kandidaten und eine Stellenausschreibung und bewertet die Passung anhand von Berufserfahrung, stellenspezifischen Anforderungen und Kontext — statt nur nach übereinstimmenden Schlagwörtern zu suchen.',
      },
      {
        question: 'Wie wird die Kompatibilität zwischen Kandidat und Stelle gemessen?',
        answer:
          'Jeder Treffer wird anhand derselben Dimensionen aufgeschlüsselt, die GriffoWork bereits für Kandidaten nutzt — beruflicher Werdegang, Passung zur konkreten Stelle und kontextuelle Eignung —, sodass ein Recruiter nicht nur den Score sieht, sondern auch, warum er zustande kam.',
      },
      {
        question: 'Was ist hier der Unterschied zwischen externem Recruiting und interner Mobilität?',
        answer:
          'Dieselbe Matching-Engine, aber unterschiedliche Kandidatenquelle. Externes Recruiting bewertet Personen, die sich von außerhalb des Unternehmens auf eine Stelle bewerben. Interne Mobilität bewertet Ihre eigenen Mitarbeitenden — mit deren Einwilligung — gegen neue Stellen, bevor extern gesucht wird.',
      },
      {
        question: 'Ersetzt Griffo Enterprise unser bestehendes ATS?',
        answer:
          'Nein — es legt die Matching- und Bewertungsschicht über Bewerbungen, egal ob diese über Ihre eigenen Stellenausschreibungen oder eine bestehende Pipeline eingehen. Es ist so konzipiert, dass es neben Ihrem bisherigen Bewerbertracking besteht, nicht dieses ersetzt.',
      },
      {
        question: 'Wie werden Mitarbeiterdaten bei der internen Mobilität behandelt?',
        answer:
          'Das Profil eines Mitarbeitenden wird für internes Matching erst genutzt, nachdem er explizit für dieses konkrete Unternehmen zugestimmt hat — eine gesonderte Einwilligung, getrennt von jeder öffentlichen Kandidatensichtbarkeit, und jeweils auf eine Organisation begrenzt.',
      },
    ],
  },
  externalRecruitment: {
    metaTitle: 'KI-Kandidaten-Matching für externes Recruiting | Griffo Enterprise',
    metaDescription:
      'Bewerten und ranken Sie automatisch jeden Bewerber mit der KI-Engine von Griffo Enterprise für Lebenslauf-Job-Matching — für Teams, die extern rekrutieren.',
    keywords: [
      'ki für externes recruiting',
      'software für kandidaten-ranking',
      'ki-gestütztes bewerbermanagement',
      'ki-lebenslauf-screening',
      'job-matching-software für recruiter',
    ],
    eyebrow: 'Externes Recruiting',
    title: 'Ranken Sie jeden Bewerber nach echter Passung, nicht nach Keywords',
    subtitle:
      'Griffo Enterprise bewertet jeden Kandidaten gegen Ihre Stellenausschreibung mit derselben KI-Kompatibilitäts-Engine wie GriffoWork — Ihr Team prüft eine gerankte Shortlist statt eines Ordners voller Lebensläufe.',
    points: [
      {
        title: 'Automatische Bewertung bei jeder Bewerbung',
        body: 'Jede Bewerbung wird sofort mit der Stelle abgeglichen — ein Match-Score von 0 bis 100, erklärt anhand derselben fachlichen, stellenbezogenen und kontextuellen Dimensionen, die GriffoWork bereits für Kandidaten nutzt.',
      },
      {
        title: 'Eine Kaskade, kein einzelner Pool',
        body: 'Bevor extern gesucht wird, prüft Griffo Enterprise zuerst das eigene Team und die registrierten Bewerber — die externe Suche ist die dritte Quelle, nicht die erste, und jeder Vorschlag ist mit seiner Herkunft gekennzeichnet.',
      },
      {
        title: 'Kein neues Lebenslaufformat zu lernen',
        body: 'Nutzt dieselbe Profilextraktion, die GriffoWork bereits für Kandidaten durchführt — ein einmal hochgeladener Lebenslauf wird gegen jede offene Stelle bewertet.',
      },
    ],
    ctaLabel: 'Vertrieb kontaktieren',
  },
  internalMobility: {
    metaTitle: 'Software für interne Mobilität mit KI-Matching | Griffo Enterprise',
    metaDescription:
      'Finden Sie interne Kandidaten für neue Stellen automatisch mit Griffo Enterprise — KI-gestützte interne Mobilität auf derselben Engine wie GriffoWork.',
    keywords: [
      'software für interne mobilität',
      'interner talentmarktplatz',
      'software für interne mitarbeiterversetzung',
      'ki-gestützte interne mobilität',
      'talent-mobilitätsplattform',
    ],
    eyebrow: 'Interne Mobilität',
    title: 'Finden Sie Ihre nächste Besetzung zuerst im eigenen Unternehmen',
    subtitle:
      'Griffo Enterprise durchsucht Ihr eigenes Team nach Passung, bevor Sie eine Stelle extern ausschreiben — anhand des Profils, das Mitarbeitende bereits bei Griffo pflegen, mit deren Einwilligung.',
    points: [
      {
        title: 'Mitarbeitende pflegen ein einziges Profil',
        body: 'Kein zweiter Lebenslauf nötig: Das bestehende GriffoWork-Profil des Mitarbeitenden wird gegen neue interne Stellen abgeglichen.',
      },
      {
        title: 'Einwilligung pro Unternehmen begrenzt',
        body: 'Das Profil eines Mitarbeitenden ist erst nach expliziter Einwilligung für diese konkrete Organisation für internes Matching sichtbar — getrennt von jeder öffentlichen Kandidatensichtbarkeit.',
      },
      {
        title: 'Interne Passung wird immer zuerst angezeigt',
        body: 'Bei einer neuen Stellenausschreibung prüft der Matching-Agent zuerst das interne Team, bevor registrierte Bewerber oder der breitere Griffo-Pool berücksichtigt werden.',
      },
    ],
    ctaLabel: 'Vertrieb kontaktieren',
  },
}
