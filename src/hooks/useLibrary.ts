import { useState, useEffect, useCallback } from 'react';
import type { Book, Bookshelf } from '../db/models';
import * as db from '../db';
import { importBook } from '../utils/import';

export type ViewMode = 'all' | 'shelf' | 'tag';

export interface LibraryState {
  books: Book[];
  bookshelves: Bookshelf[];
  loading: boolean;
  viewMode: ViewMode;
  activeShelfId: string | null;
  activeTag: string | null;
  searchQuery: string;
  filterType: string | null;
  filterStatus: string | null;
}

export function useLibrary() {
  const [state, setState] = useState<LibraryState>({
    books: [],
    bookshelves: [],
    loading: true,
    viewMode: 'all',
    activeShelfId: null,
    activeTag: null,
    searchQuery: '',
    filterType: null,
    filterStatus: null,
  });

  const loadData = useCallback(async () => {
    const [books, bookshelves] = await Promise.all([
      db.getAllBooks(),
      db.getAllBookshelves(),
    ]);
    setState(prev => ({ ...prev, books, bookshelves, loading: false }));
  }, []);

  useEffect(() => {
    db.initializeDatabase().then(loadData);
  }, [loadData]);

  const importFiles = useCallback(async (files: File[]): Promise<string[]> => {
    const ids: string[] = [];
    for (const file of files) {
      try {
        const imported = await importBook(file);
        const existing = state.books.find(b => b.fileHash === imported.fileHash);
        if (existing) {
          ids.push(existing.id);
          continue;
        }
        const id = await db.addBook(imported);
        ids.push(id);
      } catch (err) {
        console.error(`Failed to import ${file.name}:`, err);
      }
    }
    await loadData();
    return ids;
  }, [loadData, state.books]);

  const removeBook = useCallback(async (bookId: string) => {
    await db.deleteBook(bookId);
    await loadData();
  }, [loadData]);

  const updateBook = useCallback(async (bookId: string, changes: Partial<Book>) => {
    await db.updateBook(bookId, changes);
    await loadData();
  }, [loadData]);

  const createBookshelf = useCallback(async (name: string) => {
    await db.createBookshelf(name);
    await loadData();
  }, [loadData]);

  const renameBookshelf = useCallback(async (id: string, name: string) => {
    await db.updateBookshelf(id, { name });
    await loadData();
  }, [loadData]);

  const removeBookshelf = useCallback(async (id: string) => {
    await db.deleteBookshelf(id);
    setState(prev => ({
      ...prev,
      viewMode: prev.activeShelfId === id ? 'all' : prev.viewMode,
      activeShelfId: prev.activeShelfId === id ? null : prev.activeShelfId,
    }));
    await loadData();
  }, [loadData]);

  const addToShelf = useCallback(async (bookshelfId: string, bookId: string) => {
    await db.addBookToShelf(bookshelfId, bookId);
    await loadData();
  }, [loadData]);

  const removeFromShelf = useCallback(async (bookshelfId: string, bookId: string) => {
    await db.removeBookFromShelf(bookshelfId, bookId);
    await loadData();
  }, [loadData]);

  const getShelfBooks = useCallback(async (bookshelfId: string): Promise<Book[]> => {
    return db.getBooksForShelf(bookshelfId);
  }, []);

  const getBookShelves = useCallback(async (bookId: string): Promise<Bookshelf[]> => {
    return db.getShelvesForBook(bookId);
  }, []);

  const setView = useCallback((viewMode: ViewMode, id?: string | null) => {
    setState(prev => ({
      ...prev,
      viewMode,
      activeShelfId: viewMode === 'shelf' ? (id ?? null) : null,
      activeTag: viewMode === 'tag' ? (id ?? null) : null,
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setFilterType = useCallback((type: string | null) => {
    setState(prev => ({ ...prev, filterType: type }));
  }, []);

  const setFilterStatus = useCallback((status: string | null) => {
    setState(prev => ({ ...prev, filterStatus: status }));
  }, []);

  const getFilteredBooks = useCallback((): Book[] => {
    let books = state.books;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (state.filterType) {
      books = books.filter(b => b.fileType === state.filterType);
    }
    if (state.filterStatus) {
      books = books.filter(b => b.readingStatus === state.filterStatus);
    }
    if (state.activeTag) {
      books = books.filter(b => b.tags.includes(state.activeTag!));
    }
    return books;
  }, [state]);

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    state.books.forEach(b => b.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [state.books]);

  return {
    ...state,
    importFiles,
    removeBook,
    updateBook,
    createBookshelf,
    renameBookshelf,
    removeBookshelf,
    addToShelf,
    removeFromShelf,
    getShelfBooks,
    getBookShelves,
    setView,
    setSearchQuery,
    setFilterType,
    setFilterStatus,
    getFilteredBooks,
    getAllTags,
    refreshData: loadData,
  };
}
