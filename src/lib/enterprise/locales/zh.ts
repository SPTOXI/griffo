import type { EnterpriseLocale } from '../content-types'

export const zh: EnterpriseLocale = {
  breadcrumbHome: '首页',
  landing: {
    metaTitle: 'Griffo Enterprise — 面向招聘团队的AI简历职位匹配',
    metaDescription:
      '借助与GriffoWork同源的AI兼容性引擎，找到合适的候选人——无论是内部还是外部。专为负责招聘与内部流动决策的招聘人员和人力资源团队而打造。',
    keywords: [
      'griffo enterprise',
      '面向招聘人员的ai简历匹配',
      '候选人职位匹配软件',
      '内部流动软件',
      '外部招聘ai',
      'ai人力资源科技',
    ],
    eyebrow: 'Griffo Enterprise',
    title: '找到合适的候选人——无论内部还是外部',
    subtitle:
      'Griffo Enterprise 在贵公司自己的招聘流程上运行与 GriffoWork 相同的简历×职位 AI 兼容性引擎——先扫描内部团队，再查看已登记的应聘者，最后才触及更广泛的 Griffo 候选人库。每一条匹配结果都清楚标注其来源。',
    useCases: [
      {
        title: '外部招聘',
        body: '自动为每位应聘者与职位打分、排序并给出解释——而不仅仅是关键词匹配。',
      },
      {
        title: '内部流动',
        body: '在向外寻找之前，先发现已经适合新职位的员工——依据他们已在 Griffo 上维护的档案。',
      },
    ],
    ctaLabel: '联系销售',
    faqs: [
      {
        question: '什么是AI简历职位匹配？',
        answer:
          '这是与 GriffoWork 相同的兼容性引擎，应用于贵公司的招聘流程：AI模型读取候选人的职业档案和职位需求，依据职业经验、职位特定要求和背景情境进行匹配打分——而不仅仅是关键词是否一致。',
      },
      {
        question: '候选人与职位的匹配度是如何衡量的？',
        answer:
          '每次匹配都会按照 GriffoWork 已用于候选人的相同维度进行拆解——职业背景、与具体职位的契合度、情境适配度——让招聘人员看到的不只是分数,还有得分的原因。',
      },
      {
        question: '这里的外部招聘和内部流动有什么区别？',
        answer:
          '匹配引擎相同，但候选人来源不同。外部招聘为从公司外部申请职位的人打分。内部流动则在向外寻找之前，先经员工本人同意，为贵公司自己的员工与新职位打分。',
      },
      {
        question: 'Griffo Enterprise 会取代我们现有的招聘管理系统吗？',
        answer:
          '不会——无论申请来自贵公司自己发布的职位还是现有的招聘流程，它都在申请之上运行匹配和打分层。它的设计是与您现有的候选人跟踪方式共存，而不是取代该系统。',
      },
      {
        question: '内部流动中员工数据是如何处理的？',
        answer:
          '员工档案只有在其本人针对该特定公司明确同意后，才会用于内部匹配——这是与候选人公开可见性完全分开的同意机制，且每次仅限于一个组织。',
      },
    ],
  },
  externalRecruitment: {
    metaTitle: '面向外部招聘的AI候选人匹配 | Griffo Enterprise',
    metaDescription:
      '借助 Griffo Enterprise 的AI简历职位匹配引擎，自动为每位应聘者打分和排序——专为负责外部招聘的团队打造。',
    keywords: [
      '外部招聘ai',
      '候选人排名软件',
      'ai招聘管理系统',
      'ai简历筛选',
      '面向招聘人员的职位匹配软件',
    ],
    eyebrow: '外部招聘',
    title: '按真实匹配度而非关键词为每位候选人排序',
    subtitle:
      'Griffo Enterprise 使用与 GriffoWork 相同的AI兼容性引擎，为每位候选人与贵公司的职位需求打分——您的团队看到的是一份已排序的候选人名单，而不是一堆简历。',
    points: [
      {
        title: '每次投递自动打分',
        body: '每份申请在收到的瞬间就会与职位需求进行比对——0至100分的匹配分数，依据 GriffoWork 已用于候选人的相同专业维度、职位契合维度和情境维度给出解释。',
      },
      {
        title: '级联匹配，而非单一候选池',
        body: '在向外寻找之前，Griffo Enterprise 会先检查贵公司自己的团队和已登记的应聘者——外部搜索是第三来源，而非第一来源，每条建议都标明其来源。',
      },
      {
        title: '无需学习新的简历格式',
        body: '复用 GriffoWork 已为候选人运行的相同档案提取流程——一份简历只需上传一次，即可与所有开放职位进行匹配打分。',
      },
    ],
    ctaLabel: '联系销售',
  },
  internalMobility: {
    metaTitle: 'AI驱动的内部流动软件 | Griffo Enterprise',
    metaDescription:
      '借助 Griffo Enterprise 自动为新职位发现内部候选人——基于与 GriffoWork 相同引擎的AI驱动内部流动。',
    keywords: [
      '内部流动软件',
      '内部人才市场',
      '员工内部调动软件',
      'ai内部流动',
      '人才流动平台',
    ],
    eyebrow: '内部流动',
    title: '优先在公司内部找到您的下一位人选',
    subtitle:
      '在您对外发布职位之前，Griffo Enterprise 会先在贵公司团队内部寻找合适人选——依据员工已在 Griffo 上维护、并经其本人同意的职业档案。',
    points: [
      {
        title: '员工只需维护一份档案',
        body: '无需再填写第二份简历：员工在 GriffoWork 上已有的档案将直接用于与新的内部职位进行匹配。',
      },
      {
        title: '按公司范围授权的同意机制',
        body: '只有当员工针对某个特定组织明确同意后，其档案才会对该组织的内部匹配可见——与作为候选人的公开可见性完全分开。',
      },
      {
        title: '内部匹配结果始终优先展示',
        body: '每当有新职位开放，匹配代理首先检查的来源是内部团队，其次才是已登记的应聘者或更广泛的 Griffo 候选人库。',
      },
    ],
    ctaLabel: '联系销售',
  },
}
