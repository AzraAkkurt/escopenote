import type { NavigateFunction } from 'react-router-dom';
import type { WikilinkClickPayload } from '@renderer/notes/extensions/wikilink-extension';
import { ipcCall } from '@renderer/lib/ipc';

export function createWikilinkClickHandler(
  navigate: NavigateFunction,
  openNoteTab: (noteId: string) => void,
): (payload: WikilinkClickPayload) => void {
  return (payload) => {
    void (async () => {
      if (payload.targetKind === 'note') {
        openNoteTab(payload.targetId);
        navigate(`/notes/${payload.targetId}`);
        return;
      }

      if (payload.targetKind === 'resource') {
        await ipcCall((api) => api.shell.openResource(payload.targetId));
      }
    })();
  };
}
