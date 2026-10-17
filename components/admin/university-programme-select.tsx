'use client';

import { useState, useCallback } from 'react';
import { InstitutionSelect } from '@/components/ui/selects/institution-select';
import { ProgrammeSelect } from '@/components/ui/selects/programme-select';
import { CourseSelect } from '@/components/ui/selects/course-select';

interface UniversityProgrammeSelectProps {
  /** Called when the institution selection changes. Receives the institution ID. */
  onUniversityChange?: (id: string) => void;
  /** Called when the programme selection changes. Receives the programme ID. */
  onProgrammeChange?: (id: string) => void;
  /** Called when the course selection changes. Receives the course ID. */
  onCourseChange?: (id: string) => void;

  /** Pre-fill values for editing scenarios. */
  defaultInstitutionId?: string;
  defaultProgrammeId?: string;
  defaultCourseId?: string;

  /** Disable the entire component. */
  disabled?: boolean;

  /** Whether to show the course dropdown. Default false. */
  showCourse?: boolean;

  /** Custom labels for each dropdown. */
  labels?: {
    institution?: string;
    programme?: string;
    course?: string;
  };
}

/**
 * Reusable cascading dropdown component that wires together
 * Institution → Programme → Course selection.
 *
 * Use this anywhere an admin/tutor needs to scope content to a
 * university, programme, and optionally a course.
 *
 * @example
 * ```tsx
 * <UniversityProgrammeSelect
 *   onUniversityChange={(id) => setValue('institutionId', id)}
 *   onProgrammeChange={(id) => setValue('programmeId', id)}
 *   onCourseChange={(id) => setValue('courseId', id)}
 *   showCourse
 * />
 * ```
 */
export function UniversityProgrammeSelect({
  onUniversityChange,
  onProgrammeChange,
  onCourseChange,
  defaultInstitutionId,
  defaultProgrammeId,
  defaultCourseId,
  disabled = false,
  showCourse = false,
  labels,
}: UniversityProgrammeSelectProps) {
  const [institutionId, setInstitutionId] = useState(defaultInstitutionId ?? '');
  const [programmeId, setProgrammeId] = useState(defaultProgrammeId ?? '');
  const [courseId, setCourseId] = useState(defaultCourseId ?? '');

  const handleInstitutionChange = useCallback(
    (id: string) => {
      setInstitutionId(id);
      // Reset downstream selections when institution changes
      setProgrammeId('');
      setCourseId('');
      onProgrammeChange?.('');
      onCourseChange?.('');
      onUniversityChange?.(id);
    },
    [onUniversityChange, onProgrammeChange, onCourseChange],
  );

  const handleProgrammeChange = useCallback(
    (id: string) => {
      setProgrammeId(id);
      // Reset course when programme changes
      setCourseId('');
      onCourseChange?.('');
      onProgrammeChange?.(id);
    },
    [onProgrammeChange, onCourseChange],
  );

  const handleCourseChange = useCallback(
    (id: string) => {
      setCourseId(id);
      onCourseChange?.(id);
    },
    [onCourseChange],
  );

  return (
    <div className="space-y-4">
      {/* Institution / University */}
      <InstitutionSelect
        value={institutionId}
        onChange={handleInstitutionChange}
        label={labels?.institution ?? 'University'}
        disabled={disabled}
      />

      {/* Programme */}
      <ProgrammeSelect
        institutionId={institutionId || undefined}
        value={programmeId}
        onChange={handleProgrammeChange}
        label={labels?.programme ?? 'Programme'}
        disabled={disabled}
      />

      {/* Course (optional) */}
      {showCourse && (
        <CourseSelect
          programmeId={programmeId || undefined}
          value={courseId}
          onChange={handleCourseChange}
          label={labels?.course ?? 'Course'}
          disabled={disabled}
        />
      )}
    </div>
  );
}
