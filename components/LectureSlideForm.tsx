'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { InstitutionSelect } from '@/components/ui/selects/institution-select';
import { ProgrammeSelect } from '@/components/ui/selects/programme-select';
import { LevelSelect } from '@/components/ui/selects/level-select';
import { PeriodSelect } from '@/components/ui/selects/period-select';
import { CourseSelect } from '@/components/ui/selects/course-select';

interface SlideFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function LectureSlideForm({ initialData, isEditing = false }: SlideFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Academic scoping
  const [institutionId, setInstitutionId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [year, setYear] = useState(1);
  const [period, setPeriod] = useState('');
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

  // Derive numeric year/period from selected level/period for backward compat
  useEffect(() => {
    if (levelId) {
      fetch(`/api/admin/levels?institutionId=${institutionId}`)
        .then((r) => r.json())
        .then((json) => {
          const data = json.data || [];
          const level = data.find((l: any) => l.id === levelId);
          if (level) setYear(level.order);
        })
        .catch(() => {});
    }
  }, [levelId, institutionId]);

  useEffect(() => {
    if (periodId) {
      fetch(`/api/admin/periods?institutionId=${institutionId}`)
        .then((r) => r.json())
        .then((json) => {
          const data = json.data || [];
          const p = data.find((pp: any) => pp.id === periodId);
          if (p) setPeriod(String(p.order));
        })
        .catch(() => {});
    }
  }, [periodId, institutionId]);

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
            universityId: institutionId,
            programmeId,
            year,
            period: period || null,
            levelId: levelId || null,
            periodId: periodId || null,
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
          <p className="text-xs text-muted-foreground mt-1">From Google Slides: File → Publish to web → Embed → copy the URL</p>
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
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium mb-3">Academic Scope *</h3>

        <InstitutionSelect
          value={institutionId}
          onChange={(v) => {
            setInstitutionId(v);
            setProgrammeId('');
            setLevelId('');
            setPeriodId('');
          }}
        />

        <ProgrammeSelect
          institutionId={institutionId || undefined}
          value={programmeId}
          onChange={setProgrammeId}
        />

        <LevelSelect
          institutionId={institutionId || undefined}
          value={levelId}
          onChange={setLevelId}
        />

        <PeriodSelect
          institutionId={institutionId || undefined}
          value={periodId}
          onChange={setPeriodId}
        />
      </div>

      {/* Course Selection */}
      <div className="border-t border-border pt-4">
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
          <CourseSelect
            programmeId={programmeId || undefined}
            universityId={institutionId || undefined}
            year={year}
            period={period || undefined}
            value={courseId}
            onChange={setCourseId}
          />
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
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
              <label className="block text-xs text-muted-foreground mb-1">
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