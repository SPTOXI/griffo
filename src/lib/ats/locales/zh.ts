import type { AtsLocale } from '../content-types'

/** Guias de ATS em chinês simplificado: só os 5 globais. */
export const atsZh: AtsLocale = {
  workday: {
    marketName: '美国、欧洲及全球跨国企业',
    description:
      'Workday 是绝大多数《财富》500 强企业与大型跨国公司采用的标准人力资源系统，以业内最严格、最标准化的简历解析器之一著称。',
    marketShare: '超过 50% 的《财富》500 强企业在使用。',
    howItWorks: [
      {
        title: '结构化字段映射',
        description:
          'Workday 会把简历拆分为预设字段：公司、职位、任职时间与工作职责。任何格式偏差都会导致信息在筛选阶段丢失。',
      },
      {
        title: '按国际合规标准筛选',
        description:
          '依据各国劳动合规要求过滤申请，并要求职业发展路径与职级层次清晰可辨。',
      },
      {
        title: '量化成果与岗位要求比对',
        description:
          '系统优先考虑那些展示了可衡量成果、且与招聘要求中所列能力相匹配的候选人。',
      },
    ],
    eliminationFactors: [
      '非常规的排版格式，导致字段自动填充失效。',
      '日期与任职区间前后矛盾，系统无法计算工作年限。',
      '职位名称无法对应国际通行的岗位标准。',
    ],
    howGriffoWorkHelps: [
      '确保 Workday 解析器能够准确读取您简历的层级结构。',
      '核查简历是否符合国际招聘标准（美国、欧洲及全球）。',
      '对照系统的企业级筛选标准，评估量化成果的密度。',
      '生成针对该岗位定制的求职信。',
    ],
    faqs: [
      {
        question: '为什么 Workday 的筛选如此严格？',
        answer:
          '跨国企业单个岗位往往收到数千份申请，因此 Workday 采用结构化标准，会淘汰排版混乱或信息无法归类的简历。',
      },
      {
        question: 'GriffoWork 如何帮我准备 Workday 的申请？',
        answer:
          'GriffoWork 会检查时间线的清晰度、排版格式与量化成果的呈现，确保 Workday 能完整无误地解析您的履历。',
      },
    ],
  },
  greenhouse: {
    marketName: '全球科技、初创与高成长企业',
    description:
      'Greenhouse 是全球科技生态、高速成长初创公司与独角兽企业中使用最广泛的招聘平台，强调以能力和实证为依据的招聘方式。',
    marketShare: '在美国、欧洲及拉美的科技与创新企业中占据领先地位。',
    howItWorks: [
      {
        title: '能力评分卡',
        description: '依据技术能力、工具掌握与领导力的专项评分卡对候选人打分。',
      },
      {
        title: '作品集与主页联动',
        description:
          '将简历信息与职业链接（LinkedIn、GitHub、作品集）关联，供技术团队评估。',
      },
    ],
    eliminationFactors: [
      '内容笼统，无法证明对相关工具与框架的实际掌握程度。',
      '过往经历中缺少具体成果。',
      '项目与业务影响之间缺乏清晰关联。',
    ],
    howGriffoWorkHelps: [
      '量化您的技术能力与目标岗位要求之间的匹配程度。',
      '核查您的职业主页与简历内容是否一致。',
      '按照招聘方评分卡的标准，为影响力与表达清晰度打分。',
    ],
    faqs: [
      {
        question: '为什么 Greenhouse 在科技行业如此普及？',
        answer:
          '因为它让研发与产品团队能够以结构化、协作的方式评估能力，从而降低初筛环节的主观偏差。',
      },
      {
        question: 'GriffoWork 支持 Greenhouse 上的海外远程岗位吗？',
        answer: '支持。GriffoWork 会根据全球招聘流程与各地要求调整诊断结果。',
      },
    ],
  },
  lever: {
    marketName: '高成长企业与头部科技公司',
    description:
      'Lever 将申请人跟踪（ATS）与人才关系管理（CRM）结合，使招聘团队能够持续从自有人才库中挖掘并评估候选人。',
    marketShare: '在中大型科技企业中广泛采用。',
    howItWorks: [
      {
        title: '人才数据持续索引',
        description: '完整保存并索引候选人履历，用于匹配当前及未来的职位空缺。',
      },
      {
        title: '技能语义检索',
        description:
          '招聘方可通过工具、职位、教育背景等维度进行细致的语义检索来筛选候选人。',
      },
    ],
    eliminationFactors: [
      '缺少专业术语，导致系统在主题检索中始终无法找到该档案。',
      '描述含糊，无法体现知识掌握的深度。',
    ],
    howGriffoWorkHelps: [
      '确保关键策略词汇齐备，使您的简历能在 Lever 的检索中被找到。',
      '优化职业定位，让档案在人才库中长期保持竞争力。',
    ],
    faqs: [
      {
        question: 'Lever 的人才库是如何运作的？',
        answer:
          'Lever 会保留可检索的历史档案。相关术语密度较高的简历，在新职位开放时仍会被反复检索到。',
      },
    ],
  },
  taleo: {
    marketName: '银行、政府机构与大型企业',
    description:
      'Oracle Taleo 是全球最成熟的企业招聘系统之一，广泛应用于金融、油气、电信及公共部门。',
    marketShare: '在传统大型企业与全球金融机构中占有稳固地位。',
    howItWorks: [
      {
        title: '传统筛选规则',
        description: '依据正式职位名称、任职年限与学历层次，套用结构化的筛选规则。',
      },
    ],
    eliminationFactors: [
      '非常规的板块标题，旧版解析器无法归类。',
      '破坏信息层级结构的图形元素。',
    ],
    howGriffoWorkHelps: [
      '检测简历的正式结构与 Taleo 解析器的兼容性。',
      '核对传统大型企业所要求的日期、职位与板块书写规范。',
    ],
    faqs: [
      {
        question: 'Oracle Taleo 现在还在广泛使用吗？',
        answer:
          '是的，尤其在大型银行、工业集团以及在全球管理数千名员工的企业中仍在持续使用。',
      },
    ],
  },
  ashby: {
    marketName: '全球初创与 AI 高成长企业',
    description:
      'Ashby 是一个在创新科技与人工智能企业中快速普及的新一代招聘平台，围绕智能自动化与数据分析构建。',
    marketShare: '在科技与 AI 高成长企业中增长迅速。',
    howItWorks: [
      {
        title: '快速初筛与 AI 摘要',
        description: '生成分析式摘要，帮助招聘方快速判断候选人的影响力与职级水平。',
      },
    ],
    eliminationFactors: [
      '篇幅冗长、重点不清，导致核心技术成果被淹没。',
    ],
    howGriffoWorkHelps: [
      '检测简历摘要是否易于快速阅读且具备说服力。',
      '针对 Ashby 的筛选逻辑，突出复杂项目与技术领导经验。',
    ],
    faqs: [
      {
        question: 'Ashby 与其他系统有何不同？',
        answer:
          'Ashby 提供分析看板与自动摘要功能，更青睐简洁、以成果为导向的简历。',
      },
    ],
  },
}
