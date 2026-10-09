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
  smartrecruiters: {
    marketName: "Global Mid-Market & Enterprise Employers",
    description:
      "SmartRecruiters is a talent acquisition platform that mid-sized and large employers use to publish jobs, collect applications and manage candidates in a single pipeline. Resumes are parsed into a candidate profile that recruiters search, filter and compare.",
    marketShare: "Widely used by international mid-market and enterprise employers.",
    howItWorks: [
      {
        title: "Resume parsing into a profile",
        description:
          "The system reads your file and turns it into a structured profile: contact details, work history, education and skills. Anything it cannot read as text may never reach the recruiter.",
      },
      {
        title: "Application questions",
        description:
          "Employers can add screening questions to the form, such as work authorisation, location or required experience, and recruiters use the answers to filter the candidate list.",
      },
      {
        title: "Team evaluation",
        description:
          "Recruiters and hiring managers review profiles side by side, so a clear, scannable summary and quantified results make comparison easier.",
      },
    ],
    eliminationFactors: [
      "Multi-column layouts, tables or text boxes that scramble the order in which the parser reads your history.",
      "Contact details or key skills placed in headers, footers or images, which parsers often skip.",
      "Wording that does not mirror the job description, which weakens search and filter results.",
    ],
    howGriffoWorkHelps: [
      "Checks whether a typical parser reads your resume as clean text, in the right order.",
      "Compares your skills and wording with the job description to find missing keywords.",
      "Audits how clearly achievements and metrics stand out when a recruiter compares profiles.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Does SmartRecruiters reject my resume automatically?",
        answer:
          "It depends on how each employer configured the job. Many use screening questions and filters, and recruiters decide the rest. A resume the parser cannot read properly is easier to overlook, so a clean layout matters.",
      },
      {
        question: "Which file format works best?",
        answer:
          "Follow the format the employer asks for. If it is open, a text-based PDF or a simple single-column .docx is the safest choice.",
      },
    ],
  },
  successfactors: {
    marketName: "Large Corporations & Global Enterprises",
    description:
      "SAP SuccessFactors Recruiting is the hiring module of SAP’s human capital management suite. Large organisations use it to run structured, compliance-driven application processes, with resumes feeding a candidate profile alongside the application form.",
    marketShare: "A common choice among large corporations that already run SAP.",
    howItWorks: [
      {
        title: "Structured application form",
        description:
          "Candidates usually complete a detailed form on the employer’s career site, and the resume is attached or parsed to fill in parts of the profile. Fields left inconsistent with the resume stand out.",
      },
      {
        title: "Pre-screening questions",
        description:
          "Employers can configure questions tied to each requisition, such as certifications, languages or availability, which recruiters use to narrow the candidate pool.",
      },
      {
        title: "Process and compliance",
        description:
          "Applications move through defined stages with records kept for each, so complete, consistent dates and job titles help your history hold up through review.",
      },
    ],
    eliminationFactors: [
      "Employment dates that are missing, overlapping or inconsistent between the form and the resume.",
      "Job titles and responsibilities that do not clearly map to the requirements of the requisition.",
      "Decorative formatting that hides text from the parser or breaks the order of your history.",
    ],
    howGriffoWorkHelps: [
      "Checks that your dates, titles and sections stay consistent from the resume to the form.",
      "Matches your experience against the requirements listed in the job description.",
      "Audits clarity and measurable impact for large-company screening.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Should my resume match the application form exactly?",
        answer:
          "Yes. Recruiters see both, so differences in dates, titles or employers raise questions. Keep the two consistent.",
      },
      {
        question: "Is SuccessFactors used only by very large companies?",
        answer:
          "It is most common in large organisations, which is why processes tend to be formal and well documented. Smaller companies use it less often.",
      },
    ],
  },
  workable: {
    marketName: "Growing Companies & Mid-Sized Employers Worldwide",
    description:
      "Workable is a recruiting platform used by growing and mid-sized companies to post jobs on multiple boards, receive applications in one place and rank candidates. It parses each resume into a profile and offers AI-assisted tools that help recruiters shortlist.",
    marketShare: "Popular among small and mid-sized companies hiring internationally.",
    howItWorks: [
      {
        title: "Resume parsing",
        description:
          "Workable extracts your experience, education and skills from the file you upload. Text it cannot read, such as content inside images, is lost from the profile.",
      },
      {
        title: "Screening questions",
        description:
          "Employers often add questions to the application, and the answers help recruiters sort candidates quickly.",
      },
      {
        title: "AI-assisted shortlisting",
        description:
          "The platform offers tools that help recruiters rank and shortlist candidates against the role, so the skills and terms in your resume matter.",
      },
    ],
    eliminationFactors: [
      "Information inside images, graphics or skill bars that the parser cannot read.",
      "A profile that never names the tools and skills the job description asks for.",
      "Very long documents that bury the most relevant experience.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is readable as plain text, with no hidden content.",
      "Finds skills and terms from the job description that your resume does not mention.",
      "Audits whether your most relevant experience is easy to find.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Does Workable use AI to rank resumes?",
        answer:
          "It offers AI-assisted features that employers can use when shortlisting. How much they rely on them is each company’s choice, so write for both a parser and a human reader.",
      },
      {
        question: "Do I need keywords from the job description?",
        answer:
          "Yes, where they are true. Using the same terms as the posting makes your experience easier to find and compare.",
      },
    ],
  },
  teamtailor: {
    marketName: "Nordic Region, Europe & Employer-Branding-Focused Teams",
    description:
      "Teamtailor is a recruiting platform from Sweden that combines an applicant tracking system with a branded career site. Employers use it to publish jobs, receive applications and move candidates through a visual pipeline.",
    marketShare: "Popular among companies in the Nordic countries and across Europe.",
    howItWorks: [
      {
        title: "Career-site application",
        description:
          "Candidates usually apply through the employer’s own career site, where the resume and a few form fields become the candidate profile.",
      },
      {
        title: "Visual pipeline",
        description:
          "Recruiters move candidates through stages, often scanning profiles quickly, so the top of your resume has to carry your strongest points.",
      },
      {
        title: "Team collaboration",
        description:
          "Hiring teams comment on candidates together, which rewards a resume that is easy to summarise in a sentence or two.",
      },
    ],
    eliminationFactors: [
      "A resume that needs a long read before the relevant experience appears.",
      "Layouts with columns or graphics that make the parsed profile incomplete.",
      "Contact details and links hidden in headers or images.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is read cleanly and your key details survive parsing.",
      "Audits the first lines of your resume for clarity and impact.",
      "Compares your wording with the job description to surface missing terms.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Does Teamtailor read resumes in Swedish and English?",
        answer:
          "Employers receive applications in the language the candidate submits. Write in the language of the posting and keep section headings plain.",
      },
      {
        question: "How much does the first part of my resume matter?",
        answer:
          "A lot. Recruiters often review many candidates in a pipeline view, so lead with your most relevant role and results.",
      },
    ],
  },
  oraclerecruiting: {
    marketName: "Large Enterprises & Global Employers",
    description:
      "Oracle Recruiting is the hiring module of Oracle’s cloud HR suite, used by large employers to run career sites, collect applications and manage candidates. It is the cloud-era counterpart to Taleo inside the Oracle HCM family, and it builds a candidate profile from your resume and application answers.",
    marketShare: "A common choice among large enterprises that already run Oracle for HR.",
    howItWorks: [
      {
        title: "Career site and candidate profile",
        description:
          "Candidates apply through the employer’s career site. The resume and the form answers are combined into one candidate profile that recruiters search and filter.",
      },
      {
        title: "Questionnaires and pre-screening",
        description:
          "Employers can attach questions to a requisition, such as certifications, languages or availability, and use the answers to narrow the pool.",
      },
      {
        title: "Structured review",
        description:
          "Recruiters and hiring managers review candidates in defined stages, so consistent dates, titles and clear results help your profile hold up.",
      },
    ],
    eliminationFactors: [
      "Layouts that break the order in which the parser reads your work history.",
      "Dates or titles that differ between the resume and the application form.",
      "Experience that does not clearly connect to the requirements of the requisition.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume reads as clean, correctly ordered text.",
      "Keeps dates, titles and sections consistent between resume and form.",
      "Matches your experience against the requirements in the job description.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Is Oracle Recruiting the same as Taleo?",
        answer:
          "No. Taleo is Oracle’s older recruiting product, while Oracle Recruiting is the newer module in Oracle’s cloud HR suite. Employers may use either, so the same good habits apply to both.",
      },
      {
        question: "Should the resume match my application answers?",
        answer:
          "Yes. Recruiters see both, so differences in dates, titles or employers raise questions. Keep them consistent.",
      },
    ],
  },
  bamboohr: {
    marketName: "Small & Mid-Sized Companies",
    description:
      "BambooHR is an HR platform for small and mid-sized companies whose hiring tool lets teams post jobs, collect applications and track candidates through a simple workflow. Hiring managers and HR often review candidates together in the same system.",
    marketShare: "Popular among small and mid-sized companies that manage HR in one place.",
    howItWorks: [
      {
        title: "Application and resume",
        description:
          "Candidates submit a resume and answer the questions the employer added. The details land in a candidate record that the hiring team can read side by side.",
      },
      {
        title: "Simple hiring workflow",
        description:
          "Candidates move through stages that the company defines, and team members add ratings and comments along the way.",
      },
      {
        title: "Shared review",
        description:
          "Because HR and managers both read the profile, a resume that is clear without specialist knowledge works best.",
      },
    ],
    eliminationFactors: [
      "Resumes that bury relevant experience under long, dense sections.",
      "Formatting that corrupts the text when the file is read by the system.",
      "Generic wording that never reflects the role being filled.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is read cleanly, with nothing lost to formatting.",
      "Audits whether your most relevant experience appears early and clearly.",
      "Compares your wording with the job description to surface missing terms.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Does BambooHR screen resumes automatically?",
        answer:
          "It is built around a team workflow: employers set up questions and stages, and people review candidates. A clear resume and good answers to the application questions matter most.",
      },
      {
        question: "Who reads my resume in a small company?",
        answer:
          "Often an HR generalist and the hiring manager. Write so that someone outside the specialty can see your results quickly.",
      },
    ],
  },
  jobvite: {
    marketName: "Mid-Market & Enterprise Employers",
    description:
      "Jobvite is a talent acquisition suite that employers use to publish jobs, run career sites and manage candidates through the hiring process. Applications become candidate records that recruiters search, sort and share with hiring managers.",
    marketShare: "Used by mid-market and enterprise employers.",
    howItWorks: [
      {
        title: "Candidate records",
        description:
          "Your resume and application answers become a candidate record. Details the system cannot read from the file may be missing from that record.",
      },
      {
        title: "Search and filters",
        description:
          "Recruiters search and filter their pool by experience, skills and application answers, so the terms in the job description shape what they find.",
      },
      {
        title: "Sharing with hiring managers",
        description:
          "Recruiters pass shortlisted candidates to managers, who see a condensed view first. A clear opening summary helps there.",
      },
    ],
    eliminationFactors: [
      "Tables, columns or text boxes that scramble the text the system extracts.",
      "Skills and tools that appear in the job description but not in your resume.",
      "A first section that does not state what you do and what you achieved.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is readable as plain text in the right order.",
      "Finds terms from the job description that your resume does not mention.",
      "Audits the opening of your resume for clarity and measurable impact.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Do keywords matter for Jobvite?",
        answer:
          "Yes, where they are truthful. Recruiters search by skills and experience, so using the same terms as the posting helps your profile appear.",
      },
      {
        question: "Should I use a PDF or a Word file?",
        answer:
          "Follow the employer’s instruction. If it is open, a text-based PDF or a simple single-column .docx is the safest option.",
      },
    ],
  },
  recruitee: {
    marketName: "Europe & Fast-Growing Companies Hiring Collaboratively",
    description:
      "Recruitee is a collaborative hiring platform from the Netherlands that combines an applicant tracking system with career-site building and job multiposting. Teams move candidates through a visual pipeline and discuss them together.",
    marketShare: "Popular among growing companies across Europe.",
    howItWorks: [
      {
        title: "Career-site application",
        description:
          "Candidates usually apply through the employer’s career site, where the resume and a short form become the candidate profile.",
      },
      {
        title: "Visual pipeline",
        description:
          "Candidates sit in pipeline stages that the team moves them through, often scanning profiles quickly, so the top of your resume carries the most weight.",
      },
      {
        title: "Team collaboration",
        description:
          "Several people comment on the same candidate, which favours resumes that are easy to summarise in a sentence or two.",
      },
    ],
    eliminationFactors: [
      "A resume that needs a long read before the relevant experience appears.",
      "Columns or graphics that make the parsed profile incomplete.",
      "Contact details and links hidden in headers or images.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is read cleanly and key details survive parsing.",
      "Audits the first lines of your resume for clarity and impact.",
      "Compares your wording with the job description to surface missing terms.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Does Recruitee read resumes in several languages?",
        answer:
          "Employers receive the application in the language you submit it. Write in the language of the posting and keep section headings plain.",
      },
      {
        question: "How much does the top of my resume matter?",
        answer:
          "A lot. In a pipeline view recruiters review many candidates quickly, so lead with your most relevant role and results.",
      },
    ],
  },
  breezyhr: {
    marketName: "Small Businesses & Growing Teams",
    description:
      "Breezy HR is an applicant tracking system for small businesses and growing teams. It posts jobs to multiple boards, collects applications in one place and shows candidates in a visual pipeline, with tools that help recruiters score and compare them.",
    marketShare: "Popular among small businesses and growing teams with lean recruiting.",
    howItWorks: [
      {
        title: "Resume parsing",
        description:
          "Breezy reads the resume you upload and fills in a candidate profile. Content it cannot read as text, such as text inside images, is lost from that profile.",
      },
      {
        title: "Questionnaires",
        description:
          "Employers can add questions to the application, and the answers help sort candidates quickly.",
      },
      {
        title: "Scoring and pipeline",
        description:
          "Recruiters rate candidates and move them across pipeline stages, so a profile that is easy to assess in seconds has an advantage.",
      },
    ],
    eliminationFactors: [
      "Information in images, graphics or skill bars that the parser cannot read.",
      "A profile that never names the skills and tools the job asks for.",
      "Overlong documents that hide the most relevant experience.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is readable as plain text with nothing hidden.",
      "Finds skills and terms from the job description that your resume does not mention.",
      "Audits whether your most relevant experience is easy to find.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Does Breezy HR rank candidates automatically?",
        answer:
          "It offers scoring tools that recruiters can use alongside their own judgment. How much weight they give them is each employer’s choice, so write for both a parser and a person.",
      },
      {
        question: "Do I need the exact keywords of the posting?",
        answer:
          "Use them where they are true. The same terms as the posting make your experience easier to find and compare.",
      },
    ],
  },
  softgarden: {
    marketName: "Germany, Austria, Switzerland & Mid-Sized Employers",
    description:
      "softgarden is applicant management software from Germany that employers use to run career sites, publish jobs on job boards and process applications as a team. Your resume and the form answers become one candidate profile that HR and the hiring department review together.",
    marketShare: "Widely used by employers in German-speaking countries.",
    howItWorks: [
      {
        title: "Application through the career site",
        description:
          "Candidates usually apply on the employer’s career site. Resume, cover letter and form fields are combined into a single candidate profile.",
      },
      {
        title: "Joint review",
        description:
          "HR and the hiring department see the same profile and rate it in turn. A clearly structured resume is easy to grasp without specialist knowledge.",
      },
      {
        title: "AI assistants",
        description:
          "softgarden offers, among other things, an AI screening assistant. How far a company uses it is its own choice; clear job titles and skills help either way.",
      },
    ],
    eliminationFactors: [
      "Multi-column layouts or graphics that leave the parsed profile incomplete.",
      "Gaps or unclear date ranges in your history that go unexplained.",
      "Job titles and skills that do not match the terms in the job posting.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is read cleanly and in the right order.",
      "Audits the structure and traceability of your history against German-market expectations.",
      "Compares your terms with the job posting and shows missing keywords.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Does softgarden evaluate my resume automatically?",
        answer:
          "The software supports team processing: it collects applications, reads out details and makes them comparable. People decide who moves forward. A clean, readable resume still helps.",
      },
      {
        question: "Which format should my resume use?",
        answer:
          "Follow the posting. If it is open, a PDF with selectable text or a simple single-column .docx is the safest choice.",
      },
    ],
  },
  join: {
    marketName: "Small & Mid-Sized Companies, Mainly in German-Speaking Countries",
    description:
      "JOIN is a recruiting tool that lets companies publish a job on several job boards at once and manage all incoming applications in one place. The team sees candidates in a pipeline, rates them and gives feedback.",
    marketShare: "Popular among small and mid-sized companies that post jobs on many boards.",
    howItWorks: [
      {
        title: "Applications from many boards",
        description:
          "Because a job appears on several boards, applications arrive from different sources and end up as profiles in one shared pipeline.",
      },
      {
        title: "Quick screening",
        description:
          "Small teams go through many profiles in little time, so your most relevant roles and results should come first.",
      },
      {
        title: "Team rating",
        description:
          "Several people rate the same candidate. A resume that can be summed up in a few sentences makes agreement easier.",
      },
    ],
    eliminationFactors: [
      "A resume where the relevant experience only appears after a long read.",
      "Graphics, tables or text boxes that disturb how the details are read.",
      "Generic wording that never addresses the advertised role.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is read as clean text with nothing lost.",
      "Audits the first lines of your resume for clarity and impact.",
      "Compares your wording with the job posting and shows missing terms.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Does JOIN reject applications automatically?",
        answer:
          "JOIN collects and organises applications; the team rates them, partly with the system’s helper features. Expect a person to skim your profile in a short time.",
      },
      {
        question: "Should my resume be the same on every board?",
        answer:
          "Yes, keep one consistent, current resume. Different dates or positions stand out when applications come together in the same system.",
      },
    ],
  },
  zohorecruit: {
    marketName: "Recruiting Agencies & Companies Hiring Worldwide",
    description:
      "Zoho Recruit is applicant tracking and recruiting software used both by in-house hiring teams and by staffing agencies. It posts jobs to multiple boards, parses resumes into candidate records and lets recruiters search, tag and shortlist candidates.",
    marketShare: "Used by in-house teams and staffing agencies of many sizes around the world.",
    howItWorks: [
      {
        title: "Resume parsing into records",
        description:
          "The system reads your resume and creates a candidate record with experience, education and skills. Anything it cannot read as text may be missing from that record.",
      },
      {
        title: "Searchable database",
        description:
          "Recruiters search the candidate database by skills, titles and keywords, so the terms in your resume decide whether you appear in the results.",
      },
      {
        title: "Shortlisting",
        description:
          "Recruiters tag candidates and send a shortlist to the client or hiring manager, who sees a condensed profile first.",
      },
    ],
    eliminationFactors: [
      "Information in images or graphics that the parser cannot turn into text.",
      "Skills and tools missing from your resume that the role explicitly asks for.",
      "Titles or terms that differ from how the industry normally names the role.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is read cleanly as text by a typical parser.",
      "Finds terms from the job description that your resume does not mention.",
      "Audits whether your most relevant experience is easy to find and shortlist.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Is Zoho Recruit used by agencies or by companies?",
        answer:
          "By both. Agencies use it to manage many roles and candidates for clients, and companies use it for their own hiring.",
      },
      {
        question: "How do recruiters find me in the database?",
        answer:
          "Mostly by searching skills, job titles and keywords. Use the standard names for your tools and role so a search can match your resume.",
      },
    ],
  },
  jazzhr: {
    marketName: "Small & Growing Businesses",
    description:
      "JazzHR is applicant tracking software for small and growing businesses. Employers post a job to multiple boards, collect applications in one place and move candidates through a hiring workflow with their team.",
    marketShare: "Popular among small and growing businesses with lean hiring teams.",
    howItWorks: [
      {
        title: "Application and resume",
        description:
          "Candidates upload a resume and answer the questions the employer added. The details appear in a candidate record for the team.",
      },
      {
        title: "Screening questions",
        description:
          "Employers often add questions to the application, and the answers help sort candidates quickly.",
      },
      {
        title: "Team workflow",
        description:
          "Candidates move through stages that the company defines, and team members rate and comment on them along the way.",
      },
    ],
    eliminationFactors: [
      "Resumes that bury relevant experience under long, dense sections.",
      "Formatting that corrupts the text when the system reads the file.",
      "Generic wording that never reflects the role being filled.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is read cleanly, with nothing lost to formatting.",
      "Audits whether your most relevant experience appears early and clearly.",
      "Compares your wording with the job description to surface missing terms.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Does JazzHR screen resumes automatically?",
        answer:
          "It supports a team workflow: employers set up questions and stages, and people review candidates. A clear resume and good answers to the questions matter most.",
      },
      {
        question: "Who reads my resume in a small business?",
        answer:
          "Often the owner, an HR generalist or the hiring manager. Write so that someone outside your specialty can see your results quickly.",
      },
    ],
  },
  bullhorn: {
    marketName: "Staffing & Recruiting Agencies",
    description:
      "Bullhorn is applicant tracking and CRM software built for staffing and recruiting agencies. When you apply to a role advertised by an agency, your resume is parsed into a candidate record in a database that recruiters search to fill current and future openings.",
    marketShare: "A common platform among staffing and recruiting agencies.",
    howItWorks: [
      {
        title: "Resume parsing into a record",
        description:
          "Your resume is read into a candidate record with experience, skills and contact details. Content the system cannot read as text may be missing.",
      },
      {
        title: "Database search",
        description:
          "Recruiters search the whole database by skills, titles, location and keywords, so your record may be found for roles other than the one you applied to.",
      },
      {
        title: "Submission to the client",
        description:
          "Recruiters shortlist candidates and submit them to the client company, often with a condensed profile, so a clear summary helps them present you.",
      },
    ],
    eliminationFactors: [
      "Columns, tables or graphics that make the parsed record incomplete.",
      "Skills, tools or certifications that are missing or named non-standardly.",
      "Outdated contact details or location, which stop recruiters reaching you.",
    ],
    howGriffoWorkHelps: [
      "Checks that your resume is read cleanly as text and the record is complete.",
      "Finds standard skill and title terms your resume should include.",
      "Audits the clarity of your summary, which recruiters reuse when submitting you.",
      "Generates a cover letter targeted at the specific role.",
    ],
    faqs: [
      {
        question: "Why does an agency recruiter contact me about other roles?",
        answer:
          "Your record stays in the agency’s database, and recruiters search it for other openings. Keep your skills and contact details current.",
      },
      {
        question: "Does my resume go to the client as I sent it?",
        answer:
          "Often a recruiter reformats or summarises it before submitting. A clear structure and summary give them good material to work with.",
      },
    ],
  },
}
