import type { AtsLocale } from '../content-types'

/** Guias de ATS em coreano: só os 5 globais. */
export const atsKo: AtsLocale = {
  workday: {
    marketName: "대기업 및 글로벌 조직",
    description:
      "Workday는 기업용 HR·재무 플랫폼입니다. 인재 채용 소프트웨어로 대기업이 채용 공고, 지원서, 지원자를 관리할 수 있도록 돕습니다.",
    marketShare: "Workday는 포춘 500 기업의 60% 이상이 사용한다고 밝히고 있습니다.",
    howItWorks: [
      {
        title: "지원자 프로필",
        description:
          "지원서는 회사, 직책, 기간, 담당 업무 같은 정보를 가진 프로필로 정리됩니다. 항목이 명확하고 일관되면 프로필을 읽고 비교하기 쉽습니다.",
      },
      {
        title: "채용 요건",
        description:
          "채용 담당자는 지원자를 공고의 요건과 비교하므로, 요구되는 역량의 근거와 측정 가능한 성과가 도움이 됩니다.",
      },
    ],
    eliminationFactors: [
      "직책과 기간을 텍스트로 읽기 어렵게 만드는 레이아웃.",
      "기간이 빠졌거나 일관되지 않아 경력 기간이 불명확한 경우.",
      "공고의 표현을 전혀 반영하지 않은 직책과 역량.",
    ],
    howGriffoWorkHelps: [
      "이력서가 직책과 기간이 순서대로 정리된 깨끗한 텍스트로 읽히는지 확인합니다.",
      "경력을 채용 공고의 요건과 비교합니다.",
      "명확성과 측정 가능한 성과를 점검합니다.",
      "해당 직무에 맞춘 커버레터를 작성합니다.",
    ],
    faqs: [
      {
        question: "Workday는 이력서를 자동으로 탈락시키나요?",
        answer:
          "회사가 프로세스를 어떻게 설정했는지에 따라 다릅니다. Workday는 채용 담당자가 지원자를 관리하고 검토하도록 지원합니다. 직책, 기간, 성과가 분명하면 사람과 시스템 모두 프로필을 읽기 쉽습니다.",
      },
      {
        question: "GriffoWork는 Workday에 맞춰 어떻게 준비해 주나요?",
        answer:
          "GriffoWork는 시간 순서의 명확성, 서식, 측정 가능한 성과를 점검해 경력이 깔끔하게 읽히도록 돕습니다.",
      },
    ],
  },
  greenhouse: {
    marketName: "구조화된 채용 절차를 쓰는 기업",
    description:
      "Greenhouse는 인재 발굴, 면접, 지원자 관리를 하나로 묶은 채용 플랫폼입니다. 팀이 직접 정한 질문과 평가 기준을 쓰는 구조화 면접을 중심으로 만들어졌습니다.",
    marketShare: "Greenhouse는 수천 개의 기업이 플랫폼을 사용한다고 밝히고 있습니다.",
    howItWorks: [
      {
        title: "구조화된 평가",
        description:
          "팀이 직무별로 질문과 평가표를 정하고, 면접관은 같은 기준으로 지원자를 평가합니다.",
      },
      {
        title: "이력서와 프로필의 맥락",
        description:
          "이력서와 포트폴리오, LinkedIn 같은 공유 링크는 면접 전에 팀에 맥락을 제공합니다.",
      },
    ],
    eliminationFactors: [
      "직무가 요구하는 도구를 실제로 써 본 흔적이 없는 일반적인 이력서.",
      "이전 직무의 구체적인 성과가 없는 경우.",
      "프로젝트와 사업 영향 사이의 연결이 불분명한 경우.",
    ],
    howGriffoWorkHelps: [
      "역량과 방법론이 직무와 얼마나 맞는지 정리합니다.",
      "직업 프로필이 이력서와 일관되는지 확인합니다.",
      "일반적인 평가 기준에 비춰 영향력과 명확성을 점검합니다.",
    ],
    faqs: [
      {
        question: "Greenhouse는 지원자를 어떻게 평가하나요?",
        answer:
          "Greenhouse는 팀이 자체 질문과 평가 기준을 사용하는 구조화 면접과, 피드백을 기록하는 평가표를 설명합니다. 각 요건에 대한 근거가 분명한 이력서가 도움이 됩니다.",
      },
      {
        question: "GriffoWork는 Greenhouse의 원격 직무에도 쓸 수 있나요?",
        answer:
          "GriffoWork는 지원하는 공고의 직무 설명과 이력서를 비교합니다. 직무가 어디에 있든 마찬가지입니다.",
      },
    ],
  },
  lever: {
    marketName: "다양한 산업의 기업",
    description:
      "Lever는 지원자 추적 시스템과 AI 기능을 갖춘 채용 플랫폼입니다. 사이트에서는 행정·일정 업무의 자동화와, 맥락이 함께 제공되는 AI 추천을 내세웁니다.",
    marketShare: "Lever는 20개가 넘는 산업에서 수천 곳의 고객을 두고 있다고 밝히고 있습니다.",
    howItWorks: [
      {
        title: "자동화",
        description:
          "행정, 일정 조율, 후속 연락이 자동화되어 채용팀이 채용 결정에 시간을 쓸 수 있습니다.",
      },
      {
        title: "AI 추천",
        description:
          "Lever는 AI가 가장 적합한 지원자를 먼저 보여 주고 각 추천에 맥락을 함께 제공한다고 설명합니다. 직무 요건이 분명히 드러나는 이력서가 자리 잡기 쉽습니다.",
      },
    ],
    eliminationFactors: [
      "채용 공고의 용어가 빠져 적합성이 잘 보이지 않는 경우.",
      "경험의 깊이가 전해지지 않는 모호한 서술.",
    ],
    howGriffoWorkHelps: [
      "직무가 요구하는 키워드가 이력서에 들어 있는지 확인합니다.",
      "적합성이 잘 보이도록 포지셔닝을 다듬습니다.",
    ],
    faqs: [
      {
        question: "Lever는 AI로 지원자 순위를 매기나요?",
        answer:
          "Lever는 가장 적합한 지원자를 맥락과 함께 먼저 보여 주는 AI 추천을 설명합니다. 채용 결정은 채용팀의 몫입니다.",
      },
    ],
  },
  taleo: {
    marketName: "대기업",
    description:
      "Oracle Taleo는 인재 발굴, 채용, 온보딩을 위한 인재 확보 제품군입니다. Oracle은 Taleo Enterprise Edition과 Taleo Business Edition을 제공하며, 기존 Taleo 고객을 위한 경로로 Oracle Recruiting도 소개합니다.",
    marketShare: "기업이 인재 발굴과 채용에 쓰는, 자리를 잡은 Oracle 제품입니다.",
    howItWorks: [
      {
        title: "선별과 면접",
        description:
          "Oracle은 지원자 선별, 면접 관리, 오퍼 작성 도구를 안내합니다. 무엇을 묻고 확인할지는 회사마다 설정합니다.",
      },
      {
        title: "채용 사이트와 인재 발굴",
        description:
          "회사 브랜드를 반영한 채용 사이트, 캠페인, 추천 기능으로 지원자가 시스템에 들어오고 채용 담당자가 검토합니다.",
      },
    ],
    eliminationFactors: [
      "자동 읽기를 어렵게 만들 수 있는 특이한 섹션 제목이나 그래픽 요소.",
      "기간이나 직책이 빠져 경력이 불분명한 경우.",
    ],
    howGriffoWorkHelps: [
      "자동 읽기가 깔끔하게 되도록 이력서 구조를 점검합니다.",
      "기업이 흔히 기대하는 날짜, 직책, 섹션 관례를 확인합니다.",
    ],
    faqs: [
      {
        question: "Oracle Taleo는 지금도 쓰이나요?",
        answer:
          "Oracle은 지금도 Taleo를 제품으로 소개하며 Oracle Recruiting으로의 전환도 제공합니다. 특정 기업이 쓰는지는 그 기업이 정할 일입니다.",
      },
    ],
  },
  ashby: {
    marketName: "스타트업부터 대기업까지",
    description:
      "Ashby는 지원자 추적 시스템, 인재 발굴·CRM, 일정 조율, 분석을 AI와 함께 하나로 묶은 올인원 채용 플랫폼입니다.",
    marketShare: "Ashby는 스타트업, 성장 단계 기업, 대기업을 위한 요금제를 제공합니다.",
    howItWorks: [
      {
        title: "분석과 AI",
        description:
          "Ashby는 채용 분석과 AI 기능을 결합해 팀이 지원자를 검토하고 절차를 운영하도록 돕습니다.",
      },
    ],
    eliminationFactors: [
      "핵심 성과와 전달한 영향을 가리는 길고 초점 없는 이력서.",
    ],
    howGriffoWorkHelps: [
      "이력서 요약이 빠르고 명확하게 읽히도록 점검합니다.",
      "복잡한 프로젝트와 기술 리더십을 부각합니다.",
    ],
    faqs: [
      {
        question: "Ashby는 다른 시스템과 무엇이 다른가요?",
        answer:
          "Ashby는 지원자 추적, 인재 발굴·CRM, 일정 조율, 분석을 AI와 함께 제공하는 올인원 플랫폼으로 스스로를 소개합니다.",
      },
    ],
  },
}
