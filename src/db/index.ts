import Dexie, { type Table } from 'dexie';
import { v4 as uuid } from 'uuid';
import type {
  Book, Bookshelf, BookshelfBook, Annotation, AppSetting,
  DEFAULT_BOOKSHELVES
} from './models';
import { DEFAULT_BOOKSHELVES as DEFAULTS } from './models';

class LibraryDatabase extends Dexie {
  books!: Table<Book, string>;
  bookshelves!: Table<Bookshelf, string>;
  bookshelfBooks!: Table<BookshelfBook, number>;
  annotations!: Table<Annotation, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('ereadah-library');

    this.version(1).stores({
      books: 'id, title, author, fileType, readingStatus, addedAt, lastOpenedAt, fileHash, *tags',
      bookshelves: 'id, sortOrder',
      bookshelfBooks: '++id, bookshelfId, bookId, [bookshelfId+bookId]',
      annotations: 'id, bookId, type, createdAt, *tags',
      settings: 'key',
    });
  }
}

export const db = new LibraryDatabase();

let initPromise: Promise<void> | null = null;

export function initializeDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = db.transaction('rw', db.bookshelves, async () => {
      const count = await db.bookshelves.count();
      if (count === 0) {
        const now = new Date().toISOString();
        const shelves = DEFAULTS.map(s => ({
          ...s,
          id: uuid(),
          createdAt: now,
        }));
        await db.bookshelves.bulkAdd(shelves);
      }
    });
  }
  return initPromise;
}

export async function addBook(book: Omit<Book, 'id' | 'addedAt' | 'readingStatus' | 'readingProgress'>): Promise<string> {
  const id = uuid();
  await db.books.add({
    ...book,
    id,
    addedAt: new Date().toISOString(),
    readingStatus: 'unread',
    readingProgress: 0,
  });
  return id;
}

export async function getBook(id: string): Promise<Book | undefined> {
  return db.books.get(id);
}

export async function getAllBooks(): Promise<Book[]> {
  return db.books.orderBy('addedAt').reverse().toArray();
}

export async function updateBook(id: string, changes: Partial<Book>): Promise<void> {
  await db.books.update(id, changes);
}

export async function deleteBook(id: string): Promise<void> {
  await db.transaction('rw', [db.books, db.bookshelfBooks, db.annotations], async () => {
    await db.bookshelfBooks.where('bookId').equals(id).delete();
    await db.annotations.where('bookId').equals(id).delete();
    await db.books.delete(id);
  });
}

export async function getAllBookshelves(): Promise<Bookshelf[]> {
  return db.bookshelves.orderBy('sortOrder').toArray();
}

export async function createBookshelf(name: string, icon?: string): Promise<string> {
  const maxOrder = await db.bookshelves.orderBy('sortOrder').last();
  const id = uuid();
  await db.bookshelves.add({
    id,
    name,
    icon,
    sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function updateBookshelf(id: string, changes: Partial<Bookshelf>): Promise<void> {
  await db.bookshelves.update(id, changes);
}

export async function deleteBookshelf(id: string): Promise<void> {
  await db.transaction('rw', [db.bookshelves, db.bookshelfBooks], async () => {
    await db.bookshelfBooks.where('bookshelfId').equals(id).delete();
    await db.bookshelves.delete(id);
  });
}

export async function addBookToShelf(bookshelfId: string, bookId: string): Promise<void> {
  const existing = await db.bookshelfBooks
    .where({ bookshelfId, bookId })
    .first();
  if (existing) return;

  const maxOrder = await db.bookshelfBooks
    .where('bookshelfId')
    .equals(bookshelfId)
    .last();

  await db.bookshelfBooks.add({
    bookshelfId,
    bookId,
    sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
  });
}

export async function removeBookFromShelf(bookshelfId: string, bookId: string): Promise<void> {
  await db.bookshelfBooks.where({ bookshelfId, bookId }).delete();
}

export async function getBooksForShelf(bookshelfId: string): Promise<Book[]> {
  const links = await db.bookshelfBooks
    .where('bookshelfId')
    .equals(bookshelfId)
    .sortBy('sortOrder');
  const bookIds = links.map(l => l.bookId);
  const books = await db.books.bulkGet(bookIds);
  return books.filter((b): b is Book => b !== undefined);
}

export async function getShelvesForBook(bookId: string): Promise<Bookshelf[]> {
  const links = await db.bookshelfBooks
    .where('bookId')
    .equals(bookId)
    .toArray();
  const shelfIds = links.map(l => l.bookshelfId);
  const shelves = await db.bookshelves.bulkGet(shelfIds);
  return shelves.filter((s): s is Bookshelf => s !== undefined);
}

export async function saveReadingPosition(bookId: string, position: Book['readingPosition'], progress: number): Promise<void> {
  const status = progress >= 98 ? 'finished' as const : progress > 0 ? 'reading' as const : 'unread' as const;
  await db.books.update(bookId, {
    readingPosition: position,
    readingProgress: progress,
    readingStatus: status,
    lastOpenedAt: new Date().toISOString(),
  });
}

export async function searchBooks(query: string): Promise<Book[]> {
  const lower = query.toLowerCase();
  return db.books
    .filter(book =>
      book.title.toLowerCase().includes(lower) ||
      book.author.toLowerCase().includes(lower) ||
      book.tags.some(t => t.toLowerCase().includes(lower))
    )
    .toArray();
}

export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.get(key);
  return setting?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}
