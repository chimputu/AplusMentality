'use client';

import { DataSelect } from '@/components/ui/data-select';

interface InstitutionSelectProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function InstitutionSelect({
  value,
  onChange,
  label = 'Institution',
  disabled,
  className,
}: InstitutionSelectProps) {
  return (
    <DataSelect
      value={value}
      onChange={onChange}
      label={label}
      disabled={disabled}
      className={className}
      fetchFn={async () => {
        const res = await fetch('/api/institutions/picker');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        const data = json.data;
        return Array.isArray(data) ? data : [];
      }}
      getValue={(i: any) => i.id}
      getLabel={(i: any) => `${i.name}${i.shortName ? ` (${i.shortName})` : ''}`}
      placeholder="Select institution"
      emptyMessage="No institutions available."
      emptyAction={{ label: 'Create institution', href: '/admin/institutions/new' }}
      errorMessage="Couldn't load institutions."
    />
  );
}
