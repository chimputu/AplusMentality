'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';

export function HeroVideoFacade() {
  const [playing, setPlaying] = useState(false);
  const videoId = 'g6BtbIiJ_rc';

  if (playing) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?start=6&rel=0&modestbranding=1&autoplay=1`}
          title="A+ Student Mentality - Best Study Motivation"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="relative w-full aspect-video rounded-xl overflow-hidden group cursor-pointer bg-gray-900"
      aria-label="Play motivational video"
    >
      {/* Thumbnail */}
      <Image
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        alt="A+ Student Mentality video thumbnail"
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        priority
      />

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
        <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
          <PlayCircle className="w-12 h-12 text-blue-600 ml-1" fill="currentColor" />
        </div>
      </div>

      {/* Title overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white font-semibold text-sm">
          A+ Student Mentality
        </p>
        <p className="text-white/70 text-xs">
          Best Study Motivation
        </p>
      </div>
    </button>
  );
}
