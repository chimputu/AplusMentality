// components/PastPaperAdminActions.tsx
'use client';

import { useState } from 'react';
import { Eye, ExternalLink, Download } from 'lucide-react';
import FileViewer from './FileViewer';
import { getInlineUrl } from '@/lib/cloudinary-url';

interface PastPaperAdminActionsProps {
  paper: {
    id: string;
    title: string;
    fileUrl: string;
    fileType: string | null;
  };
}

export default function PastPaperAdminActions({ paper }: PastPaperAdminActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-3 items-center">
      {/* View inline */}
      <button
        onClick={() => setOpen(true)}
        className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
        title="View in app"
      >
        <Eye className="w-4 h-4" /> View
      </button>

      {/* Open in new tab (inline) */}
      <a
        href={getInlineUrl(paper.fileUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground inline-flex items-center gap-1 text-sm"
        title="Open in new tab"
      >
        <ExternalLink className="w-4 h-4" />
      </a>

      {/* Download */}
      <a
        href={paper.fileUrl}
        download
        className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground inline-flex items-center gap-1 text-sm"
        title="Download"
      >
        <Download className="w-4 h-4" />
      </a>

      {/* Shared viewer */}
      <FileViewer
        isOpen={open}
        onClose={() => setOpen(false)}
        fileUrl={getInlineUrl(paper.fileUrl)}
        title={paper.title}
        fileType={paper.fileType}
        downloadUrl={paper.fileUrl}
      />
    </div>
  );
}