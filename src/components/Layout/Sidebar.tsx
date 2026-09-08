import { useState } from 'react';
import type { Bookshelf } from '../../db/models';
import type { ViewMode } from '../../hooks/useLibrary';

interface Props {
  bookshelves: Bookshelf[];
  bookCount: number;
  activeView: ViewMode;
  activeShelfId: string | null;
  activeTag: string | null;
  tags: string[];
  onViewChange: (mode: ViewMode, id?: string | null) => void;
  onCreateBookshelf: (name: string) => void;
  onRenameBookshelf: (id: string, name: string) => void;
  onDeleteBookshelf: (id: string) => void;
  onSettingsClick: () => void;
}

export function Sidebar({
  bookshelves, bookCount, activeView, activeShelfId, activeTag,
  tags, onViewChange, onCreateBookshelf, onRenameBookshelf,
  onDeleteBookshelf, onSettingsClick,
}: Props) {
  const [newShelfName, setNewShelfName] = useState('');
  const [showNewShelf, setShowNewShelf] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateShelf = () => {
    if (newShelfName.trim()) {
      onCreateBookshelf(newShelfName.trim());
      setNewShelfName('');
      setShowNewShelf(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      onRenameBookshelf(id, editName.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h1>E-Readah</h1>
        <p>Personal Library</p>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Library</div>
        <button
          className={`sidebar-item${activeView === 'all' ? ' active' : ''}`}
          onClick={() => onViewChange('all')}
        >
          <span className="sidebar-item-icon">📚</span>
          <span className="sidebar-item-label">All Books</span>
          <span className="sidebar-item-count">{bookCount}</span>
        </button>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-section-title">Bookshelves</div>
        {bookshelves.map(shelf => (
          <div key={shelf.id}>
            {editingId === shelf.id ? (
              <div style={{ padding: '4px 16px' }}>
                <input
                  className="form-input"
                  style={{ fontSize: 12, padding: '4px 8px' }}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename(shelf.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={() => handleRename(shelf.id)}
                  autoFocus
                />
              </div>
            ) : (
              <button
                className={`sidebar-item${activeView === 'shelf' && activeShelfId === shelf.id ? ' active' : ''}`}
                onClick={() => onViewChange('shelf', shelf.id)}
                onDoubleClick={() => {
                  setEditingId(shelf.id);
                  setEditName(shelf.name);
                }}
                onContextMenu={e => {
                  e.preventDefault();
                  if (confirm(`Delete "${shelf.name}" bookshelf?`)) {
                    onDeleteBookshelf(shelf.id);
                  }
                }}
              >
                <span className="sidebar-item-icon">{shelf.icon || '📁'}</span>
                <span className="sidebar-item-label">{shelf.name}</span>
              </button>
            )}
          </div>
        ))}

        {showNewShelf ? (
          <div style={{ padding: '4px 16px' }}>
            <input
              className="form-input"
              style={{ fontSize: 12, padding: '4px 8px' }}
              placeholder="Shelf name..."
              value={newShelfName}
              onChange={e => setNewShelfName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateShelf();
                if (e.key === 'Escape') setShowNewShelf(false);
              }}
              onBlur={() => {
                if (newShelfName.trim()) handleCreateShelf();
                else setShowNewShelf(false);
              }}
              autoFocus
            />
          </div>
        ) : (
          <button
            className="sidebar-add-btn"
            onClick={() => setShowNewShelf(true)}
          >
            <span>+</span>
            New Bookshelf
          </button>
        )}
      </div>

      {tags.length > 0 && (
        <>
          <div className="sidebar-divider" />
          <div className="sidebar-section">
            <div className="sidebar-section-title">Tags</div>
            {tags.slice(0, 20).map(tag => (
              <button
                key={tag}
                className={`sidebar-item${activeView === 'tag' && activeTag === tag ? ' active' : ''}`}
                onClick={() => onViewChange('tag', tag)}
              >
                <span className="sidebar-item-icon">#</span>
                <span className="sidebar-item-label">{tag}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={onSettingsClick}>
          <span className="sidebar-item-icon">⚙</span>
          <span className="sidebar-item-label">Settings</span>
        </button>
      </div>
    </div>
  );
}
