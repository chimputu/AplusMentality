// components/SlideViewerButton.tsx
'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import FileViewer from "./FileViewer";
import { getInlineUrl } from '@/lib/cloudinary-url';

interface SlideViewerButtonProps {
  fileUrl: string;
  title: string;
  fileType?: string | null;
}

export default function SlideViewerButton({
  fileUrl,
  title,
  fileType,
}: SlideViewerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-foreground px-5 py-3 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition w-full sm:w-auto active:scale-[0.98]"
      >
        <Eye className="w-4 h-4" />
        View in App
      </button>
      <FileViewer
        isOpen={open}
        onClose={() => setOpen(false)}
        fileUrl={getInlineUrl(fileUrl)}
        title={title}
        fileType={fileType}
        downloadUrl={fileUrl}
      />
    </>
  );
}