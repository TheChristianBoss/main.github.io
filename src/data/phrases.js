const rolePhrases = {

  // ── GENERAL ──────────────────────────────────────────────────────────────

  "General Resume": [
    "strong communication skills",
    "team player",
    "detail oriented",
    "results driven",
    "problem solving",
    "time management",
  ],

  "Entry Level": [
    "eager to learn",
    "team player",
    "strong work ethic",
    "attention to detail",
    "fast learner",
  ],

  "Student Resume": [
    "academic excellence",
    "extracurricular activities",
    "collaborative projects",
    "hands on experience",
    "strong foundation",
  ],

  // ── TECHNOLOGY & IT ───────────────────────────────────────────────────────

  "Software Engineer": [
    "scalable software solutions",
    "agile development",
    "code review",
    "software development lifecycle",
    "version control",
    "unit testing",
    "cross functional collaboration",
    "system design",
    "continuous integration",
    "technical documentation",
  ],

  "Frontend Developer": [
    "responsive design",
    "state management",
    "cross browser compatibility",
    "rest api integration",
    "component based architecture",
    "user interface optimization",
    "performance optimization",
    "agile development",
    "accessibility standards",
    "pixel perfect implementation",
  ],

  "Backend Developer": [
    "restful services",
    "database optimization",
    "api development",
    "server side logic",
    "authentication systems",
    "microservices architecture",
    "cloud infrastructure",
    "scalable backend",
    "data modeling",
    "security best practices",
  ],

  "Full Stack Developer": [
    "end to end development",
    "frontend and backend",
    "database management",
    "api integration",
    "responsive web applications",
    "deployment pipelines",
    "full stack architecture",
    "agile methodology",
    "version control",
  ],

  "Web Developer": [
    "responsive design",
    "cross browser compatibility",
    "user experience",
    "web performance",
    "accessibility standards",
    "seo best practices",
    "mobile first design",
  ],

  "Data Analyst": [
    "data visualization",
    "business intelligence",
    "data driven decisions",
    "statistical analysis",
    "dashboard reporting",
    "data cleaning",
    "trend analysis",
    "stakeholder reporting",
    "actionable insights",
  ],

  "Data Scientist": [
    "predictive modeling",
    "machine learning models",
    "statistical analysis",
    "data driven insights",
    "feature engineering",
    "model evaluation",
    "exploratory data analysis",
    "a b testing",
    "data pipelines",
  ],

  "AI/ML Engineer": [
    "machine learning pipelines",
    "model training and evaluation",
    "deep learning architecture",
    "natural language processing",
    "large language models",
    "neural network design",
    "mlops best practices",
    "data preprocessing",
    "model deployment",
  ],

  "DevOps Engineer": [
    "continuous integration",
    "continuous deployment",
    "infrastructure as code",
    "container orchestration",
    "automated pipelines",
    "monitoring and alerting",
    "cloud cost optimization",
    "release management",
    "site reliability",
  ],

  "Cloud Engineer": [
    "cloud infrastructure",
    "infrastructure as code",
    "cloud cost optimization",
    "high availability",
    "disaster recovery",
    "auto scaling",
    "cloud security",
    "multi cloud architecture",
  ],

  "Cybersecurity Analyst": [
    "security monitoring",
    "vulnerability assessment",
    "incident response",
    "risk management",
    "security protocols",
    "threat detection",
    "security audits",
    "penetration testing",
    "compliance frameworks",
  ],

  "QA Tester": [
    "test case development",
    "automated testing",
    "regression testing",
    "defect tracking",
    "end to end testing",
    "quality assurance processes",
    "test driven development",
    "continuous testing",
  ],

  "UI/UX Designer": [
    "user centered design",
    "usability testing",
    "design systems",
    "wireframing and prototyping",
    "user research",
    "interaction design",
    "visual hierarchy",
    "accessibility compliance",
    "responsive layouts",
  ],

  "Mobile App Developer": [
    "cross platform development",
    "native mobile apps",
    "app store deployment",
    "mobile performance optimization",
    "push notifications",
    "offline functionality",
    "api integration",
  ],

  "Network Engineer": [
    "network infrastructure",
    "network security",
    "routing and switching",
    "vpn configuration",
    "network troubleshooting",
    "bandwidth optimization",
    "firewall management",
  ],

  "IT Support Specialist": [
    "technical support",
    "help desk operations",
    "user troubleshooting",
    "system administration",
    "network connectivity",
    "remote support",
    "ticket resolution",
  ],

  "Database Administrator": [
    "database optimization",
    "backup and recovery",
    "query performance tuning",
    "database security",
    "high availability",
    "data integrity",
    "schema design",
  ],

  "Systems Administrator": [
    "system administration",
    "server management",
    "patch management",
    "user access control",
    "backup and recovery",
    "network monitoring",
    "system performance",
  ],

  "Embedded Systems Engineer": [
    "firmware development",
    "real time systems",
    "hardware software integration",
    "low level programming",
    "embedded linux",
    "peripheral interfaces",
    "power optimization",
  ],

  "Blockchain Developer": [
    "smart contract development",
    "decentralized applications",
    "blockchain architecture",
    "web3 integration",
    "token standards",
    "consensus mechanisms",
    "security auditing",
  ],

  // ── HEALTHCARE ────────────────────────────────────────────────────────────

  "Registered Nurse": [
    "patient centered care",
    "clinical assessments",
    "medication administration",
    "care coordination",
    "electronic health records",
    "evidence based practice",
    "interdisciplinary collaboration",
    "patient education",
  ],

  "Medical Assistant": [
    "patient intake",
    "vital signs monitoring",
    "clinical procedures",
    "electronic medical records",
    "patient scheduling",
    "hipaa compliance",
    "patient communication",
  ],

  "Physician": [
    "patient diagnosis",
    "treatment planning",
    "clinical decision making",
    "evidence based medicine",
    "patient education",
    "interdisciplinary care",
    "electronic health records",
  ],

  "Caregiver": [
    "personal care assistance",
    "patient support",
    "daily living activities",
    "compassionate care",
    "safety monitoring",
    "family communication",
  ],

  "Pharmacist": [
    "medication dispensing",
    "drug interaction review",
    "patient counseling",
    "prescription verification",
    "hipaa compliance",
    "clinical consultation",
  ],

  "Physical Therapist": [
    "rehabilitation programs",
    "patient assessment",
    "treatment planning",
    "therapeutic exercises",
    "functional mobility",
    "patient education",
    "progress documentation",
  ],

  "Healthcare Administrator": [
    "healthcare operations",
    "regulatory compliance",
    "staff management",
    "patient satisfaction",
    "budget management",
    "quality improvement",
  ],

  "Medical Coder": [
    "medical coding accuracy",
    "icd 10 coding",
    "hipaa compliance",
    "billing and reimbursement",
    "documentation review",
    "coding audits",
  ],

  // ── MARKETING & CREATIVE ──────────────────────────────────────────────────

  "Digital Marketing Specialist": [
    "digital marketing campaigns",
    "search engine optimization",
    "pay per click advertising",
    "social media marketing",
    "conversion rate optimization",
    "email marketing campaigns",
    "data driven marketing",
    "audience segmentation",
    "marketing analytics",
  ],

  "SEO Specialist": [
    "search engine optimization",
    "keyword research",
    "on page optimization",
    "link building",
    "technical seo",
    "organic traffic growth",
    "content optimization",
    "search ranking improvement",
  ],

  "Copywriter": [
    "compelling content",
    "brand voice",
    "persuasive writing",
    "content strategy",
    "seo optimized copy",
    "audience engagement",
    "editorial standards",
    "clear communication",
  ],

  "Social Media Manager": [
    "social media strategy",
    "content calendar",
    "audience engagement",
    "brand awareness",
    "community management",
    "paid social campaigns",
    "influencer marketing",
    "analytics reporting",
  ],

  "Content Strategist": [
    "content strategy development",
    "editorial calendar",
    "audience research",
    "seo content",
    "brand storytelling",
    "content performance",
    "cross channel content",
  ],

  "Brand Manager": [
    "brand identity",
    "go to market strategy",
    "brand positioning",
    "campaign management",
    "market research",
    "cross functional collaboration",
    "brand guidelines",
  ],

  "Graphic Designer": [
    "visual design",
    "brand identity",
    "print and digital design",
    "design systems",
    "creative direction",
    "typography and layout",
    "client collaboration",
  ],

  "Video Editor": [
    "video post production",
    "color grading",
    "motion graphics",
    "storytelling through video",
    "audio editing",
    "content delivery",
    "multi platform video",
  ],

  "Email Marketing Specialist": [
    "email campaign strategy",
    "audience segmentation",
    "a b testing",
    "email automation",
    "open rate optimization",
    "conversion tracking",
    "drip campaigns",
  ],

  "Growth Marketer": [
    "growth hacking",
    "conversion rate optimization",
    "a b testing",
    "user acquisition",
    "retention strategies",
    "funnel optimization",
    "data driven growth",
  ],

  // ── BUSINESS & FINANCE ────────────────────────────────────────────────────

  "Accountant": [
    "financial reporting",
    "general ledger",
    "month end close",
    "accounts payable",
    "accounts receivable",
    "tax preparation",
    "financial analysis",
    "gaap compliance",
  ],

  "Financial Analyst": [
    "financial modeling",
    "variance analysis",
    "budget forecasting",
    "investment analysis",
    "financial reporting",
    "data driven insights",
    "cost benefit analysis",
  ],

  "Business Analyst": [
    "requirements gathering",
    "process improvement",
    "data analysis",
    "stakeholder management",
    "use case development",
    "gap analysis",
    "business process mapping",
  ],

  "Project Manager": [
    "project planning",
    "stakeholder management",
    "risk mitigation",
    "agile methodologies",
    "on time delivery",
    "budget management",
    "cross functional teams",
    "project lifecycle",
  ],

  "Product Manager": [
    "product roadmap",
    "go to market strategy",
    "user research",
    "feature prioritization",
    "agile development",
    "stakeholder alignment",
    "product lifecycle",
    "key performance indicators",
  ],

  "HR Manager": [
    "talent acquisition",
    "employee relations",
    "performance management",
    "hr compliance",
    "onboarding programs",
    "compensation and benefits",
    "workforce planning",
  ],

  "Recruiter": [
    "talent sourcing",
    "candidate pipeline",
    "interview process",
    "employer branding",
    "diversity hiring",
    "offer negotiation",
    "applicant tracking",
  ],

  "Operations Manager": [
    "operational efficiency",
    "process improvement",
    "cross functional leadership",
    "kpi tracking",
    "resource allocation",
    "strategic planning",
    "continuous improvement",
  ],

  "Supply Chain Analyst": [
    "supply chain optimization",
    "demand forecasting",
    "vendor management",
    "inventory control",
    "cost reduction",
    "data analysis",
    "logistics coordination",
  ],

  "Management Consultant": [
    "strategic consulting",
    "business transformation",
    "process improvement",
    "executive presentations",
    "stakeholder engagement",
    "data driven recommendations",
    "change management",
  ],

  // ── SALES & CUSTOMER SUCCESS ──────────────────────────────────────────────

  "Sales Representative": [
    "quota attainment",
    "lead generation",
    "pipeline management",
    "client relationship management",
    "sales presentations",
    "closing deals",
    "territory management",
  ],

  "Account Executive": [
    "revenue generation",
    "account management",
    "sales cycle management",
    "executive presentations",
    "closing complex deals",
    "upselling and cross selling",
    "client retention",
  ],

  "Customer Service Representative": [
    "customer satisfaction",
    "issue resolution",
    "active listening",
    "positive customer experience",
    "escalation handling",
    "product knowledge",
    "first call resolution",
  ],

  "Customer Success Manager": [
    "customer onboarding",
    "churn reduction",
    "relationship building",
    "renewal management",
    "customer health scores",
    "upselling and expansion",
    "executive business reviews",
  ],

  "Real Estate Agent": [
    "property listings",
    "client representation",
    "market analysis",
    "contract negotiation",
    "buyer consultation",
    "seller representation",
    "closing transactions",
  ],

  "Business Development Manager": [
    "new business development",
    "strategic partnerships",
    "revenue growth",
    "market expansion",
    "pipeline development",
    "executive relationships",
    "go to market strategy",
  ],

  // ── ENGINEERING & TRADES ──────────────────────────────────────────────────

  "Mechanical Engineer": [
    "product design and development",
    "engineering analysis",
    "manufacturing processes",
    "design for manufacturability",
    "quality assurance",
    "project management",
    "technical documentation",
  ],

  "Electrical Engineer": [
    "circuit design",
    "electrical systems",
    "power distribution",
    "system integration",
    "technical specifications",
    "safety compliance",
    "testing and validation",
  ],

  "Civil Engineer": [
    "structural design",
    "project management",
    "site assessment",
    "construction oversight",
    "regulatory compliance",
    "technical drawings",
    "environmental impact",
  ],

  "Electrician": [
    "electrical installation",
    "code compliance",
    "troubleshooting electrical systems",
    "blueprint reading",
    "safety standards",
    "preventive maintenance",
  ],

  "HVAC Technician": [
    "hvac installation",
    "preventive maintenance",
    "system troubleshooting",
    "epa certification",
    "residential and commercial hvac",
    "refrigerant handling",
  ],

  "Construction Manager": [
    "construction project management",
    "subcontractor management",
    "osha compliance",
    "budget and schedule management",
    "quality control",
    "site safety",
    "blueprint review",
  ],

  // ── EDUCATION ─────────────────────────────────────────────────────────────

  "Teacher": [
    "lesson planning",
    "student engagement",
    "differentiated instruction",
    "classroom management",
    "formative assessment",
    "parent communication",
    "collaborative learning",
    "curriculum development",
  ],

  "School Counselor": [
    "student support",
    "crisis intervention",
    "college counseling",
    "social emotional learning",
    "individualized plans",
    "parent and teacher collaboration",
  ],

  "Instructional Designer": [
    "curriculum design",
    "e learning development",
    "learning management systems",
    "instructional strategies",
    "blended learning",
    "assessment design",
    "adult learning principles",
  ],

  "Professor": [
    "course development",
    "academic research",
    "peer reviewed publications",
    "student mentorship",
    "grant writing",
    "curriculum design",
    "classroom instruction",
  ],

  // ── LOGISTICS & TRANSPORTATION ────────────────────────────────────────────

  "Truck Driver": [
    "safe driving record",
    "dot compliance",
    "route planning",
    "cargo inspection",
    "hours of service",
    "vehicle maintenance",
    "on time delivery",
  ],

  "Warehouse Associate": [
    "inventory management",
    "order fulfillment",
    "safety compliance",
    "shipping and receiving",
    "forklift operation",
    "warehouse organization",
  ],

  "Logistics Coordinator": [
    "shipment coordination",
    "vendor communication",
    "supply chain visibility",
    "freight management",
    "inventory tracking",
    "on time delivery",
  ],

  "Supply Chain Manager": [
    "supply chain strategy",
    "vendor negotiation",
    "demand planning",
    "inventory optimization",
    "logistics management",
    "cost reduction",
    "cross functional leadership",
  ],

  // ── LEGAL & COMPLIANCE ────────────────────────────────────────────────────

  "Paralegal": [
    "legal research",
    "document preparation",
    "case management",
    "discovery process",
    "legal compliance",
    "client communication",
    "court filings",
  ],

  "Compliance Officer": [
    "regulatory compliance",
    "risk assessment",
    "compliance audits",
    "policy development",
    "training programs",
    "regulatory reporting",
    "internal investigations",
  ],

  "Contract Manager": [
    "contract negotiation",
    "contract lifecycle management",
    "risk mitigation",
    "vendor agreements",
    "compliance review",
    "legal drafting",
  ],

  "Legal Assistant": [
    "legal documentation",
    "case file management",
    "legal research",
    "client scheduling",
    "court correspondence",
    "document filing",
  ],
};

export default rolePhrases;

// appended to fill remaining gaps

const extraPhrases = {
  "General ATS Check": [
    "strong communication skills",
    "team player",
    "results driven",
    "attention to detail",
    "problem solving",
  ],
  "No Experience": [
    "eager to learn",
    "strong work ethic",
    "quick learner",
    "team oriented",
    "motivated self starter",
  ],
  "Dental Hygienist": [
    "patient oral health",
    "dental charting",
    "preventive care",
    "patient education",
    "infection control",
    "radiograph interpretation",
  ],
  "Radiologic Technologist": [
    "diagnostic imaging",
    "patient positioning",
    "radiation safety",
    "image quality",
    "hipaa compliance",
    "equipment operation",
  ],
  "Insurance Agent": [
    "policy recommendations",
    "client needs assessment",
    "coverage explanation",
    "claims assistance",
    "relationship management",
    "sales targets",
  ],
  "Retail Associate": [
    "customer satisfaction",
    "product knowledge",
    "point of sale",
    "inventory management",
    "upselling techniques",
    "team collaboration",
  ],
  "Chemical Engineer": [
    "process design",
    "safety compliance",
    "quality control",
    "process optimization",
    "laboratory analysis",
    "plant operations",
  ],
  "Plumber": [
    "pipe installation",
    "residential plumbing",
    "code compliance",
    "leak detection",
    "system maintenance",
    "customer service",
  ],
  "Welder": [
    "precision welding",
    "blueprint reading",
    "weld quality inspection",
    "safety compliance",
    "fabrication techniques",
    "equipment maintenance",
  ],
  "Tutor": [
    "individualized instruction",
    "student progress",
    "concept reinforcement",
    "study strategies",
    "academic support",
    "positive learning environment",
  ],
  "Education Administrator": [
    "school operations",
    "staff leadership",
    "regulatory compliance",
    "budget oversight",
    "curriculum support",
    "community engagement",
  ],
  "Delivery Driver": [
    "on time delivery",
    "safe driving record",
    "route optimization",
    "customer interaction",
    "package handling",
    "dot compliance",
  ],
  "Fleet Manager": [
    "fleet operations",
    "vehicle maintenance schedules",
    "safety compliance",
    "cost control",
    "driver management",
    "gps tracking",
  ],
};

// Merge into main export
Object.assign(rolePhrases, extraPhrases);
