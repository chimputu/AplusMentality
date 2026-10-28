'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2 } from 'lucide-react';

interface University {
  id: string;
  name: string;
  code: string;
  academicSystem: 'YEARLY' | 'SEMESTERLY' | 'TRIMESTERLY';
  programmes: Programme[];
}

interface Programme {
  id: string;
  name: string;
  shortName: string | null;
}

// ✅ Define the props interface
interface CreateCourseFormProps {
  initialData?: {
    code: string;
    title: string;
    description: string;
    category: string;
    level: string;
  };
  isEditing?: boolean;
  courseId?: string;
  universities?: University[];
}

export default function CreateCourseForm({
  initialData,
  isEditing = false,
  courseId,
  universities: initialUniversities,
}: CreateCourseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>(initialUniversities || []);
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    level: initialData?.level || 'Beginner',
    universityId: '',
    programmeId: '',
    year: 1,
    period: '',
  });

  // Load universities server-side passed as props, fallback to client-side fetch
  useEffect(() => {
    if (universities.length > 0) return; // Already loaded from server
    async function loadUniversities() {
      try {
        const res = await fetch('/api/admin/universities');
        if (res.ok) {
          const data = await res.json();
          setUniversities(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
        }
      } catch {
        console.error('Failed to load universities');
      }
    }
    loadUniversities();
  }, [universities.length]);

  // Load programmes when university changes
  useEffect(() => {
    if (!formData.universityId) {
      setProgrammes([]);
      return;
    }
    async function loadProgrammes() {
      try {
        // All university IDs are now Institution IDs — use institutionId param
        const res = await fetch(`/api/admin/programmes?institutionId=${formData.universityId}`);
        if (res.ok) {
          const data = await res.json();
          setProgrammes(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
        }
      } catch {
        console.error('Failed to load programmes');
      }
    }
    loadProgrammes();
  }, [formData.universityId]);

  // Get period options based on selected university's academic system
  const getPeriodOptions = () => {
    const uni = universities.find((u) => u.id === formData.universityId);
    if (!uni) return [];

    switch (uni.academicSystem) {
      case 'YEARLY':
        return [{ value: '', label: 'Full Year' }];
      case 'SEMESTERLY':
        return [
          { value: '1', label: 'Semester 1' },
          { value: '2', label: 'Semester 2' },
        ];
      case 'TRIMESTERLY':
        return [
          { value: '1', label: 'Trimester 1' },
          { value: '2', label: 'Trimester 2' },
          { value: '3', label: 'Trimester 3' },
        ];
      default:
        return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/courses';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = isEditing
        ? { id: courseId, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const course = await res.json();
        if (isEditing) {
          router.push(`/admin/courses/${courseId}`);
        } else {
          router.push(`/admin/courses/${course.id}`);
        }
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || `Failed to ${isEditing ? 'update' : 'create'} course`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedUni = universities.find((u) => u.id === formData.universityId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {/* University */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          University *
        </label>
        <select
          value={formData.universityId}
          onChange={(e) => setFormData({ ...formData, universityId: e.target.value, programmeId: '', period: '' })}
          required
          className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          <option value="">Select university</option>
          {universities.map((uni) => (
            <option key={uni.id} value={uni.id}>
              {uni.name} ({uni.code})
            </option>
          ))}
        </select>
      </div>

      {/* Programme */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Programme *
        </label>
        <select
          value={formData.programmeId}
          onChange={(e) => setFormData({ ...formData, programmeId: e.target.value })}
          required
          disabled={!formData.universityId}
          className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
        >
          <option value="">Select programme</option>
          {programmes.map((prog) => (
            <option key={prog.id} value={prog.id}>
              {prog.shortName || prog.name}
            </option>
          ))}
        </select>
        {formData.universityId && programmes.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Showing programmes for {selectedUni?.name}
          </p>
        )}
      </div>

      {/* Year */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Year *
        </label>
        <select
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
          required
          className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>
      </div>

      {/* Period */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Period *
        </label>
        <select
          value={formData.period}
          onChange={(e) => setFormData({ ...formData, period: e.target.value })}
          required
          disabled={!formData.universityId}
          className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
        >
          <option value="">Select period</option>
          {getPeriodOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <hr className="border-border" />

      {/* Course Code */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Course Code *
        </label>
        <input
          type="text"
          placeholder="e.g., CS101"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          required
          disabled={isEditing}
          className={`w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
            isEditing ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />
        {isEditing && (
          <p className="text-xs text-muted-foreground mt-1">
            Course code cannot be changed
          </p>
        )}
      </div>

      {/* Course Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Course Title *
        </label>
        <input
          type="text"
          placeholder="e.g., Introduction to Computer Science"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Description
        </label>
        <textarea
          placeholder="Course description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Category
        </label>
        <input
          type="text"
          placeholder="e.g., Computer Science, Mathematics"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Level */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Level
        </label>
        <select
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
          className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {isEditing ? 'Updating Course...' : 'Creating Course...'}
          </>
        ) : (
          <>
            <BookOpen className="w-5 h-5" />
            {isEditing ? 'Update Course' : 'Create Course'}
          </>
        )}
      </button>
    </form>
  );
}