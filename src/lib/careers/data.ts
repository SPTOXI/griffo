export interface CareerGuide {
  slug: string
  title: string
  category: string
  description: string
  demandLevel: 'Muito Alta' | 'Alta' | 'Estratégica'
  keyAtsKeywords: string[]
  mandatorySections: string[]
  commonMistakes: string[]
  metricExamples: string[]
  topAtsPlatforms: string[]
  faqs: {
    question: string
    answer: string
  }[]
}

export const CAREERS_DATABASE: Record<string, CareerGuide> = {
  'desenvolvedor-software': {
    slug: 'desenvolvedor-software',
    title: 'Desenvolvedor de Software (Frontend, Backend & Full Stack)',
    category: 'Engenharia de Software & Tecnologia',
    description: 'Guia definitivo de estruturação de currículo para desenvolvedores de software. Aprenda a formatar seu stack técnico, projetos de alto tráfego e métricas de arquitetura para aprovação direta em ATS como Greenhouse, Workday e Gupy.',
    demandLevel: 'Muito Alta',
    keyAtsKeywords: [
      'TypeScript', 'React', 'Node.js', 'Next.js', 'Python', 'Java', 'Go', 'Docker',
      'Kubernetes', 'AWS', 'GCP', 'PostgreSQL', 'Microservices', 'CI/CD', 'REST APIs', 'GraphQL'
    ],
    mandatorySections: [
      'Resumo Profissional com Stack Principal & Anos de Experiência',
      'Competências Técnicas agrupadas por categoria (Linguagens, Frameworks, Cloud, Bancos)',
      'Experiência Profissional com Projetos e Impacto Mensurável',
      'Links para GitHub, LinkedIn e Portfólio de Código',
      'Formação Acadêmica & Certificações Relevantes (AWS, GCP, CKA)',
    ],
    commonMistakes: [
      'Listar dezenas de linguagens sem indicar o nível real de domínio e foco de atuação.',
      'Descrever apenas tarefas diárias ("fiz manutenção de código") sem citar impacto de escala, performance ou redução de custos.',
      'Omitir links diretos e clicáveis para repositórios no GitHub ou contribuições open source.',
    ],
    metricExamples: [
      'Reduziu o tempo de resposta da API principal em 42% após refatoração para arquitetura orientada a eventos.',
      'Liderou a migração de monólito para microsserviços em Kubernetes, sustentando picos de 50.000 requisições/minuto.',
      'Implementou pipeline de CI/CD automatizado que reduziu o tempo de deploy de 2 horas para 12 minutos.',
    ],
    topAtsPlatforms: ['Greenhouse', 'Workday', 'Lever', 'Gupy', 'Ashby'],
    faqs: [
      {
        question: 'Como destacar o GitHub no currículo de desenvolvedor?',
        answer: 'Inclua a URL limpa e clicável (ex: https://github.com/seuperfil) no cabeçalho do documento e cite projetos específicos com links diretos nas descrições de cargo.',
      },
      {
        question: 'Devo colocar todas as linguagens que já estudei?',
        answer: 'Não. Priorize as tecnologias em que você é produtivo e que correspondam aos requisitos das vagas que você busca para não diluir o score de palavras-chave no ATS.',
      },
    ],
  },
  'product-manager': {
    slug: 'product-manager',
    title: 'Product Manager (Gerente de Produtos & PO)',
    category: 'Gestão de Produtos & Negócios',
    description: 'Como estruturar um currículo de Product Manager orientado a métricas de negócio, retenção e receita. Descubra as palavras-chave essenciais de descoberta de produto e entrega ágil para superar a triagem automática.',
    demandLevel: 'Alta',
    keyAtsKeywords: [
      'Product Discovery', 'Product Strategy', 'Roadmap Prioritization', 'Data-Driven Decision Making',
      'A/B Testing', 'OKRs & KPIs', 'Customer Retention (Churn)', 'User Research', 'Agile & Scrum', 'SQL'
    ],
    mandatorySections: [
      'Posicionamento de Produto (B2B, B2C, SaaS, Fintech, E-commerce)',
      'Histórico de Métricas de Negócio Alavancadas (GMV, ARR, Churn, NPS)',
      'Metodologias de Discovery e Validação de Hipóteses',
      'Liderança Multifuncional (Engenharia, Design, Vendas, C-Level)',
    ],
    commonMistakes: [
      'Focar em cerimônias ágeis (Sprint, Daily) em vez de resultados de produto e negócio.',
      'Não mencionar métricas financeiras ou de engajamento que comprovem o sucesso dos produtos lançados.',
    ],
    metricExamples: [
      'Aumentou o onboarding conversion rate em +28% após descoberta de produto e condução de testes A/B com 100k usuários.',
      'Gerenciou roadmap estratégico de produto SaaS B2B, expandindo a receita recorrente anual (ARR) em R$ 3,2M.',
    ],
    topAtsPlatforms: ['Workday', 'Greenhouse', 'Lever', 'iCIMS'],
    faqs: [
      {
        question: 'O que recrutadores de PM mais buscam na triagem ATS?',
        answer: 'Recrutadores buscam clareza entre o problema de negócio identificado, a solução entregue e o indicador numérico final (receita, conversão, retenção ou eficiência).',
      },
    ],
  },
  'analista-de-dados': {
    slug: 'analista-de-dados',
    title: 'Analista de Dados & Business Intelligence',
    category: 'Dados & Inteligência Analítica',
    description: 'Guia de currículo para Analistas de Dados, Analytics Engineers e especialistas em BI. Otimize suas competências em SQL, Python, dashboards e modelagem para se destacar nos algoritmos de recrutamento.',
    demandLevel: 'Muito Alta',
    keyAtsKeywords: [
      'SQL Avançado', 'Python (Pandas, NumPy)', 'Power BI', 'Tableau', 'dbt', 'BigQuery',
      'Snowflake', 'Data Warehousing', 'ETL / ELT Pipelines', 'Statistical Analysis', 'Storytelling com Dados'
    ],
    mandatorySections: [
      'Stack de Dados & Ferramentas de Visualização',
      'Modelagem de Dados & Otimização de Consultas',
      'Projetos de Insights de Negócio & Tomada de Decisão',
      'Portfólio de Dashboards ou Repositórios Kaggle/GitHub',
    ],
    commonMistakes: [
      'Apenas listar ferramentas sem demonstrar quais problemas de negócio foram resolvidos com os dados.',
      'Não citar o volume e complexidade das bases de dados manipuladas.',
    ],
    metricExamples: [
      'Construiu pipeline de dados em BigQuery e dbt que automatizou 15 relatórios manuais, economizando 40 horas semanais da diretoria.',
      'Identificou gargalo de churn através de análise de coorte em Python, orientando plano de ação que reduziu cancelamentos em 18%.',
    ],
    topAtsPlatforms: ['Workday', 'Greenhouse', 'Gupy', 'Lever'],
    faqs: [
      {
        question: 'Devo incluir dashboards públicos no currículo de dados?',
        answer: 'Sim! Links para dashboards públicos no Power BI Service, Tableau Public ou estudos no GitHub enriquecem a avaliação técnica.',
      },
    ],
  },
  'ux-ui-designer': {
    slug: 'ux-ui-designer',
    title: 'UX/UI Designer & Product Designer',
    category: 'Design de Produto & Experiência',
    description: 'Como formatar o currículo de Product Designer para garantir leitura perfeita em robôs ATS e destacar links de portfólio no Figma, Behance e Notion.',
    demandLevel: 'Alta',
    keyAtsKeywords: [
      'Figma', 'Design System', 'User Research', 'Wireframing & Prototyping', 'Usability Testing',
      'Information Architecture', 'Design Tokens', 'Accessibility (WCAG)', 'Interaction Design', 'Double Diamond'
    ],
    mandatorySections: [
      'Link em destaque para Portfólio (Behance, Dribbble, Notion ou Web)',
      'Design Systems & Governança de Componentes',
      'Pesquisa com Usuários e Métricas de Usabilidade',
      'Parceria com Engenharia de Frontend',
    ],
    commonMistakes: [
      'Enviar currículo com layout altamente gráfico e texto convertido em vetor/imagem, tornando-o ilegível para ATS.',
      'Esquecer de incluir links clicáveis para os estudos de caso completos.',
    ],
    metricExamples: [
      'Redesenhou o fluxo de checkout mobile no Figma, reduzindo a taxa de abandono de carrinho de 64% para 41%.',
      'Criou e documentou o Design System corporativo com mais de 80 componentes acessíveis, acelerando o tempo de entrega dos squads em 35%.',
    ],
    topAtsPlatforms: ['Greenhouse', 'Lever', 'Workday', 'Ashby'],
    faqs: [
      {
        question: 'Posso usar um currículo visualmente criativo no ATS?',
        answer: 'O currículo enviado ao ATS deve ser em texto limpo e coluna única. Sua criatividade visual deve ser demonstrada no link do portfólio, garantindo aprovação no robô e encanto visual no humano.',
      },
    ],
  },
  'tech-lead': {
    slug: 'tech-lead',
    title: 'Tech Lead & Engineering Manager',
    category: 'Liderança Técnica & Gestão de Engenharia',
    description: 'Currículo de liderança técnica com foco em arquitetura de sistemas, mentoria de engenheiros e alinhamento estratégico com metas executivas.',
    demandLevel: 'Estratégica',
    keyAtsKeywords: [
      'System Architecture', 'Technical Leadership', 'Team Mentorship', 'Engineering Excellence',
      'System Scalability', 'Hiring & Talent Development', 'Technical Roadmap', 'High Availability', 'Security & Compliance'
    ],
    mandatorySections: [
      'Tamanho dos Times Liderados e Níveis de Senioridade Mentorados',
      'Decisões de Arquitetura de Alto Impacto e Resiliência',
      'Governança de Código, Segurança e Padrões de Engenharia',
      'Interface Técnica com Stakeholders Executivos',
    ],
    commonMistakes: [
      'Focar apenas no código individual e não demonstrar a capacidade de liderar pessoas e desenhar arquiteturas robustas.',
    ],
    metricExamples: [
      'Liderou squad multidisciplinar de 12 engenheiros, elevando o índice de retenção de talentos e entregando o novo core bancário no prazo.',
      'Definiu a arquitetura resiliente com tolerância a falhas que sustentou crescimento de 300% no volume transacional sem downtime.',
    ],
    topAtsPlatforms: ['Workday', 'Greenhouse', 'Lever', 'iCIMS'],
    faqs: [
      {
        question: 'Qual o equilíbrio ideal entre técnico e gestão no currículo de Tech Lead?',
        answer: 'Demonstre 60% de liderança técnica/arquitetural e impacto de time, e 40% de profundidade técnica e tecnologias-chave.',
      },
    ],
  },
  'gerente-de-projetos': {
    slug: 'gerente-de-projetos',
    title: 'Gerente de Projetos & Scrum Master',
    category: 'Gestão de Projetos & Agilidade',
    description: 'Otimização de currículo para Project Managers e Scrum Masters. Alinhe certificações PMP, Scrum, orçamento e entrega no prazo para pontuação máxima em ATS.',
    demandLevel: 'Alta',
    keyAtsKeywords: [
      'PMP Certified', 'Scrum Master', 'Kanban', 'Risk Management', 'Budget & Cost Control',
      'Stakeholder Management', 'Jira / Confluence', 'Change Management', 'Resource Allocation', 'Scope Management'
    ],
    mandatorySections: [
      'Certificações Profissionais (PMP, CSM, PSM, PMI-ACP)',
      'Volume Financeiro dos Projetos Gerenciados (Orçamento/CAPEX/OPEX)',
      'Governança de Riscos, Cronogramas e Entregas',
      'Gestão de Stakeholders e Fornecedores',
    ],
    commonMistakes: [
      'Não especificar o porte financeiro e o impacto dos projetos concluídos.',
    ],
    metricExamples: [
      'Gerenciou portfólio de 6 projetos simultâneos com orçamento total de R$ 8M, entregando 100% dos marcos dentro do prazo e com 5% de economia de custos.',
    ],
    topAtsPlatforms: ['Workday', 'Taleo', 'SAP SuccessFactors', 'Gupy'],
    faqs: [
      {
        question: 'Onde colocar as certificações PMP ou Scrum no currículo?',
        answer: 'Destaque-as logo abaixo do seu nome no cabeçalho (ex: "Nome Sobrenome, PMP®") e em uma seção dedicada de Certificações.',
      },
    ],
  },
}
