import type { PrivacyContent } from '../content-types'

export const pt: PrivacyContent = {
  metaTitle: 'Política de Privacidade — GriffoWork',
  metaDescription:
    'Como o GriffoWork coleta, usa, compartilha e retém seus dados — incluindo quais provedores de IA analisam seu currículo, por quanto tempo guardamos, e como acessar, exportar ou excluir seus dados.',
  breadcrumbHome: 'Início',
  title: 'Política de Privacidade',
  lastUpdatedLabel: 'Última atualização',
  lastUpdatedValue: 'Setembro de 2026',
  intro: [
    'O GriffoWork ("nós") oferece ferramentas de inteligência de carreira: análise de currículo, pontuação de compatibilidade com ATS, reescrita de currículo e casamento de vagas (Radar). Esta página explica, em linguagem direta, quais dados coletamos para isso, quem mais os vê, por quanto tempo guardamos e que controle você tem sobre eles.',
    'GriffoWork é uma marca operacional; ainda não constituímos uma pessoa jurídica própria para ela. Até que isso mude, trate esta página como o nosso compromisso operacional, não como uma declaração corporativa formal — vamos atualizá-la assim que isso mudar.',
  ],

  dataWeCollectHeading: 'O que coletamos',
  dataCategories: [
    {
      title: 'Dados da conta',
      body: 'E-mail e senha (guardada com hash, nunca em texto puro) quando você cria uma conta.',
    },
    {
      title: 'Currículo e informações profissionais',
      body: 'O conteúdo do currículo que você envia ou cola, a vaga/descrição de vaga alvo que você informa, e os detalhes de perfil profissional que você preencher (competências, experiência, formação).',
    },
    {
      title: 'Links de perfis sociais (opcional)',
      body: 'LinkedIn, GitHub, portfólio ou links semelhantes que você decidir adicionar, e só quando você opta por tê-los analisados.',
    },
    {
      title: 'Dados de pagamento',
      body: 'Nunca vemos nem guardamos o número completo do seu cartão. Os pagamentos são processados pela Stripe, nossa processadora de pagamentos; guardamos só o registro da transação necessário para recibo e suporte.',
    },
    {
      title: 'Dados de uso',
      body: 'Eventos básicos do produto (como visualização de página e etapas da compra) e um país aproximado derivado da sua conexão de rede, usados para entender o uso do produto e mostrar a moeda certa.',
    },
    {
      title: 'Preferência de idioma',
      body: 'O idioma da interface que você escolhe, guardado para o site lembrar na sua próxima visita.',
    },
  ],

  howWeUseHeading: 'Para que usamos',
  howWeUseItems: [
    'Analisar seu currículo e gerar a auditoria, a pontuação e as sugestões de reescrita que você solicita.',
    'Comparar seu perfil com vagas abertas para a funcionalidade Radar, quando você a ativa.',
    'Processar pagamentos e prestar suporte de conta.',
    'Enviar os e-mails que você solicitou (resultado da análise, alertas do Radar) e, quando aplicável, permitir que você cancele os não essenciais.',
    'Entender o uso agregado do produto para melhorar o serviço.',
    'Cumprir obrigações legais e contábeis ligadas a pagamentos.',
  ],

  sharingHeading: 'Com quem compartilhamos',
  sharingIntro:
    'Não vendemos seus dados. Compartilhamos só com os provedores de serviço ("operadores") necessários para o GriffoWork funcionar, cada um agindo sob nossas instruções:',
  subProcessors: [
    {
      name: 'Provedores de IA (Anthropic, OpenAI, Google, DeepSeek, Moonshot AI)',
      purpose:
        'O conteúdo do seu currículo é enviado a um destes provedores para gerar a análise, a pontuação ou a reescrita que você solicita. O provedor usado numa requisição específica pode variar; veja "Transferências internacionais" abaixo para como restringimos isso a usuários no Espaço Econômico Europeu.',
    },
    {
      name: 'Stripe',
      purpose: 'Processamento de pagamento. A Stripe recebe seus dados de pagamento diretamente; não guardamos o número do seu cartão.',
    },
    {
      name: 'Resend',
      purpose: 'Envio de e-mail transacional (resultado da análise, alertas do Radar, avisos de conta).',
    },
    {
      name: 'Vercel e Supabase',
      purpose: 'Hospedagem da aplicação e infraestrutura de banco de dados.',
    },
  ],

  transfersHeading: 'Transferências internacionais',
  transfersBody: [
    'Alguns dos nossos operadores atuam fora do seu país, inclusive fora do Espaço Econômico Europeu (EEE). Para usuários que identificamos como estando no EEE, Reino Unido ou Suíça, excluímos da análise do seu currículo os provedores de IA sem decisão de adequação reconhecida para essa região (hoje, DeepSeek e Moonshot AI/Kimi) — seu conteúdo só é roteado a provedores endereçáveis sob salvaguardas compatíveis com o GDPR.',
    'Para usuários fora do EEE, todos os provedores de IA listados podem ser usados, dependendo de carga e disponibilidade do sistema.',
  ],

  retentionHeading: 'Por quanto tempo guardamos seus dados',
  retentionIntro:
    'Guardamos dados só pelo tempo que serve à finalidade da coleta, ou pelo tempo exigido por lei:',
  retentionRows: [
    { category: 'Currículos em conta ativa', period: 'Enquanto sua conta estiver ativa' },
    { category: 'Currículos em conta inativa', period: 'Até 730 dias após sua última atividade, depois excluídos' },
    { category: 'Logs de processamento por IA (métricas operacionais, já sem o conteúdo do currículo)', period: 'Até 365 dias' },
    { category: 'Trilha de auditoria (registro de conformidade e segurança)', period: 'Até 730 dias' },
    { category: 'Registros de pagamento/webhook', period: 'Até 90 dias' },
    { category: 'Histórico de ofertas do Radar (vagas que o Radar te mostrou)', period: 'Até 730 dias' },
  ],

  rightsHeading: 'Seus direitos e escolhas',
  rightsIntro:
    'Onde quer que você esteja, oferecemos estes controles direto na sua conta (Configurações), sem precisar nos escrever primeiro:',
  rights: [
    {
      title: 'Exportar seus dados',
      body: 'Baixe uma cópia dos seus currículos, histórico de análises, transações e atividade da conta.',
    },
    {
      title: 'Excluir sua conta',
      body: 'Exclua permanentemente sua conta e os dados pessoais associados. Esta ação é irreversível.',
    },
    {
      title: 'Corrigir suas informações',
      body: 'Edite seu currículo, perfil e dados da conta a qualquer momento.',
    },
    {
      title: 'Cancelar e-mails não essenciais',
      body: 'Cancele alertas do Radar e outras notificações não essenciais pela sua conta ou pelo link no próprio e-mail.',
    },
  ],

  cookiesHeading: 'Cookies e armazenamento local',
  cookiesBody: [
    'Usamos um cookie de sessão para manter você conectado, e um cookie de preferência/entrada de armazenamento local para lembrar o idioma da interface escolhido. Não usamos rastreadores de publicidade de terceiros.',
  ],

  securityHeading: 'Segurança',
  securityBody: [
    'Usamos medidas padrão da indústria, como conexões criptografadas (HTTPS), senhas com hash e controle de acesso no nosso banco de dados, para proteger seus dados. Nenhum sistema é completamente imune a risco, e não podemos garantir segurança absoluta — mas tratamos o conteúdo do currículo como dado pessoal sensível e desenhamos nossos processos para minimizar quem e o quê pode acessá-lo.',
  ],

  childrenHeading: 'Privacidade de menores',
  childrenBody:
    'O GriffoWork é voltado a profissionais e candidatos em busca de emprego, e não é direcionado a menores de 16 anos. Não coletamos intencionalmente dados de crianças.',

  changesHeading: 'Mudanças nesta política',
  changesBody:
    'Podemos atualizar esta página conforme o produto ou nossos provedores mudarem. Mudanças relevantes atualizam a data no topo desta página.',

  contactHeading: 'Fale conosco',
  contactBody: 'Para qualquer dúvida sobre esta política ou seus dados, escreva para {email}.',
}
