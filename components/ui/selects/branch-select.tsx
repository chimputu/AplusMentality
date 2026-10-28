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
        if (!res.ok) {
          const errorBody = await res.text().catch(() => '');
          const errorMsg = `Failed to fetch branches: HTTP ${res.status} ${res.statusText}${errorBody ? ' — ' + errorBody : ''}`;
          console.error('[BranchSelect] Fetch error:', errorMsg, { status: res.status });
          throw new Error(errorMsg);
        }
        const json = await res.json();
        const data = json.data;
        return Array.isArray(data) ? data : [];
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
