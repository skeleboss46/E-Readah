import { useEffect, useRef, useState, useCallback } from 'react';
import ePub from 'epubjs';
import type { Book } from '../../db/models';
import { saveReadingPosition } from '../../db';

interface TocItem {
  label: string;
  href: string;
  level: number;
}

interface Props {
  book: Book;
  theme: 'light' | 'dark' | 'sepia';
  fontSize: number;
  fontFamily: string;
  showToc: boolean;
  showSettings: boolean;
  onClose: () => void;
  onProgressChange: (progress: number) => void;
}

export function EpubReader({
  book, theme, fontSize, fontFamily, showToc, showSettings,
  onClose, onProgressChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [currentCfi, setCurrentCfi] = useState<string | null>(null);
  const [progress, setProgress] = useState(book.readingProgress || 0);

  const getThemeStyles = useCallback(() => {
    const themes: Record<string, Record<string, string>> = {
      light: { body: { color: '#2c1810 !important', background: '#faf7f2 !important' } },
      dark: { body: { color: '#d4d0c8 !important', background: '#1a1a1e !important' } },
      sepia: { body: { color: '#3d2b1f !important', background: '#f4ecd8 !important' } },
    } as any;
    return themes[theme];
  }, [theme]);

  useEffect(() => {
    if (!containerRef.current || !book.fileData) return;

    const epub = ePub(book.fileData.slice(0));
    bookRef.current = epub;

    const rendition = epub.renderTo(containerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated',
    });
    renditionRef.current = rendition;

    rendition.themes.register('light', {
      body: { color: '#2c1810 !important', background: '#faf7f2 !important' },
    });
    rendition.themes.register('dark', {
      body: { color: '#d4d0c8 !important', background: '#1a1a1e !important' },
    });
    rendition.themes.register('sepia', {
      body: { color: '#3d2b1f !important', background: '#f4ecd8 !important' },
    });

    rendition.themes.select(theme);
    rendition.themes.fontSize(`${fontSize}px`);
    rendition.themes.font(fontFamily);

    if (book.readingPosition?.cfi) {
      rendition.display(book.readingPosition.cfi);
    } else {
      rendition.display();
    }

    epub.loaded.navigation.then((nav: any) => {
      const flatToc: TocItem[] = [];
      const flatten = (items: any[], level: number) => {
        items.forEach((item: any) => {
          flatToc.push({ label: item.label.trim(), href: item.href, level });
          if (item.subitems?.length) flatten(item.subitems, level + 1);
        });
      };
      flatten(nav.toc, 0);
      setToc(flatToc);
    });

    rendition.on('relocated', (location: any) => {
      const cfi = location.start.cfi;
      setCurrentCfi(cfi);

      if (epub.locations.length() > 0) {
        const pct = epub.locations.percentageFromCfi(cfi) * 100;
        setProgress(pct);
        onProgressChange(pct);
        saveReadingPosition(book.id, {
          type: 'epub',
          cfi,
          percentage: pct,
          updatedAt: new Date().toISOString(),
        }, pct);
      }
    });

    epub.ready.then(() => {
      return epub.locations.generate(1024);
    }).then(() => {
      if (renditionRef.current && currentCfi) {
        const pct = epub.locations.percentageFromCfi(currentCfi) * 100;
        setProgress(pct);
      }
    });

    rendition.on('keyup', (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') rendition.prev();
      if (e.key === 'ArrowRight') rendition.next();
    });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') rendition.prev();
      if (e.key === 'ArrowRight') rendition.next();
    };
    document.addEventListener('keyup', handleKey);

    return () => {
      document.removeEventListener('keyup', handleKey);
      rendition.destroy();
      epub.destroy();
    };
  }, [book.fileData, book.id]);

  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.select(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}px`);
    }
  }, [fontSize]);

  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.font(fontFamily);
    }
  }, [fontFamily]);

  const goToChapter = (href: string) => {
    renditionRef.current?.display(href);
  };

  const goNext = () => renditionRef.current?.next();
  const goPrev = () => renditionRef.current?.prev();

  return (
    <>
      <div className="reader-content">
        {showToc && (
          <div className="reader-toc" style={{ borderRight: '1px solid var(--reader-border)', borderLeft: 'none' }}>
            <div className="reader-toc-title">Contents</div>
            {toc.map((item, i) => (
              <button
                key={i}
                className="reader-toc-item"
                data-level={item.level}
                onClick={() => goToChapter(item.href)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div className="reader-epub-container" ref={containerRef}>
          <button className="reader-nav-btn reader-nav-prev" onClick={goPrev}>
            ‹
          </button>
          <button className="reader-nav-btn reader-nav-next" onClick={goNext}>
            ›
          </button>
        </div>

        {showSettings && (
          <div className="reader-settings">
            {/* Settings rendered by parent */}
          </div>
        )}
      </div>

      <div className="reader-progress-bar">
        <div className="reader-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </>
  );
}
