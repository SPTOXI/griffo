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
