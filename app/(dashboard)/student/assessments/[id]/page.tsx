import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getAssessmentForStudent } from '@/lib/actions/attempts';
import AssessmentRunner from './_components/assessment-runner';

export default async function AssessmentRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth(['STUDENT']);

  const { id } = await params;
  const data = await getAssessmentForStudent(id).catch((): null => null);
  if (!data) notFound();

  return (
    <AssessmentRunner
      assessment={data.assessment}
      attemptId={data.currentAttemptId}
      timeLimit={data.assessment.timeLimit}
    />
  );
}
