'use client';

import { DataSelect } from '@/components/ui/data-select';

interface PeriodSelectProps {
  institutionId?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function PeriodSelect({
  institutionId,
  value,
  onChange,
  label = 'Semester / Period',
  disabled,
  className,
}: PeriodSelectProps) {
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
        const res = await fetch(`/api/admin/periods?institutionId=${institutionId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        const data = json.data;
        return Array.isArray(data) ? data : [];
      }}
      dependencies={[institutionId]}
      getValue={(p: any) => p.id}
      getLabel={(p: any) => `${p.name} (${p.type})`}
      placeholder="Select semester / period"
      emptyMessage="No periods defined for this institution."
      emptyAction={{
        label: 'Create period',
        href: `/admin/periods/new?institutionId=${institutionId}`,
      }}
      errorMessage="Couldn't load periods."
    />
  );
}
