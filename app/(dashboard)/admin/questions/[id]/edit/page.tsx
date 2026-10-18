import { requireAuth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { getQuestion, updateQuestion } from '@/lib/actions/questions';
import { QuestionForm } from '@/app/(dashboard)/admin/questions/components/question-form';
import { toast } from 'sonner';

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  const { id } = await params;
  const question = await getQuestion(id).catch((): null => null);
  if (!question) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Question</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Update question details
        </p>
      </div>

      <QuestionForm
        question={question}
        onSubmit={async (data: any) => {
          try {
            await updateQuestion(id, data);
            redirect('/admin/questions');
          } catch (err: any) {
            throw err;
          }
        }}
      />
    </div>
  );
}
