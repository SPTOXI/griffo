export interface AtsGuide {
  slug: string
  name: string
  fullName: string
  country: string
  marketName: string
  description: string
  marketShare: string
  howItWorks: {
    title: string
    description: string
  }[]
  eliminationFactors: string[]
  howGriffoWorkHelps: string[]
  faqs: {
    question: string
    answer: string
  }[]
}

export const ATS_DATABASE: Record<string, AtsGuide> = {
  gupy: {
    slug: 'gupy',
    name: 'Gupy',
    fullName: 'Gupy Recrutamento & Seleção (IA Gaia)',
    country: 'BR',
    marketName: 'Brasil',
    description: 'A Gupy é a plataforma de recrutamento e seleção mais utilizada por grandes empresas e multinacionais no Brasil. Sua inteligência artificial proprietária (Gaia) analisa, extrai e ranqueia automaticamente os currículos com base na afinidade semântica com a vaga.',
    // Antes: "Presente em mais de 70% das vagas corporativas e de grandes
    // empresas no Brasil." Retirado por não se sustentar: os ~75% que
    // circulam em fontes públicas são de adoção de ATS EM GERAL por médias e
    // grandes empresas brasileiras, não da fatia da Gupy — atribuir o número
    // da categoria a uma empresa é o tipo de erro que, conferido por alguém,
    // derruba a credibilidade da página inteira.
    marketShare: 'Líder do mercado brasileiro de recrutamento e seleção, com milhares de empresas clientes.',
    howItWorks: [
      {
        title: 'Extração e Leitura de Texto (Parsing)',
        description: 'O algoritmo da Gupy converte o arquivo de currículo em texto puro. Estruturas visuais não lineares, tabelas ou cabeçalhos complexos podem fazer o robô ignorar partes cruciais do histórico profissional.',
      },
      {
        title: 'Algoritmo de Afinidade e Ranking (IA Gaia)',
        description: 'A IA compara termos técnicos, ferramentas e responsabilidades descritas no documento com o perfil ideal da vaga, gerando um ranking percentual de compatibilidade.',
      },
      {
        title: 'Filtros Eliminatórios de Triagem',
        description: 'Critérios pré-definidos pelos recrutadores (requisitos mandatórios, formação, modelo de trabalho) descartam automaticamente candidaturas antes da visualização humana.',
      },
    ],
    eliminationFactors: [
      'Currículos salvos em formatos que impedem a extração de texto pelo algoritmo.',
      'Ausência de correspondência semântica com os requisitos e competências da vaga.',
      'Formatações que quebram a ordem cronológica de leitura do parser da Gupy.',
      'Falta de contextualização e métricas que comprovem a experiência exigida.',
    ],
    howGriffoWorkHelps: [
      'Simula o algoritmo de triagem da Gupy e aponta sua nota preditiva de compatibilidade.',
      'Identifica exatamente quais termos técnicos e palavras-chave estão ausentes no seu documento.',
      'Garante que a estrutura do documento seja 100% legível pelo parser da IA Gaia.',
      'Audita 8 dimensões executivas para posicionar seu currículo no topo do ranking de candidatos.',
    ],
    faqs: [
      {
        question: 'O que é a IA Gaia da Gupy?',
        answer: 'É o modelo de inteligência artificial da Gupy responsável por ler o conteúdo dos currículos, calcular a afinidade com a vaga e ordenar os candidatos para os recrutadores.',
      },
      {
        question: 'Como o GriffoWork ajuda em processos na Gupy?',
        answer: 'O GriffoWork avalia seu currículo antes do envio, apontando lacunas de palavras-chave, erros de formatação que confundem o robô e o nível de adequação para que você chegue à fase de entrevistas.',
      },
      {
        question: 'A Gupy descarta currículos automaticamente?',
        answer: 'Sim. Candidatos com baixa pontuação algorítmica ou que não atendem aos filtros mandatórios ficam no final da fila de triagem e raramente são abertos pelos recrutadores.',
      },
    ],
  },
  workday: {
    slug: 'workday',
    name: 'Workday',
    fullName: 'Workday Recruiting / Human Capital Management',
    country: 'US',
    marketName: 'Estados Unidos, Europa e Multinacionais Globais',
    description: 'O Workday é o sistema corporativo padrão adotado pela maioria das empresas da Fortune 500 e grandes multinacionais globais. É conhecido por ter um dos parsers mais rigorosos e padronizados do mercado de RH.',
    marketShare: 'Adotado por mais de 50% das maiores corporações globais da Fortune 500.',
    howItWorks: [
      {
        title: 'Mapeamento Estruturado de Campos',
        description: 'O Workday fragmenta o currículo em campos predefinidos: Empresa, Cargo, Período e Responsabilidades. Qualquer desalinhamento de formato causa perda de dados na triagem.',
      },
      {
        title: 'Triagem em Conformidade Internacional',
        description: 'Filtra candidaturas considerando conformidades trabalhistas globais, exigindo clareza na progressão de carreira e senioridade.',
      },
      {
        title: 'Verificação de Métricas e Requisitos',
        description: 'O sistema prioriza perfis que demonstram impacto mensurável alinhado às competências listadas na requisição de vaga.',
      },
    ],
    eliminationFactors: [
      'Formatos e leiautes não convencionais que corrompem o preenchimento automático dos campos.',
      'Inconsistências de datas e períodos que impedem o cálculo de tempo de experiência.',
      'Falta de clareza nos títulos de cargo em relação aos padrões internacionais de mercado.',
    ],
    howGriffoWorkHelps: [
      'Garante que a hierarquia do seu currículo seja interpretada sem falhas pelo parser do Workday.',
      'Avalia o alinhamento com padrões internacionais de contratação (EUA, Europa e Global).',
      'Audita a densidade de métricas e realizações para atender aos filtros corporativos do sistema.',
      'Gera a carta de apresentação direcionada para o processo seletivo.',
    ],
    faqs: [
      {
        question: 'O que torna o Workday tão exigente?',
        answer: 'Por receber milhares de aplicações por vaga em multinacionais, o Workday utiliza critérios estruturados que descartam currículos com formatação confusa ou informações difíceis de categorizar.',
      },
      {
        question: 'Como o GriffoWork prepara meu perfil para o Workday?',
        answer: 'O GriffoWork analisa a clareza cronológica, formatação e presença de métricas executivas, assegurando que o Workday extraia seu histórico de forma impecável.',
      },
    ],
  },
  greenhouse: {
    slug: 'greenhouse',
    name: 'Greenhouse',
    fullName: 'Greenhouse Hiring Platform',
    country: 'US',
    marketName: 'Tech Global, Startups & Scaleups',
    description: 'O Greenhouse é a plataforma de recrutamento mais utilizada no ecossistema global de tecnologia, startups em hipercrescimento e unicórnios, com foco em contratações baseadas em competências e evidências práticas.',
    marketShare: 'Líder em empresas de tecnologia e inovação nos EUA, Europa e América Latina.',
    howItWorks: [
      {
        title: 'Scorecards de Competências',
        description: 'Avalia a aderência do candidato contra scorecards específicos de habilidades técnicas, ferramentas e liderança.',
      },
      {
        title: 'Integração com Portfólios e Perfis',
        description: 'Conecta informações do currículo com links profissionais (LinkedIn, GitHub, portfólios) para análise do time técnico.',
      },
    ],
    eliminationFactors: [
      'Currículos genéricos que não comprovam o domínio prático das ferramentas e frameworks.',
      'Ausência de resultados objetivos alcançados em experiências anteriores.',
      'Falta de conexões claras entre projetos e impacto no negócio.',
    ],
    howGriffoWorkHelps: [
      'Mapeia a compatibilidade de competências técnicas e metodologias exigidas na vaga.',
      'Audita seus perfis sociais e profissionais para garantir alinhamento com o currículo.',
      'Calcula a nota de impacto e clareza para atender aos critérios de scorecard dos recrutadores.',
    ],
    faqs: [
      {
        question: 'Por que o Greenhouse é tão popular em tecnologia?',
        answer: 'Porque permite aos times de engenharia e produto avaliar competências de forma estruturada e colaborativa, reduzindo vieses na triagem inicial.',
      },
      {
        question: 'O GriffoWork analisa vagas remotas internacionais no Greenhouse?',
        answer: 'Sim, a inteligência do GriffoWork adapta o laudo para processos globais e requisitos internacionais.',
      },
    ],
  },
  lever: {
    slug: 'lever',
    name: 'Lever',
    fullName: 'Lever Talent Relationship Management',
    country: 'US',
    marketName: 'Scaleups & Big Tech',
    description: 'O Lever combina recursos de rastreamento de candidatos (ATS) com gestão de relacionamento de talentos (CRM), permitindo que equipes de recrutamento busquem e qualifiquem candidatos continuamente em sua base de dados.',
    marketShare: 'Amplamente adotado por empresas inovadoras de tecnologia de médio e grande porte.',
    howItWorks: [
      {
        title: 'Indexação Contínua de Talentos',
        description: 'Armazena e indexa o histórico completo do candidato para cruzamento com vagas atuais e futuras.',
      },
      {
        title: 'Busca Semântica por Habilidades',
        description: 'Recrutadores filtram candidatos através de buscas semânticas detalhadas por ferramentas, cargos e formações.',
      },
    ],
    eliminationFactors: [
      'Falta de termos técnicos que permitam ao sistema encontrar o perfil em buscas temáticas.',
      'Descrições vagas que não detalham a extensão do conhecimento do candidato.',
    ],
    howGriffoWorkHelps: [
      'Assegura a presença de palavras-chave estratégicas para que seu currículo seja encontrado nas buscas do Lever.',
      'Aprimora o posicionamento profissional para retenção de longo prazo na base de talentos.',
    ],
    faqs: [
      {
        question: 'Como funciona o banco de talentos do Lever?',
        answer: 'O Lever mantém perfis arquivados e pesquisáveis. Um currículo com alta densidade de termos relevantes continua sendo localizado para novas oportunidades.',
      },
    ],
  },
  taleo: {
    slug: 'taleo',
    name: 'Oracle Taleo',
    fullName: 'Oracle Taleo Enterprise Edition',
    country: 'US',
    marketName: 'Bancos, Governos & Grandes Corporações',
    description: 'O Oracle Taleo é um dos sistemas de recrutamento corporativo mais consolidados do mundo, amplamente utilizado no setor financeiro, óleo e gás, telecomunicações e órgãos públicos.',
    marketShare: 'Forte presença em corporações tradicionais e instituições financeiras globais.',
    howItWorks: [
      {
        title: 'Filtros Tradicionais de Triagem',
        description: 'Aplica regras estruturadas de triagem baseadas em títulos formais, tempo de serviço e níveis de formação.',
      },
    ],
    eliminationFactors: [
      'Títulos de seções não convencionais que o parser legado não consegue classificar.',
      'Elementos gráficos que desestruturam a hierarquia das informações.',
    ],
    howGriffoWorkHelps: [
      'Audita a estrutura formal do currículo para compatibilidade com o parser do Taleo.',
      'Verifica o padrão de datas, cargos e seções clássicas exigidas por corporações tradicionais.',
    ],
    faqs: [
      {
        question: 'O Oracle Taleo ainda é amplamente usado?',
        answer: 'Sim, especialmente em grandes bancos, indústrias e corporações que gerenciam milhares de colaboradores em todo o mundo.',
      },
    ],
  },
  solides: {
    slug: 'solides',
    name: 'Solides',
    fullName: 'Solides Gestão de RH & Recrutamento',
    country: 'BR',
    marketName: 'Brasil (PMEs e Médias Empresas)',
    description: 'A Solides é uma das principais plataformas de RH e atração de talentos para pequenas e médias empresas no Brasil, integrando triagem curricular com análise de perfil comportamental (Profiler).',
    marketShare: 'Presente em mais de 25 mil empresas no Brasil.',
    howItWorks: [
      {
        title: 'Triagem Integrada',
        description: 'Combina a aderência às competências técnicas do anúncio com a análise de fit comportamental e cultural da vaga.',
      },
    ],
    eliminationFactors: [
      'Incompatibilidade evidente entre o histórico profissional relatado e o cargo pretendido.',
      'Erros estruturais que dificultam a identificação rápida das competências-chave.',
    ],
    howGriffoWorkHelps: [
      'Equilibra a apresentação de competências técnicas e habilidades de colaboração e liderança.',
      'Gera um laudo claro que destaca o posicionamento profissional adequado para PMEs e médias empresas.',
    ],
    faqs: [
      {
        question: 'Como a Solides avalia os candidatos?',
        answer: 'A plataforma cruza as competências descritas no currículo com requisitos da vaga e testes de perfil aplicados durante o processo.',
      },
    ],
  },
  icims: {
    slug: 'icims',
    name: 'iCIMS',
    fullName: 'iCIMS Talent Cloud',
    country: 'US',
    marketName: 'Estados Unidos & Reino Unido',
    description: 'O iCIMS é uma das plataformas de triagem e gestão de talentos mais robustas do mercado corporativo americano e britânico, processando milhões de candidaturas anualmente.',
    marketShare: 'Mais de 4.000 grandes clientes corporativos nos EUA e Europa.',
    howItWorks: [
      {
        title: 'Pontuação de Requisitos',
        description: 'Calcula o score de qualificação com base na correspondência dos requisitos essenciais e desejáveis da vaga.',
      },
    ],
    eliminationFactors: [
      'Falta de correspondência direta com as palavras-chave listadas na descrição da vaga.',
    ],
    howGriffoWorkHelps: [
      'Compara seu currículo com a vaga desejada e aponta a taxa de aderência aos requisitos do iCIMS.',
      'Sugere melhorias de clareza e impacto para elevar o score da candidatura.',
    ],
    faqs: [
      {
        question: 'O iCIMS é muito utilizado no mercado americano?',
        answer: 'Sim, é um dos ATS mais comuns em grandes corporações e setores como saúde, finanças e tecnologia nos EUA e Reino Unido.',
      },
    ],
  },
  ashby: {
    slug: 'ashby',
    name: 'Ashby',
    fullName: 'Ashby All-in-One Recruiting',
    country: 'US',
    marketName: 'Startups Globais & Scaleups de IA',
    description: 'O Ashby é uma plataforma moderna de recrutamento de crescimento acelerado entre empresas inovadoras de tecnologia e inteligência artificial, focada em automações inteligentes e analytics.',
    marketShare: 'Crescimento expressivo em scaleups de tecnologia e IA.',
    howItWorks: [
      {
        title: 'Triagem Rápida e Resumos com IA',
        description: 'Disponibiliza sumários analíticos para que recrutadores identifiquem rapidamente o impacto e senioridade do candidato.',
      },
    ],
    eliminationFactors: [
      'Currículos prolixos e sem foco nas principais realizações técnicas e entregas de impacto.',
    ],
    howGriffoWorkHelps: [
      'Audita a síntese executiva do seu currículo para garantir leitura rápida e de alto impacto.',
      'Destaca projetos complexos e liderança técnica para os filtros do Ashby.',
    ],
    faqs: [
      {
        question: 'O que diferencia o Ashby de outros sistemas?',
        answer: 'O Ashby oferece dashboards analíticos e resumos automáticos que valorizam currículos objetivos e orientados a resultados.',
      },
    ],
  },
  infojobs: {
    slug: 'infojobs',
    name: 'InfoJobs',
    fullName: 'InfoJobs (Brasil & Espanha / Adevinta)',
    country: 'ES',
    marketName: 'Espanha, Brasil e Itália',
    description: 'O InfoJobs é um dos portais de emprego e triagem de currículos mais tradicionais da Espanha, Itália e Brasil, utilizado por milhares de recrutadores de diversos setores da economia.',
    marketShare: 'Líder histórico de candidaturas e vagas corporativas na Espanha.',
    howItWorks: [
      {
        title: 'Filtros Diretos de Recrutadores',
        description: 'Permite aos recrutadores filtrar candidatos por localização, faixa salarial, formação e histórico recente.',
      },
    ],
    eliminationFactors: [
      'Falta de clareza nas informações de contato, localização e pretensão salarial.',
    ],
    howGriffoWorkHelps: [
      'Verifica a completude de todas as seções obrigatórias para processos no InfoJobs.',
      'Garante que as competências e histórico estejam alinhados com o mercado da Espanha e Brasil.',
    ],
    faqs: [
      {
        question: 'Como funciona a busca de candidatos no InfoJobs?',
        answer: 'Recrutadores filtram por palavras-chave e localização antes de abrir os currículos individualmente.',
      },
    ],
  },
  personio: {
    slug: 'personio',
    name: 'Personio',
    fullName: 'Personio HR Operating System',
    country: 'DE',
    marketName: 'Alemanha, Áustria, Suíça e Europa',
    description: 'O Personio é a principal plataforma de RH e recrutamento para empresas de pequeno e médio porte na Europa, com forte presença na região DACH (Alemanha, Áustria e Suíça).',
    marketShare: 'Líder em PMEs e empresas em expansão na União Europeia.',
    howItWorks: [
      {
        title: 'Processamento em Padrão Europeu',
        description: 'Processa candidaturas multilíngues (alemão e inglês) avaliando a consistência cronológica da trajetória profissional.',
      },
    ],
    eliminationFactors: [
      'Estrutura incompatível com os formatos usuais de contratação do mercado europeu.',
    ],
    howGriffoWorkHelps: [
      'Adapta a estrutura do currículo aos padrões e expectativas de contratação da Europa.',
      'Assegura conformidade de dados e clareza da trajetória para empresas usuárias do Personio.',
    ],
    faqs: [
      {
        question: 'O Personio é compatível com currículos em inglês e alemão?',
        answer: 'Sim, a plataforma processa ambos os idiomas conforme a exigência da vaga e país de contratação.',
      },
    ],
  },
}
