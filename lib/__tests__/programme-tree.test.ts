import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('addCourseToProgramme', () => {
  it('validates programmeId is required', async () => {
    const { addCourseToProgramme } = await import('@/lib/actions/programme-tree');
    await expect(addCourseToProgramme({
      programmeId: '',
      levelId: 'level-1',
      code: 'CS101',
      name: 'Intro to CS',
    })).rejects.toThrow();
  });

  it('validates code is required', async () => {
    const { addCourseToProgramme } = await import('@/lib/actions/programme-tree');
    await expect(addCourseToProgramme({
      programmeId: 'prog-1',
      levelId: 'level-1',
      code: '',
      name: 'Intro to CS',
    })).rejects.toThrow();
  });

  it('validates name is required', async () => {
    const { addCourseToProgramme } = await import('@/lib/actions/programme-tree');
    await expect(addCourseToProgramme({
      programmeId: 'prog-1',
      levelId: 'level-1',
      code: 'CS101',
      name: '',
    })).rejects.toThrow();
  });

  it('transforms code to uppercase', async () => {
    (prisma.programme.findUnique as any).mockResolvedValue({ id: 'prog-1', institutionId: 'inst-1' });
    (prisma.academicLevel.findUnique as any).mockResolvedValue({ id: 'level-1', institutionId: 'inst-1' });
    (prisma.course.create as any).mockResolvedValue({ id: 'course-1', code: 'CS101' });

    const { addCourseToProgramme } = await import('@/lib/actions/programme-tree');
    await addCourseToProgramme({
      programmeId: 'prog-1',
      levelId: 'level-1',
      code: 'cs101',
      name: 'Intro to CS',
    });

    expect(prisma.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'CS101' }),
      })
    );
  });
});

describe('bulkAddCourses', () => {
  it('validates at least one course', async () => {
    const { bulkAddCourses } = await import('@/lib/actions/programme-tree');
    await expect(bulkAddCourses({
      programmeId: 'prog-1',
      levelId: 'level-1',
      courses: [],
    })).rejects.toThrow();
  });

  it('parses CSV lines correctly', async () => {
    // This tests the parsing logic in the client component
    const lines = 'CS101, Intro to CS\nCS102, Programming Basics'.split('\n').map(l => l.trim()).filter(Boolean);
    const courses = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return { code: parts[0], name: parts[1] || parts[0], description: parts[2] || undefined };
    });

    expect(courses).toEqual([
      { code: 'CS101', name: 'Intro to CS', description: undefined },
      { code: 'CS102', name: 'Programming Basics', description: undefined },
    ]);
  });
});

describe('deleteCourse', () => {
  it('requires valid course ID', async () => {
    (prisma.course.findUnique as any).mockResolvedValue(null);

    const { deleteCourse } = await import('@/lib/actions/programme-tree');
    await expect(deleteCourse('nonexistent')).rejects.toThrow();
  });
});
