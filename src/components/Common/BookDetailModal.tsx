import { useState, useEffect } from 'react';
import type { Book, Bookshelf } from '../../db/models';
import { Modal } from './Modal';

interface Props {
  book: Book;
  bookshelves: Bookshelf[];
  bookShelves: Bookshelf[];
  onClose: () => void;
  onUpdate: (bookId: string, changes: Partial<Book>) => Promise<void>;
  onAddToShelf: (shelfId: string, bookId: string) => Promise<void>;
  onRemoveFromShelf: (shelfId: string, bookId: string) => Promise<void>;
  onDelete: (bookId: string) => void;
}

export function BookDetailModal({
  book, bookshelves, bookShelves, onClose, onUpdate,
  onAddToShelf, onRemoveFromShelf, onDelete,
}: Props) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(book.tags);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeShelfIds = new Set(bookShelves.map(s => s.id));

  useEffect(() => {
    if (book.coverImage) {
      const url = URL.createObjectURL(book.coverImage);
      setCoverUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [book.coverImage]);

  const handleSave = async () => {
    await onUpdate(book.id, { title, author, tags });
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleShelf = async (shelfId: string) => {
    if (activeShelfIds.has(shelfId)) {
      await onRemoveFromShelf(shelfId, book.id);
      activeShelfIds.delete(shelfId);
    } else {
      await onAddToShelf(shelfId, book.id);
      activeShelfIds.add(shelfId);
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(book.id);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  const fileSizeStr = book.fileSizeBytes < 1024 * 1024
    ? `${(book.fileSizeBytes / 1024).toFixed(0)} KB`
    : `${(book.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <Modal
      title="Book Details"
      onClose={onClose}
      footer={
        <>
          <button
            className={`btn ${confirmDelete ? 'btn-primary' : 'btn-ghost'}`}
            style={confirmDelete ? { background: 'var(--accent-red)' } : { color: 'var(--accent-red)' }}
            onClick={handleDelete}
          >
            {confirmDelete ? 'Confirm Delete' : 'Delete Book'}
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </>
      }
    >
      <div className="book-detail">
        <div className="book-detail-cover">
          {coverUrl ? (
            <img src={coverUrl} alt={book.title} />
          ) : (
            <div className="no-cover" style={{ backgroundColor: book.spineColor }}>
              📖
            </div>
          )}
        </div>
        <div className="book-detail-info">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Author</label>
            <input
              className="form-input"
              value={author}
              onChange={e => setAuthor(e.target.value)}
            />
          </div>
          <div className="book-detail-meta">
            <span>Format: {book.fileType.toUpperCase()}</span>
            <span>Size: {fileSizeStr}</span>
            {book.metadata.pageCount && <span>Pages: {book.metadata.pageCount}</span>}
            <span>Status: {book.readingStatus}</span>
            {book.readingProgress > 0 && (
              <span>Progress: {Math.round(book.readingProgress)}%</span>
            )}
          </div>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 20 }}>
        <label className="form-label">Tags</label>
        <div className="tag-input-container">
          {tags.map(tag => (
            <span key={tag} className="tag-badge">
              {tag}
              <button onClick={() => handleRemoveTag(tag)}>&times;</button>
            </span>
          ))}
          <input
            className="tag-input"
            placeholder="Add tag..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Bookshelves</label>
        <div className="shelf-select-list">
          {bookshelves.map(shelf => (
            <button
              key={shelf.id}
              className={`shelf-select-item${activeShelfIds.has(shelf.id) ? ' active' : ''}`}
              onClick={() => toggleShelf(shelf.id)}
            >
              <div className="shelf-checkbox">
                {activeShelfIds.has(shelf.id) && '✓'}
              </div>
              {shelf.icon && <span>{shelf.icon}</span>}
              {shelf.name}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
