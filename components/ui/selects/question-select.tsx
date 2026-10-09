'use client';

import { DataSelect } from '@/components/ui/data-select';

interface QuestionSelectProps {
  courseId?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function QuestionSelect({
  courseId,
  value,
  onChange,
  label = 'Question',
  disabled,
  className,
}: QuestionSelectProps) {
  return (
    <DataSelect
      value={value}
      onChange={onChange}
      label={label}
      disabled={disabled}
      className={className}
      prerequisiteMet={!!courseId}
      prerequisiteMessage="Select course first"
      fetchFn={async () => {
        if (!courseId) return [];
        const res = await fetch(`/api/questions?courseId=${courseId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        return data.data || [];
      }}
      dependencies={[courseId]}
      getValue={(q: any) => q.id}
      getLabel={(q: any) => `${q.type}: ${q.text?.substring(0, 60) || 'Untitled'}...`}
      placeholder="Select question"
      emptyMessage="No questions in the bank for this course."
      emptyAction={{
        label: 'Create question',
        href: `/admin/questions/new?courseId=${courseId}`,
      }}
      errorMessage="Couldn't load questions."
    />
  );
}
