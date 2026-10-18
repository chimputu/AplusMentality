'use client';

import { DataSelect } from '@/components/ui/data-select';

interface TutorSelectProps {
  institutionId?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function TutorSelect({
  institutionId,
  value,
  onChange,
  label = 'Tutor',
  disabled,
  className,
}: TutorSelectProps) {
  return (
    <DataSelect
      value={value}
      onChange={onChange}
      label={label}
      disabled={disabled}
      className={className}
      prerequisiteMet={!!institutionId}
      prerequisiteMessage="Select institution first"
      fetchFn={async () => {
        if (!institutionId) return [];
        const res = await fetch(`/api/admin/tutors?institutionId=${institutionId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        const data = json.data;
        return Array.isArray(data) ? data : [];
      }}
      dependencies={[institutionId]}
      getValue={(t: any) => t.id}
      getLabel={(t: any) => {
        const name = t.user?.name || t.user?.email || 'Unknown';
        return `${name}${t.specialty ? ` — ${t.specialty}` : ''}`;
      }}
      placeholder="Select tutor"
      emptyMessage="No tutors for this institution."
      emptyAction={{
        label: 'Invite tutor',
        href: `/admin/tutors/invite?institutionId=${institutionId}`,
      }}
      errorMessage="Couldn't load tutors."
    />
  );
}
