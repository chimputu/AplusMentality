'use client';

import { DataSelect } from '@/components/ui/data-select';

interface LevelSelectProps {
  institutionId?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function LevelSelect({
  institutionId,
  value,
  onChange,
  label = 'Year / Level',
  disabled,
  className,
}: LevelSelectProps) {
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
        const res = await fetch(`/api/admin/levels?institutionId=${institutionId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        return data.data || [];
      }}
      dependencies={[institutionId]}
      getValue={(l: any) => l.id}
      getLabel={(l: any) => `${l.name} (${l.type})`}
      placeholder="Select year / level"
      emptyMessage="No years defined for this institution."
      emptyAction={{
        label: 'Create year',
        href: `/admin/levels/new?institutionId=${institutionId}`,
      }}
      errorMessage="Couldn't load years."
    />
  );
}
