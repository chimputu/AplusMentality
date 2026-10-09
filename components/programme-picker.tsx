'use client';

import { ProgrammeSelect } from '@/components/ui/selects/programme-select';

/**
 * @deprecated Use `ProgrammeSelect` from `@/components/ui/selects/programme-select` instead.
 * This component is kept for backward compatibility.
 */
export default function ProgrammePicker({
  institutionId,
  value,
  onChange,
}: {
  institutionId: string;
  value?: string;
  onChange: (id: string) => void;
}) {
  return (
    <ProgrammeSelect
      institutionId={institutionId}
      value={value}
      onChange={onChange}
    />
  );
}
