export type FileType = 'epub' | 'pdf';
export type ReadingStatus = 'unread' | 'reading' | 'finished';

export interface ReadingPosition {
  type: FileType;
  cfi?: string;
  page?: number;
  percentage: number;
  updatedAt: string;
}

export interface BookMetadata {
  publisher?: string;
  language?: string;
  isbn?: string;
  description?: string;
  publishDate?: string;
  pageCount?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  fileType: FileType;
  fileData?: ArrayBuffer;
  coverImage?: Blob;
  fileHash: string;
  fileSizeBytes: number;
  addedAt: string;
  lastOpenedAt?: string;
  readingStatus: ReadingStatus;
  readingProgress: number;
  readingPosition?: ReadingPosition;
  tags: string[];
  spineColor: string;
  spineWidth: number;
  spineHeight: number;
  metadata: BookMetadata;
}

export interface Bookshelf {
  id: string;
  name: string;
  sortOrder: number;
  icon?: string;
  createdAt: string;
}

export interface BookshelfBook {
  id?: number;
  bookshelfId: string;
  bookId: string;
  sortOrder: number;
}

export interface Annotation {
  id: string;
  bookId: string;
  type: 'highlight' | 'note';
  cfiRange?: string;
  pageNumber?: number;
  selectedText: string;
  note?: string;
  color: string;
  tags: string[];
  references: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

export const DEFAULT_BOOKSHELVES: Omit<Bookshelf, 'id' | 'createdAt'>[] = [
  { name: 'Currently Reading', sortOrder: 0, icon: '📖' },
  { name: 'To Read', sortOrder: 1, icon: '📚' },
  { name: 'Finished', sortOrder: 2, icon: '✓' },
];
