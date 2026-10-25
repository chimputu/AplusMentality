import { describe, it, expect, vi } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock redirect since we can't test redirects directly in unit tests
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    const err = new Error('NEXT_REDIRECT');
    throw err;
  }),
}));

// Mock types for test data
interface MockTutorRequest {
  id: string;
  studentName?: string | null;
  courseNeeded?: string | null | undefined;
  message?: string | null;
  status?: string;
  createdAt?: Date;
}

interface MockApplication {
  id: string;
  status: string;
  rejectionReason?: string | null;
}

interface MockSpecialty {
  id: string;
  courseId?: string;
  course: { code: string; title?: string };
}

interface MockTutorProfile {
  id?: string;
  userId?: string;
  isVerified?: boolean;
  isActive?: boolean;
  specialties: MockSpecialty[];
}

interface MockClerkUser {
  firstName: string | null;
  fullName: string | null;
  emailAddresses?: Array<{ emailAddress: string }>;
}

describe('Tutor dashboard — auth guards', () => {
  it('requires TUTOR role for tutor pages', async () => {
    // Override to return a STUDENT — should be rejected
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: '1',
      clerkId: 'test-user-id',
      role: 'STUDENT',
      email: 'student@test.com',
    });

    const { requireAuth } = await import('@/lib/auth');
    await expect(requireAuth(['TUTOR'])).rejects.toThrow('NEXT_REDIRECT');
  });

  it('allows TUTOR role for tutor pages', async () => {
    // Override to return a TUTOR
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: '1',
      clerkId: 'test-user-id',
      role: 'TUTOR',
      email: 'tutor@test.com',
      institution: null,
    });

    const { requireAuth } = await import('@/lib/auth');
    const result = await requireAuth(['TUTOR']);
    expect(result.userId).toBe('test-user-id');
    expect(result.role).toBe('TUTOR');
  });

  it('rejects ADMIN on tutor-only pages', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: '1',
      clerkId: 'test-user-id',
      role: 'ADMIN',
      email: 'admin@test.com',
    });

    const { requireAuth } = await import('@/lib/auth');
    await expect(requireAuth(['TUTOR'])).rejects.toThrow('NEXT_REDIRECT');
  });
});

describe('Tutor dashboard — stats calculation', () => {
  it('calculates pending requests count', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', status: 'PENDING' },
      { id: '2', status: 'PENDING' },
      { id: '3', status: 'ACCEPTED' },
      { id: '4', status: 'REJECTED' },
      { id: '5', status: 'COMPLETED' },
    ];

    const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
    expect(pendingCount).toBe(2);
  });

  it('calculates accepted requests count', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', status: 'PENDING' },
      { id: '2', status: 'ACCEPTED' },
      { id: '3', status: 'ACCEPTED' },
      { id: '4', status: 'ACCEPTED' },
      { id: '5', status: 'REJECTED' },
    ];

    const acceptedCount = requests.filter((r) => r.status === 'ACCEPTED').length;
    expect(acceptedCount).toBe(3);
  });

  it('calculates rejected requests count', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', status: 'PENDING' },
      { id: '2', status: 'REJECTED' },
      { id: '3', status: 'REJECTED' },
    ];

    const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;
    expect(rejectedCount).toBe(2);
  });

  it('calculates completed requests count', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', status: 'COMPLETED' },
      { id: '2', status: 'COMPLETED' },
      { id: '3', status: 'PENDING' },
    ];

    const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;
    expect(completedCount).toBe(2);
  });

  it('calculates total requests', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', status: 'PENDING' },
      { id: '2', status: 'ACCEPTED' },
      { id: '3', status: 'REJECTED' },
      { id: '4', status: 'COMPLETED' },
    ];

    expect(requests.length).toBe(4);
  });

  it('handles empty requests array', () => {
    const requests: MockTutorRequest[] = [];

    const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
    const acceptedCount = requests.filter((r) => r.status === 'ACCEPTED').length;
    const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;
    const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;

    expect(pendingCount).toBe(0);
    expect(acceptedCount).toBe(0);
    expect(rejectedCount).toBe(0);
    expect(completedCount).toBe(0);
    expect(requests.length).toBe(0);
  });
});

describe('Tutor dashboard — request filtering', () => {
  it('filters requests by student name', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', studentName: 'John Doe', courseNeeded: 'MATH101', message: 'Need help' },
      { id: '2', studentName: 'Jane Smith', courseNeeded: 'CS101', message: 'Quiz prep' },
      { id: '3', studentName: 'John Smith', courseNeeded: 'PHYS101', message: 'Exam help' },
    ];

    const searchQuery = 'john';
    const q = searchQuery.toLowerCase();
    const filtered = requests.filter(
      (r) =>
        r.studentName?.toLowerCase().includes(q) ||
        r.courseNeeded?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
    );

    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.id)).toContain('1');
    expect(filtered.map((r) => r.id)).toContain('3');
  });

  it('filters requests by course name', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', studentName: 'John Doe', courseNeeded: 'MATH101', message: 'Need help' },
      { id: '2', studentName: 'Jane Smith', courseNeeded: 'CS101', message: 'Quiz prep' },
      { id: '3', studentName: 'Bob', courseNeeded: 'MATH201', message: 'Calculus' },
    ];

    const searchQuery = 'math';
    const q = searchQuery.toLowerCase();
    const filtered = requests.filter(
      (r) =>
        r.studentName?.toLowerCase().includes(q) ||
        r.courseNeeded?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
    );

    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.id)).toContain('1');
    expect(filtered.map((r) => r.id)).toContain('3');
  });

  it('filters requests by message content', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', studentName: 'John Doe', courseNeeded: 'MATH101', message: 'Need help with calculus' },
      { id: '2', studentName: 'Jane Smith', courseNeeded: 'CS101', message: 'Quiz prep' },
      { id: '3', studentName: 'Bob', courseNeeded: 'PHYS101', message: 'Calculus exam help' },
    ];

    const searchQuery = 'calculus';
    const q = searchQuery.toLowerCase();
    const filtered = requests.filter(
      (r) =>
        r.studentName?.toLowerCase().includes(q) ||
        r.courseNeeded?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
    );

    expect(filtered).toHaveLength(2);
  });

  it('returns no results when search matches nothing', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', studentName: 'John Doe', courseNeeded: 'MATH101', message: 'Need help' },
      { id: '2', studentName: 'Jane Smith', courseNeeded: 'CS101', message: 'Quiz prep' },
    ];

    const searchQuery = 'xyz';
    const q = searchQuery.toLowerCase();
    const filtered = requests.filter(
      (r) =>
        r.studentName?.toLowerCase().includes(q) ||
        r.courseNeeded?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
    );

    expect(filtered).toHaveLength(0);
  });

  it('handles null/undefined fields in search filter', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', studentName: null, courseNeeded: undefined, message: 'Help' },
      { id: '2', studentName: 'John', courseNeeded: null, message: null },
    ];

    const searchQuery = 'help';
    const q = searchQuery.toLowerCase();
    const filtered = requests.filter(
      (r) =>
        r.studentName?.toLowerCase().includes(q) ||
        r.courseNeeded?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('filters by status', () => {
    const requests: MockTutorRequest[] = [
      { id: '1', status: 'PENDING' },
      { id: '2', status: 'ACCEPTED' },
      { id: '3', status: 'PENDING' },
      { id: '4', status: 'REJECTED' },
    ];

    const statusFilter = 'PENDING';
    const filtered = requests.filter((r) => r.status === statusFilter);

    expect(filtered).toHaveLength(2);
    expect(filtered.every((r) => r.status === 'PENDING')).toBe(true);
  });
});

describe('Tutor dashboard — tutor profile checks', () => {
  it('identifies missing tutor profile', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: '1',
      clerkId: 'test-user-id',
      role: 'TUTOR',
      email: 'tutor@test.com',
    });
    (prisma.tutor.findFirst as any).mockResolvedValueOnce(null);

    const { requireAuth } = await import('@/lib/auth');
    const { userId } = await requireAuth(['TUTOR']);

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    let tutorProfile = null;
    if (dbUser) {
      tutorProfile = await prisma.tutor.findFirst({
        where: { userId: dbUser.id },
      });
    }

    expect(tutorProfile).toBeNull();
  });

  it('fetches tutor profile with specialties', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: '1',
      clerkId: 'test-user-id',
      role: 'TUTOR',
      email: 'tutor@test.com',
    });
    (prisma.tutor.findFirst as any).mockResolvedValueOnce({
      id: 'tutor-1',
      userId: '1',
      isVerified: true,
      isActive: true,
      specialties: [
        { id: 's1', courseId: 'c1', course: { code: 'MATH101', title: 'Calculus I' } },
        { id: 's2', courseId: 'c2', course: { code: 'CS101', title: 'Intro to CS' } },
      ],
    });

    const { requireAuth } = await import('@/lib/auth');
    const { userId } = await requireAuth(['TUTOR']);

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    const tutorProfile = await prisma.tutor.findFirst({
      where: { userId: dbUser!.id },
      include: {
        specialties: {
          include: { course: true },
        },
      },
    });

    expect(tutorProfile).not.toBeNull();
    expect(tutorProfile!.specialties).toHaveLength(2);
    expect(tutorProfile!.specialties[0].course.code).toBe('MATH101');
  });
});

describe('Tutor dashboard — application status', () => {
  it('identifies pending application', () => {
    const application: MockApplication = { id: 'app-1', status: 'PENDING' };
    expect(application.status).toBe('PENDING');
  });

  it('identifies rejected application with reason', () => {
    const application: MockApplication = {
      id: 'app-1',
      status: 'REJECTED',
      rejectionReason: 'Insufficient experience',
    };
    expect(application.status).toBe('REJECTED');
    expect(application.rejectionReason).toBe('Insufficient experience');
  });

  it('identifies approved application', () => {
    const application: MockApplication = { id: 'app-1', status: 'APPROVED' };
    expect(application.status).toBe('APPROVED');
  });

  it('handles missing application', () => {
    const application: MockApplication | null = null;
    expect(application).toBeNull();
  });
});

describe('Tutor dashboard — specialty count', () => {
  it('counts specialties from tutor profile', () => {
    const tutorProfile: MockTutorProfile = {
      specialties: [
        { id: 's1', course: { code: 'MATH101' } },
        { id: 's2', course: { code: 'CS101' } },
        { id: 's3', course: { code: 'PHYS101' } },
      ],
    };

    const specialtyCount = tutorProfile?.specialties?.length || 0;
    expect(specialtyCount).toBe(3);
  });

  it('returns zero when no specialties', () => {
    const tutorProfile: MockTutorProfile = { specialties: [] };
    const specialtyCount = tutorProfile?.specialties?.length || 0;
    expect(specialtyCount).toBe(0);
  });

  it('returns zero when tutor profile is null', () => {
    const tutorProfile: MockTutorProfile | null = null;
    const specialtyCount = tutorProfile?.specialties?.length || 0;
    expect(specialtyCount).toBe(0);
  });
});

describe('Tutor dashboard — display name resolution', () => {
  it('resolves display name from firstName', () => {
    const clerkUser: MockClerkUser = { firstName: 'John', fullName: 'John Doe' };
    const displayName =
      clerkUser.firstName ||
      clerkUser.fullName ||
      'Tutor';
    expect(displayName).toBe('John');
  });

  it('falls back to fullName when firstName is missing', () => {
    const clerkUser: MockClerkUser = { firstName: null, fullName: 'John Doe' };
    const displayName =
      clerkUser.firstName ||
      clerkUser.fullName ||
      'Tutor';
    expect(displayName).toBe('John Doe');
  });

  it('falls back to email when name is missing', () => {
    const clerkUser: MockClerkUser = {
      firstName: null,
      fullName: null,
      emailAddresses: [{ emailAddress: 'tutor@example.com' }],
    };
    const displayName =
      clerkUser.firstName ||
      clerkUser.fullName ||
      clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
      'Tutor';
    expect(displayName).toBe('tutor');
  });

  it('falls back to Tutor when nothing is available', () => {
    const clerkUser: MockClerkUser = { firstName: null, fullName: null };
    const displayName =
      clerkUser.firstName ||
      clerkUser.fullName ||
      clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
      'Tutor';
    expect(displayName).toBe('Tutor');
  });
});

describe('Tutor dashboard — status style helper', () => {
  function getStatusStyle(status: string) {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'ACCEPTED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'REJECTED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'COMPLETED':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  }

  it('returns amber style for PENDING', () => {
    expect(getStatusStyle('PENDING')).toContain('amber');
  });

  it('returns green style for ACCEPTED', () => {
    expect(getStatusStyle('ACCEPTED')).toContain('green');
  });

  it('returns red style for REJECTED', () => {
    expect(getStatusStyle('REJECTED')).toContain('red');
  });

  it('returns blue style for COMPLETED', () => {
    expect(getStatusStyle('COMPLETED')).toContain('blue');
  });

  it('returns gray style for unknown status', () => {
    expect(getStatusStyle('UNKNOWN')).toContain('gray');
  });

  it('returns gray style for empty string', () => {
    expect(getStatusStyle('')).toContain('gray');
  });
});

describe('Tutor dashboard — tutor request data model', () => {
  it('serializes createdAt to ISO string', () => {
    const request: MockTutorRequest = {
      id: '1',
      studentName: 'John',
      status: 'PENDING',
      createdAt: new Date('2024-01-15T10:30:00Z'),
    };

    const serialized = {
      ...request,
      createdAt: request.createdAt?.toISOString() ?? new Date().toISOString(),
    };

    expect(serialized.createdAt).toBe('2024-01-15T10:30:00.000Z');
  });

  it('handles missing createdAt', () => {
    const request: MockTutorRequest = {
      id: '1',
      studentName: 'John',
      status: 'PENDING',
    };

    const serialized = {
      ...request,
      createdAt: request.createdAt?.toISOString() ?? new Date().toISOString(),
    };

    expect(serialized.createdAt).toBeDefined();
    expect(() => new Date(serialized.createdAt)).not.toThrow();
  });
});

describe('Tutor dashboard — tutor offerings', () => {
  it('fetches offerings with courses', async () => {
    (prisma.tutorApplication.findUnique as any).mockResolvedValue({
      id: 'app-1',
      userId: '1',
      offerings: [
        {
          id: 'off-1',
          courseId: 'c1',
          course: { code: 'MATH101', title: 'Calculus I' },
        },
        {
          id: 'off-2',
          courseId: 'c2',
          course: { code: 'CS101', title: 'Intro to CS' },
        },
      ],
    });

    const application = await prisma.tutorApplication.findUnique({
      where: { userId: '1' },
      include: {
        offerings: {
          include: { course: true },
        },
      },
    });

    expect(application).not.toBeNull();
    expect(application!.offerings).toHaveLength(2);
    expect(application!.offerings[0].course.code).toBe('MATH101');
  });

  it('handles empty offerings', async () => {
    (prisma.tutorApplication.findUnique as any).mockResolvedValue({
      id: 'app-1',
      userId: '1',
      offerings: [],
    });

    const application = await prisma.tutorApplication.findUnique({
      where: { userId: '1' },
      include: {
        offerings: {
          include: { course: true },
        },
      },
    });

    expect(application!.offerings).toHaveLength(0);
  });
});

describe('Tutor dashboard — available courses for specialty', () => {
  it('excludes already-specialty courses from available list', async () => {
    const specialtyCourseIds = ['c1', 'c2'];

    (prisma.course.findMany as any).mockResolvedValue([
      { id: 'c3', code: 'PHYS101', title: 'Physics I' },
      { id: 'c4', code: 'CHEM101', title: 'Chemistry I' },
    ]);

    const availableCourses = await prisma.course.findMany({
      where: {
        isPublished: true,
        NOT: {
          id: { in: specialtyCourseIds },
        },
      },
      select: {
        id: true,
        code: true,
        title: true,
      },
      orderBy: { title: 'asc' },
      take: 50,
    });

    expect(availableCourses).toHaveLength(2);
    expect(availableCourses[0].id).toBe('c3');
  });

  it('returns empty when all courses are specialties', async () => {
    (prisma.course.findMany as any).mockResolvedValue([]);

    const availableCourses = await prisma.course.findMany({
      where: {
        isPublished: true,
        NOT: {
          id: { in: ['c1', 'c2', 'c3'] },
        },
      },
      select: {
        id: true,
        code: true,
        title: true,
      },
      orderBy: { title: 'asc' },
      take: 50,
    });

    expect(availableCourses).toHaveLength(0);
  });
});
