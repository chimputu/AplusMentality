import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TutorContent from '@/components/TutorContent';

interface MockCourse {
  code: string;
  title: string;
}

interface MockSpecialty {
  id: string;
  courseId: string;
  course: MockCourse;
}

interface MockTutorProfile {
  id: string;
  userId: string;
  isVerified: boolean;
  isActive: boolean;
  specialties: MockSpecialty[];
}

interface MockRequest {
  id: string;
  studentName: string;
  courseNeeded: string | null;
  status: string;
  createdAt: Date;
}

interface MockApplication {
  id: string;
  status: string;
  rejectionReason?: string | null;
}

interface MockStats {
  pendingRequests: number;
  acceptedRequests: number;
  totalRequests: number;
  specialtyCount: number;
  isVerified: boolean;
  isActive: boolean;
  applicationStatus: string | null;
}

describe('TutorContent component', () => {
  const baseProps: {
    displayName: string;
    tutorProfile: MockTutorProfile;
    requests: MockRequest[];
    application: MockApplication | null;
    stats: MockStats;
    institutionName: string | null;
  } = {
    displayName: 'John Doe',
    tutorProfile: {
      id: 'tutor-1',
      userId: '1',
      isVerified: true,
      isActive: true,
      specialties: [
        { id: 's1', courseId: 'c1', course: { code: 'MATH101', title: 'Calculus I' } },
        { id: 's2', courseId: 'c2', course: { code: 'CS101', title: 'Intro to CS' } },
      ],
    },
    requests: [
      {
        id: 'r1',
        studentName: 'Alice',
        courseNeeded: 'MATH101',
        status: 'PENDING',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      },
      {
        id: 'r2',
        studentName: 'Bob',
        courseNeeded: 'CS101',
        status: 'ACCEPTED',
        createdAt: new Date('2024-01-14T08:00:00Z'),
      },
    ],
    application: null,
    stats: {
      pendingRequests: 1,
      acceptedRequests: 1,
      totalRequests: 2,
      specialtyCount: 2,
      isVerified: true,
      isActive: true,
      applicationStatus: null,
    },
    institutionName: 'UNZA',
  };

  it('renders welcome message with display name', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('John Doe!')).toBeInTheDocument();
  });

  it('renders institution name in welcome section', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText(/Teaching at UNZA/)).toBeInTheDocument();
  });

  it('shows fallback text when no institution', () => {
    render(<TutorContent {...baseProps} institutionName={null} />);
    expect(screen.getByText(/Manage your tutoring sessions/)).toBeInTheDocument();
  });

  it('renders verified badge when isVerified is true', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('does not render verified badge when isVerified is false', () => {
    render(
      <TutorContent
        {...baseProps}
        stats={{ ...baseProps.stats, isVerified: false }}
        tutorProfile={{ ...baseProps.tutorProfile, isVerified: false }}
      />
    );
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('renders active badge when isActive is true', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('does not render active badge when isActive is false', () => {
    render(
      <TutorContent
        {...baseProps}
        stats={{ ...baseProps.stats, isActive: false }}
        tutorProfile={{ ...baseProps.tutorProfile, isActive: false }}
      />
    );
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('renders stats cards with correct values', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('Pending Requests')).toBeInTheDocument();
    expect(screen.getByText('Accepted Sessions')).toBeInTheDocument();
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('Specialties')).toBeInTheDocument();
    // Use getAllByText since multiple stat cards may show the same number
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getAllByText('2')).toHaveLength(2);
  });

  it('renders quick action links', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('View Requests')).toBeInTheDocument();
    expect(screen.getByText('My Specialties')).toBeInTheDocument();
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Application Status')).toBeInTheDocument();
    expect(screen.getByText('Ratings & Reviews')).toBeInTheDocument();
    expect(screen.getByText('My Offerings')).toBeInTheDocument();
  });

  it('renders recent requests section', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('Recent Requests')).toBeInTheDocument();
    expect(screen.getByText('View all')).toBeInTheDocument();
  });

  it('displays student names in recent requests', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('displays request status badges', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
  });

  it('shows empty state when no requests', () => {
    render(
      <TutorContent
        {...baseProps}
        requests={[]}
        stats={{ ...baseProps.stats, totalRequests: 0, pendingRequests: 0, acceptedRequests: 0 }}
      />
    );
    expect(screen.getByText('No tutoring requests yet')).toBeInTheDocument();
    expect(screen.getByText('Students will appear here when they request your help')).toBeInTheDocument();
  });

  it('renders specialties section', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('Your Specialties')).toBeInTheDocument();
    expect(screen.getByText('MATH101: Calculus I')).toBeInTheDocument();
    expect(screen.getByText('CS101: Intro to CS')).toBeInTheDocument();
  });

  it('does not render specialties section when no specialties', () => {
    render(
      <TutorContent
        {...baseProps}
        tutorProfile={{ ...baseProps.tutorProfile, specialties: [] }}
        stats={{ ...baseProps.stats, specialtyCount: 0 }}
      />
    );
    expect(screen.queryByText('Your Specialties')).not.toBeInTheDocument();
  });

  it('does not render specialties section when tutor profile is null', () => {
    render(
      <TutorContent
        {...baseProps}
        tutorProfile={null}
        stats={{ ...baseProps.stats, specialtyCount: 0 }}
      />
    );
    expect(screen.queryByText('Your Specialties')).not.toBeInTheDocument();
  });

  it('renders pending application banner', () => {
    render(
      <TutorContent
        {...baseProps}
        application={{ id: 'app-1', status: 'PENDING' }}
        stats={{ ...baseProps.stats, applicationStatus: 'PENDING' }}
      />
    );
    expect(screen.getByText('Application Under Review')).toBeInTheDocument();
    expect(
      screen.getByText("Your tutor application is currently being reviewed. You'll be notified once it's approved.")
    ).toBeInTheDocument();
  });

  it('renders rejected application banner with reason', () => {
    render(
      <TutorContent
        {...baseProps}
        application={{
          id: 'app-1',
          status: 'REJECTED',
          rejectionReason: 'Insufficient teaching experience',
        }}
        stats={{ ...baseProps.stats, applicationStatus: 'REJECTED' }}
      />
    );
    expect(screen.getByText('Application Rejected')).toBeInTheDocument();
    expect(screen.getByText('Insufficient teaching experience')).toBeInTheDocument();
  });

  it('renders rejected application banner with default reason', () => {
    render(
      <TutorContent
        {...baseProps}
        application={{ id: 'app-1', status: 'REJECTED', rejectionReason: null }}
        stats={{ ...baseProps.stats, applicationStatus: 'REJECTED' }}
      />
    );
    expect(screen.getByText('Application Rejected')).toBeInTheDocument();
    expect(
      screen.getByText('Your tutor application was not approved. Please contact support for more information.')
    ).toBeInTheDocument();
  });

  it('does not render application banner when application is null', () => {
    render(<TutorContent {...baseProps} application={null} />);
    expect(screen.queryByText('Application Under Review')).not.toBeInTheDocument();
    expect(screen.queryByText('Application Rejected')).not.toBeInTheDocument();
  });

  it('does not render application banner when application is approved', () => {
    render(
      <TutorContent
        {...baseProps}
        application={{ id: 'app-1', status: 'APPROVED' }}
        stats={{ ...baseProps.stats, applicationStatus: 'APPROVED' }}
      />
    );
    expect(screen.queryByText('Application Under Review')).not.toBeInTheDocument();
    expect(screen.queryByText('Application Rejected')).not.toBeInTheDocument();
  });

  it('renders with minimal props', () => {
    render(
      <TutorContent
        displayName="Tutor"
        tutorProfile={null}
        requests={[]}
        application={null}
        stats={{
          pendingRequests: 0,
          acceptedRequests: 0,
          totalRequests: 0,
          specialtyCount: 0,
          isVerified: false,
          isActive: false,
          applicationStatus: null,
        }}
        institutionName={null}
      />
    );
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Tutor!')).toBeInTheDocument();
    expect(screen.getByText('No tutoring requests yet')).toBeInTheDocument();
  });

  it('renders quick action descriptions', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('Manage student tutoring requests')).toBeInTheDocument();
    expect(screen.getByText('Courses you offer tutoring for')).toBeInTheDocument();
    expect(screen.getByText('Update your tutor profile')).toBeInTheDocument();
    expect(screen.getByText('Check your application progress')).toBeInTheDocument();
    expect(screen.getByText('See student feedback')).toBeInTheDocument();
    expect(screen.getByText('Manage your course offerings')).toBeInTheDocument();
  });

  it('renders course needed in request list', () => {
    render(<TutorContent {...baseProps} />);
    expect(screen.getByText('MATH101')).toBeInTheDocument();
  });

  it('renders general tutoring when courseNeeded is missing', () => {
    const propsWithMissingCourse: typeof baseProps = {
      ...baseProps,
      requests: [
        {
          id: 'r1',
          studentName: 'Charlie',
          courseNeeded: null,
          status: 'PENDING',
          createdAt: new Date('2024-01-15T10:30:00Z'),
        },
      ],
    };
    render(<TutorContent {...propsWithMissingCourse} />);
    expect(screen.getByText('General tutoring')).toBeInTheDocument();
  });
});
