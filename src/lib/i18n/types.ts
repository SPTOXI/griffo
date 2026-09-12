export type Language = 'pt' | 'en' | 'es' | 'de' | 'fr' | 'it' | 'ja' | 'nl' | 'sv' | 'zh' | 'ar' | 'ko'

export const LANGUAGES: Language[] = ['pt', 'en', 'es', 'de', 'fr', 'it', 'ja', 'nl', 'sv', 'zh', 'ar', 'ko']

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
    marketPulse: string
    hiring: string
  }
  hero: {
    badge: string
    title1: string
    titleAccent: string
    title2: string
    subtitle: string
    blufSummary: string
    ctaPrimary: string
    ctaSecondary: string
    badgeFree: string
    badgeNoCard: string
    badgeSecurity: string
    badgeSafe: string
  }
  heroD: {
    eyebrow: string
    title: string
    /** Contém o token literal "{N}" — o número real de vagas é injetado no lugar dele. */
    paragraph: string
    ctaPrimary: string
    ctaSecondary: string
    quote: string
    trustFree: string
    /** Contém o token literal "{count}" — número de idiomas suportados. */
    trustLanguages: string
    trustCompliance: string
    toggleHuman: string
    toggleAts: string
    cardKicker: string
    cardTitle: string
    cardMeta: string
    cardRadarBadge: string
    cardIllustrativeBadge: string
    humanLabel: string
    humanNote: string
    atsLabel: string
    atsNote: string
    compatibleUnit: string
    humanKicker: string
    requirement1Title: string
    requirement1Evidence: string
    requirement2Title: string
    requirement2Evidence: string
    requirement3Title: string
    requirement3Evidence: string
    requirement4Title: string
    requirement4Evidence: string
    humanClosing: string
    atsKicker: string
    atsLine1: string
    atsLine1Note: string
    atsLine2: string
    atsLine3: string
    atsLine4: string
    extractedKicker: string
    extractedShuffled: string
    ignoredLine: string
    resultLabel: string
    resultValue: string
    legend: string
  }
  orderBand: {
    kicker: string
    intro: string
    step1Title: string
    step1Body: string
    step2Title: string
    step2Body: string
    step3Title: string
    step3Body: string
    step4Title: string
    step4Body: string
    step5Title: string
    step5Body: string
    step6Title: string
    step6Body: string
    closingBrand: string
    closingTagline: string
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
    productTitle: string
    productDesc: string
    oneTime: string
    includesTitle: string
    items: string[]
    buyCta: string
    previewTitle: string
    previewDesc: string
    previewCta: string
    localPayment: string
    currencyFollowsAccess: string
    packTitle: string
    packDesc: string
    packCta: string
    packPerAnalysis: string
    businessTitle: string
    businessDesc: string
    businessCta: string
    /** §2.105/§7.9 — link do card B2B para o /market-pulse, framing de RH/workforce. */
    businessDataCta: string
    conjunctionOr: string
    historyTitle: string
    historyDesc: string
    colDate: string
    colDesc: string
    colAmount: string
    colAnalyses: string
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
    /** Rótulo da fileira de links de mercado. Era "Mercados:" fixo em português. */
    marketsTitle: string
    /** Rótulo da fileira de guias de ATS. Era "Compatibilidade ATS:" fixo em português. */
    atsTitle: string
    /** O link `/global` — a rota sem preço nem ATS de país específico. */
    globalRemote: string
    /** Link `/enterprise` no rodapé — Fase 4 do plano de SEO/GEO do Griffo
     *  Enterprise (2026-09-10/11): fluir link equity de dentro do próprio
     *  domínio já indexado pra seção B2B nova. */
    forCompanies: string
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
    back: string
    professionPlaceholder: string
    dataTransferConsent: string
  }
  app: {
    dashboard: string
    upload: string
    analysis: string
    profile: string
    radar: string
    rewrite: string
    downloads: string
    history: string
    plans: string
    support: string
    settings: string
    admin: string
    adminBadge: string
    adminMasterArea: string
    adminMode: string
    adminAccessBtn: string
    navSection: string
    logout: string
    paymentSuccessToast: string
    paymentCancelledToast: string
    balance: string
    balanceUnit: string
    buyMore: string
    greeting: string
    greetingSub: string
    newResume: string
  }
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
    fillProgressCalling: string
    fillProgressFallback: string
    fillProgressFinishing: string
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
    incidentAutoReportNote: string
  }
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
    sectionsProgress: string
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
    runNothingNewStrong: string
    runErrorFallback: string
    runConnectionError: string
    searchNowButton: string
    searchNowTooltip: string
    searchNowRemainingBadge: string
    searchNowSuccessOne: string
    searchNowSuccessMany: string
    searchNowNothingNew: string
    searchNowStillRunning: string
    searchNowLimitReached: string
    searchNowErrorFallback: string
    searchNowConnectionError: string
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
    emptyHighFitTitle: string
    emptyHighFitDesc: string
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
    interviewPrepButton: string
    interviewPrepLoading: string
    interviewPrepEmpty: string
    interviewPrepErrorFallback: string
    interviewPrepConnectionError: string
    interviewPrepGroundedInLabel: string
    interviewPrepTipLabel: string
    interviewPrepSignalStrength: string
    interviewPrepSignalGap: string
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
  analysisPaywall: {
    reportTitle: string
    cardTitle: string
    cardDesc: string
    calculating: string
    retryCalculate: string
    scoreOutOfTen: string
    lockNote: string
    unlockAvailable: string
  }
  socialPanel: {
    title: string
    subtitle: string
    startAuditBtn: string
    reAuditBtn: string
    auditingBtn: string
    auditSuccessToast: string
    auditErrorFallback: string
    auditConnectionError: string
    overallTitle: string
    profilesFoundTitle: string
    readProfileOk: string
    readProfileGeneric: string
    findingsTitle: string
    headlineTitle: string
    aboutTitle: string
    tipsTitle: string
    copyBtn: string
    copiedToast: string
    manualOptionTitle: string
    manualOptionDesc: string
    pasteLabel: string
    pastePlaceholder: string
    uploadPdfBtn: string
    readingPdf: string
    pdfSuccess: string
    pdfError: string
    saveManualBtn: string
    savingManualBtn: string
    analyzedAt: string
    badgeAudit: string
  }
  paymentModal: {
    validatingTitle: string
    stepReceived: string
    stepValidating: string
    stepCrediting: string
    successTitle: string
    successDesc: string
    errorTitle: string
    errorDefault: string
    newBalanceText: string
    analysesCredited: string
    continueToReport: string
    closeBtn: string
  }
  profileConflict: {
    title: string
    desc: string
    updateBtn: string
    updatingBtn: string
    keepBtn: string
    updateSuccess: string
    updateError: string
    updateConnectionError: string
  }
  uploadProgress: {
    title: string
    desc: string
    elapsed: string
    slow30: string
    slow60: string
    consolidating: string
    closingOk: string
    preparing: string
    executiveReport: string
    stageDimStructure: string
    stageDimStructureHint: string
    stageDimSummary: string
    stageDimSummaryHint: string
    stageDimImpact: string
    stageDimImpactHint: string
    stageDimSkills: string
    stageDimSkillsHint: string
    stageDimExperience: string
    stageDimExperienceHint: string
    stageDimKeywords: string
    stageDimKeywordsHint: string
    stageDimCareer: string
    stageDimCareerHint: string
    stageDimUpskilling: string
    stageDimUpskillingHint: string
    stageJobMatch: string
    stageJobMatchHint: string
    stageTargetedChanges: string
    stageTargetedChangesHint: string
    stageExecutive: string
    stageExecutiveHint: string
  }
  pdfReport: {
    docTitle: string
    docAuthor: string
    docSubject: string
    generatedAt: string
    overallScore: string
    atsTitle: string
    atsPass: string
    atsFail: string
    dimensionsTitle: string
    strengthsTitle: string
    weaknessesTitle: string
    recommendationsTitle: string
    keywordsTitle: string
    footerNote: string
  }
  /**
   * Índice de temperatura de contratação (§2.51, §2.52).
   *
   * Os identificadores das fases (`cooling`, `heating_up`, ...) são chave de
   * código, persistida e comparada — NUNCA texto de tela. Este bloco é o único
   * lugar de onde sai o que o usuário lê, e existe nos 12 idiomas desde o
   * primeiro dia da tela, não como tradução retroativa.
   *
   * `insufficientLabel`/`insufficientDesc` e `notCoveredDesc` não são estados
   * de erro: são a resposta honesta quando a série do país não permite
   * classificar, ou quando não há fonte oficial cobrindo aquele país. A tela
   * mostra o texto em vez de sumir — sumir pareceria defeito, e inventar uma
   * fase seria pior.
   */
  hiringIndex: {
    title: string
    /** Uma linha, sem jargão, sobre o que o indicador é. */
    description: string
    /** `{country}` = nome do país. */
    marketLabel: string
    phaseCooling: string
    phaseCoolingHint: string
    phaseBottomingOut: string
    phaseBottomingOutHint: string
    phaseRecovering: string
    phaseRecoveringHint: string
    phaseHeatingUp: string
    phaseHeatingUpHint: string
    phaseStable: string
    phaseStableHint: string
    insufficientLabel: string
    insufficientDesc: string
    notCoveredDesc: string
    /** Aviso de impressão preliminar — ver `revised` em `LaborMarketPoint`. */
    preliminaryNote: string
    /** `{source}` = nome próprio da fonte, não traduzido. */
    sourceLabel: string
    /** `{period}` = período mais recente já formatado. */
    periodLabel: string
    /** Por que não existe comparação entre países aqui. */
    comparisonNote: string
    loading: string
    unavailable: string
  }

  /**
   * A página pública do mapa-múndi de temperatura de contratação
   * (`/market-pulse`, §2.55).
   *
   * **Só o que é próprio da página mora aqui.** Rótulo de fase, "dado
   * insuficiente", "fonte: {source}" e a nota sobre não comparar países
   * continuam vindo de `hiringIndex` acima — são o mesmo texto dizendo a mesma
   * coisa, e duplicá-los garantiria que um dia o cartão do laudo e o mapa
   * público classificassem o mesmo país com palavras diferentes.
   *
   * A página é PÚBLICA e indexável, então cada uma destas chaves é lida por
   * buscador e por motor de resposta no idioma do visitante. Nenhuma delas
   * pode ter texto fixo em português — foi exatamente o defeito do JSON-LD do
   * layout raiz, que vazava português para `/us` e `/de`.
   */
  hiringMap: {
    /** `<title>` e `og:title`. */
    pageTitle: string
    /** `<meta name="description">`. `{count}` = países cobertos. */
    metaDescription: string
    /** `<h1>`. */
    heading: string
    /** Parágrafo de abertura. `{count}` = países cobertos. */
    intro: string
    /** Nome do agregado na tela. */
    indexHeading: string
    /** `{classified}` e `{tracked}`. */
    indexSummary: string
    netBreadthLabel: string
    /** Como o escalar é calculado, em uma frase. */
    netBreadthHint: string
    /**
     * As cinco faixas do §2.68 — `netBreadth` normalizado pelo total
     * classificado, nunca o número bruto (ver `netBreadthTerm` em `atlas.ts`).
     * Ordem de leitura: de mais frio a mais quente.
     */
    netBreadthStronglyCooling: string
    netBreadthMostlyCooling: string
    netBreadthBalanced: string
    netBreadthMostlyHeating: string
    netBreadthStronglyHeating: string
    legendHeading: string
    /** O estado dos países que nenhuma fonte cobre. Nunca uma cor de fase. */
    noDataLabel: string
    noDataHint: string
    /** `{date}` = data da última coleta, já formatada. */
    updatedLabel: string
    sourcesHeading: string
    methodHeading: string
    methodBody: string
    /** `{country}` = nome do país no idioma ativo. */
    countryLinkLabel: string
    interactionHint: string
    /** Crédito da base cartográfica. */
    mapCredit: string
    /** Licença do dataset em si (CC BY 4.0) — distinta do crédito do mapa-base. */
    licenseNote: string
    tableHeading: string
    colCountry: string
    colPhase: string
    colSource: string
    colPeriod: string
    /** Link do teaser da home para a página cheia (`/market-pulse`). */
    viewFullMapCta: string

    // -- Recorte por continente (§2.59) ------------------------------------
    /** Título da seção por continente. */
    continentHeading: string
    /**
     * Cobertura de um continente, em números absolutos.
     *
     * `{tracked}` = países com fonte oficial, `{total}` = países daquele
     * continente que o produto conhece. **Os dois sempre juntos**: uma
     * percentagem sozinha faria 12 de 54 parecer uma leitura do continente.
     */
    continentCoverage: string
    /** Como ler a barra: a parte hachurada é o que não é medido. */
    continentHint: string
    colContinent: string
    colCoverage: string
  }

  /**
   * Os seis continentes povoados, por extenso.
   *
   * **Deliberadamente um dicionário, e não `Intl.DisplayNames`.** É a mesma
   * armadilha que já custou a árvore inteira do servidor no mapa: as tabelas
   * ICU/CLDR do Node e as do navegador não são a mesma versão e discordam
   * (`Falklandinseln` contra `Falklandinseln (Malwinen)` em alemão — ver o
   * cabeçalho de `lib/hiring-index/map-model.ts`). Nome de continente tem
   * cobertura ainda mais irregular entre versões de ICU que nome de país.
   * Sete palavras fixas por idioma não têm versão.
   *
   * A chave é o código de `lib/hiring-index/continents.ts` escrito por
   * extenso, para que uma tradução errada seja visível na leitura.
   */
  continents: {
    africa: string
    asia: string
    centralAmericaCaribbean: string
    europe: string
    northAmerica: string
    oceania: string
    southAmerica: string
  }
  /**
   * Chrome das páginas `/ats/*` — títulos, rótulos e CTAs.
   *
   * O CONTEÚDO de cada ATS (como o sistema funciona, fatores de descarte,
   * FAQ) não mora aqui: fica em `lib/ats/locales/`, porque nem todo ATS
   * existe em todo idioma (a Gupy só opera no Brasil). Aqui fica só o que
   * é igual em qualquer página de ATS.
   *
   * `{ats}` é substituído pelo nome curto do sistema ("Workday"),
   * `{fullName}` pelo nome completo do produto.
   */
  atsPage: {
    metaTitle: string
    metaDescription: string
    breadcrumbHome: string
    breadcrumbSystems: string
    heroBadge: string
    heroTitle: string
    marketLabel: string
    sourceLabel: string
    heroCta: string
    mechanismBadge: string
    mechanismTitle: string
    mechanismSubtitle: string
    eliminationTitle: string
    helpsTitle: string
    auditBadge: string
    auditTitle: string
    auditSubtitle: string
    auditDim1: string
    auditDim2: string
    auditDim3: string
    auditDim4: string
    auditCta: string
    faqBadge: string
    faqTitle: string
    footerHome: string
  }
  /**
   * Página de entrada `/hiring` — para quem acabou de se candidatar a uma
   * vaga que viu anunciada.
   *
   * ## Por que existe uma rota só para isso
   *
   * "Hiring" é um sinal de DIREÇÃO INVERTIDA: quem publica `#hiring` está
   * oferecendo vaga, e o GriffoWork não oferece vaga nenhuma. Usar a palavra
   * como se fôssemos empregador seria ruído. O que ela captura de verdade é
   * o momento seguinte — a pessoa viu o anúncio, se candidatou, e agora tem
   * uma dúvida ("meu currículo passa?") que é exatamente o que o produto
   * responde. Esta página fala com esse instante, não com o anúncio.
   *
   * ## Nada de número aqui
   *
   * Circula muito "X% dos currículos nunca chegam a um humano". Nenhuma
   * dessas estatísticas foi verificada por nós, e o §43 vale para página de
   * captação como vale para o laudo: sem dado próprio, a página descreve o
   * mecanismo sem afirmar magnitude.
   */
  hiringPage: {
    metaTitle: string
    metaDescription: string
    badge: string
    title: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
    stepsTitle: string
    step1Title: string
    step1Desc: string
    step2Title: string
    step2Desc: string
    step3Title: string
    step3Desc: string
    closingTitle: string
    closingSubtitle: string
    trustNote: string
    /**
     * Título do bloco que nomeia os dois momentos da busca — o sinal passivo
     * (`#OpenToWork`) e a busca ativa (`#JobHunting`).
     *
     * A hashtag NÃO se traduz: verificado que `#OpenToWork` circula em inglês
     * em todos os mercados, enquanto o rótulo descritivo é que muda de idioma
     * (o alemão do LinkedIn é "Offen für Jobangebote"). Mesmo padrão que o
     * §2.83 achou para "ATS": sigla em inglês + termo nativo ao lado, nunca um
     * dos dois sozinho.
     */
    searchTitle: string
    /** O texto do bloco, com o termo nativo de busca de emprego do idioma. */
    searchBody: string
  }
}
