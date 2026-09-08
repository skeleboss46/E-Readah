import { useState } from 'react';
import type { Book } from '../../db/models';
import { lightenColor, getTextColor } from '../../utils/colors';

interface Props {
  book: Book;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function BookSpine({ book, onClick, onContextMenu }: Props) {
  const [hovered, setHovered] = useState(false);
  const textColor = getTextColor(book.spineColor);
  const accentColor = lightenColor(book.spineColor, 40);

  return (
    <div
      className="book-spine"
      style={{
        width: `${book.spineWidth}px`,
        height: `${book.spineHeight}px`,
        backgroundColor: book.spineColor,
        color: textColor,
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
    >
      <div
        className="book-spine-accent-top"
        style={{ backgroundColor: accentColor }}
      />

      <span className="book-spine-title">
        {book.title}
      </span>

      <div
        className="book-spine-accent-bottom"
        style={{ backgroundColor: accentColor }}
      />

      {book.readingStatus === 'reading' && (
        <div className="book-spine-reading-marker" />
      )}

      {book.readingProgress > 0 && (
        <div className="book-spine-progress">
          <div
            className="book-spine-progress-fill"
            style={{ width: `${book.readingProgress}%` }}
          />
        </div>
      )}

      {hovered && (
        <div className="book-spine-tooltip">
          <div className="book-spine-tooltip-title">{book.title}</div>
          <div className="book-spine-tooltip-author">{book.author}</div>
          {book.readingProgress > 0 && book.readingProgress < 100 && (
            <div className="book-spine-tooltip-author">
              {Math.round(book.readingProgress)}% read
            </div>
          )}
        </div>
      )}
    </div>
  );
}
