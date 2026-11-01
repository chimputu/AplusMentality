import { describe, it, expect, vi } from 'vitest';

const mockPrisma = {
  user: {
    findUnique: vi.fn().mockResolvedValue({ id: 'test-user', clerkId: 'test-user-id', role: 'ADMIN', email: 'admin@test.com' }),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  programme: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  course: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  institution: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  faculty: { findUnique: vi.fn(), findMany: vi.fn() },
  tutor: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  university: { findUnique: vi.fn(), findMany: vi.fn() },
  legacyUniversity: { findMany: vi.fn() },
  academicLevel: { findUnique: vi.fn(), findMany: vi.fn() },
  academicPeriod: { findMany: vi.fn() },
  branch: { findMany: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

const prisma = mockPrisma;

describe('createTutor', () => {
  it('validates full name minimum length', async () => {
    const { createTutor } = await import('@/lib/actions/tutor-crud');
    await expect(createTutor({
      fullName: 'A',
      email: 'tutor@test.com',
    })).rejects.toThrow();
  });

  it('validates email format', async () => {
    const { createTutor } = await import('@/lib/actions/tutor-crud');
    await expect(createTutor({
      fullName: 'John Doe',
      email: 'not-an-email',
    })).rejects.toThrow();
  });

  it('checks email uniqueness', async () => {
    (prisma.tutor.findUnique as any).mockResolvedValue({ id: 'existing' });

    const { createTutor } = await import('@/lib/actions/tutor-crud');
    await expect(createTutor({
      fullName: 'John Doe',
      email: 'tutor@test.com',
    })).rejects.toThrow('already exists');
  });

  it('creates tutor with valid data', async () => {
    (prisma.tutor.findUnique as any).mockResolvedValue(null);
    (prisma.tutor.create as any).mockResolvedValue({
      id: 'tutor-1',
      fullName: 'John Doe',
      email: 'tutor@test.com',
    });

    const { createTutor } = await import('@/lib/actions/tutor-crud');
    const result = await createTutor({
      fullName: 'John Doe',
      email: 'tutor@test.com',
    });

    expect(result.fullName).toBe('John Doe');
    expect(prisma.tutor.create).toHaveBeenCalled();
  });
});

describe('updateTutor', () => {
  it('validates full name minimum length', async () => {
    const { updateTutor } = await import('@/lib/actions/tutor-crud');
    await expect(updateTutor('tutor-1', { fullName: 'A' })).rejects.toThrow();
  });

  it('validates email format', async () => {
    const { updateTutor } = await import('@/lib/actions/tutor-crud');
    await expect(updateTutor('tutor-1', { email: 'not-an-email' })).rejects.toThrow();
  });
});

describe('toggleTutorStatus', () => {
  it('updates tutor active status', async () => {
    (prisma.tutor.update as any).mockResolvedValue({ id: 'tutor-1', isActive: false });

    const { toggleTutorStatus } = await import('@/lib/actions/tutor-crud');
    await toggleTutorStatus('tutor-1', false);

    expect(prisma.tutor.update).toHaveBeenCalledWith({
      where: { id: 'tutor-1' },
      data: { isActive: false },
    });
  });
});

describe('deleteTutor', () => {
  it('deletes the tutor', async () => {
    (prisma.tutor.delete as any).mockResolvedValue({ id: 'tutor-1' });

    const { deleteTutor } = await import('@/lib/actions/tutor-crud');
    await deleteTutor('tutor-1');

    expect(prisma.tutor.delete).toHaveBeenCalledWith({ where: { id: 'tutor-1' } });
  });
});

describe('listInstitutions', () => {
  it('returns institutions ordered by name', async () => {
    (prisma.university.findMany as any).mockResolvedValue([
      { id: '1', name: 'University A', slug: 'ua' },
    ]);

    const { listInstitutions } = await import('@/lib/actions/tutor-crud');
    const result = await listInstitutions();

    expect(result).toHaveLength(1);
    expect(prisma.university.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: 'asc' } })
    );
  });
});

describe('listCourses', () => {
  it('returns only published courses', async () => {
    (prisma.course.findMany as any).mockResolvedValue([]);

    const { listCourses } = await import('@/lib/actions/tutor-crud');
    await listCourses();

    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublished: true },
        take: 100,
      })
    );
  });
});
