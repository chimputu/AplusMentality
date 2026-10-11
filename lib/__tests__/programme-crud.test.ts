import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('listProgrammes', () => {
  it('returns paginated results with defaults', async () => {
    const mockProgrammes = [
      { id: '1', name: 'CS', code: 'CS', institution: null as any, faculty: null as any, _count: { branches: 0, courses: 0, tutors: 0, users: 0 } },
    ];
    (prisma.programme.findMany as any).mockResolvedValue(mockProgrammes);
    (prisma.programme.count as any).mockResolvedValue(1);

    const { listProgrammes } = await import('@/lib/actions/programme-crud');
    const result = await listProgrammes();

    expect(result.programmes).toEqual(mockProgrammes);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('filters by search query', async () => {
    (prisma.programme.findMany as any).mockResolvedValue([]);
    (prisma.programme.count as any).mockResolvedValue(0);

    const { listProgrammes } = await import('@/lib/actions/programme-crud');
    await listProgrammes({ search: 'computer' });

    expect(prisma.programme.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.any(Object) }),
            expect.objectContaining({ code: expect.any(Object) }),
            expect.objectContaining({ shortName: expect.any(Object) }),
          ]),
        }),
        skip: 0,
        take: 10,
      })
    );
  });

  it('filters by institution', async () => {
    (prisma.programme.findMany as any).mockResolvedValue([]);
    (prisma.programme.count as any).mockResolvedValue(0);

    const { listProgrammes } = await import('@/lib/actions/programme-crud');
    await listProgrammes({ institutionId: 'inst-1' });

    expect(prisma.programme.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { institutionId: 'inst-1' },
      })
    );
  });

  it('respects pagination parameters', async () => {
    (prisma.programme.findMany as any).mockResolvedValue([]);
    (prisma.programme.count as any).mockResolvedValue(25);

    const { listProgrammes } = await import('@/lib/actions/programme-crud');
    const result = await listProgrammes({ page: 2, pageSize: 10 });

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(3);
    expect(prisma.programme.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });
});

describe('createProgramme', () => {
  it('validates name minimum length', async () => {
    const { createProgramme } = await import('@/lib/actions/programme-crud');
    await expect(createProgramme({ name: 'ab', institutionId: 'inst-1' })).rejects.toThrow();
  });

  it('requires institutionId', async () => {
    const { createProgramme } = await import('@/lib/actions/programme-crud');
    await expect(createProgramme({ name: 'Computer Science' })).rejects.toThrow();
  });

  it('checks code uniqueness within institution', async () => {
    (prisma.programme.findUnique as any).mockResolvedValue({ id: 'existing' });

    const { createProgramme } = await import('@/lib/actions/programme-crud');
    await expect(createProgramme({
      name: 'Computer Science',
      code: 'CS',
      institutionId: 'inst-1',
    })).rejects.toThrow('Code is already taken');
  });
});

describe('updateProgramme', () => {
  it('validates name minimum length', async () => {
    const { updateProgramme } = await import('@/lib/actions/programme-crud');
    await expect(updateProgramme('prog-1', { name: 'ab' })).rejects.toThrow();
  });
});

describe('deleteProgramme', () => {
  it('requires valid programme ID', async () => {
    (prisma.programme.findUnique as any).mockResolvedValue(null);

    const { deleteProgramme } = await import('@/lib/actions/programme-crud');
    await expect(deleteProgramme('nonexistent')).rejects.toThrow();
  });
});
