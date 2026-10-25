'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

interface CourseCardProps {
  code: string;
  title: string;
  description: string;
  image?: string | null;
  category?: string;
  variant?: 'blue' | 'emerald';
  onEnroll?: () => void;
}

export function CourseCard({
  code,
  title,
  description,
  image,
  category,
  variant = 'blue',
  onEnroll,
}: CourseCardProps) {
  const [imgError, setImgError] = useState(false);

  const badgeBg = variant === 'blue' ? 'bg-blue-600' : 'bg-emerald-600';
  const buttonBg = variant === 'blue'
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-emerald-600 hover:bg-emerald-700';
  const gradientFrom = variant === 'blue' ? 'from-blue-100 to-blue-200' : 'from-emerald-100 to-emerald-200';
  const gradientTo = variant === 'blue' ? 'to-blue-200' : 'to-emerald-200';
  const fallbackIconColor = variant === 'blue' ? 'text-blue-600' : 'text-emerald-600';

  return (
    <div
      className="group flex flex-col bg-card rounded-xl overflow-hidden border border-border shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300 h-full cursor-pointer"
      onClick={onEnroll}
    >
      {/* Image area — 16:9 */}
      <div className={`relative w-full aspect-[16/9] bg-gradient-to-br ${gradientFrom} ${gradientTo} overflow-hidden`}>
        {image && !imgError ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${fallbackIconColor}`}>
            <BookOpen className="w-10 h-10 opacity-50" />
          </div>
        )}

        {/* Course code badge */}
        <div className={`absolute top-2 left-2 ${badgeBg} text-foreground text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm`}>
          {code}
        </div>

        {/* Category badge */}
        {category && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm">
            {category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight line-clamp-2">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex-1 line-clamp-2">
          {description}
        </p>

        {/* CTA */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Free</span>
          <span className={`${buttonBg} text-foreground text-xs font-medium px-3 py-1.5 rounded-full transition whitespace-nowrap`}>
            Explore
          </span>
        </div>
      </div>
    </div>
  );
}
