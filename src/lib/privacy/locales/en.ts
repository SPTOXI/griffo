import type { PrivacyContent } from '../content-types'

export const en: PrivacyContent = {
  metaTitle: 'Privacy Policy — GriffoWork',
  metaDescription:
    'How GriffoWork collects, uses, shares, and retains your data — including which AI providers analyze your resume, how long we keep it, and how to access, export, or delete it.',
  breadcrumbHome: 'Home',
  title: 'Privacy Policy',
  lastUpdatedLabel: 'Last updated',
  lastUpdatedValue: 'September 2026',
  intro: [
    'GriffoWork ("we", "us") provides career intelligence tools: resume analysis, ATS compatibility scoring, resume rewriting, and job matching (Radar). This page explains, in plain language, what data we collect to do that, who else sees it, how long we keep it, and what control you have over it.',
    'GriffoWork is an operating brand; we have not yet incorporated a dedicated legal entity for it. Until we do, treat this page as our operational commitment rather than a formal corporate disclosure — we will update it the moment that changes.',
  ],

  dataWeCollectHeading: 'What we collect',
  dataCategories: [
    {
      title: 'Account information',
      body: 'Email address and password (stored hashed, never in plain text) when you create an account.',
    },
    {
      title: 'Resume and professional information',
      body: 'The resume content you upload or paste, the target job/job description you provide, and any professional profile details you fill in (skills, experience, education).',
    },
    {
      title: 'Optional social profile links',
      body: 'LinkedIn, GitHub, portfolio, or similar links you choose to add, and only when you opt in to have them analyzed.',
    },
    {
      title: 'Payment information',
      body: 'We never see or store your full card number. Payments are processed by Stripe, our payment processor; we keep only the transaction record needed for receipts and support.',
    },
    {
      title: 'Usage data',
      body: 'Basic product events (such as page views and checkout steps) and an approximate country derived from your network connection, used to understand product usage and to show the right currency.',
    },
    {
      title: 'Language preference',
      body: 'The interface language you select, saved so the site remembers it on your next visit.',
    },
    {
      title: "Resume sent without an account (home page)",
      body: "If you send your resume through the form on the home page without creating an account, we receive the file (or the pasted text) and your email. We use the resume to identify your job title, field and skills and compare them with open jobs, and the email to send you the link to your results. When you send it, you choose: delete everything within 24 hours, or keep the resume so companies can find you. Keeping it requires you to select that option; the default is to delete.",
    },
  ],

  howWeUseHeading: 'What we use it for',
  howWeUseItems: [
    'Analyzing your resume and generating the audit, scoring, and rewrite suggestions you request.',
    'Matching your profile against open positions for the Radar feature, when you enable it.',
    'Processing payments and providing account support.',
    'Sending you the emails you\'ve asked for (analysis results, Radar alerts) and, where applicable, letting you unsubscribe from non-essential ones.',
    'Understanding aggregate product usage so we can improve the service.',
    'Meeting legal and accounting obligations tied to payments.',
  ],

  sharingHeading: 'Who we share it with',
  sharingIntro:
    'We do not sell your data. We share it only with the service providers ("sub-processors") needed to run GriffoWork, each acting on our instructions:',
  subProcessors: [
    {
      name: 'AI providers (Anthropic, OpenAI, Google, DeepSeek, Moonshot AI)',
      purpose:
        'Your resume content is sent to one of these providers to generate the analysis, score, or rewrite you request. Which provider is used for a given request can vary; see "International transfers" below for how we restrict this for users in the European Economic Area.',
    },
    {
      name: 'Stripe',
      purpose: 'Payment processing. Stripe receives your payment details directly; we do not store your card number.',
    },
    {
      name: 'Resend',
      purpose: 'Delivering transactional email (analysis results, Radar alerts, account notices).',
    },
    {
      name: 'Vercel and Supabase',
      purpose: 'Application hosting and database infrastructure.',
    },
  ],

  transfersHeading: 'International transfers',
  transfersBody: [
    'Some of our sub-processors operate outside your country, including outside the European Economic Area (EEA). For users we identify as being in the EEA, UK, or Switzerland, we exclude AI providers that operate without a recognized adequacy decision for that region (currently DeepSeek and Moonshot AI/Kimi) from processing your resume — your content is only routed to providers addressable under GDPR-compatible safeguards.',
    'For users outside the EEA, all listed AI providers may be used depending on system load and availability.',
  ],

  retentionHeading: 'How long we keep your data',
  retentionIntro:
    'We keep data only as long as it serves the purpose it was collected for, or as required by law:',
  retentionRows: [
    { category: 'Resumes on an active account', period: 'For as long as your account is active' },
    { category: 'Resumes on an inactive account', period: 'Up to 730 days after your last activity, then deleted' },
    { category: 'AI processing logs (operational metrics, already stripped of resume content)', period: 'Up to 365 days' },
    { category: 'Audit trail (compliance and security log)', period: 'Up to 730 days' },
    { category: 'Payment/webhook records', period: 'Up to 90 days' },
    { category: 'Radar offer history (roles the Radar showed you)', period: 'Up to 730 days' },
    { category: "Resume sent without an account, with the \"delete within 24 hours\" option", period: "Up to 24 hours. The resume text is not stored; only the results and the email, deleted within the same period" },
    { category: "Resume sent without an account, with the \"keep so companies can find me\" option", period: "Up to 730 days, or until you ask us to delete it" },
  ],

  rightsHeading: 'Your rights and choices',
  rightsIntro:
    'Wherever you are, we offer these controls directly in your account (Settings), without needing to email us first:',
  rights: [
    {
      title: 'Export your data',
      body: 'Download a copy of your resumes, analysis history, transactions, and account activity.',
    },
    {
      title: 'Delete your account',
      body: 'Permanently delete your account and associated personal data. This is irreversible.',
    },
    {
      title: 'Correct your information',
      body: 'Edit your resume, profile, and account details at any time.',
    },
    {
      title: 'Opt out of non-essential email',
      body: 'Unsubscribe from Radar alerts and other non-essential notifications from your account or the link in the email itself.',
    },
  ],

  cookiesHeading: 'Cookies and local storage',
  cookiesBody: [
    'We use a session cookie to keep you signed in, and a preference cookie/local storage entry to remember your chosen interface language. We do not use third-party advertising trackers.',
  ],

  securityHeading: 'Security',
  securityBody: [
    'We use industry-standard measures such as encrypted connections (HTTPS), hashed passwords, and access controls on our database to protect your data. No system is completely immune to risk, and we cannot guarantee absolute security — but we treat resume content as sensitive personal data and design our processes around minimizing who and what can access it.',
  ],

  childrenHeading: "Children's privacy",
  childrenBody:
    'GriffoWork is intended for working professionals and job seekers, and is not directed to individuals under 16. We do not knowingly collect data from children.',

  changesHeading: 'Changes to this policy',
  changesBody:
    'We may update this page as the product or our providers change. Meaningful changes will update the date at the top of this page.',

  contactHeading: 'Contact us',
  contactBody: 'For any question about this policy or your data, write to {email}.',
}
