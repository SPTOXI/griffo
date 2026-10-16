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
    description: 'A Gupy é uma plataforma de recrutamento e seleção usada por empresas no Brasil. Segundo a própria Gupy, seus agentes de IA organizam as candidaturas de cada vaga em uma lista ordenada por afinidade para a equipe de recrutamento; eles apoiam o processo e a decisão final é humana.',
    marketShare: 'Plataforma usada por empresas no Brasil para publicar vagas e conduzir processos seletivos.',
    howItWorks: [
      { title: 'Leitura do seu perfil', description: 'Segundo a Gupy, os agentes de IA analisam o seu perfil na plataforma, em especial os campos Habilidades e Experiências, e o comparam com o que a vaga pede. Vale preencher o perfil com o mesmo cuidado que o currículo.' },
      { title: 'Ordenação por afinidade', description: 'Os agentes leem a descrição da vaga, identificam requisitos e habilidades e organizam uma lista para a pessoa recrutadora, priorizando quem parece mais alinhado a ela.' },
      { title: 'Decisão humana', description: 'A Gupy afirma que os agentes não contratam sozinhos: depois da ordenação, a avaliação segue com pessoas recrutadoras e lideranças, e respostas abertas e subjetivas tendem a ser avaliadas por pessoas.' },
      { title: 'O que a IA é projetada para ignorar', description: 'Segundo a Gupy, os agentes ignoram informações sensíveis, como gênero, cor/raça, orientação sexual, local de origem, nome, idade, CPF e telefone.' },
    ],
    eliminationFactors: [
      'Perfil com Habilidades e Experiências incompletos ou desatualizados, que são os campos que a Gupy diz analisar.',
      'Descrições vagas, sem dizer o que você fez e com qual resultado; a própria Gupy recomenda objetividade e números.',
      'Pouca aderência aos requisitos que a vaga lista; a Gupy orienta ler a vaga como um checklist.',
    ],
    howGriffoWorkHelps: [
      'Compara seu currículo com a descrição da vaga e aponta competências e termos que estão faltando.',
      'Verifica se o texto do currículo é lido de forma limpa e na ordem certa por leitores automáticos.',
      'Avalia clareza, objetividade e métricas nas suas experiências, que é o que a Gupy recomenda.',
      'Gera uma carta de apresentação direcionada à vaga.',
    ],
    faqs: [
      { question: 'A Gupy usa inteligência artificial na triagem?', answer: 'Sim. A Gupy descreve agentes de IA que analisam o perfil (Habilidades e Experiências), comparam com os requisitos da vaga e organizam uma lista ordenada para a equipe de recrutamento. Segundo a própria Gupy, eles apoiam o processo e a decisão final é humana.' },
      { question: 'A Gupy descarta currículos automaticamente?', answer: 'Segundo a Gupy, a IA ordena as pessoas candidatas por afinidade e não contrata sozinha; a avaliação segue com pessoas recrutadoras. Cada empresa define as etapas do seu processo, então o que acontece depois da ordenação depende da vaga.' },
      { question: 'Como aumentar minhas chances na Gupy?', answer: 'A Gupy orienta ler a vaga como um checklist, ser objetivo, quantificar conquistas e manter o perfil atualizado. Preencher bem Habilidades e Experiências é o ponto central.' },
      { question: 'O GriffoWork ajuda em processos na Gupy?', answer: 'O GriffoWork avalia seu currículo antes do envio, apontando termos ausentes, clareza e leitura do texto, para você se candidatar com um documento alinhado à vaga. Não temos acesso ao algoritmo da Gupy e não prometemos posição em nenhuma lista.' },
    ],
  },
  workday: {
    marketName: "Grandes Empresas e Organizações Globais",
    description:
      "O Workday é uma plataforma corporativa de RH e finanças. O software de aquisição de talentos ajuda grandes empresas a gerenciar vagas, candidaturas e candidatos.",
    marketShare: "A Workday informa uso por mais de 60% das empresas da Fortune 500.",
    howItWorks: [
      {
        title: "Perfil do candidato",
        description:
          "As candidaturas viram um perfil com informações como empresa, cargo, datas e responsabilidades. Entradas claras e consistentes facilitam a leitura e a comparação desse perfil.",
      },
      {
        title: "Requisitos da vaga",
        description:
          "Recrutadores comparam candidatos com os requisitos da vaga, então ter evidência das competências pedidas e resultados mensuráveis ajuda.",
      },
    ],
    eliminationFactors: [
      "Layouts que dificultam a leitura de cargos e datas como texto.",
      "Datas ausentes ou inconsistentes, que deixam o tempo de atuação pouco claro.",
      "Cargos e competências que nunca repetem a linguagem da vaga.",
    ],
    howGriffoWorkHelps: [
      "Verifica se o currículo é lido como texto limpo, com cargos e datas em ordem.",
      "Compara sua experiência com os requisitos da descrição da vaga.",
      "Avalia clareza e resultados mensuráveis.",
      "Gera uma carta de apresentação direcionada à vaga.",
    ],
    faqs: [
      {
        question: "O Workday rejeita currículos automaticamente?",
        answer:
          "Depende de como cada empresa configurou o processo; o Workday apoia os recrutadores na gestão e na análise dos candidatos. Cargos, datas e resultados claros deixam seu perfil mais fácil de ler por pessoas e por sistemas.",
      },
      {
        question: "Como o GriffoWork prepara meu perfil para o Workday?",
        answer:
          "O GriffoWork revisa a clareza cronológica, a formatação e os resultados mensuráveis, para que seu histórico seja lido sem ruído.",
      },
    ],
  },
  greenhouse: {
    marketName: "Empresas que Contratam com Processos Estruturados",
    description:
      "O Greenhouse é uma plataforma de contratação que reúne busca de talentos, entrevistas e acompanhamento de candidatos. É construída em torno de entrevistas estruturadas, com perguntas e critérios definidos por cada equipe.",
    marketShare: "A Greenhouse informa que milhares de empresas usam a plataforma.",
    howItWorks: [
      {
        title: "Avaliação estruturada",
        description:
          "As equipes definem perguntas e fichas de avaliação para cada vaga, e os entrevistadores avaliam os candidatos pelos mesmos critérios.",
      },
      {
        title: "Contexto do currículo e do perfil",
        description:
          "Seu currículo e os links que você compartilha, como portfólio ou LinkedIn, dão contexto à equipe antes das entrevistas.",
      },
    ],
    eliminationFactors: [
      "Currículos genéricos que não mostram uso prático das ferramentas que a vaga pede.",
      "Falta de resultados concretos em funções anteriores.",
      "Falta de ligação clara entre projetos e impacto no negócio.",
    ],
    howGriffoWorkHelps: [
      "Mapeia o quanto suas competências e métodos combinam com a vaga.",
      "Verifica se seus perfis profissionais são coerentes com o currículo.",
      "Avalia impacto e clareza frente a critérios típicos de avaliação.",
    ],
    faqs: [
      {
        question: "Como o Greenhouse avalia candidatos?",
        answer:
          "O Greenhouse descreve entrevistas estruturadas em que as equipes usam suas próprias perguntas e um critério de avaliação, com fichas para registrar o retorno. Um currículo com evidência clara de cada requisito ajuda sua história a se sustentar.",
      },
      {
        question: "O GriffoWork serve para vagas remotas no Greenhouse?",
        answer:
          "O GriffoWork compara seu currículo com a descrição da vaga a que você se candidata, onde quer que ela esteja.",
      },
    ],
  },
  lever: {
    marketName: "Empresas de Vários Setores",
    description:
      "A Lever é uma plataforma de recrutamento com sistema de acompanhamento de candidatos e recursos com IA. O site destaca a automação de tarefas administrativas e de agendamento, e recomendações de IA acompanhadas de contexto.",
    marketShare: "A Lever informa atender milhares de clientes em mais de 20 setores.",
    howItWorks: [
      {
        title: "Automação",
        description:
          "Tarefas administrativas, agendamentos e retornos rodam em automação, para que a equipe de recrutamento use o tempo em decisões de contratação.",
      },
      {
        title: "Recomendações de IA",
        description:
          "A Lever diz que sua IA mostra primeiro os candidatos mais aderentes, com contexto em cada recomendação; um currículo que mostra com clareza os requisitos da vaga é mais fácil de posicionar.",
      },
    ],
    eliminationFactors: [
      "Ausência de termos da descrição da vaga, o que dificulta enxergar sua aderência.",
      "Descrições vagas que não transmitem a profundidade da sua experiência.",
    ],
    howGriffoWorkHelps: [
      "Confere se as palavras-chave que a vaga pede estão no seu currículo.",
      "Afina seu posicionamento para que sua aderência seja fácil de enxergar.",
    ],
    faqs: [
      {
        question: "A Lever usa IA para ranquear candidatos?",
        answer:
          "A Lever descreve recomendações com IA que mostram primeiro os candidatos mais aderentes, cada uma com contexto. A decisão de contratação continua com a equipe de recrutamento.",
      },
    ],
  },
  taleo: {
    marketName: "Grandes Empresas",
    description:
      "O Oracle Taleo é uma suíte de aquisição de talentos para busca, recrutamento e integração. A Oracle oferece o Taleo Enterprise Edition e o Taleo Business Edition, e também apresenta o Oracle Recruiting como caminho para clientes atuais do Taleo.",
    marketShare: "Produto consolidado da Oracle, usado por empresas para buscar e contratar talentos.",
    howItWorks: [
      {
        title: "Triagem e entrevistas",
        description:
          "A Oracle lista ferramentas de triagem de candidatos, gestão de entrevistas e criação de ofertas. Cada empresa configura o que pergunta e o que verifica.",
      },
      {
        title: "Sites de carreiras e busca de talentos",
        description:
          "Sites de carreiras com a marca da empresa, campanhas e indicações trazem candidatos ao sistema, onde os recrutadores os analisam.",
      },
    ],
    eliminationFactors: [
      "Títulos de seção pouco convencionais ou elementos gráficos que podem dificultar a leitura automática.",
      "Datas ou cargos ausentes que deixam seu histórico pouco claro.",
    ],
    howGriffoWorkHelps: [
      "Avalia a estrutura do currículo para uma leitura automática limpa.",
      "Confere convenções de datas, cargos e seções que as empresas costumam esperar.",
    ],
    faqs: [
      {
        question: "O Oracle Taleo ainda é usado?",
        answer:
          "A Oracle ainda apresenta o Taleo como produto e também oferece a migração para o Oracle Recruiting. Se uma empresa o usa é escolha dela.",
      },
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
    marketName: "De Startups a Grandes Empresas",
    description:
      "A Ashby é uma plataforma de recrutamento tudo-em-um que reúne sistema de acompanhamento de candidatos, busca de talentos e CRM, agendamento e análises, com IA integrada.",
    marketShare: "A Ashby oferece planos para startups, empresas em crescimento e grandes empresas.",
    howItWorks: [
      {
        title: "Análises e IA",
        description:
          "A Ashby combina análises de recrutamento com recursos de IA para ajudar as equipes a avaliar candidatos e conduzir o processo.",
      },
    ],
    eliminationFactors: [
      "Currículos longos e sem foco, que escondem as principais conquistas e o impacto entregue.",
    ],
    howGriffoWorkHelps: [
      "Revisa o resumo do seu currículo para uma leitura rápida e clara.",
      "Destaca projetos complexos e liderança técnica.",
    ],
    faqs: [
      {
        question: "O que diferencia a Ashby de outros sistemas?",
        answer:
          "A Ashby se apresenta como plataforma tudo-em-um: acompanhamento de candidatos, busca de talentos e CRM, agendamento e análises, com IA integrada.",
      },
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
  zohorecruit: {
    marketName: "Consultorias de Recrutamento e Empresas que Contratam no Mundo Todo",
    description:
      "O Zoho Recruit é um software de acompanhamento de candidatos e recrutamento usado tanto por equipes internas quanto por consultorias de recrutamento. Ele publica vagas em vários sites, lê currículos em fichas de candidato e permite ao recrutador buscar, etiquetar e montar listas finais.",
    marketShare: "Usado por equipes internas e consultorias de recrutamento de vários tamanhos no mundo todo.",
    howItWorks: [
      {
        title: "Leitura do currículo em ficha",
        description:
          "O sistema lê seu currículo e cria uma ficha com experiência, formação e competências. O que ele não consegue ler como texto pode faltar nessa ficha.",
      },
      {
        title: "Base de dados pesquisável",
        description:
          "Recrutadores buscam na base de candidatos por competências, cargos e palavras-chave, então os termos do seu currículo decidem se você aparece nos resultados.",
      },
      {
        title: "Lista final",
        description:
          "Recrutadores etiquetam candidatos e enviam uma lista ao cliente ou ao gestor, que vê primeiro um perfil resumido.",
      },
    ],
    eliminationFactors: [
      "Informação em imagens ou gráficos que o sistema não consegue transformar em texto.",
      "Competências e ferramentas ausentes do seu currículo que a vaga pede expressamente.",
      "Cargos ou termos diferentes de como o mercado costuma nomear a função.",
    ],
    howGriffoWorkHelps: [
      "Verifica se um leitor típico interpreta seu currículo como texto limpo.",
      "Encontra termos da vaga que seu currículo não menciona.",
      "Avalia se sua experiência mais relevante é fácil de encontrar e de incluir na lista final.",
      "Gera uma carta de apresentação direcionada à vaga.",
    ],
    faqs: [
      {
        question: "O Zoho Recruit é usado por consultorias ou por empresas?",
        answer:
          "Pelos dois. As consultorias o usam para gerenciar muitas vagas e candidatos de seus clientes, e as empresas para a própria seleção.",
      },
      {
        question: "Como os recrutadores me encontram na base de dados?",
        answer:
          "Principalmente buscando competências, cargos e palavras-chave. Use os nomes padrão das suas ferramentas e da sua função para que uma busca encontre seu currículo.",
      },
    ],
  },
}
