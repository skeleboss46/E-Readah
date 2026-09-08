import ePub from 'epubjs';
import type { FileType, BookMetadata } from '../db/models';
import { generateSpineColor, generateSpineDimensions } from './colors';

interface ImportedBook {
  title: string;
  author: string;
  fileType: FileType;
  fileData: ArrayBuffer;
  coverImage?: Blob;
  fileHash: string;
  fileSizeBytes: number;
  tags: string[];
  spineColor: string;
  spineWidth: number;
  spineHeight: number;
  metadata: BookMetadata;
}

async function hashFile(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function importEpub(file: File): Promise<ImportedBook> {
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);
  await book.ready;

  const meta = await book.loaded.metadata;
  const title = meta.title || file.name.replace(/\.epub$/i, '');
  const author = meta.creator || 'Unknown Author';

  let coverImage: Blob | undefined;
  try {
    const coverUrl = await book.coverUrl();
    if (coverUrl) {
      const response = await fetch(coverUrl);
      coverImage = await response.blob();
    }
  } catch {
    // No cover available
  }

  book.destroy();

  const fileHash = await hashFile(arrayBuffer);
  const { width, height } = generateSpineDimensions(arrayBuffer.byteLength);

  return {
    title,
    author,
    fileType: 'epub',
    fileData: arrayBuffer,
    coverImage,
    fileHash,
    fileSizeBytes: arrayBuffer.byteLength,
    tags: [],
    spineColor: generateSpineColor(title, author),
    spineWidth: width,
    spineHeight: height,
    metadata: {
      publisher: meta.publisher,
      language: meta.language,
      description: meta.description,
    },
  };
}

async function importPdf(file: File): Promise<ImportedBook> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  let title = file.name.replace(/\.pdf$/i, '');
  let author = 'Unknown Author';

  try {
    const metadata = await pdf.getMetadata();
    const info = metadata.info as Record<string, string>;
    if (info?.Title) title = info.Title;
    if (info?.Author) author = info.Author;
  } catch {
    // Metadata not available
  }

  const pageCount = pdf.numPages;
  pdf.destroy();

  const fileHash = await hashFile(arrayBuffer);
  const { width, height } = generateSpineDimensions(arrayBuffer.byteLength, pageCount);

  return {
    title,
    author,
    fileType: 'pdf',
    fileData: arrayBuffer,
    fileHash,
    fileSizeBytes: arrayBuffer.byteLength,
    tags: [],
    spineColor: generateSpineColor(title, author),
    spineWidth: width,
    spineHeight: height,
    metadata: { pageCount },
  };
}

export async function importBook(file: File): Promise<ImportedBook> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'epub') return importEpub(file);
  if (ext === 'pdf') return importPdf(file);
  throw new Error(`Unsupported file type: .${ext}`);
}
