'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitTutorApplication } from '@/lib/actions/tutor-application';
import Step1Personal from './step-1-personal';
import Step2Professional from './step-2-professional';
import Step3Identity from './step-3-identity';
import Step4Qualifications from './step-4-qualifications';
import Step5Documents from './step-5-documents';
import Step6References from './step-6-references';
import Step7Offerings from './step-7-offerings';
import Step8Teaching from './step-8-teaching';
import Step9Statement from './step-9-statement';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  Shield,
  GraduationCap,
  FileText,
  Users,
  BookOpen,
  Clock,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Personal', icon: User },
  { id: 2, title: 'Professional', icon: Briefcase },
  { id: 3, title: 'Identity', icon: Shield },
  { id: 4, title: 'Qualifications', icon: GraduationCap },
  { id: 5, title: 'Documents', icon: FileText },
  { id: 6, title: 'References', icon: Users },
  { id: 7, title: 'Courses', icon: BookOpen },
  { id: 8, title: 'Teaching', icon: Clock },
  { id: 9, title: 'Statement', icon: MessageSquare },
];

export default function TutorApplicationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Personal
    fullName: '',
    email: '',
    phone: '',
    // Professional
    experienceYears: 0,
    institutionId: '',
    // Qualifications
    qualifications: [] as Array<{ degree: string; institution: string; year: number }>,
    // Identity
    profilePhotoUrl: '',
    profilePhotoPublicId: '',
    nrcFrontUrl: '',
    nrcFrontPublicId: '',
    nrcBackUrl: '',
    nrcBackPublicId: '',
    nrcNumber: '',
    // Grade 12
    grade12School: '',
    grade12Year: 0,
    grade12ResultsUrl: '',
    grade12Summary: '',
    // Current Academic
    currentInstitution: '',
    currentProgramme: '',
    currentYear: 0,
    academicRecordsUrl: '',
    academicSummary: '',
    // Documents
    cvUrl: '',
    // References
    references: [] as Array<{
      fullName: string;
      relationship: string;
      email: string;
      phone?: string;
      institution?: string;
    }>,
    // Offerings
    offerings: [] as Array<{
      courseId?: string;
      title: string;
      description: string;
      level: string;
      priceZMW: number;
      durationMinutes: number;
      maxStudentsPerSession: number;
      modes: string[];
      schedule?: any;
      prerequisites?: string;
      learningOutcomes: string[];
    }>,
    // Teaching
    teachingModes: [] as string[],
    physicalLocation: '',
    teachingSchedule: {} as Record<string, string[]>,
    hourlyRateZMW: 0,
    minimumBookingHours: 0,
    // Statement
    teachingPhilosophy: '',
    isReadyToTeach: false,
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
        return formData.profilePhotoUrl && formData.nrcFrontUrl && formData.nrcBackUrl;
      case 4:
        return formData.grade12School.length >= 3 && formData.grade12Year > 0 && formData.grade12Summary.length >= 3;
      case 5:
        return true;
      case 6:
        return (formData.references || []).length >= 2;
      case 7:
        return (formData.offerings || []).length >= 1;
      case 8:
        return (formData.teachingModes || []).length >= 1;
      case 9:
        return formData.teachingPhilosophy.length >= 50 && formData.isReadyToTeach;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 9) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitTutorApplication(formData);
      if (!result.success) {
        setSubmitError(result.error || 'Failed to submit application');
        return;
      }
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
    <div className="max-w-4xl mx-auto">
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
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px]">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center relative flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                  className={`text-xs mt-1 whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={`absolute top-5 left-[60%] w-[80%] h-0.5 ${
                      isCompleted
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Step {currentStep} of {steps.length} · {steps[currentStep - 1]?.title}
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
          <Step3Identity formData={formData} updateField={updateField} />
        )}
        {currentStep === 4 && (
          <Step4Qualifications formData={formData} updateField={updateField} />
        )}
        {currentStep === 5 && (
          <Step5Documents formData={formData} updateField={updateField} />
        )}
        {currentStep === 6 && (
          <Step6References formData={formData} updateField={updateField} />
        )}
        {currentStep === 7 && (
          <Step7Offerings formData={formData} updateField={updateField} />
        )}
        {currentStep === 8 && (
          <Step8Teaching formData={formData} updateField={updateField} />
        )}
        {currentStep === 9 && (
          <Step9Statement formData={formData} updateField={updateField} />
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

        {currentStep < 9 ? (
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
