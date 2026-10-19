import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: () => new Map([['user-agent', 'test-agent']]),
  cookies: () => new Map(),
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user-id' })),
  currentUser: vi.fn(() => Promise.resolve({ id: 'test-user-id' })),
}));

// Mock Prisma client — returns admin user by default for requireAdmin()
const mockPrisma = {
  user: {
    findUnique: vi.fn().mockResolvedValue({
      id: 'test-user',
      clerkId: 'test-user-id',
      role: 'ADMIN',
      email: 'admin@test.com',
    }),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  programme: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  course: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  institution: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  faculty: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  tutor: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  tutorRequest: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  tutorApplication: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  tutorSpecialty: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  tutorOffering: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  tutorReference: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  university: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  academicLevel: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  academicPeriod: {
    findMany: vi.fn(),
  },
  branch: {
    findMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock next/cache revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    const err = new Error('NEXT_REDIRECT');
    throw err;
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
}));

// Mock Next.js Link
vi.mock('next/link', async () => {
  const React = await vi.importActual('react');
  return {
    default: ({ children, href, ...props }: any) => {
      // @ts-ignore
      return React.createElement('a', { href, ...props }, children);
    },
  };
});

afterEach(() => {
  vi.clearAllMocks();
});
