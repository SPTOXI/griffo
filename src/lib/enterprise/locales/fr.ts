import type { EnterpriseLocale } from '../content-types'

export const fr: EnterpriseLocale = {
  breadcrumbHome: 'Accueil',
  landing: {
    metaTitle: 'Griffo Enterprise — Matching CV-Poste par IA pour Équipes de Recrutement',
    metaDescription:
      'Trouvez le bon candidat — interne ou externe — avec le même moteur de compatibilité IA que GriffoWork. Conçu pour les recruteurs et équipes RH qui décident des embauches et de la mobilité interne.',
    keywords: [
      'griffo enterprise',
      'matching de cv par ia pour recruteurs',
      'logiciel de compatibilité candidat-poste',
      'logiciel de mobilité interne',
      'ia pour le recrutement externe',
      'hr tech avec ia',
    ],
    eyebrow: 'Griffo Enterprise',
    title: 'Trouvez le bon candidat — interne ou externe',
    subtitle:
      "Griffo Enterprise fait tourner le même moteur de compatibilité CV×poste par IA que GriffoWork sur le vivier de votre entreprise — en examinant d'abord l'équipe interne, puis les candidats déjà enregistrés, avant d'élargir au vivier général de Griffo. Chaque suggestion indique précisément d'où elle vient.",
    useCases: [
      {
        title: 'Recrutement externe',
        body: 'Notez automatiquement chaque candidat par rapport au poste, avec classement et explication — pas une simple correspondance de mots-clés.',
      },
      {
        title: 'Mobilité interne',
        body: 'Repérez les collaborateurs déjà adaptés à un nouveau poste avant de chercher à l’extérieur — grâce au profil qu’ils entretiennent déjà sur Griffo.',
      },
    ],
    ctaLabel: 'Contacter les ventes',
    faqs: [
      {
        question: "Qu'est-ce que le matching CV-poste par IA ?",
        answer:
          "C'est le même moteur de compatibilité que celui de GriffoWork, appliqué à votre processus de recrutement : un modèle d'IA lit le profil professionnel d'un candidat et une offre d'emploi, puis évalue leur adéquation selon l'expérience professionnelle, les exigences spécifiques du poste et le contexte — au lieu de simplement chercher une correspondance de mots-clés.",
      },
      {
        question: "Comment mesure-t-on la compatibilité entre un candidat et un poste ?",
        answer:
          "Chaque correspondance est décomposée selon les mêmes dimensions que GriffoWork utilise déjà pour les candidats — parcours professionnel, adéquation au poste précis et pertinence contextuelle — afin que le recruteur voie non seulement le score, mais aussi pourquoi ce score a été attribué.",
      },
      {
        question: "Quelle est la différence entre recrutement externe et mobilité interne ici ?",
        answer:
          "Le même moteur de matching, mais une source de candidats différente. Le recrutement externe évalue les personnes qui postulent à un poste depuis l'extérieur de l'entreprise. La mobilité interne évalue vos propres collaborateurs — avec leur consentement — par rapport aux nouveaux postes avant de chercher à l'extérieur.",
      },
      {
        question: "Griffo Enterprise remplace-t-il notre ATS actuel ?",
        answer:
          "Non — il applique la couche de matching et de notation sur les candidatures, qu'elles proviennent de vos propres offres ou d'un pipeline déjà existant. Il est conçu pour coexister avec votre suivi actuel des candidats, pas pour le remplacer.",
      },
      {
        question: "Comment les données des employés sont-elles traitées pour la mobilité interne ?",
        answer:
          "Le profil d'un employé n'est utilisé pour le matching interne qu'après son consentement explicite pour cette entreprise précise — un consentement distinct de toute visibilité publique en tant que candidat, et limité à une seule organisation à la fois.",
      },
    ],
  },
  externalRecruitment: {
    metaTitle: 'Matching de Candidats par IA pour le Recrutement Externe | Griffo Enterprise',
    metaDescription:
      "Notez et classez automatiquement chaque candidature avec le moteur de matching CV-poste par IA de Griffo Enterprise — conçu pour les équipes qui recrutent à l'externe.",
    keywords: [
      'ia pour le recrutement externe',
      'logiciel de classement des candidats',
      'suivi des candidatures par ia',
      'tri de cv par ia',
      'logiciel de matching de postes pour recruteurs',
    ],
    eyebrow: 'Recrutement Externe',
    title: 'Classez chaque candidat selon sa réelle adéquation, pas selon des mots-clés',
    subtitle:
      "Griffo Enterprise note chaque candidat par rapport à votre offre d'emploi avec le même moteur de compatibilité par IA que GriffoWork — votre équipe examine une liste déjà classée, plutôt qu'un dossier de CV.",
    points: [
      {
        title: 'Notation automatique à chaque candidature',
        body: "Chaque candidature est comparée à l'offre dès sa réception — un score de 0 à 100, expliqué selon les mêmes dimensions professionnelle, d'adéquation au poste et contextuelle que GriffoWork utilise déjà pour les candidats.",
      },
      {
        title: 'Une cascade, pas un seul vivier',
        body: "Avant de chercher à l'extérieur, Griffo Enterprise vérifie d'abord votre propre équipe et vos candidats déjà enregistrés — la recherche externe est la troisième source, pas la première, et chaque suggestion est étiquetée avec son origine.",
      },
      {
        title: 'Aucun nouveau format de CV à apprendre',
        body: "Réutilise la même extraction de profil que GriffoWork applique déjà aux candidats — un CV téléversé une fois est noté par rapport à chaque poste ouvert.",
      },
    ],
    ctaLabel: 'Contacter les ventes',
  },
  internalMobility: {
    metaTitle: 'Logiciel de Mobilité Interne avec Matching par IA | Griffo Enterprise',
    metaDescription:
      'Repérez automatiquement les candidats internes pour les nouveaux postes avec Griffo Enterprise — mobilité interne pilotée par IA, sur le même moteur que GriffoWork.',
    keywords: [
      'logiciel de mobilité interne',
      'marché interne des talents',
      'logiciel de transfert interne des employés',
      'mobilité interne par ia',
      'plateforme de mobilité des talents',
    ],
    eyebrow: 'Mobilité Interne',
    title: "Trouvez d'abord votre prochaine recrue en interne",
    subtitle:
      "Griffo Enterprise examine votre propre équipe à la recherche d'une adéquation avant que vous ne publiiez une offre externe — grâce au profil professionnel que le collaborateur entretient déjà sur Griffo, avec son consentement.",
    points: [
      {
        title: 'Un seul profil pour le collaborateur',
        body: "Pas de second CV à remplir : le profil GriffoWork déjà existant du collaborateur est celui utilisé pour le matching avec les nouveaux postes internes.",
      },
      {
        title: 'Consentement limité à chaque entreprise',
        body: "Le profil d'un collaborateur n'est visible pour le matching interne qu'après son consentement explicite pour cette organisation précise — distinct de toute visibilité publique en tant que candidat.",
      },
      {
        title: "L'adéquation interne toujours affichée en premier",
        body: "Quand un nouveau poste s'ouvre, l'équipe interne est la première source vérifiée par l'agent de matching, avant les candidats enregistrés ou le vivier élargi de Griffo.",
      },
    ],
    ctaLabel: 'Contacter les ventes',
  },
}
