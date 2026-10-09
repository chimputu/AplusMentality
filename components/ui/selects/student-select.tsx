'use client';

import { DataSelect } from '@/components/ui/data-select';

interface StudentSelectProps {
  institutionId?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function StudentSelect({
  institutionId,
  value,
  onChange,
  label = 'Student',
  disabled,
  className,
}: StudentSelectProps) {
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
        const res = await fetch(`/api/admin/students?institutionId=${institutionId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        return data.data || [];
      }}
      dependencies={[institutionId]}
      getValue={(s: any) => s.id}
      getLabel={(s: any) => `${s.firstName} ${s.lastName} (${s.email})`}
      placeholder="Select student"
      emptyMessage="No students for this institution."
      errorMessage="Couldn't load students."
    />
  );
}
