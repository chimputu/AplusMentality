'use client';

import { useState } from 'react';
import Image from 'next/image';

interface InstitutionLogoProps {
  name: string;
  shortName?: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { box: 'w-10 h-10', text: 'text-sm' },
  md: { box: 'w-14 h-14', text: 'text-lg' },
  lg: { box: 'w-20 h-20', text: 'text-xl' },
};

// Deterministic color from name hash
function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-indigo-600',
    'bg-red-600',
    'bg-teal-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function InstitutionLogo({
  name,
  shortName,
  logoUrl,
  size = 'md',
  className = '',
}: InstitutionLogoProps) {
  const [errored, setErrored] = useState(false);
  const sizes = sizeMap[size];
  const showImage = logoUrl && !errored;

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-100 bg-white shadow-sm ${sizes.box} ${className}`}
    >
      {showImage ? (
        <Image
          src={logoUrl}
          alt={name}
          width={size === 'lg' ? 80 : size === 'md' ? 56 : 40}
          height={size === 'lg' ? 80 : size === 'md' ? 56 : 40}
          className="w-full h-full object-contain p-1"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center text-white font-bold ${getColorFromName(name)} ${sizes.text}`}
          title={name}
        >
          {shortName ?? getInitials(name)}
        </div>
      )}
    </div>
  );
}
