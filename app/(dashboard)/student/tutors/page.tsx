'use client';

import { useState, useEffect } from 'react';
import { Search, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import TutorAvatar from '@/components/tutor-avatar';

interface Tutor {
  id: string;
  fullName: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  yearsExperience: number;
  isVerified: boolean;
  university?: { code: string; name: string };
  programme?: { name: string; shortName: string | null };
  specialties: Array<{
    course: { code: string; title: string };
    personalRate: number | null;
    groupRate: number | null;
    personalEnabled: boolean;
    groupEnabled: boolean;
    currency: string;
  }>;
}

export default function StudentTutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uniFilter, setUniFilter] = useState(false);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams();
      if (search) params.set('course', search);
      const res = await fetch(`/api/student/tutors?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTutors(data);
      }
      setLoading(false);
    }
    load();
  }, [search]);

  const getPriceRange = (t: Tutor) => {
    const rates = t.specialties
      .filter((s) => s.personalEnabled && s.personalRate)
      .map((s) => s.personalRate!)
      .sort((a, b) => a - b);
    if (rates.length === 0) return 'Contact for rate';
    return `${rates[0]}-${rates[rates.length - 1]} ZMW/hr`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Find Tutors</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Browse tutors specializing in your courses
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course code or name…"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tutors.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No tutors found matching your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor) => (
            <Link
              key={tutor.id}
              href={`/student/tutors/${tutor.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-start gap-3">
                <TutorAvatar
                  tutor={{ fullName: tutor.fullName, avatarUrl: tutor.avatarUrl }}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {tutor.fullName}
                    </h3>
                    {tutor.isVerified && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tutor.yearsExperience}yr experience
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {tutor.specialties.slice(0, 3).map((s, i) => (
                  <span
                    key={i}
                    className="inline-block px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                  >
                    {s.course.code}
                  </span>
                ))}
                {tutor.specialties.length > 3 && (
                  <span className="text-xs text-gray-400">+{tutor.specialties.length - 3}</span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {getPriceRange(tutor)}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
