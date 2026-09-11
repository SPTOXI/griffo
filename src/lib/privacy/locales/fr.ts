import type { PrivacyContent } from '../content-types'

export const fr: PrivacyContent = {
  metaTitle: 'Politique de confidentialité — GriffoWork',
  metaDescription:
    "Comment GriffoWork collecte, utilise, partage et conserve vos données — y compris quels fournisseurs d'IA analysent votre CV, combien de temps nous les conservons, et comment y accéder, les exporter ou les supprimer.",
  breadcrumbHome: 'Accueil',
  title: 'Politique de confidentialité',
  lastUpdatedLabel: 'Dernière mise à jour',
  lastUpdatedValue: 'Septembre 2026',
  intro: [
    "GriffoWork (« nous ») propose des outils d'intelligence de carrière : analyse de CV, score de compatibilité ATS, réécriture de CV et mise en correspondance d'offres (Radar). Cette page explique, en langage clair, quelles données nous collectons pour cela, qui d'autre les voit, combien de temps nous les conservons et quel contrôle vous avez sur elles.",
    "GriffoWork est une marque opérationnelle ; nous n'avons pas encore constitué d'entité juridique dédiée pour elle. En attendant, considérez cette page comme notre engagement opérationnel plutôt que comme une déclaration d'entreprise formelle — nous la mettrons à jour dès que cela changera.",
  ],

  dataWeCollectHeading: 'Ce que nous collectons',
  dataCategories: [
    {
      title: 'Informations de compte',
      body: "Adresse e-mail et mot de passe (stocké haché, jamais en clair) lors de la création d'un compte.",
    },
    {
      title: 'CV et informations professionnelles',
      body: "Le contenu du CV que vous téléversez ou collez, l'offre/description de poste cible que vous indiquez, et les détails de profil professionnel que vous renseignez (compétences, expérience, formation).",
    },
    {
      title: 'Liens de profils sociaux (facultatif)',
      body: "LinkedIn, GitHub, portfolio ou liens similaires que vous choisissez d'ajouter, et uniquement lorsque vous acceptez qu'ils soient analysés.",
    },
    {
      title: 'Informations de paiement',
      body: "Nous ne voyons ni ne stockons jamais votre numéro de carte complet. Les paiements sont traités par Stripe, notre prestataire de paiement ; nous conservons uniquement l'enregistrement de transaction nécessaire aux reçus et au support.",
    },
    {
      title: "Données d'utilisation",
      body: 'Événements produit de base (comme les vues de page et les étapes de paiement) et un pays approximatif déduit de votre connexion réseau, utilisés pour comprendre l\'usage du produit et afficher la bonne devise.',
    },
    {
      title: 'Préférence de langue',
      body: "La langue d'interface que vous choisissez, enregistrée pour que le site s'en souvienne lors de votre prochaine visite.",
    },
  ],

  howWeUseHeading: 'À quoi cela sert',
  howWeUseItems: [
    'Analyser votre CV et générer l\'audit, le score et les suggestions de réécriture que vous demandez.',
    "Comparer votre profil aux offres ouvertes pour la fonctionnalité Radar, lorsque vous l'activez.",
    'Traiter les paiements et fournir le support de compte.',
    "Vous envoyer les e-mails que vous avez demandés (résultats d'analyse, alertes Radar) et, le cas échéant, vous permettre de vous désabonner des e-mails non essentiels.",
    "Comprendre l'usage agrégé du produit afin de l'améliorer.",
    'Respecter les obligations légales et comptables liées aux paiements.',
  ],

  sharingHeading: 'Avec qui nous les partageons',
  sharingIntro:
    'Nous ne vendons pas vos données. Nous les partageons uniquement avec les prestataires (« sous-traitants ») nécessaires au fonctionnement de GriffoWork, chacun agissant selon nos instructions :',
  subProcessors: [
    {
      name: "Fournisseurs d'IA (Anthropic, OpenAI, Google, DeepSeek, Moonshot AI)",
      purpose:
        "Le contenu de votre CV est envoyé à l'un de ces fournisseurs pour générer l'analyse, le score ou la réécriture que vous demandez. Le fournisseur utilisé pour une requête donnée peut varier ; voir « Transferts internationaux » ci-dessous pour la restriction appliquée aux utilisateurs de l'Espace économique européen.",
    },
    {
      name: 'Stripe',
      purpose: 'Traitement des paiements. Stripe reçoit vos informations de paiement directement ; nous ne stockons pas votre numéro de carte.',
    },
    {
      name: 'Resend',
      purpose: "Envoi d'e-mails transactionnels (résultats d'analyse, alertes Radar, avis de compte).",
    },
    {
      name: 'Vercel et Supabase',
      purpose: "Hébergement de l'application et infrastructure de base de données.",
    },
  ],

  transfersHeading: 'Transferts internationaux',
  transfersBody: [
    "Certains de nos sous-traitants opèrent hors de votre pays, y compris hors de l'Espace économique européen (EEE). Pour les utilisateurs que nous identifions comme situés dans l'EEE, au Royaume-Uni ou en Suisse, nous excluons de l'analyse de votre CV les fournisseurs d'IA ne bénéficiant pas d'une décision d'adéquation reconnue pour cette région (actuellement DeepSeek et Moonshot AI/Kimi) — votre contenu n'est acheminé qu'à des fournisseurs accessibles sous des garanties compatibles avec le RGPD.",
    "Pour les utilisateurs hors EEE, tous les fournisseurs d'IA listés peuvent être utilisés selon la charge et la disponibilité du système.",
  ],

  retentionHeading: 'Combien de temps nous conservons vos données',
  retentionIntro:
    "Nous ne conservons les données que le temps nécessaire à la finalité de leur collecte, ou selon les obligations légales :",
  retentionRows: [
    { category: 'CV sur un compte actif', period: 'Tant que votre compte est actif' },
    { category: 'CV sur un compte inactif', period: "Jusqu'à 730 jours après votre dernière activité, puis suppression" },
    { category: "Journaux de traitement par IA (métriques opérationnelles, déjà dépourvues du contenu du CV)", period: "Jusqu'à 365 jours" },
    { category: "Journal d'audit (registre de conformité et de sécurité)", period: "Jusqu'à 730 jours" },
    { category: 'Enregistrements de paiement/webhook', period: "Jusqu'à 90 jours" },
  ],

  rightsHeading: 'Vos droits et choix',
  rightsIntro:
    "Où que vous soyez, nous proposons ces contrôles directement dans votre compte (Paramètres), sans besoin de nous écrire au préalable :",
  rights: [
    {
      title: 'Exporter vos données',
      body: "Téléchargez une copie de vos CV, de votre historique d'analyses, de vos transactions et de votre activité de compte.",
    },
    {
      title: 'Supprimer votre compte',
      body: 'Supprimez définitivement votre compte et les données personnelles associées. Cette action est irréversible.',
    },
    {
      title: 'Corriger vos informations',
      body: 'Modifiez votre CV, votre profil et les informations de votre compte à tout moment.',
    },
    {
      title: 'Se désabonner des e-mails non essentiels',
      body: "Désabonnez-vous des alertes Radar et autres notifications non essentielles depuis votre compte ou via le lien présent dans l'e-mail.",
    },
  ],

  cookiesHeading: 'Cookies et stockage local',
  cookiesBody: [
    "Nous utilisons un cookie de session pour vous maintenir connecté, et un cookie de préférence/entrée de stockage local pour mémoriser la langue d'interface choisie. Nous n'utilisons pas de traceurs publicitaires tiers.",
  ],

  securityHeading: 'Sécurité',
  securityBody: [
    "Nous utilisons des mesures standard du secteur, comme les connexions chiffrées (HTTPS), les mots de passe hachés et le contrôle d'accès sur notre base de données, pour protéger vos données. Aucun système n'est totalement à l'abri d'un risque, et nous ne pouvons garantir une sécurité absolue — mais nous traitons le contenu des CV comme une donnée personnelle sensible et concevons nos processus pour limiter qui et quoi peut y accéder.",
  ],

  childrenHeading: 'Confidentialité des mineurs',
  childrenBody:
    "GriffoWork s'adresse aux professionnels et aux personnes en recherche d'emploi, et ne s'adresse pas aux personnes de moins de 16 ans. Nous ne collectons pas sciemment de données concernant des mineurs.",

  changesHeading: 'Modifications de cette politique',
  changesBody:
    'Nous pouvons mettre à jour cette page à mesure que le produit ou nos prestataires évoluent. Les modifications importantes mettront à jour la date en haut de cette page.',

  contactHeading: 'Nous contacter',
  contactBody: 'Pour toute question sur cette politique ou vos données, écrivez à {email}.',
}
