import { useState, useMemo, useEffect } from 'react';
import {
  Folder,
  Hash,
  Inbox,
  LayoutGrid,
  Settings,
  Star,
  Trash2,
  Briefcase,
  Book,
  Code,
  Music,
  Film,
  ShoppingCart,
  Globe,
  Heart,
  Plus,
  Download,
  Upload,
  RefreshCw,
  X,
  Maximize2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import type { Collection, CollectionIcon } from '../types';
import { COLLECTION } from '../types';
import { buildCollectionTree, flattenCollectionTree } from '../utils';

interface SidebarProps {
  collections: Collection[];
  activeCollection: string;
  onSelectCollection: (id: string) => void;
  bookmarkCounts: Record<string, number>;
  onNewCollection: () => void;
  onImport: () => void;
  onImportJson: () => void;
  onExport?: () => void;
  onRefreshPreviews?: () => void;
  activeTags?: string[];
  availableTags?: string[];
  onToggleTag?: (tag: string) => void;
  onOpenDashboard?: () => void;
  onEditCollection?: (id: string) => void;
  enableAi?: boolean;
  onToggleAi?: () => void;
  onDropBookmark?: (bookmarkId: string, collectionId: string) => void;
  onDropCollection?: (draggedId: string, targetId: string | null) => void;
}

const getIcon = (iconName: CollectionIcon) => {
  switch (iconName) {
    case 'folder': return Folder;
    case 'star': return Star;
    case 'heart': return Heart;
    case 'briefcase': return Briefcase;
    case 'book': return Book;
    case 'code': return Code;
    case 'music': return Music;
    case 'film': return Film;
    case 'shopping-cart': return ShoppingCart;
    case 'globe': return Globe;
    default: return Folder;
  }
};

const getColorClass = (colorName: string, isActive: boolean) => {
  if (isActive) return 'text-zinc-900';
  switch (colorName) {
    case 'blue': return 'text-blue-500';
    case 'indigo': return 'text-indigo-500';
    case 'violet': return 'text-violet-500';
    case 'rose': return 'text-rose-500';
    case 'orange': return 'text-orange-500';
    case 'amber': return 'text-amber-500';
    case 'emerald': return 'text-emerald-500';
    case 'teal': return 'text-teal-500';
    case 'cyan': return 'text-cyan-500';
    case 'pink': return 'text-pink-500';
    default: return 'text-zinc-500';
  }
};

export function Sidebar({
  collections,
  activeCollection,
  onSelectCollection,
  bookmarkCounts,
  onNewCollection,
  onImport,
  onImportJson,
  onExport,
  onRefreshPreviews,
  activeTags = [],
  availableTags = [],
  onToggleTag,
  onOpenDashboard,
  onEditCollection,
  enableAi = false,
  onToggleAi,
  onDropBookmark,
  onDropCollection
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);

  // Close settings menu when clicking outside
  useEffect(() => {
    if (!showSettings) return;
    const handleClick = () => setShowSettings(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showSettings]);

  const NavItem = ({
    id,
    label,
    icon: Icon,
    color = 'zinc',
    depth = 0,
    isCustom = false,
    hasChildren = false,
    isExpanded = false,
    onToggleExpand,
  }: {
    id: string;
    label: string;
    icon: React.ElementType;
    color?: string;
    depth?: number;
    isCustom?: boolean;
    hasChildren?: boolean;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
  }) => {
    const isActive = activeCollection === id;
    const count = bookmarkCounts[id] || 0;

    return (
      <button
        draggable={isCustom}
        onDragStart={isCustom ? (e) => {
          e.dataTransfer.setData('application/collection-id', id);
        } : undefined}
        onClick={() => onSelectCollection(id)}
        onDragOver={(e) => {
          e.preventDefault(); // allow drop
        }}
        onDrop={(e) => {
          e.preventDefault();
          const bookmarkId = e.dataTransfer.getData('application/bookmark-id');
          if (bookmarkId && onDropBookmark) {
            onDropBookmark(bookmarkId, id);
          } else {
            const collectionId = e.dataTransfer.getData('application/collection-id');
            if (collectionId && onDropCollection) {
              onDropCollection(collectionId, isCustom ? id : null); // Only drop into custom
            }
          }
        }}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        className={`group w-full flex items-center justify-between pr-3 py-2 rounded-md transition-all duration-200 ease-in-out text-sm overflow-hidden ${
          isActive
            ? 'bg-zinc-100 text-zinc-900 font-medium shadow-sm border border-zinc-200/50'
            : 'text-zinc-600 hover:bg-zinc-100/50 hover:text-zinc-900'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
          {isCustom && (
            <div
              className={`w-4 h-4 flex items-center justify-center shrink-0 rounded transition-colors pointer-events-auto ${
                hasChildren ? 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/80 cursor-pointer' : 'opacity-0'
              }`}
              onClick={(e) => {
                if (hasChildren && onToggleExpand) {
                  e.stopPropagation();
                  onToggleExpand();
                }
              }}
            >
              {hasChildren && (
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
              )}
            </div>
          )}
          <Icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${getColorClass(color, isActive)} ${!isCustom ? 'ml-1' : ''}`} />
          <span className="truncate transition-colors duration-200">{label}</span>
        </div>
        
        <div className="grid justify-items-end items-center shrink-0 ml-2 pointer-events-none">
          {isCustom && (
            <div className="col-start-1 row-start-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-0.5 group-hover:translate-y-0 pointer-events-auto z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCollection?.(id);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors"
                title="Edit Collection"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className={`col-start-1 row-start-1 flex items-center transition-all duration-200 ${isCustom ? 'group-hover:opacity-0 group-hover:-translate-y-0.5' : ''}`}>
            <span
              className={`text-[11px] font-medium px-1.5 rounded-full transition-colors duration-200 ${
                isActive ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-400 bg-zinc-100/50 group-hover:bg-zinc-200'
              }`}
            >
              {count}
            </span>
          </div>
        </div>
      </button>
    );
  };

  const [manualExpanded, setManualExpanded] = useState<Set<string>>(new Set());

  // Auto-expand activeCollection and its ancestors
  useEffect(() => {
    let currentId: string | undefined = activeCollection;
    const toExpand = new Set<string>();
    
    // Auto-expand the clicked collection itself
    if (currentId) toExpand.add(currentId);
    
    while (currentId) {
      const coll = collections.find(c => c.id === currentId);
      if (!coll || !coll.parentId) break;
      toExpand.add(coll.parentId);
      currentId = coll.parentId;
      if (toExpand.has(currentId)) break;
    }

    if (toExpand.size > 0) {
      setManualExpanded(prev => {
        let changed = false;
        for (const id of toExpand) {
          if (!prev.has(id)) changed = true;
        }
        if (!changed) return prev;
        const next = new Set(prev);
        toExpand.forEach(id => next.add(id));
        return next;
      });
    }
  }, [activeCollection, collections]);

  const expandedIds = useMemo(() => manualExpanded, [manualExpanded]);

  const toggleExpand = (id: string) => {
    setManualExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="w-52 bg-white border-r border-zinc-200 flex flex-col h-full shadow-sm z-10 shrink-0">
      <div className="p-4 border-b border-zinc-100 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
            <BookmarkIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Bookmarks</h1>
        </div>
        {onOpenDashboard && (
          <button
            onClick={onOpenDashboard}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            title="Open Full Dashboard"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {/* Core items */}
        <div className="flex flex-col gap-0.5">
          <NavItem id={COLLECTION.ALL} label="All Bookmarks" icon={LayoutGrid} />
          <NavItem id={COLLECTION.UNSORTED} label="Unsorted" icon={Inbox} />
          <NavItem id={COLLECTION.TRASH} label="Trash" icon={Trash2} />
        </div>

        {/* Custom Collections */}
        <div>
          <div 
            className="flex items-center justify-between px-3 mb-1.5 rounded-md transition-colors hover:bg-zinc-100/30"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const collectionId = e.dataTransfer.getData('application/collection-id');
              if (collectionId && onDropCollection) {
                onDropCollection(collectionId, null);
              }
            }}
          >
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider py-1 w-full pointer-events-none">Collections</h3>
            <button
              onClick={onNewCollection}
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors pointer-events-auto shrink-0"
              title="New Collection"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {flattenCollectionTree(buildCollectionTree(collections))
              .filter((c) => {
                let currentId = c.parentId;
                while (currentId) {
                  if (!expandedIds.has(currentId)) return false;
                  const parentColl = collections.find(p => p.id === currentId);
                  currentId = parentColl?.parentId;
                }
                return true;
              })
              .map((c) => {
                const isExpanded = expandedIds.has(c.id);
                const hasChildren = c.children && c.children.length > 0;
                return (
                  <NavItem
                    key={c.id}
                    id={c.id}
                    label={c.name}
                    icon={getIcon(c.icon)}
                    color={c.color}
                    depth={c.depth}
                    isCustom={true}
                    hasChildren={hasChildren}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(c.id)}
                  />
                );
              })}
          </div>
        </div>

        {/* Tags Section */}
        {(activeTags.length > 0 || availableTags.length > 0) && onToggleTag && (
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-1.5 px-3">
              {activeTags.map(tag => (
                <button
                  key={`active-${tag}`}
                  onClick={() => onToggleTag(tag)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors border bg-blue-50 border-blue-200 text-blue-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 group"
                  title="Remove tag filter"
                >
                  <Hash className="w-3 h-3 opacity-70 group-hover:hidden" />
                  <X className="w-3 h-3 hidden group-hover:block" />
                  {tag}
                </button>
              ))}
              {availableTags.map(tag => (
                <button
                  key={`avail-${tag}`}
                  onClick={() => onToggleTag(tag)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors border bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  title="Filter by this tag"
                >
                  <Hash className="w-3 h-3 opacity-70" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Settings */}
      <div className="p-3 border-t border-zinc-100 shrink-0 relative">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowSettings(!showSettings);
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            showSettings ? 'bg-zinc-100 text-zinc-900 border border-zinc-200/50 shadow-sm' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>

        {showSettings && (
          <div className="absolute bottom-full left-3 mb-2 w-56 bg-white rounded-lg shadow-xl border border-zinc-200 py-1.5 z-50 text-[13px] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {onToggleAi && (
              <label 
                className="w-full flex items-center justify-between px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 mb-1 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-medium truncate">AI Magic</span>
                </div>
                <div className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${enableAi ? 'bg-amber-500' : 'bg-zinc-200'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow shadow-black/10 transition-transform duration-200 ease-in-out ${enableAi ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </div>
                <input 
                  type="checkbox" 
                  checked={enableAi} 
                  onChange={onToggleAi}
                  className="sr-only"
                />
              </label>
            )}
            <button
              onClick={onImportJson}
              className="w-full flex items-center text-left gap-2.5 px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">Import from JSON</span>
            </button>
            <button
              onClick={onImport}
              className="w-full flex items-center text-left gap-2.5 px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">Import from Bookmarks</span>
            </button>
            {onExport && (
              <button
                onClick={onExport}
                className="w-full flex items-center text-left gap-2.5 px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span className="truncate">Export Bookmarks</span>
              </button>
            )}
            {onRefreshPreviews && (
              <button
                onClick={onRefreshPreviews}
                className="w-full flex items-center text-left gap-2.5 px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span className="truncate">Fetch Missing Previews</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function BookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}
