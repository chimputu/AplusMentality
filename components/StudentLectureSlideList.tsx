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
      <div className="text-center py-12 bg-muted/50 rounded-xl">
        <Presentation className="w-16 h-16 text-foreground dark:text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground">No lecture slides available</h3>
        <p className="text-muted-foreground text-sm mt-1">Check back later for new slides.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {slides.map((slide) => (
        <div
          key={slide.id}
          className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition group"
        >
          {/* Slide Preview */}
          <div className="relative w-full aspect-[4/3] bg-muted flex items-center justify-center">
            <Presentation className="w-16 h-16 text-muted-foreground" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
              <a
                href={slide.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card/90 hover:bg-card-hover text-foreground p-3 rounded-full shadow-lg transition transform hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <ExternalLink className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Slide Info */}
          <div className="p-4">
            <h3 className="font-semibold text-foreground line-clamp-1">
              {slide.title}
            </h3>
            {slide.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {slide.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                {slide.creator?.name || 'Unknown'}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
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