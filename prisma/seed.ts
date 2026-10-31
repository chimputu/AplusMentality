import { config } from "dotenv";
config(); // Load .env file

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, InstitutionType, LevelType, PeriodType, Role } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Check .env in your project root.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface SeedProgramme {
  code: string;
  name: string;
  facultyCode?: string;
}

interface SeedFaculty {
  code: string;
  name: string;
}

interface SeedInstitution {
  name: string;
  slug: string;
  shortName?: string;
  type: InstitutionType;
  levelType: LevelType;
  numLevels: number;
  periodType: PeriodType;
  numPeriods: number;
  hasFaculties: boolean;
  hasBranches: boolean;
  province: string;
  city: string;
  website: string;
  email: string;
  phone: string;
  description: string;
  faculties?: SeedFaculty[];
  programmes?: SeedProgramme[];
}

const institutions: SeedInstitution[] = [
  // 1. University of Zambia
  {
    name: "University of Zambia",
    slug: "unza",
    shortName: "UNZA",
    type: InstitutionType.UNIVERSITY,
    levelType: LevelType.YEAR,
    numLevels: 5,
    periodType: PeriodType.TERM,
    numPeriods: 3,
    hasFaculties: true,
    hasBranches: true,
    province: "Lusaka",
    city: "Lusaka",
    website: "https://www.unza.zm",
    email: "info@unza.zm",
    phone: "+260 211 327101",
    description: "The University of Zambia is the oldest and largest public university in Zambia, founded in 1965. It offers a wide range of undergraduate and postgraduate programmes across multiple faculties.",
    faculties: [
      { code: "ICT", name: "Faculty of Information & Communication Technology" },
      { code: "ENG", name: "Faculty of Engineering" },
      { code: "MED", name: "Faculty of Health Sciences" },
      { code: "EDU", name: "Faculty of Education" },
      { code: "BUS", name: "Faculty of Commerce & Management Sciences" },
      { code: "LAW", name: "Faculty of Law" },
    ],
    programmes: [
      { code: "BSC-CS", name: "BSc Computer Science", facultyCode: "ICT" },
      { code: "BSC-IT", name: "BSc Information Technology", facultyCode: "ICT" },
      { code: "BENG-CIV", name: "BEng Civil Engineering", facultyCode: "ENG" },
      { code: "BENG-EE", name: "BEng Electrical Engineering", facultyCode: "ENG" },
      { code: "MBCHB", name: "MBChB Medicine", facultyCode: "MED" },
      { code: "BBA", name: "Bachelor of Business Administration", facultyCode: "BUS" },
      { code: "LLB", name: "Bachelor of Laws", facultyCode: "LAW" },
      { code: "BED", name: "Bachelor of Education", facultyCode: "EDU" },
    ],
  },
  // 2. Copperbelt University
  {
    name: "Copperbelt University",
    slug: "cbu",
    shortName: "CBU",
    type: InstitutionType.UNIVERSITY,
    levelType: LevelType.YEAR,
    numLevels: 4,
    periodType: PeriodType.SEMESTER,
    numPeriods: 2,
    hasFaculties: true,
    hasBranches: true,
    province: "Copperbelt",
    city: "Ndola",
    website: "https://www.cbu.ac.zm",
    email: "info@cbu.ac.zm",
    phone: "+260 212 621501",
    description: "Copperbelt University is a leading public university in Zambia, known for its strong engineering, mining, and business programmes. Founded in 1967, it serves the mining and industrial communities of the Copperbelt region.",
    faculties: [
      { code: "ENG", name: "Faculty of Engineering" },
      { code: "BUS", name: "Faculty of Commerce & Management Sciences" },
      { code: "MIN", name: "Faculty of Mining & Mineral Processing Engineering" },
      { code: "NAT", name: "Faculty of Natural Sciences" },
      { code: "BE", name: "Faculty of Built Environment" },
    ],
    programmes: [
      { code: "BENG-MIN", name: "BEng Mining Engineering", facultyCode: "MIN" },
      { code: "BSC-ACC", name: "BSc Accounting", facultyCode: "BUS" },
      { code: "BSC-BA", name: "BSc Business Administration", facultyCode: "BUS" },
      { code: "BSC-MET", name: "BSc Metallurgy", facultyCode: "ENG" },
      { code: "BSC-CS", name: "BSc Computer Science", facultyCode: "NAT" },
    ],
  },
  // 3. University of Lusaka
  {
    name: "University of Lusaka",
    slug: "unilus",
    shortName: "UNILUS",
    type: InstitutionType.UNIVERSITY,
    levelType: LevelType.YEAR,
    numLevels: 5,
    periodType: PeriodType.TERM,
    numPeriods: 3,
    hasFaculties: true,
    hasBranches: false,
    province: "Lusaka",
    city: "Lusaka",
    website: "https://www.unilus.ac.zm",
    email: "info@unilus.ac.zm",
    phone: "+260 211 282211",
    description: "The University of Lusaka is a private university established in 1992, offering programmes in health sciences, business, and law. It operates on a trimester system.",
    faculties: [
      { code: "MED", name: "Faculty of Health Sciences" },
      { code: "BUS", name: "Faculty of Business & Management" },
      { code: "LAW", name: "Faculty of Law" },
    ],
    programmes: [
      { code: "MBCHB", name: "MBChB Medicine", facultyCode: "MED" },
      { code: "BNUR", name: "BSc Nursing", facultyCode: "MED" },
      { code: "BBA", name: "Bachelor of Business Administration", facultyCode: "BUS" },
      { code: "LLB", name: "Bachelor of Laws", facultyCode: "LAW" },
    ],
  },
  // 4. Mulungushi University
  {
    name: "Mulungushi University",
    slug: "mulungushi",
    shortName: "MU",
    type: InstitutionType.UNIVERSITY,
    levelType: LevelType.YEAR,
    numLevels: 4,
    periodType: PeriodType.SEMESTER,
    numPeriods: 2,
    hasFaculties: true,
    hasBranches: false,
    province: "Southern",
    city: "Choma",
    website: "https://www.mu.ac.zm",
    email: "info@mu.ac.zm",
    phone: "+260 213 223201",
    description: "Mulungushi University is a public university located in Choma, Southern Province. Established in 1998, it focuses on business, science, and agriculture programmes.",
    faculties: [
      { code: "BUS", name: "Faculty of Business & Management Sciences" },
      { code: "SCI", name: "Faculty of Science & Technology" },
      { code: "AGR", name: "Faculty of Agriculture" },
    ],
    programmes: [
      { code: "BSC-AGB", name: "BSc Agriculture", facultyCode: "AGR" },
      { code: "BSC-CS", name: "BSc Computer Science", facultyCode: "SCI" },
      { code: "BBA", name: "Bachelor of Business Administration", facultyCode: "BUS" },
    ],
  },
  // 5. Zambia Open University
  {
    name: "Zambia Open University",
    slug: "zaou",
    shortName: "ZAOU",
    type: InstitutionType.UNIVERSITY,
    levelType: LevelType.YEAR,
    numLevels: 4,
    periodType: PeriodType.SEMESTER,
    numPeriods: 2,
    hasFaculties: true,
    hasBranches: false,
    province: "Lusaka",
    city: "Lusaka",
    website: "https://www.zaou.ac.zm",
    email: "info@zaou.ac.zm",
    phone: "+260 211 430001",
    description: "Zambia Open University provides distance and open learning opportunities across Zambia. Established in 2015, it offers flexible study programmes in business and education.",
    faculties: [
      { code: "BUS", name: "Faculty of Business & Management" },
      { code: "EDU", name: "Faculty of Education" },
    ],
    programmes: [
      { code: "BBA", name: "Bachelor of Business Administration", facultyCode: "BUS" },
      { code: "BED", name: "Bachelor of Education", facultyCode: "EDU" },
    ],
  },
  // 6. National Institute of Public Administration
  {
    name: "National Institute of Public Administration",
    slug: "nipa",
    shortName: "NIPA",
    type: InstitutionType.COLLEGE,
    levelType: LevelType.YEAR,
    numLevels: 3,
    periodType: PeriodType.SEMESTER,
    numPeriods: 2,
    hasFaculties: true,
    hasBranches: false,
    province: "Lusaka",
    city: "Lusaka",
    website: "https://www.nipa.org.zm",
    email: "info@nipa.org.zm",
    phone: "+260 211 277211",
    description: "The National Institute of Public Administration is a tertiary institution specializing in public administration, business, and ICT training for government and private sector professionals.",
    faculties: [
      { code: "BUS", name: "Faculty of Business Studies" },
      { code: "PA", name: "Faculty of Public Administration" },
      { code: "ICT", name: "Faculty of Information & Communication Technology" },
    ],
    programmes: [
      { code: "DIP-BA", name: "Diploma in Business Administration", facultyCode: "BUS" },
      { code: "DIP-PA", name: "Diploma in Public Administration", facultyCode: "PA" },
      { code: "DIP-IT", name: "Diploma in Information Technology", facultyCode: "ICT" },
    ],
  },
  // 7. Zambia Centre for Accountancy Studies
  {
    name: "Zambia Centre for Accountancy Studies",
    slug: "zcas",
    shortName: "ZCAS",
    type: InstitutionType.COLLEGE,
    levelType: LevelType.YEAR,
    numLevels: 3,
    periodType: PeriodType.SEMESTER,
    numPeriods: 2,
    hasFaculties: false,
    hasBranches: false,
    province: "Lusaka",
    city: "Lusaka",
    website: "https://www.zcas.ac.zm",
    email: "info@zcas.ac.zm",
    phone: "+260 211 381001",
    description: "The Zambia Centre for Accountancy Studies is a specialized institution offering diploma and degree programmes in accounting, business, and marketing.",
    programmes: [
      { code: "DIP-ACC", name: "Diploma in Accounting" },
      { code: "DIP-BA", name: "Diploma in Business Administration" },
      { code: "DIP-MKT", name: "Diploma in Marketing" },
    ],
  },
  // 8. Northern Technical College
  {
    name: "Northern Technical College",
    slug: "nortec",
    shortName: "NORTEC",
    type: InstitutionType.POLYTECHNIC,
    levelType: LevelType.YEAR,
    numLevels: 4,
    periodType: PeriodType.TERM,
    numPeriods: 3,
    hasFaculties: false,
    hasBranches: true,
    province: "Northern",
    city: "Kasama",
    website: "https://www.nortec.ac.zm",
    email: "info@nortec.ac.zm",
    phone: "+260 216 222001",
    description: "Northern Technical College is a polytechnic offering technical and vocational education in engineering disciplines, serving the Northern Province of Zambia.",
    programmes: [
      { code: "DIP-EE", name: "Diploma in Electrical Engineering" },
      { code: "DIP-ME", name: "Diploma in Mechanical Engineering" },
      { code: "DIP-AE", name: "Diploma in Automotive Engineering" },
    ],
  },
  // 9. Evelyn Hone College
  {
    name: "Evelyn Hone College",
    slug: "evelyn-hone",
    shortName: "EHC",
    type: InstitutionType.POLYTECHNIC,
    levelType: LevelType.YEAR,
    numLevels: 3,
    periodType: PeriodType.TERM,
    numPeriods: 3,
    hasFaculties: false,
    hasBranches: false,
    province: "Lusaka",
    city: "Lusaka",
    website: "https://www.evelynhone.ac.zm",
    email: "info@evelynhone.ac.zm",
    phone: "+260 211 277501",
    description: "Evelyn Hone College is a leading institution for journalism, graphic design, and public health media training in Zambia, established in 1966.",
    programmes: [
      { code: "DIP-JRN", name: "Diploma in Journalism" },
      { code: "DIP-GD", name: "Diploma in Graphic Design" },
      { code: "DIP-PHM", name: "Diploma in Public Health Media" },
    ],
  },
  // 10. Chainama College of Health Sciences
  {
    name: "Chainama College of Health Sciences",
    slug: "chainama",
    shortName: "CCHS",
    type: InstitutionType.MEDICAL_SCHOOL,
    levelType: LevelType.STAGE,
    numLevels: 5,
    periodType: PeriodType.BLOCK,
    numPeriods: 6,
    hasFaculties: true,
    hasBranches: true,
    province: "Southern",
    city: "Choma",
    website: "https://www.chainama.ac.zm",
    email: "info@chainama.ac.zm",
    phone: "+260 213 222301",
    description: "Chainama College of Health Sciences is a specialized medical school offering nursing, mental health, and clinical medicine programmes using a stage-based curriculum with block teaching.",
    faculties: [
      { code: "NUR", name: "Faculty of Nursing" },
      { code: "MH", name: "Faculty of Mental Health" },
      { code: "CM", name: "Faculty of Clinical Medicine" },
    ],
    programmes: [
      { code: "DIP-NUR", name: "Diploma in Nursing", facultyCode: "NUR" },
      { code: "DIP-MH", name: "Diploma in Mental Health", facultyCode: "MH" },
      { code: "DIP-CM", name: "Diploma in Clinical Medicine", facultyCode: "CM" },
    ],
  },
  // 11. Graduate School of Business - UNZA
  {
    name: "Graduate School of Business - UNZA",
    slug: "gsb-unza",
    shortName: "GSB",
    type: InstitutionType.BUSINESS_SCHOOL,
    levelType: LevelType.YEAR,
    numLevels: 2,
    periodType: PeriodType.TRIMESTER,
    numPeriods: 3,
    hasFaculties: false,
    hasBranches: true,
    province: "Lusaka",
    city: "Lusaka",
    website: "https://www.gsb.unza.zm",
    email: "gsb@unza.zm",
    phone: "+260 211 327150",
    description: "The Graduate School of Business at UNZA offers postgraduate business programmes including MBA and MSc degrees, operating on a trimester system for accelerated learning.",
    programmes: [
      { code: "MBA", name: "Master of Business Administration" },
      { code: "MSC-FIN", name: "MSc Finance" },
      { code: "MSC-MKT", name: "MSc Marketing" },
    ],
  },
  // 12. Information and Communications University
  {
    name: "Information and Communications University",
    slug: "icu",
    shortName: "ICU",
    type: InstitutionType.UNIVERSITY,
    levelType: LevelType.YEAR,
    numLevels: 4,
    periodType: PeriodType.SEMESTER,
    numPeriods: 2,
    hasFaculties: true,
    hasBranches: true,
    province: "Lusaka",
    city: "Lusaka",
    website: "https://www.icu.ac.zm",
    email: "info@icu.ac.zm",
    phone: "+260 211 440001",
    description: "The Information and Communications University is a specialized university focusing on ICT, business, and engineering education, preparing graduates for the digital economy.",
    faculties: [
      { code: "ICT", name: "Faculty of Information & Communication Technology" },
      { code: "BUS", name: "Faculty of Business" },
      { code: "ENG", name: "Faculty of Engineering" },
    ],
    programmes: [
      { code: "BSC-CS", name: "BSc Computer Science", facultyCode: "ICT" },
      { code: "BSC-IT", name: "BSc Information Technology", facultyCode: "ICT" },
      { code: "BBA", name: "Bachelor of Business Administration", facultyCode: "BUS" },
    ],
  },
];

function getLevelPrefix(levelType: LevelType): string {
  switch (levelType) {
    case LevelType.YEAR:
      return "Year";
    case LevelType.STAGE:
      return "Stage";
    case LevelType.PHASE:
      return "Phase";
    case LevelType.GRADE:
      return "Grade";
  }
}

function getPeriodPrefix(periodType: PeriodType): string {
  switch (periodType) {
    case PeriodType.SEMESTER:
      return "Semester";
    case PeriodType.TERM:
      return "Term";
    case PeriodType.TRIMESTER:
      return "Trimester";
    case PeriodType.QUARTER:
      return "Quarter";
    case PeriodType.BLOCK:
      return "Block";
  }
}

async function main() {
  console.log("🌱 Starting seed...\n");

  // Create default super admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@aplusmentality.com" },
    update: {},
    create: {
      email: "admin@aplusmentality.com",
      clerkId: "seed_admin_clerk_id",
      role: Role.SUPER_ADMIN,
      onboarded: true,
      name: "System Administrator",
    },
  });
  console.log(`✅ Super Admin: ${admin.email} (${admin.role})\n`);

  let totalLevels = 0;
  let totalPeriods = 0;
  let totalFaculties = 0;
  let totalProgrammes = 0;

  for (const inst of institutions) {
    // 1. Upsert institution
    const institution = await prisma.university.upsert({
      where: { slug: inst.slug },
      update: {
        name: inst.name,
        shortName: inst.shortName,
        type: inst.type,
        description: inst.description,
        country: "Zambia",
        province: inst.province,
        city: inst.city,
        website: inst.website,
        email: inst.email,
        phone: inst.phone,
        levelType: inst.levelType,
        numLevels: inst.numLevels,
        periodType: inst.periodType,
        numPeriods: inst.numPeriods,
        hasFaculties: inst.hasFaculties,
        hasBranches: inst.hasBranches,
        isActive: true,
        isVerified: true,
      },
      create: {
        name: inst.name,
        slug: inst.slug,
        shortName: inst.shortName,
        type: inst.type,
        description: inst.description,
        country: "Zambia",
        province: inst.province,
        city: inst.city,
        website: inst.website,
        email: inst.email,
        phone: inst.phone,
        levelType: inst.levelType,
        numLevels: inst.numLevels,
        periodType: inst.periodType,
        numPeriods: inst.numPeriods,
        hasFaculties: inst.hasFaculties,
        hasBranches: inst.hasBranches,
        isActive: true,
        isVerified: true,
      },
    });

    // 2. Delete existing levels and periods
    await prisma.academicLevel.deleteMany({ where: { institutionId: institution.id } });
    await prisma.academicPeriod.deleteMany({ where: { institutionId: institution.id } });

    // 3. Auto-generate AcademicLevels
    const levelPrefix = getLevelPrefix(inst.levelType);
    const levels = [];
    for (let i = 1; i <= inst.numLevels; i++) {
      levels.push(
        prisma.academicLevel.create({
          data: {
            institutionId: institution.id,
            name: `${levelPrefix} ${i}`,
            order: i,
          },
        })
      );
    }
    await Promise.all(levels);
    totalLevels += inst.numLevels;

    // 4. Auto-generate AcademicPeriods
    const periodPrefix = getPeriodPrefix(inst.periodType);
    const periods = [];
    for (let i = 1; i <= inst.numPeriods; i++) {
      periods.push(
        prisma.academicPeriod.create({
          data: {
            institutionId: institution.id,
            name: `${periodPrefix} ${i}`,
            order: i,
            academicYear: 2025,
          },
        })
      );
    }
    await Promise.all(periods);
    totalPeriods += inst.numPeriods;

    // 5. Upsert Faculties
    let facultyCount = 0;
    if (inst.hasFaculties && inst.faculties) {
      for (const fac of inst.faculties) {
        await prisma.faculty.upsert({
          where: { institutionId_code: { institutionId: institution.id, code: fac.code } },
          update: { name: fac.name },
          create: {
            institutionId: institution.id,
            code: fac.code,
            name: fac.name,
          },
        });
        facultyCount++;
      }
      totalFaculties += facultyCount;
    }

    // 6. Upsert Programmes
    let programmeCount = 0;
    if (inst.programmes) {
      for (const prog of inst.programmes) {
        // Find faculty if linked
        let facultyId: string | undefined;
        if (prog.facultyCode) {
          const faculty = await prisma.faculty.findUnique({
            where: { institutionId_code: { institutionId: institution.id, code: prog.facultyCode } },
          });
          if (faculty) facultyId = faculty.id;
        }

        await prisma.programme.upsert({
          where: {
            institutionId_code: {
              institutionId: institution.id,
              code: prog.code,
            },
          },
          update: {
            name: prog.name,
            facultyId,
          },
          create: {
            name: prog.name,
            code: prog.code,
            institutionId: institution.id,
            facultyId,
          },
        });
        programmeCount++;
      }
      totalProgrammes += programmeCount;
    }

    console.log(`✅ Institution: ${inst.name} (${inst.type})`);
    console.log(`   📚 Levels: ${inst.numLevels} (${levelPrefix} 1–${inst.numLevels})`);
    console.log(`   📅 Periods: ${inst.numPeriods} (${periodPrefix} 1–${inst.numPeriods})`);
    if (facultyCount > 0) console.log(`   🏛️  Faculties: ${facultyCount}`);
    if (programmeCount > 0) console.log(`   🎓 Programmes: ${programmeCount}`);
    console.log();
  }

  console.log("═══════════════════════════════════════════");
  console.log(`📊 Seed Summary:`);
  console.log(`   Institutions: ${institutions.length}`);
  console.log(`   Academic Levels: ${totalLevels}`);
  console.log(`   Academic Periods: ${totalPeriods}`);
  console.log(`   Faculties: ${totalFaculties}`);
  console.log(`   Programmes: ${totalProgrammes}`);
  console.log("═══════════════════════════════════════════");
  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
