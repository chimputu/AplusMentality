'use client';

import { DataSelect } from '@/components/ui/data-select';

interface ProgrammeSelectProps {
  institutionId?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ProgrammeSelect({
  institutionId,
  value,
  onChange,
  label = 'Programme',
  disabled,
  className,
}: ProgrammeSelectProps) {
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
        const res = await fetch(`/api/institutions/${institutionId}/programmes`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        return data.programmes || [];
      }}
      dependencies={[institutionId]}
      getValue={(p: any) => p.id}
      getLabel={(p: any) => {
        const faculty = p.faculty ? ` — ${p.faculty.name}` : '';
        return `${p.name} (${p.code})${faculty}`;
      }}
      placeholder="Select programme"
      emptyMessage="No programmes for this institution."
      emptyAction={{
        label: 'Create programme',
        href: `/admin/programmes/new?institutionId=${institutionId}`,
      }}
      errorMessage="Couldn't load programmes."
    />
  );
}
