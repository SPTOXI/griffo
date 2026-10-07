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
  smartrecruiters: {
    marketName: "Mittelständische und große Arbeitgeber mit internationaler Ausrichtung",
    description:
      "SmartRecruiters ist eine Recruiting-Plattform, mit der mittelständische und große Arbeitgeber Stellen veröffentlichen, Bewerbungen sammeln und Kandidaten in einer Pipeline verwalten. Der Lebenslauf wird in ein Kandidatenprofil umgewandelt, das Recruiter durchsuchen, filtern und vergleichen.",
    marketShare: "Weit verbreitet bei internationalen mittelständischen und großen Arbeitgebern.",
    howItWorks: [
      {
        title: "Lebenslauf wird zum Profil",
        description:
          "Das System liest Ihre Datei und erstellt ein strukturiertes Profil aus Kontaktdaten, Berufserfahrung, Ausbildung und Kenntnissen. Was nicht als Text lesbar ist, erreicht den Recruiter unter Umständen nie.",
      },
      {
        title: "Fragen im Bewerbungsformular",
        description:
          "Arbeitgeber können Vorauswahlfragen ergänzen, etwa zu Arbeitserlaubnis, Standort oder geforderter Erfahrung. Recruiter filtern damit die Kandidatenliste.",
      },
      {
        title: "Bewertung im Team",
        description:
          "Recruiter und Fachbereiche vergleichen Profile nebeneinander. Eine klare, schnell erfassbare Zusammenfassung und messbare Ergebnisse erleichtern den Vergleich.",
      },
    ],
    eliminationFactors: [
      "Mehrspaltige Layouts, Tabellen oder Textfelder, die die Lesereihenfolge Ihres Werdegangs durcheinanderbringen.",
      "Kontaktdaten oder wichtige Kenntnisse in Kopf- oder Fußzeilen oder in Bildern, die Parser häufig überspringen.",
      "Formulierungen, die sich nicht an der Stellenanzeige orientieren und Suche und Filter schwächen.",
    ],
    howGriffoWorkHelps: [
      "Prüft, ob ein typischer Parser Ihren Lebenslauf als sauberen Text in der richtigen Reihenfolge liest.",
      "Vergleicht Ihre Kenntnisse und Formulierungen mit der Stellenanzeige, um fehlende Schlüsselbegriffe zu finden.",
      "Bewertet, wie klar Erfolge und Kennzahlen hervortreten, wenn Recruiter Profile vergleichen.",
      "Erstellt ein auf die Stelle zugeschnittenes Anschreiben.",
    ],
    faqs: [
      {
        question: "Sortiert SmartRecruiters meinen Lebenslauf automatisch aus?",
        answer:
          "Das hängt davon ab, wie das Unternehmen die Stelle eingerichtet hat. Viele nutzen Fragen und Filter, den Rest entscheiden Recruiter. Ein Lebenslauf, den der Parser nicht sauber liest, wird leichter übersehen, deshalb zählt ein klares Layout.",
      },
      {
        question: "Welches Dateiformat ist am besten?",
        answer:
          "Halten Sie sich an das Format, das der Arbeitgeber verlangt. Ist es offen, sind ein PDF mit auswählbarem Text oder ein einfaches einspaltiges .docx die sicherste Wahl.",
      },
    ],
  },
  successfactors: {
    marketName: "Konzerne und große internationale Unternehmen",
    description:
      "SAP SuccessFactors Recruiting ist das Recruiting-Modul der HR-Suite von SAP. Große Organisationen nutzen es für strukturierte, auf Compliance ausgerichtete Bewerbungsprozesse, bei denen der Lebenslauf zusammen mit dem Bewerbungsformular das Kandidatenprofil speist.",
    marketShare: "Häufige Wahl bei großen Konzernen, die bereits SAP einsetzen.",
    howItWorks: [
      {
        title: "Strukturiertes Bewerbungsformular",
        description:
          "Kandidaten füllen meist ein ausführliches Formular im Karriereportal aus, der Lebenslauf wird angehängt oder ausgelesen, um Teile des Profils zu befüllen. Angaben, die vom Lebenslauf abweichen, fallen auf.",
      },
      {
        title: "Vorauswahlfragen",
        description:
          "Arbeitgeber können pro Stelle Fragen festlegen, etwa zu Zertifikaten, Sprachen oder Verfügbarkeit, mit denen Recruiter den Bewerberkreis eingrenzen.",
      },
      {
        title: "Prozess und Compliance",
        description:
          "Bewerbungen durchlaufen definierte Phasen, die dokumentiert werden. Vollständige, konsistente Daten und Positionsbezeichnungen helfen Ihrem Werdegang, der Prüfung standzuhalten.",
      },
    ],
    eliminationFactors: [
      "Fehlende, überlappende oder zwischen Formular und Lebenslauf abweichende Beschäftigungszeiten.",
      "Positionsbezeichnungen und Aufgaben, die sich nicht klar den Anforderungen der Stelle zuordnen lassen.",
      "Dekorative Gestaltung, die Text vor dem Parser verbirgt oder die Reihenfolge Ihres Werdegangs stört.",
    ],
    howGriffoWorkHelps: [
      "Prüft, ob Daten, Positionen und Abschnitte zwischen Lebenslauf und Formular konsistent bleiben.",
      "Gleicht Ihre Erfahrung mit den Anforderungen der Stellenanzeige ab.",
      "Bewertet Klarheit und messbare Wirkung für die Vorauswahl in Großunternehmen.",
      "Erstellt ein auf die Stelle zugeschnittenes Anschreiben.",
    ],
    faqs: [
      {
        question: "Muss mein Lebenslauf exakt zum Formular passen?",
        answer:
          "Ja. Recruiter sehen beides, und Abweichungen bei Daten, Positionen oder Arbeitgebern werfen Fragen auf. Halten Sie beide konsistent.",
      },
      {
        question: "Nutzen nur sehr große Unternehmen SuccessFactors?",
        answer:
          "Es ist vor allem in großen Organisationen verbreitet, weshalb Prozesse oft formal und gut dokumentiert sind. Kleinere Unternehmen setzen es seltener ein.",
      },
    ],
  },
  workable: {
    marketName: "Wachsende und mittelständische Unternehmen weltweit",
    description:
      "Workable ist eine Recruiting-Plattform, mit der wachsende und mittelständische Unternehmen Stellen auf mehreren Portalen ausschreiben, Bewerbungen zentral empfangen und Kandidaten einordnen. Jeder Lebenslauf wird in ein Profil übersetzt, und KI-gestützte Funktionen helfen Recruitern bei der Vorauswahl.",
    marketShare: "Beliebt bei kleinen und mittleren Unternehmen mit internationaler Personalsuche.",
    howItWorks: [
      {
        title: "Auslesen des Lebenslaufs",
        description:
          "Workable entnimmt der hochgeladenen Datei Berufserfahrung, Ausbildung und Kenntnisse. Text, den es nicht lesen kann, etwa Inhalte in Bildern, fehlt im Profil.",
      },
      {
        title: "Vorauswahlfragen",
        description:
          "Unternehmen ergänzen häufig Fragen im Bewerbungsformular, deren Antworten Recruitern helfen, Kandidaten schnell zu sortieren.",
      },
      {
        title: "KI-gestützte Vorauswahl",
        description:
          "Die Plattform bietet Funktionen, mit denen Recruiter Kandidaten für die Stelle einordnen und in die engere Wahl nehmen. Kenntnisse und Begriffe in Ihrem Lebenslauf sind daher wichtig.",
      },
    ],
    eliminationFactors: [
      "Informationen in Bildern, Grafiken oder Skill-Balken, die der Parser nicht lesen kann.",
      "Ein Profil, das die in der Stellenanzeige verlangten Werkzeuge und Kenntnisse nie nennt.",
      "Sehr lange Dokumente, in denen die relevanteste Erfahrung untergeht.",
    ],
    howGriffoWorkHelps: [
      "Prüft, ob Ihr Lebenslauf als einfacher Text lesbar ist, ohne versteckte Inhalte.",
      "Findet Kenntnisse und Begriffe aus der Stellenanzeige, die Ihr Lebenslauf nicht erwähnt.",
      "Bewertet, ob Ihre relevanteste Erfahrung leicht zu finden ist.",
      "Erstellt ein auf die Stelle zugeschnittenes Anschreiben.",
    ],
    faqs: [
      {
        question: "Nutzt Workable KI, um Lebensläufe zu bewerten?",
        answer:
          "Es bietet KI-gestützte Funktionen, die Unternehmen bei der Vorauswahl einsetzen können. Wie stark sie sich darauf stützen, entscheidet jedes Unternehmen selbst. Schreiben Sie deshalb für einen Parser und für einen Menschen.",
      },
      {
        question: "Brauche ich die Schlüsselbegriffe der Stellenanzeige?",
        answer:
          "Ja, sofern sie zutreffen. Mit denselben Begriffen wie in der Anzeige lässt sich Ihre Erfahrung leichter finden und vergleichen.",
      },
    ],
  },
  teamtailor: {
    marketName: "Nordeuropa, Europa & Teams mit Fokus auf Arbeitgebermarke",
    description:
      "Teamtailor ist eine schwedische Recruiting-Plattform, die ein Bewerbermanagementsystem mit einer Karriereseite im eigenen Markenauftritt verbindet. Arbeitgeber veröffentlichen damit Stellen, empfangen Bewerbungen und führen Kandidaten durch eine visuelle Pipeline.",
    marketShare: "Beliebt bei Unternehmen in den nordischen Ländern und in ganz Europa.",
    howItWorks: [
      {
        title: "Bewerbung über die Karriereseite",
        description:
          "Kandidaten bewerben sich meist über die Karriereseite des Arbeitgebers. Lebenslauf und einige Formularfelder bilden das Kandidatenprofil.",
      },
      {
        title: "Visuelle Pipeline",
        description:
          "Recruiter schieben Kandidaten durch Phasen und überfliegen Profile oft schnell. Der Anfang Ihres Lebenslaufs muss Ihre stärksten Punkte enthalten.",
      },
      {
        title: "Zusammenarbeit im Team",
        description:
          "Einstellungsteams kommentieren Kandidaten gemeinsam. Das begünstigt Lebensläufe, die sich in ein bis zwei Sätzen zusammenfassen lassen.",
      },
    ],
    eliminationFactors: [
      "Ein Lebenslauf, bei dem die relevante Erfahrung erst nach langem Lesen sichtbar wird.",
      "Layouts mit Spalten oder Grafiken, die das ausgelesene Profil unvollständig machen.",
      "Kontaktdaten und Links in Kopfzeilen oder Bildern.",
    ],
    howGriffoWorkHelps: [
      "Prüft, ob Ihr Lebenslauf sauber gelesen wird und wichtige Angaben das Auslesen überstehen.",
      "Bewertet die ersten Zeilen Ihres Lebenslaufs auf Klarheit und Wirkung.",
      "Vergleicht Ihre Formulierungen mit der Stellenanzeige und zeigt fehlende Begriffe.",
      "Erstellt ein auf die Stelle zugeschnittenes Anschreiben.",
    ],
    faqs: [
      {
        question: "Liest Teamtailor Lebensläufe auf Schwedisch und Englisch?",
        answer:
          "Arbeitgeber erhalten Bewerbungen in der Sprache, in der der Kandidat sie einreicht. Schreiben Sie in der Sprache der Stellenanzeige und halten Sie Abschnittsüberschriften schlicht.",
      },
      {
        question: "Wie wichtig ist der Anfang meines Lebenslaufs?",
        answer:
          "Sehr. Recruiter prüfen in der Pipeline oft viele Kandidaten, also stellen Sie Ihre relevanteste Station und Ihre Ergebnisse an den Anfang.",
      },
    ],
  },
}
