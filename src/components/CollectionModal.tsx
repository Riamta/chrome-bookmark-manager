import { useState } from 'react';
import { X, Folder, Image as ImageIcon, Palette, Trash2 } from 'lucide-react';
import type { Collection, CollectionColor, CollectionIcon } from '../types';
import { Globe, ShoppingCart, Film, Music, Code, Briefcase, Heart, Star, Book } from 'lucide-react';

import { buildCollectionTree, flattenCollectionTree, getCollectionDescendants } from '../utils';

interface CollectionModalProps {
  existing?: Collection;
  collections: Collection[];
  onSave: (data: { name: string; icon: CollectionIcon; color: CollectionColor; parentId?: string }) => Promise<void>;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const ICONS: { id: CollectionIcon; label: string; icon: React.ElementType }[] = [
  { id: 'folder', label: 'Folder', icon: Folder },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'heart', label: 'Heart', icon: Heart },
  { id: 'briefcase', label: 'Briefcase', icon: Briefcase },
  { id: 'book', label: 'Book', icon: Book },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'film', label: 'Film', icon: Film },
  { id: 'shopping-cart', label: 'Cart', icon: ShoppingCart },
  { id: 'globe', label: 'Globe', icon: Globe },
];

const COLORS: { id: CollectionColor; class: string }[] = [
  { id: 'blue', class: 'bg-blue-500' },
  { id: 'indigo', class: 'bg-indigo-500' },
  { id: 'violet', class: 'bg-violet-500' },
  { id: 'rose', class: 'bg-rose-500' },
  { id: 'orange', class: 'bg-orange-500' },
  { id: 'amber', class: 'bg-amber-500' },
  { id: 'emerald', class: 'bg-emerald-500' },
  { id: 'teal', class: 'bg-teal-500' },
  { id: 'cyan', class: 'bg-cyan-500' },
  { id: 'pink', class: 'bg-pink-500' },
];

export function CollectionModal({ existing, collections, onSave, onDelete, onClose }: CollectionModalProps) {
  const [name, setName] = useState(existing?.name || '');
  const [icon, setIcon] = useState<CollectionIcon>(existing?.icon || 'folder');
  const [color, setColor] = useState<CollectionColor>(existing?.color || 'blue');
  const [parentId, setParentId] = useState<string>(existing?.parentId || '');
  const [isSaving, setIsSaving] = useState(false);

  const descendants = existing ? getCollectionDescendants(collections, existing.id) : new Set<string>();
  const validParents = flattenCollectionTree(buildCollectionTree(collections)).filter(
    (c) => c.id !== existing?.id && !descendants.has(c.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), icon, color, parentId: parentId || undefined });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm bg-white border border-zinc-200 shadow-xl rounded-xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
          <h2 className="text-[14px] font-semibold text-zinc-900">
            {existing ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-5 flex-1">
          <form id="collection-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-zinc-600 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-zinc-400" /> Name
              </label>
              <input
                autoFocus
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-shadow"
                placeholder="Design, Tech, Reading..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-zinc-600 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-zinc-400" /> Parent Collection
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full h-9 px-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-shadow"
              >
                <option value="">None (Top Level)</option>
                {validParents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'\u00A0'.repeat(c.depth * 4)}{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-zinc-600 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-zinc-400" /> Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ICONS.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setIcon(i.id)}
                    className={`flex items-center justify-center h-9 rounded-md border transition-all ${
                      icon === i.id
                        ? 'bg-zinc-100 border-zinc-300 text-zinc-900 shadow-sm'
                        : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600'
                    }`}
                    title={i.label}
                  >
                    <i.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-zinc-600 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-400" /> Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-7 h-7 rounded-full transition-transform outline-none ring-2 ring-offset-2 ring-offset-white ${
                      color === c.id ? `ring-zinc-900 scale-110` : 'ring-transparent hover:scale-110'
                    } ${c.class}`}
                    title={c.id}
                  />
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-zinc-100 flex items-center shrink-0 bg-zinc-50/50">
          {existing && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(existing.id)}
              className="mr-auto px-3 h-8 rounded-md text-[13px] font-medium text-rose-600 bg-rose-50 border border-rose-200 shadow-sm hover:bg-rose-100 hover:border-rose-300 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-8 rounded-md text-[13px] font-medium text-zinc-600 bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="collection-form"
              disabled={isSaving || !name.trim()}
              className="px-4 h-8 rounded-md text-[13px] font-medium bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
