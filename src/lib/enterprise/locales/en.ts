import type { EnterpriseLocale } from '../content-types'

export const en: EnterpriseLocale = {
  breadcrumbHome: 'Home',
  landing: {
    metaTitle: 'Griffo Enterprise — AI Resume-to-Job Matching for Recruiting Teams',
    metaDescription:
      'Find the right candidate — internal or external — with the same AI compatibility engine behind GriffoWork. Built for recruiters and HR teams making hiring and internal mobility decisions.',
    keywords: [
      'griffo enterprise',
      'ai resume matching for recruiters',
      'candidate job matching software',
      'internal mobility software',
      'external recruitment ai',
      'hr tech ai matching',
    ],
    eyebrow: 'Griffo Enterprise',
    title: 'Find the right candidate — internal or external',
    subtitle:
      'Griffo Enterprise runs the same AI resume×job compatibility engine behind GriffoWork on your own hiring pipeline — scanning your internal team first, then your registered applicants, before reaching into the broader Griffo candidate pool. Every match shows exactly where it came from.',
    useCases: [
      {
        title: 'External recruitment',
        body: 'Score every applicant against a requisition automatically, ranked and explained — not just a keyword match.',
      },
      {
        title: 'Internal mobility',
        body: 'Surface employees who already fit a new opening before you look outside — using the profile they already maintain on Griffo.',
      },
    ],
    ctaLabel: 'Talk to sales',
    faqs: [
      {
        question: 'What is AI resume-to-job matching?',
        answer:
          "It's the same compatibility engine behind GriffoWork, applied to your hiring pipeline: an AI model reads a candidate's professional profile and a job requisition, then scores how well they fit across professional experience, job-specific requirements, and broader context — instead of just checking for matching keywords.",
      },
      {
        question: 'How is candidate-job compatibility measured?',
        answer:
          'Every match is broken down across the same dimensions GriffoWork already uses for candidates — professional background, alignment with the specific requisition, and contextual fit — so a recruiter sees not just a score, but why that score was given.',
      },
      {
        question: "What's the difference between external recruitment and internal mobility here?",
        answer:
          'Same matching engine, different candidate source. External recruitment scores people who apply to a requisition from outside the company. Internal mobility scores your own employees — with their consent — against new openings before you look outside.',
      },
      {
        question: 'Does Griffo Enterprise replace our existing ATS?',
        answer:
          "No — it runs the matching and scoring layer on top of applications, whether they come through your own requisition postings or an existing pipeline. It's designed to sit alongside how you already track candidates, not to replace that system.",
      },
      {
        question: 'How is employee data handled for internal mobility?',
        answer:
          "An employee's profile is only used for internal matching after they explicitly opt in for that specific company — a separate consent from any public candidate visibility, and scoped to one organization at a time.",
      },
    ],
  },
  externalRecruitment: {
    metaTitle: 'AI Candidate Matching for External Recruitment | Griffo Enterprise',
    metaDescription:
      "Score and rank every job applicant automatically with Griffo Enterprise's AI resume-to-job matching engine — built for recruiting teams hiring externally.",
    keywords: [
      'external recruitment ai',
      'candidate ranking software',
      'ai applicant tracking',
      'resume screening ai',
      'job matching software for recruiters',
    ],
    eyebrow: 'External Recruitment',
    title: 'Rank every applicant by real fit, not keywords',
    subtitle:
      'Griffo Enterprise scores each candidate against your job requisition with the same AI compatibility engine behind GriffoWork — so your team reviews a ranked shortlist instead of a folder of resumes.',
    points: [
      {
        title: 'Automatic scoring on every submission',
        body: 'Each application is compared to the requisition the moment it comes in — a 0–100 match score, explained across the same professional, job-fit and contextual dimensions GriffoWork already uses for candidates.',
      },
      {
        title: 'A cascade, not a single pool',
        body: 'Before looking outside, Griffo Enterprise checks your own team and your registered applicants first — external search is the third source, not the first, and every suggestion is labeled with where it came from.',
      },
      {
        title: 'No new resume format to learn',
        body: 'Reuses the same profile extraction GriffoWork already runs for candidates, so a resume uploaded once scores against every open requisition.',
      },
    ],
    ctaLabel: 'Talk to sales',
  },
  internalMobility: {
    metaTitle: 'Internal Mobility Software Powered by AI Matching | Griffo Enterprise',
    metaDescription:
      'Surface internal candidates for new openings automatically with Griffo Enterprise — AI-powered internal mobility built on the same engine as GriffoWork.',
    keywords: [
      'internal mobility software',
      'internal talent marketplace',
      'employee internal transfer software',
      'ai internal mobility',
      'talent mobility platform',
    ],
    eyebrow: 'Internal Mobility',
    title: 'Find your next hire inside the company first',
    subtitle:
      'Griffo Enterprise scans your own team for a fit before you post a job externally — using the professional profile employees already maintain on Griffo, with their consent.',
    points: [
      {
        title: 'Employees keep one profile',
        body: "No second resume to fill out: an employee's existing GriffoWork profile is what gets matched against new internal openings.",
      },
      {
        title: 'Consent scoped per company',
        body: "An employee's profile is only visible for internal matching after they opt in for that specific organization — separate from any public candidate visibility.",
      },
      {
        title: 'Internal fit shown first, always',
        body: 'When a new requisition opens, the internal team is the first source the matching agent checks, before registered applicants or the wider Griffo pool.',
      },
    ],
    ctaLabel: 'Talk to sales',
  },
}
