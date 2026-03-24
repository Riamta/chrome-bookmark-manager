import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { BookmarkList } from './components/BookmarkList';
import { AddBookmarkModal } from './components/AddBookmarkModal';
import { CollectionModal } from './components/CollectionModal';
import { COLLECTION } from './types';
import type { Bookmark, Collection, CollectionColor, CollectionIcon, AppState } from './types';
import { getCollectionDescendants } from './utils';

// Custom Hook to manage extension state
function useExtensionState() {
  const [state, setState] = useState<AppState>({ bookmarks: [], collections: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial fetch
    chrome.runtime.sendMessage({ type: 'BM:getState' }, (response) => {
      if (response && !response.error) {
        setState(response);
        setIsLoaded(true);
      } else {
        setIsLoaded(true); // Don't block forever if error
        console.error("Failed to load state", response?.error);
      }
    });
  }, []);

  const send = (msg: any) => {
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(msg, (response) => {
        if (response && !response.error) {
          setState(response);
        }
        resolve();
      });
    });
  };

  return { state, send, isLoaded };
}

function App() {
  const { state, send, isLoaded } = useExtensionState();
  const [activeCollection, setActiveCollection] = useState<string>(COLLECTION.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>(() => {
    return (localStorage.getItem('bm_viewMode') as 'grid' | 'list' | 'masonry') || 'grid';
  });

  const handleViewModeChange = (mode: 'grid' | 'list' | 'masonry') => {
    setViewMode(mode);
    localStorage.setItem('bm_viewMode', mode);
  };
  
  const [modal, setModal] = useState<{
    type: 'add' | 'collection' | 'none';
    initial?: Partial<Bookmark>;
    existing?: Collection;
  }>({ type: 'none' });

  const [toast, setToast] = useState<{msg: string, id: number} | null>(null);

  const [currentTabBookmark, setCurrentTabBookmark] = useState<Bookmark | null>(null);

  const isDashboard = new URLSearchParams(window.location.search).get('target') === 'dashboard';

  const handleOpenDashboard = () => {
    if (chrome?.tabs && chrome.runtime?.getURL) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html?target=dashboard') });
    } else {
      window.open('index.html?target=dashboard', '_blank');
    }
  };

  useEffect(() => {
    if (isLoaded && !isDashboard && chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const tab = tabs[0];
        if (tab?.url && !tab.url.startsWith('chrome://')) {
          const existing = state.bookmarks.find(b => b.url === tab.url);
          setCurrentTabBookmark(existing || null);
        }
      });
    }
  }, [isLoaded, state.bookmarks, isDashboard]);

  // ─── Derived State ─────────────────────────────────────────────────────────

  const filteredBookmarks = useMemo(() => {
    let result = state.bookmarks;

    if (activeCollection === COLLECTION.TRASH) {
      result = result.filter((b) => b.collectionId === COLLECTION.TRASH);
    } else {
      result = result.filter((b) => b.collectionId !== COLLECTION.TRASH);
      if (activeCollection === COLLECTION.UNSORTED) {
        result = result.filter((b) => b.collectionId === COLLECTION.UNSORTED);
      } else if (activeCollection !== COLLECTION.ALL) {
        const descendants = getCollectionDescendants(state.collections, activeCollection);
        result = result.filter((b) => b.collectionId === activeCollection || descendants.has(b.collectionId));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (activeTags.length > 0) {
      result = result.filter((b) => activeTags.every(t => b.tags.includes(t)));
    }

    return result.sort((a, b) => {
      // 1. Pinned status first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // 2. Then fallback to selected sort order
      switch (sortOrder) {
        case 'oldest': return a.createdAt - b.createdAt;
        case 'a-z': return a.title.localeCompare(b.title);
        case 'z-a': return b.title.localeCompare(a.title);
        case 'newest':
        default: return b.createdAt - a.createdAt;
      }
    });
  }, [state.bookmarks, activeCollection, searchQuery, activeTags, sortOrder]);

  const bookmarkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const nonTrash = state.bookmarks.filter((b) => b.collectionId !== COLLECTION.TRASH);
    counts[COLLECTION.ALL] = nonTrash.length;
    counts[COLLECTION.UNSORTED] = state.bookmarks.filter((b) => b.collectionId === COLLECTION.UNSORTED).length;
    counts[COLLECTION.TRASH] = state.bookmarks.filter((b) => b.collectionId === COLLECTION.TRASH).length;
    state.collections.forEach((c) => {
      const descendants = getCollectionDescendants(state.collections, c.id);
      counts[c.id] = state.bookmarks.filter((b) => b.collectionId === c.id || descendants.has(b.collectionId)).length;
    });
    return counts;
  }, [state.bookmarks, state.collections]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    state.bookmarks.forEach((b) => b.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [state.bookmarks]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    filteredBookmarks.forEach((b) => b.tags.forEach((t) => {
      if (!activeTags.includes(t)) tags.add(t);
    }));
    return Array.from(tags).sort();
  }, [filteredBookmarks, activeTags]);

  // ─── Toast ─────────────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    const id = Date.now();
    setToast({ msg, id });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ─── Save Handlers ─────────────────────────────────────────────────────────

  const handleSaveBookmark = async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (modal.initial?.id) {
      await send({ type: 'BM:updateBookmark', payload: { ...data, id: modal.initial.id } });
      showToast('Bookmark updated');
    } else {
      await send({ type: 'BM:addBookmark', payload: data });
      showToast('Bookmark added');
    }
  };

  const handleSaveCollection = async (data: { name: string; icon: CollectionIcon; color: CollectionColor }) => {
    const editing = modal.type === 'collection' && modal.existing;
    if (editing) {
      await send({ type: 'BM:updateCollection', payload: { ...modal.existing, ...data } });
      showToast('Collection updated');
    } else {
      await send({ type: 'BM:addCollection', payload: data });
      showToast(`Collection "${data.name}" created`);
    }
  };

  const handleQuickAddCollection = async (name: string) => {
    await send({ type: 'BM:addCollection', payload: { name, icon: 'folder', color: 'blue' } });
    showToast(`Collection "${name}" created`);
  };

  // ─── Action Handlers ───────────────────────────────────────────────────────

  const handleDropBookmark = async (bookmarkId: string, collectionId: string) => {
    if (collectionId === COLLECTION.ALL) return; // Cannot explicitly move to "ALL"
    
    const bookmark = state.bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark || bookmark.collectionId === collectionId) return;

    if (collectionId === COLLECTION.TRASH) {
      handleDeleteBookmark(bookmarkId, false);
      return;
    }

    await send({ type: 'BM:updateBookmark', payload: { ...bookmark, collectionId } });
    showToast('Bookmark moved');
  };

  const handleDropCollection = async (draggedId: string, targetId: string | null) => {
    if (draggedId === targetId) return;

    // Cycle detection
    let current = targetId;
    while (current) {
      if (current === draggedId) {
        showToast("Cannot move a folder into itself or its children");
        return;
      }
      const parentColl = state.collections.find(c => c.id === current);
      current = parentColl?.parentId || null;
    }

    const draggedColl = state.collections.find(c => c.id === draggedId);
    if (!draggedColl) return;

    await send({ type: 'BM:updateCollection', payload: { ...draggedColl, parentId: targetId || undefined } });
    showToast('Collection moved');
  };

  const handleImport = async () => {
    if (window.confirm('Do you want to import your current browser bookmarks? This will merge them with your existing bookmarks.')) {
      showToast('Importing browser bookmarks...');
      await send({ type: 'BM:importBrowser' });
      showToast('Imported browser bookmarks');
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        bookmarks: state.bookmarks,
        collections: state.collections,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Bookmarks exported successfully');
    } catch (err) {
      showToast('Failed to export bookmarks');
    }
  };

  const handleRefreshPreviews = async () => {
    showToast('Refreshing missing previews...');
    await send({ type: 'BM:refreshPreviews' });
    showToast('Finished refreshing previews!');
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data && Array.isArray(data.bookmarks) && Array.isArray(data.collections)) {
          await send({ type: 'BM:importData', payload: { bookmarks: data.bookmarks, collections: data.collections } });
          showToast('Imported bookmarks from JSON');
        } else {
          showToast('Invalid JSON format');
        }
      } catch (err) {
        showToast('Failed to read JSON file');
      }
    };
    input.click();
  };

  const handleTogglePin = async (id: string) => {
    await send({ type: 'BM:togglePin', id });
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setModal({ type: 'add', initial: bookmark });
  };

  const handleDeleteBookmark = async (id: string, isFromTrash: boolean) => {
    if (isFromTrash) {
      await send({ type: 'BM:deleteBookmark', id });
      showToast('Bookmark permanently deleted');
    } else {
      await send({ type: 'BM:moveToTrash', id });
      showToast('Moved to trash');
    }
  };

  const handleRestoreBookmark = async (id: string) => {
    await send({ type: 'BM:restoreFromTrash', id });
    showToast('Bookmark restored');
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredBookmarks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookmarks.map(b => b.id)));
    }
  };

  const handleToggleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (activeCollection === COLLECTION.TRASH) {
      if (confirm(`Are you sure you want to permanently delete ${selectedIds.size} bookmarks?`)) {
        await send({ type: 'BM:bulkDelete', ids: Array.from(selectedIds) });
        setSelectedIds(new Set());
      }
    } else {
      await send({ type: 'BM:bulkMoveToTrash', ids: Array.from(selectedIds) });
      setSelectedIds(new Set());
    }
  };

  // Reset selection when changing collections or searching
  useEffect(() => {
    setSelectedIds(new Set());
    setIsSelectMode(false);
  }, [activeCollection, searchQuery]);

  const handleCancelSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-[#fafafa] ${isDashboard ? 'h-screen w-full' : 'w-[800px] h-[600px]'}`}>
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`flex bg-[#fafafa] text-zinc-900 overflow-hidden font-sans ${isDashboard ? 'h-screen w-full' : 'w-[800px] h-[600px]'}`}>
      <Sidebar
        collections={state.collections}
        activeCollection={activeCollection}
        onSelectCollection={(id) => {
          setActiveCollection(id);
          setActiveTags([]); // Reset tags when changing collection
        }}
        bookmarkCounts={bookmarkCounts}
        onNewCollection={() => setModal({ type: 'collection' })}
        onImport={handleImport}
        onImportJson={handleImportJson}
        onExport={handleExportData}
        onRefreshPreviews={handleRefreshPreviews}
        activeTags={activeTags}
        availableTags={availableTags}
        onToggleTag={(t: string) => {
          setActiveTags(prev => 
            prev.includes(t) ? prev.filter(tag => tag !== t) : [...prev, t]
          );
        }}
        onOpenDashboard={!isDashboard ? handleOpenDashboard : undefined}
        onEditCollection={(id: string) => {
          const collection = state.collections.find(c => c.id === id);
          if (collection) {
            setModal({ type: 'collection', existing: collection });
          }
        }}
        enableAi={state.settings?.enableAi ?? false}
        onToggleAi={() => {
          const nextState = !(state.settings?.enableAi ?? false);
          send({ type: 'BM:updateSettings', payload: { enableAi: nextState } });
          showToast(nextState ? 'AI Auto-Tagging Enabled' : 'AI Auto-Tagging Disabled');
        }}
        onDropBookmark={handleDropBookmark}
        onDropCollection={handleDropCollection}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onAdd={() => setModal({ type: 'add' })}
          currentTabBookmarked={!!currentTabBookmark}
          onEditCurrent={currentTabBookmark ? () => handleEditBookmark(currentTabBookmark) : undefined}
          selectedCount={selectedIds.size}
          isAllSelected={selectedIds.size > 0 && selectedIds.size === filteredBookmarks.length && filteredBookmarks.length > 0}
          onSelectAll={handleSelectAll}
          onBulkDelete={handleBulkDelete}
          isTrashView={activeCollection === COLLECTION.TRASH}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          isSelectMode={isSelectMode}
          onToggleSelectMode={() => setIsSelectMode(true)}
          onCancelSelectMode={handleCancelSelectMode}
        />
        <div className="flex-1 overflow-hidden relative">
          <BookmarkList
            bookmarks={filteredBookmarks}
            viewMode={viewMode}
            onEdit={handleEditBookmark}
            onDelete={handleDeleteBookmark}
            onRestore={handleRestoreBookmark}
            isTrashView={activeCollection === COLLECTION.TRASH}
            onTogglePin={handleTogglePin}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            isSelectMode={isSelectMode}
            onTagClick={(t: string) => {
              setActiveTags(prev => prev.includes(t) ? prev : [...prev, t]);
            }}
          />
        </div>
      </main>

      {/* Modals */}
      {modal.type === 'add' && (
        <AddBookmarkModal
          initial={modal.initial}
          existingBookmarks={state.bookmarks}
          collections={state.collections}
          allTags={allTags}
          onSave={handleSaveBookmark}
          onQuickAddCollection={handleQuickAddCollection}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'collection' && (
        <CollectionModal
          existing={modal.existing}
          collections={state.collections}
          onSave={handleSaveCollection}
          onDelete={async (id: string) => {
            if (confirm('Are you sure you want to delete this collection and its sub-collections? Bookmarks will be moved to Unsorted.')) {
              await send({ type: 'BM:deleteCollection', id });
              showToast('Collection deleted');
              if (activeCollection === id) {
                setActiveCollection(COLLECTION.ALL);
              }
              setModal({ type: 'none' });
            }
          }}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
          <div className="bg-white text-zinc-900 border border-zinc-200 px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
