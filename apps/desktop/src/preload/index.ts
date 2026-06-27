import { contextBridge, ipcRenderer } from 'electron';
import type { EscopenoteApi } from '../../shared/ipc-types';
import type { ChatStreamEvent } from '../../shared/gateway-types';
import type { LibraryProgressEvent } from '../../shared/library-types';
import type { ResourceProgressEvent } from '../../shared/resource-types';
import { IPC_CHANNELS } from '../../shared/ipc-types';
import { unwrapInvokeError } from '../../shared/ipc-errors';

async function invoke<T>(channel: string, arg?: unknown): Promise<T> {
  try {
    return (await ipcRenderer.invoke(channel, arg)) as T;
  } catch (error) {
    throw unwrapInvokeError(error);
  }
}

const api: EscopenoteApi = {
  ping: () => invoke(IPC_CHANNELS.HEALTH_PING),
  getPlatform: () => invoke(IPC_CHANNELS.APP_GET_PLATFORM),
  getPaths: () => invoke(IPC_CHANNELS.APP_GET_PATHS),
  getVersion: () => invoke(IPC_CHANNELS.APP_GET_VERSION),
  data: {
    exportBackup: () => invoke(IPC_CHANNELS.DATA_EXPORT),
    importBackup: () => invoke(IPC_CHANNELS.DATA_IMPORT),
  },
  settings: {
    get: () => invoke(IPC_CHANNELS.SETTINGS_GET),
    set: (patch) => invoke(IPC_CHANNELS.SETTINGS_SET, patch),
  },
  storage: {
    read: (namespace) => invoke(IPC_CHANNELS.STORAGE_READ, { namespace }),
    write: (namespace, data) => invoke(IPC_CHANNELS.STORAGE_WRITE, { namespace, data }),
  },
  dialog: {
    openFiles: (options) => invoke(IPC_CHANNELS.DIALOG_OPEN_FILES, options),
    saveFile: (options) => invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, options),
  },
  courses: {
    list: () => invoke(IPC_CHANNELS.COURSES_LIST),
    get: (id) => invoke(IPC_CHANNELS.COURSES_GET, { id }),
    create: (input) => invoke(IPC_CHANNELS.COURSES_CREATE, input),
    update: (id, patch) => invoke(IPC_CHANNELS.COURSES_UPDATE, { id, ...patch }),
    delete: (id) => invoke(IPC_CHANNELS.COURSES_DELETE, { id }),
  },
  resources: {
    list: (courseId) => invoke(IPC_CHANNELS.RESOURCES_LIST, courseId),
    addFiles: (courseId, paths) =>
      invoke(IPC_CHANNELS.RESOURCES_ADD_FILES, { courseId, paths }),
    addLink: (courseId, url) => invoke(IPC_CHANNELS.RESOURCES_ADD_LINK, { courseId, url }),
    remove: (id) => invoke(IPC_CHANNELS.RESOURCES_REMOVE, { id }),
    reindex: (id) => invoke(IPC_CHANNELS.RESOURCES_REINDEX, { id }),
    onProgress: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: ResourceProgressEvent) => {
        callback(payload);
      };
      ipcRenderer.on(IPC_CHANNELS.RESOURCES_PROGRESS, listener);
      ipcRenderer.on(IPC_CHANNELS.LIBRARY_PROGRESS, listener);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.RESOURCES_PROGRESS, listener);
        ipcRenderer.removeListener(IPC_CHANNELS.LIBRARY_PROGRESS, listener);
      };
    },
  },
  notes: {
    list: (filter) => invoke(IPC_CHANNELS.NOTES_LIST, filter),
    get: (id) => invoke(IPC_CHANNELS.NOTES_GET, { id }),
    create: (input) => invoke(IPC_CHANNELS.NOTES_CREATE, input),
    update: (input) => invoke(IPC_CHANNELS.NOTES_UPDATE, input),
    delete: (id) => invoke(IPC_CHANNELS.NOTES_DELETE, { id }),
    exportMd: (id) => invoke(IPC_CHANNELS.NOTES_EXPORT_MD, { id }),
    resolveLink: (query) => invoke(IPC_CHANNELS.NOTES_RESOLVE_LINK, { query }),
    resolveTarget: (query) => invoke(IPC_CHANNELS.NOTES_RESOLVE_TARGET, { query }),
    backlinks: (noteId) => invoke(IPC_CHANNELS.NOTES_BACKLINKS, { id: noteId }),
    createFromChat: (title, markdown, courseId) =>
      invoke(IPC_CHANNELS.NOTES_CREATE_FROM_CHAT, { title, markdown, courseId }),
  },
  rag: {
    search: (query, topK, courseId) =>
      invoke(IPC_CHANNELS.RAG_SEARCH, { query, topK, courseId }),
    getChunk: (chunkId) => invoke(IPC_CHANNELS.RAG_GET_CHUNK, { chunkId }),
  },
  gateway: {
    testConnection: () => invoke(IPC_CHANNELS.GATEWAY_TEST),
  },
  usage: {
    getQuota: () => invoke(IPC_CHANNELS.USAGE_GET_QUOTA),
  },
  shell: {
    openResource: (resourceId) => invoke(IPC_CHANNELS.SHELL_OPEN_RESOURCE, { resourceId }),
  },
  chat: {
    send: (request) => invoke(IPC_CHANNELS.CHAT_SEND, request),
    onStream: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: ChatStreamEvent) => {
        callback(payload);
      };
      ipcRenderer.on(IPC_CHANNELS.CHAT_STREAM, listener);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.CHAT_STREAM, listener);
      };
    },
    recordOutbound: (message, chunks) =>
      invoke(IPC_CHANNELS.CHAT_RECORD_OUTBOUND, { message, chunks }),
    getLastOutbound: () => invoke(IPC_CHANNELS.CHAT_GET_LAST_OUTBOUND),
  },
  library: {
    list: () => invoke(IPC_CHANNELS.LIBRARY_LIST),
    addFiles: (paths) => invoke(IPC_CHANNELS.LIBRARY_ADD_FILES, { paths }),
    remove: (id) => invoke(IPC_CHANNELS.LIBRARY_REMOVE, { id }),
    reindex: (id) => invoke(IPC_CHANNELS.LIBRARY_REINDEX, { id }),
    saveWebSummary: (title, summary, courseId) =>
      invoke(IPC_CHANNELS.LIBRARY_SAVE_WEB_SUMMARY, { title, summary, courseId }),
    onProgress: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: LibraryProgressEvent) => {
        callback(payload);
      };
      ipcRenderer.on(IPC_CHANNELS.LIBRARY_PROGRESS, listener);
      ipcRenderer.on(IPC_CHANNELS.RESOURCES_PROGRESS, listener);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.LIBRARY_PROGRESS, listener);
        ipcRenderer.removeListener(IPC_CHANNELS.RESOURCES_PROGRESS, listener);
      };
    },
  },
  window: {
    minimize: () => {
      ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE);
    },
    maximizeToggle: () => {
      ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE_TOGGLE);
    },
    close: () => {
      ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE);
    },
    isMaximized: () => invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
    saveBounds: (bounds) => invoke(IPC_CHANNELS.WINDOW_SAVE_BOUNDS, bounds),
  },
};

contextBridge.exposeInMainWorld('escopenote', api);
