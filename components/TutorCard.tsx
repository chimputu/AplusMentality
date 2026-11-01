'use client';

import Link from 'next/link';
import { GraduationCap, MapPin, Clock, DollarSign, MessageSquare } from 'lucide-react';

interface TutorCardProps {
  tutor: {
    id: string;
    fullName: string;
    email: string;
    bio?: string | null;
    avatarUrl?: string | null;
    yearsExperience: number;
    mode: string;
    specialties?: Array<{
      course: {
        code: string;
        title: string;
      };
      personalRate?: number | null;
    }>;
    institution?: {
      id: string;
      name: string;
    } | null;
  };
}

export default function TutorCard({ tutor }: TutorCardProps) {
  // Calculate average rate from specialties
  const rates = tutor.specialties
    ?.filter((s) => s.personalRate)
    .map((s) => Number(s.personalRate)) || [];
  const avgRate = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          {tutor.avatarUrl ? (
            <img
              src={tutor.avatarUrl}
              alt={tutor.fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
              {tutor.fullName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{tutor.fullName}</h3>
          {tutor.institution && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {tutor.institution.name}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {tutor.bio && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{tutor.bio}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <GraduationCap className="w-4 h-4" />
          {tutor.yearsExperience} yr{tutor.yearsExperience !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {tutor.mode}
        </span>
        {avgRate && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {avgRate} ZMW/hr
          </span>
        )}
      </div>

      {/* Courses */}
      {tutor.specialties && tutor.specialties.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Courses:</p>
          <div className="flex flex-wrap gap-1">
            {tutor.specialties.slice(0, 3).map((spec, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
              >
                {spec.course.code}
              </span>
            ))}
            {tutor.specialties.length > 3 && (
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                +{tutor.specialties.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Book Session Button */}
      <Link
        href={`/student/tutor-request?tutorId=${tutor.id}`}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        Book Session
      </Link>
    </div>
  );
}
