import { redirect } from 'next/navigation';
import { createQuestion } from '@/lib/actions/questions';
import { QuestionForm } from '@/app/(dashboard)/admin/questions/components/question-form';

export default async function NewQuestionPage() {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">New Question</h1>
        <p className="text-gray-600 dark:text-muted-foreground text-sm">
          Create a new question for the question bank
        </p>
      </div>

      <QuestionForm
        onSubmit={async (data: any) => {
          try {
            await createQuestion(data);
            redirect('/admin/questions');
          } catch (err: any) {
            throw err;
          }
        }}
      />
    </div>
  );
}
