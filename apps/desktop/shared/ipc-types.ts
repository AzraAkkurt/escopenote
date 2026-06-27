import type { AppPlatform } from './platform';
import type { LibraryFileEntry, LibraryProgressEvent } from './library-types';
import type { Course, CourseWithResources } from './course-types';
import type { Resource, ResourceProgressEvent } from './resource-types';
import type { Note, NoteCreateInput, NoteUpdateInput } from './note-types';
import type { ResolvedLinkTarget } from './link-types';
import type {
  ChatSendRequest,
  ChatStreamEvent,
  GatewayHealthResult,
  UsageQuotaInfo,
} from './gateway-types';
import type {
  ChatOutboundPayload,
  RagChunkPreview,
  RagSearchResult,
} from './rag-types';
import type { LocaleCode, ThemePreference } from './preferences';
import type { AppSettings, WindowBounds } from './settings';
import type { StorageNamespace } from './storage-namespaces';

export const IPC_CHANNELS = {
  HEALTH_PING: 'health:ping',
  APP_GET_PLATFORM: 'app:get-platform',
  APP_GET_PATHS: 'app:get-paths',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  STORAGE_READ: 'storage:read',
  STORAGE_WRITE: 'storage:write',
  DIALOG_OPEN_FILES: 'dialog:open-files',
  DIALOG_SAVE_FILE: 'dialog:save-file',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE_TOGGLE: 'window:maximize-toggle',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',
  WINDOW_SAVE_BOUNDS: 'window:save-bounds',
  LIBRARY_LIST: 'library:list',
  LIBRARY_ADD_FILES: 'library:add-files',
  LIBRARY_REMOVE: 'library:remove',
  LIBRARY_REINDEX: 'library:reindex',
  LIBRARY_PROGRESS: 'library:progress',
  COURSES_LIST: 'courses:list',
  COURSES_GET: 'courses:get',
  COURSES_CREATE: 'courses:create',
  COURSES_UPDATE: 'courses:update',
  COURSES_DELETE: 'courses:delete',
  RESOURCES_LIST: 'resources:list',
  RESOURCES_ADD_FILES: 'resources:add-files',
  RESOURCES_ADD_LINK: 'resources:add-link',
  RESOURCES_REMOVE: 'resources:remove',
  RESOURCES_REINDEX: 'resources:reindex',
  RESOURCES_PROGRESS: 'resources:progress',
  NOTES_LIST: 'notes:list',
  NOTES_GET: 'notes:get',
  NOTES_CREATE: 'notes:create',
  NOTES_UPDATE: 'notes:update',
  NOTES_DELETE: 'notes:delete',
  NOTES_EXPORT_MD: 'notes:export-md',
  NOTES_RESOLVE_LINK: 'notes:resolve-link',
  NOTES_RESOLVE_TARGET: 'notes:resolve-target',
  NOTES_BACKLINKS: 'notes:backlinks',
  SHELL_OPEN_RESOURCE: 'shell:open-resource',
  NOTES_CREATE_FROM_CHAT: 'notes:create-from-chat',
  RAG_SEARCH: 'rag:search',
  RAG_GET_CHUNK: 'rag:get-chunk',
  CHAT_RECORD_OUTBOUND: 'chat:record-outbound',
  CHAT_GET_LAST_OUTBOUND: 'chat:get-last-outbound',
  GATEWAY_TEST: 'gateway:test',
  CHAT_SEND: 'chat:send',
  CHAT_STREAM: 'chat:stream',
  USAGE_GET_QUOTA: 'usage:get-quota',
  LIBRARY_SAVE_WEB_SUMMARY: 'library:save-web-summary',
  APP_GET_VERSION: 'app:get-version',
  DATA_EXPORT: 'data:export',
  DATA_IMPORT: 'data:import',
} as const;

export interface AppVersionInfo {
  name: string;
  version: string;
  electron: string;
}

export interface HealthPingResult {
  ok: true;
  timestamp: number;
  electronVersion: string;
  platform: AppPlatform | 'other';
}

export interface AppPaths {
  userData: string;
  documents: string;
  home: string;
}

export interface OpenFileDialogOptions {
  title?: string;
  multiple?: boolean;
  filters?: { name: string; extensions: string[] }[];
}

export interface OpenFileDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export interface SaveFileDialogResult {
  canceled: boolean;
  filePath: string | null;
}

export interface EscopenoteApi {
  ping: () => Promise<HealthPingResult>;
  getPlatform: () => Promise<AppPlatform | 'other'>;
  getPaths: () => Promise<AppPaths>;
  getVersion: () => Promise<AppVersionInfo>;
  data: {
    exportBackup: () => Promise<{ canceled: boolean; path: string | null }>;
    importBackup: () => Promise<{ canceled: boolean }>;
  };
  settings: {
    get: () => Promise<AppSettings>;
    set: (patch: Partial<AppSettings>) => Promise<AppSettings>;
  };
  storage: {
    read: <T = unknown>(namespace: StorageNamespace) => Promise<T | null>;
    write: <T = unknown>(namespace: StorageNamespace, data: T) => Promise<void>;
  };
  dialog: {
    openFiles: (options?: OpenFileDialogOptions) => Promise<OpenFileDialogResult>;
    saveFile: (options?: { title?: string; defaultPath?: string }) => Promise<SaveFileDialogResult>;
  };
  window: {
    minimize: () => void;
    maximizeToggle: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    saveBounds: (bounds: WindowBounds) => Promise<void>;
  };
  courses: {
    list: () => Promise<Course[]>;
    get: (id: string) => Promise<CourseWithResources>;
    create: (input: { name: string; icon?: string }) => Promise<Course>;
    update: (id: string, patch: { name?: string; icon?: string }) => Promise<Course>;
    delete: (id: string) => Promise<void>;
  };
  resources: {
    list: (courseId?: string) => Promise<Resource[]>;
    addFiles: (courseId: string, paths: string[]) => Promise<Resource[]>;
    addLink: (courseId: string, url: string) => Promise<Resource>;
    remove: (id: string) => Promise<void>;
    reindex: (id: string) => Promise<Resource>;
    onProgress: (callback: (event: ResourceProgressEvent) => void) => () => void;
  };
  notes: {
    list: (filter?: { courseId?: string | null }) => Promise<Note[]>;
    get: (id: string) => Promise<Note>;
    create: (input: NoteCreateInput) => Promise<Note>;
    update: (input: NoteUpdateInput) => Promise<Note>;
    delete: (id: string) => Promise<void>;
    exportMd: (id: string) => Promise<string>;
    resolveLink: (query: string) => Promise<string | null>;
    resolveTarget: (query: string) => Promise<ResolvedLinkTarget | null>;
    backlinks: (noteId: string) => Promise<Note[]>;
    createFromChat: (title: string, markdown: string, courseId?: string | null) => Promise<Note>;
  };
  library: {
    list: () => Promise<LibraryFileEntry[]>;
    addFiles: (paths: string[]) => Promise<LibraryFileEntry[]>;
    remove: (id: string) => Promise<void>;
    reindex: (id: string) => Promise<LibraryFileEntry>;
    saveWebSummary: (title: string, summary: string, courseId?: string | null) => Promise<Resource>;
    onProgress: (callback: (event: LibraryProgressEvent) => void) => () => void;
  };
  rag: {
    search: (query: string, topK?: number, courseId?: string | null) => Promise<RagSearchResult>;
    getChunk: (chunkId: string) => Promise<RagChunkPreview | null>;
  };
  gateway: {
    testConnection: () => Promise<GatewayHealthResult>;
  };
  usage: {
    getQuota: () => Promise<UsageQuotaInfo>;
  };
  shell: {
    openResource: (resourceId: string) => Promise<void>;
  };
  chat: {
    send: (request: ChatSendRequest) => Promise<void>;
    onStream: (callback: (event: ChatStreamEvent) => void) => () => void;
    recordOutbound: (message: string, chunks: RagSearchResult['chunks']) => Promise<ChatOutboundPayload>;
    getLastOutbound: () => Promise<ChatOutboundPayload | null>;
  };
}

export type { AppSettings, LocaleCode, ThemePreference, StorageNamespace, WindowBounds, Resource };
