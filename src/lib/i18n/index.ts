export type Language = 'pt' | 'en' | 'es'

export interface TranslationDictionary {
  nav: {
    features: string
    social: string
    howItWorks: string
    plans: string
    faq: string
    login: string
    signup: string
    myPanel: string
    freeAnalysis: string
  }
  hero: {
    badge: string
    title1: string
    titleAccent: string
    title2: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
    badgeFree: string
    badgeNoCard: string
    badgeSecurity: string
    badgeSafe: string
  }
  mockup: {
    title: string
    precision: string
    overallScore: string
    atsApproved: string
    atsSub: string
    dim1: string
    dim2: string
    dim3: string
    dim4: string
    suggestionTitle: string
    suggestionText: string
  }
  stats: {
    dimTitle: string
    dimSub: string
    atsTitle: string
    atsSub: string
    globalTitle: string
    globalSub: string
    pdfTitle: string
    pdfSub: string
  }
  social: {
    badge: string
    title: string
    subtitle: string
    card1Title: string
    card1Sub: string
    card2Title: string
    card2Sub: string
    lgpdBadge: string
    optInTitle: string
    linkedInHead: string
    behanceHead: string
    gupyHead: string
    linkedInExample: string
    behanceExample: string
    gupyExample: string
  }
  features: {
    badge: string
    title: string
    subtitle: string
    f1Title: string
    f1Desc: string
    f2Title: string
    f2Desc: string
    f3Title: string
    f3Desc: string
    f4Title: string
    f4Desc: string
    f5Title: string
    f5Desc: string
    f6Title: string
    f6Desc: string
    f7Title: string
    f7Desc: string
    f8Title: string
    f8Desc: string
    f9Title: string
    f9Desc: string
  }
  how: {
    badge: string
    title: string
    subtitle: string
    s1Title: string
    s1Desc: string
    s2Title: string
    s2Desc: string
    s3Title: string
    s3Desc: string
    s4Title: string
    s4Desc: string
    s5Title: string
    s5Desc: string
  }
  pricing: {
    badge: string
    title: string
    subtitle: string
    /// Um produto só. As chaves dos quatro pacotes de crédito
    /// (`entryTitle`/`entryDesc`, `starterTitle`/`starterDesc`,
    /// `carreiraTitle`/`carreiraDesc`, `profTitle`/`profDesc`) saíram junto com
    /// os pacotes: não há mais o que comparar numa tabela.
    productTitle: string
    productDesc: string
    oneTime: string
    includesTitle: string
    /// Os nove itens que UMA compra entrega.
    ///
    /// Espelham `ANALYSIS_DELIVERABLES` em `lib/pricing/catalog.ts`, que é a
    /// fonte de verdade e declara onde cada item é produzido. Duas correções
    /// vieram de lá: a otimização de perfil deixou de ser vendida à parte da
    /// análise de presença digital — é o mesmo trabalho, contado uma vez só — e
    /// os trechos a ajustar no currículo, que a análise sempre produziu e
    /// ninguém anunciava, entraram no lugar.
    items: string[]
    buyCta: string
    previewTitle: string
    previewDesc: string
    previewCta: string
    localPayment: string
    /// Upsell — só renderizado depois da primeira compra.
    packTitle: string
    packDesc: string
    packCta: string
    packPerAnalysis: string
    /// Empresas e RH não têm autosserviço.
    businessTitle: string
    businessDesc: string
    businessCta: string
  }
  faq: {
    badge: string
    title: string
    subtitle: string
    q1: string
    a1: string
    q2: string
    a2: string
    q3: string
    a3: string
    q4: string
    a4: string
    q5: string
    a5: string
  }
  ctaFinal: {
    title: string
    subtitle: string
    button: string
  }
  footer: {
    desc: string
    navTitle: string
    secTitle: string
    contactTitle: string
    rights: string
  }
  auth: {
    welcomeBack: string
    createAccount: string
    loginSub: string
    signupSub: string
    fullName: string
    email: string
    password: string
    profession: string
    loginBtn: string
    signupBtn: string
    noAccount: string
    hasAccount: string
  }
  app: {
    dashboard: string
    upload: string
    analysis: string
    rewrite: string
    downloads: string
    history: string
    plans: string
    settings: string
    admin: string
    /// Saldo de análises completas. Era `credits`/`addCredits`.
    balance: string
    balanceUnit: string
    buyMore: string
    greeting: string
    greetingSub: string
    newResume: string
  }
  /** Tela do Perfil Profissional (`professional-profile-view.tsx`). */
  profile: {
    loadErrorFallback: string
    loadConnectionError: string
    saveMaxLessThanMinError: string
    saveSuccessWithRadarOne: string
    saveSuccessWithRadarMany: string
    saveSuccessNoRadar: string
    saveErrorFallback: string
    saveConnectionError: string
    fillErrorFallback: string
    fillNothingToFill: string
    fillSuccessOne: string
    fillSuccessMany: string
    fillConnectionError: string
    loadingText: string
    cardTitle: string
    cardDesc: string
    fillButton: string
    fillDesc: string
    marketInfoIntro: string
    marketInfoWithMarket: string
    marketInfoWithoutMarket: string
    filledBadge: string
    notInformed: string
    countryGroupAdapted: string
    countryGroupOthers: string
    globalMarketName: string
    removeAria: string
    sectionIdentityTitle: string
    fieldCurrentTitle: string
    placeholderCurrentTitle: string
    fieldArea: string
    placeholderArea: string
    fieldSeniority: string
    fieldYearsExperience: string
    fieldEducation: string
    fieldSpecializations: string
    placeholderSpecializations: string
    fieldSkills: string
    hintSkills: string
    placeholderSkills: string
    sectionObjectivesTitle: string
    fieldTargetRoles: string
    hintTargetRoles: string
    placeholderTargetRoles: string
    fieldTargetFields: string
    placeholderTargetFields: string
    fieldTargetIndustries: string
    placeholderTargetIndustries: string
    fieldCareerGoal: string
    placeholderCareerGoal: string
    sectionLocationTitle: string
    hintLocationIntro: string
    fieldResidenceCountry: string
    hintResidenceCountry: string
    fieldResidenceRegion: string
    fieldResidenceCity: string
    fieldTargetCountry: string
    fieldOtherMarkets: string
    hintOtherMarkets: string
    switchRelocationTitle: string
    switchRelocationDesc: string
    switchRemoteTitle: string
    switchRemoteDesc: string
    sectionPreferencesTitle: string
    fieldWorkModes: string
    fieldContractTypes: string
    hintContractTypes: string
    placeholderContractTypes: string
    fieldWorkload: string
    fieldSalary: string
    hintSalary: string
    placeholderSalaryMin: string
    placeholderSalaryMax: string
    placeholderSalaryPeriod: string
    sectionLanguagesTitle: string
    hintLanguagesIntro: string
    fieldResumeLanguage: string
    fieldCommLanguage: string
    saveButton: string
    seniorityIntern: string
    seniorityJunior: string
    seniorityMid: string
    senioritySenior: string
    seniorityLead: string
    seniorityPrincipal: string
    seniorityDirector: string
    seniorityExecutive: string
    educationNone: string
    educationHighSchool: string
    educationTechnical: string
    educationBachelor: string
    educationPostgrad: string
    educationMaster: string
    educationPhd: string
    workModeRemote: string
    workModeHybrid: string
    workModeOnsite: string
    weeklyHoursFullTime: string
    weeklyHoursPartTime: string
    weeklyHoursFlexible: string
    salaryPeriodYear: string
    salaryPeriodMonth: string
    salaryPeriodHour: string
    languagePt: string
    languageEn: string
    languageEs: string
  }
  /** Tela de Histórico (`history-view.tsx`). */
  history: {
    title: string
    subtitle: string
    newButton: string
    emptyTitle: string
    emptyDesc: string
    emptyButton: string
    statusUploaded: string
    statusAnalyzed: string
    statusRewriteRequested: string
    statusRewritten: string
    statusConfirmed: string
    deleteConfirm: string
    deleteSuccess: string
    deleteError: string
    resumeOf: string
    updatedAt: string
  }
  /** Tela do Painel (`dashboard.tsx`). */
  dashboard: {
    accountLabelActive: string
    accountLabelDefault: string
    greeting: string
    defaultName: string
    subtitle: string
    newResumeButton: string
    activeBadge: string
    planCardDesc: string
    balanceLabel: string
    quickUploadLabel: string
    quickUploadDesc: string
    quickViewLabel: string
    quickViewDesc: string
    quickRewriteLabel: string
    quickRewriteDesc: string
    quickDownloadsLabel: string
    quickDownloadsDesc: string
    statIssuedReports: string
    statImprovedResumes: string
    historyTitle: string
    historySubtitle: string
    historyViewAll: string
    syncing: string
    emptyTitle: string
    emptyDesc: string
    emptyButton: string
    reportOf: string
    lastUpdated: string
    statusUploaded: string
    statusAnalyzed: string
    statusRewriteRequested: string
    statusRewritten: string
    statusConfirmed: string
  }
  /** Tela de Configurações (`settings-view.tsx`). */
  settings: {
    title: string
    subtitle: string
    profileCardTitle: string
    profileCardDesc: string
    emailLabel: string
    emailHint: string
    nameLabel: string
    professionLabel: string
    professionPlaceholder: string
    socialLabel: string
    addProfileButton: string
    socialHint: string
    socialUrlPlaceholder: string
    saveButton: string
    saveErrorFallback: string
    saveSuccess: string
    planCardTitle: string
    planCardDesc: string
    planFree: string
    planDay: string
    planMonthly: string
    planAnnual: string
    planUnknown: string
    planExpiresAt: string
    viewPlansButton: string
    marketplaceCardTitle: string
    marketplacePhaseBadge: string
    marketplaceCardDesc: string
    marketplaceAlert: string
    optInTitle: string
    optInDesc: string
    optInAcceptedToast: string
    optOutToast: string
    optInErrorToast: string
    visibleTitle: string
    visibleDesc: string
    consentNote: string
    securityCardTitle: string
    securityCardDesc: string
    securityPassword: string
    securitySession: string
    securityResumes: string
    securityAudit: string
    logoutTitle: string
    logoutDesc: string
    logoutButton: string
  }
  /** Tela de Suporte (`support-view.tsx`). */
  support: {
    pageTitle: string
    pageSubtitle: string
    welcomeMessage: string
    faq1: string
    faq2: string
    faq3: string
    faq4: string
    faq5: string
    botFallback: string
    connectionError: string
    faqSectionTitle: string
    chatHeaderTitle: string
    chatStatus: string
    officialBadge: string
    typingIndicator: string
    inputPlaceholder: string
  }
  /** Tela de Downloads (`downloads-view.tsx`). */
  downloads: {
    pageTitle: string
    pageSubtitle: string
    lockedAlert: string
    lockedAlertCta: string
    emptyTitle: string
    emptyDesc: string
    emptyCta: string
    selectResumeTitle: string
    resumeLabel: string
    updatedAt: string
    analysisCardTitle: string
    analysisCardDesc: string
    analysisFirstCta: string
    analysisDownloadCta: string
    rewriteCardTitle: string
    rewriteCardDesc: string
    rewriteFirstCta: string
    rewriteDownloadPdf: string
    rewriteDownloadTxt: string
    rewriteDownloadMd: string
    socialCardTitle: string
    socialCardDesc: string
    socialFirstCta: string
    socialDownloadTxt: string
    socialDownloadMd: string
    infoAnalysisPdf: string
    infoAnalysisPdfDesc: string
    infoRewrite: string
    infoRewriteDesc: string
    infoSocial: string
    infoSocialDesc: string
    errorNeedsPlan: string
    errorNeedsAnalysis: string
    errorGeneric: string
    errorDownload: string
    downloadStarted: string
  }
  /** Tela de Reescrita (`rewrite-view.tsx`) — só o chrome estático; o currículo reescrito é conteúdo gerado pela IA. */
  rewrite: {
    downloadGenericError: string
    downloadSuccess: string
    downloadConnectionError: string
    authRequiredError: string
    planRequiredError: string
    planRequiredToast: string
    rewriteErrorFallback: string
    rewriteSuccessToast: string
    rewriteConnectionError: string
    confirmSuccessToast: string
    rejectInfoToast: string
    emptyTitle: string
    emptyDesc: string
    emptyCta: string
    needsAnalysisTitle: string
    needsAnalysisDesc: string
    needsAnalysisCta: string
    pageTitle: string
    pageSubtitle: string
    viewReportCta: string
    authCardTitle: string
    authCardDesc: string
    willDoTitle: string
    willDo1: string
    willDo2: string
    willDo3: string
    willNotTitle: string
    willNot1: string
    willNot2: string
    willNot3: string
    authorizeLabel: string
    rewritingButton: string
    rewriteButton: string
    successCardTitle: string
    successCardDesc: string
    keywordsCardTitle: string
    keywordsCardDesc: string
    copyKeywordsCta: string
    copyKeywordsToast: string
    viewRewrittenCta: string
    viewOriginalCta: string
    regenerateCta: string
    downloadPdfCta: string
    downloadTxtCta: string
    downloadMdCta: string
    originalBadge: string
    rewrittenBadge: string
    finalReviewTitle: string
    finalReviewDesc: string
    confirmCta: string
    discardCta: string
    confirmedTitle: string
    confirmedDesc: string
    goToDownloadsCta: string
  }
  /**
   * Tela do Radar (`radar-view.tsx`). Só chrome estático: título da vaga,
   * empresa, justificativas de compatibilidade e o resumo do digest são
   * dado de terceiro ou saída da IA — ficam de fora, ver §2.28/§2.31.
   */
  radar: {
    loadingText: string
    loadErrorFallback: string
    loadConnectionError: string
    cardDesc: string
    runNowButton: string
    runNowTooltip: string
    preferencesButton: string
    freqLabel: string
    freqImmediate: string
    freqDaily: string
    freqWeekly: string
    freqOff: string
    minFitLabel: string
    minFitStrong: string
    minFitGood: string
    minFitPartial: string
    silentByDefault: string
    lastRun: string
    prepareErrorFallback: string
    prepareRedirected: string
    prepareSuccess: string
    prepareConnectionError: string
    runSuccessOne: string
    runSuccessMany: string
    runNothingNew: string
    runErrorFallback: string
    runConnectionError: string
    savePrefsErrorFallback: string
    savePrefsConnectionError: string
    feedbackInterestedToast: string
    feedbackNotUsefulToast: string
    feedbackError: string
    invalidLinkError: string
    needsProfileTitle: string
    needsProfileDesc: string
    needsProfileButton: string
    notMatchableTitle: string
    notMatchableP1Prefix: string
    notMatchableP1Bold: string
    notMatchableP1Suffix: string
    notMatchableP2Prefix: string
    notMatchableP2Bold: string
    notMatchableP2Mid: string
    notMatchableP2Em: string
    notMatchableP2Suffix: string
    notMatchableButton: string
    emptyTitle: string
    emptyDesc: string
    emptyHintPrefix: string
    emptyHintBold: string
    emptyHintSuffix: string
    digestStrong: string
    digestGood: string
    digestPartial: string
    fitReadErrorFallback: string
    compatibilityBadge: string
    compatAlta: string
    compatBoa: string
    compatParcial: string
    compatBaixa: string
    whyRecommendedTitle: string
    attentionTitle: string
    blockersTitle: string
    viewJobButton: string
    prepareResumeButton: string
    feedbackInterestedNote: string
    feedbackNotUsefulNote: string
    feedbackWhatWrong: string
    reasonWrongRole: string
    reasonLocation: string
    reasonSalary: string
    reasonSeniority: string
    reasonSkills: string
    reasonCompany: string
    reasonWorkMode: string
    reasonOther: string
    feedbackAskUseful: string
    feedbackYes: string
    feedbackNo: string
  }
  /** Tela de Envio de Currículo (`upload-view.tsx`). */
  upload: {
    jobUrlEmptyError: string
    jobImportedTitleFallback: string
    jobImportedSuccess: string
    jobImportErrorFallback: string
    jobImportConnectionError: string
    fileTooLargeError: string
    pdfAttachedSuccess: string
    pdfReadError: string
    fileReadError: string
    contentTooShortError: string
    contentTooLongError: string
    loadingStepUpload: string
    loadingStepPreview: string
    saveErrorFallback: string
    saveSuccess: string
    saveConnectionError: string
    heroTitle: string
    heroDesc: string
    badge1Title: string
    badge1Desc: string
    badge2Title: string
    badge2Desc: string
    badge3Title: string
    badge3Desc: string
    badge4Title: string
    badge4Desc: string
    cardTitle: string
    cardDesc: string
    attachButton: string
    contentLabel: string
    contentPlaceholder: string
    charCountUnit: string
    formatMarkdown: string
    formatText: string
    formatToggle: string
    targetJobLabel: string
    targetJobBadge: string
    importUrlLabel: string
    importUrlPlaceholder: string
    importUrlButton: string
    targetJobPlaceholder: string
    targetJobDescLabel: string
    targetJobDescPlaceholder: string
    socialTitle: string
    socialDesc: string
    addProfileButton: string
    platformPlaceholder: string
    profileUrlPlaceholder: string
    removeProfileTitle: string
    consentText: string
    secureEnvBadge: string
    cancelButton: string
    submitButtonLoading: string
    submitButton: string
    whatWillBeAnalyzedLabel: string
    whatWillBeAnalyzedDesc: string
  }
  /**
   * Tela do Laudo (`analysis-view.tsx`). Só o chrome estático — título de
   * seção, rótulo, botão, estado vazio/erro. O corpo do laudo (parecer,
   * justificativas por dimensão, orientação vocacional, carta) é gerado pela
   * IA por usuário e fica em português; traduzir isso exigiria rodar a
   * análise de novo no idioma do usuário, fora do escopo desta tela.
   */
  analysis: {
    loadingText: string
    notFoundText: string
    uploadButton: string
    loadErrorFallback: string
    connectionError: string
    reportTitle: string
    startingAnalysis: string
    processingAuto: string
    retryButton: string
    orientationSuccess: string
    orientationErrorFallback: string
    orientationConnectionError: string
    letterSuccess: string
    letterErrorFallback: string
    letterConnectionError: string
    copiedTemplate: string
    copyErrorFallback: string
    dimRelevanceToRole: string
    dimExperienceImpact: string
    dimClarityFormatting: string
    dimAtsOptimization: string
    dimKeywordIntegration: string
    dimStructure: string
    dimSummary: string
    dimImpact: string
    dimSkills: string
    dimExperience: string
    dimKeywords: string
    dimCareer: string
    dimUpskilling: string
    dimEducation: string
    dimLanguage: string
    tabAll: string
    tabOverview: string
    tabSocial: string
    tabMatch: string
    tabCareer: string
    tabLetter: string
    tabDimensions: string
    tabTargeted: string
    scoreNotEvaluated: string
    atsApprovedSticky: string
    atsRejectedSticky: string
    atsNotEvaluatedSticky: string
    viewFullReport: string
    scoreAuditLabel: string
    atsPass: string
    atsFail: string
    atsNotEvaluated: string
    calcDimensionsLabel: string
    algorithmicAverage: string
    noDimensionScores: string
    scoreLabelNotEvaluated: string
    scoreLabelExcellent: string
    scoreLabelGood: string
    scoreLabelRegular: string
    scoreLabelNeedsImprovement: string
    performanceByDimension: string
    noChartData: string
    executiveTitle: string
    executiveDesc: string
    noSummaryFallback: string
    strengthsTitle: string
    noStrengths: string
    weaknessesTitle: string
    noWeaknesses: string
    recommendationsTitle: string
    recommendationsDesc: string
    keywordsTitle: string
    keywordsDesc: string
    matchTitle: string
    matchTargetJobPrefix: string
    matchNoTargetJob: string
    matchScoreLabel: string
    matchVerdictLabel: string
    matchedReqTitle: string
    noMatchedReq: string
    missingReqTitle: string
    noMissingReq: string
    actionPlanLabel: string
    matchToneIncompatibleHeadline: string
    matchToneIncompatibleDetail: string
    matchTonePartialHeadline: string
    matchTonePartialDetail: string
    matchToneAlignedHeadline: string
    matchToneAlignedDetail: string
    dimensionsDetailTitle: string
    dimensionsDetailDesc: string
    noTargetedTitle: string
    noTargetedDesc: string
    targetedTitle: string
    targetedDesc: string
    currentTextLabel: string
    suggestedTextLabel: string
    rationaleLabel: string
    careerTitle: string
    careerDesc: string
    updateDiagnosisButton: string
    discoverAreaButton: string
    mappingAreas: string
    careerTimeEstimate: string
    profileSummaryLabel: string
    optionLabel: string
    adherenceLabel: string
    recommendedSkillsLabel: string
    adherenceDisclaimer: string
    careerAdviceLabel: string
    letterTitle: string
    letterDesc: string
    regenerateLetterButton: string
    writeLetterButton: string
    writingLetterText: string
    letterTimeEstimate: string
    letterEmptyState: string
    letterTargetedTo: string
    summaryLabel: string
    copyButton: string
    summaryFootnote: string
    letterLabel: string
    letterKeywordsLabel: string
    ctaTitle: string
    ctaDesc: string
    ctaButton: string
  }
}

export const DICTIONARIES: Record<Language, TranslationDictionary> = {
  pt: {
    nav: {
      features: 'Recursos',
      social: 'Presença Digital',
      howItWorks: 'Como funciona',
      plans: 'Planos',
      faq: 'Dúvidas',
      login: 'Entrar',
      signup: 'Analisar grátis',
      myPanel: 'Meu painel',
      freeAnalysis: 'Analisar grátis',
    },
    hero: {
      badge: 'IA + Padrões Gupy, LinkedIn & Recrutamento Global',
      title1: 'Destaque seu ',
      titleAccent: 'currículo',
      title2: ' e conquiste as melhores vagas.',
      subtitle: 'Envie seu currículo em segundos e receba uma avaliação técnica aprofundada em 8 dimensões. Descubra sua compatibilidade com filtros ATS (Gupy, Workday, Taleo) e receba orientações estratégicas para otimizar seus perfis profissionais.',
      ctaPrimary: 'Analisar meu currículo agora',
      ctaSecondary: 'Já tenho conta',
      badgeFree: 'Análise Gratuita',
      badgeNoCard: 'Sem Cartão de Crédito',
      badgeSecurity: 'LGPD & GDPR',
      badgeSafe: '100% Seguro & Confidencial',
    },
    mockup: {
      title: 'Relatório Técnico de Avaliação',
      precision: 'ALTA PRECISÃO',
      overallScore: 'Nota Geral de Qualificação',
      atsApproved: 'Aprovado em ATS',
      atsSub: 'Compatível com Gupy, Workday & Taleo',
      dim1: 'Estrutura & Leitura Automática (ATS)',
      dim2: 'Impacto e Métricas de Resultados',
      dim3: 'Alinhamento de Palavras-Chave de Mercado',
      dim4: 'Trajetória & Posicionamento Profissional',
      suggestionTitle: 'Sugestão de Headline Otimizada (LinkedIn / Plataformas)',
      suggestionText: '"Especialista em Gestão de Projetos & Transformação Digital | Metodologias Ágeis | Foco em Eficiência Operacional e Resultados"',
    },
    stats: {
      dimTitle: '8 Dimensões',
      dimSub: 'Avaliação técnica de currículo',
      atsTitle: 'Compatibilidade ATS',
      atsSub: 'Verificação para filtros de recrutamento',
      globalTitle: 'Perfis Estratégicos',
      globalSub: 'LinkedIn, GitHub, Behance e portfólios',
      pdfTitle: 'PDF & Editável',
      pdfSub: 'Versão reescrita pronta para envio',
    },
    social: {
      badge: 'Presença Digital & Posicionamento Global',
      title: 'Sua carreira vai além do papel. Otimize seus perfis em qualquer plataforma.',
      subtitle: 'Com o GriffoWork, você fortalece sua apresentação profissional tanto no currículo quanto nas principais redes e plataformas estratégicas do mercado.',
      card1Title: 'LinkedIn & Plataformas de Vagas',
      card1Sub: "Sugestões de Título (Headline), resumo profissional e termos estratégicos para atrair recrutadores.",
      card2Title: 'Portfólios & Redes Especializadas',
      card2Sub: 'Recomendações para GitHub, Behance, Stack Overflow, Kaggle, Xing e portfólios profissionais.',
      lgpdBadge: 'LGPD & GDPR',
      optInTitle: 'Recomendações com Autorização do Usuário',
      linkedInHead: 'LinkedIn — Título Profissional Estratégico',
      behanceHead: 'Portfólio / Behance — Destaque de Impacto',
      gupyHead: 'Plataformas ATS — Palavras-Chave de Triagem',
      linkedInExample: '"Líder de Operações & Eficiência | Gestão de Equipes Multidisciplinares | Otimização de Processos e Escala"',
      behanceExample: '"Destaque estudos de caso com métricas de impacto real (ex.: \'Redesenho de fluxo que elevou a conversão em +35%\') logo na abertura do portfólio."',
      gupyExample: '"Alinhamento estratégico com as competências e palavras-chave mais buscadas pelos recrutadores para a sua área."',
    },
    features: {
      badge: 'Recursos Completos',
      title: 'Tudo o que você precisa para se destacar nas seleções.',
      subtitle: 'Desenvolvido com base nas melhores práticas de Recursos Humanos, padrões internacionais e critérios de triagem profissional.',
      f1Title: 'Avaliação em 8 Dimensões',
      f1Desc: 'Análise minuciosa de estrutura, resumo profissional, clareza de resultados, competências-chave, compatibilidade ATS e coerência de carreira.',
      f2Title: 'Compatibilidade com Sistemas ATS',
      f2Desc: 'Avaliamos a legibilidade e formatação do seu currículo para garantir que seja processado perfeitamente pelos robôs de triagem das empresas.',
      f3Title: 'Reescrita Profissional',
      f3Desc: 'Com a sua autorização, transformamos as descrições das suas experiências para destacar conquistas e impacto real, mantendo 100% da veracidade da sua história.',
      f4Title: 'Otimização de Presença Digital',
      f4Desc: 'Orientações personalizadas para seus perfis no LinkedIn, GitHub, Behance e plataformas de recrutamento para aumentar sua visibilidade.',
      f5Title: 'Download em PDF e Formato Editável',
      f5Desc: 'Exporte seu currículo atualizado e o laudo completo em PDF elegante e formato de texto editável para personalizar quando quiser.',
      f6Title: 'Privacidade & Segurança Total',
      f6Desc: 'Seus dados são protegidos com criptografia e em estrita conformidade com a LGPD e GDPR. Nunca compartilhamos suas informações com terceiros.',
      f7Title: 'Radar de Vagas com IA',
      f7Desc: 'Monitoramos milhares de vagas por dia e avisamos só quando encontramos uma que realmente combina com seu perfil — sem spam, sem vaga genérica.',
      f8Title: 'Orientação de Carreira',
      f8Desc: 'Diagnóstico vocacional que aponta as áreas e cargos onde sua trajetória tem mais força, com caminhos concretos para os próximos passos.',
      f9Title: 'Carta de Apresentação Direcionada',
      f9Desc: 'Uma carta escrita para a vaga específica, destacando os requisitos que você atende — pronta para enviar junto do currículo.',
    },
    how: {
      badge: 'Passo a Passo',
      title: 'Do envio ao currículo otimizado em 5 passos simples.',
      subtitle: 'Rápido, intuitivo e com total controle seu em cada etapa.',
      s1Title: 'Envie o Currículo',
      s1Desc: 'Anexe seu arquivo PDF, documento de texto ou cole diretamente o conteúdo.',
      s2Title: 'Informe seus Perfis (Opcional)',
      s2Desc: 'Insira opcionalmente seus links profissionais (LinkedIn, GitHub, portfólio, etc.).',
      s3Title: 'Receba a Avaliação',
      s3Desc: 'Confira a pontuação de 0 a 10 nas 8 dimensões, com pontos fortes e oportunidades de evolução.',
      s4Title: 'Solicite a Reescrita',
      s4Desc: 'Com um clique, autorize a reestruturação profissional focada em impacto e resultados.',
      s5Title: 'Baixe e Candidate-se',
      s5Desc: 'Baixe a versão final em PDF ou editável, pronta para aplicar em vagas imediatamente.',
    },
    pricing: {
      badge: 'Pagamento único, sem assinatura',
      title: 'Uma compra. O laudo inteiro.',
      subtitle: 'Envie seu currículo, veja sua pontuação gratuitamente e desbloqueie o laudo completo quando quiser. Sem mensalidades, sem fidelidade e sem renovação automática.',
      productTitle: 'Análise Completa',
      productDesc: 'Nove entregas em uma compra só, para o currículo que você escolher.',
      oneTime: 'Pagamento único. Sem assinatura e sem renovação automática.',
      includesTitle: 'O que você recebe',
      items: [
        'Laudo das 8 Dimensões',
        'Comparação com a Vaga Alvo',
        'Trechos a Ajustar no Currículo',
        'Reescrita de Experiências (STAR/XYZ)',
        'Orientação Profissional',
        'Presença Digital e Otimização de Perfil',
        'Carta de Apresentação',
        'Resumo Profissional',
        'Download em PDF',
      ],
      buyCta: 'Comprar Análise Completa',
      previewTitle: 'Veja sua nota de graça',
      previewDesc: 'Envie o currículo e receba as notas de 0 a 10 nas 8 dimensões, sem pagar nada. Uma prévia por conta.',
      previewCta: 'Ver minha nota grátis',
      localPayment: 'Pague em {currency} com {methods}.',
      packTitle: 'Vai se candidatar a mais vagas?',
      packDesc: '5 Análises Completas, uma para cada currículo ou vaga que você quiser trabalhar.',
      packCta: 'Comprar 5 análises por {price}',
      packPerAnalysis: '{price} por análise',
      businessTitle: 'Empresas e RH',
      businessDesc: 'Volume, faturamento e soluções corporativas para processos seletivos.',
      businessCta: 'Falar com a equipe comercial',
    },
    faq: {
      badge: 'Perguntas Frequentes',
      title: 'Ficou com alguma dúvida?',
      subtitle: 'Respostas diretas para as perguntas mais comuns dos nossos usuários.',
      q1: 'Como funciona a verificação de compatibilidade com sistemas ATS (Gupy, Workday, Taleo)?',
      a1: 'Nossa inteligência avalia a estrutura, legibilidade de seções, hierarquia de cabeçalhos e densidade de termos técnicos do seu documento segundo os critérios dos principais sistemas de triagem utilizados por grandes empresas.',
      q2: 'A IA inventa informações ou experiências no meu currículo?',
      a2: 'Não. O GriffoWork segue uma diretriz rígida de veracidade: mantemos 100% das suas empresas, cargos, datas e formação reais. A IA reestrutura a escrita para valorizar suas conquistas reais com o máximo de clareza e impacto.',
      q3: 'Como funciona a otimização de perfis (LinkedIn, GitHub, Behance)?',
      a3: 'Se você fornecer os links dos seus perfis com sua autorização, geramos títulos otimizados (Headlines), resumos estratégicos e sugestões de posicionamento para atrair mais recrutadores no seu mercado.',
      q4: 'Meus dados e meu currículo estão seguros?',
      a4: 'Totalmente. Trabalhamos em conformidade rigorosa com a LGPD e GDPR. Seus dados são criptografados e nunca são compartilhados ou comercializados com terceiros.',
      q5: 'Preciso assinar alguma coisa ou pagar mensalidade?',
      a5: 'Não. Você paga uma única vez pela Análise Completa daquele currículo e recebe todas as entregas. Não há mensalidade, renovação automática nem saldo para administrar — transparência total.',
    },
    ctaFinal: {
      title: 'Pronto para transformar sua apresentação profissional?',
      subtitle: 'Crie sua conta gratuita agora e receba a avaliação técnica do seu currículo em poucos segundos. Sem cartão de crédito.',
      button: 'Analisar meu currículo grátis',
    },
    footer: {
      desc: 'Plataforma de Inteligência de Carreira e otimização de presença digital baseada nos melhores padrões de recrutamento.',
      navTitle: 'Navegação',
      secTitle: 'Segurança & Privacidade',
      contactTitle: 'Contato & Domínio Oficial',
      rights: 'GriffoWork. Todos os direitos reservados. Em conformidade com a LGPD e GDPR.',
    },
    auth: {
      welcomeBack: 'Bem-vindo de volta',
      createAccount: 'Crie sua conta',
      loginSub: 'Entre para acessar seus laudos.',
      signupSub: 'Análise gratuita. Sem cartão de crédito.',
      fullName: 'Nome completo',
      email: 'E-mail ou Usuário',
      password: 'Sua senha',
      profession: 'Cargo ou Profissão (Opcional)',
      loginBtn: 'Entrar na minha conta',
      signupBtn: 'Criar minha conta grátis',
      noAccount: 'Ainda não tem uma conta? Cadastre-se grátis',
      hasAccount: 'Já possui uma conta? Faça login',
    },
    app: {
      dashboard: 'Painel',
      upload: 'Enviar currículo',
      analysis: 'Laudo',
      rewrite: 'Reescrita',
      downloads: 'Downloads',
      history: 'Histórico',
      plans: 'Comprar Análise',
      settings: 'Configurações',
      admin: 'Área Admin',
      balance: 'Análises',
      balanceUnit: 'análises disponíveis',
      buyMore: '+ Comprar',
      greeting: 'Olá',
      greetingSub: 'Aqui está o resumo da sua atividade no GriffoWork.',
      newResume: 'Novo currículo',
    },
    profile: {
      loadErrorFallback: 'Não foi possível carregar o perfil.',
      loadConnectionError: 'Falha de conexão ao carregar o perfil.',
      saveMaxLessThanMinError: 'A pretensão máxima não pode ser menor que a mínima.',
      saveSuccessWithRadarOne: 'Perfil salvo. O Radar encontrou {n} oportunidade — veja na tela Radar.',
      saveSuccessWithRadarMany: 'Perfil salvo. O Radar encontrou {n} oportunidades — veja na tela Radar.',
      saveSuccessNoRadar: 'Perfil profissional salvo.',
      saveErrorFallback: 'Não foi possível salvar o perfil.',
      saveConnectionError: 'Falha de conexão ao salvar o perfil.',
      fillErrorFallback: 'Não foi possível ler seu currículo agora.',
      fillNothingToFill: 'Nada a preencher: os campos que eu saberia responder já estão preenchidos.',
      fillSuccessOne: '{n} campo preenchido. Revise e salve.',
      fillSuccessMany: '{n} campos preenchidos. Revise e salve.',
      fillConnectionError: 'Falha de conexão ao ler seu currículo.',
      loadingText: 'Carregando seu perfil profissional...',
      cardTitle: 'Perfil Profissional',
      cardDesc: 'É a partir daqui que o Griffo entende quem você é profissionalmente e para qual mercado deve trabalhar. Preencha aos poucos — nada é obrigatório.',
      fillButton: 'Preencher com o que já sei sobre você',
      fillDesc: 'Lê seu último currículo e seu diagnóstico vocacional e preenche só os campos vazios. Nada é salvo até você conferir e clicar em salvar.',
      marketInfoIntro: 'O mercado que você declara aqui muda as recomendações: quais sistemas de triagem citamos, o formato esperado do currículo e o vocabulário dos cargos.',
      marketInfoWithMarket: 'Hoje suas análises usam {market}.',
      marketInfoWithoutMarket: 'Sem mercado declarado, usamos seu país de acesso como palpite.',
      filledBadge: 'Preenchido',
      notInformed: 'Não informado',
      countryGroupAdapted: 'Com adaptação própria',
      countryGroupOthers: 'Demais países',
      globalMarketName: 'Global / Remoto internacional',
      removeAria: 'Remover {value}',
      sectionIdentityTitle: 'Identidade profissional',
      fieldCurrentTitle: 'Cargo atual',
      placeholderCurrentTitle: 'Ex: Analista de Dados',
      fieldArea: 'Área de atuação',
      placeholderArea: 'Ex: Dados & Analytics',
      fieldSeniority: 'Senioridade',
      fieldYearsExperience: 'Anos de experiência',
      fieldEducation: 'Formação',
      fieldSpecializations: 'Especializações',
      placeholderSpecializations: 'Ex: Modelagem dimensional',
      fieldSkills: 'Competências',
      hintSkills: 'As ferramentas e habilidades que você quer que apareçam nas recomendações.',
      placeholderSkills: 'Ex: SQL',
      sectionObjectivesTitle: 'Objetivos',
      fieldTargetRoles: 'Cargos-alvo',
      hintTargetRoles: 'Os cargos que você quer disputar — não necessariamente o que você faz hoje.',
      placeholderTargetRoles: 'Ex: Data Analyst',
      fieldTargetFields: 'Áreas-alvo',
      placeholderTargetFields: 'Ex: Produto',
      fieldTargetIndustries: 'Setores de interesse',
      placeholderTargetIndustries: 'Ex: Saúde',
      fieldCareerGoal: 'Trajetória desejada',
      placeholderCareerGoal: 'Para onde você quer levar sua carreira nos próximos anos?',
      sectionLocationTitle: 'Onde você está e onde quer trabalhar',
      hintLocationIntro: 'São perguntas diferentes de propósito. Morar num país não significa querer trabalhar nele.',
      fieldResidenceCountry: 'País onde mora',
      hintResidenceCountry: 'Os países do primeiro grupo têm adaptação própria — formato de currículo, tipos de contrato, sistemas de triagem. Os demais usam o padrão internacional.',
      fieldResidenceRegion: 'Estado / região',
      fieldResidenceCity: 'Cidade',
      fieldTargetCountry: 'País onde quer trabalhar',
      fieldOtherMarkets: 'Outros países onde você também aceitaria trabalhar',
      hintOtherMarkets: 'Marque quantos quiser. Deixe tudo desmarcado se só quer o país principal.',
      switchRelocationTitle: 'Disponível para mudar de país',
      switchRelocationDesc: 'Aceita se mudar fisicamente para outro país.',
      switchRemoteTitle: 'Aceita trabalho remoto internacional',
      switchRemoteDesc: 'Trabalhar de onde mora para uma empresa de outro país. Não é o mesmo que mudar de país.',
      sectionPreferencesTitle: 'Preferências de trabalho',
      fieldWorkModes: 'Modelos de trabalho aceitos',
      fieldContractTypes: 'Tipos de contrato aceitos',
      hintContractTypes: 'No vocabulário do seu mercado: CLT, PJ, CDI, W-2, contractor...',
      placeholderContractTypes: 'Ex: CLT',
      fieldWorkload: 'Jornada',
      fieldSalary: 'Pretensão salarial',
      hintSalary: 'Na moeda do mercado que você mira. Não tem relação com a moeda em que você paga pelas análises — essa é definida pelo seu meio de pagamento.',
      placeholderSalaryMin: 'Mínimo',
      placeholderSalaryMax: 'Máximo',
      placeholderSalaryPeriod: 'Período',
      sectionLanguagesTitle: 'Idiomas',
      hintLanguagesIntro: 'O idioma da tela não decide o idioma do seu currículo. Se você mira outro país, provavelmente são diferentes.',
      fieldResumeLanguage: 'Idioma do currículo e da carta',
      fieldCommLanguage: 'Idioma dos avisos por e-mail',
      saveButton: 'Salvar perfil',
      seniorityIntern: 'Estágio',
      seniorityJunior: 'Júnior',
      seniorityMid: 'Pleno',
      senioritySenior: 'Sênior',
      seniorityLead: 'Líder / Coordenação',
      seniorityPrincipal: 'Especialista / Principal',
      seniorityDirector: 'Diretoria',
      seniorityExecutive: 'Executivo (C-level)',
      educationNone: 'Sem formação declarada',
      educationHighSchool: 'Ensino médio',
      educationTechnical: 'Técnico',
      educationBachelor: 'Graduação',
      educationPostgrad: 'Pós-graduação',
      educationMaster: 'Mestrado',
      educationPhd: 'Doutorado',
      workModeRemote: 'Remoto',
      workModeHybrid: 'Híbrido',
      workModeOnsite: 'Presencial',
      weeklyHoursFullTime: 'Tempo integral',
      weeklyHoursPartTime: 'Meio período',
      weeklyHoursFlexible: 'Flexível',
      salaryPeriodYear: 'por ano',
      salaryPeriodMonth: 'por mês',
      salaryPeriodHour: 'por hora',
      languagePt: 'Português',
      languageEn: 'Inglês',
      languageEs: 'Espanhol',
    },
    history: {
      title: 'Histórico',
      subtitle: 'Todos os currículos que você enviou.',
      newButton: 'Novo',
      emptyTitle: 'Nenhum currículo enviado',
      emptyDesc: 'Seu histórico aparecerá aqui.',
      emptyButton: 'Enviar currículo',
      statusUploaded: 'Enviado',
      statusAnalyzed: 'Analisado',
      statusRewriteRequested: 'Reescrita solicitada',
      statusRewritten: 'Reescrito',
      statusConfirmed: 'Confirmado',
      deleteConfirm: 'Excluir este currículo permanentemente? Esta ação não pode ser desfeita.',
      deleteSuccess: 'Currículo excluído.',
      deleteError: 'Falha ao excluir.',
      resumeOf: 'Currículo de {date}',
      updatedAt: 'Atualizado em {date}',
    },
    dashboard: {
      accountLabelActive: 'Análise Completa disponível',
      accountLabelDefault: 'Conta Griffo',
      greeting: 'Olá, {name} 👋',
      defaultName: 'candidato(a)',
      subtitle: 'Bem-vindo(a) ao seu painel executivo GriffoWork.',
      newResumeButton: 'Novo currículo',
      activeBadge: 'Ativo',
      planCardDesc: 'Uma compra libera a Análise Completa de um currículo: laudo das 8 dimensões, comparação com a vaga, trechos a ajustar, reescrita, orientação, presença digital, carta, resumo e PDF.',
      balanceLabel: 'Análises Disponíveis',
      quickUploadLabel: 'Enviar currículo',
      quickUploadDesc: 'Cole ou anexe',
      quickViewLabel: 'Ver laudo',
      quickViewDesc: 'Análise 0–10',
      quickRewriteLabel: 'Reescrever',
      quickRewriteDesc: 'Com sua autorização',
      quickDownloadsLabel: 'Downloads',
      quickDownloadsDesc: 'PDF e Markdown',
      statIssuedReports: 'Laudos Emitidos',
      statImprovedResumes: 'Currículos Aprimorados',
      historyTitle: 'Histórico de Processamento',
      historySubtitle: 'Seus últimos currículos processados pela inteligência artificial',
      historyViewAll: 'Ver histórico completo',
      syncing: 'Sincronizando dados…',
      emptyTitle: 'Nenhum currículo em auditoria',
      emptyDesc: 'Inicie uma auditoria gratuita agora para descobrir as fragilidades e o potencial do seu currículo com base nas métricas das big techs.',
      emptyButton: 'Iniciar Auditoria IA',
      reportOf: 'Laudo de {date}',
      lastUpdated: 'Última atualização: {date}',
      statusUploaded: 'Enviado',
      statusAnalyzed: 'Analisado',
      statusRewriteRequested: 'Reescrita solicitada',
      statusRewritten: 'Reescrito',
      statusConfirmed: 'Confirmado',
    },
    settings: {
      title: 'Configurações',
      subtitle: 'Gerencie seu perfil, privacidade e preferências.',
      profileCardTitle: 'Perfil',
      profileCardDesc: 'Informações básicas da sua conta',
      emailLabel: 'E-mail',
      emailHint: 'O e-mail não pode ser alterado.',
      nameLabel: 'Nome completo',
      professionLabel: 'Profissão',
      professionPlaceholder: 'Ex: Desenvolvedora Front-end',
      socialLabel: 'Redes Sociais & Perfis Profissionais (Padrão para Análise)',
      addProfileButton: 'Adicionar perfil',
      socialHint: 'Cadastre aqui os links do seu LinkedIn, Gupy, GitHub, etc. Eles serão preenchidos automaticamente em todas as novas análises.',
      socialUrlPlaceholder: 'Link do seu perfil ({platform})',
      saveButton: 'Salvar alterações',
      saveErrorFallback: 'Falha ao salvar.',
      saveSuccess: 'Perfil e redes sociais salvas com sucesso!',
      planCardTitle: 'Plano atual',
      planCardDesc: 'Sua assinatura atual',
      planFree: 'Gratuito',
      planDay: 'Passe Diário',
      planMonthly: 'Mensal',
      planAnnual: 'Anual',
      planUnknown: '—',
      planExpiresAt: 'Expira em {date}',
      viewPlansButton: 'Ver planos',
      marketplaceCardTitle: 'Marketplace de talentos',
      marketplacePhaseBadge: 'Fase 2',
      marketplaceCardDesc: 'Controle se recrutadores parceiros podem te encontrar',
      marketplaceAlert: 'Recrutadores verificados poderão buscar candidatos por score, dimensões de força e palavras-chave. Você está no controle: pode ativar ou desativar a qualquer momento. Dados sensíveis (e-mail, telefone) só aparecem após você aceitar um match.',
      optInTitle: 'Aparecer em buscas de recrutadores',
      optInDesc: 'Seus laudos (sem dados sensíveis) ficam visíveis para recrutadores parceiros verificados.',
      optInAcceptedToast: 'Você aceitou aparecer para recruiters parceiros (Fase 2). Seus dados sensíveis só serão liberados após match aceito.',
      optOutToast: 'Opt-out feito. Você não aparecerá em buscas de recrutadores.',
      optInErrorToast: 'Erro ao salvar preferência.',
      visibleTitle: 'Perfil público para matches',
      visibleDesc: 'Permite que recrutadores vejam seu nome e profissão (não contato) quando houver match por palavras-chave.',
      consentNote: 'Você pode revogar consentimento a qualquer momento. Em conformidade com a LGPD (Lei nº 13.709/2018).',
      securityCardTitle: 'Segurança',
      securityCardDesc: 'Sua senha está protegida com hash scrypt e sal único',
      securityPassword: 'Senha: hash scrypt + salt aleatório (não armazenamos em texto puro)',
      securitySession: 'Sessão: cookie httpOnly + assinatura HMAC (não pode ser lida por JS)',
      securityResumes: 'Currículos: vinculados à sua conta, visíveis apenas para você',
      securityAudit: 'Auditoria: todos os acessos e ações são logados',
      logoutTitle: 'Sair da conta',
      logoutDesc: 'Encerra a sessão neste dispositivo.',
      logoutButton: 'Sair',
    },
    support: {
      pageTitle: 'Suporte & Dúvidas do Griffo',
      pageSubtitle: 'Tire suas dúvidas sobre o funcionamento do sistema, laudos e cobrança.',
      welcomeMessage: 'Olá! Sou o Assistente Virtual Oficial do Griffo. Estou aqui para ajudar com qualquer dúvida sobre as funcionalidades do sistema, laudos, reescritas e a Análise Completa. Como posso te ajudar hoje?',
      faq1: 'Quanto custa e o que vem incluso?',
      faq2: 'O que é analisado no laudo do currículo?',
      faq3: 'Como funciona a reescrita em STAR e XYZ?',
      faq4: 'Como posso baixar meu laudo e currículo?',
      faq5: 'O que é a análise de Presença Digital e otimização de perfil?',
      botFallback: 'Desculpe, não consegui obter uma resposta.',
      connectionError: 'Ocorreu um erro ao conectar com o suporte. Por favor, tente novamente em instantes.',
      faqSectionTitle: 'Perguntas frequentes sugeridas',
      chatHeaderTitle: 'Atendimento Virtual Griffo',
      chatStatus: 'Online · Respostas instantâneas',
      officialBadge: 'Suporte Oficial',
      typingIndicator: 'Digitando resposta...',
      inputPlaceholder: 'Digite sua dúvida sobre o sistema ou cobrança...',
    },
    downloads: {
      pageTitle: 'Downloads',
      pageSubtitle: 'Baixe o laudo e o currículo reescrito em PDF, TXT e Markdown.',
      lockedAlert: 'Os downloads fazem parte da Análise Completa.',
      lockedAlertCta: 'Comprar análise',
      emptyTitle: 'Nenhum currículo disponível.',
      emptyDesc: 'Envie seu currículo para começar.',
      emptyCta: 'Enviar currículo',
      selectResumeTitle: 'Selecione o currículo',
      resumeLabel: 'Currículo · {date}',
      updatedAt: 'Atualizado em {date}',
      analysisCardTitle: 'Laudo de análise',
      analysisCardDesc: 'PDF · nota 0–10 e relatório',
      analysisFirstCta: 'Analisar primeiro',
      analysisDownloadCta: 'Baixar laudo PDF',
      rewriteCardTitle: 'Currículo reescrito',
      rewriteCardDesc: 'PDF, TXT e Markdown',
      rewriteFirstCta: 'Reescrever primeiro',
      rewriteDownloadPdf: 'Baixar PDF',
      rewriteDownloadTxt: 'Baixar Texto (.txt)',
      rewriteDownloadMd: 'Baixar Markdown (.md)',
      socialCardTitle: 'Presença Digital',
      socialCardDesc: 'Auditoria dos seus perfis profissionais',
      socialFirstCta: 'Auditar perfis primeiro',
      socialDownloadTxt: 'Baixar Dicas (.txt)',
      socialDownloadMd: 'Baixar Dicas (.md)',
      infoAnalysisPdf: 'PDF do laudo:',
      infoAnalysisPdfDesc: 'documento formatado com nota geral, dimensões, pontos fortes/fracos e recomendações.',
      infoRewrite: 'Currículo reescrito (PDF / TXT / .MD):',
      infoRewriteDesc: 'versões otimizadas prontas para envio aos recrutadores ou editáveis no seu computador.',
      infoSocial: 'Dicas de Presença Digital (.TXT / .MD):',
      infoSocialDesc: 'guia prático de biografia, títulos e palavras-chave para aplicar diretamente no seu LinkedIn e Gupy.',
      errorNeedsPlan: 'Libere a Análise Completa deste currículo para baixar os arquivos.',
      errorNeedsAnalysis: 'Este currículo ainda não tem uma Análise Completa.',
      errorGeneric: 'Falha no download.',
      errorDownload: 'Erro no download.',
      downloadStarted: 'Download iniciado!',
    },
    rewrite: {
      downloadGenericError: 'Falha ao baixar arquivo.',
      downloadSuccess: 'Download realizado com sucesso!',
      downloadConnectionError: 'Erro de conexão ao baixar arquivo.',
      authRequiredError: 'Você precisa autorizar a reescrita para continuar.',
      planRequiredError: 'Você precisa de um plano ativo para reescrever. Escolha um plano abaixo.',
      planRequiredToast: 'Plano necessário para reescrever',
      rewriteErrorFallback: 'Falha ao reescrever.',
      rewriteSuccessToast: 'Currículo reescrito! Revise abaixo.',
      rewriteConnectionError: 'Erro de conexão.',
      confirmSuccessToast: 'Currículo confirmado! Pronto para download.',
      rejectInfoToast: 'Reescrita descartada. Você pode solicitar novamente.',
      emptyTitle: 'Nenhum currículo para reescrever',
      emptyDesc: 'Envie e analise seu currículo primeiro.',
      emptyCta: 'Enviar currículo',
      needsAnalysisTitle: 'Analise antes de reescrever',
      needsAnalysisDesc: 'A reescrita usa o laudo para priorizar as melhorias.',
      needsAnalysisCta: 'Ver laudo',
      pageTitle: 'Reescrita do currículo',
      pageSubtitle: 'Com sua autorização, a IA reescreve o currículo preservando fatos.',
      viewReportCta: 'Ver laudo',
      authCardTitle: 'Autorização necessária',
      authCardDesc: 'A IA só reescreve se você autorizar explicitamente.',
      willDoTitle: 'O que a IA vai fazer:',
      willDo1: 'Reescrever bullets com verbo de ação + contexto + resultado',
      willDo2: 'Reorganizar hierarquia e otimizar para ATS',
      willDo3: 'Aplicar as recomendações do laudo (resumo, palavras-chave, etc.)',
      willNotTitle: 'O que a IA NÃO vai fazer:',
      willNot1: 'Inventar experiências, métricas ou formação',
      willNot2: 'Alterar datas, empresas ou cargos',
      willNot3: 'Adicionar habilidades que você não declarou',
      authorizeLabel: 'Autorizo a IA a reescrever meu currículo com base no laudo de análise. Entendo que o resultado deve ser revisado por mim antes do download, e que sou responsável por confirmar a veracidade das informações.',
      rewritingButton: 'Reescrevendo… (15–30s)',
      rewriteButton: 'Reescrever meu currículo',
      successCardTitle: 'Currículo reescrito com sucesso!',
      successCardDesc: 'Revise o conteúdo abaixo. Se estiver tudo OK, confirme para liberar o download.',
      keywordsCardTitle: '🧩 Palavras-Chave Estratégicas (ATS) Incorporadas',
      keywordsCardDesc: 'Estes termos essenciais foram integrados na reescrita para garantir pontuação máxima nos robôs de triagem (Gupy, LinkedIn, Workday).',
      copyKeywordsCta: 'Copiar termos',
      copyKeywordsToast: 'Palavras-chave copiadas!',
      viewRewrittenCta: 'Ver reescrito',
      viewOriginalCta: 'Ver original',
      regenerateCta: 'Gerar novamente',
      downloadPdfCta: 'Baixar PDF',
      downloadTxtCta: 'Baixar .TXT',
      downloadMdCta: 'Baixar .MD',
      originalBadge: 'Original',
      rewrittenBadge: 'Reescrito',
      finalReviewTitle: 'Revisão final',
      finalReviewDesc: 'Confirme se todas as informações estão corretas. Você é responsável pela veracidade dos dados.',
      confirmCta: 'Tudo certo, confirmar e baixar',
      discardCta: 'Descartar reescrita',
      confirmedTitle: 'Currículo confirmado!',
      confirmedDesc: 'Pronto para download em PDF e Markdown.',
      goToDownloadsCta: 'Ir para downloads',
    },
    radar: {
      loadingText: 'Carregando seu Radar...',
      loadErrorFallback: 'Não foi possível carregar o Radar.',
      loadConnectionError: 'Falha de conexão ao carregar o Radar.',
      cardDesc: 'Monitora oportunidades para o seu perfil e só te interrompe quando encontra algo que merece sua atenção.',
      runNowButton: 'Procurar agora',
      runNowTooltip: 'Reavalia as vagas já coletadas contra o seu perfil',
      preferencesButton: 'Preferências',
      freqLabel: 'Com que frequência avisar',
      freqImmediate: 'Assim que encontrar',
      freqDaily: 'Uma vez por dia',
      freqWeekly: 'Uma vez por semana',
      freqOff: 'Desligado',
      minFitLabel: 'O que vale um aviso',
      minFitStrong: 'Só as de alta compatibilidade',
      minFitGood: 'Alta e boa compatibilidade',
      minFitPartial: 'Inclusive as parciais',
      silentByDefault: 'O Radar é silencioso por padrão: se não houver nada realmente relevante, ele não envia nada. Isso é o comportamento esperado, não uma falha.',
      lastRun: 'Última varredura: {date}.',
      prepareErrorFallback: 'Não foi possível preparar seu currículo para esta vaga.',
      prepareRedirected: 'Seu currículo estava direcionado a "{target}". Agora aponta para esta vaga.',
      prepareSuccess: 'Currículo direcionado a esta vaga.',
      prepareConnectionError: 'Falha de conexão ao preparar seu currículo.',
      runSuccessOne: '{n} oportunidade nova.',
      runSuccessMany: '{n} oportunidades novas.',
      runNothingNew: 'Nada novo que justifique um aviso. O Radar continua monitorando.',
      runErrorFallback: 'Não foi possível atualizar o Radar agora.',
      runConnectionError: 'Falha de conexão ao atualizar o Radar.',
      savePrefsErrorFallback: 'Não foi possível salvar a preferência.',
      savePrefsConnectionError: 'Falha de conexão ao salvar a preferência.',
      feedbackInterestedToast: 'Anotado — vamos buscar mais assim.',
      feedbackNotUsefulToast: 'Anotado. Isso ajuda a calibrar o Radar.',
      feedbackError: 'Falha ao registrar seu retorno.',
      invalidLinkError: 'O link desta vaga é inválido e não pode ser aberto.',
      needsProfileTitle: 'O Radar precisa do seu perfil profissional',
      needsProfileDesc: 'Sem saber o que você faz e onde quer trabalhar, não há como separar o que é oportunidade do que é ruído. Preencher o mercado principal já é suficiente para começar.',
      needsProfileButton: 'Preencher perfil profissional',
      notMatchableTitle: 'Falta dizer o que você faz',
      notMatchableP1Prefix: 'Seu perfil tem onde você está e como quer trabalhar, mas ainda não tem ',
      notMatchableP1Bold: 'cargo, área ou competências',
      notMatchableP1Suffix: '. Sem isso não há o que comparar com uma vaga: qualquer resultado seria só o que calhou de existir no banco, e não o que tem a ver com você.',
      notMatchableP2Prefix: 'Preencher ',
      notMatchableP2Bold: 'um',
      notMatchableP2Mid: ' desses campos já liga o Radar. O botão ',
      notMatchableP2Em: 'Preencher a partir do currículo',
      notMatchableP2Suffix: ', na tela do perfil, tira todos eles do currículo que você já enviou.',
      notMatchableButton: 'Completar perfil profissional',
      emptyTitle: 'Nada digno de nota no momento',
      emptyDesc: 'O Radar está monitorando e não encontrou oportunidade que justifique interromper você. Silêncio aqui é o comportamento correto — quando aparecer algo relevante, ele aparece nesta tela.',
      emptyHintPrefix: 'A busca por vagas novas acontece uma vez por dia. ',
      emptyHintBold: 'Procurar agora',
      emptyHintSuffix: ' reavalia as vagas já encontradas contra o seu perfil — útil logo depois de mudar alguma coisa nele.',
      digestStrong: '{n} de alta compatibilidade',
      digestGood: '{n} compatível',
      digestPartial: '{n} alternativa',
      fitReadErrorFallback: 'Esta oportunidade foi registrada, mas o diagnóstico dela não pôde ser lido. Ela reaparecerá numa próxima varredura.',
      compatibilityBadge: 'Compatibilidade {level}',
      compatAlta: 'Alta',
      compatBoa: 'Boa',
      compatParcial: 'Parcial',
      compatBaixa: 'Baixa',
      whyRecommendedTitle: 'Por que recomendamos',
      attentionTitle: 'Atenção',
      blockersTitle: 'Impedimentos',
      viewJobButton: 'Ver a vaga',
      prepareResumeButton: 'Preparar meu currículo',
      feedbackInterestedNote: '👍 Você marcou como interessante.',
      feedbackNotUsefulNote: '👎 Você marcou como não útil.',
      feedbackWhatWrong: 'O que não serviu?',
      reasonWrongRole: 'Cargo errado',
      reasonLocation: 'Localização',
      reasonSalary: 'Salário',
      reasonSeniority: 'Senioridade',
      reasonSkills: 'Competências',
      reasonCompany: 'Empresa',
      reasonWorkMode: 'Modelo de trabalho',
      reasonOther: 'Outro',
      feedbackAskUseful: 'Esta oportunidade foi útil?',
      feedbackYes: 'Sim',
      feedbackNo: 'Não',
    },
    upload: {
      jobUrlEmptyError: 'Informe a URL da vaga (ex: https://linkedin.com/jobs/view/...)',
      jobImportedTitleFallback: 'Vaga Importada via Link',
      jobImportedSuccess: 'Conteúdo da vaga importado com sucesso via Link!',
      jobImportErrorFallback: 'Erro ao importar vaga pela URL. Tente copiar e colar a descrição manualmente.',
      jobImportConnectionError: 'Falha de conexão ao importar vaga. Verifique o link e tente novamente.',
      fileTooLargeError: 'Arquivo muito grande (máx. 5MB).',
      pdfAttachedSuccess: 'Arquivo PDF anexado com sucesso!',
      pdfReadError: 'Não foi possível ler o arquivo PDF.',
      fileReadError: 'Não foi possível ler o arquivo.',
      contentTooShortError: 'Currículo muito curto. Cole pelo menos {min} caracteres de texto.',
      contentTooLongError: 'Currículo muito longo (máx. {max} caracteres).',
      loadingStepUpload: 'Enviando arquivo e extraindo conteúdo...',
      loadingStepPreview: 'Avaliando seu currículo nas 8 dimensões...',
      saveErrorFallback: 'Erro ao salvar currículo.',
      saveSuccess: 'Currículo salvo! Veja sua nota nas 8 dimensões.',
      saveConnectionError: 'Erro de conexão ao enviar o currículo. Verifique sua rede e tente novamente.',
      heroTitle: 'Auditoria de IA Premium',
      heroDesc: 'Análise preditiva executiva, SEO avançado para LinkedIn/Gupy, cálculo de % Match com vagas alvo e orientações vocacionais de carreira em 8 dimensões.',
      badge1Title: '8 Dimensões',
      badge1Desc: 'Auditoria Executiva',
      badge2Title: 'Social SEO',
      badge2Desc: 'LinkedIn & Portfólio',
      badge3Title: 'Match Vaga',
      badge3Desc: 'Aderência de Perfil',
      badge4Title: 'Fórmula STAR',
      badge4Desc: 'Correção de Escrita',
      cardTitle: 'Conteúdo do currículo',
      cardDesc: 'Mín. {min} caracteres · Máx. {max}',
      attachButton: 'Anexar arquivo (.pdf, .txt, .md)',
      contentLabel: 'Currículo (texto)',
      contentPlaceholder: 'Exemplo:\n\nMaria Souza\nDesenvolvedora Front-end\nmaria@email.com | (11) 99999-9999 | linkedin.com/in/mariasouza\n\nRESUMO\nDesenvolvedora front-end com 5 anos de experiência em React, TypeScript e design systems...\n\nEXPERIÊNCIA\nSênior Front-end - Empresa X (2022-presente)\n- Liderei a migração de Angular para React...\n- Reduzi o tempo de carregamento em 40%...\n\n...',
      charCountUnit: 'caracteres',
      formatMarkdown: 'Markdown',
      formatText: 'Texto',
      formatToggle: 'alternar',
      targetJobLabel: 'Cargo ou Vaga Alvo Desejada (Opcional)',
      targetJobBadge: 'Ou cole o Link da vaga de emprego abaixo 🔗',
      importUrlLabel: 'Importar Vaga de Emprego pelo Link (LinkedIn, Gupy, Catho, etc.)',
      importUrlPlaceholder: 'https://www.linkedin.com/jobs/view/...',
      importUrlButton: 'Importar Link',
      targetJobPlaceholder: 'Ex: Gerente de Projetos Senior, Desenvolvedor React, Analista Financeiro...',
      targetJobDescLabel: 'Descrição ou Requisitos da Vaga Alvo (Copia & Cola ou Texto Extraído do Link)',
      targetJobDescPlaceholder: 'Cole aqui os requisitos, qualificações e atribuições da vaga para calcularmos o % de Match Exato e apontar lacunas de conhecimento (ou use o botão \'Importar Link\' acima)...',
      socialTitle: 'Presença Digital & Perfis Profissionais Globais (Opcional)',
      socialDesc: 'Insira o link das redes e plataformas relevantes para a área e mercado que deseja atuar (LinkedIn, Gupy, Behance, GitHub, Xing, StackOverflow, etc.).',
      addProfileButton: 'Adicionar perfil',
      platformPlaceholder: 'Rede / Plataforma',
      profileUrlPlaceholder: 'Link do perfil (ex: https://...)',
      removeProfileTitle: 'Remover perfil',
      consentText: 'Autorizo a inteligência do Griffo a analisar meus perfis fornecidos e gerar recomendações personalizadas de posicionamento e otimização de presença digital global.',
      secureEnvBadge: 'Ambiente Seguro · LGPD Compliance',
      cancelButton: 'Cancelar',
      submitButtonLoading: 'Incializando IA…',
      submitButton: 'Iniciar Auditoria',
      whatWillBeAnalyzedLabel: 'O que será analisado:',
      whatWillBeAnalyzedDesc: 'estrutura, resumo, resultados (STAR/XYZ), hard/soft skills, palavras-chave ATS, trajetória de carreira, sugestão de cursos/capacitação e otimização de presença digital global (LinkedIn, Gupy, Behance, GitHub, etc.).',
    },
    analysis: {
      loadingText: 'Carregando análise do currículo...',
      notFoundText: 'Nenhum currículo encontrado para exibir a análise.',
      uploadButton: 'Enviar currículo',
      loadErrorFallback: 'Erro ao carregar.',
      connectionError: 'Erro de conexão.',
      reportTitle: 'Laudo de análise',
      startingAnalysis: 'Iniciando análise preditiva em 8 dimensões...',
      processingAuto: 'Seu laudo está sendo processado automaticamente pela IA sem necessidade de novos cliques.',
      retryButton: 'Tentar novamente',
      orientationSuccess: 'Diagnóstico de Orientação Vocacional gerado com sucesso!',
      orientationErrorFallback: 'O diagnóstico não pôde ser concluído nesta tentativa. Nada foi cobrado — tente novamente.',
      orientationConnectionError: 'Falha de conexão ao gerar a orientação vocacional. Verifique sua internet e tente de novo.',
      letterSuccess: 'Carta de apresentação e resumo profissional gerados.',
      letterErrorFallback: 'A carta não pôde ser redigida nesta tentativa. Nada foi cobrado — tente novamente.',
      letterConnectionError: 'Falha de conexão ao gerar a carta. Verifique sua internet e tente de novo.',
      copiedTemplate: '{label} copiado.',
      copyErrorFallback: 'Não foi possível copiar. Selecione o texto e copie manualmente.',
      dimRelevanceToRole: 'Relevância para a Vaga',
      dimExperienceImpact: 'Impacto das Experiências',
      dimClarityFormatting: 'Clareza & Formatação',
      dimAtsOptimization: 'Otimização ATS',
      dimKeywordIntegration: 'Integração de Palavras-Chave',
      dimStructure: 'Estrutura & Compatibilidade ATS',
      dimSummary: 'Resumo & Posicionamento',
      dimImpact: 'Resultados (STAR/XYZ)',
      dimSkills: 'Habilidades & Ferramentas',
      dimExperience: 'Experiência & Verbos de Ação',
      dimKeywords: 'Palavras-Chave & Match',
      dimCareer: 'Trajetória & Plano de Carreira',
      dimUpskilling: 'Capacitação & Cursos',
      dimEducation: 'Formação & Cursos',
      dimLanguage: 'Linguagem & Tom',
      tabAll: 'Visão Completa',
      tabOverview: 'Score & Veredito',
      tabSocial: 'Mídias & Redes Sociais',
      tabMatch: 'Match Vaga Alvo',
      tabCareer: 'Agente Vocacional',
      tabLetter: 'Carta & Resumo',
      tabDimensions: '8 Dimensões',
      tabTargeted: 'Ajustes STAR/XYZ',
      scoreNotEvaluated: 'Nota não avaliada',
      atsApprovedSticky: 'ATS aprovado',
      atsRejectedSticky: 'ATS reprovado',
      atsNotEvaluatedSticky: 'ATS não avaliado',
      viewFullReport: 'Ver laudo completo',
      scoreAuditLabel: 'Score Audit',
      atsPass: 'ATS PASS',
      atsFail: 'ATS FAIL',
      atsNotEvaluated: 'ATS NÃO AVALIADO',
      calcDimensionsLabel: 'Cálculo Dimensões',
      algorithmicAverage: 'Média Algorítmica',
      noDimensionScores: 'Este laudo não trouxe as notas por dimensão. Reprocesse a análise para obtê-las.',
      scoreLabelNotEvaluated: 'Não avaliado',
      scoreLabelExcellent: 'Excelente',
      scoreLabelGood: 'Bom',
      scoreLabelRegular: 'Regular',
      scoreLabelNeedsImprovement: 'Precisa melhorar',
      performanceByDimension: 'Desempenho por dimensão',
      noChartData: 'Sem notas por dimensão neste laudo — não há o que representar no gráfico.',
      executiveTitle: 'Análise do Perfil Profissional & Veredito Executivo',
      executiveDesc: 'Avaliação técnica consolidada com base no seu currículo e melhores práticas de RH',
      noSummaryFallback: 'O parecer executivo não foi produzido nesta análise. Reprocesse o currículo para gerá-lo — não há cobrança nova.',
      strengthsTitle: 'Pontos Fortes do Perfil',
      noStrengths: 'Nenhum ponto forte registrado.',
      weaknessesTitle: 'Pontos de Atenção (Fragilidades)',
      noWeaknesses: 'Nenhum ponto de atenção crítico.',
      recommendationsTitle: 'Sugestões Práticas de Melhoria',
      recommendationsDesc: 'Ações recomendadas para aumentar suas chances de entrevista',
      keywordsTitle: 'Palavras-Chave ATS Sugeridas',
      keywordsDesc: 'Adicione estas palavras-chave estratégicas ao seu currículo para passar pelos filtros automáticos',
      matchTitle: 'Análise de Compatibilidade por Vaga Alvo',
      matchTargetJobPrefix: 'Cargo Alvo: {job}',
      matchNoTargetJob: 'Comparativo de exigências x conhecimentos do candidato',
      matchScoreLabel: 'Score de Match:',
      matchVerdictLabel: 'Avaliação de Aderência:',
      matchedReqTitle: 'Requisitos Atendidos (Conhecimentos OK)',
      noMatchedReq: 'Nenhum requisito diretamente correspondido.',
      missingReqTitle: 'Requisitos Faltantes / Lacunas a Desenvolver',
      noMissingReq: 'Parabéns! Nenhuma lacuna crítica encontrada.',
      actionPlanLabel: 'Plano de Ação & Orientação para Performar Melhor:',
      matchToneIncompatibleHeadline: 'Esta vaga exige requisitos que o currículo não atende',
      matchToneIncompatibleDetail: 'A candidatura a esta vaga tende a ser reprovada logo na triagem, e nenhum ajuste de texto muda isso. Não é um veredito sobre o seu currículo: é a distância entre ele e ESTA vaga. Compare com uma vaga da sua área para ver a diferença.',
      matchTonePartialHeadline: 'Dá para disputar esta vaga, com ajustes',
      matchTonePartialDetail: 'Há lacunas, mas são do tipo que o currículo resolve: ênfase, palavra-chave e evidência do que você já fez. Os requisitos ausentes abaixo são a lista do que atacar.',
      matchToneAlignedHeadline: 'Seu perfil é aderente a esta vaga',
      matchToneAlignedDetail: 'Os requisitos principais estão cobertos. O trabalho aqui é de acabamento — deixar explícito o que já existe no currículo.',
      dimensionsDetailTitle: 'Detalhamento por dimensão',
      dimensionsDetailDesc: 'Critérios de ATS, recrutamento executivo, plano de carreira e capacitação',
      noTargetedTitle: 'Sem alterações pontuais neste laudo',
      noTargetedDesc: 'Esta análise não devolveu trechos específicos do seu currículo para ajustar. Reprocessar o currículo costuma resolver — e não há cobrança nova.',
      targetedTitle: 'Onde & Por Que Ajustar (Diagnóstico Ponto a Ponto)',
      targetedDesc: 'A IA identificou trechos exatos que estão reduzindo sua nota e justifica o impacto de cada alteração.',
      currentTextLabel: 'Trecho Atual no Currículo',
      suggestedTextLabel: 'Sugestão Recomendada (Fórmula STAR/XYZ)',
      rationaleLabel: 'Justificativa Técnica & Motivo da Alteração:',
      careerTitle: 'Indeciso de qual vaga concorrer? Orientação Vocacional de Carreira',
      careerDesc: 'Nosso Agente de Carreira lê seu perfil e aponta as 3 áreas/cargos com maior aderência ao que você já construiu. Já incluída na Análise Completa deste currículo.',
      updateDiagnosisButton: 'Atualizar Diagnóstico',
      discoverAreaButton: 'Descobrir Minha Área Ideal',
      mappingAreas: 'Mapeando as 3 áreas com maior aderência ao seu perfil...',
      careerTimeEstimate: 'Costuma levar de 15 a 40 segundos. Não feche esta página.',
      profileSummaryLabel: 'Resumo do Perfil Identificado:',
      optionLabel: 'Opção #{n}',
      adherenceLabel: '{pct}% aderência',
      recommendedSkillsLabel: 'Habilidades recomendadas:',
      adherenceDisclaimer: 'A aderência mede o quanto sua trajetória se aproxima do que essas áreas costumam exigir. Não é probabilidade de contratação nem medição do mercado de trabalho.',
      careerAdviceLabel: 'Conselho Estratégico de Carreira:',
      letterTitle: 'Carta de Apresentação & Resumo Profissional',
      letterDesc: 'Escritos a partir do seu currículo real e direcionados à vaga alvo, no formato de candidatura do seu mercado. Já incluídos na Análise Completa deste currículo.',
      regenerateLetterButton: 'Gerar novamente',
      writeLetterButton: 'Escrever minha carta',
      writingLetterText: 'Redigindo a carta e o resumo direcionados...',
      letterTimeEstimate: 'Costuma levar de 20 a 45 segundos. Não feche esta página.',
      letterEmptyState: 'Ainda não gerada para este currículo. Ela usa a vaga alvo que você informou no envio — quanto mais completa a descrição da vaga, mais direcionados ficam os dois textos.',
      letterTargetedTo: 'Direcionada a: {job}',
      summaryLabel: 'Resumo profissional',
      copyButton: 'Copiar',
      summaryFootnote: 'Este é o parágrafo de abertura do currículo. O texto "Sobre" do LinkedIn é outro, e sai na aba de Mídias & Redes Sociais.',
      letterLabel: 'Carta de apresentação',
      letterKeywordsLabel: 'Termos da vaga incorporados aos textos',
      ctaTitle: 'Pronto para melhorar seu currículo?',
      ctaDesc: 'Com sua autorização, reescrevemos o currículo aplicando todas as recomendações acima.',
      ctaButton: 'Reescrever currículo',
    },
  },

  en: {
    nav: {
      features: 'Features',
      social: 'Digital Footprint',
      howItWorks: 'How It Works',
      plans: 'Pricing',
      faq: 'FAQ',
      login: 'Sign In',
      signup: 'Analyze Free',
      myPanel: 'Dashboard',
      freeAnalysis: 'Analyze Free',
    },
    hero: {
      badge: 'AI + Global ATS, LinkedIn & Recruiter Standards',
      title1: 'Empower your ',
      titleAccent: 'resume',
      title2: ' and land top global offers.',
      subtitle: 'Upload your resume in seconds and receive an in-depth 8-dimension audit report. Check your compatibility with ATS screeners (Workday, Taleo, Greenhouse) and get actionable recommendations for your online profiles.',
      ctaPrimary: 'Analyze my resume now',
      ctaSecondary: 'I already have an account',
      badgeFree: 'Free Analysis',
      badgeNoCard: 'No Credit Card',
      badgeSecurity: 'GDPR Compliant',
      badgeSafe: '100% Secure & Confidential',
    },
    mockup: {
      title: 'Technical Resume Audit Report',
      precision: 'HIGH PRECISION',
      overallScore: 'Overall Qualification Score',
      atsApproved: 'ATS Screener Passed',
      atsSub: 'Compatible with Workday, Taleo & ATS',
      dim1: 'Structure & Machine Parsing (ATS)',
      dim2: 'Quantified Impact & Metrics',
      dim3: 'Market Keyword Alignment',
      dim4: 'Career Path & Positioning',
      suggestionTitle: 'Optimized Headline Suggestion (LinkedIn / Portals)',
      suggestionText: '"Operations & Efficiency Lead | Cross-Functional Team Leadership | Process Optimization & Scaling"',
    },
    stats: {
      dimTitle: '8 Dimensions',
      dimSub: 'Deep multi-angle resume audit',
      atsTitle: 'ATS Compatibility',
      atsSub: 'Automated recruiter filter check',
      globalTitle: 'Strategic Profiles',
      globalSub: 'LinkedIn, GitHub, Behance & Portfolios',
      pdfTitle: 'PDF & Editable',
      pdfSub: 'Production-ready professional rewrite',
    },
    social: {
      badge: 'Digital Presence & Strategic Positioning',
      title: 'Your career extends beyond PDF pages. Optimize your profile anywhere.',
      subtitle: 'With GriffoWork, you strengthen your professional personal brand across top social platforms and tech networks targeted to your industry.',
      card1Title: 'LinkedIn & Job Boards',
      card1Sub: "High-impact headline recommendations, 'About' summary copywriting, and recruiter search keywords.",
      card2Title: 'Portfolios & Specialized Networks',
      card2Sub: 'Tailored recommendations for GitHub, Behance, Stack Overflow, Kaggle, Xing, and portfolio websites.',
      lgpdBadge: 'GDPR & Privacy',
      optInTitle: 'Privacy-First & User-Authorized Insights',
      linkedInHead: 'LinkedIn — Strategic Professional Headline',
      behanceHead: 'Portfolio / Behance — High-Impact Positioning',
      gupyHead: 'ATS Systems — Key Screening Keywords',
      linkedInExample: '"Operations & Efficiency Lead | Cross-Functional Team Leadership | Process Optimization & Scaling"',
      behanceExample: '"Highlight case studies with quantified impact (e.g. \'Redesign that boosted conversion by +35%\') on portfolio covers."',
      gupyExample: '"Strategic alignment with the most demanded skills and keywords used by recruiters in your field."',
    },
    features: {
      badge: 'Full Platform Features',
      title: 'Everything you need to stand out in high-stakes hiring.',
      subtitle: 'Built on HR industry standards, LinkedIn Talent Solutions, and ATS parsing criteria.',
      f1Title: '8-Dimension Executive Audit',
      f1Desc: 'Detailed evaluation of document structure, summary impact, quantified metrics, core skills, ATS keywords, and career trajectory.',
      f2Title: 'ATS Filter Compatibility',
      f2Desc: 'We verify formatting, layout, and keyword density to ensure seamless parsing across leading corporate ATS systems (Workday, Taleo, Greenhouse, Lever).',
      f3Title: 'Professional AI Rewrite',
      f3Desc: 'With your explicit confirmation, our AI rewrites your experience to highlight key achievements and measurable impact while maintaining 100% truthfulness.',
      f4Title: 'Digital Presence Audit',
      f4Desc: 'Tailored recommendations for LinkedIn, GitHub, Behance, Xing and online portfolios to attract recruiters inbound.',
      f5Title: 'PDF & Editable Text Downloads',
      f5Desc: 'Export your rewritten resume and audit report in high-resolution PDF and editable document formats.',
      f6Title: 'Bank-Grade Security & Privacy',
      f6Desc: 'Your personal data is encrypted and strictly compliant with GDPR and international privacy standards. We never sell your data.',
      f7Title: 'AI-Powered Job Radar',
      f7Desc: 'We monitor thousands of job postings every day and only alert you when we find one that truly matches your profile — no spam, no generic listings.',
      f8Title: 'Career Orientation',
      f8Desc: 'A vocational diagnosis that points to the roles and fields where your background is strongest, with concrete next steps.',
      f9Title: 'Targeted Cover Letter',
      f9Desc: 'A cover letter written for the specific job, highlighting the requirements you meet — ready to send alongside your resume.',
    },
    how: {
      badge: 'Step-by-step',
      title: 'From upload to a polished resume in 5 simple steps.',
      subtitle: 'Fast, transparent, and completely under your control.',
      s1Title: 'Upload Resume',
      s1Desc: 'Attach a PDF document, text file, or paste your existing content.',
      s2Title: 'Link Profiles (Optional)',
      s2Desc: 'Optionally provide your LinkedIn, GitHub, or portfolio links.',
      s3Title: 'Receive Audit Report',
      s3Desc: 'Review your 0–10 score across 8 dimensions with strengths and areas for growth.',
      s4Title: 'Request Rewrite',
      s4Desc: 'With one click, authorize a professional rewrite focused on impact and results.',
      s5Title: 'Download & Apply',
      s5Desc: 'Download your finalized resume ready for immediate job applications.',
    },
    pricing: {
      badge: 'One-time payment, no subscription',
      title: 'One purchase. The whole report.',
      subtitle: 'Upload your resume, see your score for free, and unlock the full report with no recurring fees, no lock-in, and no auto-renewal.',
      productTitle: 'Complete Analysis',
      productDesc: 'Nine deliverables in a single purchase, for the resume you choose.',
      oneTime: 'One-time payment. No subscription and no auto-renewal.',
      includesTitle: 'What you get',
      items: [
        '8-Dimension Audit Report',
        'Target Job Comparison',
        'Line-by-Line Resume Fixes',
        'Experience Rewrite (STAR/XYZ)',
        'Career Guidance Report',
        'Online Presence & Profile Optimization',
        'Cover Letter',
        'Professional Summary',
        'PDF Download',
      ],
      buyCta: 'Buy Complete Analysis',
      previewTitle: 'See your score for free',
      previewDesc: 'Upload your resume and get 0-10 scores across the 8 dimensions at no cost. One preview per account.',
      previewCta: 'See my free score',
      localPayment: 'Pay in {currency} with {methods}.',
      packTitle: 'Applying to more roles?',
      packDesc: '5 Complete Analyses, one for each resume or role you want to work on.',
      packCta: 'Get 5 analyses for {price}',
      packPerAnalysis: '{price} per analysis',
      businessTitle: 'Companies & HR teams',
      businessDesc: 'Volume, invoicing and integration with your hiring process.',
      businessCta: 'Talk to sales',
    },
    faq: {
      badge: 'Frequently Asked Questions',
      title: 'Have questions?',
      subtitle: 'Quick answers to common questions about GriffoWork.',
      q1: 'How does the ATS compatibility check work (Workday, Taleo, Greenhouse)?',
      a1: 'Our platform evaluates your document layout, section hierarchy, header readability, and keyword density against the parsing standards of major enterprise applicant tracking systems.',
      q2: 'Does the AI fabricate fake work experience?',
      a2: 'Never. GriffoWork strictly adheres to a 100% truthfulness policy: we preserve 100% of your real employers, job titles, dates, and education, enhancing clarity and impact.',
      q3: 'How does online profile optimization work (LinkedIn, GitHub, Behance)?',
      a3: 'With your consent, our AI generates optimized headlines, "About" bios, and keyword positioning recommendations tailored to recruiter searches in your field.',
      q4: 'Is my resume data safe and private?',
      a4: 'Absolutely. We operate under strict GDPR compliance. Your data is encrypted and never shared or sold to third parties.',
      q5: 'Do I need a subscription?',
      a5: 'No. You pay once for the Complete Analysis of that resume and receive all nine deliverables. No monthly fee, no auto-renewal, and no balance to manage.',
    },
    ctaFinal: {
      title: 'Ready to elevate your executive presentation?',
      subtitle: 'Create your free account now and get your technical resume audit in under 30 seconds. No credit card required.',
      button: 'Analyze my resume free',
    },
    footer: {
      desc: 'Career Intelligence and digital presence optimization platform built on modern talent recruitment standards.',
      navTitle: 'Navigation',
      secTitle: 'Security & Privacy',
      contactTitle: 'Contact & Official Domain',
      rights: 'GriffoWork. All rights reserved. Fully compliant with GDPR.',
    },
    auth: {
      welcomeBack: 'Welcome back',
      createAccount: 'Create your account',
      loginSub: 'Sign in to access your audit reports.',
      signupSub: 'Free analysis. No credit card required.',
      fullName: 'Full Name',
      email: 'Email or Username',
      password: 'Password',
      profession: 'Target Job Title (Optional)',
      loginBtn: 'Sign In to Account',
      signupBtn: 'Create Free Account',
      noAccount: "Don't have an account? Sign up free",
      hasAccount: 'Already have an account? Sign in',
    },
    app: {
      dashboard: 'Dashboard',
      upload: 'Upload Resume',
      analysis: 'Audit Report',
      rewrite: 'AI Rewrite',
      downloads: 'Downloads',
      history: 'History',
      plans: 'Buy Analysis',
      settings: 'Settings',
      admin: 'Admin Area',
      balance: 'Analyses',
      balanceUnit: 'analyses available',
      buyMore: '+ Buy',
      greeting: 'Hello',
      greetingSub: 'Here is an overview of your GriffoWork activity.',
      newResume: 'New Resume',
    },
    profile: {
      loadErrorFallback: 'Could not load your profile.',
      loadConnectionError: 'Connection error while loading your profile.',
      saveMaxLessThanMinError: 'Maximum target cannot be lower than the minimum.',
      saveSuccessWithRadarOne: 'Profile saved. Radar found {n} opportunity — check the Radar screen.',
      saveSuccessWithRadarMany: 'Profile saved. Radar found {n} opportunities — check the Radar screen.',
      saveSuccessNoRadar: 'Professional profile saved.',
      saveErrorFallback: 'Could not save your profile.',
      saveConnectionError: 'Connection error while saving your profile.',
      fillErrorFallback: 'Could not read your resume right now.',
      fillNothingToFill: 'Nothing to fill: the fields I could answer are already filled in.',
      fillSuccessOne: '{n} field filled in. Review and save.',
      fillSuccessMany: '{n} fields filled in. Review and save.',
      fillConnectionError: 'Connection error while reading your resume.',
      loadingText: 'Loading your professional profile...',
      cardTitle: 'Professional Profile',
      cardDesc: 'This is where Griffo learns who you are professionally and which market you should be targeting. Fill it in gradually — nothing here is required.',
      fillButton: 'Fill in what I already know about you',
      fillDesc: 'Reads your latest resume and vocational diagnosis and fills in only the empty fields. Nothing is saved until you review and click save.',
      marketInfoIntro: 'The market you declare here changes the recommendations: which screening systems we mention, the expected resume format, and job-title vocabulary.',
      marketInfoWithMarket: 'Your analyses currently use {market}.',
      marketInfoWithoutMarket: 'With no market declared, we use your access country as a guess.',
      filledBadge: 'Filled in',
      notInformed: 'Not informed',
      countryGroupAdapted: 'With dedicated adaptation',
      countryGroupOthers: 'Other countries',
      globalMarketName: 'Global / International remote',
      removeAria: 'Remove {value}',
      sectionIdentityTitle: 'Professional identity',
      fieldCurrentTitle: 'Current title',
      placeholderCurrentTitle: 'E.g.: Data Analyst',
      fieldArea: 'Field of work',
      placeholderArea: 'E.g.: Data & Analytics',
      fieldSeniority: 'Seniority',
      fieldYearsExperience: 'Years of experience',
      fieldEducation: 'Education',
      fieldSpecializations: 'Specializations',
      placeholderSpecializations: 'E.g.: Dimensional modeling',
      fieldSkills: 'Skills',
      hintSkills: 'Tools and skills you want featured in the recommendations.',
      placeholderSkills: 'E.g.: SQL',
      sectionObjectivesTitle: 'Objectives',
      fieldTargetRoles: 'Target roles',
      hintTargetRoles: 'The roles you want to pursue — not necessarily what you do today.',
      placeholderTargetRoles: 'E.g.: Data Analyst',
      fieldTargetFields: 'Target fields',
      placeholderTargetFields: 'E.g.: Product',
      fieldTargetIndustries: 'Industries of interest',
      placeholderTargetIndustries: 'E.g.: Healthcare',
      fieldCareerGoal: 'Desired trajectory',
      placeholderCareerGoal: 'Where do you want to take your career in the coming years?',
      sectionLocationTitle: 'Where you are and where you want to work',
      hintLocationIntro: 'These are deliberately different questions. Living in a country does not mean wanting to work there.',
      fieldResidenceCountry: 'Country of residence',
      hintResidenceCountry: 'Countries in the first group have dedicated adaptation — resume format, contract types, screening systems. The rest use the international default.',
      fieldResidenceRegion: 'State / region',
      fieldResidenceCity: 'City',
      fieldTargetCountry: 'Country you want to work in',
      fieldOtherMarkets: 'Other countries you would also accept working in',
      hintOtherMarkets: 'Select as many as you like. Leave everything unchecked if you only want the primary country.',
      switchRelocationTitle: 'Open to relocating',
      switchRelocationDesc: 'Willing to physically move to another country.',
      switchRemoteTitle: 'Open to international remote work',
      switchRemoteDesc: 'Working from where you live for a company in another country. Not the same as relocating.',
      sectionPreferencesTitle: 'Work preferences',
      fieldWorkModes: 'Accepted work modes',
      fieldContractTypes: 'Accepted contract types',
      hintContractTypes: 'In your market\'s vocabulary: CLT, PJ, W-2, contractor...',
      placeholderContractTypes: 'E.g.: full-time',
      fieldWorkload: 'Workload',
      fieldSalary: 'Salary target',
      hintSalary: 'In the currency of the market you\'re targeting. Not related to the currency you pay for analyses — that is set by your payment method.',
      placeholderSalaryMin: 'Minimum',
      placeholderSalaryMax: 'Maximum',
      placeholderSalaryPeriod: 'Period',
      sectionLanguagesTitle: 'Languages',
      hintLanguagesIntro: 'The screen\'s language does not decide your resume\'s language. If you\'re targeting a different country, they are likely different.',
      fieldResumeLanguage: 'Resume and cover letter language',
      fieldCommLanguage: 'Email notification language',
      saveButton: 'Save profile',
      seniorityIntern: 'Internship',
      seniorityJunior: 'Junior',
      seniorityMid: 'Mid-level',
      senioritySenior: 'Senior',
      seniorityLead: 'Lead / Coordination',
      seniorityPrincipal: 'Specialist / Principal',
      seniorityDirector: 'Director',
      seniorityExecutive: 'Executive (C-level)',
      educationNone: 'No formal education declared',
      educationHighSchool: 'High school',
      educationTechnical: 'Technical degree',
      educationBachelor: 'Bachelor\'s degree',
      educationPostgrad: 'Postgraduate',
      educationMaster: 'Master\'s degree',
      educationPhd: 'PhD',
      workModeRemote: 'Remote',
      workModeHybrid: 'Hybrid',
      workModeOnsite: 'On-site',
      weeklyHoursFullTime: 'Full-time',
      weeklyHoursPartTime: 'Part-time',
      weeklyHoursFlexible: 'Flexible',
      salaryPeriodYear: 'per year',
      salaryPeriodMonth: 'per month',
      salaryPeriodHour: 'per hour',
      languagePt: 'Portuguese',
      languageEn: 'English',
      languageEs: 'Spanish',
    },
    history: {
      title: 'History',
      subtitle: 'All the resumes you\'ve uploaded.',
      newButton: 'New',
      emptyTitle: 'No resumes uploaded',
      emptyDesc: 'Your history will appear here.',
      emptyButton: 'Upload resume',
      statusUploaded: 'Uploaded',
      statusAnalyzed: 'Analyzed',
      statusRewriteRequested: 'Rewrite requested',
      statusRewritten: 'Rewritten',
      statusConfirmed: 'Confirmed',
      deleteConfirm: 'Permanently delete this resume? This action cannot be undone.',
      deleteSuccess: 'Resume deleted.',
      deleteError: 'Failed to delete.',
      resumeOf: 'Resume from {date}',
      updatedAt: 'Updated on {date}',
    },
    dashboard: {
      accountLabelActive: 'Full Analysis available',
      accountLabelDefault: 'Griffo Account',
      greeting: 'Hello, {name} 👋',
      defaultName: 'candidate',
      subtitle: 'Welcome to your GriffoWork executive dashboard.',
      newResumeButton: 'New resume',
      activeBadge: 'Active',
      planCardDesc: 'One purchase unlocks the Full Analysis of a resume: 8-dimension report, job comparison, sections to adjust, rewrite, guidance, digital presence, cover letter, summary, and PDF.',
      balanceLabel: 'Available Analyses',
      quickUploadLabel: 'Upload resume',
      quickUploadDesc: 'Paste or attach',
      quickViewLabel: 'View report',
      quickViewDesc: 'Score 0–10',
      quickRewriteLabel: 'Rewrite',
      quickRewriteDesc: 'With your authorization',
      quickDownloadsLabel: 'Downloads',
      quickDownloadsDesc: 'PDF and Markdown',
      statIssuedReports: 'Reports Issued',
      statImprovedResumes: 'Resumes Improved',
      historyTitle: 'Processing History',
      historySubtitle: 'Your latest resumes processed by artificial intelligence',
      historyViewAll: 'View full history',
      syncing: 'Syncing data…',
      emptyTitle: 'No resume under review',
      emptyDesc: 'Start a free audit now to discover your resume\'s weaknesses and potential, based on big tech metrics.',
      emptyButton: 'Start AI Audit',
      reportOf: 'Report from {date}',
      lastUpdated: 'Last updated: {date}',
      statusUploaded: 'Uploaded',
      statusAnalyzed: 'Analyzed',
      statusRewriteRequested: 'Rewrite requested',
      statusRewritten: 'Rewritten',
      statusConfirmed: 'Confirmed',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your profile, privacy, and preferences.',
      profileCardTitle: 'Profile',
      profileCardDesc: 'Basic account information',
      emailLabel: 'Email',
      emailHint: 'Email cannot be changed.',
      nameLabel: 'Full name',
      professionLabel: 'Profession',
      professionPlaceholder: 'E.g.: Front-end Developer',
      socialLabel: 'Social Networks & Professional Profiles (Analysis Default)',
      addProfileButton: 'Add profile',
      socialHint: 'Add your LinkedIn, Gupy, GitHub, etc. links here. They will be filled in automatically in every new analysis.',
      socialUrlPlaceholder: 'Your profile link ({platform})',
      saveButton: 'Save changes',
      saveErrorFallback: 'Failed to save.',
      saveSuccess: 'Profile and social links saved successfully!',
      planCardTitle: 'Current plan',
      planCardDesc: 'Your current subscription',
      planFree: 'Free',
      planDay: 'Day Pass',
      planMonthly: 'Monthly',
      planAnnual: 'Annual',
      planUnknown: '—',
      planExpiresAt: 'Expires on {date}',
      viewPlansButton: 'View plans',
      marketplaceCardTitle: 'Talent marketplace',
      marketplacePhaseBadge: 'Phase 2',
      marketplaceCardDesc: 'Control whether partner recruiters can find you',
      marketplaceAlert: 'Verified recruiters will be able to search candidates by score, strength dimensions, and keywords. You are in control: you can turn this on or off at any time. Sensitive data (email, phone) only appears after you accept a match.',
      optInTitle: 'Appear in recruiter searches',
      optInDesc: 'Your reports (without sensitive data) become visible to verified partner recruiters.',
      optInAcceptedToast: 'You agreed to appear to partner recruiters (Phase 2). Your sensitive data will only be released after an accepted match.',
      optOutToast: 'Opted out. You will not appear in recruiter searches.',
      optInErrorToast: 'Error saving preference.',
      visibleTitle: 'Public profile for matches',
      visibleDesc: 'Lets recruiters see your name and profession (not contact info) when there is a keyword match.',
      consentNote: 'You can revoke consent at any time. Compliant with LGPD (Brazilian Law No. 13,709/2018).',
      securityCardTitle: 'Security',
      securityCardDesc: 'Your password is protected with scrypt hashing and a unique salt',
      securityPassword: 'Password: scrypt hash + random salt (never stored in plain text)',
      securitySession: 'Session: httpOnly cookie + HMAC signature (cannot be read by JS)',
      securityResumes: 'Resumes: linked to your account, visible only to you',
      securityAudit: 'Audit: all access and actions are logged',
      logoutTitle: 'Sign out',
      logoutDesc: 'Ends the session on this device.',
      logoutButton: 'Sign out',
    },
    support: {
      pageTitle: 'Griffo Support & FAQ',
      pageSubtitle: 'Get answers about how the system works, reports, and billing.',
      welcomeMessage: 'Hi! I\'m Griffo\'s official virtual assistant. I\'m here to help with any question about the system\'s features, reports, rewrites, and the Complete Analysis. How can I help you today?',
      faq1: 'How much does it cost and what\'s included?',
      faq2: 'What does the resume report analyze?',
      faq3: 'How does the STAR/XYZ rewrite work?',
      faq4: 'How can I download my report and resume?',
      faq5: 'What is the Digital Presence analysis and profile optimization?',
      botFallback: 'Sorry, I couldn\'t get a response.',
      connectionError: 'An error occurred while connecting to support. Please try again shortly.',
      faqSectionTitle: 'Suggested frequently asked questions',
      chatHeaderTitle: 'Griffo Virtual Support',
      chatStatus: 'Online · Instant replies',
      officialBadge: 'Official Support',
      typingIndicator: 'Typing a reply...',
      inputPlaceholder: 'Type your question about the system or billing...',
    },
    downloads: {
      pageTitle: 'Downloads',
      pageSubtitle: 'Download the report and rewritten resume in PDF, TXT, and Markdown.',
      lockedAlert: 'Downloads are part of the Full Analysis.',
      lockedAlertCta: 'Buy analysis',
      emptyTitle: 'No resume available.',
      emptyDesc: 'Upload your resume to get started.',
      emptyCta: 'Upload resume',
      selectResumeTitle: 'Select the resume',
      resumeLabel: 'Resume · {date}',
      updatedAt: 'Updated on {date}',
      analysisCardTitle: 'Analysis report',
      analysisCardDesc: 'PDF · 0–10 score and report',
      analysisFirstCta: 'Analyze first',
      analysisDownloadCta: 'Download report PDF',
      rewriteCardTitle: 'Rewritten resume',
      rewriteCardDesc: 'PDF, TXT, and Markdown',
      rewriteFirstCta: 'Rewrite first',
      rewriteDownloadPdf: 'Download PDF',
      rewriteDownloadTxt: 'Download Text (.txt)',
      rewriteDownloadMd: 'Download Markdown (.md)',
      socialCardTitle: 'Digital Presence',
      socialCardDesc: 'Audit of your professional profiles',
      socialFirstCta: 'Audit profiles first',
      socialDownloadTxt: 'Download Tips (.txt)',
      socialDownloadMd: 'Download Tips (.md)',
      infoAnalysisPdf: 'Report PDF:',
      infoAnalysisPdfDesc: 'formatted document with overall score, dimensions, strengths/weaknesses, and recommendations.',
      infoRewrite: 'Rewritten resume (PDF / TXT / .MD):',
      infoRewriteDesc: 'optimized versions ready to send to recruiters or edit on your computer.',
      infoSocial: 'Digital Presence Tips (.TXT / .MD):',
      infoSocialDesc: 'practical guide for bio, headlines, and keywords to apply directly to your LinkedIn and Gupy.',
      errorNeedsPlan: 'Unlock the Full Analysis for this resume to download the files.',
      errorNeedsAnalysis: 'This resume does not have a Full Analysis yet.',
      errorGeneric: 'Download failed.',
      errorDownload: 'Download error.',
      downloadStarted: 'Download started!',
    },
    rewrite: {
      downloadGenericError: 'Failed to download the file.',
      downloadSuccess: 'Download completed successfully!',
      downloadConnectionError: 'Connection error while downloading the file.',
      authRequiredError: 'You need to authorize the rewrite to continue.',
      planRequiredError: 'You need an active plan to rewrite. Choose a plan below.',
      planRequiredToast: 'A plan is required to rewrite',
      rewriteErrorFallback: 'Failed to rewrite.',
      rewriteSuccessToast: 'Resume rewritten! Review it below.',
      rewriteConnectionError: 'Connection error.',
      confirmSuccessToast: 'Resume confirmed! Ready for download.',
      rejectInfoToast: 'Rewrite discarded. You can request it again.',
      emptyTitle: 'No resume to rewrite',
      emptyDesc: 'Upload and analyze your resume first.',
      emptyCta: 'Upload resume',
      needsAnalysisTitle: 'Analyze before rewriting',
      needsAnalysisDesc: 'The rewrite uses the report to prioritize improvements.',
      needsAnalysisCta: 'View report',
      pageTitle: 'Resume rewrite',
      pageSubtitle: 'With your authorization, the AI rewrites the resume while preserving facts.',
      viewReportCta: 'View report',
      authCardTitle: 'Authorization required',
      authCardDesc: 'The AI only rewrites if you explicitly authorize it.',
      willDoTitle: 'What the AI will do:',
      willDo1: 'Rewrite bullets with action verb + context + result',
      willDo2: 'Reorganize hierarchy and optimize for ATS',
      willDo3: 'Apply the report\'s recommendations (summary, keywords, etc.)',
      willNotTitle: 'What the AI will NOT do:',
      willNot1: 'Invent experience, metrics, or education',
      willNot2: 'Change dates, companies, or job titles',
      willNot3: 'Add skills you did not declare',
      authorizeLabel: 'I authorize the AI to rewrite my resume based on the analysis report. I understand the result must be reviewed by me before downloading, and that I am responsible for confirming the accuracy of the information.',
      rewritingButton: 'Rewriting… (15–30s)',
      rewriteButton: 'Rewrite my resume',
      successCardTitle: 'Resume rewritten successfully!',
      successCardDesc: 'Review the content below. If everything looks good, confirm to unlock the download.',
      keywordsCardTitle: '🧩 Strategic ATS Keywords Incorporated',
      keywordsCardDesc: 'These essential terms were integrated into the rewrite to ensure maximum scoring in screening bots (Gupy, LinkedIn, Workday).',
      copyKeywordsCta: 'Copy terms',
      copyKeywordsToast: 'Keywords copied!',
      viewRewrittenCta: 'View rewritten',
      viewOriginalCta: 'View original',
      regenerateCta: 'Regenerate',
      downloadPdfCta: 'Download PDF',
      downloadTxtCta: 'Download .TXT',
      downloadMdCta: 'Download .MD',
      originalBadge: 'Original',
      rewrittenBadge: 'Rewritten',
      finalReviewTitle: 'Final review',
      finalReviewDesc: 'Confirm that all information is correct. You are responsible for the accuracy of the data.',
      confirmCta: 'All good, confirm and download',
      discardCta: 'Discard rewrite',
      confirmedTitle: 'Resume confirmed!',
      confirmedDesc: 'Ready for download in PDF and Markdown.',
      goToDownloadsCta: 'Go to downloads',
    },
    radar: {
      loadingText: 'Loading your Radar...',
      loadErrorFallback: 'Could not load the Radar.',
      loadConnectionError: 'Connection error while loading the Radar.',
      cardDesc: 'Monitors opportunities for your profile and only interrupts you when it finds something worth your attention.',
      runNowButton: 'Search now',
      runNowTooltip: 'Re-evaluates already-collected jobs against your profile',
      preferencesButton: 'Preferences',
      freqLabel: 'How often to notify you',
      freqImmediate: 'As soon as it finds one',
      freqDaily: 'Once a day',
      freqWeekly: 'Once a week',
      freqOff: 'Off',
      minFitLabel: 'What counts as worth a notification',
      minFitStrong: 'Only strong matches',
      minFitGood: 'Strong and good matches',
      minFitPartial: 'Including partial matches',
      silentByDefault: 'Radar is silent by default: if there is nothing truly relevant, it sends nothing. That is the expected behavior, not a failure.',
      lastRun: 'Last scan: {date}.',
      prepareErrorFallback: 'Could not prepare your resume for this job.',
      prepareRedirected: 'Your resume was targeted at "{target}". It now points to this job.',
      prepareSuccess: 'Resume targeted at this job.',
      prepareConnectionError: 'Connection error while preparing your resume.',
      runSuccessOne: '{n} new opportunity.',
      runSuccessMany: '{n} new opportunities.',
      runNothingNew: 'Nothing new worth a notification. Radar keeps monitoring.',
      runErrorFallback: 'Could not update the Radar right now.',
      runConnectionError: 'Connection error while updating the Radar.',
      savePrefsErrorFallback: 'Could not save the preference.',
      savePrefsConnectionError: 'Connection error while saving the preference.',
      feedbackInterestedToast: 'Noted — we\'ll look for more like this.',
      feedbackNotUsefulToast: 'Noted. This helps calibrate the Radar.',
      feedbackError: 'Failed to record your feedback.',
      invalidLinkError: 'This job\'s link is invalid and cannot be opened.',
      needsProfileTitle: 'Radar needs your professional profile',
      needsProfileDesc: 'Without knowing what you do and where you want to work, there is no way to tell opportunity from noise. Filling in the primary market is already enough to get started.',
      needsProfileButton: 'Fill in professional profile',
      notMatchableTitle: 'You still need to say what you do',
      notMatchableP1Prefix: 'Your profile has where you are and how you want to work, but still lacks ',
      notMatchableP1Bold: 'title, field, or skills',
      notMatchableP1Suffix: '. Without that there\'s nothing to compare against a job: any result would just be whatever happened to exist in the database, not what actually relates to you.',
      notMatchableP2Prefix: 'Filling in ',
      notMatchableP2Bold: 'one',
      notMatchableP2Mid: ' of these fields already turns Radar on. The ',
      notMatchableP2Em: 'Fill in from resume',
      notMatchableP2Suffix: ' button, on the profile screen, pulls all of them from the resume you already uploaded.',
      notMatchableButton: 'Complete professional profile',
      emptyTitle: 'Nothing worth noting right now',
      emptyDesc: 'Radar is monitoring and hasn\'t found an opportunity worth interrupting you for. Silence here is the correct behavior — when something relevant shows up, it appears on this screen.',
      emptyHintPrefix: 'The search for new jobs runs once a day. ',
      emptyHintBold: 'Search now',
      emptyHintSuffix: ' re-evaluates already-found jobs against your profile — useful right after changing something in it.',
      digestStrong: '{n} strong match',
      digestGood: '{n} good match',
      digestPartial: '{n} alternative',
      fitReadErrorFallback: 'This opportunity was recorded, but its assessment could not be read. It will reappear on the next scan.',
      compatibilityBadge: '{level} match',
      compatAlta: 'Strong',
      compatBoa: 'Good',
      compatParcial: 'Partial',
      compatBaixa: 'Low',
      whyRecommendedTitle: 'Why we recommend it',
      attentionTitle: 'Attention',
      blockersTitle: 'Blockers',
      viewJobButton: 'View job',
      prepareResumeButton: 'Prepare my resume',
      feedbackInterestedNote: '👍 You marked this as interesting.',
      feedbackNotUsefulNote: '👎 You marked this as not useful.',
      feedbackWhatWrong: 'What didn\'t work?',
      reasonWrongRole: 'Wrong role',
      reasonLocation: 'Location',
      reasonSalary: 'Salary',
      reasonSeniority: 'Seniority',
      reasonSkills: 'Skills',
      reasonCompany: 'Company',
      reasonWorkMode: 'Work mode',
      reasonOther: 'Other',
      feedbackAskUseful: 'Was this opportunity useful?',
      feedbackYes: 'Yes',
      feedbackNo: 'No',
    },
    upload: {
      jobUrlEmptyError: 'Enter the job URL (e.g. https://linkedin.com/jobs/view/...)',
      jobImportedTitleFallback: 'Job Imported via Link',
      jobImportedSuccess: 'Job content successfully imported via link!',
      jobImportErrorFallback: 'Error importing job from URL. Try copying and pasting the description manually.',
      jobImportConnectionError: 'Connection error while importing the job. Check the link and try again.',
      fileTooLargeError: 'File too large (max. 5MB).',
      pdfAttachedSuccess: 'PDF file attached successfully!',
      pdfReadError: 'Could not read the PDF file.',
      fileReadError: 'Could not read the file.',
      contentTooShortError: 'Resume too short. Paste at least {min} characters of text.',
      contentTooLongError: 'Resume too long (max. {max} characters).',
      loadingStepUpload: 'Uploading file and extracting content...',
      loadingStepPreview: 'Evaluating your resume across 8 dimensions...',
      saveErrorFallback: 'Error saving resume.',
      saveSuccess: 'Resume saved! See your score across the 8 dimensions.',
      saveConnectionError: 'Connection error while uploading the resume. Check your network and try again.',
      heroTitle: 'Premium AI Audit',
      heroDesc: 'Executive predictive analysis, advanced LinkedIn/Gupy SEO, target-job match percentage, and career vocational guidance across 8 dimensions.',
      badge1Title: '8 Dimensions',
      badge1Desc: 'Executive Audit',
      badge2Title: 'Social SEO',
      badge2Desc: 'LinkedIn & Portfolio',
      badge3Title: 'Job Match',
      badge3Desc: 'Profile Fit',
      badge4Title: 'STAR Method',
      badge4Desc: 'Writing Correction',
      cardTitle: 'Resume content',
      cardDesc: 'Min. {min} characters · Max. {max}',
      attachButton: 'Attach file (.pdf, .txt, .md)',
      contentLabel: 'Resume (text)',
      contentPlaceholder: 'Example:\n\nJohn Smith\nFront-end Developer\njohn@email.com | (555) 999-9999 | linkedin.com/in/johnsmith\n\nSUMMARY\nFront-end developer with 5 years of experience in React, TypeScript, and design systems...\n\nEXPERIENCE\nSenior Front-end - Company X (2022-present)\n- Led the migration from Angular to React...\n- Reduced load time by 40%...\n\n...',
      charCountUnit: 'characters',
      formatMarkdown: 'Markdown',
      formatText: 'Text',
      formatToggle: 'toggle',
      targetJobLabel: 'Target Role or Job (Optional)',
      targetJobBadge: 'Or paste the job posting link below 🔗',
      importUrlLabel: 'Import Job Posting by Link (LinkedIn, Indeed, etc.)',
      importUrlPlaceholder: 'https://www.linkedin.com/jobs/view/...',
      importUrlButton: 'Import Link',
      targetJobPlaceholder: 'E.g.: Senior Project Manager, React Developer, Financial Analyst...',
      targetJobDescLabel: 'Target Job Description or Requirements (Copy & Paste or Text Extracted from Link)',
      targetJobDescPlaceholder: 'Paste the requirements, qualifications, and responsibilities here so we can calculate the exact Match % and point out knowledge gaps (or use the \'Import Link\' button above)...',
      socialTitle: 'Digital Presence & Global Professional Profiles (Optional)',
      socialDesc: 'Enter links to the networks and platforms relevant to your field and target market (LinkedIn, GitHub, Behance, Xing, StackOverflow, etc.).',
      addProfileButton: 'Add profile',
      platformPlaceholder: 'Network / Platform',
      profileUrlPlaceholder: 'Profile link (e.g.: https://...)',
      removeProfileTitle: 'Remove profile',
      consentText: 'I authorize Griffo\'s intelligence to analyze my provided profiles and generate personalized recommendations for positioning and optimizing my global digital presence.',
      secureEnvBadge: 'Secure Environment · GDPR Compliance',
      cancelButton: 'Cancel',
      submitButtonLoading: 'Initializing AI…',
      submitButton: 'Start Audit',
      whatWillBeAnalyzedLabel: 'What will be analyzed:',
      whatWillBeAnalyzedDesc: 'structure, summary, results (STAR/XYZ), hard/soft skills, ATS keywords, career trajectory, course/training suggestions, and global digital presence optimization (LinkedIn, GitHub, Behance, etc.).',
    },
    analysis: {
      loadingText: 'Loading resume analysis...',
      notFoundText: 'No resume found to display the analysis.',
      uploadButton: 'Upload resume',
      loadErrorFallback: 'Error loading.',
      connectionError: 'Connection error.',
      reportTitle: 'Analysis report',
      startingAnalysis: 'Starting predictive analysis across 8 dimensions...',
      processingAuto: 'Your report is being processed automatically by AI — no further clicks needed.',
      retryButton: 'Try again',
      orientationSuccess: 'Vocational Orientation diagnosis generated successfully!',
      orientationErrorFallback: 'The diagnosis could not be completed this time. Nothing was charged — try again.',
      orientationConnectionError: 'Connection error while generating the vocational orientation. Check your connection and try again.',
      letterSuccess: 'Cover letter and professional summary generated.',
      letterErrorFallback: 'The letter could not be written this time. Nothing was charged — try again.',
      letterConnectionError: 'Connection error while generating the letter. Check your connection and try again.',
      copiedTemplate: '{label} copied.',
      copyErrorFallback: 'Could not copy. Select the text and copy it manually.',
      dimRelevanceToRole: 'Relevance to the Role',
      dimExperienceImpact: 'Impact of Experience',
      dimClarityFormatting: 'Clarity & Formatting',
      dimAtsOptimization: 'ATS Optimization',
      dimKeywordIntegration: 'Keyword Integration',
      dimStructure: 'Structure & ATS Compatibility',
      dimSummary: 'Summary & Positioning',
      dimImpact: 'Results (STAR/XYZ)',
      dimSkills: 'Skills & Tools',
      dimExperience: 'Experience & Action Verbs',
      dimKeywords: 'Keywords & Match',
      dimCareer: 'Career Path & Plan',
      dimUpskilling: 'Upskilling & Courses',
      dimEducation: 'Education & Courses',
      dimLanguage: 'Language & Tone',
      tabAll: 'Full View',
      tabOverview: 'Score & Verdict',
      tabSocial: 'Social Media & Profiles',
      tabMatch: 'Target Job Match',
      tabCareer: 'Vocational Agent',
      tabLetter: 'Letter & Summary',
      tabDimensions: '8 Dimensions',
      tabTargeted: 'STAR/XYZ Edits',
      scoreNotEvaluated: 'Score not evaluated',
      atsApprovedSticky: 'ATS approved',
      atsRejectedSticky: 'ATS rejected',
      atsNotEvaluatedSticky: 'ATS not evaluated',
      viewFullReport: 'View full report',
      scoreAuditLabel: 'Score Audit',
      atsPass: 'ATS PASS',
      atsFail: 'ATS FAIL',
      atsNotEvaluated: 'ATS NOT EVALUATED',
      calcDimensionsLabel: 'Dimension Calculation',
      algorithmicAverage: 'Algorithmic Average',
      noDimensionScores: 'This report did not include per-dimension scores. Reprocess the analysis to get them.',
      scoreLabelNotEvaluated: 'Not evaluated',
      scoreLabelExcellent: 'Excellent',
      scoreLabelGood: 'Good',
      scoreLabelRegular: 'Fair',
      scoreLabelNeedsImprovement: 'Needs improvement',
      performanceByDimension: 'Performance by dimension',
      noChartData: 'No per-dimension scores in this report — nothing to plot.',
      executiveTitle: 'Professional Profile Analysis & Executive Verdict',
      executiveDesc: 'Consolidated technical assessment based on your resume and HR best practices',
      noSummaryFallback: 'The executive summary was not produced in this analysis. Reprocess the resume to generate it — no new charge.',
      strengthsTitle: 'Profile Strengths',
      noStrengths: 'No strengths recorded.',
      weaknessesTitle: 'Points of Attention (Weaknesses)',
      noWeaknesses: 'No critical points of attention.',
      recommendationsTitle: 'Practical Improvement Suggestions',
      recommendationsDesc: 'Recommended actions to increase your interview chances',
      keywordsTitle: 'Suggested ATS Keywords',
      keywordsDesc: 'Add these strategic keywords to your resume to get past automated filters',
      matchTitle: 'Target Job Compatibility Analysis',
      matchTargetJobPrefix: 'Target Role: {job}',
      matchNoTargetJob: 'Comparison of requirements vs. the candidate\'s knowledge',
      matchScoreLabel: 'Match Score:',
      matchVerdictLabel: 'Fit Assessment:',
      matchedReqTitle: 'Requirements Met (Knowledge OK)',
      noMatchedReq: 'No requirement directly matched.',
      missingReqTitle: 'Missing Requirements / Gaps to Develop',
      noMissingReq: 'Congratulations! No critical gaps found.',
      actionPlanLabel: 'Action Plan & Guidance to Perform Better:',
      matchToneIncompatibleHeadline: 'This role requires qualifications the resume doesn\'t meet',
      matchToneIncompatibleDetail: 'This application is likely to be rejected in initial screening, and no text edit changes that. This is not a verdict on your resume: it is the distance between it and THIS role. Compare it with a role in your field to see the difference.',
      matchTonePartialHeadline: 'This role is within reach, with adjustments',
      matchTonePartialDetail: 'There are gaps, but the kind your resume can fix: emphasis, keywords, and evidence of what you\'ve already done. The missing requirements below are the list of what to tackle.',
      matchToneAlignedHeadline: 'Your profile fits this role',
      matchToneAlignedDetail: 'The main requirements are covered. The remaining work here is polish — making explicit what\'s already in the resume.',
      dimensionsDetailTitle: 'Dimension breakdown',
      dimensionsDetailDesc: 'ATS criteria, executive recruiting, career plan, and upskilling',
      noTargetedTitle: 'No targeted edits in this report',
      noTargetedDesc: 'This analysis did not return specific resume excerpts to adjust. Reprocessing the resume usually resolves this — no new charge.',
      targetedTitle: 'Where & Why to Adjust (Point-by-Point Diagnosis)',
      targetedDesc: 'The AI identified exact excerpts that are lowering your score and explains the impact of each change.',
      currentTextLabel: 'Current Excerpt in the Resume',
      suggestedTextLabel: 'Recommended Suggestion (STAR/XYZ Formula)',
      rationaleLabel: 'Technical Rationale & Reason for the Change:',
      careerTitle: 'Not sure which role to pursue? Vocational Career Orientation',
      careerDesc: 'Our Career Agent reads your profile and points to the 3 areas/roles with the best fit to what you\'ve already built. Already included in this resume\'s Full Analysis.',
      updateDiagnosisButton: 'Update Diagnosis',
      discoverAreaButton: 'Discover My Ideal Area',
      mappingAreas: 'Mapping the 3 areas with the best fit for your profile...',
      careerTimeEstimate: 'Usually takes 15 to 40 seconds. Don\'t close this page.',
      profileSummaryLabel: 'Identified Profile Summary:',
      optionLabel: 'Option #{n}',
      adherenceLabel: '{pct}% fit',
      recommendedSkillsLabel: 'Recommended skills:',
      adherenceDisclaimer: 'Fit measures how close your trajectory is to what these areas typically require. It is not a hiring probability or a labor-market measurement.',
      careerAdviceLabel: 'Strategic Career Advice:',
      letterTitle: 'Cover Letter & Professional Summary',
      letterDesc: 'Written from your actual resume and targeted to the role, in the application format of your market. Already included in this resume\'s Full Analysis.',
      regenerateLetterButton: 'Generate again',
      writeLetterButton: 'Write my letter',
      writingLetterText: 'Writing the targeted letter and summary...',
      letterTimeEstimate: 'Usually takes 20 to 45 seconds. Don\'t close this page.',
      letterEmptyState: 'Not yet generated for this resume. It uses the target role you provided at upload — the more complete the job description, the more targeted both texts become.',
      letterTargetedTo: 'Targeted to: {job}',
      summaryLabel: 'Professional summary',
      copyButton: 'Copy',
      summaryFootnote: 'This is the resume\'s opening paragraph. The LinkedIn "About" text is different, and lives in the Social Media & Profiles tab.',
      letterLabel: 'Cover letter',
      letterKeywordsLabel: 'Job terms incorporated into the texts',
      ctaTitle: 'Ready to improve your resume?',
      ctaDesc: 'With your authorization, we rewrite the resume applying all the recommendations above.',
      ctaButton: 'Rewrite resume',
    },
  },

  es: {
    nav: {
      features: 'Funciones',
      social: 'Huella Digital',
      howItWorks: 'Cómo funciona',
      plans: 'Planes',
      faq: 'Preguntas',
      login: 'Iniciar sesión',
      signup: 'Analizar gratis',
      myPanel: 'Mi Panel',
      freeAnalysis: 'Analizar gratis',
    },
    hero: {
      badge: 'IA + Estándares Globales de Reclutamiento, LinkedIn y ATS',
      title1: 'Destaca tu ',
      titleAccent: 'currículum',
      title2: ' y consigue las mejores oportunidades.',
      subtitle: 'Sube tu currículum en segundos y recibe un informe técnico completo en 8 dimensiones. Descubre tu compatibilidad con filtros ATS (Workday, Taleo, Gupy) y obtén recomendaciones para optimizar tus perfiles profesionales.',
      ctaPrimary: 'Analizar mi currículum ahora',
      ctaSecondary: 'Ya tengo una cuenta',
      badgeFree: 'Análisis Gratuito',
      badgeNoCard: 'Sin Tarjeta de Crédito',
      badgeSecurity: 'Conforme a RGPD',
      badgeSafe: '100% Seguro y Confidencial',
    },
    mockup: {
      title: 'Informe Técnico de Evaluación',
      precision: 'ALTA PRECISIÓN',
      overallScore: 'Puntuación General de Calificación',
      atsApproved: 'Aprobado en ATS',
      atsSub: 'Compatible con Workday, Taleo y ATS',
      dim1: 'Estructura y Lectura Automática (ATS)',
      dim2: 'Impacto Cuantificado y Métricas',
      dim3: 'Alineación de Palabras Clave de Mercado',
      dim4: 'Trayectoria y Posicionamiento',
      suggestionTitle: 'Sugerencia de Titular Optimizado (LinkedIn / Portales)',
      suggestionText: '"Líder de Operaciones y Eficiencia | Gestión de Equipos Multidisciplinarios | Optimización de Procesos y Escala"',
    },
    stats: {
      dimTitle: '8 Dimensiones',
      dimSub: 'Análisis detallado multi-ángulo',
      atsTitle: 'Compatibilidad ATS',
      atsSub: 'Verificación de filtros de selección',
      globalTitle: 'Perfiles Estratégicos',
      globalSub: 'LinkedIn, GitHub, Behance y portafolios',
      pdfTitle: 'PDF y Editable',
      pdfSub: 'Reescritura profesional lista para usar',
    },
    social: {
      badge: 'Presencia Digital y Posicionamiento Global',
      title: 'Tu carrera va más allá del papel. Optimiza tus perfiles en cualquier plataforma.',
      subtitle: 'Con GriffoWork, fortaleces tu imagen profesional tanto en el currículum como en las plataformas y redes estratégicas de tu sector.',
      card1Title: 'LinkedIn y Portales Profesionales',
      card1Sub: "Titulares optimizados, redacción de la sección 'Sobre mí' y palabras clave para destacar ante reclutadores.",
      card2Title: 'Portafolios y Redes Especializadas',
      card2Sub: 'Recomendaciones personalizadas para GitHub, Behance, Stack Overflow, Kaggle, Xing y portafolios.',
      lgpdBadge: 'RGPD / Privacidad',
      optInTitle: 'Optimización Autorizada por el Usuario',
      linkedInHead: 'LinkedIn — Titular Profesional Estratégico',
      behanceHead: 'Portafolio / Behance — Posicionamiento de Impacto',
      gupyHead: 'Sistemas ATS — Palabras Clave Estratégicas',
      linkedInExample: '"Líder de Operaciones y Eficiencia | Gestión de Equipos Multidisciplinarios | Optimización de Procesos y Escala"',
      behanceExample: '"Destaca casos de estudio con impacto medible (ej.: \'Rediseño de flujo que incrementó la conversión en +35%\') en la portada del portafolio."',
      gupyExample: '"Alineación estratégica con las competencias y palabras clave más buscadas por los reclutadores en tu sector."',
    },
    features: {
      badge: 'Funciones Completas',
      title: 'Todo lo que necesitas para destacar en las selecciones.',
      subtitle: 'Diseñado en base a las mejores prácticas de Recursos Humanos, estándares internacionales y criterios ATS.',
      f1Title: 'Evaluación en 8 Dimensiones',
      f1Desc: 'Análisis minucioso de estructura, resumen profesional, resultados cuantificados, habilidades clave, compatibilidad ATS y coherencia de carrera.',
      f2Title: 'Compatibilidad con Sistemas ATS',
      f2Desc: 'Evaluamos la legibilidad y formato de tu currículum para garantizar que sea procesado sin errores por los sistemas de selección.',
      f3Title: 'Reescritura Profesional',
      f3Desc: 'Con tu autorización, optimizamos la descripción de tus experiencias para resaltar logros e impacto real, manteniendo 100% la veracidad.',
      f4Title: 'Optimización de Presencia Digital',
      f4Desc: 'Recomendaciones personalizadas para tu perfil de LinkedIn, GitHub, Behance, Xing y redes profesionales para atraer reclutadores.',
      f5Title: 'Descarga en PDF y Formato Editable',
      f5Desc: 'Exporta tu currículum reescrito e informe técnico en formatos PDF de alta resolución y archivos editables.',
      f6Title: 'Privacidad y Seguridad Total',
      f6Desc: 'Tus datos están encriptados y protegidos en estricto cumplimiento del RGPD. Nunca vendemos ni compartimos tus datos.',
      f7Title: 'Radar de Empleos con IA',
      f7Desc: 'Monitoreamos miles de ofertas de empleo cada día y te avisamos solo cuando encontramos una que realmente combina con tu perfil — sin spam, sin ofertas genéricas.',
      f8Title: 'Orientación de Carrera',
      f8Desc: 'Diagnóstico vocacional que señala las áreas y cargos donde tu trayectoria tiene más fuerza, con próximos pasos concretos.',
      f9Title: 'Carta de Presentación Dirigida',
      f9Desc: 'Una carta escrita para la vacante específica, destacando los requisitos que cumples — lista para enviar junto con tu currículum.',
    },
    how: {
      badge: 'Paso a paso',
      title: 'Del envío a tu nuevo currículum en 5 sencillos pasos.',
      subtitle: 'Rápido, transparente y bajo tu control en todas las fases.',
      s1Title: 'Sube tu Currículum',
      s1Desc: 'Adjunta un archivo PDF, documento de texto o pega directamente el contenido.',
      s2Title: 'Enlaza tus Perfiles (Opcional)',
      s2Desc: 'Ingresa opcionalmente tus enlaces profesionales (LinkedIn, GitHub, portafolio, etc.).',
      s3Title: 'Recibe el Informe',
      s3Desc: 'Revisa tu puntuación 0–10 en 8 dimensiones con fortalezas y áreas de mejora.',
      s4Title: 'Solicita la Reescritura',
      s4Desc: 'Con un clic, autoriza la reestructuración profesional enfocada en impacto y resultados.',
      s5Title: 'Descarga y Postula',
      s5Desc: 'Descarga la versión final lista para postular a empleos de inmediato.',
    },
    pricing: {
      badge: 'Pago único, sin suscripción',
      title: 'Una compra. El informe completo.',
      subtitle: 'Sube tu currículum, mira tu nota gratis y desbloquea el informe completo cuando quieras. Sin mensualidades, sin permanencia ni cobros automáticos.',
      productTitle: 'Análisis Completo',
      productDesc: 'Nueve entregas en una sola compra, para el currículum que elijas.',
      oneTime: 'Pago único. Sin suscripción ni renovación automática.',
      includesTitle: 'Lo que recibes',
      items: [
        'Informe de 8 Dimensiones',
        'Comparación con la Vacante',
        'Diagnóstico Punto por Punto del CV',
        'Reescritura de Experiencias con Enfoque en Impacto',
        'Orientación Profesional',
        'Presencia Digital y Optimización de Perfil',
        'Carta de Presentación',
        'Resumen Profesional',
        'Descarga en PDF',
      ],
      buyCta: 'Comprar Análisis Completo',
      previewTitle: 'Mira tu nota gratis',
      previewDesc: 'Sube tu currículum y recibe las notas de 0 a 10 en las 8 dimensiones, sin pagar nada. Una vista previa por cuenta.',
      previewCta: 'Ver mi nota gratis',
      localPayment: 'Paga en {currency} con {methods}.',
      packTitle: '¿Vas a postular a más vacantes?',
      packDesc: '5 Análisis Completos, uno para cada currículum o vacante que quieras trabajar.',
      packCta: 'Comprar 5 análisis por {price}',
      packPerAnalysis: '{price} por análisis',
      businessTitle: 'Empresas y RR. HH.',
      businessDesc: 'Volumen, facturación e integración corporativa con tu proceso de selección.',
      businessCta: 'Hablar con el equipo comercial',
    },
    faq: {
      badge: 'Preguntas Frecuentes',
      title: '¿Tienes alguna duda?',
      subtitle: 'Respuestas a las preguntas más comunes de nuestros usuarios.',
      q1: '¿Cómo funciona la verificación de compatibilidad ATS (Workday, Taleo, Greenhouse)?',
      a1: 'Nuestra inteligencia evalúa la estructura, legibilidad de secciones, jerarquía de encabezados y términos clave según los estándares de los principales sistemas ATS del mercado.',
      q2: '¿La IA inventa información o experiencias falsas?',
      a2: 'Nunca. GriffoWork sigue una política estricta de veracidad: mantenemos 100% de tus empresas, cargos, fechas y formación reales, destacando logros y resultados.',
      q3: '¿Cómo funciona la optimización de perfiles (LinkedIn, GitHub, Behance)?',
      a3: 'Con tu autorización, la plataforma genera titulares estratégicos, resúmenes "Sobre mí" y recomendaciones para posicionarte mejor ante los reclutadores de tu sector.',
      q4: '¿Mis datos están seguros?',
      a4: 'Totalmente. Operamos en estricto cumplimiento del RGPD. Tus datos están encriptados y nunca se comparten ni venden a terceros.',
      q5: '¿Necesito una suscripción o pago recurrente?',
      a5: 'No. Pagas una única vez por el Análisis Completo de ese currículum y recibes las nueve entregas. Sin mensualidad, sin renovación automática y sin saldo que administrar.',
    },
    ctaFinal: {
      title: '¿Listo para transformar tu presentación profesional?',
      subtitle: 'Crea tu cuenta gratuita ahora y recibe el informe técnico de tu currículum en segundos. Sin tarjeta de crédito.',
      button: 'Analizar mi currículum gratis',
    },
    footer: {
      desc: 'Plataforma de Inteligencia de Carrera y optimización de presencia digital basada en los mejores estándares de reclutamiento.',
      navTitle: 'Navegación',
      secTitle: 'Seguridad y Privacidad',
      contactTitle: 'Contacto y Dominio Oficial',
      rights: 'GriffoWork. Todos los derechos reservados. Conforme al RGPD.',
    },
    auth: {
      welcomeBack: 'Bienvenido de nuevo',
      createAccount: 'Crea tu cuenta',
      loginSub: 'Inicia sesión para acceder a tus informes.',
      signupSub: 'Análisis gratuito. Sin tarjeta de crédito.',
      fullName: 'Nombre completo',
      email: 'Correo o Usuario',
      password: 'Tu contraseña',
      profession: 'Puesto o Profesión (Opcional)',
      loginBtn: 'Iniciar sesión',
      signupBtn: 'Crear mi cuenta gratis',
      noAccount: '¿Aún no tienes cuenta? Regístrate gratis',
      hasAccount: '¿Ya tienes una cuenta? Inicia sesión',
    },
    app: {
      dashboard: 'Panel',
      upload: 'Subir currículum',
      analysis: 'Informe',
      rewrite: 'Reescritura',
      downloads: 'Descargas',
      history: 'Historial',
      plans: 'Comprar Análisis',
      settings: 'Configuración',
      admin: 'Área Admin',
      balance: 'Análisis',
      balanceUnit: 'análisis disponibles',
      buyMore: '+ Comprar',
      greeting: 'Hola',
      greetingSub: 'Aquí tienes el resumen de tu actividad en GriffoWork.',
      newResume: 'Nuevo currículum',
    },
    profile: {
      loadErrorFallback: 'No fue posible cargar el perfil.',
      loadConnectionError: 'Fallo de conexión al cargar el perfil.',
      saveMaxLessThanMinError: 'La pretensión máxima no puede ser menor que la mínima.',
      saveSuccessWithRadarOne: 'Perfil guardado. El Radar encontró {n} oportunidad — revisa la pantalla Radar.',
      saveSuccessWithRadarMany: 'Perfil guardado. El Radar encontró {n} oportunidades — revisa la pantalla Radar.',
      saveSuccessNoRadar: 'Perfil profesional guardado.',
      saveErrorFallback: 'No fue posible guardar el perfil.',
      saveConnectionError: 'Fallo de conexión al guardar el perfil.',
      fillErrorFallback: 'No fue posible leer tu currículum ahora.',
      fillNothingToFill: 'Nada que completar: los campos que podría responder ya están completos.',
      fillSuccessOne: '{n} campo completado. Revisa y guarda.',
      fillSuccessMany: '{n} campos completados. Revisa y guarda.',
      fillConnectionError: 'Fallo de conexión al leer tu currículum.',
      loadingText: 'Cargando tu perfil profesional...',
      cardTitle: 'Perfil Profesional',
      cardDesc: 'Desde aquí Griffo entiende quién eres profesionalmente y para qué mercado debes trabajar. Complétalo poco a poco — nada es obligatorio.',
      fillButton: 'Completar con lo que ya sé sobre ti',
      fillDesc: 'Lee tu último currículum y tu diagnóstico vocacional y completa solo los campos vacíos. Nada se guarda hasta que revises y hagas clic en guardar.',
      marketInfoIntro: 'El mercado que declaras aquí cambia las recomendaciones: qué sistemas de selección mencionamos, el formato esperado del currículum y el vocabulario de los puestos.',
      marketInfoWithMarket: 'Hoy tus análisis usan {market}.',
      marketInfoWithoutMarket: 'Sin mercado declarado, usamos tu país de acceso como referencia.',
      filledBadge: 'Completado',
      notInformed: 'No informado',
      countryGroupAdapted: 'Con adaptación propia',
      countryGroupOthers: 'Demás países',
      globalMarketName: 'Global / Remoto internacional',
      removeAria: 'Quitar {value}',
      sectionIdentityTitle: 'Identidad profesional',
      fieldCurrentTitle: 'Puesto actual',
      placeholderCurrentTitle: 'Ej: Analista de Datos',
      fieldArea: 'Área de actuación',
      placeholderArea: 'Ej: Datos y Analítica',
      fieldSeniority: 'Nivel de experiencia',
      fieldYearsExperience: 'Años de experiencia',
      fieldEducation: 'Formación',
      fieldSpecializations: 'Especializaciones',
      placeholderSpecializations: 'Ej: Modelado dimensional',
      fieldSkills: 'Competencias',
      hintSkills: 'Las herramientas y habilidades que quieres que aparezcan en las recomendaciones.',
      placeholderSkills: 'Ej: SQL',
      sectionObjectivesTitle: 'Objetivos',
      fieldTargetRoles: 'Puestos objetivo',
      hintTargetRoles: 'Los puestos que quieres disputar — no necesariamente lo que haces hoy.',
      placeholderTargetRoles: 'Ej: Data Analyst',
      fieldTargetFields: 'Áreas objetivo',
      placeholderTargetFields: 'Ej: Producto',
      fieldTargetIndustries: 'Sectores de interés',
      placeholderTargetIndustries: 'Ej: Salud',
      fieldCareerGoal: 'Trayectoria deseada',
      placeholderCareerGoal: '¿Hacia dónde quieres llevar tu carrera en los próximos años?',
      sectionLocationTitle: 'Dónde estás y dónde quieres trabajar',
      hintLocationIntro: 'Son preguntas distintas a propósito. Vivir en un país no significa querer trabajar en él.',
      fieldResidenceCountry: 'País donde vives',
      hintResidenceCountry: 'Los países del primer grupo tienen adaptación propia — formato de currículum, tipos de contrato, sistemas de selección. Los demás usan el estándar internacional.',
      fieldResidenceRegion: 'Estado / región',
      fieldResidenceCity: 'Ciudad',
      fieldTargetCountry: 'País donde quieres trabajar',
      fieldOtherMarkets: 'Otros países donde también aceptarías trabajar',
      hintOtherMarkets: 'Marca los que quieras. Deja todo desmarcado si solo quieres el país principal.',
      switchRelocationTitle: 'Disponible para cambiar de país',
      switchRelocationDesc: 'Acepta mudarse físicamente a otro país.',
      switchRemoteTitle: 'Acepta trabajo remoto internacional',
      switchRemoteDesc: 'Trabajar desde donde vives para una empresa de otro país. No es lo mismo que mudarse de país.',
      sectionPreferencesTitle: 'Preferencias de trabajo',
      fieldWorkModes: 'Modalidades de trabajo aceptadas',
      fieldContractTypes: 'Tipos de contrato aceptados',
      hintContractTypes: 'En el vocabulario de tu mercado: tiempo completo, medio tiempo, contractor...',
      placeholderContractTypes: 'Ej: tiempo completo',
      fieldWorkload: 'Jornada',
      fieldSalary: 'Pretensión salarial',
      hintSalary: 'En la moneda del mercado al que apuntas. No tiene relación con la moneda en la que pagas por los análisis — esa la define tu medio de pago.',
      placeholderSalaryMin: 'Mínimo',
      placeholderSalaryMax: 'Máximo',
      placeholderSalaryPeriod: 'Período',
      sectionLanguagesTitle: 'Idiomas',
      hintLanguagesIntro: 'El idioma de la pantalla no decide el idioma de tu currículum. Si apuntas a otro país, probablemente sean distintos.',
      fieldResumeLanguage: 'Idioma del currículum y de la carta',
      fieldCommLanguage: 'Idioma de los avisos por correo',
      saveButton: 'Guardar perfil',
      seniorityIntern: 'Prácticas',
      seniorityJunior: 'Junior',
      seniorityMid: 'Semi-senior',
      senioritySenior: 'Senior',
      seniorityLead: 'Líder / Coordinación',
      seniorityPrincipal: 'Especialista / Principal',
      seniorityDirector: 'Dirección',
      seniorityExecutive: 'Ejecutivo (C-level)',
      educationNone: 'Sin formación declarada',
      educationHighSchool: 'Educación media',
      educationTechnical: 'Técnico',
      educationBachelor: 'Licenciatura',
      educationPostgrad: 'Posgrado',
      educationMaster: 'Maestría',
      educationPhd: 'Doctorado',
      workModeRemote: 'Remoto',
      workModeHybrid: 'Híbrido',
      workModeOnsite: 'Presencial',
      weeklyHoursFullTime: 'Tiempo completo',
      weeklyHoursPartTime: 'Medio tiempo',
      weeklyHoursFlexible: 'Flexible',
      salaryPeriodYear: 'por año',
      salaryPeriodMonth: 'por mes',
      salaryPeriodHour: 'por hora',
      languagePt: 'Portugués',
      languageEn: 'Inglés',
      languageEs: 'Español',
    },
    history: {
      title: 'Historial',
      subtitle: 'Todos los currículums que has enviado.',
      newButton: 'Nuevo',
      emptyTitle: 'Ningún currículum enviado',
      emptyDesc: 'Tu historial aparecerá aquí.',
      emptyButton: 'Enviar currículum',
      statusUploaded: 'Enviado',
      statusAnalyzed: 'Analizado',
      statusRewriteRequested: 'Reescritura solicitada',
      statusRewritten: 'Reescrito',
      statusConfirmed: 'Confirmado',
      deleteConfirm: '¿Eliminar este currículum de forma permanente? Esta acción no se puede deshacer.',
      deleteSuccess: 'Currículum eliminado.',
      deleteError: 'Error al eliminar.',
      resumeOf: 'Currículum del {date}',
      updatedAt: 'Actualizado el {date}',
    },
    dashboard: {
      accountLabelActive: 'Análisis Completo disponible',
      accountLabelDefault: 'Cuenta Griffo',
      greeting: 'Hola, {name} 👋',
      defaultName: 'candidato/a',
      subtitle: 'Bienvenido/a a tu panel ejecutivo de GriffoWork.',
      newResumeButton: 'Nuevo currículum',
      activeBadge: 'Activo',
      planCardDesc: 'Una compra desbloquea el Análisis Completo de un currículum: informe de 8 dimensiones, comparación con la vacante, secciones a ajustar, reescritura, orientación, presencia digital, carta, resumen y PDF.',
      balanceLabel: 'Análisis Disponibles',
      quickUploadLabel: 'Enviar currículum',
      quickUploadDesc: 'Pega o adjunta',
      quickViewLabel: 'Ver informe',
      quickViewDesc: 'Puntuación 0–10',
      quickRewriteLabel: 'Reescribir',
      quickRewriteDesc: 'Con tu autorización',
      quickDownloadsLabel: 'Descargas',
      quickDownloadsDesc: 'PDF y Markdown',
      statIssuedReports: 'Informes Emitidos',
      statImprovedResumes: 'Currículums Mejorados',
      historyTitle: 'Historial de Procesamiento',
      historySubtitle: 'Tus últimos currículums procesados por inteligencia artificial',
      historyViewAll: 'Ver historial completo',
      syncing: 'Sincronizando datos…',
      emptyTitle: 'Ningún currículum en auditoría',
      emptyDesc: 'Inicia una auditoría gratuita ahora para descubrir las debilidades y el potencial de tu currículum según las métricas de las big tech.',
      emptyButton: 'Iniciar Auditoría IA',
      reportOf: 'Informe del {date}',
      lastUpdated: 'Última actualización: {date}',
      statusUploaded: 'Enviado',
      statusAnalyzed: 'Analizado',
      statusRewriteRequested: 'Reescritura solicitada',
      statusRewritten: 'Reescrito',
      statusConfirmed: 'Confirmado',
    },
    settings: {
      title: 'Configuración',
      subtitle: 'Gestiona tu perfil, privacidad y preferencias.',
      profileCardTitle: 'Perfil',
      profileCardDesc: 'Información básica de tu cuenta',
      emailLabel: 'Correo electrónico',
      emailHint: 'El correo electrónico no se puede cambiar.',
      nameLabel: 'Nombre completo',
      professionLabel: 'Profesión',
      professionPlaceholder: 'Ej: Desarrolladora Front-end',
      socialLabel: 'Redes Sociales y Perfiles Profesionales (Predeterminado para el Análisis)',
      addProfileButton: 'Agregar perfil',
      socialHint: 'Registra aquí los enlaces de tu LinkedIn, Gupy, GitHub, etc. Se completarán automáticamente en todos los nuevos análisis.',
      socialUrlPlaceholder: 'Enlace de tu perfil ({platform})',
      saveButton: 'Guardar cambios',
      saveErrorFallback: 'Error al guardar.',
      saveSuccess: '¡Perfil y redes sociales guardados con éxito!',
      planCardTitle: 'Plan actual',
      planCardDesc: 'Tu suscripción actual',
      planFree: 'Gratuito',
      planDay: 'Pase Diario',
      planMonthly: 'Mensual',
      planAnnual: 'Anual',
      planUnknown: '—',
      planExpiresAt: 'Vence el {date}',
      viewPlansButton: 'Ver planes',
      marketplaceCardTitle: 'Mercado de talentos',
      marketplacePhaseBadge: 'Fase 2',
      marketplaceCardDesc: 'Controla si los reclutadores asociados pueden encontrarte',
      marketplaceAlert: 'Los reclutadores verificados podrán buscar candidatos por puntuación, dimensiones de fortaleza y palabras clave. Tú tienes el control: puedes activarlo o desactivarlo en cualquier momento. Los datos sensibles (correo, teléfono) solo aparecen después de que aceptes un match.',
      optInTitle: 'Aparecer en búsquedas de reclutadores',
      optInDesc: 'Tus informes (sin datos sensibles) quedan visibles para reclutadores asociados verificados.',
      optInAcceptedToast: 'Aceptaste aparecer para reclutadores asociados (Fase 2). Tus datos sensibles solo se liberarán después de un match aceptado.',
      optOutToast: 'Baja realizada. No aparecerás en búsquedas de reclutadores.',
      optInErrorToast: 'Error al guardar la preferencia.',
      visibleTitle: 'Perfil público para matches',
      visibleDesc: 'Permite que los reclutadores vean tu nombre y profesión (sin contacto) cuando haya un match por palabras clave.',
      consentNote: 'Puedes revocar el consentimiento en cualquier momento. Conforme a la LGPD (Ley n.º 13.709/2018 de Brasil).',
      securityCardTitle: 'Seguridad',
      securityCardDesc: 'Tu contraseña está protegida con hash scrypt y sal única',
      securityPassword: 'Contraseña: hash scrypt + sal aleatoria (no se almacena en texto plano)',
      securitySession: 'Sesión: cookie httpOnly + firma HMAC (no puede ser leída por JS)',
      securityResumes: 'Currículums: vinculados a tu cuenta, visibles solo para ti',
      securityAudit: 'Auditoría: todos los accesos y acciones quedan registrados',
      logoutTitle: 'Cerrar sesión',
      logoutDesc: 'Termina la sesión en este dispositivo.',
      logoutButton: 'Cerrar sesión',
    },
    support: {
      pageTitle: 'Soporte y Dudas de Griffo',
      pageSubtitle: 'Resuelve tus dudas sobre el funcionamiento del sistema, los informes y la facturación.',
      welcomeMessage: '¡Hola! Soy el Asistente Virtual Oficial de Griffo. Estoy aquí para ayudarte con cualquier duda sobre las funcionalidades del sistema, informes, reescrituras y el Análisis Completo. ¿Cómo puedo ayudarte hoy?',
      faq1: '¿Cuánto cuesta y qué incluye?',
      faq2: '¿Qué se analiza en el informe del currículum?',
      faq3: '¿Cómo funciona la reescritura en STAR y XYZ?',
      faq4: '¿Cómo puedo descargar mi informe y currículum?',
      faq5: '¿Qué es el análisis de Presencia Digital y optimización de perfil?',
      botFallback: 'Lo siento, no pude obtener una respuesta.',
      connectionError: 'Ocurrió un error al conectar con soporte. Por favor, inténtalo de nuevo en unos instantes.',
      faqSectionTitle: 'Preguntas frecuentes sugeridas',
      chatHeaderTitle: 'Atención Virtual Griffo',
      chatStatus: 'En línea · Respuestas instantáneas',
      officialBadge: 'Soporte Oficial',
      typingIndicator: 'Escribiendo respuesta...',
      inputPlaceholder: 'Escribe tu duda sobre el sistema o la facturación...',
    },
    downloads: {
      pageTitle: 'Descargas',
      pageSubtitle: 'Descarga el informe y el currículum reescrito en PDF, TXT y Markdown.',
      lockedAlert: 'Las descargas forman parte del Análisis Completo.',
      lockedAlertCta: 'Comprar análisis',
      emptyTitle: 'Ningún currículum disponible.',
      emptyDesc: 'Envía tu currículum para empezar.',
      emptyCta: 'Enviar currículum',
      selectResumeTitle: 'Selecciona el currículum',
      resumeLabel: 'Currículum · {date}',
      updatedAt: 'Actualizado el {date}',
      analysisCardTitle: 'Informe de análisis',
      analysisCardDesc: 'PDF · puntuación 0–10 e informe',
      analysisFirstCta: 'Analizar primero',
      analysisDownloadCta: 'Descargar informe en PDF',
      rewriteCardTitle: 'Currículum reescrito',
      rewriteCardDesc: 'PDF, TXT y Markdown',
      rewriteFirstCta: 'Reescribir primero',
      rewriteDownloadPdf: 'Descargar PDF',
      rewriteDownloadTxt: 'Descargar texto (.txt)',
      rewriteDownloadMd: 'Descargar Markdown (.md)',
      socialCardTitle: 'Presencia Digital',
      socialCardDesc: 'Auditoría de tus perfiles profesionales',
      socialFirstCta: 'Auditar perfiles primero',
      socialDownloadTxt: 'Descargar consejos (.txt)',
      socialDownloadMd: 'Descargar consejos (.md)',
      infoAnalysisPdf: 'PDF del informe:',
      infoAnalysisPdfDesc: 'documento formateado con puntuación general, dimensiones, fortalezas/debilidades y recomendaciones.',
      infoRewrite: 'Currículum reescrito (PDF / TXT / .MD):',
      infoRewriteDesc: 'versiones optimizadas listas para enviar a reclutadores o editar en tu computadora.',
      infoSocial: 'Consejos de Presencia Digital (.TXT / .MD):',
      infoSocialDesc: 'guía práctica de biografía, títulos y palabras clave para aplicar directamente en tu LinkedIn y Gupy.',
      errorNeedsPlan: 'Desbloquea el Análisis Completo de este currículum para descargar los archivos.',
      errorNeedsAnalysis: 'Este currículum aún no tiene un Análisis Completo.',
      errorGeneric: 'Fallo en la descarga.',
      errorDownload: 'Error en la descarga.',
      downloadStarted: '¡Descarga iniciada!',
    },
    rewrite: {
      downloadGenericError: 'Error al descargar el archivo.',
      downloadSuccess: '¡Descarga realizada con éxito!',
      downloadConnectionError: 'Error de conexión al descargar el archivo.',
      authRequiredError: 'Necesitas autorizar la reescritura para continuar.',
      planRequiredError: 'Necesitas un plan activo para reescribir. Elige un plan abajo.',
      planRequiredToast: 'Se necesita un plan para reescribir',
      rewriteErrorFallback: 'Error al reescribir.',
      rewriteSuccessToast: '¡Currículum reescrito! Revísalo abajo.',
      rewriteConnectionError: 'Error de conexión.',
      confirmSuccessToast: '¡Currículum confirmado! Listo para descargar.',
      rejectInfoToast: 'Reescritura descartada. Puedes solicitarla de nuevo.',
      emptyTitle: 'Ningún currículum para reescribir',
      emptyDesc: 'Envía y analiza tu currículum primero.',
      emptyCta: 'Enviar currículum',
      needsAnalysisTitle: 'Analiza antes de reescribir',
      needsAnalysisDesc: 'La reescritura usa el informe para priorizar las mejoras.',
      needsAnalysisCta: 'Ver informe',
      pageTitle: 'Reescritura del currículum',
      pageSubtitle: 'Con tu autorización, la IA reescribe el currículum preservando los hechos.',
      viewReportCta: 'Ver informe',
      authCardTitle: 'Autorización necesaria',
      authCardDesc: 'La IA solo reescribe si la autorizas explícitamente.',
      willDoTitle: 'Lo que la IA hará:',
      willDo1: 'Reescribir viñetas con verbo de acción + contexto + resultado',
      willDo2: 'Reorganizar la jerarquía y optimizar para ATS',
      willDo3: 'Aplicar las recomendaciones del informe (resumen, palabras clave, etc.)',
      willNotTitle: 'Lo que la IA NO hará:',
      willNot1: 'Inventar experiencias, métricas o formación',
      willNot2: 'Cambiar fechas, empresas o puestos',
      willNot3: 'Agregar habilidades que no declaraste',
      authorizeLabel: 'Autorizo a la IA a reescribir mi currículum basándose en el informe de análisis. Entiendo que debo revisar el resultado antes de descargarlo, y que soy responsable de confirmar la veracidad de la información.',
      rewritingButton: 'Reescribiendo… (15–30s)',
      rewriteButton: 'Reescribir mi currículum',
      successCardTitle: '¡Currículum reescrito con éxito!',
      successCardDesc: 'Revisa el contenido a continuación. Si todo está bien, confirma para habilitar la descarga.',
      keywordsCardTitle: '🧩 Palabras Clave Estratégicas (ATS) Incorporadas',
      keywordsCardDesc: 'Estos términos esenciales fueron integrados en la reescritura para garantizar la máxima puntuación en los sistemas de selección (Gupy, LinkedIn, Workday).',
      copyKeywordsCta: 'Copiar términos',
      copyKeywordsToast: '¡Palabras clave copiadas!',
      viewRewrittenCta: 'Ver reescrito',
      viewOriginalCta: 'Ver original',
      regenerateCta: 'Generar de nuevo',
      downloadPdfCta: 'Descargar PDF',
      downloadTxtCta: 'Descargar .TXT',
      downloadMdCta: 'Descargar .MD',
      originalBadge: 'Original',
      rewrittenBadge: 'Reescrito',
      finalReviewTitle: 'Revisión final',
      finalReviewDesc: 'Confirma que toda la información es correcta. Eres responsable de la veracidad de los datos.',
      confirmCta: 'Todo correcto, confirmar y descargar',
      discardCta: 'Descartar reescritura',
      confirmedTitle: '¡Currículum confirmado!',
      confirmedDesc: 'Listo para descargar en PDF y Markdown.',
      goToDownloadsCta: 'Ir a descargas',
    },
    radar: {
      loadingText: 'Cargando tu Radar...',
      loadErrorFallback: 'No fue posible cargar el Radar.',
      loadConnectionError: 'Fallo de conexión al cargar el Radar.',
      cardDesc: 'Monitorea oportunidades para tu perfil y solo te interrumpe cuando encuentra algo que merece tu atención.',
      runNowButton: 'Buscar ahora',
      runNowTooltip: 'Reevalúa las vacantes ya recopiladas contra tu perfil',
      preferencesButton: 'Preferencias',
      freqLabel: 'Con qué frecuencia avisar',
      freqImmediate: 'En cuanto encuentre algo',
      freqDaily: 'Una vez al día',
      freqWeekly: 'Una vez a la semana',
      freqOff: 'Apagado',
      minFitLabel: 'Qué vale la pena avisar',
      minFitStrong: 'Solo las de alta compatibilidad',
      minFitGood: 'Alta y buena compatibilidad',
      minFitPartial: 'Incluso las parciales',
      silentByDefault: 'El Radar es silencioso por defecto: si no hay nada realmente relevante, no envía nada. Ese es el comportamiento esperado, no un fallo.',
      lastRun: 'Último rastreo: {date}.',
      prepareErrorFallback: 'No fue posible preparar tu currículum para esta vacante.',
      prepareRedirected: 'Tu currículum estaba dirigido a "{target}". Ahora apunta a esta vacante.',
      prepareSuccess: 'Currículum dirigido a esta vacante.',
      prepareConnectionError: 'Fallo de conexión al preparar tu currículum.',
      runSuccessOne: '{n} oportunidad nueva.',
      runSuccessMany: '{n} oportunidades nuevas.',
      runNothingNew: 'Nada nuevo que justifique un aviso. El Radar sigue monitoreando.',
      runErrorFallback: 'No fue posible actualizar el Radar ahora.',
      runConnectionError: 'Fallo de conexión al actualizar el Radar.',
      savePrefsErrorFallback: 'No fue posible guardar la preferencia.',
      savePrefsConnectionError: 'Fallo de conexión al guardar la preferencia.',
      feedbackInterestedToast: 'Anotado — buscaremos más así.',
      feedbackNotUsefulToast: 'Anotado. Esto ayuda a calibrar el Radar.',
      feedbackError: 'Error al registrar tu respuesta.',
      invalidLinkError: 'El enlace de esta vacante no es válido y no se puede abrir.',
      needsProfileTitle: 'El Radar necesita tu perfil profesional',
      needsProfileDesc: 'Sin saber qué haces y dónde quieres trabajar, no hay forma de separar la oportunidad del ruido. Completar el mercado principal ya es suficiente para empezar.',
      needsProfileButton: 'Completar perfil profesional',
      notMatchableTitle: 'Falta decir qué haces',
      notMatchableP1Prefix: 'Tu perfil tiene dónde estás y cómo quieres trabajar, pero aún no tiene ',
      notMatchableP1Bold: 'puesto, área o competencias',
      notMatchableP1Suffix: '. Sin eso no hay nada que comparar con una vacante: cualquier resultado sería solo lo que existiera en la base de datos, no lo que tiene relación contigo.',
      notMatchableP2Prefix: 'Completar ',
      notMatchableP2Bold: 'uno',
      notMatchableP2Mid: ' de esos campos ya activa el Radar. El botón ',
      notMatchableP2Em: 'Completar desde el currículum',
      notMatchableP2Suffix: ', en la pantalla del perfil, los extrae todos del currículum que ya enviaste.',
      notMatchableButton: 'Completar perfil profesional',
      emptyTitle: 'Nada digno de mención por ahora',
      emptyDesc: 'El Radar está monitoreando y no encontró ninguna oportunidad que justifique interrumpirte. El silencio aquí es el comportamiento correcto — cuando aparezca algo relevante, aparecerá en esta pantalla.',
      emptyHintPrefix: 'La búsqueda de nuevas vacantes ocurre una vez al día. ',
      emptyHintBold: 'Buscar ahora',
      emptyHintSuffix: ' reevalúa las vacantes ya encontradas contra tu perfil — útil justo después de cambiar algo en él.',
      digestStrong: '{n} de alta compatibilidad',
      digestGood: '{n} compatible',
      digestPartial: '{n} alternativa',
      fitReadErrorFallback: 'Esta oportunidad fue registrada, pero su diagnóstico no pudo leerse. Reaparecerá en un próximo rastreo.',
      compatibilityBadge: 'Compatibilidad {level}',
      compatAlta: 'Alta',
      compatBoa: 'Buena',
      compatParcial: 'Parcial',
      compatBaixa: 'Baja',
      whyRecommendedTitle: 'Por qué lo recomendamos',
      attentionTitle: 'Atención',
      blockersTitle: 'Impedimentos',
      viewJobButton: 'Ver la vacante',
      prepareResumeButton: 'Preparar mi currículum',
      feedbackInterestedNote: '👍 Marcaste esto como interesante.',
      feedbackNotUsefulNote: '👎 Marcaste esto como no útil.',
      feedbackWhatWrong: '¿Qué no sirvió?',
      reasonWrongRole: 'Puesto incorrecto',
      reasonLocation: 'Ubicación',
      reasonSalary: 'Salario',
      reasonSeniority: 'Nivel de experiencia',
      reasonSkills: 'Competencias',
      reasonCompany: 'Empresa',
      reasonWorkMode: 'Modalidad de trabajo',
      reasonOther: 'Otro',
      feedbackAskUseful: '¿Fue útil esta oportunidad?',
      feedbackYes: 'Sí',
      feedbackNo: 'No',
    },
    upload: {
      jobUrlEmptyError: 'Indica la URL de la vacante (ej: https://linkedin.com/jobs/view/...)',
      jobImportedTitleFallback: 'Vacante Importada vía Link',
      jobImportedSuccess: '¡Contenido de la vacante importado con éxito vía link!',
      jobImportErrorFallback: 'Error al importar la vacante desde la URL. Intenta copiar y pegar la descripción manualmente.',
      jobImportConnectionError: 'Fallo de conexión al importar la vacante. Verifica el enlace e intenta de nuevo.',
      fileTooLargeError: 'Archivo demasiado grande (máx. 5MB).',
      pdfAttachedSuccess: '¡Archivo PDF adjuntado con éxito!',
      pdfReadError: 'No fue posible leer el archivo PDF.',
      fileReadError: 'No fue posible leer el archivo.',
      contentTooShortError: 'Currículum demasiado corto. Pega al menos {min} caracteres de texto.',
      contentTooLongError: 'Currículum demasiado largo (máx. {max} caracteres).',
      loadingStepUpload: 'Enviando archivo y extrayendo contenido...',
      loadingStepPreview: 'Evaluando tu currículum en las 8 dimensiones...',
      saveErrorFallback: 'Error al guardar el currículum.',
      saveSuccess: '¡Currículum guardado! Mira tu nota en las 8 dimensiones.',
      saveConnectionError: 'Error de conexión al enviar el currículum. Verifica tu red e intenta de nuevo.',
      heroTitle: 'Auditoría de IA Premium',
      heroDesc: 'Análisis predictivo ejecutivo, SEO avanzado para LinkedIn/Gupy, cálculo de % de coincidencia con vacantes objetivo y orientación vocacional de carrera en 8 dimensiones.',
      badge1Title: '8 Dimensiones',
      badge1Desc: 'Auditoría Ejecutiva',
      badge2Title: 'SEO Social',
      badge2Desc: 'LinkedIn y Portafolio',
      badge3Title: 'Coincidencia de Vacante',
      badge3Desc: 'Ajuste de Perfil',
      badge4Title: 'Fórmula STAR',
      badge4Desc: 'Corrección de Redacción',
      cardTitle: 'Contenido del currículum',
      cardDesc: 'Mín. {min} caracteres · Máx. {max}',
      attachButton: 'Adjuntar archivo (.pdf, .txt, .md)',
      contentLabel: 'Currículum (texto)',
      contentPlaceholder: 'Ejemplo:\n\nMaría Sánchez\nDesarrolladora Front-end\nmaria@email.com | (11) 99999-9999 | linkedin.com/in/mariasanchez\n\nRESUMEN\nDesarrolladora front-end con 5 años de experiencia en React, TypeScript y design systems...\n\nEXPERIENCIA\nFront-end Senior - Empresa X (2022-presente)\n- Lideré la migración de Angular a React...\n- Reduje el tiempo de carga en un 40%...\n\n...',
      charCountUnit: 'caracteres',
      formatMarkdown: 'Markdown',
      formatText: 'Texto',
      formatToggle: 'alternar',
      targetJobLabel: 'Puesto o Vacante Objetivo Deseada (Opcional)',
      targetJobBadge: 'O pega el enlace de la vacante abajo 🔗',
      importUrlLabel: 'Importar Vacante por Enlace (LinkedIn, Indeed, etc.)',
      importUrlPlaceholder: 'https://www.linkedin.com/jobs/view/...',
      importUrlButton: 'Importar Enlace',
      targetJobPlaceholder: 'Ej: Gerente de Proyectos Senior, Desarrollador React, Analista Financiero...',
      targetJobDescLabel: 'Descripción o Requisitos de la Vacante Objetivo (Copiar y Pegar o Texto Extraído del Enlace)',
      targetJobDescPlaceholder: 'Pega aquí los requisitos, calificaciones y funciones de la vacante para calcular el % de coincidencia exacta y detectar brechas de conocimiento (o usa el botón \'Importar Enlace\' arriba)...',
      socialTitle: 'Presencia Digital y Perfiles Profesionales Globales (Opcional)',
      socialDesc: 'Ingresa el enlace de las redes y plataformas relevantes para tu área y mercado objetivo (LinkedIn, GitHub, Behance, Xing, StackOverflow, etc.).',
      addProfileButton: 'Agregar perfil',
      platformPlaceholder: 'Red / Plataforma',
      profileUrlPlaceholder: 'Enlace del perfil (ej: https://...)',
      removeProfileTitle: 'Eliminar perfil',
      consentText: 'Autorizo a la inteligencia de Griffo a analizar mis perfiles proporcionados y generar recomendaciones personalizadas de posicionamiento y optimización de presencia digital global.',
      secureEnvBadge: 'Entorno Seguro · Cumplimiento LGPD',
      cancelButton: 'Cancelar',
      submitButtonLoading: 'Inicializando IA…',
      submitButton: 'Iniciar Auditoría',
      whatWillBeAnalyzedLabel: 'Qué se analizará:',
      whatWillBeAnalyzedDesc: 'estructura, resumen, resultados (STAR/XYZ), hard/soft skills, palabras clave ATS, trayectoria profesional, sugerencia de cursos/capacitación y optimización de presencia digital global (LinkedIn, GitHub, Behance, etc.).',
    },
    analysis: {
      loadingText: 'Cargando análisis del currículum...',
      notFoundText: 'No se encontró ningún currículum para mostrar el análisis.',
      uploadButton: 'Enviar currículum',
      loadErrorFallback: 'Error al cargar.',
      connectionError: 'Error de conexión.',
      reportTitle: 'Informe de análisis',
      startingAnalysis: 'Iniciando análisis predictivo en 8 dimensiones...',
      processingAuto: 'Tu informe se está procesando automáticamente con IA, sin necesidad de nuevos clics.',
      retryButton: 'Intentar de nuevo',
      orientationSuccess: '¡Diagnóstico de Orientación Vocacional generado con éxito!',
      orientationErrorFallback: 'El diagnóstico no pudo completarse en este intento. No se realizó ningún cobro — inténtalo de nuevo.',
      orientationConnectionError: 'Fallo de conexión al generar la orientación vocacional. Verifica tu conexión e inténtalo de nuevo.',
      letterSuccess: 'Carta de presentación y resumen profesional generados.',
      letterErrorFallback: 'La carta no pudo redactarse en este intento. No se realizó ningún cobro — inténtalo de nuevo.',
      letterConnectionError: 'Fallo de conexión al generar la carta. Verifica tu conexión e inténtalo de nuevo.',
      copiedTemplate: '{label} copiado.',
      copyErrorFallback: 'No fue posible copiar. Selecciona el texto y cópialo manualmente.',
      dimRelevanceToRole: 'Relevancia para el Puesto',
      dimExperienceImpact: 'Impacto de las Experiencias',
      dimClarityFormatting: 'Claridad y Formato',
      dimAtsOptimization: 'Optimización ATS',
      dimKeywordIntegration: 'Integración de Palabras Clave',
      dimStructure: 'Estructura y Compatibilidad ATS',
      dimSummary: 'Resumen y Posicionamiento',
      dimImpact: 'Resultados (STAR/XYZ)',
      dimSkills: 'Habilidades y Herramientas',
      dimExperience: 'Experiencia y Verbos de Acción',
      dimKeywords: 'Palabras Clave y Match',
      dimCareer: 'Trayectoria y Plan de Carrera',
      dimUpskilling: 'Capacitación y Cursos',
      dimEducation: 'Formación y Cursos',
      dimLanguage: 'Lenguaje y Tono',
      tabAll: 'Vista Completa',
      tabOverview: 'Puntaje y Veredicto',
      tabSocial: 'Redes y Perfiles Sociales',
      tabMatch: 'Match con Puesto Objetivo',
      tabCareer: 'Agente Vocacional',
      tabLetter: 'Carta y Resumen',
      tabDimensions: '8 Dimensiones',
      tabTargeted: 'Ajustes STAR/XYZ',
      scoreNotEvaluated: 'Puntaje no evaluado',
      atsApprovedSticky: 'ATS aprobado',
      atsRejectedSticky: 'ATS reprobado',
      atsNotEvaluatedSticky: 'ATS no evaluado',
      viewFullReport: 'Ver informe completo',
      scoreAuditLabel: 'Score Audit',
      atsPass: 'ATS PASS',
      atsFail: 'ATS FAIL',
      atsNotEvaluated: 'ATS NO EVALUADO',
      calcDimensionsLabel: 'Cálculo de Dimensiones',
      algorithmicAverage: 'Promedio Algorítmico',
      noDimensionScores: 'Este informe no trajo puntajes por dimensión. Vuelve a procesar el análisis para obtenerlos.',
      scoreLabelNotEvaluated: 'No evaluado',
      scoreLabelExcellent: 'Excelente',
      scoreLabelGood: 'Bueno',
      scoreLabelRegular: 'Regular',
      scoreLabelNeedsImprovement: 'Necesita mejorar',
      performanceByDimension: 'Desempeño por dimensión',
      noChartData: 'Sin puntajes por dimensión en este informe — no hay nada que representar en el gráfico.',
      executiveTitle: 'Análisis del Perfil Profesional y Veredicto Ejecutivo',
      executiveDesc: 'Evaluación técnica consolidada según tu currículum y las mejores prácticas de RR. HH.',
      noSummaryFallback: 'El dictamen ejecutivo no se produjo en este análisis. Vuelve a procesar el currículum para generarlo — sin cobro nuevo.',
      strengthsTitle: 'Puntos Fuertes del Perfil',
      noStrengths: 'Ningún punto fuerte registrado.',
      weaknessesTitle: 'Puntos de Atención (Debilidades)',
      noWeaknesses: 'Ningún punto de atención crítico.',
      recommendationsTitle: 'Sugerencias Prácticas de Mejora',
      recommendationsDesc: 'Acciones recomendadas para aumentar tus posibilidades de entrevista',
      keywordsTitle: 'Palabras Clave ATS Sugeridas',
      keywordsDesc: 'Agrega estas palabras clave estratégicas a tu currículum para pasar los filtros automáticos',
      matchTitle: 'Análisis de Compatibilidad con Puesto Objetivo',
      matchTargetJobPrefix: 'Puesto Objetivo: {job}',
      matchNoTargetJob: 'Comparativo de requisitos frente a los conocimientos del candidato',
      matchScoreLabel: 'Puntaje de Match:',
      matchVerdictLabel: 'Evaluación de Adecuación:',
      matchedReqTitle: 'Requisitos Cumplidos (Conocimientos OK)',
      noMatchedReq: 'Ningún requisito directamente coincidente.',
      missingReqTitle: 'Requisitos Faltantes / Brechas a Desarrollar',
      noMissingReq: '¡Felicidades! No se encontraron brechas críticas.',
      actionPlanLabel: 'Plan de Acción y Orientación para Rendir Mejor:',
      matchToneIncompatibleHeadline: 'Este puesto exige requisitos que el currículum no cumple',
      matchToneIncompatibleDetail: 'Esta postulación tiende a ser rechazada ya en la preselección, y ningún ajuste de texto cambia eso. No es un veredicto sobre tu currículum: es la distancia entre él y ESTE puesto. Compáralo con un puesto de tu área para ver la diferencia.',
      matchTonePartialHeadline: 'Puedes disputar este puesto, con ajustes',
      matchTonePartialDetail: 'Hay brechas, pero del tipo que el currículum resuelve: énfasis, palabra clave y evidencia de lo que ya has hecho. Los requisitos faltantes abajo son la lista de lo que atacar.',
      matchToneAlignedHeadline: 'Tu perfil se ajusta a este puesto',
      matchToneAlignedDetail: 'Los requisitos principales están cubiertos. El trabajo aquí es de acabado — dejar explícito lo que ya existe en el currículum.',
      dimensionsDetailTitle: 'Detalle por dimensión',
      dimensionsDetailDesc: 'Criterios de ATS, reclutamiento ejecutivo, plan de carrera y capacitación',
      noTargetedTitle: 'Sin ajustes puntuales en este informe',
      noTargetedDesc: 'Este análisis no devolvió fragmentos específicos de tu currículum para ajustar. Volver a procesar el currículum suele resolverlo — sin cobro nuevo.',
      targetedTitle: 'Dónde y Por Qué Ajustar (Diagnóstico Punto por Punto)',
      targetedDesc: 'La IA identificó fragmentos exactos que están reduciendo tu puntaje y justifica el impacto de cada cambio.',
      currentTextLabel: 'Fragmento Actual en el Currículum',
      suggestedTextLabel: 'Sugerencia Recomendada (Fórmula STAR/XYZ)',
      rationaleLabel: 'Justificación Técnica y Motivo del Cambio:',
      careerTitle: '¿Indeciso sobre qué puesto postular? Orientación Vocacional de Carrera',
      careerDesc: 'Nuestro Agente de Carrera lee tu perfil y señala las 3 áreas/puestos con mayor adecuación a lo que ya has construido. Ya incluido en el Análisis Completo de este currículum.',
      updateDiagnosisButton: 'Actualizar Diagnóstico',
      discoverAreaButton: 'Descubrir Mi Área Ideal',
      mappingAreas: 'Mapeando las 3 áreas con mayor adecuación a tu perfil...',
      careerTimeEstimate: 'Suele tardar de 15 a 40 segundos. No cierres esta página.',
      profileSummaryLabel: 'Resumen del Perfil Identificado:',
      optionLabel: 'Opción #{n}',
      adherenceLabel: '{pct}% de adecuación',
      recommendedSkillsLabel: 'Habilidades recomendadas:',
      adherenceDisclaimer: 'La adecuación mide cuánto se acerca tu trayectoria a lo que estas áreas suelen exigir. No es probabilidad de contratación ni una medición del mercado laboral.',
      careerAdviceLabel: 'Consejo Estratégico de Carrera:',
      letterTitle: 'Carta de Presentación y Resumen Profesional',
      letterDesc: 'Escritos a partir de tu currículum real y dirigidos al puesto objetivo, en el formato de postulación de tu mercado. Ya incluidos en el Análisis Completo de este currículum.',
      regenerateLetterButton: 'Generar de nuevo',
      writeLetterButton: 'Escribir mi carta',
      writingLetterText: 'Redactando la carta y el resumen dirigidos...',
      letterTimeEstimate: 'Suele tardar de 20 a 45 segundos. No cierres esta página.',
      letterEmptyState: 'Aún no generada para este currículum. Usa el puesto objetivo que indicaste al enviarlo — cuanto más completa la descripción del puesto, más dirigidos quedan ambos textos.',
      letterTargetedTo: 'Dirigida a: {job}',
      summaryLabel: 'Resumen profesional',
      copyButton: 'Copiar',
      summaryFootnote: 'Este es el párrafo de apertura del currículum. El texto "Acerca de" de LinkedIn es distinto, y aparece en la pestaña de Redes y Perfiles Sociales.',
      letterLabel: 'Carta de presentación',
      letterKeywordsLabel: 'Términos del puesto incorporados a los textos',
      ctaTitle: '¿Listo para mejorar tu currículum?',
      ctaDesc: 'Con tu autorización, reescribimos el currículum aplicando todas las recomendaciones anteriores.',
      ctaButton: 'Reescribir currículum',
    },
  },
}

// Country code to Language mapping helper
export function detectLanguageFromCountry(countryCode?: string | null): Language {
  if (!countryCode) return 'pt'
  const code = countryCode.toUpperCase().trim()

  // Portuguese countries
  if (['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'].includes(code)) {
    return 'pt'
  }

  // Spanish countries
  if (['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CUB', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ'].includes(code)) {
    return 'es'
  }

  // All other countries default to English
  return 'en'
}

// Client-side browser language detection
export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'pt'
  
  // Check stored preference first
  const stored = localStorage.getItem('griffo_lang') as Language
  if (stored && ['pt', 'en', 'es'].includes(stored)) {
    return stored
  }

  const navLangs = navigator.languages || [navigator.language || '']
  for (const l of navLangs) {
    const langLower = l.toLowerCase()
    if (langLower.startsWith('pt')) return 'pt'
    if (langLower.startsWith('es')) return 'es'
    if (langLower.startsWith('en')) return 'en'
  }

  return 'pt' // Default fallback
}

const LOCALE_BY_LANG: Record<Language, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
}

/** Locale do `Intl`/`toLocaleDateString` para o idioma da tela — não é o mercado da vaga. */
export function localeForLang(lang: Language): string {
  return LOCALE_BY_LANG[lang] || 'pt-BR'
}
