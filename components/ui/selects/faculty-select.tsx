'use client';

import { DataSelect } from '@/components/ui/data-select';

interface FacultySelectProps {
  institutionId?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function FacultySelect({
  institutionId,
  value,
  onChange,
  label = 'Faculty',
  disabled,
  className,
}: FacultySelectProps) {
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
        const res = await fetch(`/api/admin/faculties?institutionId=${institutionId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        return data.data || [];
      }}
      dependencies={[institutionId]}
      getValue={(f: any) => f.id}
      getLabel={(f: any) => `${f.name} (${f.code})`}
      placeholder="Select faculty"
      emptyMessage="No faculties for this institution."
      emptyAction={{
        label: 'Create faculty',
        href: `/admin/faculties/new?institutionId=${institutionId}`,
      }}
      errorMessage="Couldn't load faculties."
    />
  );
}
