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
  label = 'University',
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
        if (!res.ok) {
          const errorBody = await res.text().catch(() => '');
          const errorMsg = `Failed to fetch institutions: HTTP ${res.status} ${res.statusText}${errorBody ? ' — ' + errorBody : ''}`;
          console.error('[InstitutionSelect] Fetch error:', errorMsg, { status: res.status, statusText: res.statusText });
          throw new Error(errorMsg);
        }
        const json = await res.json();
        const data = json.data;
        return Array.isArray(data) ? data : [];
      }}
      getValue={(i: any) => i.id}
      getLabel={(i: any) => `${i.name}${i.shortName ? ` (${i.shortName})` : ''}`}
      placeholder="Select university"
      emptyMessage="No universities available."
      emptyAction={{ label: 'Create university', href: '/admin/institutions/new' }}
      errorMessage="Couldn't load universities."
    />
  );
}
