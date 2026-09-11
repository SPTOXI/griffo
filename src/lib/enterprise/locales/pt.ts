import type { EnterpriseLocale } from '../content-types'

export const pt: EnterpriseLocale = {
  breadcrumbHome: 'Início',
  landing: {
    metaTitle: 'Griffo Enterprise — Match de Currículo por IA para Times de Recrutamento',
    metaDescription:
      'Encontre o candidato certo — interno ou externo — com o mesmo motor de compatibilidade por IA por trás do GriffoWork. Feito para recrutadores e RH que decidem contratação e mobilidade interna.',
    keywords: [
      'griffo enterprise',
      'match de currículo por ia para recrutadores',
      'software de compatibilidade candidato-vaga',
      'software de mobilidade interna',
      'ia para recrutamento externo',
      'hr tech com ia',
    ],
    eyebrow: 'Griffo Enterprise',
    title: 'Encontre o candidato certo — interno ou externo',
    subtitle:
      'O Griffo Enterprise roda o mesmo motor de compatibilidade currículo×vaga por IA do GriffoWork sobre a base da sua empresa — varrendo primeiro o time interno, depois os candidatos cadastrados, antes de alcançar o pool geral do Griffo. Cada sugestão mostra exatamente de onde veio.',
    useCases: [
      {
        title: 'Recrutamento externo',
        body: 'Pontue automaticamente cada candidato contra a vaga, com ranking e explicação — não apenas correspondência de palavra-chave.',
      },
      {
        title: 'Mobilidade interna',
        body: 'Encontre funcionários que já se encaixam numa vaga nova antes de olhar para fora — usando o perfil que eles já mantêm no Griffo.',
      },
    ],
    ctaLabel: 'Falar com vendas',
    faqs: [
      {
        question: 'O que é matching de currículo por IA?',
        answer:
          'É o mesmo motor de compatibilidade por trás do GriffoWork, aplicado ao seu pipeline de contratação: um modelo de IA lê o perfil profissional de um candidato e a vaga, e pontua o quanto eles se encaixam nas dimensões de experiência profissional, requisitos específicos da vaga e contexto — em vez de só checar palavra-chave.',
      },
      {
        question: 'Como se mede a compatibilidade entre candidato e vaga?',
        answer:
          'Cada match é decomposto nas mesmas dimensões que o GriffoWork já usa com candidatos — histórico profissional, aderência à vaga específica e adequação contextual — para o recrutador ver não só o score, mas o porquê dele.',
      },
      {
        question: 'Qual a diferença entre recrutamento externo e mobilidade interna aqui?',
        answer:
          'O mesmo motor de match, com fonte de candidato diferente. Recrutamento externo pontua quem se candidata à vaga de fora da empresa. Mobilidade interna pontua os próprios funcionários — com consentimento deles — contra vagas novas antes de olhar para fora.',
      },
      {
        question: 'O Griffo Enterprise substitui o nosso ATS atual?',
        answer:
          'Não — ele roda a camada de matching e pontuação em cima das candidaturas, sejam elas recebidas pelas suas próprias vagas ou por um pipeline já existente. Foi feito para conviver com o jeito que você já rastreia candidatos, não para substituir esse sistema.',
      },
      {
        question: 'Como os dados do funcionário são tratados na mobilidade interna?',
        answer:
          'O perfil do funcionário só é usado para match interno depois que ele opta explicitamente por isso naquela empresa específica — um consentimento separado de qualquer visibilidade pública como candidato, e escopado a uma organização por vez.',
      },
    ],
  },
  externalRecruitment: {
    metaTitle: 'Match de Candidatos por IA para Recrutamento Externo | Griffo Enterprise',
    metaDescription:
      'Pontue e ranqueie automaticamente cada candidato com o motor de compatibilidade por IA do Griffo Enterprise — feito para times que recrutam externamente.',
    keywords: [
      'ia para recrutamento externo',
      'software de ranking de candidatos',
      'ats com inteligência artificial',
      'triagem de currículo por ia',
      'software de match de vagas para recrutadores',
    ],
    eyebrow: 'Recrutamento Externo',
    title: 'Ranqueie cada candidato pela real aderência, não por palavra-chave',
    subtitle:
      'O Griffo Enterprise pontua cada candidato contra a sua vaga com o mesmo motor de compatibilidade por IA do GriffoWork — para o seu time revisar uma lista já ranqueada, em vez de uma pasta de currículos.',
    points: [
      {
        title: 'Pontuação automática em cada candidatura',
        body: 'Cada candidatura é comparada à vaga assim que chega — score de 0 a 100, explicado nas mesmas dimensões profissional, de aderência à vaga e contextual que o GriffoWork já usa com candidatos.',
      },
      {
        title: 'Uma cascata, não um pool único',
        body: 'Antes de olhar para fora, o Griffo Enterprise verifica primeiro o seu próprio time e os candidatos já cadastrados — a busca externa é a terceira fonte, não a primeira, e cada sugestão vem rotulada com a origem.',
      },
      {
        title: 'Nenhum formato de currículo novo para aprender',
        body: 'Reaproveita a mesma extração de perfil que o GriffoWork já roda para candidatos — um currículo enviado uma vez pontua contra qualquer vaga aberta.',
      },
    ],
    ctaLabel: 'Falar com vendas',
  },
  internalMobility: {
    metaTitle: 'Software de Mobilidade Interna com Match por IA | Griffo Enterprise',
    metaDescription:
      'Encontre candidatos internos para vagas novas automaticamente com o Griffo Enterprise — mobilidade interna com IA, no mesmo motor do GriffoWork.',
    keywords: [
      'software de mobilidade interna',
      'marketplace interno de talentos',
      'software de transferência interna de funcionários',
      'mobilidade interna com ia',
      'plataforma de mobilidade de talentos',
    ],
    eyebrow: 'Mobilidade Interna',
    title: 'Encontre sua próxima contratação primeiro dentro de casa',
    subtitle:
      'O Griffo Enterprise varre o seu próprio time em busca de aderência antes de você publicar uma vaga externa — usando o perfil profissional que o funcionário já mantém no Griffo, com o consentimento dele.',
    points: [
      {
        title: 'Funcionário mantém um único perfil',
        body: 'Sem segundo currículo para preencher: o perfil que o funcionário já tem no GriffoWork é o que entra no match contra as vagas internas novas.',
      },
      {
        title: 'Consentimento escopado por empresa',
        body: 'O perfil do funcionário só fica visível para match interno depois que ele opta por isso naquela organização específica — separado de qualquer visibilidade pública de candidato.',
      },
      {
        title: 'Aderência interna sempre mostrada primeiro',
        body: 'Quando uma vaga nova abre, o time interno é a primeira fonte que o agente de match verifica, antes dos candidatos cadastrados ou do pool geral do Griffo.',
      },
    ],
    ctaLabel: 'Falar com vendas',
  },
}
