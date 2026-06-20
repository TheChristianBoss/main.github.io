// ─── TEMPLATE ENGINE ─────────────────────────────────────────────────────────
// Each template returns strings for summary, experience, education, skills.
// [Brackets] mark placeholder text the user should customize.

const TEMPLATES = {
  // ── TECHNOLOGY & IT ──────────────────────────────────────────────────────
  "Software Engineer": {
    summary: (name) =>
      `Results-driven Software Engineer with [years] years of experience designing and building scalable applications. Proficient in [languages/frameworks] with a strong foundation in data structures, algorithms, and software design patterns. Track record of delivering high-quality code in agile environments and collaborating cross-functionally to ship production features on schedule.`,
    experience: () =>
      `Software Engineer | [Company Name] | [City, ST] | [Month Year] – Present\n• Architected and deployed [feature/system] reducing [metric] by [X]%\n• Built [component] using [React/Node/etc.], improving performance by [X]ms\n• Collaborated with product and design to deliver [X] features per sprint\n• Reduced bug backlog by [X]% through improved testing and code review practices\n\nJunior Software Engineer | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Developed [feature] that served [X] users, achieving [result]\n• Contributed to migration from [old tech] to [new tech], improving [metric]`,
    education: () =>
      `B.S. Computer Science | [University Name] | [City, ST] | [Year]\n• GPA: [X.X]/4.0  •  Relevant Coursework: Algorithms, Systems, Databases`,
    skills: () =>
      `Technical: JavaScript, Python, React, Node.js, SQL, Git, REST APIs, [add more]\nTools: VS Code, GitHub, Jira, Docker, [add more]\nSoft Skills: Problem solving, Cross-functional collaboration, Agile/Scrum`,
  },

  "Data Analyst": {
    summary: () =>
      `Detail-oriented Data Analyst with [years] years of experience transforming complex datasets into actionable business insights. Proficient in SQL, Python, and data visualization tools. Demonstrated ability to build dashboards and reports that drive strategic decision-making and improve operational efficiency by [X]%.`,
    experience: () =>
      `Data Analyst | [Company Name] | [City, ST] | [Month Year] – Present\n• Analyzed datasets of [X]M+ records to identify trends, improving revenue by [X]%\n• Built automated reporting dashboards in [Tableau/Power BI], saving [X] hours/week\n• Collaborated with stakeholders to define KPIs and track performance metrics\n• Developed SQL queries to extract and clean data from [database], reducing errors by [X]%\n\nJunior Data Analyst | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Supported data collection and cleansing for [X] business units\n• Created visualizations in [Excel/Tableau] used by [X] senior leaders`,
    education: () =>
      `B.S. Statistics / Mathematics | [University Name] | [City, ST] | [Year]\n• GPA: [X.X]/4.0  •  Relevant Coursework: Statistics, Data Mining, Machine Learning`,
    skills: () =>
      `Technical: SQL, Python (pandas, numpy), Tableau, Power BI, Excel, R, [add more]\nDatabases: MySQL, PostgreSQL, Snowflake, [add more]\nSoft Skills: Analytical thinking, Data storytelling, Attention to detail`,
  },

  "DevOps Engineer": {
    summary: () =>
      `Experienced DevOps Engineer with [years] years building and maintaining CI/CD pipelines, infrastructure as code, and cloud-native architectures. Skilled in automating deployment workflows that reduced release cycles by [X]%. Strong background in Linux, containerization, and monitoring at scale.`,
    experience: () =>
      `DevOps Engineer | [Company Name] | [City, ST] | [Month Year] – Present\n• Designed and maintained CI/CD pipelines using [Jenkins/GitLab CI/GitHub Actions], deploying [X] releases/day\n• Managed Kubernetes clusters supporting [X] microservices across [X] environments\n• Reduced infrastructure costs by [X]% by optimizing cloud resource usage in [AWS/GCP/Azure]\n• Implemented monitoring with [Prometheus/Grafana/Datadog], achieving 99.9% uptime\n\nSystems Administrator | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Maintained Linux servers for [X] applications, achieving [X]% uptime\n• Automated routine tasks with Bash/Python scripts, saving [X] hours/month`,
    education: () =>
      `B.S. Computer Science / Information Systems | [University Name] | [City, ST] | [Year]`,
    skills: () =>
      `Cloud: AWS, GCP, Azure, Terraform, CloudFormation\nContainers: Docker, Kubernetes, Helm\nCI/CD: Jenkins, GitHub Actions, GitLab CI\nMonitoring: Prometheus, Grafana, Datadog, PagerDuty\nLanguages: Bash, Python, YAML`,
  },

  "UI/UX Designer": {
    summary: () =>
      `Creative UI/UX Designer with [years] years crafting user-centered digital experiences for web and mobile. Expert in translating user research and business requirements into intuitive interfaces. Proven track record of improving user satisfaction scores by [X]% through iterative design and A/B testing.`,
    experience: () =>
      `UI/UX Designer | [Company Name] | [City, ST] | [Month Year] – Present\n• Led end-to-end design for [product/feature] used by [X] active users\n• Conducted user research and usability testing with [X] participants, reducing task failure rate by [X]%\n• Designed [X] component library in Figma, improving design-to-dev handoff speed by [X]%\n• Collaborated with engineers and PMs to ship [X] features on schedule\n\nJunior Designer | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Created wireframes and prototypes for [X] projects\n• Maintained design system documentation and component consistency`,
    education: () =>
      `B.F.A. Graphic Design / HCI | [University Name] | [City, ST] | [Year]`,
    skills: () =>
      `Design Tools: Figma, Sketch, Adobe XD, InVision, Zeplin\nResearch: User interviews, Usability testing, A/B testing, Card sorting\nTechnical: HTML, CSS, basic JavaScript\nSoft Skills: Empathy, Visual communication, Stakeholder presentation`,
  },

  // ── TECHNOLOGY (generic) ─────────────────────────────────────────────────
  "Technology & IT": {
    summary: () =>
      `Technology professional with [years] years of experience delivering IT solutions that improve operational efficiency and user experience. Skilled in [primary skills]. Known for quickly adapting to new technologies and working effectively across cross-functional teams.`,
    experience: () =>
      `[Job Title] | [Company Name] | [City, ST] | [Month Year] – Present\n• Implemented [solution/system] that reduced [problem] by [X]%\n• Managed [project/initiative] with [X] stakeholders, delivering on time and under budget\n• Provided technical support and documentation for [X] users/systems\n\n[Previous Job Title] | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]`,
    education: () =>
      `B.S. [Degree] | [University Name] | [City, ST] | [Year]`,
    skills: () =>
      `Technical: [Primary skills], [Secondary skills], [add more]\nTools: [Tools you use]\nSoft Skills: Problem solving, Communication, Adaptability`,
  },

  // ── HEALTHCARE ───────────────────────────────────────────────────────────
  "Registered Nurse": {
    summary: () =>
      `Compassionate Registered Nurse with [years] years of clinical experience in [specialty, e.g., medical-surgical, ICU]. Dedicated to delivering high-quality patient care through evidence-based practice. Proven ability to manage high-acuity patients, coordinate with multidisciplinary teams, and mentor new nursing staff.`,
    experience: () =>
      `Registered Nurse | [Hospital/Facility Name] | [City, ST] | [Month Year] – Present\n• Provided direct patient care for [X]-bed unit with acuity levels [X]–[X]\n• Administered medications, monitored vital signs, and managed IVs for [X]+ patients per shift\n• Collaborated with physicians and care teams to develop individualized care plans\n• Mentored [X] new graduate nurses, reducing onboarding time by [X]%\n\nRN | [Previous Facility] | [City, ST] | [Month Year] – [Month Year]\n• Managed care for [X] patients per shift in [unit type]\n• Achieved [X]% patient satisfaction score through attentive, patient-centered care`,
    education: () =>
      `BSN, Bachelor of Science in Nursing | [University Name] | [City, ST] | [Year]\n• NCLEX-RN Licensed | License #[XXXXX] | Expires [Year]`,
    skills: () =>
      `Clinical: IV therapy, Wound care, Medication administration, Patient assessment, Triage\nSystems: Epic, Cerner, [add EHR]\nCertifications: BLS, ACLS, [add more]\nSoft Skills: Patient advocacy, Critical thinking, Team collaboration`,
  },

  "Medical Assistant": {
    summary: () =>
      `Certified Medical Assistant with [years] years of experience supporting clinical operations in fast-paced healthcare settings. Skilled in patient intake, vital signs, phlebotomy, and EHR documentation. Committed to delivering patient-centered care and supporting physicians in delivering efficient, quality health services.`,
    experience: () =>
      `Medical Assistant | [Clinic/Practice Name] | [City, ST] | [Month Year] – Present\n• Assisted physicians with [X] patient visits per day including vitals, histories, and procedures\n• Performed phlebotomy, EKGs, and specimen collection with [X]% accuracy rate\n• Managed EHR scheduling and documentation in [Epic/AthenaHealth/etc.]\n• Educated patients on treatment plans, medications, and follow-up care\n\nMedical Assistant Extern | [Facility] | [City, ST] | [Month Year] – [Month Year]\n• Completed [X]-hour clinical externship supporting [X] providers\n• Assisted with [procedures/tasks]`,
    education: () =>
      `Medical Assistant Certificate | [School Name] | [City, ST] | [Year]\n• CMA (AAMA) or RMA Certification | [Certification #] | Expires [Year]`,
    skills: () =>
      `Clinical: Phlebotomy, Vital signs, EKG, Injections, Wound care, Sterilization\nAdministrative: Scheduling, Insurance verification, Medical billing basics\nSystems: Epic, AthenaHealth, Kareo, [add more]\nSoft Skills: Patient communication, Attention to detail, Compassion`,
  },

  "Healthcare": {
    summary: () =>
      `Dedicated Healthcare Professional with [years] years of experience providing high-quality patient care in [setting]. Known for clinical expertise, compassionate patient interaction, and strong collaboration with multidisciplinary care teams.`,
    experience: () =>
      `[Job Title] | [Facility Name] | [City, ST] | [Month Year] – Present\n• Delivered patient care for [X] patients per [shift/day] in [setting]\n• Collaborated with physicians and care team to develop and implement care plans\n• Documented patient information accurately in [EHR system]\n\n[Previous Role] | [Facility] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]`,
    education: () =>
      `[Degree/Certification] | [School Name] | [City, ST] | [Year]`,
    skills: () =>
      `Clinical: Patient assessment, Medication administration, [add clinical skills]\nSystems: [EHR system], HIPAA compliance\nSoft Skills: Empathy, Critical thinking, Team collaboration`,
  },

  // ── MARKETING & CREATIVE ─────────────────────────────────────────────────
  "Digital Marketing Specialist": {
    summary: () =>
      `Results-driven Digital Marketing Specialist with [years] years of experience driving growth through SEO, paid media, email campaigns, and social media strategy. Managed ad budgets of $[X]K+ with an average [X]x ROAS. Skilled in data analysis and A/B testing to continuously optimize campaign performance.`,
    experience: () =>
      `Digital Marketing Specialist | [Company Name] | [City, ST] | [Month Year] – Present\n• Managed $[X]K/month Google Ads and Meta campaigns achieving [X]x ROAS\n• Grew organic traffic by [X]% through technical SEO and content strategy\n• Built and optimized email campaigns for [X]K+ subscribers, achieving [X]% open rate\n• Launched [X] A/B tests per quarter, improving conversion rate by [X]%\n\nMarketing Coordinator | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Supported launch of [X] campaigns across [channels]\n• Managed social media calendar and grew following by [X]%`,
    education: () =>
      `B.S. Marketing / Communications | [University Name] | [City, ST] | [Year]`,
    skills: () =>
      `Platforms: Google Ads, Meta Ads, HubSpot, Mailchimp, Salesforce\nAnalytics: Google Analytics 4, Looker Studio, Tableau\nSEO/SEM: SEMrush, Ahrefs, keyword research, technical SEO\nSoft Skills: Data-driven thinking, Copywriting, Project management`,
  },

  "Graphic Designer": {
    summary: () =>
      `Creative Graphic Designer with [years] years of experience delivering compelling visual identities, marketing materials, and digital assets. Expert in [Adobe suite] with a strong eye for typography, color, and brand consistency. Collaborated with cross-functional teams to produce [X]+ projects on time and on brand.`,
    experience: () =>
      `Graphic Designer | [Company/Agency Name] | [City, ST] | [Month Year] – Present\n• Designed [X]+ brand assets, marketing collateral, and digital campaigns\n• Led visual rebrand of [product/company], resulting in [X]% increase in brand recognition\n• Produced motion graphics and video content for social media reaching [X]K impressions\n• Collaborated with marketing team to deliver assets [X]% faster using templated workflows\n\nJunior Designer | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Created print and digital assets for [X] clients across [industries]\n• Assisted senior designers with presentation decks and brand guidelines`,
    education: () =>
      `B.F.A. Graphic Design | [University Name] | [City, ST] | [Year]`,
    skills: () =>
      `Design: Adobe Illustrator, Photoshop, InDesign, After Effects, Figma\nProduction: Print production, Digital ads, Motion graphics, Brand identity\nSoft Skills: Creative problem-solving, Attention to detail, Client communication`,
  },

  "Marketing & Creative": {
    summary: () =>
      `Marketing & Creative professional with [years] years of experience driving brand awareness and audience engagement through strategic campaigns and compelling creative content. Adept at balancing creative vision with data-driven execution.`,
    experience: () =>
      `[Job Title] | [Company Name] | [City, ST] | [Month Year] – Present\n• Developed and executed [X] marketing campaigns achieving [X]% increase in [KPI]\n• Managed [channel/platform] strategy growing audience by [X]%\n• Collaborated with cross-functional teams to deliver projects on time and on budget\n\n[Previous Role] | [Company] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]`,
    education: () =>
      `B.S. Marketing / Communications | [University Name] | [City, ST] | [Year]`,
    skills: () =>
      `Marketing: Campaign management, Content strategy, Social media, Email marketing\nCreative: [Design/Writing tools]\nAnalytics: Google Analytics, [add tools]\nSoft Skills: Creativity, Collaboration, Communication`,
  },

  // ── BUSINESS & FINANCE ───────────────────────────────────────────────────
  "Project Manager": {
    summary: () =>
      `Certified Project Manager with [years] years of experience leading cross-functional teams to deliver complex projects on time and under budget. Managed portfolios of $[X]M+ and teams of [X]+. Expertise in Agile, Scrum, and Waterfall methodologies with a track record of improving delivery efficiency by [X]%.`,
    experience: () =>
      `Project Manager | [Company Name] | [City, ST] | [Month Year] – Present\n• Led [X] concurrent projects totaling $[X]M in scope, delivering [X]% on time\n• Managed cross-functional team of [X] across engineering, design, and operations\n• Implemented Agile processes that reduced sprint velocity variance by [X]%\n• Identified and mitigated [X] project risks, preventing $[X]K in cost overruns\n\nProject Coordinator | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Supported [X] project managers across [X] concurrent projects\n• Maintained project documentation, timelines, and stakeholder communications`,
    education: () =>
      `B.S. Business Administration / [Field] | [University Name] | [City, ST] | [Year]\n• PMP Certification | Project Management Institute | [Year]`,
    skills: () =>
      `Methodologies: Agile, Scrum, Kanban, Waterfall, PRINCE2\nTools: Jira, Asana, MS Project, Monday.com, Confluence\nSkills: Risk management, Stakeholder communication, Budget management\nSoft Skills: Leadership, Negotiation, Problem solving`,
  },

  "Financial Analyst": {
    summary: () =>
      `Detail-oriented Financial Analyst with [years] years of experience in financial modeling, forecasting, and strategic analysis. Delivered insights that supported $[X]M+ in business decisions. Skilled in Excel, SQL, and BI tools with deep knowledge of GAAP, FP&A, and variance analysis.`,
    experience: () =>
      `Financial Analyst | [Company Name] | [City, ST] | [Month Year] – Present\n• Built and maintained financial models supporting $[X]M in annual planning\n• Produced monthly variance analyses identifying $[X]K in cost savings opportunities\n• Collaborated with business units to develop annual budgets and quarterly forecasts\n• Automated reporting processes in Excel/Python, reducing preparation time by [X]%\n\nAnalyst | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Supported FP&A team with data gathering and report preparation\n• Analyzed [X] accounts, identifying [X]% billing discrepancies`,
    education: () =>
      `B.S. Finance / Accounting | [University Name] | [City, ST] | [Year]\n• CFA Level [I/II/III] Candidate | CPA [if applicable]`,
    skills: () =>
      `Technical: Excel (advanced), SQL, Python, Tableau, Power BI, SAP, Oracle\nFinancial: Financial modeling, Budgeting, Forecasting, Variance analysis, GAAP\nSoft Skills: Analytical thinking, Attention to detail, Executive communication`,
  },

  "HR Manager": {
    summary: () =>
      `Strategic HR Manager with [years] years of experience leading talent acquisition, employee relations, and HR operations for organizations of [X]+ employees. Reduced time-to-hire by [X]% and improved retention by [X]% through data-driven HR initiatives and strong employee engagement programs.`,
    experience: () =>
      `HR Manager | [Company Name] | [City, ST] | [Month Year] – Present\n• Led full-cycle recruiting for [X] roles annually, reducing time-to-hire by [X]%\n• Developed and implemented onboarding program improving 90-day retention by [X]%\n• Managed employee relations caseload of [X]+ cases per year, resolving [X]% informally\n• Partnered with leadership on compensation benchmarking and performance management\n\nHR Generalist | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Supported benefits administration for [X] employees\n• Coordinated compliance training achieving [X]% completion rate`,
    education: () =>
      `B.S. Human Resources / Business | [University Name] | [City, ST] | [Year]\n• SHRM-CP or PHR Certification | [Year]`,
    skills: () =>
      `HR Systems: Workday, ADP, BambooHR, Greenhouse, [add more]\nSkills: Talent acquisition, Employee relations, Performance management, Compliance\nLegal: FMLA, ADA, EEO, FLSA compliance\nSoft Skills: Discretion, Conflict resolution, Executive partnership`,
  },

  "Business & Finance": {
    summary: () =>
      `Business professional with [years] years of experience driving operational excellence and financial performance. Known for analytical thinking, stakeholder management, and delivering measurable results in fast-paced environments.`,
    experience: () =>
      `[Job Title] | [Company Name] | [City, ST] | [Month Year] – Present\n• Led [initiative] that improved [metric] by [X]%\n• Managed [budget/project/team] of [size/scope]\n• Collaborated with [stakeholders] to deliver [outcome]\n\n[Previous Role] | [Company] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]`,
    education: () =>
      `B.S. Business Administration / Finance | [University Name] | [City, ST] | [Year]`,
    skills: () =>
      `Business: Strategic planning, Financial analysis, Project management, Operations\nTechnical: Excel, PowerPoint, [ERP system], [add more]\nSoft Skills: Leadership, Communication, Problem solving`,
  },

  // ── SALES & CUSTOMER SUCCESS ─────────────────────────────────────────────
  "Account Executive": {
    summary: () =>
      `High-performing Account Executive with [years] years of B2B sales experience consistently exceeding quota by [X]%. Closed $[X]M+ in new business across [industry verticals]. Skilled in consultative selling, pipeline management, and building long-term client relationships that drive expansion revenue.`,
    experience: () =>
      `Account Executive | [Company Name] | [City, ST] | [Month Year] – Present\n• Closed $[X]M in new ARR in [Year], achieving [X]% of quota\n• Managed pipeline of [X] opportunities with average deal size of $[X]K\n• Reduced sales cycle by [X]% through improved discovery and qualification process\n• Expanded [X] existing accounts by [X]% through upsell and cross-sell motions\n\nSales Development Rep | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Generated [X] qualified opportunities per month, [X]% above team average\n• Exceeded outbound activity targets by [X]% consistently`,
    education: () =>
      `B.S. Business / Communications | [University Name] | [City, ST] | [Year]`,
    skills: () =>
      `Sales: Consultative selling, MEDDIC, SPIN, Outbound prospecting, Negotiation\nTools: Salesforce, HubSpot, Outreach, Gong, LinkedIn Sales Navigator\nSoft Skills: Relationship building, Resilience, Executive presence`,
  },

  "Customer Service Rep": {
    summary: () =>
      `Customer-focused professional with [years] years of experience delivering exceptional service across [phone/chat/email] channels. Maintained [X]% CSAT score and resolved [X]+ tickets per day. Skilled at de-escalating complex situations and building customer loyalty.`,
    experience: () =>
      `Customer Service Representative | [Company Name] | [City, ST] | [Month Year] – Present\n• Handled [X]+ customer inquiries per day across phone, email, and chat channels\n• Maintained [X]% customer satisfaction (CSAT) score above team average of [X]%\n• Resolved complex billing and technical issues with average handle time of [X] min\n• Recognized as top performer [X] months consecutively for quality scores\n\nCustomer Service Associate | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Supported [X] customers daily with order and account inquiries\n• Achieved [X]% first-call resolution rate`,
    education: () =>
      `High School Diploma / B.A. [if applicable] | [School Name] | [Year]`,
    skills: () =>
      `Platforms: Zendesk, Salesforce Service Cloud, Freshdesk, [add more]\nSkills: Active listening, Conflict resolution, Ticket management, Upselling\nSoft Skills: Empathy, Patience, Clear communication`,
  },

  "Sales & Customer Success": {
    summary: () =>
      `Sales and Customer Success professional with [years] years of experience driving revenue growth and client retention. Consistently exceeded targets by [X]% through a consultative approach and focus on long-term value.`,
    experience: () =>
      `[Job Title] | [Company Name] | [City, ST] | [Month Year] – Present\n• Achieved [X]% of quota for [X] consecutive quarters\n• Managed a portfolio of [X] accounts with combined ARR of $[X]M\n• Reduced churn by [X]% through proactive customer success initiatives\n\n[Previous Role] | [Company] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]`,
    education: () =>
      `B.S. Business / Communications | [University Name] | [City, ST] | [Year]`,
    skills: () =>
      `Sales: Prospecting, Negotiation, Pipeline management, CRM management\nTools: Salesforce, HubSpot, [add more]\nSoft Skills: Relationship building, Persuasion, Active listening`,
  },

  // ── ENGINEERING & TRADES ─────────────────────────────────────────────────
  "Mechanical Engineer": {
    summary: () =>
      `Innovative Mechanical Engineer with [years] years of experience in product design, analysis, and manufacturing. Proficient in CAD, FEA, and engineering standards. Led development of [X] products from concept to production, reducing manufacturing costs by [X]% while meeting all performance requirements.`,
    experience: () =>
      `Mechanical Engineer | [Company Name] | [City, ST] | [Month Year] – Present\n• Designed and validated [product/component] using SolidWorks and FEA, reducing weight by [X]%\n• Led cross-functional team of [X] engineers through full product development lifecycle\n• Reduced manufacturing defects by [X]% through design-for-manufacturability analysis\n• Managed supplier relationships for [X] components with annual spend of $[X]M\n\nDesign Engineer | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Developed [X] component designs meeting ASME/ISO standards\n• Supported failure analysis and corrective action for [X] field issues`,
    education: () =>
      `B.S. Mechanical Engineering | [University Name] | [City, ST] | [Year]\n• PE License (if applicable) | State: [State] | [Year]`,
    skills: () =>
      `CAD/CAE: SolidWorks, AutoCAD, CATIA, ANSYS, MATLAB\nEngineering: FEA, GD&T, DFM, Tolerance analysis, Thermodynamics\nStandards: ASME, ISO, ASTM\nSoft Skills: Technical communication, Cross-functional collaboration, Problem solving`,
  },

  "Electrician": {
    summary: () =>
      `Licensed Electrician with [years] years of experience in commercial and residential electrical systems installation, maintenance, and troubleshooting. Committed to safety, code compliance, and delivering quality workmanship on every project. Experienced in [low voltage / high voltage / industrial / etc.].`,
    experience: () =>
      `Journeyman Electrician | [Company Name] | [City, ST] | [Month Year] – Present\n• Installed and maintained electrical systems for [X] commercial/residential projects\n• Troubleshot and repaired [electrical systems], reducing downtime by [X]%\n• Ensured all work met NEC code requirements and passed [X] inspections without deficiencies\n• Mentored [X] apprentices in safe electrical practices and code compliance\n\nElectrician Apprentice | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• Completed [X]-hour apprenticeship program\n• Assisted with [type] installations and gained proficiency in [skills]`,
    education: () =>
      `[State] Journeyman Electrician License | License #[XXXXX] | [Year]\nElectrician Apprenticeship | [IBEW Local / Trade School] | [City, ST] | [Year]`,
    skills: () =>
      `Technical: NEC code compliance, Conduit bending, Panel installation, Troubleshooting\nSystems: Commercial, Residential, Industrial, Low voltage, Fire alarm\nTools: Multimeters, Power tools, Blueprint reading\nSoft Skills: Safety-first mindset, Reliability, Attention to detail`,
  },

  "Engineering & Trades": {
    summary: () =>
      `Engineering and Trades professional with [years] years of hands-on experience in [specialty]. Known for technical precision, commitment to safety, and delivering quality workmanship on complex projects.`,
    experience: () =>
      `[Job Title] | [Company Name] | [City, ST] | [Month Year] – Present\n• Completed [X] projects totaling $[X]M on time and within budget\n• Improved [process/system] resulting in [X]% efficiency gain\n• Maintained [X]% safety record with zero lost-time incidents\n\n[Previous Role] | [Company] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]`,
    education: () =>
      `[Degree/License/Certification] | [School/Issuer] | [City, ST] | [Year]`,
    skills: () =>
      `Technical: [Primary technical skills], [tools/equipment]\nCodes/Standards: [applicable codes]\nSoft Skills: Precision, Problem solving, Safety awareness`,
  },

  // ── EDUCATION ────────────────────────────────────────────────────────────
  "Teacher": {
    summary: () =>
      `Passionate educator with [years] years of experience teaching [subject(s)] to [grade level] students. Designed engaging, standards-aligned curriculum that improved student achievement scores by [X]%. Committed to creating inclusive learning environments where all students can thrive.`,
    experience: () =>
      `[Subject] Teacher | [School Name] | [City, ST] | [Month Year] – Present\n• Developed and delivered [subject] curriculum for [X] students per year in grades [X–X]\n• Improved standardized test scores by [X]% through differentiated instruction strategies\n• Collaborated with special education staff to support [X] IEP students\n• Mentored [X] student teachers and contributed to school-wide professional development\n\n[Teaching Assistant / Previous Role] | [School] | [City, ST] | [Month Year] – [Month Year]\n• Supported lead teacher in classroom management and small-group instruction\n• Tutored [X] struggling students, improving [metric] by [X]%`,
    education: () =>
      `B.A./B.S. [Subject] Education | [University Name] | [City, ST] | [Year]\n• Teaching License/Credential | [State] | License #[XXXXX] | Expires [Year]`,
    skills: () =>
      `Instruction: Differentiated instruction, Project-based learning, Formative assessment\nCurriculum: [Standards, e.g., Common Core], Lesson planning, IEP collaboration\nTechnology: Google Classroom, Canvas, Schoology, [add more]\nSoft Skills: Patience, Communication, Classroom management`,
  },

  "Education": {
    summary: () =>
      `Education professional with [years] years of experience creating impactful learning experiences. Skilled at developing curriculum, building relationships with students and families, and collaborating with colleagues to achieve school-wide goals.`,
    experience: () =>
      `[Job Title] | [School/Institution] | [City, ST] | [Month Year] – Present\n• Supported learning for [X] students, improving outcomes by [X]%\n• Developed and implemented [curriculum/program] in [subject/area]\n• Collaborated with faculty and administration on [initiative]\n\n[Previous Role] | [Institution] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]`,
    education: () =>
      `[Degree] | [University Name] | [City, ST] | [Year]\n• Teaching License/Credential | [State] | [Year]`,
    skills: () =>
      `Education: Curriculum development, Classroom management, Assessment design\nTechnology: [LMS], Google Classroom, [add more]\nSoft Skills: Patience, Communication, Empathy`,
  },

  // ── LOGISTICS ────────────────────────────────────────────────────────────
  "Logistics & Transportation": {
    summary: () =>
      `Logistics professional with [years] years of experience managing supply chain operations, transportation coordination, and warehouse management. Reduced operational costs by [X]% through process optimization and vendor management. Known for accuracy, efficiency, and effective cross-team communication.`,
    experience: () =>
      `[Job Title] | [Company Name] | [City, ST] | [Month Year] – Present\n• Coordinated [inbound/outbound] logistics for [X] shipments per [day/week]\n• Reduced transportation costs by [X]% through carrier optimization and route planning\n• Maintained [X]% on-time delivery rate managing [X]+ vendor relationships\n• Implemented [process/system] that improved warehouse efficiency by [X]%\n\n[Previous Role] | [Company] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]`,
    education: () =>
      `B.S. Supply Chain Management / Logistics | [University Name] | [City, ST] | [Year]`,
    skills: () =>
      `Logistics: Supply chain management, Inventory control, Freight coordination, WMS\nSystems: SAP, Oracle TMS, [add more]\nSoft Skills: Organization, Attention to detail, Vendor negotiation`,
  },

  // ── LEGAL ────────────────────────────────────────────────────────────────
  "Legal & Compliance": {
    summary: () =>
      `Legal and Compliance professional with [years] years of experience advising on regulatory requirements, contract management, and risk mitigation. Successfully managed compliance programs across [X] jurisdictions, reducing legal risk exposure by [X]%. Known for meticulous attention to detail and clear communication of complex legal matters.`,
    experience: () =>
      `[Job Title] | [Company/Firm Name] | [City, ST] | [Month Year] – Present\n• Managed compliance program across [X] regulatory frameworks including [GDPR/SOX/HIPAA/etc.]\n• Drafted and negotiated [X]+ contracts, reducing review cycle by [X]%\n• Conducted internal audits identifying [X] compliance gaps and developed remediation plans\n• Provided legal guidance to [X] business units on [areas]\n\n[Previous Role] | [Company/Firm] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]`,
    education: () =>
      `J.D. | [Law School Name] | [City, ST] | [Year]\nB.A. [Pre-law field] | [University Name] | [City, ST] | [Year]\n• Bar Admission: [State] | [Year]`,
    skills: () =>
      `Legal: Contract drafting, Regulatory compliance, Risk assessment, Legal research\nFrameworks: [GDPR, SOX, HIPAA, as applicable]\nTools: Westlaw, LexisNexis, [CLM software]\nSoft Skills: Analytical thinking, Discretion, Stakeholder communication`,
  },

  // ── GENERAL USE ──────────────────────────────────────────────────────────
  "Student Resume": {
    summary: () =>
      `Motivated [major/field of study] student at [University] seeking [internship/entry-level role] in [field]. Strong academic foundation in [relevant subjects] with hands-on experience through coursework, projects, and [internship/work/volunteer]. Eager to contribute [skills] and grow in a professional environment.`,
    experience: () =>
      `[Internship/Part-Time Job Title] | [Company/Organization] | [City, ST] | [Month Year] – [Month Year]\n• [What you did and what you learned]\n• [Any measurable result, even small ones count]\n• Collaborated with [team/colleagues] on [project/task]\n\n[Campus Job / Club Role / Volunteer] | [Organization] | [City, ST] | [Month Year] – Present\n• [Leadership or responsibility]\n• [Achievement or contribution]`,
    education: () =>
      `B.S./B.A. [Major] | [University Name] | [City, ST] | Expected [Year]\n• GPA: [X.X]/4.0  •  Dean's List [semesters]\n• Relevant Coursework: [Course 1], [Course 2], [Course 3]\n• Activities: [Club], [Organization], [Honor Society]`,
    skills: () =>
      `Technical: [Programming/software skills], Microsoft Office, Google Suite\nField-specific: [Skills from coursework or projects]\nSoft Skills: Quick learner, Teamwork, Time management, Research`,
  },

  "No Experience": {
    summary: () =>
      `Motivated and reliable professional seeking to launch a career in [field/industry]. Bring a strong work ethic, eagerness to learn, and transferable skills in [communication/organization/customer service/etc.] developed through [school, volunteer work, personal projects]. Committed to delivering value and growing with a team.`,
    experience: () =>
      `Volunteer | [Organization Name] | [City, ST] | [Month Year] – Present\n• [What you did and what you contributed]\n• Demonstrated reliability and responsibility in [context]\n\n[School Project / Personal Project] | [Class or Self-Directed] | [Year]\n• [What you built or accomplished]\n• [Skills you used or developed]`,
    education: () =>
      `[Degree / High School Diploma / GED] | [School Name] | [City, ST] | [Year]\n• [Relevant coursework, honors, or activities if applicable]`,
    skills: () =>
      `Technical: [Any software or tools you know], Microsoft Office, Google Suite\nSoft Skills: Communication, Reliability, Willingness to learn, Teamwork`,
  },

  "General Resume": {
    summary: () =>
      `Dedicated professional with [years] years of experience in [field/industry]. Known for [key strength 1], [key strength 2], and a track record of [achievement]. Seeking to bring [skills] and [value] to a team committed to [goal].`,
    experience: () =>
      `[Job Title] | [Company Name] | [City, ST] | [Month Year] – Present\n• [Key achievement with measurable result]\n• [Second achievement with impact]\n• Collaborated with [team/stakeholders] to deliver [outcome]\n\n[Previous Job Title] | [Previous Company] | [City, ST] | [Month Year] – [Month Year]\n• [Key achievement 1]\n• [Key achievement 2]`,
    education: () =>
      `[Degree] | [University/School Name] | [City, ST] | [Year]`,
    skills: () =>
      `Technical: [Primary tools/software]\nProfessional: [Domain skills]\nSoft Skills: Communication, Problem solving, Adaptability`,
  },
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function generateTemplate(data, role, category) {
  const t = TEMPLATES[role] || TEMPLATES[category] || TEMPLATES["General Resume"];
  const name = data.name || "Your Name";
  return {
    summary: t.summary(name, role),
    experience: t.experience(name, role),
    education: t.education(name, role),
    skills: t.skills(role, category),
    certifications: "",
    projects: "",
    volunteer: "",
  };
}
