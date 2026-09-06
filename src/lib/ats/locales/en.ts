import type { AtsLocale } from '../content-types'

/**
 * Guias de ATS em inglês.
 *
 * Só os ATS que `meta.ts` declara como disponíveis em inglês — os 5 globais
 * mais o iCIMS (que opera em EUA/Reino Unido). Gupy, Sólides, InfoJobs e
 * Personio não entram: são regionais e não têm público de língua inglesa.
 */
export const atsEn: AtsLocale = {
  workday: {
    marketName: 'United States, Europe & Global Multinationals',
    description:
      'Workday is the corporate standard across most of the Fortune 500 and large global multinationals. It is known for one of the strictest and most standardized parsers in the HR software market.',
    marketShare: 'Used by more than 50% of Fortune 500 corporations.',
    howItWorks: [
      {
        title: 'Structured field mapping',
        description:
          'Workday breaks the resume into predefined fields: company, job title, dates and responsibilities. Any formatting mismatch causes data to be lost during screening.',
      },
      {
        title: 'International compliance screening',
        description:
          'Filters applications against global employment compliance rules, requiring clear career progression and seniority.',
      },
      {
        title: 'Metrics and requirement checks',
        description:
          'The system favours profiles that show measurable impact aligned with the skills listed in the job requisition.',
      },
    ],
    eliminationFactors: [
      'Unconventional formats and layouts that corrupt automatic field population.',
      'Inconsistent dates and periods that prevent the system from calculating years of experience.',
      'Job titles that do not map clearly onto international market standards.',
    ],
    howGriffoWorkHelps: [
      "Ensures your resume's hierarchy is read without errors by the Workday parser.",
      'Checks alignment with international hiring standards (US, Europe and global).',
      'Audits the density of metrics and achievements against the corporate filters of the system.',
      'Generates a cover letter targeted at the specific role.',
    ],
    faqs: [
      {
        question: 'What makes Workday so demanding?',
        answer:
          'Because multinationals receive thousands of applications per opening, Workday applies structured criteria that discard resumes with confusing formatting or information it cannot categorise.',
      },
      {
        question: 'How does GriffoWork prepare my profile for Workday?',
        answer:
          'GriffoWork reviews chronological clarity, formatting and the presence of executive metrics, so Workday extracts your history cleanly.',
      },
    ],
  },
  greenhouse: {
    marketName: 'Global Tech, Startups & Scaleups',
    description:
      'Greenhouse is the most widely used recruiting platform across the global technology ecosystem, hypergrowth startups and unicorns, with a focus on skills-based, evidence-driven hiring.',
    marketShare: 'Leading platform among technology and innovation companies in the US, Europe and Latin America.',
    howItWorks: [
      {
        title: 'Skills scorecards',
        description:
          'Scores candidates against specific scorecards for technical skills, tools and leadership.',
      },
      {
        title: 'Portfolio and profile integration',
        description:
          'Connects resume data with professional links (LinkedIn, GitHub, portfolios) for review by the technical team.',
      },
    ],
    eliminationFactors: [
      'Generic resumes that do not evidence hands-on command of the tools and frameworks.',
      'No concrete results from previous roles.',
      'No clear link between projects and business impact.',
    ],
    howGriffoWorkHelps: [
      'Maps how well your technical skills and methodologies match the role.',
      'Audits your professional profiles to keep them consistent with your resume.',
      "Scores impact and clarity against recruiters' scorecard criteria.",
    ],
    faqs: [
      {
        question: 'Why is Greenhouse so popular in tech?',
        answer:
          'Because it lets engineering and product teams assess skills in a structured, collaborative way, reducing bias in the first screening round.',
      },
      {
        question: 'Does GriffoWork handle international remote roles on Greenhouse?',
        answer:
          'Yes. GriffoWork adapts the audit to global processes and international requirements.',
      },
    ],
  },
  lever: {
    marketName: 'Scaleups & Big Tech',
    description:
      'Lever combines applicant tracking (ATS) with talent relationship management (CRM), letting recruiting teams source and qualify candidates continuously from their own database.',
    marketShare: 'Widely adopted by mid-sized and large technology companies.',
    howItWorks: [
      {
        title: 'Continuous talent indexing',
        description:
          "Stores and indexes the candidate's full history to match against current and future openings.",
      },
      {
        title: 'Semantic skills search',
        description:
          'Recruiters filter candidates through detailed semantic searches by tools, job titles and education.',
      },
    ],
    eliminationFactors: [
      'Missing technical terms, so the system never surfaces the profile in themed searches.',
      "Vague descriptions that do not convey the depth of the candidate's knowledge.",
    ],
    howGriffoWorkHelps: [
      'Makes sure the strategic keywords are present so your resume is found in Lever searches.',
      'Sharpens your positioning so the profile keeps working in the talent pool over time.',
    ],
    faqs: [
      {
        question: 'How does the Lever talent pool work?',
        answer:
          'Lever keeps archived profiles searchable. A resume with a high density of relevant terms keeps surfacing for new opportunities.',
      },
    ],
  },
  taleo: {
    marketName: 'Banks, Government & Large Corporations',
    description:
      'Oracle Taleo is one of the most established corporate recruiting systems in the world, widely used in financial services, oil and gas, telecoms and public sector bodies.',
    marketShare: 'Strong presence in traditional corporations and global financial institutions.',
    howItWorks: [
      {
        title: 'Traditional screening filters',
        description:
          'Applies structured screening rules based on formal job titles, tenure and education levels.',
      },
    ],
    eliminationFactors: [
      'Unconventional section headings that the legacy parser cannot classify.',
      'Graphic elements that break the information hierarchy.',
    ],
    howGriffoWorkHelps: [
      "Audits the resume's formal structure for compatibility with the Taleo parser.",
      'Checks the date, job title and section conventions expected by traditional corporations.',
    ],
    faqs: [
      {
        question: 'Is Oracle Taleo still widely used?',
        answer:
          'Yes, especially in large banks, industrial groups and corporations managing thousands of employees worldwide.',
      },
    ],
  },
  icims: {
    marketName: 'United States & United Kingdom',
    description:
      'iCIMS is one of the most robust screening and talent management platforms in the American and British corporate market, processing millions of applications every year.',
    marketShare: 'More than 4,000 corporate customers.',
    howItWorks: [
      {
        title: 'Requirement scoring',
        description:
          'Calculates a qualification score based on how well the profile matches the essential and desirable requirements of the role.',
      },
    ],
    eliminationFactors: [
      'No direct match with the keywords listed in the job description.',
    ],
    howGriffoWorkHelps: [
      'Compares your resume against the target role and reports how closely it meets iCIMS requirements.',
      'Suggests clarity and impact improvements to raise the application score.',
    ],
    faqs: [
      {
        question: 'Is iCIMS widely used in the American market?',
        answer:
          'Yes. It is one of the most common ATS platforms in large corporations and in sectors such as healthcare, finance and technology across the US and UK.',
      },
    ],
  },
  ashby: {
    marketName: 'Global Startups & AI Scaleups',
    description:
      'Ashby is a modern recruiting platform growing fast among innovative technology and artificial intelligence companies, built around smart automation and analytics.',
    marketShare: 'Growing rapidly among technology and AI scaleups.',
    howItWorks: [
      {
        title: 'Fast screening and AI summaries',
        description:
          "Produces analytical summaries so recruiters can quickly gauge a candidate's impact and seniority.",
      },
    ],
    eliminationFactors: [
      'Long, unfocused resumes that bury the main technical achievements and delivered impact.',
    ],
    howGriffoWorkHelps: [
      "Audits your resume's executive summary so it reads fast and lands hard.",
      'Highlights complex projects and technical leadership for the Ashby filters.',
    ],
    faqs: [
      {
        question: 'What sets Ashby apart from other systems?',
        answer:
          'Ashby offers analytical dashboards and automatic summaries that reward concise, results-driven resumes.',
      },
    ],
  },
}
