import { useState, useEffect, useCallback } from 'react';
import type { Book } from '../../db/models';
import { ShelfRow } from './ShelfRow';

interface Props {
  books: Book[];
  shelfName?: string;
  onBookClick: (book: Book) => void;
  onBookContext: (book: Book, e: React.MouseEvent) => void;
}

const BOOKS_PER_SHELF = 14;

export function BookshelfView({ books, shelfName, onBookClick, onBookContext }: Props) {
  const [shelvedBooks, setShelvedBooks] = useState<Book[][]>([]);

  useEffect(() => {
    const shelves: Book[][] = [];
    for (let i = 0; i < books.length; i += BOOKS_PER_SHELF) {
      shelves.push(books.slice(i, i + BOOKS_PER_SHELF));
    }
    if (shelves.length === 0) shelves.push([]);
    setShelvedBooks(shelves);
  }, [books]);

  if (books.length === 0) {
    return (
      <div className="bookshelves-container">
        <div className="empty-library">
          <div className="empty-library-icon">📚</div>
          <h2>{shelfName ? `${shelfName} is empty` : 'Your library is empty'}</h2>
          <p>
            {shelfName
              ? 'Add books to this shelf by right-clicking a book and selecting "Add to Shelf".'
              : 'Import your first book to get started. Drag and drop EPUB or PDF files, or click the "+ Add Book" button above.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookshelves-container">
      {shelvedBooks.map((shelfBooks, idx) => (
        <ShelfRow
          key={idx}
          books={shelfBooks}
          label={idx === 0 ? shelfName : undefined}
          onBookClick={onBookClick}
          onBookContext={onBookContext}
        />
      ))}
    </div>
  );
}
