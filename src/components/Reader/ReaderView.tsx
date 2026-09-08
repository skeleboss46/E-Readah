import { useState, useCallback } from 'react';
import type { Book } from '../../db/models';
import { EpubReader } from './EpubReader';
import { PdfReader } from './PdfReader';

type ReaderTheme = 'light' | 'dark' | 'sepia';

interface Props {
  book: Book;
  onClose: () => void;
  onBookUpdate: () => void;
}

export function ReaderView({ book, onClose, onBookUpdate }: Props) {
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('Georgia, serif');
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(book.readingProgress || 0);

  const handleProgressChange = useCallback((pct: number) => {
    setProgress(pct);
    onBookUpdate();
  }, [onBookUpdate]);

  return (
    <div className="reader-container" data-theme={theme}>
      <div className="reader-toolbar">
        <div className="reader-toolbar-left">
          <button className="reader-toolbar-btn" onClick={onClose} title="Close">
            ←
          </button>
          <button
            className={`reader-toolbar-btn${showToc ? ' active' : ''}`}
            onClick={() => { setShowToc(!showToc); setShowSettings(false); }}
            title="Table of Contents"
          >
            ☰
          </button>
        </div>

        <div className="reader-toolbar-center">
          <span className="reader-toolbar-title">{book.title}</span>
        </div>

        <div className="reader-toolbar-right">
          <span style={{ fontSize: 12, color: 'var(--reader-muted)', marginRight: 8 }}>
            {Math.round(progress)}%
          </span>

          {/* Theme toggle */}
          <button
            className="reader-toolbar-btn"
            onClick={() => {
              const themes: ReaderTheme[] = ['light', 'sepia', 'dark'];
              const idx = themes.indexOf(theme);
              setTheme(themes[(idx + 1) % themes.length]);
            }}
            title={`Theme: ${theme}`}
          >
            {theme === 'dark' ? '🌙' : theme === 'sepia' ? '📜' : '☀'}
          </button>

          {/* Font size controls */}
          <button
            className="reader-toolbar-btn"
            onClick={() => setFontSize(s => Math.max(12, s - 2))}
            title="Decrease font size"
            style={{ fontSize: 13 }}
          >
            A-
          </button>
          <button
            className="reader-toolbar-btn"
            onClick={() => setFontSize(s => Math.min(28, s + 2))}
            title="Increase font size"
            style={{ fontSize: 17 }}
          >
            A+
          </button>

          <button
            className={`reader-toolbar-btn${showSettings ? ' active' : ''}`}
            onClick={() => { setShowSettings(!showSettings); setShowToc(false); }}
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </div>

      {book.fileType === 'epub' ? (
        <EpubReader
          book={book}
          theme={theme}
          fontSize={fontSize}
          fontFamily={fontFamily}
          showToc={showToc}
          showSettings={showSettings}
          onClose={onClose}
          onProgressChange={handleProgressChange}
        />
      ) : (
        <PdfReader
          book={book}
          theme={theme}
          fontSize={fontSize}
          showToc={showToc}
          onClose={onClose}
          onProgressChange={handleProgressChange}
        />
      )}

      {showSettings && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 52,
          bottom: 3,
          width: 260,
          background: 'var(--reader-toolbar-bg)',
          borderLeft: '1px solid var(--reader-border)',
          padding: 16,
          overflowY: 'auto',
          zIndex: 20,
        }}>
          <div className="reader-settings-title">Reading Settings</div>

          <div className="reader-setting-group">
            <div className="reader-setting-label">Theme</div>
            <div className="reader-theme-options">
              {(['light', 'sepia', 'dark'] as const).map(t => (
                <button
                  key={t}
                  className={`reader-theme-btn${theme === t ? ' active' : ''}`}
                  data-theme={t}
                  onClick={() => setTheme(t)}
                  title={t}
                />
              ))}
            </div>
          </div>

          <div className="reader-setting-group">
            <div className="reader-setting-label">Font Size</div>
            <div className="reader-font-size-control">
              <button
                className="reader-font-size-btn"
                onClick={() => setFontSize(s => Math.max(12, s - 2))}
              >
                −
              </button>
              <span className="reader-font-size-value">{fontSize}px</span>
              <button
                className="reader-font-size-btn"
                onClick={() => setFontSize(s => Math.min(28, s + 2))}
              >
                +
              </button>
            </div>
          </div>

          {book.fileType === 'epub' && (
            <div className="reader-setting-group">
              <div className="reader-setting-label">Font Family</div>
              <select
                className="reader-font-select"
                value={fontFamily}
                onChange={e => setFontFamily(e.target.value)}
              >
                <option value="Georgia, serif">Georgia</option>
                <option value="'Crimson Pro', serif">Crimson Pro</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="system-ui, sans-serif">System Sans</option>
                <option value="'Inter', sans-serif">Inter</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
