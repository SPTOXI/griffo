import type { PrivacyContent } from '../content-types'

export const nl: PrivacyContent = {
  metaTitle: 'Privacybeleid — GriffoWork',
  metaDescription:
    'Hoe GriffoWork je gegevens verzamelt, gebruikt, deelt en bewaart — inclusief welke AI-aanbieders je cv analyseren, hoelang we gegevens bewaren en hoe je ze kunt inzien, exporteren of verwijderen.',
  breadcrumbHome: 'Home',
  title: 'Privacybeleid',
  lastUpdatedLabel: 'Laatst bijgewerkt',
  lastUpdatedValue: 'September 2026',
  intro: [
    'GriffoWork ("wij") biedt tools voor carrière-intelligentie: cv-analyse, ATS-compatibiliteitsscore, cv-herschrijving en vacature-matching (Radar). Deze pagina legt in duidelijke taal uit welke gegevens we daarvoor verzamelen, wie ze verder ziet, hoelang we ze bewaren en welke controle je erover hebt.',
    'GriffoWork is een operationeel merk; we hebben er nog geen eigen rechtspersoon voor opgericht. Tot dat verandert, beschouw deze pagina als onze operationele toezegging in plaats van een formele bedrijfsverklaring — we werken haar bij zodra dat verandert.',
  ],

  dataWeCollectHeading: 'Wat we verzamelen',
  dataCategories: [
    {
      title: 'Accountgegevens',
      body: 'E-mailadres en wachtwoord (opgeslagen als hash, nooit in platte tekst) bij het aanmaken van een account.',
    },
    {
      title: 'Cv en professionele informatie',
      body: 'De cv-inhoud die je uploadt of plakt, de doelfunctie/vacaturebeschrijving die je opgeeft, en alle professionele profielgegevens die je invult (vaardigheden, ervaring, opleiding).',
    },
    {
      title: 'Optionele links naar sociale profielen',
      body: 'LinkedIn, GitHub, portfolio of vergelijkbare links die je kiest toe te voegen, en alleen wanneer je akkoord gaat met analyse ervan.',
    },
    {
      title: 'Betalingsgegevens',
      body: 'We zien of bewaren nooit je volledige kaartnummer. Betalingen worden verwerkt door Stripe, onze betalingsverwerker; we bewaren alleen de transactiegegevens die nodig zijn voor bonnen en ondersteuning.',
    },
    {
      title: 'Gebruiksgegevens',
      body: 'Basisproductgebeurtenissen (zoals paginaweergaven en afrekenstappen) en een geschat land afgeleid van je netwerkverbinding, gebruikt om het productgebruik te begrijpen en de juiste valuta te tonen.',
    },
    {
      title: 'Taalvoorkeur',
      body: 'De interfacetaal die je kiest, opgeslagen zodat de site deze bij je volgende bezoek onthoudt.',
    },
    {
      title: "Cv verstuurd zonder account (startpagina)",
      body: "Als je je cv via het formulier op de startpagina verstuurt zonder een account aan te maken, ontvangen we het bestand (of de geplakte tekst) en je e-mailadres. We gebruiken het cv om je functie, je vakgebied en je vaardigheden te herkennen en te vergelijken met openstaande vacatures, en het e-mailadres om je de link naar je resultaat te sturen. Bij het versturen kies je: alles binnen 24 uur verwijderen, of het cv bewaren zodat bedrijven je kunnen vinden. Bewaren vereist dat je die optie aanvinkt; standaard wordt alles verwijderd.",
    },
  ],

  howWeUseHeading: 'Waarvoor we het gebruiken',
  howWeUseItems: [
    'Je cv analyseren en de audit, score en herschrijfsuggesties genereren die je aanvraagt.',
    'Je profiel vergelijken met openstaande vacatures voor de Radar-functie, wanneer je die inschakelt.',
    'Betalingen verwerken en accountondersteuning bieden.',
    'Je de e-mails sturen die je hebt aangevraagd (analyseresultaten, Radar-meldingen) en, waar van toepassing, je laten afmelden voor niet-essentiële e-mails.',
    'Geaggregeerd productgebruik begrijpen om de dienst te verbeteren.',
    'Voldoen aan wettelijke en boekhoudkundige verplichtingen rond betalingen.',
  ],

  sharingHeading: 'Met wie we het delen',
  sharingIntro:
    'We verkopen je gegevens niet. We delen ze alleen met de dienstverleners ("verwerkers") die nodig zijn om GriffoWork te laten draaien, elk handelend volgens onze instructies:',
  subProcessors: [
    {
      name: 'AI-aanbieders (Anthropic, OpenAI, Google, DeepSeek, Moonshot AI)',
      purpose:
        'De inhoud van je cv wordt naar een van deze aanbieders gestuurd om de analyse, score of herschrijving te genereren die je aanvraagt. De gebruikte aanbieder kan per aanvraag verschillen; zie "Internationale doorgiften" hieronder voor de beperking die geldt voor gebruikers in de Europese Economische Ruimte.',
    },
    {
      name: 'Stripe',
      purpose: 'Betalingsverwerking. Stripe ontvangt je betalingsgegevens rechtstreeks; wij bewaren je kaartnummer niet.',
    },
    {
      name: 'Resend',
      purpose: 'Verzenden van transactionele e-mail (analyseresultaten, Radar-meldingen, accountmeldingen).',
    },
    {
      name: 'Vercel en Supabase',
      purpose: 'Hosting van de applicatie en database-infrastructuur.',
    },
  ],

  transfersHeading: 'Internationale doorgiften',
  transfersBody: [
    'Sommige van onze verwerkers opereren buiten je land, ook buiten de Europese Economische Ruimte (EER). Voor gebruikers die we identificeren als zich bevindend in de EER, het VK of Zwitserland, sluiten we AI-aanbieders zonder erkend adequaatheidsbesluit voor die regio (momenteel DeepSeek en Moonshot AI/Kimi) uit van de analyse van je cv — je inhoud wordt alleen geleid naar aanbieders die bereikbaar zijn onder AVG-conforme waarborgen.',
    'Voor gebruikers buiten de EER kunnen alle vermelde AI-aanbieders worden gebruikt, afhankelijk van systeembelasting en beschikbaarheid.',
  ],

  retentionHeading: 'Hoelang we je gegevens bewaren',
  retentionIntro:
    'We bewaren gegevens alleen zolang ze het doel van verzameling dienen, of zolang wettelijk vereist:',
  retentionRows: [
    { category: 'Cv\'s op actief account', period: 'Zolang je account actief is' },
    { category: 'Cv\'s op inactief account', period: 'Tot 730 dagen na je laatste activiteit, daarna verwijderd' },
    { category: 'AI-verwerkingslogs (operationele statistieken, al zonder cv-inhoud)', period: 'Tot 365 dagen' },
    { category: 'Auditlog (compliance- en beveiligingslog)', period: 'Tot 730 dagen' },
    { category: 'Betalings-/webhookgegevens', period: 'Tot 90 dagen' },
    { category: 'Radar-aanbodgeschiedenis (vacatures die de Radar je toonde)', period: 'Tot 730 dagen' },
    { category: "Cv verstuurd zonder account, met de optie \"binnen 24 uur verwijderen\"", period: "Tot 24 uur. De tekst van het cv wordt niet opgeslagen; alleen het resultaat en het e-mailadres, die binnen dezelfde termijn worden verwijderd" },
    { category: "Cv verstuurd zonder account, met de optie \"bewaren voor bedrijven\"", period: "Tot 730 dagen, of tot je om verwijdering vraagt" },
  ],

  rightsHeading: 'Jouw rechten en keuzes',
  rightsIntro:
    'Waar je ook bent, we bieden deze controles rechtstreeks in je account (Instellingen), zonder dat je ons eerst hoeft te e-mailen:',
  rights: [
    {
      title: 'Je gegevens exporteren',
      body: 'Download een kopie van je cv\'s, analysegeschiedenis, transacties en accountactiviteit.',
    },
    {
      title: 'Je account verwijderen',
      body: 'Verwijder je account en bijbehorende persoonsgegevens permanent. Dit is onomkeerbaar.',
    },
    {
      title: 'Je gegevens corrigeren',
      body: 'Bewerk je cv, profiel en accountgegevens op elk moment.',
    },
    {
      title: 'Afmelden voor niet-essentiële e-mail',
      body: 'Meld je af voor Radar-meldingen en andere niet-essentiële meldingen vanuit je account of via de link in de e-mail zelf.',
    },
  ],

  cookiesHeading: 'Cookies en lokale opslag',
  cookiesBody: [
    'We gebruiken een sessiecookie om je aangemeld te houden, en een voorkeurscookie/item in lokale opslag om de gekozen interfacetaal te onthouden. We gebruiken geen advertentietrackers van derden.',
  ],

  securityHeading: 'Beveiliging',
  securityBody: [
    'We gebruiken maatregelen die gangbaar zijn in de branche, zoals versleutelde verbindingen (HTTPS), gehashte wachtwoorden en toegangscontrole op onze database, om je gegevens te beschermen. Geen enkel systeem is volledig risicovrij, en we kunnen geen absolute beveiliging garanderen — maar we behandelen cv-inhoud als gevoelige persoonsgegevens en ontwerpen onze processen om te beperken wie en wat er toegang toe heeft.',
  ],

  childrenHeading: 'Privacy van minderjarigen',
  childrenBody:
    'GriffoWork is bedoeld voor werkende professionals en werkzoekenden, en is niet gericht op personen onder de 16 jaar. We verzamelen niet bewust gegevens van kinderen.',

  changesHeading: 'Wijzigingen in dit beleid',
  changesBody:
    'We kunnen deze pagina bijwerken naarmate het product of onze aanbieders veranderen. Betekenisvolle wijzigingen werken de datum bovenaan deze pagina bij.',

  contactHeading: 'Neem contact op',
  contactBody: 'Voor vragen over dit beleid of je gegevens, schrijf naar {email}.',
}
