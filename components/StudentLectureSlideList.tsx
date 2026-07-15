'use client';
import { Presentation, Calendar, User, ExternalLink } from 'lucide-react';

interface LectureSlide {
  id: string;
  title: string;
  description: string | null;
  embedUrl: string;
  createdAt: string;
  creator: { name: string | null };
}

interface StudentLectureSlideListProps {
  slides: LectureSlide[];
}

export default function StudentLectureSlideList({ slides }: StudentLectureSlideListProps) {
  if (slides.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <Presentation className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No lecture slides available</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Check back later for new slides.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {slides.map((slide) => (
        <div
          key={slide.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition group"
        >
          {/* Slide Preview */}
          <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Presentation className="w-16 h-16 text-gray-400 dark:text-gray-500" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
              <a
                href={slide.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition transform hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <ExternalLink className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Slide Info */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">
              {slide.title}
            </h3>
            {slide.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                {slide.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <User className="w-3 h-3" />
                {slide.creator?.name || 'Unknown'}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <Calendar className="w-3 h-3" />
                {new Date(slide.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}