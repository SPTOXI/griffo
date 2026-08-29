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
  optimizationTips: string[]
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
    description: 'A Gupy é a plataforma de recrutamento e IA mais utilizada pelas grandes empresas e multinacionais no Brasil. Sua inteligência artificial (Gaia) analisa e ranqueia candidatos com base na afinidade de palavras-chave, histórico profissional e testes.',
    marketShare: 'Presente em mais de 70% das grandes vagas corporativas no Brasil.',
    howItWorks: [
      {
        title: 'Extração e Leitura de Texto (Parsing)',
        description: 'O algoritmo da Gupy converte seu arquivo de currículo em texto puro. Elementos visuais como colunas duplas, ícones, tabelas ou caixas de texto podem fazer o robô ignorar partes inteiras da sua experiência.',
      },
      {
        title: 'Algoritmo de Afinidade e Ranking (IA Gaia)',
        description: 'A IA compara as competências, ferramentas e responsabilidades descritas no seu currículo com a descrição da vaga, atribuindo uma nota de 0 a 100% de compatibilidade.',
      },
      {
        title: 'Filtros Eliminatórios Automáticos',
        description: 'Perguntas eliminatórias (ex: pretensão, escolaridade, modelo presencial/híbrido) e requisitos obrigatórios da vaga descartam currículos antes mesmo da triagem do recrutador.',
      },
    ],
    eliminationFactors: [
      'Currículo salvo como imagem ou PDF não pesquisável (sem camada de texto OCR).',
      'Uso de designs em colunas múltiplas, cabeçalhos ou rodapés complexos que quebram a ordem de leitura.',
      'Ausência das palavras-chave exatas exigidas na descrição da vaga.',
      'Falta de métricas e resultados concretos nas descrições de cargo.',
    ],
    optimizationTips: [
      'Utilize formato cronológico reverso com títulos de seções padronizados (Experiência Profissional, Formação Acadêmica, Competências).',
      'Inclua tanto a sigla quanto o nome por extenso das tecnologias e metodologias (ex: "Search Engine Optimization (SEO)").',
      'Use a análise do GriffoWork para mapear exatamente as lacunas de termos e pontuação da sua área na Gupy.',
    ],
    faqs: [
      {
        question: 'Como saber se meu currículo passa na IA da Gupy?',
        answer: 'O GriffoWork simula os critérios de extração e ranqueamento semântico da Gupy, avaliando 8 dimensões executivas e apontando a nota ATS do seu documento antes do envio.',
      },
      {
        question: 'A Gupy descarta currículos automaticamente?',
        answer: 'Sim. Candidatos que não atingem a pontuação mínima de afinidade ou erram requisitos eliminatórios ficam no final da fila de triagem e raramente são visualizados pelo recrutador humano.',
      },
      {
        question: 'Qual o melhor formato de arquivo para enviar na Gupy?',
        answer: 'PDF padrão de texto gerado por processador de texto, em layout de coluna única e sem elementos gráficos que impeçam a seleção de texto.',
      },
    ],
  },
  workday: {
    slug: 'workday',
    name: 'Workday',
    fullName: 'Workday Recruiting / Human Capital Management',
    country: 'US',
    marketName: 'Estados Unidos, Europa e Multinacionais',
    description: 'O Workday é o sistema de gestão de talentos padrão das empresas da Fortune 500 e das maiores multinacionais do mundo. É conhecido por ter um dos parsers de currículo mais rígidos do mercado corporativo.',
    marketShare: 'Adotado por mais de 50% das empresas da Fortune 500 globalmente.',
    howItWorks: [
      {
        title: 'Parsing Estruturado por Campos',
        description: 'O Workday tenta mapear automaticamente cada parágrafo para campos fixos: Cargo, Empresa, Data de Início, Data de Término e Descrição. Formatações fora do padrão causam perda de dados.',
      },
      {
        title: 'Compatibilidade com Legislação Antidiscriminação',
        description: 'Em processos nos EUA e Reino Unido, currículos com fotos, data de nascimento ou estado civil podem ser descartados automaticamente para evitar passivos trabalhistas.',
      },
      {
        title: 'Validação de Senioridade e Trajetória',
        description: 'O sistema calcula o tempo total de experiência relevante e a progressão de títulos de cargo para filtrar os candidatos que atendem ao perfil.',
      },
    ],
    eliminationFactors: [
      'Inclusão de fotos, gráficos ou dados pessoais sensíveis em vagas dos EUA/UK.',
      'Datas com formatos inconsistentes (o ideal é sempre "Mês/Ano – Mês/Ano" ou "MM/AAAA").',
      'Layout de duas colunas que embaralha a cronologia das experiências.',
    ],
    optimizationTips: [
      'Mantenha o currículo em 1 página (ou no máximo 2 para cargos executivos).',
      'Descreva cada conquista utilizando fórmulas de impacto orientadas a números (ex: método XYZ ou STAR).',
      'Alinhe títulos de cargo com o padrão internacional de mercado (ex: "Senior Product Manager" em vez de nomenclaturas internas da empresa).',
    ],
    faqs: [
      {
        question: 'O Workday lê currículos em português?',
        answer: 'Sim, mas para vagas internacionais e empresas globais, a triagem e o recrutamento ocorrem integralmente em inglês padrão.',
      },
      {
        question: 'Por que o Workday preencheu meus campos todos errados no formulário?',
        answer: 'Isso acontece quando o arquivo contém tabelas, colunas duplas ou fontes não convencionais. Um currículo otimizado para ATS é preenchido perfeitamente no Workday.',
      },
    ],
  },
  greenhouse: {
    slug: 'greenhouse',
    name: 'Greenhouse',
    fullName: 'Greenhouse Hiring Platform',
    country: 'US',
    marketName: 'Tech Global, Startups & Scaleups',
    description: 'O Greenhouse é o ATS favorito das principais empresas de tecnologia, unicórnios e startups de alto crescimento no Vale do Silício, Europa e Brasil. Foca em contratações estruturadas e baseadas em evidências.',
    marketShare: 'Líder em empresas de tecnologia e startups em escala global.',
    howItWorks: [
      {
        title: 'Scorecards e Critérios Estruturados',
        description: 'Recrutadores no Greenhouse avaliam candidatos contra scorecards de habilidades específicas. O currículo precisa comprovar claramente o domínio de cada ferramenta.',
      },
      {
        title: 'Enriquecimento de Perfil Social',
        description: 'A plataforma integra links para LinkedIn, GitHub, Behance e portfólios pessoais, permitindo que a equipe técnica avalie seu trabalho prático.',
      },
    ],
    eliminationFactors: [
      'Currículos genéricos que não citam o stack tecnológico e o impacto específico.',
      'Falta de links clicáveis e válidos para perfis de trabalho (LinkedIn, GitHub).',
      'Descrições de cargo focadas apenas em tarefas em vez de resultados de negócio.',
    ],
    optimizationTips: [
      'Destaque suas principais tecnologias logo no resumo profissional e em cada experiência.',
      'Inclua links formatados corretamente para o seu LinkedIn e repositórios de código/design.',
      'Use verbos de ação fortes no início de cada marcador (ex: "Architected", "Spearheaded", "Scaled").',
    ],
    faqs: [
      {
        question: 'Como o Greenhouse avalia candidatos remotos internacionais?',
        answer: 'O Greenhouse permite filtrar por fuso horário, proficiência em inglês e autorização de trabalho. Deixar esses pontos claros no currículo evita descartes prematuros.',
      },
    ],
  },
  lever: {
    slug: 'lever',
    name: 'Lever',
    fullName: 'Lever Talent Relationship Management',
    country: 'US',
    marketName: 'Scaleups & Big Tech',
    description: 'O Lever combina recursos de ATS e CRM de recrutamento, permitindo que recrutadores proativamente pesquisem e qualifiquem candidatos dentro de sua base de talentos.',
    marketShare: 'Ampla presença em empresas de tecnologia média e grande porte.',
    howItWorks: [
      {
        title: 'Busca Semântica Avançada',
        description: 'Recrutadores buscam talentos usando filtros booleanos complexos no Lever. Ter as combinações certas de termos técnicos garante que seu currículo seja encontrado.',
      },
    ],
    eliminationFactors: [
      'Termos técnicos desatualizados ou ausência de competências complementares.',
    ],
    optimizationTips: [
      'Crie uma seção dedicada de "Competências & Tecnologias" no início do documento.',
    ],
    faqs: [
      {
        question: 'Qual a diferença entre Lever e outros ATS?',
        answer: 'O Lever mantém seu currículo indexado para vagas futuras de forma muito ativa. Um currículo bem pontuado pode ser chamado meses após a aplicação.',
      },
    ],
  },
  taleo: {
    slug: 'taleo',
    name: 'Oracle Taleo',
    fullName: 'Oracle Taleo Enterprise Edition',
    country: 'US',
    marketName: 'Grandes Corporações, Bancos e Governos',
    description: 'O Oracle Taleo é um dos ATS mais tradicionais do mundo, presente em grandes instituições financeiras, operadoras de telecomunicações e órgãos governamentais.',
    marketShare: 'Dominante no setor financeiro, óleo & gás e telecom.',
    howItWorks: [
      {
        title: 'Parser Legado Baseado em Padrões Rígidos',
        description: 'O Taleo utiliza regras rígidas de formatação e pode falhar ao interpretar PDFs modernos com elementos visuais complexos.',
      },
    ],
    eliminationFactors: [
      'Fontes exóticas, ícones e formatação em tabelas.',
      'Títulos de seções em linguagem criativa (ex: "Minha Jornada" em vez de "Experiência Profissional").',
    ],
    optimizationTips: [
      'Use fontes clássicas (Arial, Calibri, Helvetica, Times New Roman).',
      'Mantenha cabeçalhos e títulos estritamente tradicionais.',
    ],
    faqs: [
      {
        question: 'O Taleo ainda é muito utilizado?',
        answer: 'Sim, principalmente em corporações enterprise tradicionais e instituições de grande porte global.',
      },
    ],
  },
  solides: {
    slug: 'solides',
    name: 'Solides',
    fullName: 'Solides Gestão de RH & Recrutamento',
    country: 'BR',
    marketName: 'Brasil (PMEs e Médias Empresas)',
    description: 'A Solides é líder em software de gestão de pessoas e recrutamento para pequenas e médias empresas no Brasil, integrando triagem curricular com mapeamento de perfil comportamental (Profiler).',
    marketShare: 'Presente em mais de 25 mil empresas no Brasil.',
    howItWorks: [
      {
        title: 'Triagem Integrada com Perfil Comportamental',
        description: 'Avalia tanto a experiência técnica quanto o alinhamento de estilo de trabalho para a cultura da empresa.',
      },
    ],
    eliminationFactors: [
      'Incoerência entre a experiência relatada e o cargo pretendido.',
      'Currículo com erros graves de português ou falta de contato atualizado.',
    ],
    optimizationTips: [
      'Destaque tanto competências técnicas quanto habilidades de colaboração e liderança.',
    ],
    faqs: [
      {
        question: 'Como se preparar para processos na Solides?',
        answer: 'Tenha seu currículo alinhado com as palavras-chave da vaga e preencha com atenção o mapeamento comportamental quando solicitado.',
      },
    ],
  },
  icims: {
    slug: 'icims',
    name: 'iCIMS',
    fullName: 'iCIMS Talent Cloud',
    country: 'US',
    marketName: 'Estados Unidos & Reino Unido',
    description: 'O iCIMS é uma das plataformas de atração e triagem de talentos mais robustas do mercado corporativo americano e britânico, processando milhões de candidaturas anualmente.',
    marketShare: 'Mais de 4.000 grandes clientes corporativos nos EUA e Europa.',
    howItWorks: [
      {
        title: 'Classificação Automatizada por Score de Requisitos',
        description: 'O iCIMS calcula uma pontuação percentual baseada na aderência a cada requisito essencial e desejável da vaga.',
      },
    ],
    eliminationFactors: [
      'Falta de palavras-chave exatas correspondentes aos requisitos listados.',
    ],
    optimizationTips: [
      'Revise os requisitos da vaga e garanta que suas experiências demonstrem claramente cada um deles.',
    ],
    faqs: [
      {
        question: 'Como garantir nota alta no iCIMS?',
        answer: 'Utilize o relatório de palavras-chave do GriffoWork para verificar a correspondência semântica com o anúncio da vaga.',
      },
    ],
  },
  ashby: {
    slug: 'ashby',
    name: 'Ashby',
    fullName: 'Ashby All-in-One Recruiting',
    country: 'US',
    marketName: 'Startups Globais & Scaleups de IA',
    description: 'O Ashby é a plataforma de recrutamento de crescimento mais rápido no ecossistema global de tecnologia e IA, conhecida por automações e analytics avançados.',
    marketShare: 'Crescimento acelerado entre scaleups e empresas de tecnologia inovadoras.',
    howItWorks: [
      {
        title: 'Triagem Rápida e Foco em Métricas',
        description: 'Recrutadores no Ashby analisam currículos com auxílio de sumários automatizados de impacto e senioridade.',
      },
    ],
    eliminationFactors: [
      'Currículo prolixo sem foco em entregas e realizações.',
    ],
    optimizationTips: [
      'Seja direto: destaque projetos de alto impacto, arquitetura de sistemas e liderança técnica.',
    ],
    faqs: [
      {
        question: 'O Ashby usa IA para triagem?',
        answer: 'Sim, o Ashby disponibiliza resumos inteligentes e filtros avançados para os times de recrutamento.',
      },
    ],
  },
  infojobs: {
    slug: 'infojobs',
    name: 'InfoJobs',
    fullName: 'InfoJobs (Brasil & Espanha / Adevinta)',
    country: 'ES',
    marketName: 'Espanha, Brasil e Itália',
    description: 'O InfoJobs é um dos portais de emprego e triagem de candidatos mais tradicionais e acessados na Espanha, Itália e Brasil.',
    marketShare: 'Líder histórico de vagas e candidaturas na Espanha e forte presença no Brasil.',
    howItWorks: [
      {
        title: 'Filtros Diretos de Localização e Salário',
        description: 'Recrutadores aplicam filtros duros por tempo de experiência, cidade e faixa salarial pretendida.',
      },
    ],
    eliminationFactors: [
      'Pretensão salarial fora do intervalo da vaga ou localização incompatível.',
    ],
    optimizationTips: [
      'Mantenha seu perfil no InfoJobs perfeitamente sincronizado com o currículo enviado.',
    ],
    faqs: [
      {
        question: 'Como me destacar no InfoJobs Espanha?',
        answer: 'Inclua foto profissional conforme o padrão do mercado espanhol e certifique-se de preencher todas as experiências detalhadamente.',
      },
    ],
  },
  personio: {
    slug: 'personio',
    name: 'Personio',
    fullName: 'Personio HR Operating System',
    country: 'DE',
    marketName: 'Alemanha, Áustria, Suíça e Europa',
    description: 'O Personio é a principal plataforma de RH e recrutamento para empresas de pequeno e médio porte em toda a Europa, especialmente na região DACH (Alemanha, Áustria, Suíça).',
    marketShare: 'Líder em PMEs e empresas em expansão na União Europeia.',
    howItWorks: [
      {
        title: 'Padrão Europeu de Triagem',
        description: 'Interpreta candidaturas em alemão e inglês, analisando histórico cronológico sem lacunas não explicadas.',
      },
    ],
    eliminationFactors: [
      'Lacunas longas na linha do tempo sem justificativa clara no Lebenslauf.',
    ],
    optimizationTips: [
      'Adote a estrutura clássica de currículo europeu ou Lebenslauf para processos na Alemanha.',
    ],
    faqs: [
      {
        question: 'Posso me candidatar em inglês no Personio na Alemanha?',
        answer: 'Sim, para empresas de tecnologia e multinacionais baseadas em Berlim ou Munique o inglês é o padrão; para empresas tradicionais locais, o currículo em alemão é preferível.',
      },
    ],
  },
}
