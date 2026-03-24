import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash2, ExternalLink, RefreshCw, CheckSquare, Square, Pin, StickyNote } from 'lucide-react';
import type { Bookmark } from '../types';
import { getDomain, getFavicon, formatRelativeDate } from '../utils';

interface BookmarkCardProps {
  bookmark: Bookmark;
  viewMode: 'grid' | 'list' | 'masonry';
  onEdit: (b: Bookmark) => void;
  onDelete: (id: string, isFromTrash: boolean) => void;
  onRestore: (id: string) => void;
  isTrash?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string, selected: boolean) => void;
  onTogglePin?: (id: string) => void;
  isSelectMode?: boolean;
  onTagClick?: (tag: string) => void;
}

export function BookmarkCard({ 
  bookmark, 
  viewMode, 
  onEdit, 
  onDelete, 
  onRestore, 
  isTrash,
  isSelected = false,
  onToggleSelect,
  onTogglePin,
  isSelectMode = false,
  onTagClick
}: BookmarkCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const checkboxRef = useRef<HTMLButtonElement>(null);

  const hostname = getDomain(bookmark.url);
  const faviconUrl = getFavicon(bookmark.url);
  const relativeDate = formatRelativeDate(bookmark.createdAt);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      btnRef.current?.contains(e.target as Node) ||
      menuRef.current?.contains(e.target as Node) ||
      checkboxRef.current?.contains(e.target as Node)
    ) {
      return;
    }
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const ActionsMenu = () => (
    showMenu && (
      <div
        ref={menuRef}
        className="absolute right-8 top-8 w-40 bg-white border border-zinc-200 shadow-xl rounded-md overflow-hidden z-20 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-1 flex flex-col">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
            className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded cursor-pointer font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Link
          </a>
          {!isTrash && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onEdit(bookmark);
              }}
              className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded cursor-pointer font-medium transition-colors w-full text-left"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          {isTrash && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onRestore(bookmark.id);
              }}
              className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-blue-600 hover:bg-blue-50 rounded cursor-pointer font-medium transition-colors w-full text-left"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restore
            </button>
          )}
          <div className="h-[1px] bg-zinc-100 my-1 mx-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              onDelete(bookmark.id, !!isTrash);
            }}
            className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-red-600 hover:bg-red-50 rounded cursor-pointer font-medium transition-colors w-full text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isTrash ? 'Delete Forever' : 'Move to Trash'}
          </button>
        </div>
      </div>
    )
  );

  const CheckboxToggle = () => {
    if (!isSelectMode) return null;
    return (
      <button
        ref={checkboxRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelect?.(bookmark.id, !isSelected);
        }}
        className={`p-1 rounded-md transition-opacity bg-white opacity-100 ${
          isSelected ? 'text-blue-600' : 'text-zinc-300 hover:text-zinc-500'
        }`}
      >
        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
      </button>
    );
  };

  const PinButton = () => (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onTogglePin?.(bookmark.id);
      }}
      className={`p-1 rounded-md transition-opacity bg-white ${
        bookmark.pinned ? 'opacity-100 text-blue-600' : 'opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-zinc-500'
      }`}
      title={bookmark.pinned ? "Unpin Bookmark" : "Pin Bookmark"}
    >
      <Pin className={`w-4 h-4 ${bookmark.pinned ? 'fill-current' : ''}`} />
    </button>
  );

  if (viewMode === 'masonry') {
    return (
      <div 
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/bookmark-id', bookmark.id);
        }}
        onClick={isSelectMode ? (e) => {
          e.preventDefault();
          onToggleSelect?.(bookmark.id, !isSelected);
        } : handleCardClick}
        className={`group flex items-center justify-center aspect-square p-2 rounded-2xl border shadow-sm transition-all cursor-pointer relative overflow-hidden ${
          isSelected ? 'bg-blue-50/50 border-blue-200 shadow-md' : 'bg-white border-zinc-200 hover:shadow-md hover:border-zinc-300'
        }`}
        title={bookmark.title || hostname}
      >
        <div className="absolute top-1 right-1 z-10 flex flex-col gap-1 items-end drop-shadow-sm scale-75 origin-top-right">
          <CheckboxToggle />
          <PinButton />
        </div>

        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shrink-0 bg-white border border-zinc-100 flex items-center justify-center overflow-hidden shadow-sm transition-transform group-hover:scale-105">
          <img
            src={faviconUrl}
            alt=""
            className="w-5 h-5 sm:w-6 sm:h-6"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${hostname}&background=f4f4f5&color=52525b&size=32`;
            }}
          />
        </div>

        <div className="absolute bottom-1 right-1 z-10 scale-75 origin-bottom-right">
          <button
            ref={btnRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1 rounded-md transition-opacity bg-white/80 backdrop-blur-sm border border-zinc-100 shadow-sm ${
              showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            } ${
              isSelected ? 'text-blue-600 hover:text-blue-800' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <ActionsMenu />
      </div>
    );
  }

  return viewMode === 'list' ? (
    <div 
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/bookmark-id', bookmark.id);
      }}
      onClick={isSelectMode ? (e) => {
        e.preventDefault();
        onToggleSelect?.(bookmark.id, !isSelected);
      } : handleCardClick}
      className={`group flex items-center justify-between p-3 rounded-lg border shadow-sm transition-all cursor-pointer relative ${
        isSelected ? 'bg-blue-50/50 border-blue-200 shadow-md' : 'bg-white border-zinc-200 hover:shadow-md hover:border-zinc-300'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <CheckboxToggle />
        <PinButton />
        
        {/* Favicon */}
        <div className="w-8 h-8 rounded shrink-0 bg-white border border-zinc-100 flex items-center justify-center overflow-hidden shadow-sm">
          <img
            src={faviconUrl}
            alt=""
            className="w-4 h-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${hostname}&background=f4f4f5&color=52525b&size=32`;
            }}
          />
        </div>

        {/* Title, URL, and Note */}
        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
          <div className="flex flex-row items-center gap-4">
            <h3
              className="text-[13px] font-semibold text-zinc-900 truncate tracking-tight w-[35%] min-w-[150px] shrink-0"
              title={bookmark.title || hostname}
            >
              {bookmark.title || hostname}
            </h3>
            <p className={`text-[12px] truncate flex-1 min-w-0 ${isSelected ? 'text-blue-600/70' : 'text-zinc-500'}`} title={bookmark.url}>
              {bookmark.url}
            </p>
          </div>
          {bookmark.note && (
            <div className="mt-1 flex items-start gap-1.5 text-zinc-600 bg-zinc-50/80 border border-zinc-200/60 rounded p-1.5 w-fit max-w-full">
              <StickyNote className="w-3 h-3 shrink-0 mt-0.5 text-zinc-400" />
              <p className="text-[11px] leading-snug truncate italic">{bookmark.note}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-hidden shrink-0 w-32 justify-end">
          {bookmark.tags.slice(0, 2).map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                if (onTagClick) {
                  e.preventDefault();
                  e.stopPropagation();
                  onTagClick(tag);
                }
              }}
              className={`px-1.5 py-0.5 rounded border text-[10px] uppercase font-semibold tracking-wider whitespace-nowrap transition-colors ${
                onTagClick ? 'cursor-pointer hover:border-zinc-300 hover:bg-zinc-200' : ''
              } ${
                isSelected ? 'bg-blue-100/50 border-blue-200 text-blue-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
              }`}
            >
              {tag}
            </button>
          ))}
          {bookmark.tags.length > 2 && (
            <span className="text-[10px] text-zinc-500 font-medium">+{bookmark.tags.length - 2}</span>
          )}
        </div>

        {/* Date */}
        <span className={`hidden lg:block text-[11px] font-medium shrink-0 w-24 text-right pr-2 ${isSelected ? 'text-blue-500' : 'text-zinc-400'}`}>
          {relativeDate}
        </span>
      </div>

      {/* Action Button */}
      <div className="shrink-0 flex items-center justify-end w-8 ml-2">
        <button
          ref={btnRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
            isSelected ? 'text-blue-600 hover:bg-blue-100' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <ActionsMenu />
    </div>
  ) : (
    <div 
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/bookmark-id', bookmark.id);
      }}
      onClick={isSelectMode ? (e) => {
        e.preventDefault();
        onToggleSelect?.(bookmark.id, !isSelected);
      } : handleCardClick}
      className={`group flex flex-col rounded-lg border shadow-sm transition-all cursor-pointer relative overflow-hidden min-h-[140px] ${
        isSelected ? 'bg-blue-50/50 border-blue-200 shadow-md' : 'bg-white border-zinc-200 hover:shadow-md hover:border-zinc-300'
      }`}
    >
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end drop-shadow-sm">
        <CheckboxToggle />
        <PinButton />
        <button
          ref={btnRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className={`p-1 rounded-md transition-opacity bg-white ${
            showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } ${
            isSelected ? 'text-blue-600 hover:text-blue-800' : 'text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Cover Image */}
      {bookmark.coverUrl ? (
        <div className="w-full h-32 bg-zinc-100 relative shrink-0">
          <img 
            src={bookmark.coverUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLDivElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      ) : (
        <div className="w-full h-3 bg-zinc-100 shrink-0"></div>
      )}

      <div className="flex flex-col flex-1 p-3 pt-2">
        <div className="flex items-start gap-3 w-full mb-3">
          {/* Favicon */}
          <div className={`w-8 h-8 rounded shrink-0 bg-white border border-zinc-100 flex items-center justify-center overflow-hidden shadow-sm ${bookmark.coverUrl ? '-mt-6 z-10' : 'mt-0.5'}`}>
            <img
              src={faviconUrl}
              alt=""
              className="w-4 h-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${hostname}&background=f4f4f5&color=52525b&size=32`;
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-8">
            <h3
              className="text-[13px] font-semibold text-zinc-900 truncate tracking-tight mb-0.5"
              title={bookmark.title}
            >
              {bookmark.title || hostname}
            </h3>
            <p className={`text-[12px] truncate ${isSelected ? 'text-blue-600/70' : 'text-zinc-500'}`} title={bookmark.url}>
              {bookmark.url}
            </p>
          </div>
        </div>

        {bookmark.note && (
          <div className="mb-3 flex items-start gap-1.5 text-zinc-600 bg-zinc-50/80 border border-zinc-200/60 rounded-md p-2 w-full shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
            <p className="text-[11px] leading-relaxed line-clamp-2 italic">{bookmark.note}</p>
          </div>
        )}

      {/* Footer / Tags */}
      <div className="relative mt-auto flex items-center justify-between pointer-events-none p-3 pt-0">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {bookmark.tags.slice(0, 3).map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                if (onTagClick) {
                  e.preventDefault();
                  e.stopPropagation();
                  onTagClick(tag);
                }
              }}
              className={`px-1.5 py-0.5 rounded border text-[10px] uppercase font-semibold tracking-wider whitespace-nowrap pointer-events-auto transition-colors ${
                onTagClick ? 'cursor-pointer hover:border-zinc-300 hover:bg-zinc-200' : ''
              } ${
                isSelected ? 'bg-blue-100/50 border-blue-200 text-blue-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
              }`}
            >
              {tag}
            </button>
          ))}
          {bookmark.tags.length > 3 && (
            <span className="text-[10px] text-zinc-500 font-medium">+{bookmark.tags.length - 3}</span>
          )}
        </div>
        <span className={`text-[11px] font-medium shrink-0 ml-2 ${isSelected ? 'text-blue-500' : 'text-zinc-400'}`}>
          {relativeDate}
        </span>
      </div>
      </div>

      <ActionsMenu />
    </div>
  );
}
