import type { Book } from '../../db/models';
import { BookSpine } from './BookSpine';

interface Props {
  books: Book[];
  label?: string;
  onBookClick: (book: Book) => void;
  onBookContext: (book: Book, e: React.MouseEvent) => void;
}

export function ShelfRow({ books, label, onBookClick, onBookContext }: Props) {
  return (
    <div className="shelf-section">
      {label && <div className="shelf-label">{label}</div>}
      <div className="shelf-row">
        <div className="shelf-books">
          {books.length === 0 ? (
            <div className="empty-shelf">No books on this shelf yet</div>
          ) : (
            books.map(book => (
              <BookSpine
                key={book.id}
                book={book}
                onClick={() => onBookClick(book)}
                onContextMenu={(e) => onBookContext(book, e)}
              />
            ))
          )}
        </div>
        <div className="shelf-board" />
      </div>
    </div>
  );
}
