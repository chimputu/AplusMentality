'use client';

import { useState } from 'react';
import { addCourseToProgramme, bulkAddCourses, deleteCourse } from '@/lib/actions/programme-tree';
import { Plus, Trash2, X, BookOpen } from 'lucide-react';

interface Level {
  id: string;
  name: string;
  order: number;
  courses: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    yearNumber: number | null;
    period: { id: string; name: string } | null;
    createdAt: string;
  }[];
}

interface ProgrammeTreeData {
  programme: { id: string; name: string; code: string | null };
  institution: { id: string; name: string; slug: string } | null;
  levels: Level[];
}

interface AcademicPeriod {
  id: string;
  name: string;
}

export default function ProgrammeTreeClient({
  tree,
  periods,
}: {
  tree: ProgrammeTreeData;
  periods: AcademicPeriod[];
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students'>('courses');
  const [addCourseLevelId, setAddCourseLevelId] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPeriodId, setNewPeriodId] = useState('');

  const [bulkLevelId, setBulkLevelId] = useState('');
  const [bulkPeriodId, setBulkPeriodId] = useState('');
  const [bulkText, setBulkText] = useState('');

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await addCourseToProgramme({
        programmeId: tree.programme.id,
        levelId: addCourseLevelId,
        periodId: newPeriodId || undefined,
        code: newCode,
        name: newName,
        description: newDescription || undefined,
      });
      setSuccess('Course added successfully!');
      setNewCode(''); setNewName(''); setNewDescription(''); setNewPeriodId('');
      setShowAddDialog(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add course');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
      const courses = lines.map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        return { code: parts[0], name: parts[1] || parts[0], description: parts[2] || undefined };
      });
      const result = await bulkAddCourses({
        programmeId: tree.programme.id,
        levelId: bulkLevelId,
        periodId: bulkPeriodId || undefined,
        courses,
      });
      setSuccess(`Added ${result.created.length} courses${result.errors.length > 0 ? `, ${result.errors.length} errors` : ''}`);
      if (result.errors.length > 0) setError(result.errors.join('\n'));
      setBulkText('');
      setShowBulkDialog(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to bulk add courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await deleteCourse(courseId);
      setSuccess('Course deleted!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete course');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{tree.programme.name}</h1>
          {tree.programme.code && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
              {tree.programme.code}
            </span>
          )}
        </div>
        {tree.institution && <p className="text-gray-600 dark:text-muted-foreground text-sm mt-1">{tree.institution.name}</p>}
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        {(['overview', 'courses', 'students'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {tab === 'overview' ? 'Overview' : tab === 'courses' ? 'Courses by Year' : 'Students'}
          </button>
        ))}
      </div>

      {success && <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">{success}</div>}
      {error && <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm whitespace-pre-line">{error}</div>}

      {activeTab === 'overview' && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Programme Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-muted rounded-lg p-4">
              <p className="text-2xl font-bold text-foreground">{tree.levels.length}</p>
              <p className="text-sm text-muted-foreground">Years</p>
            </div>
            <div className="bg-gray-50 dark:bg-muted rounded-lg p-4">
              <p className="text-2xl font-bold text-foreground">{tree.levels.reduce((acc, l) => acc + l.courses.length, 0)}</p>
              <p className="text-sm text-muted-foreground">Total Courses</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <button onClick={() => { if (tree.levels.length > 0) setAddCourseLevelId(tree.levels[0].id); setShowAddDialog(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
              <Plus className="w-4 h-4" /> Add Course
            </button>
            <button onClick={() => { if (tree.levels.length > 0) setBulkLevelId(tree.levels[0].id); setShowBulkDialog(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-border text-gray-700 dark:text-foreground rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-muted transition">
              Bulk Add
            </button>
          </div>

          {tree.levels.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No academic levels found</h3>
              <p className="text-muted-foreground">Set up academic levels for this institution first.</p>
            </div>
          ) : (
            tree.levels.map((level) => (
              <div key={level.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-muted/50 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{level.name}</h3>
                    <p className="text-sm text-muted-foreground">{level.courses.length} course{level.courses.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => { setAddCourseLevelId(level.id); setShowAddDialog(true); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {level.courses.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 dark:text-muted-foreground text-sm">No courses yet for this year</div>
                ) : (
                  <>
                    {/* Desktop: native table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-border">
                            <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Code</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Name</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Period</th>
                            <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                          {level.courses.map((course) => (
                            <tr key={course.id} className="hover:bg-muted">
                              <td className="px-4 py-2 text-sm font-mono text-gray-700 dark:text-foreground">{course.code}</td>
                              <td className="px-4 py-2 text-sm text-foreground">{course.name}</td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">{course.period?.name || '—'}</td>
                              <td className="px-4 py-2 text-right">
                                <button onClick={() => handleDeleteCourse(course.id)}
                                  // 44px minimum tap target on mobile, 40px on desktop
                                  className="h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                                  aria-label={`Delete ${course.name}`}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile: card list */}
                    <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700">
                      {level.courses.map((course) => (
                        <div key={course.id} className="px-4 py-3 flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-gray-700 dark:text-foreground">{course.code}</span>
                              <span className="text-sm text-foreground truncate">{course.name}</span>
                            </div>
                            {course.period?.name && (
                              <div className="text-xs text-muted-foreground mt-0.5">{course.period.name}</div>
                            )}
                          </div>
                          <button onClick={() => handleDeleteCourse(course.id)}
                            className="h-11 w-11 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition flex-shrink-0"
                            aria-label={`Delete ${course.name}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-card rounded-xl border border-border p-6 text-center text-gray-400 dark:text-muted-foreground">
          Student enrollment data coming soon.
        </div>
      )}

      {/* Add Course Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add Course</h3>
              <button onClick={() => setShowAddDialog(false)} className="p-1 rounded-md hover:bg-muted text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCourse} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Year</label>
                <select value={addCourseLevelId} onChange={(e) => setAddCourseLevelId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-white dark:bg-muted text-foreground text-sm">
                  {tree.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Period (optional)</label>
                <select value={newPeriodId} onChange={(e) => setNewPeriodId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-white dark:bg-muted text-foreground text-sm">
                  <option value="">No period</option>
                  {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Course Code</label>
                <input type="text" required value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-white dark:bg-muted text-foreground text-sm" placeholder="CS101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Course Name</label>
                <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-white dark:bg-muted text-foreground text-sm" placeholder="Introduction to CS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Description (optional)</label>
                <textarea rows={2} value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-white dark:bg-muted text-foreground text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition">
                  {loading ? 'Adding...' : 'Add Course'}
                </button>
                <button type="button" onClick={() => setShowAddDialog(false)} className="px-4 py-2 border border-gray-300 dark:border-border text-gray-700 dark:text-foreground rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-muted transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Dialog */}
      {showBulkDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Bulk Add Courses</h3>
              <button onClick={() => setShowBulkDialog(false)} className="p-1 rounded-md hover:bg-muted text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleBulkAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Year</label>
                <select value={bulkLevelId} onChange={(e) => setBulkLevelId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-white dark:bg-muted text-foreground text-sm">
                  {tree.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Period (optional)</label>
                <select value={bulkPeriodId} onChange={(e) => setBulkPeriodId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-white dark:bg-muted text-foreground text-sm">
                  <option value="">No period</option>
                  {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Courses (one per line: CODE, Name)</label>
                <textarea required rows={6} value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 bg-white dark:bg-muted text-foreground text-sm resize-none font-mono"
                  placeholder={'CS101, Intro to CS\nCS102, Programming Basics'} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition">
                  {loading ? 'Adding...' : 'Add All'}
                </button>
                <button type="button" onClick={() => setShowBulkDialog(false)} className="px-4 py-2 border border-gray-300 dark:border-border text-gray-700 dark:text-foreground rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-muted transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
