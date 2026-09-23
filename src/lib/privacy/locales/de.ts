import type { PrivacyContent } from '../content-types'

export const de: PrivacyContent = {
  metaTitle: 'Datenschutzerklärung — GriffoWork',
  metaDescription:
    'Wie GriffoWork Ihre Daten erhebt, nutzt, weitergibt und speichert — einschließlich welcher KI-Anbieter Ihren Lebenslauf analysiert, wie lange wir Daten aufbewahren und wie Sie darauf zugreifen, sie exportieren oder löschen können.',
  breadcrumbHome: 'Startseite',
  title: 'Datenschutzerklärung',
  lastUpdatedLabel: 'Zuletzt aktualisiert',
  lastUpdatedValue: 'September 2026',
  intro: [
    'GriffoWork („wir“) bietet Karriere-Intelligence-Werkzeuge: Lebenslaufanalyse, ATS-Kompatibilitätsbewertung, Lebenslauf-Neufassung und Stellenabgleich (Radar). Diese Seite erklärt in klarer Sprache, welche Daten wir dafür erheben, wer sie sonst noch sieht, wie lange wir sie aufbewahren und welche Kontrolle Sie darüber haben.',
    'GriffoWork ist eine operative Marke; wir haben dafür noch keine eigene juristische Person gegründet. Bis sich das ändert, betrachten Sie diese Seite als unsere operative Verpflichtung und nicht als formale Unternehmenserklärung — wir aktualisieren sie, sobald sich das ändert.',
  ],

  dataWeCollectHeading: 'Was wir erheben',
  dataCategories: [
    {
      title: 'Kontoinformationen',
      body: 'E-Mail-Adresse und Passwort (gehasht gespeichert, nie im Klartext) bei der Kontoerstellung.',
    },
    {
      title: 'Lebenslauf und berufliche Informationen',
      body: 'Der Inhalt des Lebenslaufs, den Sie hochladen oder einfügen, die angegebene Zielstelle/Stellenbeschreibung, sowie alle beruflichen Profildetails, die Sie ausfüllen (Fähigkeiten, Erfahrung, Ausbildung).',
    },
    {
      title: 'Optionale Links zu Social-Profilen',
      body: 'LinkedIn, GitHub, Portfolio oder ähnliche Links, die Sie hinzufügen möchten, und nur wenn Sie deren Analyse zustimmen.',
    },
    {
      title: 'Zahlungsinformationen',
      body: 'Wir sehen oder speichern niemals Ihre vollständige Kartennummer. Zahlungen werden von Stripe, unserem Zahlungsdienstleister, verarbeitet; wir speichern nur den für Quittungen und Support nötigen Transaktionsdatensatz.',
    },
    {
      title: 'Nutzungsdaten',
      body: 'Grundlegende Produktereignisse (wie Seitenaufrufe und Bezahlschritte) und ein aus Ihrer Netzwerkverbindung abgeleitetes ungefähres Land, verwendet, um die Produktnutzung zu verstehen und die richtige Währung anzuzeigen.',
    },
    {
      title: 'Spracheinstellung',
      body: 'Die von Ihnen gewählte Oberflächensprache, gespeichert, damit die Seite sie bei Ihrem nächsten Besuch erinnert.',
    },
    {
      title: "Lebenslauf ohne Konto gesendet (Startseite)",
      body: "Wenn Sie Ihren Lebenslauf über das Formular auf der Startseite senden, ohne ein Konto zu erstellen, erhalten wir die Datei (oder den eingefügten Text) und Ihre E-Mail-Adresse. Den Lebenslauf nutzen wir, um Ihre Position, Ihr Fachgebiet und Ihre Kompetenzen zu erkennen und mit offenen Stellen zu vergleichen, die E-Mail-Adresse, um Ihnen den Link zu Ihrem Ergebnis zu senden. Beim Senden wählen Sie: alles innerhalb von 24 Stunden löschen oder den Lebenslauf speichern, damit Unternehmen Sie finden können. Speichern erfordert, dass Sie diese Option auswählen; standardmäßig wird gelöscht.",
    },
  ],

  howWeUseHeading: 'Wofür wir es verwenden',
  howWeUseItems: [
    'Analyse Ihres Lebenslaufs und Erstellung der von Ihnen angeforderten Prüfung, Bewertung und Neufassungsvorschläge.',
    'Abgleich Ihres Profils mit offenen Stellen für die Radar-Funktion, wenn Sie diese aktivieren.',
    'Zahlungsabwicklung und Kontosupport.',
    'Versand der von Ihnen angeforderten E-Mails (Analyseergebnisse, Radar-Benachrichtigungen) und, soweit zutreffend, Ermöglichung der Abmeldung von nicht wesentlichen E-Mails.',
    'Verständnis der aggregierten Produktnutzung zur Verbesserung des Dienstes.',
    'Erfüllung rechtlicher und buchhalterischer Pflichten im Zusammenhang mit Zahlungen.',
  ],

  sharingHeading: 'Mit wem wir sie teilen',
  sharingIntro:
    'Wir verkaufen Ihre Daten nicht. Wir teilen sie nur mit den Dienstleistern („Auftragsverarbeitern“), die für den Betrieb von GriffoWork notwendig sind, jeder von ihnen handelt nach unseren Anweisungen:',
  subProcessors: [
    {
      name: 'KI-Anbieter (Anthropic, OpenAI, Google, DeepSeek, Moonshot AI)',
      purpose:
        'Der Inhalt Ihres Lebenslaufs wird an einen dieser Anbieter gesendet, um die von Ihnen angeforderte Analyse, Bewertung oder Neufassung zu erstellen. Der für eine bestimmte Anfrage verwendete Anbieter kann variieren; siehe „Internationale Übermittlungen“ unten für die Einschränkung bei Nutzern im Europäischen Wirtschaftsraum.',
    },
    {
      name: 'Stripe',
      purpose: 'Zahlungsabwicklung. Stripe erhält Ihre Zahlungsdaten direkt; wir speichern Ihre Kartennummer nicht.',
    },
    {
      name: 'Resend',
      purpose: 'Versand transaktionaler E-Mails (Analyseergebnisse, Radar-Benachrichtigungen, Kontohinweise).',
    },
    {
      name: 'Vercel und Supabase',
      purpose: 'Hosting der Anwendung und Datenbankinfrastruktur.',
    },
  ],

  transfersHeading: 'Internationale Übermittlungen',
  transfersBody: [
    'Einige unserer Auftragsverarbeiter agieren außerhalb Ihres Landes, auch außerhalb des Europäischen Wirtschaftsraums (EWR). Für Nutzer, die wir als im EWR, Vereinigten Königreich oder der Schweiz befindlich identifizieren, schließen wir KI-Anbieter ohne anerkannten Angemessenheitsbeschluss für diese Region (derzeit DeepSeek und Moonshot AI/Kimi) von der Analyse Ihres Lebenslaufs aus — Ihr Inhalt wird nur an Anbieter geleitet, die unter DSGVO-kompatiblen Garantien erreichbar sind.',
    'Für Nutzer außerhalb des EWR können je nach Systemlast und Verfügbarkeit alle aufgeführten KI-Anbieter genutzt werden.',
  ],

  retentionHeading: 'Wie lange wir Ihre Daten aufbewahren',
  retentionIntro:
    'Wir bewahren Daten nur so lange auf, wie es dem Zweck der Erhebung dient, oder wie gesetzlich vorgeschrieben:',
  retentionRows: [
    { category: 'Lebensläufe bei aktivem Konto', period: 'Solange Ihr Konto aktiv ist' },
    { category: 'Lebensläufe bei inaktivem Konto', period: 'Bis zu 730 Tage nach Ihrer letzten Aktivität, dann gelöscht' },
    { category: 'KI-Verarbeitungsprotokolle (Betriebskennzahlen, bereits ohne Lebenslaufinhalt)', period: 'Bis zu 365 Tage' },
    { category: 'Audit-Trail (Compliance- und Sicherheitsprotokoll)', period: 'Bis zu 730 Tage' },
    { category: 'Zahlungs-/Webhook-Datensätze', period: 'Bis zu 90 Tage' },
    { category: 'Radar-Angebotsverlauf (Stellen, die der Radar Ihnen gezeigt hat)', period: 'Bis zu 730 Tage' },
    { category: "Lebenslauf ohne Konto, mit der Option „innerhalb von 24 Stunden löschen“", period: "Bis zu 24 Stunden. Der Text des Lebenslaufs wird nicht gespeichert, nur das Ergebnis und die E-Mail-Adresse, die in derselben Frist gelöscht werden" },
    { category: "Lebenslauf ohne Konto, mit der Option „speichern, damit Unternehmen mich finden“", period: "Bis zu 730 Tage oder bis Sie die Löschung verlangen" },
  ],

  rightsHeading: 'Ihre Rechte und Wahlmöglichkeiten',
  rightsIntro:
    'Wo auch immer Sie sich befinden, bieten wir diese Kontrollen direkt in Ihrem Konto (Einstellungen) an, ohne dass Sie uns zuerst eine E-Mail schreiben müssen:',
  rights: [
    {
      title: 'Ihre Daten exportieren',
      body: 'Laden Sie eine Kopie Ihrer Lebensläufe, Analysehistorie, Transaktionen und Kontoaktivität herunter.',
    },
    {
      title: 'Ihr Konto löschen',
      body: 'Löschen Sie Ihr Konto und die zugehörigen personenbezogenen Daten dauerhaft. Dies ist unumkehrbar.',
    },
    {
      title: 'Ihre Informationen korrigieren',
      body: 'Bearbeiten Sie jederzeit Ihren Lebenslauf, Ihr Profil und Ihre Kontodaten.',
    },
    {
      title: 'Nicht wesentliche E-Mails abbestellen',
      body: 'Melden Sie sich über Ihr Konto oder den Link in der E-Mail selbst von Radar-Benachrichtigungen und anderen nicht wesentlichen Benachrichtigungen ab.',
    },
  ],

  cookiesHeading: 'Cookies und lokaler Speicher',
  cookiesBody: [
    'Wir verwenden ein Sitzungs-Cookie, um Sie angemeldet zu halten, sowie ein Präferenz-Cookie/lokalen Speichereintrag, um die gewählte Oberflächensprache zu merken. Wir verwenden keine Werbe-Tracker von Drittanbietern.',
  ],

  securityHeading: 'Sicherheit',
  securityBody: [
    'Wir verwenden branchenübliche Maßnahmen wie verschlüsselte Verbindungen (HTTPS), gehashte Passwörter und Zugriffskontrollen auf unserer Datenbank, um Ihre Daten zu schützen. Kein System ist vollständig risikofrei, und wir können keine absolute Sicherheit garantieren — aber wir behandeln Lebenslaufinhalte als sensible personenbezogene Daten und gestalten unsere Prozesse so, dass der Zugriff darauf minimiert wird.',
  ],

  childrenHeading: 'Datenschutz für Minderjährige',
  childrenBody:
    'GriffoWork richtet sich an Berufstätige und Arbeitsuchende und nicht an Personen unter 16 Jahren. Wir erheben nicht wissentlich Daten von Minderjährigen.',

  changesHeading: 'Änderungen dieser Richtlinie',
  changesBody:
    'Wir können diese Seite aktualisieren, wenn sich das Produkt oder unsere Anbieter ändern. Wesentliche Änderungen aktualisieren das Datum oben auf dieser Seite.',

  contactHeading: 'Kontakt',
  contactBody: 'Bei Fragen zu dieser Richtlinie oder Ihren Daten schreiben Sie an {email}.',
}
