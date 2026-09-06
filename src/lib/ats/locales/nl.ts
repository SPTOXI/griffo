import type { AtsLocale } from '../content-types'

/** Guias de ATS em holandês: só os 5 globais. */
export const atsNl: AtsLocale = {
  workday: {
    marketName: 'Verenigde Staten, Europa en wereldwijde multinationals',
    description:
      'Workday is de bedrijfsstandaard bij het merendeel van de Fortune 500 en grote multinationals. Het staat bekend om een van de strengste en meest gestandaardiseerde parsers in de HR-softwaremarkt.',
    marketShare: 'Gebruikt door meer dan 50% van de Fortune 500-bedrijven.',
    howItWorks: [
      {
        title: 'Gestructureerde veldtoewijzing',
        description:
          'Workday splitst het cv op in vaste velden: werkgever, functie, periode en verantwoordelijkheden. Elke afwijking in opmaak zorgt ervoor dat gegevens tijdens de selectie verloren gaan.',
      },
      {
        title: 'Selectie volgens internationale regelgeving',
        description:
          'Filtert sollicitaties op basis van wereldwijde arbeidsregelgeving en verwacht een duidelijk loopbaanverloop en senioriteitsniveau.',
      },
      {
        title: 'Controle van resultaten en vereisten',
        description:
          'Het systeem geeft voorrang aan profielen met meetbare impact die aansluit op de competenties in de vacature.',
      },
    ],
    eliminationFactors: [
      'Ongebruikelijke formaten en opmaak die het automatisch vullen van velden verstoren.',
      'Inconsistente data en periodes waardoor het aantal jaren ervaring niet berekend kan worden.',
      'Functietitels zonder duidelijke aansluiting op internationale marktstandaarden.',
    ],
    howGriffoWorkHelps: [
      'Zorgt dat de Workday-parser de structuur van je cv foutloos leest.',
      'Controleert de aansluiting op internationale wervingsstandaarden (VS, Europa en wereldwijd).',
      'Analyseert de dichtheid van meetbare resultaten ten opzichte van de filters van het systeem.',
      'Genereert een motivatiebrief gericht op de specifieke vacature.',
    ],
    faqs: [
      {
        question: 'Waarom is Workday zo streng?',
        answer:
          'Omdat multinationals duizenden sollicitaties per vacature ontvangen, hanteert Workday gestructureerde criteria en valt een cv met verwarrende opmaak of niet-classificeerbare informatie af.',
      },
      {
        question: 'Hoe bereidt GriffoWork mijn profiel voor op Workday?',
        answer:
          'GriffoWork controleert chronologische helderheid, opmaak en de aanwezigheid van meetbare resultaten, zodat Workday je loopbaan foutloos uitleest.',
      },
    ],
  },
  greenhouse: {
    marketName: 'Wereldwijde tech, startups en scaleups',
    description:
      'Greenhouse is het meestgebruikte wervingsplatform in het wereldwijde technologie-ecosysteem, bij snelgroeiende startups en unicorns, met de nadruk op werving op basis van competenties en bewijs.',
    marketShare: 'Toonaangevend bij technologie- en innovatiebedrijven in de VS, Europa en Latijns-Amerika.',
    howItWorks: [
      {
        title: 'Competentie-scorecards',
        description:
          'Beoordeelt kandidaten aan de hand van specifieke scorecards voor technische vaardigheden, tools en leiderschap.',
      },
      {
        title: 'Koppeling met portfolio en profielen',
        description:
          'Verbindt cv-gegevens met professionele links (LinkedIn, GitHub, portfolio) voor beoordeling door het technische team.',
      },
    ],
    eliminationFactors: [
      "Algemene cv's die geen praktische beheersing van tools en frameworks aantonen.",
      'Geen concrete resultaten uit eerdere functies.',
      'Geen duidelijk verband tussen projecten en zakelijke impact.',
    ],
    howGriffoWorkHelps: [
      'Brengt in kaart hoe goed je technische vaardigheden aansluiten op de functie.',
      'Controleert of je professionele profielen consistent zijn met je cv.',
      'Scoort impact en helderheid volgens de scorecard-criteria van recruiters.',
    ],
    faqs: [
      {
        question: 'Waarom is Greenhouse zo populair in tech?',
        answer:
          'Omdat engineering- en productteams competenties er gestructureerd en gezamenlijk mee kunnen beoordelen, wat vooringenomenheid in de eerste selectieronde vermindert.',
      },
      {
        question: 'Behandelt GriffoWork ook internationale remote vacatures in Greenhouse?',
        answer: 'Ja. GriffoWork stemt de analyse af op wereldwijde processen en internationale eisen.',
      },
    ],
  },
  lever: {
    marketName: 'Scaleups en Big Tech',
    description:
      'Lever combineert kandidaatvolgsysteem (ATS) met talentrelatiebeheer (CRM), waardoor wervingsteams doorlopend kandidaten kunnen vinden en kwalificeren uit hun eigen database.',
    marketShare: 'Breed toegepast door middelgrote en grote technologiebedrijven.',
    howItWorks: [
      {
        title: 'Doorlopende talentindexering',
        description:
          'Slaat de volledige loopbaan van de kandidaat op en indexeert die voor huidige en toekomstige vacatures.',
      },
      {
        title: 'Semantisch zoeken op vaardigheden',
        description:
          'Recruiters filteren kandidaten via gedetailleerde semantische zoekopdrachten op tools, functies en opleiding.',
      },
    ],
    eliminationFactors: [
      'Ontbrekende vaktermen, waardoor het systeem het profiel nooit toont bij thematische zoekopdrachten.',
      'Vage omschrijvingen die de werkelijke diepgang van de kennis niet weergeven.',
    ],
    howGriffoWorkHelps: [
      'Zorgt dat de strategische trefwoorden aanwezig zijn zodat je cv opduikt in Lever-zoekopdrachten.',
      'Scherpt je positionering aan zodat het profiel op termijn blijft werken in de talentpool.',
    ],
    faqs: [
      {
        question: 'Hoe werkt de talentpool van Lever?',
        answer:
          'Lever houdt gearchiveerde profielen doorzoekbaar. Een cv met een hoge dichtheid aan relevante termen blijft opduiken bij nieuwe kansen.',
      },
    ],
  },
  taleo: {
    marketName: 'Banken, overheid en grote ondernemingen',
    description:
      'Oracle Taleo is een van de meest gevestigde wervingssystemen ter wereld, veel gebruikt in de financiële sector, olie en gas, telecom en bij overheidsinstanties.',
    marketShare: 'Sterke aanwezigheid bij traditionele concerns en wereldwijde financiële instellingen.',
    howItWorks: [
      {
        title: 'Traditionele selectiefilters',
        description:
          'Past gestructureerde selectieregels toe op basis van formele functietitels, dienstjaren en opleidingsniveau.',
      },
    ],
    eliminationFactors: [
      'Ongebruikelijke kopjes die de oudere parser niet kan indelen.',
      'Grafische elementen die de informatiehiërarchie doorbreken.',
    ],
    howGriffoWorkHelps: [
      'Controleert de formele structuur van je cv op compatibiliteit met de Taleo-parser.',
      'Toetst de conventies voor data, functietitels en secties die traditionele concerns verwachten.',
    ],
    faqs: [
      {
        question: 'Wordt Oracle Taleo nog veel gebruikt?',
        answer:
          'Ja, vooral bij grote banken, industriële groepen en concerns die wereldwijd duizenden medewerkers beheren.',
      },
    ],
  },
  ashby: {
    marketName: 'Wereldwijde startups en AI-scaleups',
    description:
      'Ashby is een modern wervingsplatform dat snel groeit bij innovatieve technologie- en AI-bedrijven, gebouwd rond slimme automatisering en analytics.',
    marketShare: 'Sterk groeiend bij technologie- en AI-scaleups.',
    howItWorks: [
      {
        title: 'Snelle selectie en AI-samenvattingen',
        description:
          'Levert analytische samenvattingen waarmee recruiters snel de impact en senioriteit van een kandidaat inschatten.',
      },
    ],
    eliminationFactors: [
      "Lange, ongerichte cv's waarin de belangrijkste technische prestaties ondersneeuwen.",
    ],
    howGriffoWorkHelps: [
      'Controleert of de samenvatting van je cv snel leest en indruk maakt.',
      'Licht complexe projecten en technisch leiderschap uit voor de filters van Ashby.',
    ],
    faqs: [
      {
        question: 'Wat onderscheidt Ashby van andere systemen?',
        answer:
          "Ashby biedt analytische dashboards en automatische samenvattingen die beknopte, resultaatgerichte cv's belonen.",
      },
    ],
  },
}
