export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: Date;
  author: {
    name: string | null;
  };
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  cloudinaryId: string;
  url: string;
  thumbnail: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: Date;
  uploader: {
    name: string | null;
  };
}

export interface SearchResults {
  announcements: Announcement[];
  videos: Video[];
}