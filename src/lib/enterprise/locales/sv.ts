import type { EnterpriseLocale } from '../content-types'

export const sv: EnterpriseLocale = {
  breadcrumbHome: 'Hem',
  landing: {
    metaTitle: 'Griffo Enterprise — AI-matchning av CV mot tjänst för rekryteringsteam',
    metaDescription:
      'Hitta rätt kandidat — internt eller externt — med samma AI-kompatibilitetsmotor som ligger bakom GriffoWork. Byggd för rekryterare och HR-team som fattar beslut om anställning och intern rörlighet.',
    keywords: [
      'griffo enterprise',
      'ai cv-matchning för rekryterare',
      'programvara för kandidat-tjänstmatchning',
      'programvara för intern rörlighet',
      'ai för extern rekrytering',
      'hr-tech med ai',
    ],
    eyebrow: 'Griffo Enterprise',
    title: 'Hitta rätt kandidat — internt eller externt',
    subtitle:
      'Griffo Enterprise kör samma AI-motor för cv×tjänst-kompatibilitet som GriffoWork på ert eget rekryteringsflöde — först granskas det interna teamet, sedan de registrerade sökande, innan den bredare Griffo-kandidatpoolen nås. Varje matchning visar exakt varifrån den kommer.',
    useCases: [
      {
        title: 'Extern rekrytering',
        body: 'Bedöm varje sökande automatiskt mot tjänsten, rankad och förklarad — inte bara en sökordsmatchning.',
      },
      {
        title: 'Intern rörlighet',
        body: 'Hitta medarbetare som redan passar en ny tjänst innan ni söker externt — med hjälp av profilen de redan underhåller i Griffo.',
      },
    ],
    ctaLabel: 'Kontakta säljteamet',
    faqs: [
      {
        question: 'Vad är AI-matchning av CV mot tjänst?',
        answer:
          'Det är samma kompatibilitetsmotor som ligger bakom GriffoWork, tillämpad på er rekryteringsprocess: en AI-modell läser en kandidats yrkesprofil och en tjänst, och bedömer hur väl de passar utifrån yrkeserfarenhet, tjänstespecifika krav och sammanhang — istället för att bara leta efter matchande sökord.',
      },
      {
        question: 'Hur mäts kompatibiliteten mellan kandidat och tjänst?',
        answer:
          'Varje matchning bryts ner enligt samma dimensioner som GriffoWork redan använder för kandidater — yrkesbakgrund, anpassning till just den tjänsten och kontextuell passform — så att en rekryterare ser inte bara poängen, utan även varför den gavs.',
      },
      {
        question: 'Vad är skillnaden mellan extern rekrytering och intern rörlighet här?',
        answer:
          'Samma matchningsmotor, men olika kandidatkälla. Extern rekrytering bedömer personer som söker en tjänst utifrån. Intern rörlighet bedömer era egna medarbetare — med deras samtycke — mot nya tjänster innan ni söker externt.',
      },
      {
        question: 'Ersätter Griffo Enterprise vårt befintliga ATS?',
        answer:
          'Nej — det lägger matchnings- och poängsättningslagret ovanpå ansökningar, oavsett om de kommer via era egna tjänsteannonser eller ett befintligt flöde. Det är byggt för att existera vid sidan av hur ni redan följer upp kandidater, inte för att ersätta det systemet.',
      },
      {
        question: 'Hur hanteras medarbetardata vid intern rörlighet?',
        answer:
          'En medarbetares profil används för intern matchning först efter att hen uttryckligen samtyckt för just det företaget — ett separat samtycke från all offentlig synlighet som kandidat, och avgränsat till en organisation i taget.',
      },
    ],
  },
  externalRecruitment: {
    metaTitle: 'AI-kandidatmatchning för extern rekrytering | Griffo Enterprise',
    metaDescription:
      'Bedöm och ranka varje sökande automatiskt med Griffo Enterprises AI-motor för cv-tjänstmatchning — byggd för team som rekryterar externt.',
    keywords: [
      'ai för extern rekrytering',
      'programvara för kandidatranking',
      'ai-driven rekryteringshantering',
      'ai cv-screening',
      'programvara för tjänstmatchning för rekryterare',
    ],
    eyebrow: 'Extern rekrytering',
    title: 'Ranka varje kandidat efter verklig passform, inte sökord',
    subtitle:
      'Griffo Enterprise bedömer varje kandidat mot er tjänst med samma AI-kompatibilitetsmotor som GriffoWork — ert team granskar en rankad kortlista istället för en hög med cv:n.',
    points: [
      {
        title: 'Automatisk bedömning vid varje ansökan',
        body: 'Varje ansökan jämförs med tjänsten i samma stund den kommer in — en matchpoäng från 0 till 100, förklarad utifrån samma yrkesmässiga, tjänsteanpassade och kontextuella dimensioner som GriffoWork redan använder för kandidater.',
      },
      {
        title: 'En kaskad, inte en enda pool',
        body: 'Innan ni söker externt kontrollerar Griffo Enterprise först ert eget team och redan registrerade sökande — extern sökning är den tredje källan, inte den första, och varje förslag märks med varifrån det kommer.',
      },
      {
        title: 'Inget nytt cv-format att lära sig',
        body: 'Återanvänder samma profilextraktion som GriffoWork redan kör för kandidater — ett cv som laddats upp en gång poängsätts mot varje öppen tjänst.',
      },
    ],
    ctaLabel: 'Kontakta säljteamet',
  },
  internalMobility: {
    metaTitle: 'Programvara för intern rörlighet med AI-matchning | Griffo Enterprise',
    metaDescription:
      'Hitta interna kandidater för nya tjänster automatiskt med Griffo Enterprise — AI-driven intern rörlighet på samma motor som GriffoWork.',
    keywords: [
      'programvara för intern rörlighet',
      'intern talangmarknadsplats',
      'programvara för intern medarbetarförflyttning',
      'ai intern rörlighet',
      'plattform för talangrörlighet',
    ],
    eyebrow: 'Intern rörlighet',
    title: 'Hitta er nästa rekrytering internt först',
    subtitle:
      'Griffo Enterprise söker igenom ert eget team efter en passform innan ni publicerar en tjänst externt — med hjälp av den yrkesprofil medarbetaren redan underhåller i Griffo, med dennes samtycke.',
    points: [
      {
        title: 'Medarbetare behåller en enda profil',
        body: 'Inget andra cv att fylla i: medarbetarens befintliga GriffoWork-profil är det som matchas mot nya interna tjänster.',
      },
      {
        title: 'Samtycke avgränsat per företag',
        body: 'En medarbetares profil är synlig för intern matchning först efter att hen samtyckt för just den organisationen — separat från all offentlig synlighet som kandidat.',
      },
      {
        title: 'Intern passform visas alltid först',
        body: 'När en ny tjänst öppnas är det interna teamet den första källan som matchningsagenten kontrollerar, före registrerade sökande eller den bredare Griffo-poolen.',
      },
    ],
    ctaLabel: 'Kontakta säljteamet',
  },
}
