import type { AtsLocale } from '../content-types'

/**
 * Guias de ATS em alemão.
 *
 * Os 5 globais mais o Personio, que é o ATS dominante no eixo DACH
 * (Alemanha, Áustria, Suíça) e por isso só existe aqui.
 */
export const atsDe: AtsLocale = {
  workday: {
    marketName: 'USA, Europa & globale Konzerne',
    description:
      'Workday ist der Unternehmensstandard bei einem Großteil der Fortune 500 und großen internationalen Konzernen. Es gilt als einer der strengsten und am stärksten standardisierten Parser im HR-Softwaremarkt.',
    marketShare: 'Von mehr als 50 % der Fortune-500-Konzerne eingesetzt.',
    howItWorks: [
      {
        title: 'Strukturierte Feldzuordnung',
        description:
          'Workday zerlegt den Lebenslauf in vordefinierte Felder: Unternehmen, Position, Zeitraum und Aufgaben. Jede Formatabweichung führt dazu, dass Daten beim Screening verloren gehen.',
      },
      {
        title: 'Screening nach internationalen Vorgaben',
        description:
          'Filtert Bewerbungen anhand globaler arbeitsrechtlicher Vorgaben und erwartet einen klar nachvollziehbaren Karriereverlauf samt Senioritätsstufen.',
      },
      {
        title: 'Prüfung von Kennzahlen und Anforderungen',
        description:
          'Das System bevorzugt Profile mit messbarer Wirkung, die zu den in der Stellenanforderung genannten Kompetenzen passt.',
      },
    ],
    eliminationFactors: [
      'Unübliche Formate und Layouts, die das automatische Befüllen der Felder zerstören.',
      'Widersprüchliche Datumsangaben, die die Berechnung der Berufsjahre verhindern.',
      'Positionsbezeichnungen ohne klaren Bezug zu internationalen Marktstandards.',
    ],
    howGriffoWorkHelps: [
      'Stellt sicher, dass der Workday-Parser die Struktur Ihres Lebenslaufs fehlerfrei liest.',
      'Prüft die Übereinstimmung mit internationalen Einstellungsstandards (USA, Europa, global).',
      'Analysiert die Dichte von Kennzahlen und Erfolgen im Hinblick auf die Konzernfilter des Systems.',
      'Erstellt ein auf die Stelle zugeschnittenes Anschreiben.',
    ],
    faqs: [
      {
        question: 'Warum ist Workday so anspruchsvoll?',
        answer:
          'Da Konzerne pro Stelle Tausende Bewerbungen erhalten, arbeitet Workday mit strukturierten Kriterien und sortiert Lebensläufe mit unklarer Formatierung oder schwer einzuordnenden Angaben aus.',
      },
      {
        question: 'Wie bereitet GriffoWork mein Profil auf Workday vor?',
        answer:
          'GriffoWork prüft chronologische Klarheit, Formatierung und das Vorhandensein aussagekräftiger Kennzahlen, damit Workday Ihren Werdegang sauber ausliest.',
      },
    ],
  },
  greenhouse: {
    marketName: 'Globale Tech-Branche, Startups & Scaleups',
    description:
      'Greenhouse ist die meistgenutzte Recruiting-Plattform im globalen Technologieumfeld, bei schnell wachsenden Startups und Unicorns — mit Fokus auf kompetenzbasierte, nachweisorientierte Einstellungen.',
    marketShare: 'Führend bei Technologie- und Innovationsunternehmen in den USA, Europa und Lateinamerika.',
    howItWorks: [
      {
        title: 'Kompetenz-Scorecards',
        description:
          'Bewertet Kandidaten anhand spezifischer Scorecards für Fachkompetenzen, Tools und Führung.',
      },
      {
        title: 'Anbindung von Portfolios und Profilen',
        description:
          'Verknüpft Angaben aus dem Lebenslauf mit beruflichen Links (LinkedIn, GitHub, Portfolios) für die Prüfung durch das Fachteam.',
      },
    ],
    eliminationFactors: [
      'Allgemein gehaltene Lebensläufe ohne Beleg für den praktischen Umgang mit Tools und Frameworks.',
      'Fehlende konkrete Ergebnisse aus früheren Positionen.',
      'Kein erkennbarer Zusammenhang zwischen Projekten und geschäftlicher Wirkung.',
    ],
    howGriffoWorkHelps: [
      'Ermittelt, wie gut Ihre Fachkompetenzen und Methoden zur Stelle passen.',
      'Prüft Ihre beruflichen Profile auf Konsistenz mit dem Lebenslauf.',
      'Bewertet Wirkung und Klarheit anhand der Scorecard-Kriterien der Recruiter.',
    ],
    faqs: [
      {
        question: 'Warum ist Greenhouse in der Tech-Branche so verbreitet?',
        answer:
          'Weil Engineering- und Produktteams damit Kompetenzen strukturiert und gemeinsam bewerten können, was Verzerrungen in der ersten Screening-Runde reduziert.',
      },
      {
        question: 'Deckt GriffoWork auch internationale Remote-Stellen in Greenhouse ab?',
        answer:
          'Ja. GriffoWork passt die Analyse an globale Prozesse und internationale Anforderungen an.',
      },
    ],
  },
  lever: {
    marketName: 'Scaleups & Big Tech',
    description:
      'Lever verbindet Bewerbermanagement (ATS) mit Talent-Relationship-Management (CRM). Recruiting-Teams können damit Kandidaten fortlaufend aus der eigenen Datenbank ansprechen und qualifizieren.',
    marketShare: 'Weit verbreitet bei mittleren und großen Technologieunternehmen.',
    howItWorks: [
      {
        title: 'Fortlaufende Talent-Indexierung',
        description:
          'Speichert und indexiert den vollständigen Werdegang, um ihn mit aktuellen und künftigen Stellen abzugleichen.',
      },
      {
        title: 'Semantische Kompetenzsuche',
        description:
          'Recruiter filtern Kandidaten über detaillierte semantische Suchen nach Tools, Positionen und Ausbildung.',
      },
    ],
    eliminationFactors: [
      'Fehlende Fachbegriffe, sodass das System das Profil bei thematischen Suchen nie findet.',
      'Vage Beschreibungen, die die Tiefe der Kenntnisse nicht erkennen lassen.',
    ],
    howGriffoWorkHelps: [
      'Sorgt dafür, dass die entscheidenden Schlüsselwörter vorhanden sind, damit Ihr Lebenslauf in Lever-Suchen auftaucht.',
      'Schärft Ihre Positionierung, damit das Profil im Talentpool langfristig wirkt.',
    ],
    faqs: [
      {
        question: 'Wie funktioniert der Talentpool von Lever?',
        answer:
          'Lever hält archivierte Profile durchsuchbar. Ein Lebenslauf mit hoher Dichte relevanter Begriffe wird auch für neue Stellen weiterhin gefunden.',
      },
    ],
  },
  taleo: {
    marketName: 'Banken, Behörden & Großkonzerne',
    description:
      'Oracle Taleo gehört zu den etabliertesten Recruiting-Systemen weltweit und wird vor allem im Finanzsektor, in der Öl- und Gasindustrie, in der Telekommunikation und im öffentlichen Dienst eingesetzt.',
    marketShare: 'Starke Präsenz in traditionellen Konzernen und globalen Finanzinstituten.',
    howItWorks: [
      {
        title: 'Klassische Screening-Filter',
        description:
          'Wendet strukturierte Screening-Regeln nach formalen Positionsbezeichnungen, Betriebszugehörigkeit und Bildungsabschlüssen an.',
      },
    ],
    eliminationFactors: [
      'Unübliche Abschnittsüberschriften, die der ältere Parser nicht einordnen kann.',
      'Grafische Elemente, die die Informationshierarchie zerstören.',
    ],
    howGriffoWorkHelps: [
      'Prüft die formale Struktur des Lebenslaufs auf Kompatibilität mit dem Taleo-Parser.',
      'Kontrolliert Datums-, Positions- und Abschnittskonventionen, wie traditionelle Konzerne sie erwarten.',
    ],
    faqs: [
      {
        question: 'Wird Oracle Taleo noch häufig eingesetzt?',
        answer:
          'Ja, insbesondere bei großen Banken, Industriegruppen und Konzernen, die weltweit Tausende Mitarbeitende verwalten.',
      },
    ],
  },
  ashby: {
    marketName: 'Globale Startups & KI-Scaleups',
    description:
      'Ashby ist eine moderne Recruiting-Plattform, die bei innovativen Technologie- und KI-Unternehmen schnell wächst — aufgebaut auf intelligenter Automatisierung und Analytics.',
    marketShare: 'Schnell wachsend bei Technologie- und KI-Scaleups.',
    howItWorks: [
      {
        title: 'Schnelles Screening und KI-Zusammenfassungen',
        description:
          'Erstellt analytische Zusammenfassungen, damit Recruiter Wirkung und Senioritätsgrad eines Profils rasch einschätzen können.',
      },
    ],
    eliminationFactors: [
      'Lange, unfokussierte Lebensläufe, in denen die wichtigsten technischen Erfolge untergehen.',
    ],
    howGriffoWorkHelps: [
      'Prüft die Kurzzusammenfassung Ihres Lebenslaufs auf schnelle Lesbarkeit und Wirkung.',
      'Hebt komplexe Projekte und technische Führung für die Ashby-Filter hervor.',
    ],
    faqs: [
      {
        question: 'Was unterscheidet Ashby von anderen Systemen?',
        answer:
          'Ashby bietet analytische Dashboards und automatische Zusammenfassungen, die knappe, ergebnisorientierte Lebensläufe belohnen.',
      },
    ],
  },
  personio: {
    marketName: 'Deutschland, Österreich, Schweiz & Europa',
    description:
      'Personio ist die führende HR- und Recruiting-Plattform für kleine und mittlere Unternehmen in Europa, mit besonders starker Verbreitung in der DACH-Region.',
    marketShare: 'Führend bei KMU und wachsenden Unternehmen in der Europäischen Union.',
    howItWorks: [
      {
        title: 'Verarbeitung nach europäischem Standard',
        description:
          'Verarbeitet mehrsprachige Bewerbungen (Deutsch und Englisch) und prüft dabei die chronologische Stimmigkeit des Werdegangs.',
      },
    ],
    eliminationFactors: [
      'Aufbau, der nicht zu den üblichen Bewerbungsformaten des europäischen Marktes passt.',
    ],
    howGriffoWorkHelps: [
      'Passt den Aufbau des Lebenslaufs an europäische Standards und Erwartungen an.',
      'Sorgt für saubere Angaben und einen klar nachvollziehbaren Werdegang für Personio-Nutzer.',
    ],
    faqs: [
      {
        question: 'Verarbeitet Personio Lebensläufe auf Deutsch und Englisch?',
        answer:
          'Ja. Die Plattform verarbeitet beide Sprachen, je nach Anforderung der Stelle und Einstellungsland.',
      },
    ],
  },
}
