// Default task template for a NSW residential subdivision project

export type TemplateTask = {
  name: string;
  description: string;
  duration: number; // business days
  assigneeRole: string;
  phase: number; // 0-indexed
};

export const DEFAULT_TEMPLATE: TemplateTask[] = [
  // Phase 0: Planning & Approvals
  {
    name: "Engage town planner",
    description: "Appoint a town planner to advise on development potential and constraints.",
    duration: 3,
    assigneeRole: "Town Planner",
    phase: 0,
  },
  {
    name: "Prepare Planning Proposal / LEP amendment (if required)",
    description: "Prepare documents for any necessary rezoning or local environmental plan changes.",
    duration: 60,
    assigneeRole: "Town Planner",
    phase: 0,
  },
  {
    name: "Submit Development Application (DA)",
    description: "Prepare and lodge the Development Application with the local council.",
    duration: 10,
    assigneeRole: "Town Planner",
    phase: 0,
  },
  {
    name: "Council assessment period",
    description: "Await council assessment and any requests for additional information (RFI).",
    duration: 40,
    assigneeRole: "Town Planner",
    phase: 0,
  },
  {
    name: "Respond to RFI (if issued)",
    description: "Prepare and submit responses to council's request for information.",
    duration: 10,
    assigneeRole: "Town Planner",
    phase: 0,
  },
  {
    name: "DA approval / consent granted",
    description: "Receive development consent. Review conditions of consent.",
    duration: 2,
    assigneeRole: "Project Manager",
    phase: 0,
  },
  {
    name: "Section 7.12 contribution calculation",
    description: "Calculate applicable development contributions payable under s7.12.",
    duration: 3,
    assigneeRole: "Town Planner",
    phase: 0,
  },
  {
    name: "Review and discharge DA conditions",
    description: "Systematically work through and discharge all pre-construction DA conditions.",
    duration: 15,
    assigneeRole: "Project Manager",
    phase: 0,
  },

  // Phase 1: Civil Engineering
  {
    name: "Engage civil engineer",
    description: "Appoint civil engineer for subdivision design and construction documentation.",
    duration: 3,
    assigneeRole: "Civil Engineer",
    phase: 1,
  },
  {
    name: "Survey — feature and level survey",
    description: "Commission a registered surveyor to complete a feature and contour survey.",
    duration: 5,
    assigneeRole: "Surveyor",
    phase: 1,
  },
  {
    name: "Geotechnical investigation",
    description: "Commission geotech report including soil classification and bearing capacity.",
    duration: 10,
    assigneeRole: "Geotechnical Engineer",
    phase: 1,
  },
  {
    name: "Civil design — roads, drainage, services",
    description: "Prepare civil engineering design drawings for roads, stormwater, and services.",
    duration: 20,
    assigneeRole: "Civil Engineer",
    phase: 1,
  },
  {
    name: "Engineering approval from council / authority",
    description: "Submit civil designs for approval from council and relevant authorities (Sydney Water, Essential Energy etc).",
    duration: 20,
    assigneeRole: "Civil Engineer",
    phase: 1,
  },
  {
    name: "Obtain Construction Certificate (CC)",
    description: "Prepare and lodge CC application with certifier for civil works.",
    duration: 10,
    assigneeRole: "Certifier",
    phase: 1,
  },
  {
    name: "Prepare civil works contract documents",
    description: "Prepare scope of works, BoQ, and contract documentation for civil contractor tender.",
    duration: 10,
    assigneeRole: "Civil Engineer",
    phase: 1,
  },
  {
    name: "Tender and appoint civil contractor",
    description: "Issue tender to shortlisted civil contractors. Evaluate and appoint preferred contractor.",
    duration: 15,
    assigneeRole: "Project Manager",
    phase: 1,
  },

  // Phase 2: Construction
  {
    name: "Site establishment and sediment controls",
    description: "Install site hoarding, sediment fencing, and erosion controls as per SWMP.",
    duration: 3,
    assigneeRole: "Civil Contractor",
    phase: 2,
  },
  {
    name: "Bulk earthworks and cut/fill",
    description: "Carry out bulk earthworks to achieve design levels.",
    duration: 15,
    assigneeRole: "Civil Contractor",
    phase: 2,
  },
  {
    name: "Stormwater drainage installation",
    description: "Install stormwater pipes, pits, and detention systems.",
    duration: 10,
    assigneeRole: "Civil Contractor",
    phase: 2,
  },
  {
    name: "Road base and kerb & gutter",
    description: "Install subbase, road base, kerb and gutter to all roads.",
    duration: 10,
    assigneeRole: "Civil Contractor",
    phase: 2,
  },
  {
    name: "Services trenching and conduit installation",
    description: "Trench and install conduits for power, water, sewer, and telecoms.",
    duration: 10,
    assigneeRole: "Civil Contractor",
    phase: 2,
  },
  {
    name: "Water and sewer connection works",
    description: "Connect water and sewer mains to Sydney Water network.",
    duration: 8,
    assigneeRole: "Civil Contractor",
    phase: 2,
  },
  {
    name: "Asphalt and line marking",
    description: "Apply asphalt wearing course and traffic line marking.",
    duration: 5,
    assigneeRole: "Civil Contractor",
    phase: 2,
  },
  {
    name: "Landscaping and revegetation",
    description: "Install street trees, turf, and landscaping to public areas.",
    duration: 5,
    assigneeRole: "Landscape Contractor",
    phase: 2,
  },
  {
    name: "Final inspection and defects rectification",
    description: "Principal certifier inspection. Identify and rectify all defects.",
    duration: 10,
    assigneeRole: "Civil Engineer",
    phase: 2,
  },
  {
    name: "Occupation Certificate (OC)",
    description: "Obtain occupation certificate from principal certifier.",
    duration: 5,
    assigneeRole: "Certifier",
    phase: 2,
  },

  // Phase 3: Subdivision & Titles
  {
    name: "Engage surveyor — subdivision survey",
    description: "Instruct registered surveyor to prepare subdivision survey plan.",
    duration: 2,
    assigneeRole: "Surveyor",
    phase: 3,
  },
  {
    name: "Prepare subdivision plan",
    description: "Surveyor prepares final subdivision plan and deposited plan.",
    duration: 15,
    assigneeRole: "Surveyor",
    phase: 3,
  },
  {
    name: "Section 88B instrument preparation",
    description: "Prepare easements, restrictions, and covenants under s88B.",
    duration: 5,
    assigneeRole: "Solicitor",
    phase: 3,
  },
  {
    name: "Council subdivision certificate",
    description: "Apply for and obtain subdivision certificate from council.",
    duration: 15,
    assigneeRole: "Surveyor",
    phase: 3,
  },
  {
    name: "NSW Land Registry Services — DP registration",
    description: "Lodge deposited plan with NSW LRS for registration. Create individual lots.",
    duration: 20,
    assigneeRole: "Solicitor",
    phase: 3,
  },
  {
    name: "Issue individual titles",
    description: "Receive registered titles for each lot from NSW LRS.",
    duration: 3,
    assigneeRole: "Solicitor",
    phase: 3,
  },

  // Phase 4: Sales & Marketing
  {
    name: "Engage sales agent",
    description: "Select and brief real estate agent for project sales strategy.",
    duration: 5,
    assigneeRole: "Sales Agent",
    phase: 4,
  },
  {
    name: "Prepare marketing materials",
    description: "Photography, renders, brochures, and digital marketing content.",
    duration: 10,
    assigneeRole: "Sales Agent",
    phase: 4,
  },
  {
    name: "List lots for sale",
    description: "Go live on sales channels — realestate.com.au, domain.com.au, social media.",
    duration: 2,
    assigneeRole: "Sales Agent",
    phase: 4,
  },
  {
    name: "Sales campaign — exchange contracts",
    description: "Active sales period. Execute contracts of sale with purchasers.",
    duration: 30,
    assigneeRole: "Sales Agent",
    phase: 4,
  },
  {
    name: "Settlements",
    description: "Coordinate settlement dates with solicitor and purchasers.",
    duration: 15,
    assigneeRole: "Solicitor",
    phase: 4,
  },

  // Phase 5: Accounts & Admin
  {
    name: "Project cost tracking — setup",
    description: "Establish cost tracking spreadsheet and budget vs actual reporting.",
    duration: 2,
    assigneeRole: "Accounts",
    phase: 5,
  },
  {
    name: "Pay development contributions",
    description: "Pay s7.11 / s7.12 contributions to council before construction.",
    duration: 2,
    assigneeRole: "Accounts",
    phase: 5,
  },
  {
    name: "Construction progress claims — certification",
    description: "Review and certify contractor progress claims. Arrange payment.",
    duration: 3,
    assigneeRole: "Project Manager",
    phase: 5,
  },
  {
    name: "GST / margin scheme advice",
    description: "Obtain tax advice on GST treatment and margin scheme eligibility.",
    duration: 5,
    assigneeRole: "Accountant",
    phase: 5,
  },
  {
    name: "Final project reconciliation",
    description: "Reconcile all project costs and income. Prepare final profit report.",
    duration: 5,
    assigneeRole: "Accounts",
    phase: 5,
  },
];
