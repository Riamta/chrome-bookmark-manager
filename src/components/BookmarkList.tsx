import { BookmarkCard } from './BookmarkCard';
import type { Bookmark } from '../types';
import { LayoutGrid } from 'lucide-react';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  viewMode: 'grid' | 'list' | 'masonry';
  onEdit: (b: Bookmark) => void;
  onDelete: (id: string, isFromTrash: boolean) => void;
  onRestore: (id: string) => void;
  isTrashView?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string, selected: boolean) => void;
  onTogglePin?: (id: string) => void;
  isSelectMode?: boolean;
  onTagClick?: (tag: string) => void;
}

export function BookmarkList({
  bookmarks,
  viewMode,
  onEdit,
  onDelete,
  onRestore,
  isTrashView = false,
  selectedIds = new Set(),
  onToggleSelect,
  onTogglePin,
  isSelectMode = false,
  onTagClick
}: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400">
        <div className="w-12 h-12 bg-white border border-zinc-200 shadow-sm rounded-xl flex items-center justify-center mb-4 text-zinc-300">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-zinc-500">No bookmarks found</p>
        <p className="text-xs text-zinc-400 mt-1">Try adding a new one or changing collections.</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="p-5 flex flex-col gap-2 max-w-5xl mx-auto">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              viewMode={viewMode}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
              isTrash={isTrashView}
              isSelected={selectedIds.has(bookmark.id)}
              onToggleSelect={onToggleSelect}
              onTogglePin={onTogglePin}
              isSelectMode={isSelectMode}
              onTagClick={onTagClick}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar">
      <div className={
        viewMode === 'grid' 
          ? "p-5 grid grid-cols-2 lg:grid-cols-6 gap-4 auto-rows-max"
          : "p-5 grid grid-cols-8 lg:grid-cols-[repeat(20,minmax(0,1fr))] gap-3 auto-rows-max mx-auto"
      }>
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            viewMode={viewMode}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestore={onRestore}
            isTrash={isTrashView}
            isSelected={selectedIds.has(bookmark.id)}
            onToggleSelect={onToggleSelect}
            onTogglePin={onTogglePin}
            isSelectMode={isSelectMode}
            onTagClick={onTagClick}
          />
        ))}
      </div>
    </div>
  );
}
