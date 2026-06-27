import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocalStore } from '@renderer/hooks/useLocalStore';
import type { NotesTabsStore } from '@shared/note-types';

const EMPTY_TABS: NotesTabsStore = { openNoteIds: [], activeNoteId: null };

interface NoteTabsContextValue {
  openNoteIds: string[];
  activeNoteId: string | null;
  openTab: (noteId: string) => void;
  closeTab: (noteId: string) => void;
  setActiveTab: (noteId: string | null) => void;
  pruneTabs: (validNoteIds: Set<string>) => void;
}

const NoteTabsContext = createContext<NoteTabsContextValue | null>(null);

export function NoteTabsProvider({ children }: { children: ReactNode }) {
  const tabsStore = useLocalStore<NotesTabsStore>('notes.tabs');
  const skipSyncRef = useRef(false);
  const [tabs, setTabs] = useState<NotesTabsStore>(EMPTY_TABS);

  useEffect(() => {
    if (tabsStore.loading) {
      return;
    }
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const incoming = tabsStore.data ?? EMPTY_TABS;
    setTabs((prev) => {
      if (
        prev.openNoteIds.length === incoming.openNoteIds.length &&
        prev.openNoteIds.every((id, i) => id === incoming.openNoteIds[i]) &&
        prev.activeNoteId === incoming.activeNoteId
      ) {
        return prev;
      }
      return incoming;
    });
  }, [tabsStore.loading, tabsStore.data]);

  const persist = useCallback(
    (updater: (prev: NotesTabsStore) => NotesTabsStore) => {
      setTabs((prev) => {
        const next = updater(prev);
        if (
          prev.openNoteIds.length === next.openNoteIds.length &&
          prev.openNoteIds.every((id, i) => id === next.openNoteIds[i]) &&
          prev.activeNoteId === next.activeNoteId
        ) {
          return prev;
        }
        skipSyncRef.current = true;
        void tabsStore.save(next);
        return next;
      });
    },
    [tabsStore],
  );

  const openTab = useCallback(
    (noteId: string) => {
      persist((prev) => {
        const alreadyOpen = prev.openNoteIds.includes(noteId);
        if (alreadyOpen && prev.activeNoteId === noteId) {
          return prev;
        }
        return {
          openNoteIds: alreadyOpen ? prev.openNoteIds : [...prev.openNoteIds, noteId],
          activeNoteId: noteId,
        };
      });
    },
    [persist],
  );

  const closeTab = useCallback(
    (noteId: string): void => {
      persist((prev) => {
        const ids = prev.openNoteIds.filter((id) => id !== noteId);
        const nextActive =
          prev.activeNoteId === noteId ? (ids[ids.length - 1] ?? null) : prev.activeNoteId;
        return { openNoteIds: ids, activeNoteId: nextActive };
      });
    },
    [persist],
  );

  const setActiveTab = useCallback(
    (noteId: string | null) => {
      persist((prev) => {
        if (prev.activeNoteId === noteId) {
          return prev;
        }
        return { openNoteIds: prev.openNoteIds, activeNoteId: noteId };
      });
    },
    [persist],
  );

  const pruneTabs = useCallback(
    (validNoteIds: Set<string>) => {
      persist((prev) => {
        const ids = prev.openNoteIds.filter((id) => validNoteIds.has(id));
        const nextActive =
          prev.activeNoteId && ids.includes(prev.activeNoteId)
            ? prev.activeNoteId
            : (ids[ids.length - 1] ?? null);
        if (
          ids.length === prev.openNoteIds.length &&
          nextActive === prev.activeNoteId
        ) {
          return prev;
        }
        return { openNoteIds: ids, activeNoteId: nextActive };
      });
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      openNoteIds: tabs.openNoteIds,
      activeNoteId: tabs.activeNoteId,
      openTab,
      closeTab,
      setActiveTab,
      pruneTabs,
    }),
    [tabs.openNoteIds, tabs.activeNoteId, openTab, closeTab, setActiveTab, pruneTabs],
  );

  return <NoteTabsContext.Provider value={value}>{children}</NoteTabsContext.Provider>;
}

export function useNoteTabs(): NoteTabsContextValue {
  const ctx = useContext(NoteTabsContext);
  if (!ctx) {
    throw new Error('useNoteTabs must be used within NoteTabsProvider');
  }
  return ctx;
}
