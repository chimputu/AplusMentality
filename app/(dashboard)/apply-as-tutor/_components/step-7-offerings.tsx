'use client';

import { Plus, X } from 'lucide-react';

interface Props {
  formData: any;
  updateField: (field: string, value: any) => void;
}

const TEACHING_MODES = ['ONLINE', 'HYBRID', 'PHYSICAL'] as const;
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export default function Step7Offerings({ formData, updateField }: Props) {
  const offerings = formData.offerings || [];

  const addOffering = () => {
    if (offerings.length >= 20) return;
    const newOfferings = [...offerings, {
      courseId: '',
      title: '',
      description: '',
      level: 'Beginner',
      priceZMW: 0,
      durationMinutes: 60,
      maxStudentsPerSession: 1,
      modes: ['ONLINE'],
      prerequisites: '',
      learningOutcomes: [],
    }];
    updateField('offerings', newOfferings);
  };

  const removeOffering = (index: number) => {
    const newOfferings = offerings.filter((_: any, i: number) => i !== index);
    updateField('offerings', newOfferings);
  };

  const updateOffering = (index: number, field: string, value: any) => {
    const newOfferings = [...offerings];
    newOfferings[index] = { ...newOfferings[index], [field]: value };
    updateField('offerings', newOfferings);
  };

  const toggleMode = (index: number, mode: string) => {
    const newOfferings = [...offerings];
    const currentModes = newOfferings[index].modes || [];
    if (currentModes.includes(mode)) {
      if (currentModes.length > 1) {
        newOfferings[index].modes = currentModes.filter((m: string) => m !== mode);
      }
    } else {
      newOfferings[index].modes = [...currentModes, mode];
    }
    updateField('offerings', newOfferings);
  };

  const addLearningOutcome = (index: number) => {
    const newOfferings = [...offerings];
    newOfferings[index].learningOutcomes = [...(newOfferings[index].learningOutcomes || []), ''];
    updateField('offerings', newOfferings);
  };

  const removeLearningOutcome = (offeringIndex: number, outcomeIndex: number) => {
    const newOfferings = [...offerings];
    newOfferings[offeringIndex].learningOutcomes = newOfferings[offeringIndex].learningOutcomes.filter(
      (_: string, i: number) => i !== outcomeIndex
    );
    updateField('offerings', newOfferings);
  };

  const updateLearningOutcome = (offeringIndex: number, outcomeIndex: number, value: string) => {
    const newOfferings = [...offerings];
    const outcomes = [...newOfferings[offeringIndex].learningOutcomes];
    outcomes[outcomeIndex] = value;
    newOfferings[offeringIndex].learningOutcomes = outcomes;
    updateField('offerings', newOfferings);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          List the courses you teach with pricing and details. Add at least 1 course.
        </p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {offerings.length}/20 courses
          </span>
          <button
            type="button"
            onClick={addOffering}
            disabled={offerings.length >= 20}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>
      </div>

      {offerings.map((off: any, index: number) => (
        <div
          key={index}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Course {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeOffering(index)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={off.title || ''}
                onChange={(e) => updateOffering(index, 'title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Introduction to Calculus"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Level <span className="text-red-500">*</span>
              </label>
              <select
                value={off.level || 'Beginner'}
                onChange={(e) => updateOffering(index, 'level', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Price (ZMW) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={off.priceZMW || 0}
                onChange={(e) => updateOffering(index, 'priceZMW', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={0}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={off.durationMinutes || 60}
                onChange={(e) => updateOffering(index, 'durationMinutes', parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={15}
                max={300}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Max Students Per Session
              </label>
              <input
                type="number"
                value={off.maxStudentsPerSession || 1}
                onChange={(e) => updateOffering(index, 'maxStudentsPerSession', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={1}
                max={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={off.description || ''}
              onChange={(e) => updateOffering(index, 'description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder="Describe what students will learn in this course..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Teaching Modes <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {TEACHING_MODES.map((mode) => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(off.modes || []).includes(mode)}
                    onChange={() => toggleMode(index, mode)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{mode}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Prerequisites
            </label>
            <textarea
              value={off.prerequisites || ''}
              onChange={(e) => updateOffering(index, 'prerequisites', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder="Any prerequisites for this course..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Learning Outcomes
              </label>
              <button
                type="button"
                onClick={() => addLearningOutcome(index)}
                disabled={(off.learningOutcomes || []).length >= 10}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            {(off.learningOutcomes || []).map((outcome: string, outcomeIndex: number) => (
              <div key={outcomeIndex} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => updateLearningOutcome(index, outcomeIndex, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Student will be able to..."
                />
                <button
                  type="button"
                  onClick={() => removeLearningOutcome(index, outcomeIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {offerings.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-4">
          No courses added yet. Add at least 1 course you teach.
        </p>
      )}
    </div>
  );
}
