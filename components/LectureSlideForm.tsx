'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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

interface SlideFormProps {
  initialData?: any;
  isEditing?: boolean;
  universities?: University[];
}

export default function LectureSlideForm({ initialData, isEditing = false, universities: initialUniversities }: SlideFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Academic scoping
  const [universities, setUniversities] = useState<University[]>(initialUniversities || []);
  const [universityId, setUniversityId] = useState('');
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [programmeId, setProgrammeId] = useState('');
  const [year, setYear] = useState(1);
  const [period, setPeriod] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseMode, setCourseMode] = useState<'existing' | 'new'>('new');
  const [courseId, setCourseId] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    contentType: initialData?.contentType || 'google_slides',
    embedUrl: initialData?.embedUrl || '',
    fileUrl: initialData?.fileUrl || '',
    order: initialData?.order || 0,
    category: initialData?.category || '',
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
    if (!universityId) {
      setProgrammes([]);
      return;
    }
    async function loadProgrammes() {
      try {
        // If universityId starts with 'inst-', it's an Institution record — use institutionId param
        const isInstitution = universityId.startsWith('inst-');
        const actualId = isInstitution ? universityId.slice(5) : universityId;
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
  }, [universityId]);

  // Load courses when filters change
  useEffect(() => {
    if (courseMode !== 'existing' || !universityId || !programmeId) {
      setCourses([]);
      return;
    }
    async function loadCourses() {
      try {
        const params = new URLSearchParams({
          universityId,
          programmeId,
          year: String(year),
          period: period || '',
        });
        const res = await fetch(`/api/courses?${params}`);
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
        }
      } catch {
        console.error('Failed to load courses');
      }
    }
    loadCourses();
  }, [universityId, programmeId, year, period, courseMode]);

  // Get period options based on selected university's academic system
  const getPeriodOptions = () => {
    const uni = universities.find((u) => u.id === universityId);
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
      let fileUrl = form.fileUrl;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('File upload failed');
        const { url } = await uploadRes.json();
        fileUrl = url;
      }

      // Resolve courseId
      let resolvedCourseId: string | null = null;

      if (courseMode === 'existing' && courseId) {
        resolvedCourseId = courseId;
      } else if (courseMode === 'new' && newCourseCode && newCourseTitle) {
        // Create the course first
        const courseRes = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: newCourseCode,
            title: newCourseTitle,
            universityId,
            programmeId,
            year,
            period: period || null,
          }),
        });
        if (!courseRes.ok) {
          const err = await courseRes.json();
          alert(err.error || 'Failed to create course');
          setLoading(false);
          return;
        }
        const course = await courseRes.json();
        resolvedCourseId = course.id;
      }

      const payload = {
        ...form,
        fileUrl: fileUrl || null,
        courseId: resolvedCourseId,
      };

      const url = isEditing ? `/api/lecture-slides/${initialData.id}` : '/api/lecture-slides';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push('/admin/lecture-slides');
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Computer Science',
    'Mathematics',
    'Natural Sciences',
    'Business',
    'Engineering',
    'Humanities',
    'Social Sciences',
    'Education',
    'Law',
    'Medicine',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium">Title *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border rounded px-4 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border rounded px-4 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Content Type</label>
        <select
          value={form.contentType}
          onChange={(e) => setForm({ ...form, contentType: e.target.value })}
          className="w-full border rounded px-4 py-2"
        >
          <option value="google_slides">Google Slides</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      {form.contentType === 'google_slides' && (
        <div>
          <label className="block text-sm font-medium">Google Slides Embed URL *</label>
          <input
            type="url"
            required
            value={form.embedUrl}
            onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
            className="w-full border rounded px-4 py-2"
            placeholder="https://docs.google.com/presentation/d/.../embed"
          />
          <p className="text-xs text-gray-500 mt-1">From Google Slides: File → Publish to web → Embed → copy the URL</p>
        </div>
      )}

      {form.contentType === 'pdf' && (
        <div>
          <label className="block text-sm font-medium">Upload PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full"
            required={!isEditing && !form.fileUrl}
          />
          {form.fileUrl && !file && <p className="text-sm text-green-600 mt-1">Current file: {form.fileUrl}</p>}
          {file && <p className="text-sm text-green-600 mt-1">Selected: {file.name}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Order</label>
        <input
          type="number"
          value={form.order}
          onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          className="w-full border rounded px-4 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full border rounded px-4 py-2"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Or type a custom category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full border rounded px-4 py-2 mt-2"
        />
      </div>

      {/* Academic Scoping */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium mb-3">Academic Scope *</h3>

        {/* University */}
        <div className="mb-3">
          <label className="block text-sm font-medium">University *</label>
          <select
            value={universityId}
            onChange={(e) => {
              setUniversityId(e.target.value);
              setProgrammes([]);
              setProgrammeId('');
              setPeriod('');
            }}
            required
            className="w-full border rounded-lg px-4 py-2"
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
        <div className="mb-3">
          <label className="block text-sm font-medium">Programme *</label>
          <select
            value={programmeId}
            onChange={(e) => setProgrammeId(e.target.value)}
            required
            disabled={!universityId}
            className="w-full border rounded-lg px-4 py-2 disabled:opacity-50"
          >
            <option value="">Select programme</option>
            {programmes.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.shortName || prog.name}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="mb-3">
          <label className="block text-sm font-medium">Year *</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            required
            className="w-full border rounded-lg px-4 py-2"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>

        {/* Period */}
        <div className="mb-3">
          <label className="block text-sm font-medium">Period *</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            required
            disabled={!universityId}
            className="w-full border rounded-lg px-4 py-2 disabled:opacity-50"
          >
            <option value="">Select period</option>
            {getPeriodOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Selection */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium mb-3">Course *</h3>

        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="slideCourseMode"
              value="existing"
              checked={courseMode === 'existing'}
              onChange={() => setCourseMode('existing')}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Attach to existing</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="slideCourseMode"
              value="new"
              checked={courseMode === 'new'}
              onChange={() => setCourseMode('new')}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Create new</span>
          </label>
        </div>

        {courseMode === 'existing' ? (
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            disabled={!programmeId}
            className="w-full border rounded-lg px-4 py-2 disabled:opacity-50"
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Course Code
              </label>
              <input
                type="text"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                required
                placeholder="e.g. CS 101"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Course Title
              </label>
              <input
                type="text"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                required
                placeholder="e.g. Intro to Programming"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isEditing ? 'Update' : 'Create'}
      </button>
    </form>
  );
}