import type { AppState, AppSettings, Bookmark, Collection } from './types';
import { COLLECTION } from './types';

const KEYS = {
  bookmarks: 'bm_bookmarks',
  collections: 'bm_collections',
} as const;

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export async function getBookmarks(): Promise<Bookmark[]> {
  const data = await chrome.storage.local.get(KEYS.bookmarks);
  return (data[KEYS.bookmarks] as Bookmark[] | undefined) ?? [];
}

export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await chrome.storage.local.set({ [KEYS.bookmarks]: bookmarks });
}

export async function addBookmark(bookmark: Bookmark): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  const next = [bookmark, ...bookmarks];
  await saveBookmarks(next);
  return next;
}

export async function updateBookmark(updated: Bookmark): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  const next = bookmarks.map((b) => (b.id === updated.id ? updated : b));
  await saveBookmarks(next);
  return next;
}

export async function deleteBookmark(id: string): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  const next = bookmarks.filter((b) => b.id !== id);
  await saveBookmarks(next);
  return next;
}

export async function moveToTrash(id: string): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  const next = bookmarks.map((b) =>
    b.id === id ? { ...b, collectionId: COLLECTION.TRASH, updatedAt: Date.now() } : b
  );
  await saveBookmarks(next);
  return next;
}

export async function restoreFromTrash(id: string): Promise<Bookmark[]> {
  const bookmarks = await getBookmarks();
  const next = bookmarks.map((b) =>
    b.id === id ? { ...b, collectionId: COLLECTION.UNSORTED, updatedAt: Date.now() } : b
  );
  await saveBookmarks(next);
  return next;
}

export function searchBookmarks(bookmarks: Bookmark[], query: string): Bookmark[] {
  if (!query.trim()) return bookmarks;
  const q = query.toLowerCase();
  return bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q))
  );
}

// ─── Collections ──────────────────────────────────────────────────────────────

export async function getInitialState(): Promise<AppState> {
  const result = await chrome.storage.local.get([KEYS.bookmarks, KEYS.collections, 'settings']);
  return {
    bookmarks: (result[KEYS.bookmarks] as Bookmark[] | undefined) || [],
    collections: (result[KEYS.collections] as Collection[] | undefined) || [],
    settings: (result.settings as AppSettings | undefined) || { enableAi: false },
  };
}

export async function getCollections(): Promise<Collection[]> {
  const data = await chrome.storage.local.get(KEYS.collections);
  return (data[KEYS.collections] as Collection[] | undefined) ?? [];
}

export async function saveCollections(collections: Collection[]): Promise<void> {
  await chrome.storage.local.set({ [KEYS.collections]: collections });
}

export async function addCollection(collection: Collection): Promise<Collection[]> {
  const collections = await getCollections();
  const next = [...collections, collection];
  await saveCollections(next);
  return next;
}

export async function updateCollection(updated: Collection): Promise<Collection[]> {
  const collections = await getCollections();
  const next = collections.map((c) => (c.id === updated.id ? updated : c));
  await saveCollections(next);
  return next;
}

export async function deleteCollection(id: string): Promise<[Collection[], Bookmark[]]> {
  const [collections, bookmarks] = await Promise.all([getCollections(), getBookmarks()]);
  
  // Find all descendants to delete
  const descendants = new Set<string>();
  descendants.add(id);
  
  let added = true;
  while (added) {
    added = false;
    for (const c of collections) {
      if (c.parentId && descendants.has(c.parentId) && !descendants.has(c.id)) {
        descendants.add(c.id);
        added = true;
      }
    }
  }
  const nextCollections = collections.filter((c) => !descendants.has(c.id));
  const nextBookmarks = bookmarks.map((b) =>
    descendants.has(b.collectionId) ? { ...b, collectionId: COLLECTION.UNSORTED, updatedAt: Date.now() } : b
  );
  
  await Promise.all([saveCollections(nextCollections), saveBookmarks(nextBookmarks)]);
  return [nextCollections, nextBookmarks];
}

export async function updateSettings(settingsPatch: Partial<import('./types').AppSettings>): Promise<import('./types').AppSettings> {
  const state = await getInitialState();
  const nextSettings = { ...(state.settings || { enableAi: false }), ...settingsPatch };
  await chrome.storage.local.set({ settings: nextSettings });
  return nextSettings;
}
