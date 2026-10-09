'use client';

import { DataSelect } from '@/components/ui/data-select';

interface CourseSelectProps {
  programmeId?: string;
  universityId?: string;
  year?: number;
  period?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function CourseSelect({
  programmeId,
  universityId,
  year,
  period,
  value,
  onChange,
  label = 'Course',
  disabled,
  className,
}: CourseSelectProps) {
  // Determine prerequisite: need at least programmeId or universityId
  const prerequisiteMet = !!programmeId || !!universityId;

  return (
    <DataSelect
      value={value}
      onChange={onChange}
      label={label}
      disabled={disabled}
      className={className}
      prerequisiteMet={prerequisiteMet}
      prerequisiteMessage="Select programme first"
      fetchFn={async () => {
        if (!prerequisiteMet) return [];
        const params = new URLSearchParams();
        if (programmeId) params.set('programmeId', programmeId);
        if (universityId) params.set('universityId', universityId);
        if (year) params.set('year', year.toString());
        if (period) params.set('period', period);
        params.set('all', 'true');
        const res = await fetch(`/api/courses?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        return data.data || [];
      }}
      dependencies={[programmeId, universityId, year, period]}
      getValue={(c: any) => c.id}
      getLabel={(c: any) => `${c.code} — ${c.title}`}
      placeholder="Select course"
      emptyMessage="No courses found."
      emptyAction={{
        label: 'Create course',
        href: programmeId
          ? `/admin/courses/new?programmeId=${programmeId}`
          : '/admin/courses/new',
      }}
      errorMessage="Couldn't load courses."
    />
  );
}
