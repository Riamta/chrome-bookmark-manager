import { useEffect, useState, useRef } from 'react';
import { X, Globe, AlignLeft, Hash, Folder, Plus, Check, StickyNote, Sparkles } from 'lucide-react';
import type { Bookmark, Collection } from '../types';
import { COLLECTION } from '../types';
import { buildCollectionTree, flattenCollectionTree } from '../utils';

interface AddBookmarkModalProps {
  initial?: Partial<Bookmark>;
  existingBookmarks: Bookmark[];
  collections: Collection[];
  allTags: string[];
  onSave: (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onQuickAddCollection: (name: string) => Promise<void>;
  onClose: () => void;
}

export function AddBookmarkModal({
  initial,
  existingBookmarks,
  collections,
  allTags,
  onSave,
  onQuickAddCollection,
  onClose,
}: AddBookmarkModalProps) {
  const [url, setUrl] = useState(initial?.url || '');
  const [title, setTitle] = useState(initial?.title || '');
  const [note, setNote] = useState(initial?.note || '');
  const [collectionId, setCollectionId] = useState(initial?.collectionId || COLLECTION.UNSORTED);
  const [editingId, setEditingId] = useState<string | undefined>(initial?.id);

  // Tags
  const [tags, setTags] = useState<string[]>(initial?.tags || []);
  const [tagInputValue, setTagInputValue] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Quick Collection
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'BM:generateAISummary' });
      if (response && response.success && response.aiResult) {
        if (response.aiResult.title) {
          setTitle(response.aiResult.title);
        }
        if (response.aiResult.tags && response.aiResult.tags.length > 0) {
          setTags(prev => Array.from(new Set([...prev, ...response.aiResult.tags])));
        }
      } else {
        console.error('Failed to generate AI data:', response?.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    if (!initial?.url && !initial?.title) {
      chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const tab = tabs[0];
        if (tab?.url && !tab.url.startsWith('chrome://')) {
          const existing = existingBookmarks.find(b => b.url === tab.url);
          
          if (existing) {
            setUrl(existing.url);
            setTitle(existing.title);
            setNote(existing.note || '');
            setCollectionId(existing.collectionId);
            setTags(existing.tags);
            setEditingId(existing.id);
          } else {
            setUrl(tab.url);
            setTitle(tab.title || '');
          }
        }
      });
    }
  }, [initial, existingBookmarks]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsSaving(true);
    
    // Check if the user manually typed an existing URL
    let finalEditingId = editingId;
    if (!finalEditingId) {
       const manuallyTypedExisting = existingBookmarks.find(b => b.url === url);
       if (manuallyTypedExisting) {
         finalEditingId = manuallyTypedExisting.id;
       }
    }
    
    try {
      await onSave({
        ...(finalEditingId ? { id: finalEditingId } : {}),
        url,
        title,
        note,
        favicon: '',
        collectionId,
        tags,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = (t: string) => {
    const trimmed = t.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInputValue('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tToRemove: string) => {
    setTags(tags.filter((t) => t !== tToRemove));
  };

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) {
      setIsCreatingCollection(false);
      return;
    }
    await onQuickAddCollection(name);
    setIsCreatingCollection(false);
    setNewCollectionName('');
  };

  const filteredTags = allTags
    .filter((t) => !tags.includes(t))
    .filter((t) => t.includes(tagInputValue.toLowerCase().trim()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm bg-white border border-zinc-200 shadow-xl rounded-xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
          <h2 className="text-[14px] font-semibold text-zinc-900">
            {editingId ? 'Edit Bookmark' : 'Add Bookmark'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-5 flex-1 pl-5 pr-5">
          <form id="add-bookmark-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-zinc-600 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400" /> URL
              </label>
              <input
                autoFocus
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-shadow"
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-zinc-600 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-zinc-400" /> Title
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  className="text-[11px] text-amber-600 hover:text-amber-500 flex items-center gap-1 font-medium disabled:opacity-50 transition-colors"
                  title="Generate Title and Tags using AI"
                >
                  <Sparkles className="w-3 h-3" /> {isGeneratingAI ? 'Generating...' : 'Auto Gen'}
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-shadow"
                placeholder="Bookmark title"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-zinc-600 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-zinc-400" /> Note <span className="text-zinc-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full min-h-[60px] p-3 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-shadow resize-y custom-scrollbar"
                placeholder="Add personal notes or context..."
              />
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-zinc-600 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-zinc-400" /> Collection
                </label>
                {!isCreatingCollection && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingCollection(true)}
                    className="text-[11px] text-blue-600 hover:text-blue-500 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                )}
              </div>
              
              {isCreatingCollection ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCollection();
                      }
                      if (e.key === 'Escape') {
                        setIsCreatingCollection(false);
                      }
                    }}
                    placeholder="Collection name..."
                    className="flex-1 h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCollection}
                    className="h-9 px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 rounded-md transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCollection(false)}
                    className="h-9 px-3 hover:bg-zinc-100 border border-transparent text-zinc-500 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="w-full h-9 px-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-shadow"
                >
                  <option value={COLLECTION.UNSORTED}>Unsorted</option>
                  {flattenCollectionTree(buildCollectionTree(collections)).map((c) => (
                    <option key={c.id} value={c.id}>
                      {'\u00A0'.repeat(c.depth * 4)}{c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[12px] font-medium text-zinc-600 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-zinc-400" /> Tags
              </label>
              
              <div
                className="min-h-[36px] p-1.5 bg-zinc-50 border border-zinc-200 rounded-md flex flex-wrap gap-1.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-shadow cursor-text"
                onClick={() => tagInputRef.current?.focus()}
              >
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-zinc-200 text-zinc-700 text-[12px] rounded font-medium shadow-sm"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTag(t);
                      }}
                      className="text-zinc-400 hover:text-zinc-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagInputValue}
                  onChange={(e) => {
                    setTagInputValue(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowTagSuggestions(false), 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      if (tagInputValue) {
                        handleAddTag(tagInputValue);
                      }
                    } else if (e.key === 'Backspace' && !tagInputValue && tags.length > 0) {
                      setTags(tags.slice(0, -1));
                    }
                  }}
                  className="flex-1 min-w-[60px] bg-transparent text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none h-6 px-1"
                  placeholder={tags.length === 0 ? "Add tags..." : ""}
                />
              </div>

              {/* Tag Suggestions Dropdown */}
              {showTagSuggestions && (tagInputValue || filteredTags.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-zinc-200 rounded-md shadow-lg z-10 custom-scrollbar">
                  {tagInputValue && !allTags.includes(tagInputValue.toLowerCase().trim()) && !tags.includes(tagInputValue.toLowerCase().trim()) && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddTag(tagInputValue);
                      }}
                      className="w-full text-left px-3 py-2 text-[12px] text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Create "{tagInputValue.trim()}"
                    </button>
                  )}
                  {filteredTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddTag(t);
                      }}
                      className="w-full text-left px-3 py-2 text-[12px] text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      # {t}
                    </button>
                  ))}
                  {filteredTags.length === 0 && !tagInputValue && (
                    <div className="px-3 py-2 text-[12px] text-zinc-400 italic">No existing tags</div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-zinc-100 flex justify-end gap-2 shrink-0 bg-zinc-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-8 rounded-md text-[13px] font-medium text-zinc-600 bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-bookmark-form"
            disabled={isSaving || !url}
            className="px-4 h-8 rounded-md text-[13px] font-medium bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
