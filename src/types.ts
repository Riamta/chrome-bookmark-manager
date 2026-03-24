// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon: string;
  tags: string[];
  collectionId: string; // 'all' | 'unsorted' | 'trash' | custom UUID
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  coverUrl?: string;
  note?: string;
}

export type CollectionId = string;

export interface Collection {
  id: string;
  name: string;
  icon: CollectionIcon;
  color: CollectionColor;
  createdAt: number;
  parentId?: string;
}

export type CollectionIcon =
  | 'folder'
  | 'star'
  | 'heart'
  | 'briefcase'
  | 'book'
  | 'code'
  | 'music'
  | 'film'
  | 'shopping-cart'
  | 'globe';

export type CollectionColor =
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'rose'
  | 'orange'
  | 'amber'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'pink';

// ─── Message Types ────────────────────────────────────────────────────────────

export type Message =
  | { type: 'BM:getState' }
  | { type: 'BM:addBookmark'; payload: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'BM:updateBookmark'; payload: Partial<Bookmark> & { id: string } }
  | { type: 'BM:deleteBookmark'; id: string }
  | { type: 'BM:moveToTrash'; id: string }
  | { type: 'BM:restoreFromTrash'; id: string }
  | { type: 'BM:addCollection'; payload: Omit<Collection, 'id' | 'createdAt'> }
  | { type: 'BM:updateCollection'; payload: Partial<Collection> & { id: string } }
  | { type: 'BM:deleteCollection'; id: string }
  | { type: 'BM:importBrowser' }
  | { type: 'BM:getCurrentTab' }
  | { type: 'BM:refreshPreviews' }
  | { type: 'BM:updateSettings'; payload: Partial<AppSettings> };

export interface AppSettings {
  enableAi: boolean;
}

export interface AppState {
  bookmarks: Bookmark[];
  collections: Collection[];
  settings?: AppSettings;
}

// ─── Smart Collection IDs ─────────────────────────────────────────────────────

export const COLLECTION = {
  ALL: '__all__',
  UNSORTED: '__unsorted__',
  TRASH: '__trash__',
} as const;
