# E-Readah

A personal, local-first digital library and ebook reader.

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Features

- Visual bookshelf UI with book spines on wooden shelves
- Import EPUB and PDF files (drag-and-drop or file picker)
- EPUB reader (epub.js) with paginated display
- PDF reader (pdfjs-dist) with zoom controls
- Three reading themes: light, sepia, dark
- Table of contents, font size/family controls
- Reading position saved automatically (EPUB CFI for stable positioning)
- Multiple bookshelves with drag-to-organize
- Tags, search, and filters (format, reading status)
- Book detail modal with metadata editing
- Right-click context menu for book management

## Stack

- **Vite + React + TypeScript** — UI framework
- **Dexie.js** (IndexedDB) — local database
- **epub.js** — EPUB rendering
- **pdfjs-dist** — PDF rendering

## Data Storage

All data is stored locally in the browser's IndexedDB (`ereadah-library` database). Book files, metadata, reading positions, and annotations are all local. No cloud backend required.

## Architecture

Designed for future Obsidian integration:
- Stable UUIDs for books and annotations
- EPUB CFI for position tracking across reflows
- Annotation data model with tags, references, and cross-book links
- Modular architecture ready for `library://` deep link scheme
