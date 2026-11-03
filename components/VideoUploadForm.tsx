'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, CheckCircle, XCircle, Film } from 'lucide-react';
import { CourseSelect } from '@/components/ui/selects/course-select';

interface University {
  id: string;
  name: string;
  code: string;
  academicSystem: 'YEARLY' | 'SEMESTERLY' | 'TRIMESTERLY';
}

interface Programme {
  id: string;
  name: string;
  shortName: string | null;
}

interface VideoUploadFormProps {
  universities?: Array<{ id: string; name: string }>;
}

export default function VideoUploadForm({ universities }: VideoUploadFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<'upload' | 'youtube'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Academic scoping
  const [universityId, setUniversityId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [year, setYear] = useState(1);
  const [period, setPeriod] = useState('');
  const [courseMode, setCourseMode] = useState<'existing' | 'new'>('new');
  const [courseId, setCourseId] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [order, setOrder] = useState(1);

  // Academic scoping data
  const [universitiesList, setUniversitiesList] = useState<University[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  // Load universities
  useEffect(() => {
    async function loadUniversities() {
      try {
        const res = await fetch('/api/admin/universities');
        if (res.ok) {
          const data = await res.json();
          setUniversitiesList(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
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

  // Get period options based on selected university's academic system
  const getPeriodOptions = () => {
    const uni = universitiesList.find((u) => u.id === universityId);
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
    setError(null);
    setSuccess(false);

    if (source === 'upload' && !file) {
      setError('Please select a video file');
      return;
    }
    if (source === 'youtube' && !youtubeUrl) {
      setError('Please enter a YouTube URL');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (courseMode === 'existing' && !courseId) {
      setError('Please select a course');
      return;
    }
    if (courseMode === 'new' && (!newCourseCode || !newCourseTitle)) {
      setError('Please enter course code and title');
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('description', description.trim());
    fd.append('source', source);
    fd.append('universityId', universityId);
    fd.append('programmeId', programmeId);
    fd.append('year', String(year));
    fd.append('period', period || '');
    fd.append('courseMode', courseMode);
    fd.append('order', String(order));

    if (courseMode === 'existing') {
      fd.append('courseId', courseId);
    } else {
      fd.append('newCourseCode', newCourseCode);
      fd.append('newCourseTitle', newCourseTitle);
    }

    if (source === 'upload' && file) {
      fd.append('file', file);
    }
    if (source === 'youtube' && youtubeUrl) {
      fd.append('youtubeUrl', youtubeUrl);
    }

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTitle('');
        setDescription('');
        setFile(null);
        setYoutubeUrl('');
        setNewCourseCode('');
        setNewCourseTitle('');
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to add video');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('An error occurred while uploading');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]+)/,
      /(?:youtu\.be\/)([\w-]+)/,
      /(?:youtube\.com\/embed\/)([\w-]+)/,
      /(?:youtube\.com\/shorts\/)([\w-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const youtubeId = getYouTubeId(youtubeUrl);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Video added successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Video Title *
        </label>
        <input
          type="text"
          placeholder="Enter video title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Description
        </label>
        <textarea
          placeholder="Enter video description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Source Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Video Source *
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setSource('upload')}
            className={`flex-1 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
              source === 'upload'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setSource('youtube')}
            className={`flex-1 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
              source === 'youtube'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            }`}
          >
            <Film className="w-4 h-4" />
            YouTube Link
          </button>
        </div>
      </div>

      {/* File Upload */}
      {source === 'upload' && (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-blue-500 transition">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="w-full cursor-pointer"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Max 50MB • MP4, WebM, OGG, MOV
          </p>
          {file && (
            <div className="bg-muted rounded-lg p-3 mt-3 text-left">
              <p className="text-sm text-foreground">
                <span className="font-medium">Selected:</span> {file.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-sm text-muted-foreground">
                Type: {file.type || 'Unknown'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* YouTube URL */}
      {source === 'youtube' && (
        <div className="bg-muted rounded-lg p-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            YouTube URL *
          </label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            required
            className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Supports: youtube.com/watch?v=... • youtu.be/... • youtube.com/shorts/...
          </p>
          
          {/* YouTube Preview */}
          {youtubeId && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground font-medium mb-2">Preview:</p>
              <div className="w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  className="w-full h-full"
                  allowFullScreen
                  title="YouTube video preview"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Academic Details */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Academic Details *</h3>

        <div className="space-y-3">
          {/* University */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              University *
            </label>
            <select
              value={universityId}
              onChange={(e) => {
                setUniversityId(e.target.value);
                setProgrammes([]);
                setProgrammeId('');
                setPeriod('');
              }}
              required
              className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">Select university</option>
              {universitiesList.map((uni) => (
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
              value={programmeId}
              onChange={(e) => setProgrammeId(e.target.value)}
              required
              disabled={!universityId}
              className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
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
                Showing programmes for {universitiesList.find((u) => u.id === universityId)?.name}
              </p>
            )}
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Year *
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
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
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              required
              disabled={!universityId}
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
        </div>
      </div>

      {/* Course Selection */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Course *</h3>

        <div className="flex gap-4 mb-3">
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
          <CourseSelect
            value={courseId}
            onChange={(v) => {
              setCourseId(v);
              // Auto-infer academic scope from selected course
              fetch(`/api/courses/${v}`)
                .then((res) => res.json())
                .then((data) => {
                  if (data?.universityId) setUniversityId(data.universityId);
                  if (data?.programmeId) setProgrammeId(data.programmeId);
                  if (data?.year) setYear(data.year);
                  if (data?.period) setPeriod(data.period);
                })
                .catch(() => {});
            }}
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
                className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        )}

        {/* Order */}
        <div className="mt-3">
          <label className="block text-sm font-medium text-foreground mb-1">
            Order / Number
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full border border-border rounded-lg px-4 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
          loading
            ? 'bg-muted cursor-not-allowed text-foreground'
            : source === 'youtube'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {source === 'youtube' ? 'Adding YouTube Video...' : 'Uploading Video...'}
          </>
        ) : (
          <>
            {source === 'youtube' ? (
              <>
                <Film className="w-5 h-5" />
                Add YouTube Video
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Video
              </>
            )}
          </>
        )}
      </button>
    </form>
  );
}