import type { AtsLocale } from '../content-types'

/**
 * Guias de ATS em alemão.
 *
 * Os 5 globais mais o Personio, que é o ATS dominante no eixo DACH
 * (Alemanha, Áustria, Suíça) e por isso só existe aqui.
 */
export const atsDe: AtsLocale = {
  workday: {
    marketName: "Große Arbeitgeber und globale Organisationen",
    description:
      "Workday ist eine Unternehmensplattform für HR und Finanzen. Die Talent-Acquisition-Software unterstützt große Arbeitgeber bei Stellenausschreibungen, Bewerbungen und Kandidaten.",
    marketShare: "Workday gibt an, dass mehr als 60% der Fortune 500 die Plattform nutzen.",
    howItWorks: [
      {
        title: "Kandidatenprofil",
        description:
          "Aus Bewerbungen entsteht ein Profil mit Angaben wie Arbeitgeber, Position, Zeiträumen und Aufgaben. Klare, konsistente Einträge machen dieses Profil leichter les- und vergleichbar.",
      },
      {
        title: "Anforderungen der Stelle",
        description:
          "Recruiter vergleichen Kandidaten mit den Anforderungen der Stelle, daher helfen Belege für die genannten Kenntnisse und messbare Ergebnisse.",
      },
    ],
    eliminationFactors: [
      "Layouts, die Positionen und Zeiträume als Text schwer lesbar machen.",
      "Fehlende oder widersprüchliche Zeiträume, die Ihre Berufsdauer unklar lassen.",
      "Positionen und Kenntnisse, die nie die Wortwahl der Stelle aufgreifen.",
    ],
    howGriffoWorkHelps: [
      "Prüft, ob Ihr Lebenslauf als sauberer Text mit Positionen und Zeiträumen in der richtigen Reihenfolge gelesen wird.",
      "Gleicht Ihre Erfahrung mit den Anforderungen der Stellenanzeige ab.",
      "Bewertet Klarheit und messbare Ergebnisse.",
      "Erstellt ein auf die Stelle zugeschnittenes Anschreiben.",
    ],
    faqs: [
      {
        question: "Sortiert Workday Lebensläufe automatisch aus?",
        answer:
          "Das hängt davon ab, wie das Unternehmen seinen Prozess eingerichtet hat; Workday unterstützt Recruiter bei Verwaltung und Prüfung der Kandidaten. Klare Positionen, Zeiträume und Ergebnisse machen Ihr Profil für Menschen und Systeme leichter lesbar.",
      },
      {
        question: "Wie bereitet GriffoWork mein Profil auf Workday vor?",
        answer:
          "GriffoWork prüft chronologische Klarheit, Formatierung und messbare Ergebnisse, damit Ihr Werdegang sauber gelesen wird.",
      },
    ],
  },
  greenhouse: {
    marketName: "Arbeitgeber mit strukturierten Auswahlprozessen",
    description:
      "Greenhouse ist eine Recruiting-Plattform, die Sourcing, Interviews und Bewerbermanagement verbindet. Sie baut auf strukturierten Interviews auf, mit Fragen und Bewertungskriterien, die jedes Team selbst festlegt.",
    marketShare: "Greenhouse gibt an, dass Tausende Arbeitgeber die Plattform nutzen.",
    howItWorks: [
      {
        title: "Strukturierte Bewertung",
        description:
          "Teams legen für jede Stelle Fragen und Bewertungsbögen fest, und Interviewer beurteilen Kandidaten nach denselben Kriterien.",
      },
      {
        title: "Kontext aus Lebenslauf und Profil",
        description:
          "Ihr Lebenslauf und Links, die Sie teilen, etwa zu Portfolio oder LinkedIn, geben dem Team vor den Interviews Kontext.",
      },
    ],
    eliminationFactors: [
      "Allgemeine Lebensläufe, die keinen praktischen Umgang mit den geforderten Werkzeugen zeigen.",
      "Keine konkreten Ergebnisse aus früheren Positionen.",
      "Kein klarer Zusammenhang zwischen Projekten und Geschäftswirkung.",
    ],
    howGriffoWorkHelps: [
      "Zeigt, wie gut Ihre Kenntnisse und Methoden zur Stelle passen.",
      "Prüft, ob Ihre beruflichen Profile zum Lebenslauf passen.",
      "Bewertet Wirkung und Klarheit anhand typischer Bewertungskriterien.",
    ],
    faqs: [
      {
        question: "Wie bewertet Greenhouse Kandidaten?",
        answer:
          "Greenhouse beschreibt strukturierte Interviews, bei denen Teams eigene Fragen und eine Bewertungsrubrik nutzen, mit Bewertungsbögen für das Feedback. Ein Lebenslauf mit klaren Belegen für jede Anforderung hilft Ihrer Geschichte, zu überzeugen.",
      },
      {
        question: "Eignet sich GriffoWork für Remote-Stellen bei Greenhouse?",
        answer:
          "GriffoWork vergleicht Ihren Lebenslauf mit der Stellenanzeige, auf die Sie sich bewerben, unabhängig vom Standort.",
      },
    ],
  },
  lever: {
    marketName: "Arbeitgeber aus vielen Branchen",
    description:
      "Lever ist eine Recruiting-Plattform mit Bewerbermanagement und KI-Funktionen. Auf der Website hebt Lever die Automatisierung von Verwaltung und Terminplanung sowie KI-Empfehlungen mit Kontext hervor.",
    marketShare: "Lever gibt an, Tausende Kunden in mehr als 20 Branchen zu betreuen.",
    howItWorks: [
      {
        title: "Automatisierung",
        description:
          "Verwaltung, Terminplanung und Nachfassen laufen automatisiert, damit das Recruiting-Team seine Zeit für Einstellungsentscheidungen nutzt.",
      },
      {
        title: "KI-Empfehlungen",
        description:
          "Lever sagt, die KI zeige zuerst die am besten passenden Kandidaten, jeweils mit Kontext; ein Lebenslauf, der die Anforderungen der Stelle klar zeigt, lässt sich leichter einordnen.",
      },
    ],
    eliminationFactors: [
      "Fehlende Begriffe aus der Stellenanzeige, die Ihre Eignung schwerer erkennbar machen.",
      "Vage Beschreibungen, die die Tiefe Ihrer Erfahrung nicht vermitteln.",
    ],
    howGriffoWorkHelps: [
      "Prüft, ob die geforderten Schlüsselbegriffe in Ihrem Lebenslauf stehen.",
      "Schärft Ihr Profil, damit Ihre Eignung leicht erkennbar ist.",
    ],
    faqs: [
      {
        question: "Nutzt Lever KI, um Kandidaten zu ordnen?",
        answer:
          "Lever beschreibt KI-gestützte Empfehlungen, die die am besten passenden Kandidaten zuerst zeigen, jeweils mit Kontext. Die Einstellungsentscheidung bleibt beim Recruiting-Team.",
      },
    ],
  },
  taleo: {
    marketName: "Große Arbeitgeber",
    description:
      "Oracle Taleo ist eine Talent-Acquisition-Suite für Sourcing, Recruiting und Onboarding. Oracle bietet Taleo Enterprise Edition und Taleo Business Edition an und stellt zugleich Oracle Recruiting als Weg für bestehende Taleo-Kunden vor.",
    marketShare: "Ein etabliertes Oracle-Produkt, das Arbeitgeber für Sourcing und Einstellung nutzen.",
    howItWorks: [
      {
        title: "Vorauswahl und Interviews",
        description:
          "Oracle nennt Werkzeuge für die Kandidatenvorauswahl, die Interviewplanung und das Erstellen von Angeboten. Jeder Arbeitgeber legt selbst fest, was er abfragt und prüft.",
      },
      {
        title: "Karriereseiten und Sourcing",
        description:
          "Karriereseiten im Firmenauftritt, Kampagnen und Empfehlungen bringen Kandidaten ins System, wo Recruiter sie prüfen.",
      },
    ],
    eliminationFactors: [
      "Ungewöhnliche Abschnittsüberschriften oder Grafiken, die das automatische Lesen erschweren können.",
      "Fehlende Zeiträume oder Positionen, die Ihren Werdegang unklar lassen.",
    ],
    howGriffoWorkHelps: [
      "Prüft die Struktur Ihres Lebenslaufs auf sauberes automatisches Lesen.",
      "Kontrolliert Konventionen bei Zeiträumen, Positionen und Abschnitten, die Arbeitgeber häufig erwarten.",
    ],
    faqs: [
      {
        question: "Wird Oracle Taleo noch genutzt?",
        answer:
          "Oracle stellt Taleo weiterhin als Produkt vor und bietet zugleich den Wechsel zu Oracle Recruiting an. Ob ein Arbeitgeber es nutzt, entscheidet dieser selbst.",
      },
    ],
  },
  ashby: {
    marketName: "Von Startups bis Großunternehmen",
    description:
      "Ashby ist eine All-in-one-Recruiting-Plattform, die Bewerbermanagement, Sourcing und CRM, Terminplanung und Analytics mit integrierter KI verbindet.",
    marketShare: "Ashby bietet Tarife für Startups, wachsende Unternehmen und Großunternehmen an.",
    howItWorks: [
      {
        title: "Analytics und KI",
        description:
          "Ashby verbindet Recruiting-Analytics mit KI-Funktionen, damit Teams Kandidaten prüfen und den Prozess steuern können.",
      },
    ],
    eliminationFactors: [
      "Lange, unfokussierte Lebensläufe, die die wichtigsten Erfolge und die erzielte Wirkung verstecken.",
    ],
    howGriffoWorkHelps: [
      "Prüft die Zusammenfassung Ihres Lebenslaufs, damit sie schnell und klar lesbar ist.",
      "Hebt komplexe Projekte und fachliche Führung hervor.",
    ],
    faqs: [
      {
        question: "Was unterscheidet Ashby von anderen Systemen?",
        answer:
          "Ashby versteht sich als All-in-one-Plattform: Bewerbermanagement, Sourcing und CRM, Terminplanung und Analytics mit integrierter KI.",
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
  oraclerecruiting: {
    marketName: "Große Unternehmen und globale Arbeitgeber",
    description:
      "Oracle Recruiting ist das Recruiting-Modul der Cloud-HR-Suite von Oracle, mit dem große Arbeitgeber Karriereseiten betreiben, Bewerbungen sammeln und Kandidaten verwalten. Es ist das Cloud-Pendant zu Taleo innerhalb der Oracle-HCM-Familie und erstellt das Kandidatenprofil aus Lebenslauf und Antworten im Bewerbungsformular.",
    marketShare: "Häufige Wahl bei großen Unternehmen, die bereits Oracle für HR einsetzen.",
    howItWorks: [
      {
        title: "Karriereseite und Kandidatenprofil",
        description:
          "Kandidaten bewerben sich über die Karriereseite des Arbeitgebers. Lebenslauf und Formularantworten werden zu einem Profil zusammengeführt, das Recruiter durchsuchen und filtern.",
      },
      {
        title: "Fragebögen und Vorauswahl",
        description:
          "Arbeitgeber können einer Stelle Fragen zuordnen, etwa zu Zertifikaten, Sprachen oder Verfügbarkeit, und mit den Antworten den Bewerberkreis eingrenzen.",
      },
      {
        title: "Strukturierte Prüfung",
        description:
          "Recruiter und Fachbereiche prüfen Kandidaten in festgelegten Phasen. Konsistente Daten und Positionen sowie klare Ergebnisse helfen Ihrem Profil, standzuhalten.",
      },
    ],
    eliminationFactors: [
      "Layouts, die die Lesereihenfolge Ihres Werdegangs durcheinanderbringen.",
      "Daten oder Positionsbezeichnungen, die zwischen Lebenslauf und Bewerbungsformular abweichen.",
      "Erfahrung, die sich nicht klar auf die Anforderungen der Stelle beziehen lässt.",
    ],
    howGriffoWorkHelps: [
      "Prüft, ob Ihr Lebenslauf als sauberer Text in der richtigen Reihenfolge gelesen wird.",
      "Hält Daten, Positionen und Abschnitte zwischen Lebenslauf und Formular konsistent.",
      "Gleicht Ihre Erfahrung mit den Anforderungen der Stellenanzeige ab.",
      "Erstellt ein auf die Stelle zugeschnittenes Anschreiben.",
    ],
    faqs: [
      {
        question: "Ist Oracle Recruiting dasselbe wie Taleo?",
        answer:
          "Nein. Taleo ist das ältere Recruiting-Produkt von Oracle, Oracle Recruiting das neuere Modul der Cloud-HR-Suite. Unternehmen können beides einsetzen, deshalb gelten dieselben guten Gewohnheiten für beide.",
      },
      {
        question: "Muss der Lebenslauf zu meinen Antworten im Formular passen?",
        answer:
          "Ja. Recruiter sehen beides, und Abweichungen bei Daten, Positionen oder Arbeitgebern werfen Fragen auf. Halten Sie alles konsistent.",
      },
    ],
  },
  recruitee: {
    marketName: "Europa und schnell wachsende Unternehmen mit Team-Recruiting",
    description:
      "Recruitee ist eine kollaborative Recruiting-Plattform aus den Niederlanden, die ein Bewerbermanagementsystem mit dem Aufbau von Karriereseiten und Multiposting verbindet. Teams führen Kandidaten durch eine visuelle Pipeline und besprechen sie gemeinsam.",
    marketShare: "Beliebt bei wachsenden Unternehmen in ganz Europa.",
    howItWorks: [
      {
        title: "Bewerbung über die Karriereseite",
        description:
          "Kandidaten bewerben sich meist über die Karriereseite des Arbeitgebers. Lebenslauf und ein kurzes Formular bilden das Kandidatenprofil.",
      },
      {
        title: "Visuelle Pipeline",
        description:
          "Kandidaten liegen in Pipeline-Phasen, durch die das Team sie schiebt, und Profile werden oft schnell überflogen. Der Anfang Ihres Lebenslaufs hat deshalb das größte Gewicht.",
      },
      {
        title: "Zusammenarbeit im Team",
        description:
          "Mehrere Personen kommentieren denselben Kandidaten, was Lebensläufe begünstigt, die sich in ein bis zwei Sätzen zusammenfassen lassen.",
      },
    ],
    eliminationFactors: [
      "Ein Lebenslauf, bei dem die relevante Erfahrung erst nach langem Lesen sichtbar wird.",
      "Spalten oder Grafiken, die das ausgelesene Profil unvollständig machen.",
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
        question: "Liest Recruitee Lebensläufe in mehreren Sprachen?",
        answer:
          "Arbeitgeber erhalten die Bewerbung in der Sprache, in der Sie sie einreichen. Schreiben Sie in der Sprache der Stellenanzeige und halten Sie Abschnittsüberschriften schlicht.",
      },
      {
        question: "Wie wichtig ist der Anfang meines Lebenslaufs?",
        answer:
          "Sehr. In der Pipeline-Ansicht prüfen Recruiter viele Kandidaten schnell, also stellen Sie Ihre relevanteste Station und Ihre Ergebnisse an den Anfang.",
      },
    ],
  },
  softgarden: {
    marketName: "Deutschland, Österreich, Schweiz & mittelständische Arbeitgeber",
    description:
      "softgarden ist eine Bewerbermanagement-Software aus Deutschland, mit der Arbeitgeber Karriereseiten betreiben, Stellen auf Jobportalen ausschreiben und Bewerbungen im Team bearbeiten. Der Lebenslauf wird zusammen mit den Formularangaben zu einem Bewerberprofil, das Recruiter und Fachbereiche gemeinsam prüfen.",
    marketShare: "Weit verbreitet bei Arbeitgebern im deutschsprachigen Raum.",
    howItWorks: [
      {
        title: "Bewerbung über die Karriereseite",
        description:
          "Bewerber nutzen meist die Karriereseite des Arbeitgebers. Lebenslauf, Anschreiben und Formularfelder werden zu einem Bewerberprofil zusammengeführt.",
      },
      {
        title: "Gemeinsame Bearbeitung",
        description:
          "Personalabteilung und Fachbereich sehen dasselbe Profil und bewerten es nacheinander. Ein klar gegliederter Lebenslauf lässt sich dabei ohne Fachwissen schnell erfassen.",
      },
      {
        title: "KI-Assistenten",
        description:
          "softgarden bietet unter anderem einen KI-Screening-Assistenten. Wie stark ein Unternehmen ihn nutzt, entscheidet es selbst; klare Berufsbezeichnungen und Kenntnisse helfen in jedem Fall.",
      },
    ],
    eliminationFactors: [
      "Mehrspaltige Layouts oder Grafiken, die das ausgelesene Profil unvollständig machen.",
      "Lücken oder unklare Zeiträume im Werdegang, die ohne Erklärung bleiben.",
      "Berufsbezeichnungen und Kenntnisse, die nicht zu den Begriffen der Stellenanzeige passen.",
    ],
    howGriffoWorkHelps: [
      "Prüft, ob Ihr Lebenslauf sauber und in der richtigen Reihenfolge ausgelesen wird.",
      "Bewertet Struktur und Nachvollziehbarkeit Ihres Werdegangs nach deutschem Standard.",
      "Gleicht Ihre Begriffe mit der Stellenanzeige ab und zeigt fehlende Schlüsselbegriffe.",
      "Erstellt ein auf die Stelle zugeschnittenes Anschreiben.",
    ],
    faqs: [
      {
        question: "Wertet softgarden meinen Lebenslauf automatisch aus?",
        answer:
          "Die Software unterstützt die Bearbeitung im Team: Sie sammelt Bewerbungen, liest Angaben aus und macht sie vergleichbar. Über die Auswahl entscheiden Menschen. Ein sauberer, gut lesbarer Lebenslauf hilft dabei trotzdem.",
      },
      {
        question: "Welches Format sollte mein Lebenslauf haben?",
        answer:
          "Halten Sie sich an die Vorgabe der Stellenanzeige. Ist sie offen, sind ein PDF mit auswählbarem Text oder ein einfaches einspaltiges .docx die sicherste Wahl.",
      },
    ],
  },
  join: {
    marketName: "Mittelstand und wachsende Unternehmen im deutschsprachigen Raum",
    description:
      "JOIN ist ein Recruiting-Tool, mit dem Unternehmen Stellenanzeigen auf mehreren Jobportalen gleichzeitig veröffentlichen und die eingehenden Bewerbungen an einem Ort verwalten. Das Team sieht die Bewerber in einer Pipeline, bewertet sie und gibt Rückmeldung.",
    marketShare: "Beliebt bei kleinen und mittleren Unternehmen, die Stellen auf vielen Portalen ausschreiben.",
    howItWorks: [
      {
        title: "Bewerbungen aus vielen Portalen",
        description:
          "Da Stellen auf mehreren Portalen erscheinen, laufen Bewerbungen aus unterschiedlichen Quellen zusammen und landen als Profile in einer gemeinsamen Pipeline.",
      },
      {
        title: "Schnelle Sichtung",
        description:
          "Kleine Teams sichten viele Profile in kurzer Zeit. Die relevantesten Stationen und Ergebnisse sollten deshalb am Anfang stehen.",
      },
      {
        title: "Bewertung im Team",
        description:
          "Mehrere Personen bewerten denselben Bewerber. Ein Lebenslauf, der sich in wenigen Sätzen zusammenfassen lässt, erleichtert die Abstimmung.",
      },
    ],
    eliminationFactors: [
      "Ein Lebenslauf, bei dem die passende Erfahrung erst nach langem Lesen sichtbar wird.",
      "Grafiken, Tabellen oder Textfelder, die das Auslesen der Angaben stören.",
      "Allgemeine Formulierungen, die nie auf die ausgeschriebene Stelle eingehen.",
    ],
    howGriffoWorkHelps: [
      "Prüft, ob Ihr Lebenslauf als sauberer Text gelesen wird, ohne verlorene Angaben.",
      "Bewertet die ersten Zeilen Ihres Lebenslaufs auf Klarheit und Wirkung.",
      "Vergleicht Ihre Formulierungen mit der Stellenanzeige und zeigt fehlende Begriffe.",
      "Erstellt ein auf die Stelle zugeschnittenes Anschreiben.",
    ],
    faqs: [
      {
        question: "Sortiert JOIN Bewerbungen automatisch aus?",
        answer:
          "JOIN sammelt und ordnet Bewerbungen; die Bewertung übernimmt das Team, teils mit Hilfsfunktionen des Systems. Rechnen Sie damit, dass ein Mensch Ihr Profil in kurzer Zeit überfliegt.",
      },
      {
        question: "Soll ich mich auf jedem Portal gleich bewerben?",
        answer:
          "Ja, sinnvoll ist ein einheitlicher, aktueller Lebenslauf. Unterschiedliche Angaben zu Zeiträumen oder Positionen fallen auf, wenn Bewerbungen im selben System zusammenlaufen.",
      },
    ],
  },
  rexx: {
    marketName: "Deutschland, Österreich, Schweiz & Unternehmen jeder Größe",
    description:
      "rexx systems ist ein deutscher Anbieter von HR-Software, dessen Recruiting-Lösung Bewerbermanagement, Multiposting und das Auslesen von Lebensläufen (CV-Parsing) verbindet. Bewerbungen werden als strukturierte Profile geführt, die Personalabteilung und Fachbereiche gemeinsam bearbeiten.",
    marketShare: "Verbreitet bei Arbeitgebern im deutschsprachigen Raum, vom Mittelstand bis zum Konzern.",
    howItWorks: [
      {
        title: "Strukturierte Profile",
        description:
          "Aus Lebenslauf und Formularangaben entsteht ein Bewerberprofil mit Stationen, Ausbildung und Kenntnissen. Was sich nicht als Text auslesen lässt, fehlt im Profil.",
      },
      {
        title: "Prozess mit Beteiligten",
        description:
          "Personalabteilung und Fachbereich sind an der Auswahl beteiligt, deshalb zählen nachvollziehbare, vollständige Angaben.",
      },
      {
        title: "Dokumentierte Schritte",
        description:
          "Auswahlschritte werden festgehalten. Eindeutige Zeiträume und Positionsbezeichnungen machen Ihren Werdegang in jeder Phase leicht prüfbar.",
      },
    ],
    eliminationFactors: [
      "Layouts, die die Lesereihenfolge Ihres Werdegangs durcheinanderbringen.",
      "Fehlende oder widersprüchliche Zeiträume und Positionsbezeichnungen.",
      "Anforderungen der Stelle, die sich im Lebenslauf nicht wiederfinden.",
    ],
    howGriffoWorkHelps: [
      "Prüft, ob Ihr Lebenslauf sauber und in der richtigen Reihenfolge ausgelesen wird.",
      "Hält Zeiträume, Positionen und Abschnitte konsistent und nachvollziehbar.",
      "Gleicht Ihre Erfahrung mit den Anforderungen der Stellenanzeige ab.",
      "Erstellt ein auf die Stelle zugeschnittenes Anschreiben.",
    ],
    faqs: [
      {
        question: "Entscheidet rexx über meine Bewerbung?",
        answer:
          "Nein, die Software unterstützt den Prozess. Die Entscheidung treffen die Beteiligten im Unternehmen. Ein vollständiger, klar strukturierter Lebenslauf erleichtert ihnen die Prüfung.",
      },
      {
        question: "Wie wichtig sind lückenlose Angaben?",
        answer:
          "Sehr. Im dokumentierten Prozess fallen unklare Zeiträume auf. Nennen Sie Stationen mit Monat und Jahr und erklären Sie Lücken kurz.",
      },
    ],
  },
}
