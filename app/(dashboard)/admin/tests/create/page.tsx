'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

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

interface Course {
  id: string;
  code: string;
  title: string;
}

export default function CreateTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    contentType: 'google_form',
    embedUrl: '',
    formUrl: '',
    dueDate: '',
    maxScore: '',
    universityId: '',
    programmeId: '',
    year: 1,
    period: '',
    courseId: '',
  });
  const [file, setFile] = useState<File | null>(null);

  // Load universities
  useEffect(() => {
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
  }, []);

  // Load programmes when university changes
  useEffect(() => {
    if (!form.universityId) {
      setProgrammes([]);
      return;
    }
    async function loadProgrammes() {
      try {
        // If universityId starts with 'inst-', it's an Institution record — use institutionId param
        const isInstitution = form.universityId.startsWith('inst-');
        const actualId = isInstitution ? form.universityId.slice(5) : form.universityId;
        const param = isInstitution ? 'institutionId' : 'universityId';
        const res = await fetch(`/api/admin/programmes?${param}=${actualId}`);
        if (res.ok) {
          const data = await res.json();
          setProgrammes(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
        }
      } catch {
        console.error('Failed to load programmes');
      }
    }
    loadProgrammes();
  }, [form.universityId]);

  // Load courses when programme changes
  useEffect(() => {
    if (!form.programmeId) {
      setCourses([]);
      return;
    }
    async function loadCourses() {
      try {
        const qs = new URLSearchParams({
          programmeId: form.programmeId,
          year: String(form.year),
        });
        if (form.period) qs.set('period', form.period);
        const res = await fetch(`/api/courses?${qs}`);
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
        }
      } catch {
        console.error('Failed to load courses');
      }
    }
    loadCourses();
  }, [form.programmeId, form.year, form.period]);

  // Get period options based on selected university's academic system
  const getPeriodOptions = () => {
    const uni = universities.find((u) => u.id === form.universityId);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrl = '';
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('File upload failed');
        const { url } = await uploadRes.json();
        fileUrl = url;
      }

      const payload = {
        ...form,
        fileUrl: fileUrl || null,
        contentType: form.contentType,
        maxScore: form.maxScore ? parseInt(form.maxScore) : null,
      };

      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push('/admin/tests');
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create test');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedUni = universities.find((u) => u.id === form.universityId);

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/tests" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">Create Test</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow border">

        {/* ── Academic Scoping ── */}
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Academic Scoping
        </h2>

        {/* University */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            University *
          </label>
          <select
            value={form.universityId}
            onChange={(e) => setForm({ ...form, universityId: e.target.value, programmeId: '', period: '', courseId: '' })}
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Programme *
          </label>
          <select
            value={form.programmeId}
            onChange={(e) => setForm({ ...form, programmeId: e.target.value, courseId: '' })}
            required
            disabled={!form.universityId}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
          >
            <option value="">Select programme</option>
            {programmes.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.shortName || prog.name}
              </option>
            ))}
          </select>
          {form.universityId && programmes.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Showing programmes for {selectedUni?.name}
            </p>
          )}
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Year *
          </label>
          <select
            value={form.year}
            onChange={(e) => setForm({ ...form, year: parseInt(e.target.value), courseId: '' })}
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Period *
          </label>
          <select
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value, courseId: '' })}
            required
            disabled={!form.universityId}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
          >
            <option value="">Select period</option>
            {getPeriodOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Course */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course *
          </label>
          <select
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            required
            disabled={!form.programmeId}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.title}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* ── Test Details ── */}
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Test Details
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input
            type="text"
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Mid-Semester Test"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Test description and instructions..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content Type</label>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={form.contentType}
            onChange={(e) => setForm({ ...form, contentType: e.target.value })}
          >
            <option value="google_form">Google Form</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
          </select>
        </div>
        {form.contentType === 'google_form' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Embed URL *</label>
              <input
                type="url"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={form.embedUrl}
                onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
                required
                placeholder="https://docs.google.com/forms/d/e/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shareable Link *</label>
              <input
                type="url"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={form.formUrl}
                onChange={(e) => setForm({ ...form, formUrl: e.target.value })}
                required
                placeholder="https://forms.gle/..."
              />
            </div>
          </>
        )}
        {(form.contentType === 'pdf' || form.contentType === 'image') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload File *</label>
            <input
              type="file"
              accept={form.contentType === 'pdf' ? '.pdf' : 'image/*'}
              onChange={handleFileChange}
              className="w-full"
              required
            />
            {file && <p className="text-sm text-green-600 mt-1">Selected: {file.name}</p>}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date (optional)</label>
          <input
            type="datetime-local"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Score (optional)</label>
          <input
            type="number"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={form.maxScore}
            onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
            placeholder="100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Test...
            </>
          ) : (
            'Create Test'
          )}
        </button>
      </form>
    </div>
  );
}