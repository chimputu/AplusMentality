'use client';

interface Props {
  formData: any;
  updateField: (field: string, value: any) => void;
}

export default function Step5Statement({ formData, updateField }: Props) {
  const charCount = formData.teachingPhilosophy?.length || 0;
  const minChars = 50;
  const maxChars = 5000;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Teaching Philosophy <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Describe your approach to teaching, what motivates you, and how you help students succeed.
          Minimum {minChars} characters.
        </p>
        <textarea
          value={formData.teachingPhilosophy || ''}
          onChange={(e) => updateField('teachingPhilosophy', e.target.value)}
          rows={8}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          placeholder="I believe that effective teaching involves..."
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {charCount < minChars
              ? `${minChars - charCount} more characters needed`
              : '✓ Minimum requirement met'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {charCount}/{maxChars}
          </p>
        </div>
      </div>
    </div>
  );
}
