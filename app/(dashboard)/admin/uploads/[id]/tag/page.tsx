'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Video,
  Image,
  File,
} from 'lucide-react';

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

interface PendingUpload {
  id: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  suggestedCode: string | null;
  url: string;
}

const contentTypes = [
  { value: 'lecture_slide', label: 'Lecture Slide' },
  { value: 'tutorial', label: 'Tutorial Sheet' },
  { value: 'past_paper', label: 'Past Paper' },
  { value: 'video', label: 'Video' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'test', label: 'Test' },
  { value: 'assignment', label: 'Assignment' },
];

export default function TagUploadPage() {
  const router = useRouter();
  const params = useParams();
  const uploadId = params?.id as string;

  const [upload, setUpload] = useState<PendingUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [contentType, setContentType] = useState('lecture_slide');
  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState('');
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [programmeId, setProgrammeId] = useState('');
  const [year, setYear] = useState(1);
  const [period, setPeriod] = useState('');
  const [courseMode, setCourseMode] = useState<'existing' | 'new'>('new');
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [order, setOrder] = useState(1);

  // Load upload data
  useEffect(() => {
    async function loadUpload() {
      try {
        const res = await fetch(`/api/admin/uploads/${uploadId}`);
        if (res.ok) {
          const data = await res.json();
          setUpload(data);
          if (data.suggestedCode) {
            setNewCourseCode(data.suggestedCode);
          }
        } else {
          setError('Upload not found');
        }
      } catch {
        setError('Failed to load upload');
      } finally {
        setLoading(false);
      }
    }
    loadUpload();
  }, [uploadId]);

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
    if (!universityId) {
      setProgrammes([]);
      return;
    }

    async function loadProgrammes() {
      try {
        const res = await fetch(`/api/admin/programmes?universityId=${universityId}`);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = () => {
    if (!upload) return null;
    if (upload.mimeType.startsWith('video/')) return <Video className="w-6 h-6 text-purple-500" />;
    if (upload.mimeType.startsWith('image/')) return <Image className="w-6 h-6 text-green-500" />;
    if (upload.mimeType === 'application/pdf') return <FileText className="w-6 h-6 text-red-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/uploads/${uploadId}/tag`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universityId,
          programmeId,
          year,
          period,
          courseMode,
          courseId: courseMode === 'existing' ? courseId : undefined,
          newCourseCode: courseMode === 'new' ? newCourseCode : undefined,
          newCourseTitle: courseMode === 'new' ? newCourseTitle : undefined,
          contentType,
          order,
        }),
      });

      if (res.ok) {
        router.push('/admin/uploads');
        router.refresh();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to tag upload');
      }
    } catch {
      setError('Failed to tag upload');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>Upload not found.</p>
        <Link href="/admin/uploads" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Uploads
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin/uploads"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Uploads
      </Link>

      <h1 className="text-2xl font-bold mb-6">Tag File</h1>

      {/* File Info Card */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">{getFileIcon()}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{upload.originalName}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(upload.fileSize)} • {upload.fileType.toUpperCase()}
            </p>
          </div>
          {upload.suggestedCode && (
            <span className="text-sm font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg">
              Suggested: {upload.suggestedCode}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tag Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Content Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Content Type *</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {contentTypes.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
        </div>

        {/* University */}
        <div>
          <label className="block text-sm font-medium mb-2">University *</label>
          <select
            value={universityId}
            onChange={(e) => {
              setUniversityId(e.target.value);
              setProgrammes([]);
              setProgrammeId('');
              setPeriod('');
            }}
            required
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
          <label className="block text-sm font-medium mb-2">Programme *</label>
          <select
            value={programmeId}
            onChange={(e) => setProgrammeId(e.target.value)}
            required
            disabled={!universityId}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          >
            <option value="">Select programme</option>
            {programmes.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.shortName || prog.name}
              </option>
            ))}
          </select>
          {universityId && programmes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing programmes for{' '}
              {universities.find((u) => u.id === universityId)?.name}
            </p>
          )}
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium mb-2">Year *</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            required
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
          <label className="block text-sm font-medium mb-2">Period *</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            required
            disabled={!universityId}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          >
            <option value="">Select period</option>
            {getPeriodOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Course Mode */}
        <div>
          <label className="block text-sm font-medium mb-3">Course *</label>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="courseMode"
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
                name="courseMode"
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
              className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
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
                <label className="block text-xs text-muted-foreground mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  required
                  placeholder="e.g. MSM 111"
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                  placeholder="e.g. Set Theory"
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Order */}
        <div>
          <label className="block text-sm font-medium mb-2">Order / Number</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Tag & Save
          </button>
          <Link
            href="/admin/uploads"
            className="bg-muted text-gray-700 dark:text-foreground px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-muted text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
