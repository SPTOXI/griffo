import type { PrivacyContent } from '../content-types'

export const sv: PrivacyContent = {
  metaTitle: 'Integritetspolicy — GriffoWork',
  metaDescription:
    'Hur GriffoWork samlar in, använder, delar och sparar dina uppgifter — inklusive vilka AI-leverantörer som analyserar ditt CV, hur länge vi sparar uppgifter, och hur du kan komma åt, exportera eller radera dem.',
  breadcrumbHome: 'Start',
  title: 'Integritetspolicy',
  lastUpdatedLabel: 'Senast uppdaterad',
  lastUpdatedValue: 'September 2026',
  intro: [
    'GriffoWork ("vi") erbjuder karriärintelligensverktyg: CV-analys, ATS-kompatibilitetspoäng, CV-omskrivning och jobbmatchning (Radar). Den här sidan förklarar, i klarspråk, vilka uppgifter vi samlar in för det, vem mer som ser dem, hur länge vi sparar dem och vilken kontroll du har över dem.',
    'GriffoWork är ett operativt varumärke; vi har ännu inte bildat en egen juridisk person för det. Tills dess bör du betrakta den här sidan som vårt operativa åtagande snarare än en formell bolagsförklaring — vi uppdaterar den så snart det ändras.',
  ],

  dataWeCollectHeading: 'Vad vi samlar in',
  dataCategories: [
    {
      title: 'Kontoinformation',
      body: 'E-postadress och lösenord (lagrat hashat, aldrig i klartext) när du skapar ett konto.',
    },
    {
      title: 'CV och yrkesinformation',
      body: 'Innehållet i det CV du laddar upp eller klistrar in, önskad tjänst/jobbeskrivning du anger, och alla yrkesprofiluppgifter du fyller i (kompetenser, erfarenhet, utbildning).',
    },
    {
      title: 'Valfria länkar till sociala profiler',
      body: 'LinkedIn, GitHub, portfolio eller liknande länkar du väljer att lägga till, och endast när du väljer att låta dem analyseras.',
    },
    {
      title: 'Betalningsinformation',
      body: 'Vi ser eller sparar aldrig ditt fullständiga kortnummer. Betalningar hanteras av Stripe, vår betalningsleverantör; vi sparar endast den transaktionsinformation som behövs för kvitton och support.',
    },
    {
      title: 'Användningsdata',
      body: 'Grundläggande produkthändelser (som sidvisningar och kassasteg) och ett ungefärligt land härlett från din nätverksanslutning, används för att förstå produktanvändning och visa rätt valuta.',
    },
    {
      title: 'Språkinställning',
      body: 'Det gränssnittsspråk du väljer, sparat så att webbplatsen kommer ihåg det vid nästa besök.',
    },
  ],

  howWeUseHeading: 'Vad vi använder det till',
  howWeUseItems: [
    'Analysera ditt CV och generera den granskning, poäng och de omskrivningsförslag du begär.',
    'Matcha din profil mot lediga tjänster för Radar-funktionen, när du aktiverar den.',
    'Behandla betalningar och tillhandahålla kontosupport.',
    'Skicka de e-postmeddelanden du har begärt (analysresultat, Radar-varningar) och, där tillämpligt, låta dig avsluta prenumerationen på icke-nödvändiga meddelanden.',
    'Förstå aggregerad produktanvändning för att förbättra tjänsten.',
    'Uppfylla juridiska och bokföringsmässiga skyldigheter kopplade till betalningar.',
  ],

  sharingHeading: 'Vem vi delar det med',
  sharingIntro:
    'Vi säljer inte dina uppgifter. Vi delar dem endast med de tjänsteleverantörer ("personuppgiftsbiträden") som krävs för att driva GriffoWork, var och en agerar enligt våra instruktioner:',
  subProcessors: [
    {
      name: 'AI-leverantörer (Anthropic, OpenAI, Google, DeepSeek, Moonshot AI)',
      purpose:
        'Innehållet i ditt CV skickas till en av dessa leverantörer för att generera den analys, poäng eller omskrivning du begär. Vilken leverantör som används för en viss förfrågan kan variera; se "Internationella överföringar" nedan för begränsningen som gäller användare inom Europeiska ekonomiska samarbetsområdet.',
    },
    {
      name: 'Stripe',
      purpose: 'Betalningshantering. Stripe tar emot dina betalningsuppgifter direkt; vi sparar inte ditt kortnummer.',
    },
    {
      name: 'Resend',
      purpose: 'Leverans av transaktionsmejl (analysresultat, Radar-varningar, kontomeddelanden).',
    },
    {
      name: 'Vercel och Supabase',
      purpose: 'Hosting av applikationen och databasinfrastruktur.',
    },
  ],

  transfersHeading: 'Internationella överföringar',
  transfersBody: [
    'Några av våra personuppgiftsbiträden verkar utanför ditt land, även utanför Europeiska ekonomiska samarbetsområdet (EES). För användare vi identifierar som befinnande sig inom EES, Storbritannien eller Schweiz utesluter vi AI-leverantörer utan erkänt adekvansbeslut för den regionen (för närvarande DeepSeek och Moonshot AI/Kimi) från analysen av ditt CV — ditt innehåll dirigeras endast till leverantörer som är åtkomliga under GDPR-kompatibla skyddsåtgärder.',
    'För användare utanför EES kan alla listade AI-leverantörer användas beroende på systembelastning och tillgänglighet.',
  ],

  retentionHeading: 'Hur länge vi sparar dina uppgifter',
  retentionIntro:
    'Vi sparar uppgifter endast så länge de tjänar syftet med insamlingen, eller så länge lagen kräver:',
  retentionRows: [
    { category: 'CV på aktivt konto', period: 'Så länge ditt konto är aktivt' },
    { category: 'CV på inaktivt konto', period: 'Upp till 730 dagar efter din senaste aktivitet, sedan raderas de' },
    { category: 'AI-bearbetningsloggar (operativa mätvärden, redan utan CV-innehåll)', period: 'Upp till 365 dagar' },
    { category: 'Granskningslogg (efterlevnads- och säkerhetslogg)', period: 'Upp till 730 dagar' },
    { category: 'Betalnings-/webhook-poster', period: 'Upp till 90 dagar' },
  ],

  rightsHeading: 'Dina rättigheter och val',
  rightsIntro:
    'Var du än befinner dig erbjuder vi dessa kontroller direkt i ditt konto (Inställningar), utan att du behöver mejla oss först:',
  rights: [
    {
      title: 'Exportera dina uppgifter',
      body: 'Ladda ner en kopia av dina CV:n, analyshistorik, transaktioner och kontoaktivitet.',
    },
    {
      title: 'Radera ditt konto',
      body: 'Radera ditt konto och tillhörande personuppgifter permanent. Detta går inte att ångra.',
    },
    {
      title: 'Rätta dina uppgifter',
      body: 'Redigera ditt CV, din profil och dina kontouppgifter när som helst.',
    },
    {
      title: 'Avsluta prenumeration på icke-nödvändig e-post',
      body: 'Avsluta prenumerationen på Radar-varningar och andra icke-nödvändiga meddelanden från ditt konto eller via länken i själva e-postmeddelandet.',
    },
  ],

  cookiesHeading: 'Cookies och lokal lagring',
  cookiesBody: [
    'Vi använder en sessionscookie för att hålla dig inloggad, och en preferenscookie/post i lokal lagring för att komma ihåg det valda gränssnittsspråket. Vi använder inga tredjeparts annonsspårare.',
  ],

  securityHeading: 'Säkerhet',
  securityBody: [
    'Vi använder branschstandardåtgärder som krypterade anslutningar (HTTPS), hashade lösenord och åtkomstkontroll i vår databas för att skydda dina uppgifter. Inget system är helt riskfritt, och vi kan inte garantera absolut säkerhet — men vi behandlar CV-innehåll som känsliga personuppgifter och utformar våra processer för att minimera vem och vad som kan komma åt det.',
  ],

  childrenHeading: 'Barns integritet',
  childrenBody:
    'GriffoWork riktar sig till yrkesverksamma och arbetssökande, och riktar sig inte till personer under 16 år. Vi samlar inte medvetet in uppgifter om barn.',

  changesHeading: 'Ändringar av denna policy',
  changesBody:
    'Vi kan uppdatera den här sidan i takt med att produkten eller våra leverantörer förändras. Väsentliga ändringar uppdaterar datumet högst upp på sidan.',

  contactHeading: 'Kontakta oss',
  contactBody: 'Vid frågor om denna policy eller dina uppgifter, skriv till {email}.',
}
