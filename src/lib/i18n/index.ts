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
    entryTitle: string
    entryDesc: string
    starterTitle: string
    starterDesc: string
    carreiraTitle: string
    carreiraDesc: string
    profTitle: string
    profDesc: string
    mostPopular: string
    buyCta: string
    guideTitle: string
    guideSub: string
    tool1Title: string
    tool1Desc: string
    tool1Ideal: string
    tool2Title: string
    tool2Desc: string
    tool2Ideal: string
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
    credits: string
    addCredits: string
    greeting: string
    greetingSub: string
    newResume: string
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
      subtitle: 'Envie seu currículo em segundos e receba um laudo técnico completo em 8 dimensões. Descubra sua nota de aprovação em filtros ATS (Gupy, Workday, Taleo) e receba recomendações exclusivas para otimizar seus perfis profissionais.',
      ctaPrimary: 'Analisar meu currículo agora',
      ctaSecondary: 'Já tenho conta',
      badgeFree: 'Análise Gratuita',
      badgeNoCard: 'Sem Cartão',
      badgeSecurity: 'LGPD & GDPR',
      badgeSafe: '100% Seguro',
    },
    mockup: {
      title: 'Relatório Técnico de Avaliação',
      precision: 'ALTA PRECISÃO',
      overallScore: 'Nota Geral de Qualificação',
      atsApproved: 'Aprovado em ATS',
      atsSub: 'Compatível com Gupy & Workday',
      dim1: 'Estrutura & Leitura Automática (ATS)',
      dim2: 'Impacto Quantificado (Fórmula STAR/XYZ)',
      dim3: 'Match de Palavras-Chave de Mercado',
      dim4: 'Trajetória & Plano de Carreira',
      suggestionTitle: 'Sugestão de Headline Otimizada (LinkedIn / Gupy)',
      suggestionText: '"Desenvolvedor Full Stack Sênior | React, Node.js, Cloud (AWS) | Especialista em Arquitetura Distribuída & Alta Escalabilidade"',
    },
    stats: {
      dimTitle: '8 Dimensões',
      dimSub: 'Análise minuciosa de currículo',
      atsTitle: 'Gupy & ATS',
      atsSub: 'Verificação de filtros de recrutamento',
      globalTitle: 'Perfis Globais',
      globalSub: 'LinkedIn, Behance, GitHub, Xing, etc.',
      pdfTitle: 'PDF & Editável',
      pdfSub: 'Reescrita profissional pronta',
    },
    social: {
      badge: 'Presença Digital & Otimização Global',
      title: 'Sua carreira vai além do papel. Otimize seus perfis em qualquer plataforma.',
      subtitle: 'Com o GriffoWork, você não apenas melhora seu currículo em PDF — você otimiza toda a sua imagem profissional nas redes sociais e plataformas estratégicas para o mercado onde deseja atuar.',
      card1Title: 'LinkedIn & Gupy',
      card1Sub: "Sugestões de Título (Headline), seção 'Sobre' e termos para o algoritmo de recrutadores.",
      card2Title: 'Perfis Internacionais & Tech',
      card2Sub: 'Recomendações para Behance, GitHub, StackOverflow, Kaggle, Xing, Portfólios e redes locais.',
      lgpdBadge: 'LGPD / GDPR',
      optInTitle: 'Otimização com Autorização do Usuário',
      linkedInHead: 'LinkedIn — Título Profissional Sugerido',
      behanceHead: 'Behance / Portfólio — Dica de Posicionamento',
      gupyHead: 'Gupy — Palavras-chave de Triagem',
    },
    features: {
      badge: 'Recursos Completos',
      title: 'Tudo o que você precisa para se destacar nas seleções.',
      subtitle: 'Construído com base nas melhores práticas de RH, LinkedIn Talent Solutions e algoritmos de triagem automática.',
      f1Title: 'Laudo em 8 Dimensões',
      f1Desc: 'Avaliação minuciosa de estrutura, resumo, resultados quantificados, hard/soft skills, experiência, palavras-chave ATS, trajetória e plano de capacitação.',
      f2Title: 'Verificação de Filtros ATS',
      f2Desc: 'Testamos se seu currículo é lido corretamente por robôs de recrutamento (Gupy, Workday, Taleo, Greenhouse) antes de chegar ao recrutador.',
      f3Title: 'Reescrita com Autorização',
      f3Desc: 'Com sua aprovação explícita, a IA reescreve seu currículo aplicando a fórmula STAR e Google XYZ — preservando 100% da veracidade dos seus dados.',
      f4Title: 'Otimização de Presença Digital',
      f4Desc: 'Dicas sob medida para seu perfil do LinkedIn, Gupy, Behance, GitHub, Xing e redes profissionais para atrair recrutadores ativamente.',
      f5Title: 'Download em PDF e Formato Editável',
      f5Desc: 'Baixe seu currículo reescrito e laudo em PDF elegante e arquivo de texto editável — pronto para enviar a empresas ou salvar.',
      f6Title: 'Privacidade & Segurança Total',
      f6Desc: 'Seus dados são criptografados e protegidos em conformidade rigorosa com a LGPD e GDPR. Seus dados nunca são vendidos a terceiros.',
    },
    how: {
      badge: 'Passo a Passo',
      title: 'Do envio ao novo currículo em 5 passos simples.',
      subtitle: 'Rápido, transparente e sob seu controle em todas as fases.',
      s1Title: 'Envie o Currículo',
      s1Desc: 'Anexe um arquivo PDF, documento de texto ou cole diretamente o conteúdo.',
      s2Title: 'Informe seus Perfis',
      s2Desc: 'Insira opcionalmente seus links profissionais (LinkedIn, Gupy, etc.).',
      s3Title: 'Receba o Laudo',
      s3Desc: 'Confira a pontuação 0–10 em 8 dimensões, pontos fortes e fracos.',
      s4Title: 'Autorize a Reescrita',
      s4Desc: 'Se desejar, solicite a reescrita otimizada com a fórmula STAR.',
      s5Title: 'Baixe em PDF ou Editável',
      s5Desc: 'Baixe a versão final pronta para aplicar em vagas imediatamente.',
    },
    pricing: {
      badge: 'Sem Mensalidades ou Fidelidade',
      title: 'Plano de Entrada por apenas R$ 9,90 com 2 Avaliações Completas!',
      subtitle: 'Adquira o Plano de Entrada para começar ou escolha o pacote ideal para o seu momento profissional.',
      entryTitle: 'Plano de Entrada',
      entryDesc: '40 créditos (2 Avaliações Completas)',
      starterTitle: 'Pacote Starter',
      starterDesc: '100 créditos (R$ 0,299 / crédito)',
      carreiraTitle: 'Pacote Carreira',
      carreiraDesc: '500 créditos (R$ 0,199 / crédito)',
      profTitle: 'Pacote Profissional',
      profDesc: '1.500 créditos (R$ 0,166 / crédito)',
      mostPopular: 'Mais Vendido',
      buyCta: 'Adquirir Pacote',
      guideTitle: 'Qual a diferença entre Avaliação e Reescrita do Currículo?',
      guideSub: 'Você pode utilizar seus créditos como preferir em qualquer momento da sua busca por emprego.',
      tool1Title: 'Avaliação do Currículo (20 créditos)',
      tool1Desc: 'Diagnóstico Executivo em 8 Dimensões: Analisa seu currículo sob a ótica de um recrutador técnico e robô ATS. Aponta Nota Geral, pontos fortes, vulnerabilidades e palavras-chave faltantes.',
      tool1Ideal: '✓ Ideal para: Descobrir falhas ocultas antes de enviar para vagas.',
      tool2Title: 'Reescrita do Currículo (10 créditos)',
      tool2Desc: 'Reformulação Prática de Experiências: Reescreve suas experiências profissionais aplicando a Fórmula STAR e Google XYZ, garantindo 100% de veracidade dos fatos.',
      tool2Ideal: '✓ Ideal para: Transformar descrições simples em realizações de alto impacto.',
    },
    faq: {
      badge: 'Perguntas Frequentes',
      title: 'Ficou com alguma dúvida?',
      subtitle: 'Respostas para as perguntas mais comuns dos nossos usuários.',
      q1: 'Como funciona a verificação de compatibilidade ATS (Gupy, Workday, Taleo)?',
      a1: 'Nossa inteligência simula os algoritmos de leitura de sistemas ATS utilizados pelas maiores empresas. Ela checa se o cabeçalho, ordem cronológica, seções e densidade de palavras-chave estão legíveis para robôs de triagem.',
      q2: 'A IA inventa informações ou experiências no meu currículo?',
      a2: 'Não. O GriffoWork segue uma diretriz rígida de veracidade: mantemos 100% das suas empresas, cargos, datas e formação reais. A IA reestrutura a escrita aplicando métodos validados para destacar os seus resultados reais.',
      q3: 'Como funciona a otimização de perfis (LinkedIn, Gupy, Behance, GitHub)?',
      a3: 'Se você fornecer os links dos seus perfis com autorização, a IA gera títulos otimizados (Headlines), resumos para a seção "Sobre" e dicas de algoritmo para atrair mais recrutadores no seu mercado.',
      q4: 'Meus dados e meu currículo estão seguros?',
      a4: 'Totalmente. Trabalhamos em conformidade rigorosa com a LGPD e GDPR. Seus dados são criptografados e não são compartilhados nem vendidos a terceiros.',
      q5: 'Como funciona o saldo de créditos?',
      a5: 'Os créditos adquiridos não possuem expiração ou mensalidade. Você utiliza no seu tempo para realizar avaliações completas ou reescritas de currículo sempre que precisar.',
    },
    ctaFinal: {
      title: 'Pronto para transformar sua apresentação profissional?',
      subtitle: 'Crie sua conta gratuita agora e receba o laudo técnico do seu currículo em menos de 30 segundos. Sem cartão de crédito.',
      button: 'Analisar meu currículo grátis',
    },
    footer: {
      desc: 'Plataforma de inteligência de carreira, análise de currículo por IA e otimização de presença digital baseada nos melhores padrões de recrutamento.',
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
      plans: 'Comprar Créditos',
      settings: 'Configurações',
      admin: 'Área Admin',
      credits: 'Créditos',
      addCredits: '+ Adicionar',
      greeting: 'Olá',
      greetingSub: 'Aqui está o resumo da sua atividade no GriffoWork.',
      newResume: 'Novo currículo',
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
      subtitle: 'Upload your resume in seconds and receive an in-depth 8-dimension audit report. Check your pass rate on ATS screeners (Workday, Taleo, Greenhouse) and get actionable recommendations for your online profiles.',
      ctaPrimary: 'Analyze my resume now',
      ctaSecondary: 'I already have an account',
      badgeFree: 'Free Analysis',
      badgeNoCard: 'No Credit Card',
      badgeSecurity: 'GDPR Compliant',
      badgeSafe: '100% Secure',
    },
    mockup: {
      title: 'Technical Resume Audit Report',
      precision: 'HIGH PRECISION',
      overallScore: 'Overall Qualification Score',
      atsApproved: 'ATS Screener Passed',
      atsSub: 'Compatible with Workday, Taleo & ATS',
      dim1: 'Structure & Machine Parsing (ATS)',
      dim2: 'Quantified Impact (STAR / XYZ Formula)',
      dim3: 'Market Keyword Alignment',
      dim4: 'Career Path & Velocity',
      suggestionTitle: 'Optimized Headline Suggestion (LinkedIn / Job Portals)',
      suggestionText: '"Senior Full Stack Engineer | React, Node.js, AWS Cloud | Distributed Systems & High-Scale Architecture Specialist"',
    },
    stats: {
      dimTitle: '8 Dimensions',
      dimSub: 'Deep multi-angle resume audit',
      atsTitle: 'ATS Verified',
      atsSub: 'Automated recruiter filter check',
      globalTitle: 'Global Profiles',
      globalSub: 'LinkedIn, GitHub, Behance, Xing & Portfolios',
      pdfTitle: 'PDF & Editable',
      pdfSub: 'Production-ready professional rewrite',
    },
    social: {
      badge: 'Digital Presence & Global Optimization',
      title: 'Your career extends beyond PDF pages. Optimize your profile anywhere.',
      subtitle: 'With GriffoWork, you optimize your entire professional personal brand across social platforms and tech networks targeted to your dream industry.',
      card1Title: 'LinkedIn & Professional Portals',
      card1Sub: "Actionable headline formulas, 'About' summary copywriting and recruiter search algorithm keywords.",
      card2Title: 'Tech & International Networks',
      card2Sub: 'Custom recommendations for GitHub, Behance, StackOverflow, Kaggle, Xing and personal portfolio sites.',
      lgpdBadge: 'GDPR & Privacy',
      optInTitle: 'Privacy-First & User-Authorized Insights',
      linkedInHead: 'LinkedIn — Suggested Professional Headline',
      behanceHead: 'Behance / Portfolio — High-Impact Positioning',
      gupyHead: 'ATS Systems — Key Screening Keywords',
    },
    features: {
      badge: 'Full Platform Features',
      title: 'Everything you need to stand out in high-stakes hiring.',
      subtitle: 'Built on HR industry standards, LinkedIn Talent Solutions, and ATS parsing algorithms.',
      f1Title: '8-Dimension Executive Audit',
      f1Desc: 'Detailed evaluation of document structure, summary impact, quantified metrics, hard/soft skills, ATS keywords, and career trajectory.',
      f2Title: 'ATS Filter Pass Guarantee',
      f2Desc: 'We test if your resume parses accurately through recruitment bots (Workday, Taleo, Greenhouse, Lever) before a recruiter opens it.',
      f3Title: 'Authorized AI Rewrite',
      f3Desc: 'With your explicit confirmation, our AI rewrites your experience using the STAR and Google XYZ formulas while maintaining 100% truthfulness.',
      f4Title: 'Digital Footprint Audit',
      f4Desc: 'Tailored recommendations for LinkedIn, GitHub, Behance, Xing and online portfolios to attract recruiters inbound.',
      f5Title: 'PDF & Editable Text Downloads',
      f5Desc: 'Export your rewritten resume and audit report in high-resolution PDF and editable document formats.',
      f6Title: 'Bank-Grade Security & Privacy',
      f6Desc: 'Your personal data is encrypted and strictly compliant with GDPR and international privacy standards. We never sell your data.',
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
      s3Desc: 'Review your 0–10 score across 8 dimensions with strengths and weaknesses.',
      s4Title: 'Authorize AI Rewrite',
      s4Desc: 'Optionally trigger the STAR-formula executive rewrite.',
      s5Title: 'Download PDF or Editable',
      s5Desc: 'Download your finalized resume ready for immediate job applications.',
    },
    pricing: {
      badge: 'No Subscription Lock-In',
      title: 'Entry Plan for just $1.99 / R$ 9,90 with 2 Complete Audits!',
      subtitle: 'Get started with our Entry Plan or select the credit package that fits your career goals.',
      entryTitle: 'Entry Plan',
      entryDesc: '40 credits (2 Complete Audits)',
      starterTitle: 'Starter Pack',
      starterDesc: '100 credits (Best for active job hunters)',
      carreiraTitle: 'Career Pack',
      carreiraDesc: '500 credits (Best value for power users)',
      profTitle: 'Professional Pack',
      profDesc: '1,500 credits (For executive coaches & agencies)',
      mostPopular: 'Most Popular',
      buyCta: 'Get Credits Package',
      guideTitle: 'What is the difference between Audit and AI Rewrite?',
      guideSub: 'You can use your non-expiring credits anytime across any tool in GriffoWork.',
      tool1Title: 'Resume Audit (20 credits)',
      tool1Desc: '8-Dimension Executive Audit: Evaluates your resume from a hiring manager and ATS bot perspective. Reveals overall score, vulnerabilities and missing keywords.',
      tool1Ideal: '✓ Ideal for: Uncovering hidden deal-breakers before applying to jobs.',
      tool2Title: 'Resume AI Rewrite (10 credits)',
      tool2Desc: 'Experience Bullet Reformulation: Rewrites work experience bullets using the STAR and Google XYZ formulas with 100% factual accuracy.',
      tool2Ideal: '✓ Ideal for: Upgrading plain bullet points into high-impact achievements.',
    },
    faq: {
      badge: 'Frequently Asked Questions',
      title: 'Have questions?',
      subtitle: 'Quick answers to common questions about GriffoWork.',
      q1: 'How does the ATS compatibility check work (Workday, Taleo, Greenhouse)?',
      a1: 'Our AI simulates the parsing engines used by enterprise ATS systems. It verifies headers, chronological formatting, section layouts, and keyword density.',
      q2: 'Does the AI fabricate fake work experience?',
      a2: 'Never. GriffoWork follows a strict truthfulness policy: we preserve 100% of your real employers, job titles, dates, and education.',
      q3: 'How does online profile optimization work (LinkedIn, GitHub, Behance)?',
      a3: 'With your consent, our AI generates optimized headlines, "About" bios, and keyword positioning recommendations tailored to recruiter searches.',
      q4: 'Is my resume data safe and private?',
      a4: 'Absolutely. We operate under strict GDPR compliance. Your data is encrypted and never shared or sold to third parties.',
      q5: 'Do my purchased credits expire?',
      a5: 'No. Purchased credits never expire and have no recurring monthly fees.',
    },
    ctaFinal: {
      title: 'Ready to elevate your executive presentation?',
      subtitle: 'Create your free account now and get your technical resume audit in under 30 seconds. No credit card required.',
      button: 'Analyze my resume free',
    },
    footer: {
      desc: 'AI-powered career intelligence, resume audit, and digital presence optimization platform built on modern talent recruitment standards.',
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
      plans: 'Buy Credits',
      settings: 'Settings',
      admin: 'Admin Area',
      credits: 'Credits',
      addCredits: '+ Add',
      greeting: 'Hello',
      greetingSub: 'Here is an overview of your GriffoWork activity.',
      newResume: 'New Resume',
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
      subtitle: 'Sube tu currículum en segundos y recibe un informe técnico completo en 8 dimensiones. Descubre tu puntuación en filtros ATS (Workday, Taleo, Gupy) y obtén recomendaciones para optimizar tus perfiles profesionales.',
      ctaPrimary: 'Analizar mi currículum ahora',
      ctaSecondary: 'Ya tengo una cuenta',
      badgeFree: 'Análisis Gratuito',
      badgeNoCard: 'Sin Tarjeta',
      badgeSecurity: 'Conforme a RGPD',
      badgeSafe: '100% Seguro',
    },
    mockup: {
      title: 'Informe Técnico de Evaluación',
      precision: 'ALTA PRECISIÓN',
      overallScore: 'Puntuación General de Calificación',
      atsApproved: 'Aprobado en ATS',
      atsSub: 'Compatible con Workday, Taleo y ATS',
      dim1: 'Estructura y Lectura Automática (ATS)',
      dim2: 'Impacto Cuantificado (Fórmula STAR/XYZ)',
      dim3: 'Alineación de Palabras Clave de Mercado',
      dim4: 'Trayectoria y Plan de Carrera',
      suggestionTitle: 'Sugerencia de Titular Optimizado (LinkedIn / Portales)',
      suggestionText: '"Desarrollador Full Stack Senior | React, Node.js, AWS Cloud | Especialista en Arquitectura Distribuida y Alta Escala"',
    },
    stats: {
      dimTitle: '8 Dimensiones',
      dimSub: 'Análisis detallado multi-ángulo',
      atsTitle: 'Filtros ATS',
      atsSub: 'Verificación de filtros de selección',
      globalTitle: 'Perfiles Globales',
      globalSub: 'LinkedIn, GitHub, Behance, Xing y Portafolios',
      pdfTitle: 'PDF y Editable',
      pdfSub: 'Reescritura profesional lista para usar',
    },
    social: {
      badge: 'Presencia Digital y Optimización Global',
      title: 'Tu carrera va más allá del papel. Optimiza tus perfiles en cualquier plataforma.',
      subtitle: 'Con GriffoWork, no solo mejoras tu currículum en PDF: optimizas toda tu marca personal profesional en las redes estratégicas para tu sector.',
      card1Title: 'LinkedIn y Portales Profesionales',
      card1Sub: "Titulares optimizados, redacción de la sección 'Sobre mí' y palabras clave para el algoritmo de reclutadores.",
      card2Title: 'Redes Internacionales y Tech',
      card2Sub: 'Recomendaciones personalizadas para GitHub, Behance, StackOverflow, Kaggle, Xing y portafolios personales.',
      lgpdBadge: 'RGPD / Privacidad',
      optInTitle: 'Optimización Autorizada por el Usuario',
      linkedInHead: 'LinkedIn — Titular Profesional Sugerido',
      behanceHead: 'Behance / Portafolio — Posicionamiento de Impacto',
      gupyHead: 'Sistemas ATS — Palabras Clave de Selección',
    },
    features: {
      badge: 'Funciones Completas',
      title: 'Todo lo que necesitas para destacar en las selecciones.',
      subtitle: 'Diseñado en base a las mejores prácticas de Recursos Humanos, LinkedIn Talent Solutions y algoritmos ATS.',
      f1Title: 'Evaluación en 8 Dimensiones',
      f1Desc: 'Evaluación minuciosa de estructura, resumen, resultados cuantificados, habilidades, palabras clave ATS y trayectoria profesional.',
      f2Title: 'Verificación de Filtros ATS',
      f2Desc: 'Probamos si tu currículum es leído correctamente por sistemas ATS (Workday, Taleo, Greenhouse) antes de llegar al reclutador.',
      f3Title: 'Reescritura con Autorización',
      f3Desc: 'Con tu aprobación explícita, la IA reescribe tu currículum aplicando las fórmulas STAR y Google XYZ — manteniendo 100% la veracidad.',
      f4Title: 'Optimización de Presencia Digital',
      f4Desc: 'Recomendaciones a la medida para tu perfil de LinkedIn, GitHub, Behance, Xing y redes profesionales para atraer reclutadores.',
      f5Title: 'Descarga en PDF y Formato Editable',
      f5Desc: 'Exporta tu currículum reescrito e informe técnico en formatos PDF de alta resolución y archivos editables.',
      f6Title: 'Privacidad y Seguridad Total',
      f6Desc: 'Tus datos están encriptados y protegidos en estricto cumplimiento del RGPD y leyes de privacidad. Nunca vendemos tus datos.',
    },
    how: {
      badge: 'Paso a paso',
      title: 'Del envío a tu nuevo currículum en 5 sencillos pasos.',
      subtitle: 'Rápido, transparente y bajo tu control en todas las fases.',
      s1Title: 'Sube tu Currículum',
      s1Desc: 'Adjunta un archivo PDF, documento de texto o pega directamente el contenido.',
      s2Title: 'Enlaza tus Perfiles (Opcional)',
      s2Desc: 'Ingresa opcionalmente tus enlaces profesionales (LinkedIn, GitHub, etc.).',
      s3Title: 'Recibe el Informe',
      s3Desc: 'Revisa tu puntuación 0–10 en 8 dimensiones con fortalezas y debilidades.',
      s4Title: 'Autoriza la Reescritura',
      s4Desc: 'Si lo deseas, solicita la reescritura optimizada con la fórmula STAR.',
      s5Title: 'Descarga en PDF o Editable',
      s5Desc: 'Descarga la versión final lista para postular a empleos de inmediato.',
    },
    pricing: {
      badge: 'Sin Suscripciones Forzadas',
      title: '¡Plan de Entrada por solo $1.99 / R$ 9,90 con 2 Evaluaciones Completas!',
      subtitle: 'Comienza con nuestro Plan de Entrada o elige el paquete de créditos ideal para tu momento profesional.',
      entryTitle: 'Plan de Entrada',
      entryDesc: '40 créditos (2 Evaluaciones Completas)',
      starterTitle: 'Paquete Starter',
      starterDesc: '100 créditos (Ideal para búsqueda activa)',
      carreiraTitle: 'Paquete Carrera',
      carreiraDesc: '500 créditos (El mejor costo-beneficio)',
      profTitle: 'Paquete Profesional',
      profDesc: '1.500 créditos (Para profesionales y agencias)',
      mostPopular: 'Más Vendido',
      buyCta: 'Adquirir Paquete',
      guideTitle: '¿Cuál es la diferencia entre Evaluación y Reescritura?',
      guideSub: 'Puedes utilizar tus créditos sin caducidad en cualquier herramienta de GriffoWork.',
      tool1Title: 'Evaluación de Currículum (20 créditos)',
      tool1Desc: 'Diagnóstico Ejecutivo en 8 Dimensiones: Evalúa tu currículum desde la óptica de un reclutador y filtro ATS. Revela nota general y palabras clave faltantes.',
      tool1Ideal: '✓ Ideal para: Descubrir errores ocultos antes de enviar a vacantes.',
      tool2Title: 'Reescritura de Currículum (10 créditos)',
      tool2Desc: 'Reformulación de Experiencias: Reescribe tus experiencias aplicando las fórmulas STAR y Google XYZ con 100% de veracidad.',
      tool2Ideal: '✓ Ideal para: Transformar descripciones simples en logros de alto impacto.',
    },
    faq: {
      badge: 'Preguntas Frecuentes',
      title: '¿Tienes alguna duda?',
      subtitle: 'Respuestas a las preguntas más comunes de nuestros usuarios.',
      q1: '¿Cómo funciona la verificación ATS (Workday, Taleo, Greenhouse)?',
      a1: 'Nuestra inteligencia simula los motores de lectura de sistemas ATS empresariales. Verifica encabezados, orden cronológico y densidad de palabras clave.',
      q2: '¿La IA inventa información o experiencias falsas?',
      a2: 'Nunca. GriffoWork sigue una política estricta de veracidad: mantenemos 100% de tus empresas, cargos, fechas y formación reales.',
      q3: '¿Cómo funciona la optimización de perfiles (LinkedIn, GitHub, Behance)?',
      a3: 'Con tu autorización, la IA genera titulares optimizados, resúmenes "Sobre mí" y posicionamiento de palabras clave para reclutadores.',
      q4: '¿Mis datos están seguros?',
      a4: 'Totalmente. Operamos en estricto cumplimiento del RGPD. Tus datos están encriptados y nunca se comparten ni venden a terceros.',
      q5: '¿Mis créditos adquiridos caducan?',
      a5: 'No. Los créditos no caducan nunca y no hay pagos mensuales recurrentes.',
    },
    ctaFinal: {
      title: '¿Listo para transformar tu presentación profesional?',
      subtitle: 'Crea tu cuenta gratuita ahora y recibe el informe técnico de tu currículum en menos de 30 segundos. Sin tarjeta de crédito.',
      button: 'Analizar mi currículum gratis',
    },
    footer: {
      desc: 'Plataforma de inteligencia de carrera, evaluación de currículum con IA y optimización de presencia digital basada en estándares globales de reclutamiento.',
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
      plans: 'Comprar Créditos',
      settings: 'Configuración',
      admin: 'Área Admin',
      credits: 'Créditos',
      addCredits: '+ Añadir',
      greeting: 'Hola',
      greetingSub: 'Aquí tienes el resumen de tu actividad en GriffoWork.',
      newResume: 'Nuevo currículum',
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
