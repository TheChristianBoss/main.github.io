export const normalizeKeyword = (word) => {
  return word
    .toLowerCase()

    // JS frameworks
    .replaceAll("react.js", "react")
    .replaceAll("reactjs", "react")
    .replaceAll("node.js", "node")
    .replaceAll("nodejs", "node")
    .replaceAll("next.js", "nextjs")
    .replaceAll("vue.js", "vue")
    .replaceAll("vuejs", "vue")
    .replaceAll("express.js", "express")
    .replaceAll("expressjs", "express")

    // Multi-word tech terms
    .replaceAll("machine learning", "machinelearning")
    .replaceAll("deep learning", "deeplearning")
    .replaceAll("neural network", "neuralnetwork")
    .replaceAll("neural networks", "neuralnetwork")
    .replaceAll("natural language processing", "nlp")
    .replaceAll("react native", "reactnative")
    .replaceAll("ci/cd", "cicd")
    .replaceAll("ci / cd", "cicd")
    .replaceAll("tcp/ip", "tcpip")
    .replaceAll("tcp ip", "tcpip")
    .replaceAll("power bi", "powerbi")
    .replaceAll("google ads", "googleads")
    .replaceAll("google analytics", "googleanalytics")
    .replaceAll("a/b testing", "abtesting")
    .replaceAll("a/b test", "abtesting")
    .replaceAll("real estate", "realestate")
    .replaceAll("lesson planning", "lessonplanning")
    .replaceAll("patient care", "patientcare")
    .replaceAll("electronic health records", "ehr")
    .replaceAll("electronic medical records", "emr")
    .replaceAll("active directory", "activedirectory")
    .replaceAll("active_directory", "activedirectory")
    .replaceAll("customer service", "customerservice")
    .replaceAll("customer_service", "customerservice")
    .replaceAll("customer success", "customersuccess")
    .replaceAll("social media", "socialmedia")
    .replaceAll("email marketing", "emailmarketing")
    .replaceAll("supply chain", "supplychain")
    .replaceAll("cross-functional", "crossfunctional")
    .replaceAll("cross functional", "crossfunctional")
    .replaceAll("solid works", "solidworks")
    .replaceAll("auto cad", "autocad")
    .replaceAll("quick books", "quickbooks")
    .replaceAll("smart contracts", "smartcontracts")
    .replaceAll("smart contract", "smartcontracts")
    .replaceAll("load balancing", "loadbalancing")
    .replaceAll("load balancer", "loadbalancing")
    .replaceAll("version control", "versioncontrol")
    .replaceAll("unit testing", "unittesting")
    .replaceAll("end to end", "endtoend")
    .replaceAll("end-to-end", "endtoend")
    .replaceAll("root cause analysis", "rootcauseanalysis")
    .replaceAll("root cause", "rootcause")
    .replaceAll("business intelligence", "businessintelligence")
    .replaceAll("project management", "projectmanagement")
    .replaceAll("data visualization", "datavisualization")
    .replaceAll("data analysis", "dataanalysis")
    .replaceAll("data engineering", "dataengineering")
    .replaceAll("data pipeline", "datapipeline")
    .replaceAll("data pipelines", "datapipeline")
    .replaceAll("search engine optimization", "seo")
    .replaceAll("pay per click", "ppc")
    .replaceAll("adobe premiere", "adobepremiere")
    .replaceAll("adobe photoshop", "photoshop")
    .replaceAll("adobe illustrator", "illustrator")
    .replaceAll("adobe indesign", "indesign")
    .replaceAll("after effects", "aftereffects")
    .replaceAll("final cut", "finalcut")

    .replace(/\s+/g, " ")
    .trim();
};

const roleKeywords = {

  // ── GENERAL ──────────────────────────────────────────────────────────────

  "General Resume": {
    critical: {
      communication: 9,
      teamwork: 9,
      leadership: 8,
      organization: 8,
      problemsolving: 8,
    },
    optional: {
      microsoft: 6,
      excel: 6,
      adaptability: 6,
      multitasking: 6,
      collaboration: 7,
    },
  },

  "General ATS Check": {
    critical: {
      communication: 9,
      teamwork: 8,
      organization: 8,
      leadership: 7,
    },
    optional: {
      excel: 6,
      microsoft: 6,
      adaptability: 6,
    },
  },

  "Entry Level": {
    critical: {
      communication: 9,
      teamwork: 9,
      motivated: 7,
      organized: 7,
      learning: 7,
    },
    optional: {
      excel: 6,
      internship: 7,
      volunteer: 6,
      education: 7,
      gpa: 5,
    },
  },

  "No Experience": {
    critical: {
      communication: 9,
      teamwork: 8,
      motivated: 8,
      education: 7,
    },
    optional: {
      volunteer: 7,
      projects: 6,
      certifications: 6,
      learning: 6,
    },
  },

  "Student Resume": {
    critical: {
      education: 10,
      gpa: 7,
      communication: 8,
      teamwork: 8,
    },
    optional: {
      internship: 8,
      projects: 7,
      volunteer: 6,
      research: 6,
      leadership: 6,
    },
  },

  // ── TECHNOLOGY & IT ───────────────────────────────────────────────────────

  "Software Engineer": {
    critical: {
      javascript: 10,
      python: 10,
      java: 9,
      algorithms: 9,
      datastructures: 9,
      git: 8,
      api: 8,
      sql: 8,
      testing: 8,
    },
    optional: {
      react: 7,
      node: 7,
      aws: 7,
      docker: 7,
      agile: 7,
      typescript: 8,
      debugging: 7,
      cicd: 6,
      microservices: 6,
    },
  },

  "Frontend Developer": {
    critical: {
      react: 10,
      javascript: 10,
      html: 10,
      css: 10,
      typescript: 9,
      responsive: 8,
    },
    optional: {
      ui: 8,
      ux: 7,
      redux: 7,
      vite: 6,
      nextjs: 7,
      accessibility: 7,
      figma: 6,
      vue: 6,
      tailwind: 6,
      webpack: 6,
      testing: 7,
      git: 7,
    },
  },

  "Backend Developer": {
    critical: {
      node: 10,
      api: 10,
      sql: 9,
      authentication: 9,
      security: 8,
      databases: 9,
      rest: 8,
    },
    optional: {
      express: 8,
      mongodb: 8,
      docker: 7,
      aws: 7,
      microservices: 8,
      postgresql: 8,
      redis: 7,
      graphql: 7,
      python: 7,
      cicd: 6,
    },
  },

  "Full Stack Developer": {
    critical: {
      react: 10,
      node: 10,
      javascript: 10,
      api: 9,
      sql: 8,
      git: 8,
      typescript: 8,
    },
    optional: {
      mongodb: 7,
      docker: 7,
      aws: 7,
      frontend: 7,
      backend: 7,
      graphql: 6,
      nextjs: 7,
      postgresql: 7,
      cicd: 6,
      testing: 7,
    },
  },

  "Web Developer": {
    critical: {
      html: 10,
      css: 10,
      javascript: 10,
      responsive: 9,
      git: 8,
    },
    optional: {
      react: 8,
      wordpress: 7,
      php: 7,
      sql: 7,
      ui: 7,
      figma: 6,
      seo: 6,
      accessibility: 7,
      vue: 6,
    },
  },

  "Data Analyst": {
    critical: {
      excel: 10,
      sql: 10,
      python: 9,
      analytics: 9,
      reporting: 9,
      datavisualization: 9,
    },
    optional: {
      tableau: 8,
      powerbi: 8,
      dashboards: 8,
      statistics: 8,
      forecasting: 7,
      businessintelligence: 7,
      pandas: 7,
      etl: 6,
      dataanalysis: 8,
    },
  },

  "Data Scientist": {
    critical: {
      python: 10,
      machinelearning: 10,
      statistics: 9,
      modeling: 9,
      sql: 8,
      analytics: 8,
    },
    optional: {
      pandas: 9,
      numpy: 9,
      tensorflow: 8,
      pytorch: 8,
      deeplearning: 8,
      nlp: 7,
      ai: 8,
      scikit: 7,
      r: 7,
      datavisualization: 7,
    },
  },

  "AI/ML Engineer": {
    critical: {
      python: 10,
      machinelearning: 10,
      deeplearning: 9,
      tensorflow: 9,
      pytorch: 9,
      ai: 10,
    },
    optional: {
      llm: 9,
      nlp: 8,
      neuralnetwork: 8,
      transformers: 8,
      mlops: 7,
      docker: 6,
      aws: 6,
      dataengineering: 7,
      statistics: 7,
      cuda: 7,
    },
  },

  "DevOps Engineer": {
    critical: {
      docker: 10,
      kubernetes: 10,
      cicd: 10,
      linux: 9,
      aws: 9,
      automation: 9,
    },
    optional: {
      terraform: 8,
      jenkins: 8,
      ansible: 7,
      monitoring: 7,
      git: 7,
      scripting: 7,
      bash: 7,
      azure: 6,
      gcp: 6,
      prometheus: 6,
    },
  },

  "Cloud Engineer": {
    critical: {
      aws: 10,
      cloud: 10,
      azure: 9,
      terraform: 9,
      kubernetes: 8,
      networking: 8,
    },
    optional: {
      gcp: 8,
      docker: 8,
      linux: 7,
      automation: 7,
      iam: 7,
      s3: 6,
      lambda: 7,
      cicd: 7,
      security: 7,
      loadbalancing: 6,
    },
  },

  "Cybersecurity Analyst": {
    critical: {
      security: 10,
      cybersecurity: 10,
      siem: 9,
      incident: 9,
      vulnerability: 9,
      risk: 8,
    },
    optional: {
      splunk: 8,
      soc: 8,
      firewalls: 8,
      nist: 8,
      compliance: 7,
      penetration: 8,
      forensics: 7,
      encryption: 7,
      networking: 7,
      iso27001: 6,
    },
  },

  "QA Tester": {
    critical: {
      testing: 10,
      qa: 10,
      automation: 9,
      regression: 9,
      defects: 8,
      testcases: 8,
    },
    optional: {
      selenium: 8,
      cypress: 8,
      playwright: 7,
      jira: 7,
      api: 7,
      unittesting: 7,
      endtoend: 7,
      agile: 6,
      bug: 7,
      performance: 6,
    },
  },

  "UI/UX Designer": {
    critical: {
      figma: 10,
      ux: 10,
      ui: 10,
      wireframes: 9,
      prototyping: 9,
      userresearch: 9,
    },
    optional: {
      adobe: 7,
      accessibility: 8,
      responsive: 7,
      typography: 7,
      usability: 8,
      designsystems: 7,
      sketch: 6,
      interaction: 7,
      zeplin: 6,
      abtesting: 6,
    },
  },

  "Mobile App Developer": {
    critical: {
      reactnative: 10,
      mobile: 10,
      api: 8,
      ios: 8,
      android: 8,
    },
    optional: {
      swift: 8,
      kotlin: 8,
      flutter: 8,
      firebase: 7,
      xcode: 6,
      appstore: 6,
      typescript: 7,
      redux: 6,
      testing: 7,
    },
  },

  "Network Engineer": {
    critical: {
      networking: 10,
      tcpip: 9,
      cisco: 9,
      routing: 9,
      switching: 9,
      firewall: 8,
    },
    optional: {
      vpn: 8,
      infrastructure: 8,
      security: 7,
      bgp: 7,
      ospf: 7,
      wireless: 6,
      dns: 7,
      dhcp: 6,
      monitoring: 7,
    },
  },

  "IT Support Specialist": {
    critical: {
      troubleshooting: 10,
      support: 10,
      windows: 9,
      hardware: 8,
      software: 8,
      networking: 8,
    },
    optional: {
      activedirectory: 8,
      customerservice: 8,
      ticketing: 7,
      linux: 6,
      helpdesk: 8,
      vpn: 6,
      microsoft365: 7,
      itil: 6,
      documentation: 6,
    },
  },

  "Database Administrator": {
    critical: {
      sql: 10,
      databases: 10,
      postgresql: 9,
      mysql: 9,
      performance: 8,
      backup: 8,
    },
    optional: {
      oracle: 8,
      mongodb: 7,
      redis: 7,
      replication: 7,
      tuning: 8,
      security: 7,
      scripting: 6,
      etl: 6,
      aws: 6,
      indexing: 7,
    },
  },

  "Systems Administrator": {
    critical: {
      linux: 10,
      windows: 9,
      networking: 9,
      servers: 9,
      automation: 8,
      security: 8,
    },
    optional: {
      activedirectory: 8,
      bash: 7,
      powershell: 7,
      virtualization: 7,
      vmware: 7,
      aws: 6,
      monitoring: 7,
      backup: 7,
      itil: 6,
    },
  },

  "Embedded Systems Engineer": {
    critical: {
      c: 10,
      embedded: 10,
      rtos: 9,
      microcontrollers: 9,
      firmware: 9,
      hardware: 8,
    },
    optional: {
      assembly: 7,
      debugging: 7,
      uart: 7,
      spi: 6,
      i2c: 6,
      fpga: 7,
      linux: 6,
      python: 6,
      testing: 7,
    },
  },

  "Blockchain Developer": {
    critical: {
      blockchain: 10,
      solidity: 10,
      smartcontracts: 10,
      ethereum: 9,
      web3: 9,
    },
    optional: {
      defi: 7,
      nft: 6,
      ipfs: 6,
      javascript: 7,
      python: 6,
      truffle: 7,
      hardhat: 7,
      security: 7,
      cryptography: 7,
    },
  },

  // ── HEALTHCARE ────────────────────────────────────────────────────────────

  "Registered Nurse": {
    critical: {
      nursing: 10,
      patientcare: 10,
      clinical: 9,
      medication: 9,
      healthcare: 9,
      assessment: 8,
    },
    optional: {
      emr: 8,
      ehr: 8,
      triage: 7,
      cpr: 7,
      bls: 7,
      acls: 7,
      documentation: 7,
      teamwork: 6,
      communication: 7,
    },
  },

  "Medical Assistant": {
    critical: {
      clinical: 10,
      patientcare: 10,
      vitals: 9,
      emr: 9,
      phlebotomy: 8,
    },
    optional: {
      scheduling: 7,
      billing: 7,
      hipaa: 8,
      cpr: 7,
      medication: 7,
      communication: 7,
      customerservice: 6,
    },
  },

  "Physician": {
    critical: {
      clinical: 10,
      diagnosis: 10,
      patientcare: 10,
      medicine: 9,
      treatment: 9,
    },
    optional: {
      emr: 8,
      ehr: 8,
      research: 7,
      communication: 7,
      leadership: 6,
      hipaa: 7,
      documentation: 7,
    },
  },

  "Caregiver": {
    critical: {
      patientcare: 10,
      compassion: 9,
      communication: 9,
      healthcare: 8,
      assistance: 8,
    },
    optional: {
      cpr: 7,
      bls: 7,
      documentation: 6,
      scheduling: 6,
      teamwork: 7,
    },
  },

  "Pharmacist": {
    critical: {
      pharmacy: 10,
      medication: 10,
      dispensing: 9,
      clinical: 8,
      hipaa: 9,
      compliance: 8,
    },
    optional: {
      counseling: 7,
      emr: 7,
      insurance: 7,
      communication: 7,
      leadership: 6,
      inventory: 6,
    },
  },

  "Physical Therapist": {
    critical: {
      rehabilitation: 10,
      clinical: 10,
      patientcare: 9,
      exercise: 9,
      assessment: 9,
    },
    optional: {
      documentation: 7,
      emr: 7,
      communication: 8,
      anatomy: 7,
      therapeutic: 7,
      education: 6,
    },
  },

  "Dental Hygienist": {
    critical: {
      dental: 10,
      hygiene: 10,
      patientcare: 9,
      radiographs: 8,
      clinical: 8,
    },
    optional: {
      communication: 7,
      hipaa: 7,
      scheduling: 6,
      education: 6,
      documentation: 6,
    },
  },

  "Radiologic Technologist": {
    critical: {
      radiology: 10,
      imaging: 10,
      radiation: 9,
      clinical: 9,
      patientcare: 8,
    },
    optional: {
      ct: 7,
      mri: 7,
      hipaa: 7,
      documentation: 6,
      communication: 7,
    },
  },

  "Healthcare Administrator": {
    critical: {
      healthcare: 10,
      compliance: 9,
      leadership: 9,
      budgeting: 8,
      operations: 9,
    },
    optional: {
      hipaa: 8,
      emr: 7,
      scheduling: 7,
      communication: 7,
      staffing: 7,
      reporting: 6,
    },
  },

  "Medical Coder": {
    critical: {
      coding: 10,
      icd10: 10,
      cpt: 10,
      hipaa: 9,
      billing: 9,
    },
    optional: {
      emr: 7,
      reimbursement: 7,
      compliance: 7,
      documentation: 7,
      accuracy: 7,
    },
  },

  // ── MARKETING & CREATIVE ──────────────────────────────────────────────────

  "Digital Marketing Specialist": {
    critical: {
      seo: 10,
      marketing: 10,
      analytics: 9,
      campaigns: 9,
      googleads: 8,
    },
    optional: {
      socialmedia: 8,
      emailmarketing: 8,
      content: 7,
      ppc: 8,
      googleanalytics: 8,
      abtesting: 7,
      conversion: 7,
      branding: 6,
    },
  },

  "SEO Specialist": {
    critical: {
      seo: 10,
      keywords: 10,
      analytics: 9,
      content: 9,
      rankings: 8,
    },
    optional: {
      googleanalytics: 8,
      backlinks: 8,
      technical: 7,
      semrush: 7,
      ahrefs: 7,
      wordpress: 6,
      reporting: 7,
      conversion: 7,
    },
  },

  "Copywriter": {
    critical: {
      writing: 10,
      content: 10,
      copywriting: 10,
      editing: 9,
      communication: 8,
    },
    optional: {
      seo: 7,
      branding: 7,
      research: 7,
      creative: 7,
      marketing: 7,
      socialmedia: 6,
      storytelling: 7,
      proofreading: 7,
    },
  },

  "Social Media Manager": {
    critical: {
      socialmedia: 10,
      content: 10,
      engagement: 9,
      analytics: 9,
      marketing: 8,
    },
    optional: {
      instagram: 7,
      tiktok: 7,
      facebook: 7,
      scheduling: 7,
      branding: 7,
      advertising: 7,
      campaigns: 7,
      copywriting: 6,
    },
  },

  "Content Strategist": {
    critical: {
      content: 10,
      strategy: 10,
      writing: 9,
      seo: 8,
      analytics: 8,
    },
    optional: {
      editorial: 7,
      branding: 7,
      socialmedia: 7,
      research: 7,
      planning: 7,
      collaboration: 6,
    },
  },

  "Brand Manager": {
    critical: {
      branding: 10,
      marketing: 10,
      strategy: 9,
      campaigns: 9,
      communication: 8,
    },
    optional: {
      analytics: 7,
      research: 7,
      leadership: 7,
      creative: 7,
      budgeting: 7,
      socialmedia: 6,
    },
  },

  "Graphic Designer": {
    critical: {
      photoshop: 10,
      illustrator: 10,
      figma: 9,
      typography: 9,
      branding: 8,
      creative: 8,
    },
    optional: {
      indesign: 8,
      adobe: 7,
      ui: 7,
      animation: 6,
      responsive: 6,
      color: 6,
      layout: 7,
    },
  },

  "Video Editor": {
    critical: {
      editing: 10,
      video: 10,
      adobepremiere: 10,
      aftereffects: 9,
      storytelling: 8,
    },
    optional: {
      finalcut: 7,
      color: 7,
      motion: 7,
      audio: 7,
      youtube: 6,
      animation: 6,
      davinci: 7,
    },
  },

  "Email Marketing Specialist": {
    critical: {
      emailmarketing: 10,
      campaigns: 10,
      analytics: 9,
      automation: 8,
      content: 8,
    },
    optional: {
      mailchimp: 8,
      klaviyo: 7,
      segmentation: 8,
      abtesting: 7,
      copywriting: 7,
      html: 6,
      conversion: 7,
    },
  },

  "Growth Marketer": {
    critical: {
      growth: 10,
      analytics: 10,
      abtesting: 9,
      acquisition: 9,
      conversion: 9,
    },
    optional: {
      seo: 7,
      ppc: 7,
      emailmarketing: 7,
      funnels: 7,
      retention: 8,
      experimentation: 7,
      sqldb: 6,
    },
  },

  // ── BUSINESS & FINANCE ────────────────────────────────────────────────────

  "Accountant": {
    critical: {
      accounting: 10,
      excel: 10,
      finance: 9,
      reporting: 8,
      gaap: 9,
    },
    optional: {
      quickbooks: 8,
      bookkeeping: 8,
      taxes: 8,
      payroll: 7,
      auditing: 7,
      reconciliation: 7,
      budgeting: 7,
      erp: 6,
    },
  },

  "Financial Analyst": {
    critical: {
      finance: 10,
      excel: 10,
      modeling: 9,
      analysis: 9,
      forecasting: 9,
    },
    optional: {
      powerbi: 7,
      sql: 7,
      valuation: 8,
      budgeting: 8,
      reporting: 7,
      bloomberg: 7,
      python: 6,
      presentation: 6,
    },
  },

  "Business Analyst": {
    critical: {
      analysis: 10,
      requirements: 9,
      sql: 9,
      documentation: 8,
      stakeholder: 9,
    },
    optional: {
      agile: 8,
      excel: 8,
      jira: 7,
      powerbi: 7,
      visio: 6,
      communication: 7,
      modeling: 7,
      testing: 6,
    },
  },

  "Project Manager": {
    critical: {
      projectmanagement: 10,
      agile: 10,
      scrum: 9,
      leadership: 9,
      planning: 9,
      communication: 9,
    },
    optional: {
      jira: 8,
      budgeting: 7,
      risk: 8,
      stakeholder: 8,
      roadmap: 7,
      pmp: 8,
      kanban: 6,
      reporting: 6,
    },
  },

  "Product Manager": {
    critical: {
      strategy: 10,
      roadmap: 9,
      leadership: 8,
      communication: 9,
      analytics: 9,
      stakeholder: 8,
    },
    optional: {
      agile: 8,
      ux: 7,
      jira: 7,
      prioritization: 8,
      metrics: 7,
      gtm: 7,
      research: 7,
      abtesting: 6,
    },
  },

  "HR Manager": {
    critical: {
      hr: 10,
      recruiting: 9,
      compliance: 9,
      onboarding: 9,
      communication: 8,
    },
    optional: {
      payroll: 7,
      leadership: 7,
      hris: 7,
      performance: 7,
      benefits: 7,
      training: 6,
      employment: 7,
    },
  },

  "Recruiter": {
    critical: {
      recruiting: 10,
      sourcing: 9,
      interviewing: 9,
      communication: 9,
      ats: 8,
    },
    optional: {
      linkedin: 8,
      hr: 7,
      negotiation: 7,
      onboarding: 7,
      diversity: 6,
      pipelines: 7,
      relationship: 6,
    },
  },

  "Operations Manager": {
    critical: {
      operations: 10,
      leadership: 9,
      planning: 9,
      efficiency: 8,
      communication: 8,
    },
    optional: {
      budgeting: 8,
      kpis: 8,
      supplychain: 7,
      reporting: 7,
      projectmanagement: 7,
      crossfunctional: 7,
      analysis: 6,
    },
  },

  "Supply Chain Analyst": {
    critical: {
      supplychain: 10,
      logistics: 9,
      analysis: 9,
      forecasting: 8,
      procurement: 8,
    },
    optional: {
      excel: 8,
      erp: 7,
      sql: 7,
      inventory: 8,
      vendors: 7,
      reporting: 7,
      sap: 7,
    },
  },

  "Management Consultant": {
    critical: {
      strategy: 10,
      analysis: 10,
      communication: 9,
      leadership: 9,
      consulting: 9,
    },
    optional: {
      excel: 8,
      presentation: 8,
      research: 7,
      projectmanagement: 7,
      stakeholder: 7,
      financial: 7,
    },
  },

  // ── SALES & CUSTOMER SUCCESS ──────────────────────────────────────────────

  "Sales Representative": {
    critical: {
      sales: 10,
      communication: 10,
      negotiation: 9,
      crm: 8,
      quotas: 9,
    },
    optional: {
      prospecting: 8,
      pipeline: 7,
      salesforce: 7,
      relationship: 7,
      presentation: 7,
      revenue: 7,
      closing: 8,
    },
  },

  "Account Executive": {
    critical: {
      sales: 10,
      accounts: 9,
      negotiation: 9,
      communication: 9,
      revenue: 9,
    },
    optional: {
      crm: 8,
      salesforce: 8,
      pipeline: 8,
      forecasting: 7,
      relationship: 7,
      demos: 7,
      closing: 8,
    },
  },

  "Customer Service Representative": {
    critical: {
      customerservice: 10,
      communication: 10,
      support: 9,
      problemsolving: 8,
      empathy: 8,
    },
    optional: {
      crm: 7,
      multitasking: 7,
      teamwork: 7,
      ticketing: 7,
      patience: 6,
      zendesk: 7,
      escalation: 6,
    },
  },

  "Customer Success Manager": {
    critical: {
      customersuccess: 10,
      relationship: 9,
      communication: 9,
      retention: 9,
      onboarding: 8,
    },
    optional: {
      crm: 8,
      analytics: 7,
      salesforce: 7,
      churn: 8,
      renewal: 7,
      upselling: 7,
      gainsight: 6,
    },
  },

  "Real Estate Agent": {
    critical: {
      realestate: 10,
      sales: 9,
      negotiation: 10,
      communication: 9,
      listings: 8,
    },
    optional: {
      marketing: 7,
      contracts: 8,
      crm: 6,
      mls: 7,
      networking: 7,
      clientrelations: 7,
    },
  },

  "Insurance Agent": {
    critical: {
      insurance: 10,
      sales: 9,
      communication: 9,
      licensed: 9,
      policies: 8,
    },
    optional: {
      crm: 7,
      underwriting: 7,
      claims: 7,
      negotiation: 7,
      relationship: 7,
      compliance: 6,
    },
  },

  "Retail Associate": {
    critical: {
      customerservice: 10,
      sales: 9,
      communication: 8,
      pos: 7,
      teamwork: 8,
    },
    optional: {
      inventory: 7,
      merchandising: 6,
      cash: 6,
      upselling: 6,
      scheduling: 5,
    },
  },

  "Business Development Manager": {
    critical: {
      business: 10,
      strategy: 9,
      sales: 9,
      negotiation: 9,
      communication: 8,
    },
    optional: {
      partnerships: 8,
      revenue: 8,
      crm: 7,
      networking: 7,
      forecasting: 7,
      leadership: 7,
    },
  },

  // ── ENGINEERING & TRADES ──────────────────────────────────────────────────

  "Mechanical Engineer": {
    critical: {
      engineering: 10,
      mechanical: 10,
      autocad: 9,
      solidworks: 9,
      design: 8,
    },
    optional: {
      manufacturing: 7,
      testing: 7,
      simulation: 7,
      thermodynamics: 6,
      materials: 7,
      cad: 7,
      project: 6,
    },
  },

  "Electrical Engineer": {
    critical: {
      electrical: 10,
      engineering: 10,
      circuits: 9,
      pcb: 8,
      design: 8,
    },
    optional: {
      autocad: 7,
      matlab: 7,
      embedded: 7,
      power: 7,
      testing: 7,
      simulation: 6,
      compliance: 6,
    },
  },

  "Civil Engineer": {
    critical: {
      civil: 10,
      engineering: 10,
      autocad: 9,
      structural: 9,
      design: 8,
    },
    optional: {
      construction: 7,
      surveying: 7,
      project: 7,
      materials: 6,
      compliance: 7,
      hydrology: 6,
      gis: 6,
    },
  },

  "Chemical Engineer": {
    critical: {
      chemical: 10,
      engineering: 10,
      processes: 9,
      safety: 9,
      analysis: 8,
    },
    optional: {
      simulation: 7,
      laboratory: 7,
      compliance: 7,
      quality: 7,
      manufacturing: 7,
      research: 6,
    },
  },

  "Electrician": {
    critical: {
      electrical: 10,
      wiring: 10,
      installation: 9,
      safety: 9,
      troubleshooting: 8,
    },
    optional: {
      blueprint: 7,
      maintenance: 7,
      nec: 7,
      conduit: 6,
      licensed: 7,
      panels: 6,
    },
  },

  "Plumber": {
    critical: {
      plumbing: 10,
      installation: 10,
      pipes: 9,
      safety: 9,
      maintenance: 8,
    },
    optional: {
      troubleshooting: 7,
      blueprint: 6,
      licensed: 7,
      commercial: 6,
      residential: 6,
    },
  },

  "HVAC Technician": {
    critical: {
      hvac: 10,
      installation: 10,
      maintenance: 9,
      refrigeration: 8,
      troubleshooting: 9,
    },
    optional: {
      epa: 8,
      electrical: 7,
      safety: 7,
      blueprint: 6,
      commercial: 6,
      residential: 6,
    },
  },

  "Welder": {
    critical: {
      welding: 10,
      fabrication: 9,
      safety: 9,
      blueprint: 8,
      mig: 8,
    },
    optional: {
      tig: 8,
      stick: 7,
      inspection: 7,
      quality: 6,
      aluminum: 6,
      structural: 6,
    },
  },

  "Construction Manager": {
    critical: {
      construction: 10,
      management: 10,
      safety: 9,
      planning: 9,
      budgeting: 8,
    },
    optional: {
      scheduling: 8,
      subcontractors: 7,
      osha: 8,
      blueprint: 7,
      leadership: 7,
      estimating: 7,
    },
  },

  // ── EDUCATION ─────────────────────────────────────────────────────────────

  "Teacher": {
    critical: {
      education: 10,
      classroom: 10,
      curriculum: 9,
      instruction: 9,
      communication: 8,
    },
    optional: {
      lessonplanning: 8,
      assessment: 7,
      differentiation: 7,
      technology: 6,
      collaboration: 7,
      management: 7,
    },
  },

  "School Counselor": {
    critical: {
      counseling: 10,
      education: 9,
      communication: 9,
      guidance: 9,
      support: 8,
    },
    optional: {
      intervention: 7,
      collaboration: 7,
      mental: 7,
      crisis: 7,
      documentation: 6,
    },
  },

  "Instructional Designer": {
    critical: {
      instructional: 10,
      elearning: 10,
      curriculum: 9,
      design: 9,
      lms: 8,
    },
    optional: {
      articulate: 8,
      storyline: 7,
      assessment: 7,
      blended: 7,
      research: 6,
      collaboration: 6,
    },
  },

  "Tutor": {
    critical: {
      tutoring: 10,
      education: 9,
      communication: 9,
      instruction: 8,
      patience: 8,
    },
    optional: {
      math: 7,
      writing: 7,
      assessment: 6,
      planning: 6,
      technology: 5,
    },
  },

  "Professor": {
    critical: {
      teaching: 10,
      research: 10,
      curriculum: 9,
      publication: 8,
      education: 9,
    },
    optional: {
      mentoring: 7,
      grant: 7,
      phd: 8,
      laboratory: 6,
      assessment: 7,
      communication: 7,
    },
  },

  "Education Administrator": {
    critical: {
      administration: 10,
      education: 10,
      leadership: 9,
      compliance: 8,
      communication: 8,
    },
    optional: {
      budgeting: 7,
      staffing: 7,
      reporting: 7,
      planning: 7,
      curriculum: 6,
    },
  },

  // ── LOGISTICS & TRANSPORTATION ────────────────────────────────────────────

  "Truck Driver": {
    critical: {
      cdl: 10,
      driving: 10,
      safety: 9,
      transportation: 9,
      delivery: 8,
    },
    optional: {
      logistics: 7,
      routes: 7,
      dot: 8,
      inspection: 7,
      navigation: 6,
      scheduling: 6,
    },
  },

  "Warehouse Associate": {
    critical: {
      warehouse: 10,
      inventory: 9,
      safety: 9,
      shipping: 8,
      receiving: 8,
    },
    optional: {
      forklift: 8,
      picking: 7,
      packing: 7,
      scanning: 6,
      teamwork: 7,
      physical: 5,
    },
  },

  "Logistics Coordinator": {
    critical: {
      logistics: 10,
      coordination: 9,
      supplychain: 9,
      shipping: 8,
      communication: 8,
    },
    optional: {
      vendors: 7,
      scheduling: 7,
      inventory: 7,
      tracking: 7,
      erp: 6,
      excel: 7,
    },
  },

  "Supply Chain Manager": {
    critical: {
      supplychain: 10,
      logistics: 9,
      procurement: 9,
      leadership: 8,
      planning: 9,
    },
    optional: {
      vendors: 8,
      erp: 7,
      forecasting: 8,
      inventory: 8,
      negotiation: 7,
      sap: 7,
    },
  },

  "Delivery Driver": {
    critical: {
      delivery: 10,
      driving: 10,
      safety: 9,
      routes: 8,
      customerservice: 8,
    },
    optional: {
      navigation: 7,
      scheduling: 6,
      physical: 5,
      communication: 6,
      reliable: 6,
    },
  },

  "Fleet Manager": {
    critical: {
      fleet: 10,
      management: 10,
      maintenance: 9,
      safety: 9,
      logistics: 8,
    },
    optional: {
      budgeting: 7,
      scheduling: 7,
      compliance: 7,
      reporting: 7,
      vendors: 6,
      gps: 6,
    },
  },

  // ── LEGAL & COMPLIANCE ────────────────────────────────────────────────────

  "Paralegal": {
    critical: {
      legal: 10,
      research: 10,
      documentation: 9,
      drafting: 9,
      compliance: 8,
    },
    optional: {
      litigation: 8,
      contracts: 8,
      filing: 7,
      communication: 7,
      organization: 7,
      discovery: 7,
    },
  },

  "Compliance Officer": {
    critical: {
      compliance: 10,
      regulations: 10,
      risk: 9,
      auditing: 9,
      reporting: 8,
    },
    optional: {
      legal: 7,
      policies: 8,
      training: 7,
      documentation: 7,
      communication: 7,
      investigation: 6,
    },
  },

  "Contract Manager": {
    critical: {
      contracts: 10,
      negotiation: 10,
      compliance: 9,
      drafting: 9,
      legal: 8,
    },
    optional: {
      risk: 7,
      vendors: 7,
      communication: 7,
      analysis: 7,
      documentation: 7,
    },
  },

  "Legal Assistant": {
    critical: {
      legal: 10,
      documentation: 9,
      research: 9,
      organization: 8,
      communication: 8,
    },
    optional: {
      filing: 7,
      scheduling: 7,
      drafting: 7,
      billing: 6,
      confidentiality: 7,
    },
  },
};

export default roleKeywords;
