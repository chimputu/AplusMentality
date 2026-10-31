// Seed Zambian universities and institutions with programmes, branches, and academic levels
// Run with: npx tsx scripts/seed-universities.ts
import 'dotenv/config';
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('Seeding universities and institutions...');

  // ============================================
  // UNIVERSITIES
  // ============================================
  const universities = [
    {
      name: 'University of Zambia',
      code: 'UNZA',
      academicSystem: 'SEMESTERLY',
      programmes: [
        { name: 'BSc Information Technology', shortName: 'BSc IT', code: 'BSC-IT', branches: ['Computer Science', 'Information Systems'] },
        { name: 'BSc Natural Sciences', shortName: 'BSc NS', code: 'BSC-NS', branches: ['Biology', 'Chemistry', 'Physics', 'Mathematics'] },
        { name: 'Bachelor of Commerce', shortName: 'BCom', code: 'BCOM', branches: ['Accounting', 'Finance', 'Marketing', 'Human Resources'] },
        { name: 'Bachelor of Laws', shortName: 'LLB', code: 'LLB' },
        { name: 'Bachelor of Education', shortName: 'BEd', code: 'BED', branches: ['General Education', 'Science Education'] },
        { name: 'Bachelor of Arts', shortName: 'BA', code: 'BA', branches: ['English', 'History', 'Political Science', 'Sociology'] },
        { name: 'Bachelor of Science in Nursing', shortName: 'BSc Nursing', code: 'BSC-NURSING' },
        { name: 'Diploma in Information Technology', shortName: 'DIP-IT', code: 'DIP-IT' },
        { name: 'Diploma in Accounting', shortName: 'DIP-ACC', code: 'DIP-ACC' },
      ],
    },
    {
      name: 'Copperbelt University',
      code: 'CBU',
      academicSystem: 'SEMESTERLY',
      programmes: [
        { name: 'BSc Information Technology', shortName: 'BSc IT', code: 'BSC-IT', branches: ['Computer Science', 'Software Engineering'] },
        { name: 'Bachelor of Engineering', shortName: 'BEng', code: 'BENG', branches: ['Mining', 'Mechanical', 'Civil', 'Electrical'] },
        { name: 'Bachelor of Commerce', shortName: 'BCom', code: 'BCOM', branches: ['Accounting', 'Finance', 'Marketing'] },
        { name: 'BSc Natural Sciences', shortName: 'BSc NS', code: 'BSC-NS', branches: ['Biology', 'Chemistry', 'Physics'] },
        { name: 'Bachelor of Medicine and Bachelor of Surgery', shortName: 'MBChB', code: 'MBCHB' },
        { name: 'Bachelor of Nursing', shortName: 'BSc Nursing', code: 'BSC-NURSING' },
        { name: 'Diploma in Information Technology', shortName: 'DIP-IT', code: 'DIP-IT' },
      ],
    },
    {
      name: 'Mulungushi University',
      code: 'MU',
      academicSystem: 'SEMESTERLY',
      programmes: [
        { name: 'Bachelor of Commerce', shortName: 'BCom', code: 'BCOM', branches: ['Accounting', 'Finance', 'Marketing', 'Human Resources'] },
        { name: 'Bachelor of Information Technology', shortName: 'BIT', code: 'BIT', branches: ['Computer Science', 'Information Systems'] },
        { name: 'Bachelor of Education', shortName: 'BEd', code: 'BED', branches: ['General Education', 'Science Education'] },
        { name: 'Bachelor of Arts', shortName: 'BA', code: 'BA', branches: ['English', 'Political Science'] },
        { name: 'Bachelor of Science', shortName: 'BSc', code: 'BSC', branches: ['Biology', 'Chemistry', 'Mathematics'] },
        { name: 'Diploma in Information Technology', shortName: 'DIP-IT', code: 'DIP-IT' },
        { name: 'Diploma in Accounting', shortName: 'DIP-ACC', code: 'DIP-ACC' },
      ],
    },
    {
      name: 'University of Lusaka',
      code: 'ULUSAKA',
      academicSystem: 'SEMESTERLY',
      programmes: [
        { name: 'Bachelor of Commerce', shortName: 'BCom', code: 'BCOM', branches: ['Accounting', 'Finance', 'Marketing'] },
        { name: 'Bachelor of Laws', shortName: 'LLB', code: 'LLB' },
        { name: 'Bachelor of Information Technology', shortName: 'BIT', code: 'BIT' },
        { name: 'Bachelor of Education', shortName: 'BEd', code: 'BED' },
        { name: 'Bachelor of Public Administration', shortName: 'BPA', code: 'BPA' },
      ],
    },
    {
      name: 'Zambia Open University',
      code: 'ZOU',
      academicSystem: 'SEMESTERLY',
      programmes: [
        { name: 'Bachelor of Commerce', shortName: 'BCom', code: 'BCOM', branches: ['Accounting', 'Finance', 'Marketing'] },
        { name: 'Bachelor of Education', shortName: 'BEd', code: 'BED' },
        { name: 'Bachelor of Arts', shortName: 'BA', code: 'BA', branches: ['English', 'Sociology'] },
        { name: 'Bachelor of Science', shortName: 'BSc', code: 'BSC', branches: ['Biology', 'Mathematics'] },
        { name: 'Diploma in Information Technology', shortName: 'DIP-IT', code: 'DIP-IT' },
      ],
    },
    {
      name: 'Kabwe University Science and Technology',
      code: 'KUST',
      academicSystem: 'SEMESTERLY',
      programmes: [
        { name: 'BSc Information Technology', shortName: 'BSc IT', code: 'BSC-IT' },
        { name: 'Bachelor of Engineering', shortName: 'BEng', code: 'BENG', branches: ['Mechanical', 'Civil', 'Electrical'] },
        { name: 'Bachelor of Commerce', shortName: 'BCom', code: 'BCOM', branches: ['Accounting', 'Finance'] },
        { name: 'BSc Natural Sciences', shortName: 'BSc NS', code: 'BSC-NS', branches: ['Biology', 'Chemistry'] },
      ],
    },
    {
      name: 'Zimbabwe Open University',
      code: 'ZOU-ZW',
      academicSystem: 'SEMESTERLY',
      programmes: [
        { name: 'Bachelor of Commerce', shortName: 'BCom', code: 'BCOM' },
        { name: 'Bachelor of Education', shortName: 'BEd', code: 'BED' },
      ],
    },
    {
      name: 'Great Zimbabwe University',
      code: 'GZU',
      academicSystem: 'SEMESTERLY',
      programmes: [
        { name: 'Bachelor of Education', shortName: 'BEd', code: 'BED' },
        { name: 'Bachelor of Agriculture', shortName: 'BSc Ag', code: 'BSC-AG' },
        { name: 'Bachelor of Commerce', shortName: 'BCom', code: 'BCOM' },
      ],
    },
  ];

  for (const uniData of universities) {
    const uni = await prisma.legacyUniversity.upsert({
      where: { code: uniData.code },
      update: {},
      create: { name: uniData.name, code: uniData.code, academicSystem: uniData.academicSystem },
    });

    for (const progData of uniData.programmes) {
      await prisma.programme.upsert({
        where: { institutionId_code: { institutionId: uni.id, code: progData.code } },
        update: {},
        create: {
          name: progData.name,
          shortName: progData.shortName,
          code: progData.code,
          universityId: uni.id,
          branches: progData.branches ? { create: progData.branches.map((b) => ({ name: b })) } : undefined,
        },
      });
    }
    console.log(`✓ ${uni.name} (${uniData.programmes.length} programmes)`);
  }

  // ============================================
  // INSTITUTIONS
  // ============================================
  const institutions = [
    { name: 'Zambia Institute of Chartered Accountants', slug: 'zica', shortName: 'ZICA', type: 'INSTITUTE', city: 'Lusaka', levelType: 'YEAR', numLevels: 3, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'ACCA Professional', shortName: 'ACCA', code: 'ACCA' }, { name: 'CIPA Professional', shortName: 'CIPA', code: 'CIPA' }] },
    { name: 'Zambia Information and Communications Technology Authority', slug: 'zicta', shortName: 'ZICTA', type: 'INSTITUTE', city: 'Lusaka', levelType: 'YEAR', numLevels: 3, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'ICT Diploma', shortName: 'ICT DIP', code: 'ICT-DIP' }, { name: 'ICT Certificate', shortName: 'ICT CERT', code: 'ICT-CERT' }] },
    { name: 'Zambia School of Nursing', slug: 'zsn', shortName: 'ZSN', type: 'MEDICAL_SCHOOL', city: 'Lusaka', levelType: 'YEAR', numLevels: 4, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'General Nursing Diploma', shortName: 'GN DIP', code: 'GN-DIP' }, { name: 'Midwifery Diploma', shortName: 'MW DIP', code: 'MW-DIP' }] },
    { name: 'Zambia Business School', slug: 'zbs', shortName: 'ZBS', type: 'BUSINESS_SCHOOL', city: 'Lusaka', levelType: 'YEAR', numLevels: 3, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Business Administration', shortName: 'BA', code: 'BA' }, { name: 'Accounting', shortName: 'ACC', code: 'ACC' }] },
    { name: 'Zambia Technical College', slug: 'ztc', shortName: 'ZTC', type: 'TECHNICAL_COLLEGE', city: 'Lusaka', levelType: 'YEAR', numLevels: 3, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Electrical Engineering', shortName: 'EE', code: 'EE' }, { name: 'Mechanical Engineering', shortName: 'ME', code: 'ME' }, { name: 'Civil Engineering', shortName: 'CE', code: 'CE' }] },
    { name: 'Zambia Vocational School', slug: 'zvs', shortName: 'ZVS', type: 'VOCATIONAL_SCHOOL', city: 'Lusaka', levelType: 'YEAR', numLevels: 2, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Carpentry', shortName: 'CARP', code: 'CARP' }, { name: 'Plumbing', shortName: 'PLUMB', code: 'PLUMB' }, { name: 'Welding', shortName: 'WELD', code: 'WELD' }] },
    { name: 'Zambia School of Agriculture', slug: 'zsa', shortName: 'ZSA', type: 'INSTITUTE', city: 'Lusaka', levelType: 'YEAR', numLevels: 3, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Agriculture Diploma', shortName: 'AG DIP', code: 'AG-DIP' }] },
    { name: 'Zambia School of Tourism', slug: 'zstour', shortName: 'ZSTour', type: 'INSTITUTE', city: 'Lusaka', levelType: 'YEAR', numLevels: 2, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Tourism Diploma', shortName: 'TOUR DIP', code: 'TOUR-DIP' }] },
    { name: 'Zambia School of Hospitality', slug: 'zsh', shortName: 'ZSH', type: 'INSTITUTE', city: 'Lusaka', levelType: 'YEAR', numLevels: 2, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Hospitality Diploma', shortName: 'HOSP DIP', code: 'HOSP-DIP' }] },
    { name: 'Zambia School of Fashion Design', slug: 'zsfd', shortName: 'ZSFD', type: 'VOCATIONAL_SCHOOL', city: 'Lusaka', levelType: 'YEAR', numLevels: 2, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Fashion Design', shortName: 'FD', code: 'FD' }] },
    { name: 'Zambia School of Media', slug: 'zsm', shortName: 'ZSM', type: 'INSTITUTE', city: 'Lusaka', levelType: 'YEAR', numLevels: 2, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Media Studies Diploma', shortName: 'MS DIP', code: 'MS-DIP' }] },
    { name: 'Zambia School of Law', slug: 'zsl', shortName: 'ZSL', type: 'INSTITUTE', city: 'Lusaka', levelType: 'YEAR', numLevels: 2, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Law Diploma', shortName: 'LAW DIP', code: 'LAW-DIP' }] },
    { name: 'Zambia School of Public Health', slug: 'zsph', shortName: 'ZSPH', type: 'MEDICAL_SCHOOL', city: 'Lusaka', levelType: 'YEAR', numLevels: 2, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Public Health Diploma', shortName: 'PH DIP', code: 'PH-DIP' }] },
    { name: 'Zambia School of Pharmacy', slug: 'zsp', shortName: 'ZSP', type: 'MEDICAL_SCHOOL', city: 'Lusaka', levelType: 'YEAR', numLevels: 2, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Pharmacy Diploma', shortName: 'PHARM DIP', code: 'PHARM-DIP' }] },
    { name: 'Zambia School of Nutrition', slug: 'zsnut', shortName: 'ZSNut', type: 'MEDICAL_SCHOOL', city: 'Lusaka', levelType: 'YEAR', numLevels: 2, periodType: 'SEMESTER', numPeriods: 2, programmes: [{ name: 'Nutrition Diploma', shortName: 'NUT DIP', code: 'NUT-DIP' }] },
  ];

  for (const instData of institutions) {
    const inst = await prisma.university.upsert({
      where: { slug: instData.slug },
      update: {},
      create: {
        name: instData.name,
        slug: instData.slug,
        shortName: instData.shortName,
        type: instData.type,
        city: instData.city,
        levelType: instData.levelType,
        numLevels: instData.numLevels,
        periodType: instData.periodType,
        numPeriods: instData.numPeriods,
        isActive: true,
        levels: {
          create: Array.from({ length: instData.numLevels }, (_, i) => ({
            name: `Year ${i + 1}`,
            order: i + 1,
          })),
        },
        periods: {
          create: Array.from({ length: instData.numPeriods }, (_, i) => ({
            name: `Semester ${i + 1}`,
            order: i + 1,
            academicYear: 2025,
          })),
        },
      },
    });

    for (const progData of instData.programmes) {
      await prisma.programme.upsert({
        where: { institutionId_code: { institutionId: inst.id, code: progData.code } },
        update: {},
        create: {
          name: progData.name,
          shortName: progData.shortName,
          code: progData.code,
          institutionId: inst.id,
        },
      });
    }
    console.log(`✓ ${inst.name} (${instData.programmes.length} programmes)`);
  }

  console.log('\nDone!');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
