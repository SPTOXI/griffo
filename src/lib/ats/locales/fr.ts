import type { AtsLocale } from '../content-types'

/** Guias de ATS em francês: só os 5 globais (nenhum ATS regional francófono na base). */
export const atsFr: AtsLocale = {
  workday: {
    marketName: 'États-Unis, Europe et multinationales',
    description:
      "Workday est le standard d'entreprise chez la majorité des sociétés du Fortune 500 et des grandes multinationales. Il est réputé pour l'un des parsers les plus stricts et les plus normalisés du marché RH.",
    marketShare: 'Utilisé par plus de 50 % des entreprises du Fortune 500.',
    howItWorks: [
      {
        title: 'Cartographie structurée des champs',
        description:
          "Workday découpe le CV en champs prédéfinis : entreprise, poste, période et missions. Tout écart de format entraîne une perte de données lors du tri.",
      },
      {
        title: 'Filtrage selon les normes internationales',
        description:
          "Filtre les candidatures au regard des règles de conformité du travail à l'international et exige une progression de carrière et une séniorité lisibles.",
      },
      {
        title: 'Vérification des indicateurs et des exigences',
        description:
          "Le système privilégie les profils qui démontrent un impact mesurable, aligné sur les compétences demandées dans l'offre.",
      },
    ],
    eliminationFactors: [
      'Formats et mises en page inhabituels qui faussent le remplissage automatique des champs.',
      "Dates et périodes incohérentes qui empêchent le calcul des années d'expérience.",
      'Intitulés de poste sans correspondance claire avec les standards internationaux.',
    ],
    howGriffoWorkHelps: [
      'Garantit que le parser de Workday lise sans erreur la hiérarchie de votre CV.',
      "Vérifie l'alignement avec les standards internationaux de recrutement (États-Unis, Europe, monde).",
      'Analyse la densité de résultats chiffrés au regard des filtres des grands groupes.',
      "Rédige une lettre de motivation ciblée sur le poste.",
    ],
    faqs: [
      {
        question: 'Pourquoi Workday est-il si exigeant ?',
        answer:
          "Les multinationales reçoivent des milliers de candidatures par poste : Workday applique donc des critères structurés et écarte les CV au format confus ou aux informations inclassables.",
      },
      {
        question: 'Comment GriffoWork prépare-t-il mon profil pour Workday ?',
        answer:
          "GriffoWork vérifie la clarté chronologique, la mise en forme et la présence d'indicateurs, afin que Workday extraie votre parcours sans erreur.",
      },
    ],
  },
  greenhouse: {
    marketName: 'Tech mondiale, startups et scaleups',
    description:
      "Greenhouse est la plateforme de recrutement la plus utilisée dans l'écosystème technologique mondial, chez les startups en hypercroissance et les licornes, avec une approche fondée sur les compétences et les preuves.",
    marketShare: "Leader chez les entreprises technologiques et innovantes aux États-Unis, en Europe et en Amérique latine.",
    howItWorks: [
      {
        title: 'Grilles de compétences',
        description:
          'Évalue le candidat au regard de grilles précises portant sur les compétences techniques, les outils et le leadership.',
      },
      {
        title: 'Intégration des portfolios et profils',
        description:
          "Relie les données du CV aux liens professionnels (LinkedIn, GitHub, portfolios) pour l'examen par l'équipe technique.",
      },
    ],
    eliminationFactors: [
      "CV génériques qui n'attestent pas d'une maîtrise concrète des outils et frameworks.",
      'Absence de résultats concrets sur les expériences précédentes.',
      "Aucun lien clair entre les projets et l'impact sur l'activité.",
    ],
    howGriffoWorkHelps: [
      "Mesure l'adéquation entre vos compétences techniques et celles attendues sur le poste.",
      'Vérifie la cohérence de vos profils professionnels avec votre CV.',
      "Note l'impact et la clarté selon les critères des grilles utilisées par les recruteurs.",
    ],
    faqs: [
      {
        question: 'Pourquoi Greenhouse est-il si répandu dans la tech ?',
        answer:
          "Parce qu'il permet aux équipes d'ingénierie et produit d'évaluer les compétences de façon structurée et collaborative, ce qui limite les biais lors du premier tri.",
      },
      {
        question: 'GriffoWork couvre-t-il les postes en télétravail international sur Greenhouse ?',
        answer: "Oui. GriffoWork adapte l'audit aux processus internationaux et à leurs exigences.",
      },
    ],
  },
  lever: {
    marketName: 'Scaleups et Big Tech',
    description:
      "Lever associe le suivi des candidatures (ATS) à la gestion de la relation candidat (CRM), ce qui permet aux équipes de recrutement de sourcer et qualifier en continu depuis leur propre base.",
    marketShare: 'Largement adopté par les entreprises technologiques de taille moyenne et grande.',
    howItWorks: [
      {
        title: 'Indexation continue des talents',
        description:
          'Conserve et indexe le parcours complet du candidat pour le croiser avec les postes actuels et à venir.',
      },
      {
        title: 'Recherche sémantique par compétences',
        description:
          'Les recruteurs filtrent les candidats via des recherches sémantiques détaillées par outils, intitulés et formations.',
      },
    ],
    eliminationFactors: [
      "Absence de termes techniques : le système ne fait jamais remonter le profil dans les recherches thématiques.",
      'Descriptions vagues qui ne rendent pas compte du niveau réel de maîtrise.',
    ],
    howGriffoWorkHelps: [
      'Vérifie la présence des mots-clés stratégiques pour que votre CV ressorte dans les recherches Lever.',
      'Affine votre positionnement pour que le profil reste pertinent dans le vivier sur la durée.',
    ],
    faqs: [
      {
        question: 'Comment fonctionne le vivier de talents de Lever ?',
        answer:
          "Lever garde les profils archivés et consultables. Un CV riche en termes pertinents continue de ressortir pour de nouvelles opportunités.",
      },
    ],
  },
  taleo: {
    marketName: 'Banques, administrations et grands groupes',
    description:
      "Oracle Taleo est l'un des systèmes de recrutement les plus établis au monde, très utilisé dans la finance, le pétrole et le gaz, les télécommunications et le secteur public.",
    marketShare: 'Forte présence dans les grands groupes traditionnels et les institutions financières.',
    howItWorks: [
      {
        title: 'Filtres de tri classiques',
        description:
          "Applique des règles structurées fondées sur les intitulés officiels, l'ancienneté et les niveaux de diplôme.",
      },
    ],
    eliminationFactors: [
      'Intitulés de rubriques inhabituels que le parser hérité ne parvient pas à classer.',
      "Éléments graphiques qui cassent la hiérarchie de l'information.",
    ],
    howGriffoWorkHelps: [
      'Vérifie la structure formelle du CV pour sa compatibilité avec le parser de Taleo.',
      'Contrôle le format des dates, des intitulés et des rubriques attendu par les grands groupes.',
    ],
    faqs: [
      {
        question: 'Oracle Taleo est-il encore très utilisé ?',
        answer:
          "Oui, en particulier dans les grandes banques, les groupes industriels et les entreprises qui gèrent des milliers de collaborateurs dans le monde.",
      },
    ],
  },
  ashby: {
    marketName: 'Startups mondiales et scaleups IA',
    description:
      "Ashby est une plateforme de recrutement moderne en forte croissance chez les entreprises technologiques et d'intelligence artificielle, bâtie sur l'automatisation intelligente et l'analytique.",
    marketShare: 'Croissance rapide chez les scaleups tech et IA.',
    howItWorks: [
      {
        title: 'Tri rapide et synthèses par IA',
        description:
          "Produit des synthèses analytiques pour que les recruteurs évaluent vite l'impact et la séniorité d'un profil.",
      },
    ],
    eliminationFactors: [
      'CV longs et peu ciblés, où les principales réalisations techniques passent inaperçues.',
    ],
    howGriffoWorkHelps: [
      'Vérifie que la synthèse de votre CV se lise vite et marque les esprits.',
      'Met en avant les projets complexes et le leadership technique pour les filtres Ashby.',
    ],
    faqs: [
      {
        question: "Qu'est-ce qui distingue Ashby des autres systèmes ?",
        answer:
          'Ashby propose des tableaux de bord analytiques et des synthèses automatiques qui valorisent les CV concis et orientés résultats.',
      },
    ],
  },
}
