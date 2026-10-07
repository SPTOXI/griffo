import type { AtsLocale } from '../content-types'

/** Guias de ATS em sueco: só os 5 globais. */
export const atsSv: AtsLocale = {
  workday: {
    marketName: 'USA, Europa och globala koncerner',
    description:
      'Workday är företagsstandarden hos merparten av Fortune 500 och stora multinationella bolag. Systemet är känt för en av de striktaste och mest standardiserade parsrarna på HR-marknaden.',
    marketShare: 'Används av mer än 50 % av Fortune 500-bolagen.',
    howItWorks: [
      {
        title: 'Strukturerad fältmappning',
        description:
          'Workday delar upp CV:t i fördefinierade fält: företag, roll, period och ansvarsområden. Varje formatavvikelse gör att uppgifter tappas bort i gallringen.',
      },
      {
        title: 'Gallring enligt internationella regelverk',
        description:
          'Filtrerar ansökningar mot globala arbetsrättsliga regelverk och kräver en tydlig karriärutveckling och senioritetsnivå.',
      },
      {
        title: 'Kontroll av nyckeltal och krav',
        description:
          'Systemet prioriterar profiler som visar mätbar effekt i linje med kompetenserna i annonsen.',
      },
    ],
    eliminationFactors: [
      'Ovanliga format och layouter som förstör den automatiska ifyllningen av fält.',
      'Motstridiga datum och perioder som gör att antalet års erfarenhet inte kan beräknas.',
      'Rollbenämningar utan tydlig koppling till internationella marknadsstandarder.',
    ],
    howGriffoWorkHelps: [
      'Säkerställer att Workdays parser läser strukturen i ditt CV utan fel.',
      'Kontrollerar att CV:t följer internationella rekryteringsstandarder (USA, Europa och globalt).',
      'Granskar hur tätt mätbara resultat förekommer, mot systemets företagsfilter.',
      'Skapar ett personligt brev riktat mot den specifika tjänsten.',
    ],
    faqs: [
      {
        question: 'Varför är Workday så krävande?',
        answer:
          'Eftersom koncerner får tusentals ansökningar per tjänst tillämpar Workday strukturerade kriterier och sorterar bort CV:n med rörig formatering eller uppgifter som inte går att kategorisera.',
      },
      {
        question: 'Hur förbereder GriffoWork min profil för Workday?',
        answer:
          'GriffoWork granskar kronologisk tydlighet, formatering och förekomsten av mätbara resultat, så att Workday läser ut din bakgrund korrekt.',
      },
    ],
  },
  greenhouse: {
    marketName: 'Global tech, startups och scaleups',
    description:
      'Greenhouse är den mest använda rekryteringsplattformen i det globala teknikekosystemet, bland snabbväxande startups och unicorns, med fokus på kompetensbaserad och evidensdriven rekrytering.',
    marketShare: 'Ledande bland teknik- och innovationsbolag i USA, Europa och Latinamerika.',
    howItWorks: [
      {
        title: 'Kompetens-scorecards',
        description:
          'Bedömer kandidater mot specifika scorecards för tekniska färdigheter, verktyg och ledarskap.',
      },
      {
        title: 'Integration med portfolio och profiler',
        description:
          'Kopplar uppgifterna i CV:t till professionella länkar (LinkedIn, GitHub, portfolio) för granskning av det tekniska teamet.',
      },
    ],
    eliminationFactors: [
      'Generiska CV:n som inte styrker praktisk erfarenhet av verktygen och ramverken.',
      'Inga konkreta resultat från tidigare roller.',
      'Ingen tydlig koppling mellan projekt och affärsnytta.',
    ],
    howGriffoWorkHelps: [
      'Kartlägger hur väl dina tekniska färdigheter matchar tjänsten.',
      'Granskar att dina professionella profiler stämmer överens med CV:t.',
      'Poängsätter genomslag och tydlighet enligt rekryterarnas scorecard-kriterier.',
    ],
    faqs: [
      {
        question: 'Varför är Greenhouse så vanligt inom tech?',
        answer:
          'För att utvecklings- och produktteam kan bedöma kompetens strukturerat och gemensamt, vilket minskar partiskhet i den första gallringen.',
      },
      {
        question: 'Täcker GriffoWork även internationella distansjobb i Greenhouse?',
        answer: 'Ja. GriffoWork anpassar granskningen till globala processer och internationella krav.',
      },
    ],
  },
  lever: {
    marketName: 'Scaleups och Big Tech',
    description:
      'Lever kombinerar kandidathantering (ATS) med talangrelationshantering (CRM), vilket låter rekryteringsteam löpande hitta och kvalificera kandidater ur sin egen databas.',
    marketShare: 'Brett använt av medelstora och stora teknikbolag.',
    howItWorks: [
      {
        title: 'Löpande indexering av talanger',
        description:
          'Sparar och indexerar kandidatens hela bakgrund för matchning mot både nuvarande och framtida tjänster.',
      },
      {
        title: 'Semantisk kompetenssökning',
        description:
          'Rekryterare filtrerar kandidater med detaljerade semantiska sökningar på verktyg, roller och utbildning.',
      },
    ],
    eliminationFactors: [
      'Saknade fackuttryck, vilket gör att systemet aldrig visar profilen i tematiska sökningar.',
      'Vaga beskrivningar som inte förmedlar kunskapens verkliga djup.',
    ],
    howGriffoWorkHelps: [
      'Säkerställer att de strategiska nyckelorden finns med så att ditt CV syns i Levers sökningar.',
      'Skärper din positionering så att profilen fortsätter fungera i talangpoolen över tid.',
    ],
    faqs: [
      {
        question: 'Hur fungerar Levers talangpool?',
        answer:
          'Lever håller arkiverade profiler sökbara. Ett CV med hög täthet av relevanta termer fortsätter dyka upp för nya möjligheter.',
      },
    ],
  },
  taleo: {
    marketName: 'Banker, offentlig sektor och storföretag',
    description:
      'Oracle Taleo är ett av världens mest etablerade rekryteringssystem, flitigt använt inom finans, olja och gas, telekom och offentlig sektor.',
    marketShare: 'Stark närvaro i traditionella koncerner och globala finansinstitut.',
    howItWorks: [
      {
        title: 'Traditionella gallringsfilter',
        description:
          'Tillämpar strukturerade gallringsregler baserade på formella titlar, anställningstid och utbildningsnivå.',
      },
    ],
    eliminationFactors: [
      'Ovanliga rubriker som den äldre parsern inte kan klassificera.',
      'Grafiska element som bryter informationshierarkin.',
    ],
    howGriffoWorkHelps: [
      'Granskar CV:ts formella struktur för kompatibilitet med Taleos parser.',
      'Kontrollerar de datum-, titel- och avsnittskonventioner som traditionella koncerner förväntar sig.',
    ],
    faqs: [
      {
        question: 'Används Oracle Taleo fortfarande mycket?',
        answer:
          'Ja, särskilt hos storbanker, industrikoncerner och företag som hanterar tusentals anställda världen över.',
      },
    ],
  },
  ashby: {
    marketName: 'Globala startups och AI-scaleups',
    description:
      'Ashby är en modern rekryteringsplattform som växer snabbt bland innovativa teknik- och AI-bolag, byggd kring smart automatisering och analys.',
    marketShare: 'Snabbt växande bland teknik- och AI-scaleups.',
    howItWorks: [
      {
        title: 'Snabb gallring och AI-sammanfattningar',
        description:
          'Tar fram analytiska sammanfattningar så att rekryterare snabbt kan bedöma kandidatens genomslag och senioritet.',
      },
    ],
    eliminationFactors: [
      'Långa och ofokuserade CV:n där de viktigaste tekniska resultaten försvinner.',
    ],
    howGriffoWorkHelps: [
      'Granskar CV:ts sammanfattning så att den läses snabbt och gör intryck.',
      'Lyfter fram komplexa projekt och tekniskt ledarskap för Ashbys filter.',
    ],
    faqs: [
      {
        question: 'Vad skiljer Ashby från andra system?',
        answer:
          'Ashby erbjuder analytiska dashboards och automatiska sammanfattningar som premierar koncisa, resultatinriktade CV:n.',
      },
    ],
  },
  teamtailor: {
    marketName: "Norden, Europa och team med fokus på arbetsgivarvarumärke",
    description:
      "Teamtailor är en svensk rekryteringsplattform som kombinerar ett rekryteringssystem med en karriärsida i företagets egen profil. Arbetsgivare använder den för att publicera jobb, ta emot ansökningar och flytta kandidater genom en visuell pipeline.",
    marketShare: "Populär bland företag i Norden och i övriga Europa.",
    howItWorks: [
      {
        title: "Ansökan via karriärsidan",
        description:
          "Kandidater söker oftast via arbetsgivarens egen karriärsida, där CV:t och några formulärfält blir kandidatprofilen.",
      },
      {
        title: "Visuell pipeline",
        description:
          "Rekryterare flyttar kandidater mellan steg och skummar ofta profiler snabbt, så toppen av ditt CV måste bära dina starkaste punkter.",
      },
      {
        title: "Samarbete i teamet",
        description:
          "Rekryteringsteam kommenterar kandidater tillsammans, vilket gynnar ett CV som går att sammanfatta i en eller två meningar.",
      },
    ],
    eliminationFactors: [
      "Ett CV där den relevanta erfarenheten syns först efter en lång läsning.",
      "Layouter med kolumner eller grafik som gör den inlästa profilen ofullständig.",
      "Kontaktuppgifter och länkar gömda i sidhuvud eller bilder.",
    ],
    howGriffoWorkHelps: [
      "Kontrollerar att ditt CV läses rent och att viktiga uppgifter överlever inläsningen.",
      "Bedömer de första raderna i ditt CV för tydlighet och genomslag.",
      "Jämför din formulering med jobbannonsen och visar vilka termer som saknas.",
      "Skapar ett personligt brev riktat till den specifika tjänsten.",
    ],
    faqs: [
      {
        question: "Läser Teamtailor CV på svenska och engelska?",
        answer:
          "Arbetsgivare tar emot ansökningar på det språk kandidaten skickar in. Skriv på annonsens språk och håll rubrikerna enkla.",
      },
      {
        question: "Hur viktig är början av mitt CV?",
        answer:
          "Mycket viktig. Rekryterare går ofta igenom många kandidater i en pipeline, så lägg din mest relevanta tjänst och dina resultat först.",
      },
    ],
  },
}
