import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { Book } from '../../db/models';
import { saveReadingPosition } from '../../db';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

interface TocItem {
  label: string;
  page: number;
  level: number;
}

interface Props {
  book: Book;
  theme: 'light' | 'dark' | 'sepia';
  fontSize: number;
  showToc: boolean;
  onClose: () => void;
  onProgressChange: (progress: number) => void;
}

export function PdfReader({
  book, theme, showToc, onClose, onProgressChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(book.readingPosition?.page || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [scale, setScale] = useState(1.3);

  useEffect(() => {
    if (!book.fileData) return;

    const loadPdf = async () => {
      const doc = await pdfjsLib.getDocument({ data: book.fileData!.slice(0) }).promise;
      setPdf(doc);
      setTotalPages(doc.numPages);

      try {
        const outline = await doc.getOutline();
        if (outline) {
          const tocItems: TocItem[] = [];
          const flatten = async (items: any[], level: number) => {
            for (const item of items) {
              let page = 1;
              try {
                const dest = await doc.getDestination(item.dest);
                if (dest) {
                  const pageIndex = await doc.getPageIndex(dest[0]);
                  page = pageIndex + 1;
                }
              } catch { /* ignore */ }
              tocItems.push({ label: item.title, page, level });
              if (item.items?.length) await flatten(item.items, level + 1);
            }
          };
          await flatten(outline, 0);
          setToc(tocItems);
        }
      } catch { /* no outline */ }
    };
    loadPdf();
  }, [book.fileData]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdf || !containerRef.current) return;

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.maxWidth = '100%';

    if (theme === 'dark') {
      canvas.style.filter = 'invert(0.88) hue-rotate(180deg)';
    } else if (theme === 'sepia') {
      canvas.style.filter = 'sepia(0.3)';
    }

    await page.render({ canvasContext: context, viewport }).promise;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(canvas);
  }, [pdf, scale, theme]);

  useEffect(() => {
    if (pdf) {
      renderPage(currentPage);
      const pct = (currentPage / totalPages) * 100;
      onProgressChange(pct);
      saveReadingPosition(book.id, {
        type: 'pdf',
        page: currentPage,
        percentage: pct,
        updatedAt: new Date().toISOString(),
      }, pct);
    }
  }, [currentPage, pdf, renderPage, totalPages]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentPage(p => Math.max(1, p - 1));
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentPage(p => Math.min(totalPages, p + 1));
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [totalPages]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <>
      <div className="reader-content">
        {showToc && (
          <div className="reader-toc" style={{ borderRight: '1px solid var(--reader-border)', borderLeft: 'none' }}>
            <div className="reader-toc-title">Contents</div>
            {toc.length > 0 ? toc.map((item, i) => (
              <button
                key={i}
                className={`reader-toc-item${item.page === currentPage ? ' active' : ''}`}
                data-level={item.level}
                onClick={() => goToPage(item.page)}
              >
                {item.label}
              </button>
            )) : (
              <div style={{ padding: '8px 16px', fontSize: 13, color: 'var(--reader-muted)' }}>
                No table of contents
              </div>
            )}
          </div>
        )}

        <div className="reader-pdf-container">
          <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center' }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 0', fontSize: 13, color: 'var(--reader-muted)',
          }}>
            <button
              className="reader-font-size-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              ‹
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="reader-font-size-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              ›
            </button>
            <span style={{ margin: '0 8px' }}>|</span>
            <button className="reader-font-size-btn" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
              −
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button className="reader-font-size-btn" onClick={() => setScale(s => Math.min(3, s + 0.1))}>
              +
            </button>
          </div>
        </div>
      </div>

      <div className="reader-progress-bar">
        <div className="reader-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </>
  );
}
