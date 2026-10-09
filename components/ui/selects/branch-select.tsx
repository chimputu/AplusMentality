'use client';

import { DataSelect } from '@/components/ui/data-select';

interface BranchSelectProps {
  programmeId?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function BranchSelect({
  programmeId,
  value,
  onChange,
  label = 'Branch',
  disabled,
  className,
}: BranchSelectProps) {
  return (
    <DataSelect
      value={value}
      onChange={onChange}
      label={label}
      disabled={disabled}
      className={className}
      prerequisiteMet={!!programmeId}
      prerequisiteMessage="Select programme first"
      fetchFn={async () => {
        if (!programmeId) return [];
        const res = await fetch(`/api/admin/branches?programmeId=${programmeId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        return data.data || [];
      }}
      dependencies={[programmeId]}
      getValue={(b: any) => b.id}
      getLabel={(b: any) => `${b.name}${b.code ? ` (${b.code})` : ''}`}
      placeholder="Select branch"
      emptyMessage="No branches for this programme."
      errorMessage="Couldn't load branches."
    />
  );
}
