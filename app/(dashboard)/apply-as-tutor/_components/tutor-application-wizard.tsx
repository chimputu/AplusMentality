'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitTutorApplication } from '@/lib/actions/tutor-application';
import Step1Personal from './step-1-personal';
import Step2Professional from './step-2-professional';
import Step3Qualifications from './step-3-qualifications';
import Step4Documents from './step-4-documents';
import Step5Statement from './step-5-statement';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  GraduationCap,
  FileText,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Personal', icon: User },
  { id: 2, title: 'Professional', icon: Briefcase },
  { id: 3, title: 'Qualifications', icon: GraduationCap },
  { id: 4, title: 'Documents', icon: FileText },
  { id: 5, title: 'Statement', icon: MessageSquare },
];

export default function TutorApplicationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experienceYears: 0,
    institutionId: '',
    qualifications: [] as Array<{ degree: string; institution: string; year: number }>,
    cvUrl: '',
    teachingPhilosophy: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName.length >= 2 && formData.email.includes('@');
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return formData.teachingPhilosophy.length >= 50;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitTutorApplication(formData);
      setSubmitSuccess(true);
      setTimeout(() => router.push('/apply-as-tutor/status'), 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Application Submitted
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your tutor application has been submitted successfully.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Redirecting to status page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Apply as Tutor
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Complete the steps below to apply for a tutor position.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={`absolute ml-12 w-8 h-0.5 ${
                      isCompleted
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    style={{ marginTop: '-20px' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error message */}
      {submitError && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Step content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          {steps[currentStep - 1]?.title} Details
        </h2>

        {currentStep === 1 && (
          <Step1Personal formData={formData} updateField={updateField} />
        )}
        {currentStep === 2 && (
          <Step2Professional formData={formData} updateField={updateField} />
        )}
        {currentStep === 3 && (
          <Step3Qualifications formData={formData} updateField={updateField} />
        )}
        {currentStep === 4 && (
          <Step4Documents formData={formData} updateField={updateField} />
        )}
        {currentStep === 5 && (
          <Step5Statement formData={formData} updateField={updateField} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
