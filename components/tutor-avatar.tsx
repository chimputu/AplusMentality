'use client';

import Image from 'next/image';

const FALLBACK_COLORS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-green-400 to-green-600',
  'from-yellow-400 to-yellow-600',
  'from-red-400 to-red-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
];

const SIZES = {
  sm: { width: 32, height: 32, fontSize: 'text-xs' },
  md: { width: 48, height: 48, fontSize: 'text-sm' },
  lg: { width: 96, height: 96, fontSize: 'text-lg' },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() || '?';
}

function getColorIndex(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % FALLBACK_COLORS.length;
}

interface TutorAvatarProps {
  tutor: {
    fullName: string;
    avatarUrl: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
}

export default function TutorAvatar({ tutor, size = 'md' }: TutorAvatarProps) {
  const { width, height, fontSize } = SIZES[size];
  const initials = getInitials(tutor.fullName);
  const colorIndex = getColorIndex(tutor.fullName);
  const bgColor = FALLBACK_COLORS[colorIndex];

  if (tutor.avatarUrl) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0 border-2 border-border dark:border-border"
        style={{ width, height }}
      >
        <Image
          src={tutor.avatarUrl}
          alt={tutor.fullName}
          width={width}
          height={height}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center text-white font-semibold flex-shrink-0 ${fontSize}`}
      style={{ width, height }}
    >
      {initials}
    </div>
  );
}
