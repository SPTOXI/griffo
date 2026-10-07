import type { AtsLocale } from '../content-types'

/**
 * Guias de ATS em português.
 *
 * Extraído de `lib/ats/data.ts` (que era a única fonte, só em PT) na
 * separação meta/conteúdo — o texto abaixo é o mesmo que já estava no ar,
 * migrado por script para não introduzir erro de transcrição em 148
 * campos.
 */
export const atsPt: AtsLocale = {
  gupy: {
    marketName: 'Brasil',
    description: 'A Gupy é a plataforma de recrutamento e seleção mais utilizada por grandes empresas e multinacionais no Brasil. Sua inteligência artificial proprietária (Gaia) analisa, extrai e ranqueia automaticamente os currículos com base na afinidade semântica com a vaga.',
    marketShare: 'Líder do mercado brasileiro de recrutamento e seleção, com milhares de empresas clientes.',
    howItWorks: [
      { title: 'Extração e Leitura de Texto (Parsing)', description: 'O algoritmo da Gupy converte o arquivo de currículo em texto puro. Estruturas visuais não lineares, tabelas ou cabeçalhos complexos podem fazer o robô ignorar partes cruciais do histórico profissional.' },
      { title: 'Algoritmo de Afinidade e Ranking (IA Gaia)', description: 'A IA compara termos técnicos, ferramentas e responsabilidades descritas no documento com o perfil ideal da vaga, gerando um ranking percentual de compatibilidade.' },
      { title: 'Filtros Eliminatórios de Triagem', description: 'Critérios pré-definidos pelos recrutadores (requisitos mandatórios, formação, modelo de trabalho) descartam automaticamente candidaturas antes da visualização humana.' },
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
      { question: 'O que é a IA Gaia da Gupy?', answer: 'É o modelo de inteligência artificial da Gupy responsável por ler o conteúdo dos currículos, calcular a afinidade com a vaga e ordenar os candidatos para os recrutadores.' },
      { question: 'Como o GriffoWork ajuda em processos na Gupy?', answer: 'O GriffoWork avalia seu currículo antes do envio, apontando lacunas de palavras-chave, erros de formatação que confundem o robô e o nível de adequação para que você chegue à fase de entrevistas.' },
      { question: 'A Gupy descarta currículos automaticamente?', answer: 'Sim. Candidatos com baixa pontuação algorítmica ou que não atendem aos filtros mandatórios ficam no final da fila de triagem e raramente são abertos pelos recrutadores.' },
    ],
  },
  workday: {
    marketName: 'Estados Unidos, Europa e Multinacionais Globais',
    description: 'O Workday é o sistema corporativo padrão adotado pela maioria das empresas da Fortune 500 e grandes multinacionais globais. É conhecido por ter um dos parsers mais rigorosos e padronizados do mercado de RH.',
    marketShare: 'Adotado por mais de 50% das corporações da Fortune 500.',
    howItWorks: [
      { title: 'Mapeamento Estruturado de Campos', description: 'O Workday fragmenta o currículo em campos predefinidos: Empresa, Cargo, Período e Responsabilidades. Qualquer desalinhamento de formato causa perda de dados na triagem.' },
      { title: 'Triagem em Conformidade Internacional', description: 'Filtra candidaturas considerando conformidades trabalhistas globais, exigindo clareza na progressão de carreira e senioridade.' },
      { title: 'Verificação de Métricas e Requisitos', description: 'O sistema prioriza perfis que demonstram impacto mensurável alinhado às competências listadas na requisição de vaga.' },
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
      { question: 'O que torna o Workday tão exigente?', answer: 'Por receber milhares de aplicações por vaga em multinacionais, o Workday utiliza critérios estruturados que descartam currículos com formatação confusa ou informações difíceis de categorizar.' },
      { question: 'Como o GriffoWork prepara meu perfil para o Workday?', answer: 'O GriffoWork analisa a clareza cronológica, formatação e presença de métricas executivas, assegurando que o Workday extraia seu histórico de forma impecável.' },
    ],
  },
  greenhouse: {
    marketName: 'Tech Global, Startups & Scaleups',
    description: 'O Greenhouse é a plataforma de recrutamento mais utilizada no ecossistema global de tecnologia, startups em hipercrescimento e unicórnios, com foco em contratações baseadas em competências e evidências práticas.',
    marketShare: 'Líder em empresas de tecnologia e inovação nos EUA, Europa e América Latina.',
    howItWorks: [
      { title: 'Scorecards de Competências', description: 'Avalia a aderência do candidato contra scorecards específicos de habilidades técnicas, ferramentas e liderança.' },
      { title: 'Integração com Portfólios e Perfis', description: 'Conecta informações do currículo com links profissionais (LinkedIn, GitHub, portfólios) para análise do time técnico.' },
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
      { question: 'Por que o Greenhouse é tão popular em tecnologia?', answer: 'Porque permite aos times de engenharia e produto avaliar competências de forma estruturada e colaborativa, reduzindo vieses na triagem inicial.' },
      { question: 'O GriffoWork analisa vagas remotas internacionais no Greenhouse?', answer: 'Sim, a inteligência do GriffoWork adapta o laudo para processos globais e requisitos internacionais.' },
    ],
  },
  lever: {
    marketName: 'Scaleups & Big Tech',
    description: 'O Lever combina recursos de rastreamento de candidatos (ATS) com gestão de relacionamento de talentos (CRM), permitindo que equipes de recrutamento busquem e qualifiquem candidatos continuamente em sua base de dados.',
    marketShare: 'Amplamente adotado por empresas inovadoras de tecnologia de médio e grande porte.',
    howItWorks: [
      { title: 'Indexação Contínua de Talentos', description: 'Armazena e indexa o histórico completo do candidato para cruzamento com vagas atuais e futuras.' },
      { title: 'Busca Semântica por Habilidades', description: 'Recrutadores filtram candidatos através de buscas semânticas detalhadas por ferramentas, cargos e formações.' },
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
      { question: 'Como funciona o banco de talentos do Lever?', answer: 'O Lever mantém perfis arquivados e pesquisáveis. Um currículo com alta densidade de termos relevantes continua sendo localizado para novas oportunidades.' },
    ],
  },
  taleo: {
    marketName: 'Bancos, Governos & Grandes Corporações',
    description: 'O Oracle Taleo é um dos sistemas de recrutamento corporativo mais consolidados do mundo, amplamente utilizado no setor financeiro, óleo e gás, telecomunicações e órgãos públicos.',
    marketShare: 'Forte presença em corporações tradicionais e instituições financeiras globais.',
    howItWorks: [
      { title: 'Filtros Tradicionais de Triagem', description: 'Aplica regras estruturadas de triagem baseadas em títulos formais, tempo de serviço e níveis de formação.' },
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
      { question: 'O Oracle Taleo ainda é amplamente usado?', answer: 'Sim, especialmente em grandes bancos, indústrias e corporações que gerenciam milhares de colaboradores em todo o mundo.' },
    ],
  },
  solides: {
    marketName: 'Brasil (PMEs e Médias Empresas)',
    description: 'A Solides é uma das principais plataformas de RH e atração de talentos para pequenas e médias empresas no Brasil, integrando triagem curricular com análise de perfil comportamental (Profiler).',
    marketShare: 'Presente em mais de 25 mil empresas no Brasil.',
    howItWorks: [
      { title: 'Triagem Integrada', description: 'Combina a aderência às competências técnicas do anúncio com a análise de fit comportamental e cultural da vaga.' },
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
      { question: 'Como a Solides avalia os candidatos?', answer: 'A plataforma cruza as competências descritas no currículo com requisitos da vaga e testes de perfil aplicados durante o processo.' },
    ],
  },
  ashby: {
    marketName: 'Startups Globais & Scaleups de IA',
    description: 'O Ashby é uma plataforma moderna de recrutamento de crescimento acelerado entre empresas inovadoras de tecnologia e inteligência artificial, focada em automações inteligentes e analytics.',
    marketShare: 'Crescimento expressivo em scaleups de tecnologia e IA.',
    howItWorks: [
      { title: 'Triagem Rápida e Resumos com IA', description: 'Disponibiliza sumários analíticos para que recrutadores identifiquem rapidamente o impacto e senioridade do candidato.' },
    ],
    eliminationFactors: [
      'Currículos prolixos e sem foco nas principais realizações técnicas e entregas de impacto.',
    ],
    howGriffoWorkHelps: [
      'Audita a síntese executiva do seu currículo para garantir leitura rápida e de alto impacto.',
      'Destaca projetos complexos e liderança técnica para os filtros do Ashby.',
    ],
    faqs: [
      { question: 'O que diferencia o Ashby de outros sistemas?', answer: 'O Ashby oferece dashboards analíticos e resumos automáticos que valorizam currículos objetivos e orientados a resultados.' },
    ],
  },
  infojobs: {
    marketName: 'Espanha, Brasil e Itália',
    description: 'O InfoJobs é um dos portais de emprego e triagem de currículos mais tradicionais da Espanha, Itália e Brasil, utilizado por milhares de recrutadores de diversos setores da economia.',
    marketShare: 'Líder histórico de candidaturas e vagas corporativas na Espanha.',
    howItWorks: [
      { title: 'Filtros Diretos de Recrutadores', description: 'Permite aos recrutadores filtrar candidatos por localização, faixa salarial, formação e histórico recente.' },
    ],
    eliminationFactors: [
      'Falta de clareza nas informações de contato, localização e pretensão salarial.',
    ],
    howGriffoWorkHelps: [
      'Verifica a completude de todas as seções obrigatórias para processos no InfoJobs.',
      'Garante que as competências e histórico estejam alinhados com o mercado da Espanha e Brasil.',
    ],
    faqs: [
      { question: 'Como funciona a busca de candidatos no InfoJobs?', answer: 'Recrutadores filtram por palavras-chave e localização antes de abrir os currículos individualmente.' },
    ],
  },
  smartrecruiters: {
    marketName: "Empresas Médias e Grandes com Operação Internacional",
    description:
      "O SmartRecruiters é uma plataforma de aquisição de talentos que empresas de médio e grande porte usam para publicar vagas, receber candidaturas e gerenciar candidatos em um único funil. O currículo é lido e transformado em um perfil que o recrutador busca, filtra e compara.",
    marketShare: "Muito usado por empresas internacionais de médio e grande porte.",
    howItWorks: [
      {
        title: "Leitura do currículo em perfil",
        description:
          "O sistema lê o arquivo e monta um perfil estruturado: contatos, experiências, formação e competências. O que não é lido como texto pode nunca chegar ao recrutador.",
      },
      {
        title: "Perguntas na candidatura",
        description:
          "A empresa pode incluir perguntas de triagem no formulário, como autorização de trabalho, localização ou experiência exigida, e o recrutador usa as respostas para filtrar a lista.",
      },
      {
        title: "Avaliação em equipe",
        description:
          "Recrutadores e gestores comparam perfis lado a lado, então um resumo claro e resultados quantificados facilitam a comparação.",
      },
    ],
    eliminationFactors: [
      "Layouts em várias colunas, tabelas ou caixas de texto que embaralham a ordem em que o sistema lê sua trajetória.",
      "Contatos ou competências importantes em cabeçalho, rodapé ou imagem, que os leitores costumam ignorar.",
      "Termos diferentes dos da vaga, o que enfraquece buscas e filtros.",
    ],
    howGriffoWorkHelps: [
      "Verifica se um leitor típico de ATS lê seu currículo como texto limpo e na ordem certa.",
      "Compara suas competências e termos com a descrição da vaga para achar palavras-chave ausentes.",
      "Avalia se conquistas e métricas se destacam quando o recrutador compara perfis.",
      "Gera uma carta de apresentação direcionada à vaga.",
    ],
    faqs: [
      {
        question: "O SmartRecruiters descarta meu currículo automaticamente?",
        answer:
          "Depende de como cada empresa configurou a vaga. Muitas usam perguntas e filtros, e o recrutador decide o restante. Um currículo que o sistema não lê direito é mais fácil de passar despercebido, por isso o layout limpo importa.",
      },
      {
        question: "Qual formato de arquivo funciona melhor?",
        answer:
          "Siga o formato que a empresa pedir. Se for livre, um PDF com texto selecionável ou um .docx simples, em uma coluna, é a escolha mais segura.",
      },
    ],
  },
  successfactors: {
    marketName: "Grandes Corporações e Multinacionais",
    description:
      "O SAP SuccessFactors Recruiting é o módulo de recrutamento da suíte de gestão de pessoas da SAP. Grandes organizações o usam para conduzir processos seletivos estruturados e orientados a conformidade, com o currículo alimentando o perfil do candidato junto do formulário.",
    marketShare: "Escolha comum em grandes corporações que já usam SAP.",
    howItWorks: [
      {
        title: "Formulário estruturado",
        description:
          "O candidato costuma preencher um formulário detalhado no site de carreiras da empresa, e o currículo é anexado ou lido para preencher partes do perfil. Campos incoerentes com o currículo chamam atenção.",
      },
      {
        title: "Perguntas de pré-triagem",
        description:
          "A empresa pode configurar perguntas por vaga, como certificações, idiomas ou disponibilidade, que o recrutador usa para reduzir o grupo de candidatos.",
      },
      {
        title: "Processo e conformidade",
        description:
          "As candidaturas passam por etapas definidas, com registro de cada uma; datas e cargos completos e consistentes ajudam sua trajetória a se sustentar na análise.",
      },
    ],
    eliminationFactors: [
      "Datas de emprego ausentes, sobrepostas ou diferentes entre formulário e currículo.",
      "Cargos e responsabilidades que não se ligam claramente aos requisitos da vaga.",
      "Formatação decorativa que esconde texto do leitor ou quebra a ordem da trajetória.",
    ],
    howGriffoWorkHelps: [
      "Confere se datas, cargos e seções ficam consistentes entre currículo e formulário.",
      "Compara sua experiência com os requisitos listados na vaga.",
      "Avalia clareza e impacto mensurável para a triagem de grandes empresas.",
      "Gera uma carta de apresentação direcionada à vaga.",
    ],
    faqs: [
      {
        question: "Meu currículo deve ser idêntico ao formulário?",
        answer:
          "Sim. O recrutador vê os dois, e diferenças de datas, cargos ou empresas geram dúvida. Mantenha os dois coerentes.",
      },
      {
        question: "O SuccessFactors só é usado por empresas enormes?",
        answer:
          "É mais comum em grandes organizações, por isso os processos tendem a ser formais e bem documentados. Empresas menores o usam com menos frequência.",
      },
    ],
  },
  workable: {
    marketName: "Empresas em Crescimento e de Médio Porte no Mundo Todo",
    description:
      "O Workable é uma plataforma de recrutamento usada por empresas em crescimento e de médio porte para divulgar vagas em vários sites, receber candidaturas em um só lugar e ranquear candidatos. Ele lê cada currículo em um perfil e oferece ferramentas com IA que ajudam o recrutador a montar a lista final.",
    marketShare: "Popular entre pequenas e médias empresas que contratam internacionalmente.",
    howItWorks: [
      {
        title: "Leitura do currículo",
        description:
          "O Workable extrai experiência, formação e competências do arquivo enviado. Texto que ele não consegue ler, como conteúdo dentro de imagens, se perde do perfil.",
      },
      {
        title: "Perguntas de triagem",
        description:
          "As empresas costumam incluir perguntas na candidatura, e as respostas ajudam o recrutador a separar candidatos rapidamente.",
      },
      {
        title: "Seleção com apoio de IA",
        description:
          "A plataforma oferece recursos que ajudam o recrutador a ranquear e selecionar candidatos para a vaga, então as competências e termos do seu currículo importam.",
      },
    ],
    eliminationFactors: [
      "Informação dentro de imagens, gráficos ou barras de habilidade que o sistema não consegue ler.",
      "Um perfil que nunca cita as ferramentas e competências pedidas na vaga.",
      "Documentos muito longos que escondem a experiência mais relevante.",
    ],
    howGriffoWorkHelps: [
      "Verifica se seu currículo é legível como texto simples, sem conteúdo escondido.",
      "Encontra competências e termos da vaga que seu currículo não menciona.",
      "Avalia se sua experiência mais relevante é fácil de encontrar.",
      "Gera uma carta de apresentação direcionada à vaga.",
    ],
    faqs: [
      {
        question: "O Workable usa IA para ranquear currículos?",
        answer:
          "Ele oferece recursos com IA que as empresas podem usar na seleção. O quanto dependem deles é escolha de cada empresa, então escreva para um leitor automático e para uma pessoa.",
      },
      {
        question: "Preciso usar as palavras-chave da vaga?",
        answer:
          "Sim, quando forem verdadeiras. Usar os mesmos termos do anúncio facilita encontrar e comparar sua experiência.",
      },
    ],
  },
  oraclerecruiting: {
    marketName: "Grandes Empresas e Empregadores Globais",
    description:
      "O Oracle Recruiting é o módulo de recrutamento da suíte de RH em nuvem da Oracle, usado por grandes empresas para manter site de carreiras, receber candidaturas e gerenciar candidatos. É o equivalente em nuvem do Taleo dentro da família Oracle HCM e monta o perfil do candidato a partir do currículo e das respostas da candidatura.",
    marketShare: "Escolha comum em grandes empresas que já usam Oracle para RH.",
    howItWorks: [
      {
        title: "Site de carreiras e perfil do candidato",
        description:
          "O candidato se inscreve pelo site de carreiras da empresa. O currículo e as respostas do formulário se juntam em um único perfil que o recrutador busca e filtra.",
      },
      {
        title: "Questionários e pré-triagem",
        description:
          "A empresa pode anexar perguntas a uma vaga, como certificações, idiomas ou disponibilidade, e usar as respostas para reduzir o grupo de candidatos.",
      },
      {
        title: "Avaliação estruturada",
        description:
          "Recrutadores e gestores avaliam candidatos em etapas definidas, então datas e cargos consistentes e resultados claros ajudam seu perfil a se sustentar.",
      },
    ],
    eliminationFactors: [
      "Layouts que quebram a ordem em que o sistema lê sua trajetória.",
      "Datas ou cargos diferentes entre o currículo e o formulário da candidatura.",
      "Experiência que não se liga com clareza aos requisitos da vaga.",
    ],
    howGriffoWorkHelps: [
      "Verifica se seu currículo é lido como texto limpo e na ordem correta.",
      "Mantém datas, cargos e seções consistentes entre currículo e formulário.",
      "Compara sua experiência com os requisitos da descrição da vaga.",
      "Gera uma carta de apresentação direcionada à vaga.",
    ],
    faqs: [
      {
        question: "O Oracle Recruiting é o mesmo que o Taleo?",
        answer:
          "Não. O Taleo é o produto de recrutamento mais antigo da Oracle, enquanto o Oracle Recruiting é o módulo mais novo da suíte de RH em nuvem. Empresas podem usar qualquer um, então os mesmos bons hábitos valem para os dois.",
      },
      {
        question: "O currículo deve bater com as respostas da candidatura?",
        answer:
          "Sim. O recrutador vê os dois, e diferenças de datas, cargos ou empresas geram dúvida. Mantenha tudo coerente.",
      },
    ],
  },
  breezyhr: {
    marketName: "Pequenas Empresas e Equipes em Crescimento",
    description:
      "O Breezy HR é um sistema de acompanhamento de candidatos para pequenas empresas e equipes em crescimento. Ele publica vagas em vários sites, reúne as candidaturas em um só lugar e mostra os candidatos em um funil visual, com ferramentas que ajudam o recrutador a pontuar e comparar.",
    marketShare: "Popular entre pequenas empresas e equipes de recrutamento enxutas.",
    howItWorks: [
      {
        title: "Leitura do currículo",
        description:
          "O Breezy lê o currículo enviado e preenche um perfil do candidato. O que ele não consegue ler como texto, como texto dentro de imagens, se perde desse perfil.",
      },
      {
        title: "Questionários",
        description:
          "A empresa pode incluir perguntas na candidatura, e as respostas ajudam a separar candidatos rapidamente.",
      },
      {
        title: "Pontuação e funil",
        description:
          "Recrutadores avaliam candidatos e os movem entre etapas do funil, então um perfil fácil de avaliar em poucos segundos leva vantagem.",
      },
    ],
    eliminationFactors: [
      "Informação em imagens, gráficos ou barras de habilidade que o sistema não consegue ler.",
      "Um perfil que nunca cita as competências e ferramentas pedidas na vaga.",
      "Documentos longos demais que escondem a experiência mais relevante.",
    ],
    howGriffoWorkHelps: [
      "Verifica se seu currículo é legível como texto simples, sem nada escondido.",
      "Encontra competências e termos da vaga que seu currículo não menciona.",
      "Avalia se sua experiência mais relevante é fácil de encontrar.",
      "Gera uma carta de apresentação direcionada à vaga.",
    ],
    faqs: [
      {
        question: "O Breezy HR ranqueia candidatos automaticamente?",
        answer:
          "Ele oferece ferramentas de pontuação que o recrutador pode usar junto com o próprio julgamento. O peso que dá a elas é escolha de cada empresa, então escreva para um leitor automático e para uma pessoa.",
      },
      {
        question: "Preciso usar exatamente as palavras da vaga?",
        answer:
          "Use quando forem verdadeiras. Os mesmos termos do anúncio facilitam encontrar e comparar sua experiência.",
      },
    ],
  },
}
