import { Search, Plus, LayoutGrid, LayoutList, Columns, CheckSquare, Square, Trash2, Edit, Grip } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list' | 'masonry';
  onViewModeChange: (m: 'grid' | 'list' | 'masonry') => void;
  onAdd: () => void;
  selectedCount?: number;
  isAllSelected?: boolean;
  onSelectAll?: () => void;
  onBulkDelete?: () => void;
  isTrashView?: boolean;
  sortOrder?: 'newest' | 'oldest' | 'a-z' | 'z-a';
  onSortChange?: (order: 'newest' | 'oldest' | 'a-z' | 'z-a') => void;
  isSelectMode?: boolean;
  onToggleSelectMode?: () => void;
  onCancelSelectMode?: () => void;
  currentTabBookmarked?: boolean;
  onEditCurrent?: () => void;
}

export function SearchBar({ 
  searchQuery, 
  onSearchChange, 
  viewMode, 
  onViewModeChange, 
  onAdd,
  selectedCount = 0,
  isAllSelected = false,
  onSelectAll,
  onBulkDelete,
  isTrashView = false,
  sortOrder = 'newest',
  onSortChange,
  isSelectMode = false,
  onToggleSelectMode,
  onCancelSelectMode,
  currentTabBookmarked,
  onEditCurrent
}: SearchBarProps) {
  
  if (isSelectMode || selectedCount > 0) {
    return (
      <div className="flex items-center justify-between py-3 px-5 border-b border-zinc-200 bg-blue-50 shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={onSelectAll}
            className="flex items-center gap-2 px-2 py-1.5 text-blue-700 hover:bg-blue-100/50 rounded-md transition-colors font-medium text-[13px]"
          >
            {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-[13px] font-medium text-blue-900">
            {selectedCount} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              onClick={onBulkDelete}
              className="flex items-center gap-1.5 px-3 h-8 bg-red-600 hover:bg-red-700 text-white rounded-md text-[13px] font-medium transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> {isTrashView ? 'Delete Permanently' : 'Move to Trash'}
            </button>
          )}
          {onCancelSelectMode && (
            <button
              onClick={onCancelSelectMode}
              className="px-3 h-8 text-blue-700 hover:bg-blue-100/50 rounded-md text-[13px] font-medium transition-colors ml-2"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 px-5 border-b border-zinc-200 bg-white shrink-0 z-10 shadow-sm relative">
      <div className="flex flex-1 max-w-md items-center gap-3">
        {onSelectAll && !isSelectMode && onToggleSelectMode && (
          <button 
            onClick={onToggleSelectMode}
            title="Select multiple bookmarks"
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bookmarks, urls, or tags..."
            className="w-full h-8 pl-8 pr-3 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        {onSortChange && (
          <select
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="h-8 pl-2 pr-6 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="a-z">A-Z</option>
            <option value="z-a">Z-A</option>
          </select>
        )}

        {/* View Toggle */}
        <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('masonry')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'masonry' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
            }`}
            title="Icon Grid View"
          >
            <Grip className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'list' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
            }`}
            title="List View"
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
        </div>

        {currentTabBookmarked && onEditCurrent ? (
          <button
            onClick={onEditCurrent}
            className="flex items-center gap-1.5 px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[13px] font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <Edit className="w-4 h-4" /> Edit Bookmark
          </button>
        ) : (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 h-8 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-[13px] font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>
    </div>
  );
}
