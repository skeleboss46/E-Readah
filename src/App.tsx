import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { BookshelfView } from './components/Library/BookshelfView';
import { BookDetailModal } from './components/Common/BookDetailModal';
import { ContextMenu, type MenuItem } from './components/Common/ContextMenu';
import { ReaderView } from './components/Reader/ReaderView';
import { useLibrary } from './hooks/useLibrary';
import type { Book, Bookshelf } from './db/models';
import { getBooksForShelf, getShelvesForBook } from './db';

import './styles/global.css';
import './styles/sidebar.css';
import './styles/bookshelf.css';
import './styles/modal.css';
import './styles/reader.css';

function App() {
  const lib = useLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [readerBook, setReaderBook] = useState<Book | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [detailBookShelves, setDetailBookShelves] = useState<Bookshelf[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; book: Book } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [displayBooks, setDisplayBooks] = useState<Book[]>([]);
  const [currentShelfName, setCurrentShelfName] = useState<string | undefined>();

  useEffect(() => {
    const loadDisplayBooks = async () => {
      if (lib.viewMode === 'shelf' && lib.activeShelfId) {
        const books = await getBooksForShelf(lib.activeShelfId);
        setDisplayBooks(books);
        const shelf = lib.bookshelves.find(s => s.id === lib.activeShelfId);
        setCurrentShelfName(shelf?.name);
      } else {
        setDisplayBooks(lib.getFilteredBooks());
        if (lib.viewMode === 'tag' && lib.activeTag) {
          setCurrentShelfName(`#${lib.activeTag}`);
        } else {
          setCurrentShelfName(undefined);
        }
      }
    };
    loadDisplayBooks();
  }, [lib.viewMode, lib.activeShelfId, lib.activeTag, lib.books, lib.searchQuery, lib.filterType, lib.filterStatus]);

  const handleImport = useCallback(async (files: FileList | File[]) => {
    setImporting(true);
    const validFiles = Array.from(files).filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext === 'epub' || ext === 'pdf';
    });
    if (validFiles.length > 0) {
      await lib.importFiles(validFiles);
    }
    setImporting(false);
  }, [lib.importFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleImport(e.dataTransfer.files);
    }
  }, [handleImport]);

  const handleBookClick = useCallback((book: Book) => {
    setReaderBook(book);
  }, []);

  const handleBookContext = useCallback((book: Book, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, book });
  }, []);

  const openBookDetail = useCallback(async (book: Book) => {
    const shelves = await getShelvesForBook(book.id);
    setDetailBookShelves(shelves);
    setDetailBook(book);
  }, []);

  const getContextMenuItems = useCallback((book: Book): MenuItem[] => {
    const items: MenuItem[] = [
      { label: 'Open', icon: '📖', onClick: () => setReaderBook(book) },
      { label: 'Book Details', icon: '📋', onClick: () => openBookDetail(book) },
      { label: '', icon: '', divider: true, onClick: () => {} },
    ];

    lib.bookshelves.forEach(shelf => {
      items.push({
        label: `Add to ${shelf.name}`,
        icon: shelf.icon || '📁',
        onClick: () => lib.addToShelf(shelf.id, book.id),
      });
    });

    if (lib.viewMode === 'shelf' && lib.activeShelfId) {
      items.push({
        label: 'Remove from this shelf',
        icon: '✕',
        onClick: () => lib.removeFromShelf(lib.activeShelfId!, book.id),
      });
    }

    items.push(
      { label: '', icon: '', divider: true, onClick: () => {} },
      {
        label: 'Delete Book',
        icon: '🗑',
        danger: true,
        onClick: () => {
          if (confirm(`Delete "${book.title}"? This will remove the book from your library.`)) {
            lib.removeBook(book.id);
          }
        },
      },
    );

    return items;
  }, [lib.bookshelves, lib.viewMode, lib.activeShelfId, lib.addToShelf, lib.removeFromShelf, lib.removeBook, openBookDetail]);

  if (readerBook) {
    return (
      <ReaderView
        book={readerBook}
        onClose={() => {
          setReaderBook(null);
          lib.refreshData();
        }}
        onBookUpdate={lib.refreshData}
      />
    );
  }

  return (
    <div
      className="app-layout"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar
        bookshelves={lib.bookshelves}
        bookCount={lib.books.length}
        activeView={lib.viewMode}
        activeShelfId={lib.activeShelfId}
        activeTag={lib.activeTag}
        tags={lib.getAllTags()}
        onViewChange={lib.setView}
        onCreateBookshelf={lib.createBookshelf}
        onRenameBookshelf={lib.renameBookshelf}
        onDeleteBookshelf={lib.removeBookshelf}
        onSettingsClick={() => {}}
      />

      <div className="library-main">
        <div className="library-header">
          <div className="library-header-top">
            <h2 className="library-title">
              {currentShelfName || 'All Books'}
            </h2>
            <div className="library-actions">
              <button
                className="btn btn-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? 'Importing...' : '+ Add Book'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".epub,.pdf"
                multiple
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files) handleImport(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
          <div className="filter-bar">
            <div className="search-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                placeholder="Search books..."
                value={lib.searchQuery}
                onChange={e => lib.setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className={`filter-chip${!lib.filterType ? ' active' : ''}`}
              onClick={() => lib.setFilterType(null)}
            >
              All
            </button>
            <button
              className={`filter-chip${lib.filterType === 'epub' ? ' active' : ''}`}
              onClick={() => lib.setFilterType(lib.filterType === 'epub' ? null : 'epub')}
            >
              EPUB
            </button>
            <button
              className={`filter-chip${lib.filterType === 'pdf' ? ' active' : ''}`}
              onClick={() => lib.setFilterType(lib.filterType === 'pdf' ? null : 'pdf')}
            >
              PDF
            </button>
            <span style={{ width: 1, height: 16, background: 'var(--border-light)' }} />
            <button
              className={`filter-chip${lib.filterStatus === 'unread' ? ' active' : ''}`}
              onClick={() => lib.setFilterStatus(lib.filterStatus === 'unread' ? null : 'unread')}
            >
              Unread
            </button>
            <button
              className={`filter-chip${lib.filterStatus === 'reading' ? ' active' : ''}`}
              onClick={() => lib.setFilterStatus(lib.filterStatus === 'reading' ? null : 'reading')}
            >
              Reading
            </button>
            <button
              className={`filter-chip${lib.filterStatus === 'finished' ? ' active' : ''}`}
              onClick={() => lib.setFilterStatus(lib.filterStatus === 'finished' ? null : 'finished')}
            >
              Finished
            </button>
          </div>
        </div>

        <BookshelfView
          books={displayBooks}
          shelfName={currentShelfName}
          onBookClick={handleBookClick}
          onBookContext={handleBookContext}
        />
      </div>

      {isDragging && (
        <div className="drop-zone-overlay">
          <div className="drop-zone-content">
            <div style={{ fontSize: 32 }}>📚</div>
            <h3>Drop to import</h3>
            <p>EPUB and PDF files</p>
          </div>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.book)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {detailBook && (
        <BookDetailModal
          book={detailBook}
          bookshelves={lib.bookshelves}
          bookShelves={detailBookShelves}
          onClose={() => setDetailBook(null)}
          onUpdate={lib.updateBook}
          onAddToShelf={lib.addToShelf}
          onRemoveFromShelf={lib.removeFromShelf}
          onDelete={lib.removeBook}
        />
      )}
    </div>
  );
}

export default App;
