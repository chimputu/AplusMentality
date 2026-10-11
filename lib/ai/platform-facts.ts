// Single source of truth for all factual AI responses
// Hard-coded so it can NEVER be empty or stale
export const PLATFORM_FACTS = {
  // ─── IDENTITY ───
  name: 'A+ Mentality',
  country: 'Zambia',
  tagline: 'A multi-university academic platform for Zambian institutions',

  // ─── SCOPE ───
  scope: 'Zambia only. We do NOT support universities outside Zambia.',
  expansion: 'No international expansion is planned.',

  // ─── NUMBERS (exact, do not change without updating here) ───
  institutionCount: 12,
  userCount: '500+',
  courseCount: '200+',

  // ─── INSTITUTIONS (exact list, no others exist) ───
  institutions: [
    { name: 'University of Zambia', shortName: 'UNZA', city: 'Lusaka' },
    { name: 'Copperbelt University', shortName: 'CBU', city: 'Kitwe' },
    { name: 'Mulungushi University', shortName: 'MU', city: 'Kabwe' },
    { name: 'University of Lusaka', shortName: 'UNILUS', city: 'Lusaka' },
    { name: 'Zambia Open University', shortName: 'ZAOU', city: 'Lusaka' },
    { name: 'National Institute of Public Administration', shortName: 'NIPA', city: 'Lusaka' },
    { name: 'Zambia Centre for Accountancy Studies', shortName: 'ZCAS', city: 'Lusaka' },
    { name: 'Northern Technical College', shortName: 'NORTEC', city: 'Ndola' },
    { name: 'Evelyn Hone College', shortName: 'EHC', city: 'Lusaka' },
    { name: 'Chainama College of Health Sciences', shortName: 'CCHS', city: 'Lusaka' },
    { name: 'Graduate School of Business UNZA', shortName: 'GSB', city: 'Lusaka' },
    { name: 'Information and Communications University', shortName: 'ICU', city: 'Lusaka' },
  ],

  // ─── FEATURES THAT EXIST ───
  features: {
    courses: true,
    materials: true,
    pastPapers: true,
    assignments: true,
    videoLectures: true,
    lectureSlides: true,
    tutorials: true,
    aiAssistant: true,
    offlineMode: true,
    notifications: true,
    search: true,
    exploration: true,
    progressTracking: true,
    chatHistory: true,
  },

  // ─── FEATURES THAT DO NOT EXIST ───
  nonFeatures: {
    assessments: true,
    quizzes: true,
    tests: true,
    exams: true,
    grades: true,
    badges: true,
    certificates: true,
    liveSessions: true,
    videoCalls: true,
    tutoring: true,
    integrations: true,
    mobileApps: true,
  },

  // ─── PRICING ───
  pricing: {
    model: 'Institution subscription',
    studentCost: 'Free for students through their institution',
    publicPricing: 'Contact support@aplusmentality.com',
  },

  // ─── CONTACT INFO ───
  contact: {
    email: 'kafiswegchimputu@gmail.com',
    phone: '+260772231300',
    phoneDisplay: '+260 77 223 1300',
    whatsapp: '+260772231300',
    whatsappDisplay: '+260 77 223 1300',
    whatsappLink: 'https://wa.me/260772231300',
    website: 'https://aplusmentality.vercel.app',

    // For logged-in users — additional options
    loggedInOptions: [
      'Reply in this chat',
      'Email kafiswegchimputu@gmail.com',
      'Call or WhatsApp +260 77 223 1300',
      'Use the Help button in the app',
    ],

    // For public users — limited options
    publicOptions: [
      'Sign up to unlock more support options',
      'Email kafiswegchimputu@gmail.com',
      'WhatsApp +260 77 223 1300',
    ],
  },

  // ─── ABSOLUTE FORBIDDEN CLAIMS ───
  forbiddenClaims: [
    'open-source',
    '150 universities',
    '50+ universities',
    'US universities',
    'UK universities',
    'Canadian universities',
    'Australian universities',
    'worldwide',
    'global',
    'international universities',
    'Oxford',
    'Cambridge',
    'Imperial College',
    'UCL',
    'LSE',
    'Harvard',
    'MIT',
    'Stanford',
    'Yale',
    'Princeton',
    'Caltech',
    'Berkeley',
    'UC schools',
    'Cal State',
    'USC',
    'UCLA',
    'NYU',
    'University of Toronto',
    'UBC',
    'McGill',
    'McMaster',
    'University of Melbourne',
    'ANU',
    'UNSW',
    'USYD',
    'course management systems',
    'LMS integrations',
    'Canvas',
    'Moodle',
    'Blackboard',
    'badges',
    'certificates',
    'free forever',
    'completely free',
  ],
};
