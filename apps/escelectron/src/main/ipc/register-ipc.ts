import { app, BrowserWindow, dialog, ipcMain, screen } from 'electron';
import { IPC_CHANNELS } from '../../../shared/ipc-types';
import type { HealthPingResult } from '../../../shared/ipc-types';
import { IpcError, rejectIpc, type IpcErrorPayload } from '../../../shared/ipc-errors';
import {
  appSettingsPatchSchema,
  chatRecordOutboundSchema,
  chatSaveWebSchema,
  chatSendSchema,
  courseCreateSchema,
  courseIdSchema,
  courseUpdateSchema,
  libraryAddFilesSchema,
  libraryIdSchema,
  noteCreateFromChatSchema,
  noteCreateSchema,
  noteIdSchema,
  noteResolveLinkSchema,
  noteUpdateSchema,
  shellOpenResourceSchema,
  notesListSchema,
  openFileOptionsSchema,
  ragChunkIdSchema,
  ragSearchSchema,
  resourceIdSchema,
  resourcesAddFilesSchema,
  resourcesAddLinkSchema,
  saveFileDialogSchema,
  storageReadSchema,
  storageWriteSchema,
  windowBoundsSchema,
} from '../../../shared/schemas';
import { testGatewayConnection } from '../api/gateway-client';
import { brainGetUsage } from '../usage/brain-usage-client.js';
import { getClientId } from '../usage/client-id-store.js';
import { initChatService, runChatSend } from '../chat/chat-service';
import { getLastChatOutbound, recordChatOutbound } from '../chat/outbound-log';
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from '../courses/course-service';
import { runV2CoursesMigration } from '../migrations/v2-courses';
import {
  createNote,
  createNoteFromChatContent,
  deleteNote,
  exportNoteMarkdown,
  getBacklinks,
  getNote,
  listNotes,
  resolveNoteLink,
  resolveNoteLinkTarget,
  updateNote,
} from '../notes/note-service';
import { openResourceById } from '../shell/open-resource';
import {
  addFilesToCourse,
  addLibraryFiles,
  addLinkToCourse,
  ensureLibrarySeed,
  initResourceService,
  listAllResources,
  listLibraryFiles,
  listResourcesByCourse,
  reindexLibraryFile,
  reindexResource,
  removeLibraryFile,
  removeResource,
  saveWebSummaryToResources,
} from '../resources/resource-service';
import { getChunkById } from '../rag/vector-store';
import { searchRag } from '../rag/search';
import { getAppPlatform } from '../platform';
import {
  defaultBackupPath,
  exportToFile,
  importFromFile,
} from '../storage/data-backup';
import { readNamespace, readSettingsFile, writeNamespace, writeSettingsFile } from '../storage/file-store';
import { logIpc } from './logger';
import { parseOrThrow } from './validate';

function toIpcPayload(error: unknown): IpcErrorPayload {
  if (error instanceof IpcError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    return { code: 'INTERNAL_ERROR', message: error.message };
  }
  return { code: 'INTERNAL_ERROR', message: 'Unexpected main process error' };
}

function handle<T>(channel: string, handler: () => Promise<T> | T): void {
  ipcMain.handle(channel, async () => {
    logIpc(channel, 'in');
    try {
      const result = await handler();
      logIpc(channel, 'out', result);
      return result;
    } catch (error) {
      const payload = toIpcPayload(error);
      logIpc(channel, 'out', payload);
      throw rejectIpc(payload);
    }
  });
}

function handleWithArg<A, T>(channel: string, handler: (arg: A) => Promise<T> | T): void {
  ipcMain.handle(channel, async (_event, arg: unknown) => {
    logIpc(channel, 'in', arg);
    try {
      const result = await handler(arg as A);
      logIpc(channel, 'out', result);
      return result;
    } catch (error) {
      const payload = toIpcPayload(error);
      logIpc(channel, 'out', payload);
      throw rejectIpc(payload);
    }
  });
}

export function registerIpcHandlers(getMainWindow: () => BrowserWindow): void {
  initResourceService(getMainWindow);
  initChatService(getMainWindow);
  void runV2CoursesMigration().then(() => ensureLibrarySeed());

  handle(IPC_CHANNELS.HEALTH_PING, (): HealthPingResult => ({
    ok: true,
    timestamp: Date.now(),
    electronVersion: process.versions.electron,
    platform: getAppPlatform(),
  }));

  handle(IPC_CHANNELS.APP_GET_PLATFORM, () => getAppPlatform());

  handle(IPC_CHANNELS.APP_GET_PATHS, () => ({
    userData: app.getPath('userData'),
    documents: app.getPath('documents'),
    home: app.getPath('home'),
  }));

  handle(IPC_CHANNELS.APP_GET_VERSION, () => ({
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
  }));

  handle(IPC_CHANNELS.DATA_EXPORT, async () => {
    const win = getMainWindow();
    const result = await dialog.showSaveDialog(win, {
      title: 'Export Escopenote data',
      defaultPath: defaultBackupPath(),
      filters: [{ name: 'JSON backup', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) {
      return { canceled: true as const, path: null };
    }
    await exportToFile(result.filePath);
    return { canceled: false as const, path: result.filePath };
  });

  handle(IPC_CHANNELS.DATA_IMPORT, async () => {
    const win = getMainWindow();
    const result = await dialog.showOpenDialog(win, {
      title: 'Import Escopenote data',
      properties: ['openFile'],
      filters: [{ name: 'JSON backup', extensions: ['json'] }],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true as const };
    }
    await importFromFile(result.filePaths[0]);
    return { canceled: false as const };
  });

  handle(IPC_CHANNELS.SETTINGS_GET, async () => readSettingsFile());

  handleWithArg(IPC_CHANNELS.SETTINGS_SET, async (patch: unknown) => {
    const parsed = parseOrThrow(appSettingsPatchSchema, patch, 'settings.set');
    const current = await readSettingsFile();
    const next = { ...current, ...parsed, preferencesInitialized: true };
    await writeSettingsFile(next);
    return next;
  });

  handleWithArg(IPC_CHANNELS.STORAGE_READ, async (arg: unknown) => {
    const { namespace } = parseOrThrow(storageReadSchema, arg, 'storage.read');
    return readNamespace(namespace);
  });

  handleWithArg(IPC_CHANNELS.STORAGE_WRITE, async (arg: unknown) => {
    const { namespace, data } = parseOrThrow(storageWriteSchema, arg, 'storage.write');
    await writeNamespace(namespace, data);
  });

  handle(IPC_CHANNELS.COURSES_LIST, async () => listCourses());

  handleWithArg(IPC_CHANNELS.COURSES_GET, async (arg: unknown) => {
    const { id } = parseOrThrow(courseIdSchema, arg, 'courses.get');
    return getCourse(id);
  });

  handleWithArg(IPC_CHANNELS.COURSES_CREATE, async (arg: unknown) => {
    const input = parseOrThrow(courseCreateSchema, arg, 'courses.create');
    return createCourse(input);
  });

  handleWithArg(IPC_CHANNELS.COURSES_UPDATE, async (arg: unknown) => {
    const { id, ...patch } = parseOrThrow(courseUpdateSchema, arg, 'courses.update');
    return updateCourse(id, patch);
  });

  handleWithArg(IPC_CHANNELS.COURSES_DELETE, async (arg: unknown) => {
    const { id } = parseOrThrow(courseIdSchema, arg, 'courses.delete');
    await deleteCourse(id);
  });

  handleWithArg(IPC_CHANNELS.RESOURCES_LIST, async (arg: unknown) => {
    const courseId = typeof arg === 'string' ? arg : undefined;
    if (courseId) {
      return listResourcesByCourse(courseId);
    }
    return listAllResources();
  });

  handleWithArg(IPC_CHANNELS.RESOURCES_ADD_FILES, async (arg: unknown) => {
    const { courseId, paths } = parseOrThrow(resourcesAddFilesSchema, arg, 'resources.addFiles');
    return addFilesToCourse(courseId, paths);
  });

  handleWithArg(IPC_CHANNELS.RESOURCES_ADD_LINK, async (arg: unknown) => {
    const { courseId, url } = parseOrThrow(resourcesAddLinkSchema, arg, 'resources.addLink');
    return addLinkToCourse(courseId, url);
  });

  handleWithArg(IPC_CHANNELS.RESOURCES_REMOVE, async (arg: unknown) => {
    const { id } = parseOrThrow(resourceIdSchema, arg, 'resources.remove');
    await removeResource(id);
  });

  handleWithArg(IPC_CHANNELS.RESOURCES_REINDEX, async (arg: unknown) => {
    const { id } = parseOrThrow(resourceIdSchema, arg, 'resources.reindex');
    return reindexResource(id);
  });

  handleWithArg(IPC_CHANNELS.NOTES_LIST, async (arg: unknown) => {
    const filter = parseOrThrow(notesListSchema, arg, 'notes.list');
    return listNotes(filter);
  });

  handleWithArg(IPC_CHANNELS.NOTES_GET, async (arg: unknown) => {
    const { id } = parseOrThrow(noteIdSchema, arg, 'notes.get');
    return getNote(id);
  });

  handleWithArg(IPC_CHANNELS.NOTES_CREATE, async (arg: unknown) => {
    const input = parseOrThrow(noteCreateSchema, arg, 'notes.create');
    return createNote(input);
  });

  handleWithArg(IPC_CHANNELS.NOTES_UPDATE, async (arg: unknown) => {
    const input = parseOrThrow(noteUpdateSchema, arg, 'notes.update');
    return updateNote(input);
  });

  handleWithArg(IPC_CHANNELS.NOTES_DELETE, async (arg: unknown) => {
    const { id } = parseOrThrow(noteIdSchema, arg, 'notes.delete');
    await deleteNote(id);
  });

  handleWithArg(IPC_CHANNELS.NOTES_EXPORT_MD, async (arg: unknown) => {
    const { id } = parseOrThrow(noteIdSchema, arg, 'notes.exportMd');
    return exportNoteMarkdown(id);
  });

  handleWithArg(IPC_CHANNELS.NOTES_RESOLVE_LINK, async (arg: unknown) => {
    const { query } = parseOrThrow(noteResolveLinkSchema, arg, 'notes.resolveLink');
    return resolveNoteLink(query);
  });

  handleWithArg(IPC_CHANNELS.NOTES_RESOLVE_TARGET, async (arg: unknown) => {
    const { query } = parseOrThrow(noteResolveLinkSchema, arg, 'notes.resolveTarget');
    return resolveNoteLinkTarget(query);
  });

  handleWithArg(IPC_CHANNELS.SHELL_OPEN_RESOURCE, async (arg: unknown) => {
    const { resourceId } = parseOrThrow(shellOpenResourceSchema, arg, 'shell.openResource');
    await openResourceById(resourceId);
  });

  handleWithArg(IPC_CHANNELS.NOTES_BACKLINKS, async (arg: unknown) => {
    const { id } = parseOrThrow(noteIdSchema, arg, 'notes.backlinks');
    return getBacklinks(id);
  });

  handleWithArg(IPC_CHANNELS.NOTES_CREATE_FROM_CHAT, async (arg: unknown) => {
    const { title, markdown, courseId } = parseOrThrow(
      noteCreateFromChatSchema,
      arg,
      'notes.createFromChat',
    );
    return createNoteFromChatContent(title, markdown, courseId);
  });

  handle(IPC_CHANNELS.LIBRARY_LIST, async () => listLibraryFiles());

  handleWithArg(IPC_CHANNELS.LIBRARY_ADD_FILES, async (arg: unknown) => {
    const { paths } = parseOrThrow(libraryAddFilesSchema, arg, 'library.addFiles');
    return addLibraryFiles(paths);
  });

  handleWithArg(IPC_CHANNELS.LIBRARY_REMOVE, async (arg: unknown) => {
    const { id } = parseOrThrow(libraryIdSchema, arg, 'library.remove');
    await removeLibraryFile(id);
  });

  handleWithArg(IPC_CHANNELS.LIBRARY_REINDEX, async (arg: unknown) => {
    const { id } = parseOrThrow(libraryIdSchema, arg, 'library.reindex');
    return reindexLibraryFile(id);
  });

  handleWithArg(IPC_CHANNELS.RAG_SEARCH, async (arg: unknown) => {
    const { query, topK, courseId } = parseOrThrow(ragSearchSchema, arg, 'rag.search');
    return searchRag(query, { topK, courseId });
  });

  handleWithArg(IPC_CHANNELS.RAG_GET_CHUNK, async (arg: unknown) => {
    const { chunkId } = parseOrThrow(ragChunkIdSchema, arg, 'rag.getChunk');
    const chunk = await getChunkById(chunkId);
    if (!chunk) {
      return null;
    }
    return {
      chunkId: chunk.id,
      fileName: chunk.fileName,
      text: chunk.text,
    };
  });

  handleWithArg(IPC_CHANNELS.CHAT_RECORD_OUTBOUND, async (arg: unknown) => {
    const { message, chunks } = parseOrThrow(chatRecordOutboundSchema, arg, 'chat.recordOutbound');
    return recordChatOutbound(
      message,
      chunks.map((c) => ({
        ...c,
        resourceId: c.resourceId ?? c.fileId,
      })),
    );
  });

  handle(IPC_CHANNELS.CHAT_GET_LAST_OUTBOUND, async () => getLastChatOutbound());

  handle(IPC_CHANNELS.GATEWAY_TEST, async () => testGatewayConnection());

  handle(IPC_CHANNELS.USAGE_GET_QUOTA, async () => {
    const clientId = await getClientId();
    return brainGetUsage(clientId);
  });

  handleWithArg(IPC_CHANNELS.CHAT_SEND, async (arg: unknown) => {
    const { requestId, message, sessionId, courseId, feature, locale, history } = parseOrThrow(
      chatSendSchema,
      arg,
      'chat.send',
    );
    await runChatSend(requestId, message, sessionId, courseId, feature, locale, history);
  });

  handleWithArg(IPC_CHANNELS.LIBRARY_SAVE_WEB_SUMMARY, async (arg: unknown) => {
    const { title, summary, courseId } = parseOrThrow(chatSaveWebSchema, arg, 'library.saveWebSummary');
    return saveWebSummaryToResources(title, summary, courseId);
  });

  handleWithArg(IPC_CHANNELS.DIALOG_OPEN_FILES, async (options: unknown) => {
    const parsed = parseOrThrow(openFileOptionsSchema, options, 'dialog.openFiles');
    const win = getMainWindow();
    const result = await dialog.showOpenDialog(win, {
      title: parsed?.title,
      properties: parsed?.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: parsed?.filters,
    });
    return {
      canceled: result.canceled,
      filePaths: result.filePaths,
    };
  });

  handleWithArg(IPC_CHANNELS.DIALOG_SAVE_FILE, async (options: unknown) => {
    const parsed = parseOrThrow(saveFileDialogSchema, options, 'dialog.saveFile');
    const win = getMainWindow();
    const result = await dialog.showSaveDialog(win, {
      title: parsed?.title,
      defaultPath: parsed?.defaultPath,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });
    return {
      canceled: result.canceled,
      filePath: result.filePath ?? null,
    };
  });

  handleWithArg(IPC_CHANNELS.WINDOW_SAVE_BOUNDS, async (bounds: unknown) => {
    const parsed = parseOrThrow(windowBoundsSchema, bounds, 'window.saveBounds');
    const current = await readSettingsFile();
    await writeSettingsFile({ ...current, windowBounds: parsed, preferencesInitialized: true });
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    getMainWindow().minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE_TOGGLE, () => {
    const win = getMainWindow();
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    getMainWindow().close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => getMainWindow().isMaximized());
}

export async function applyStoredWindowBounds(win: BrowserWindow): Promise<void> {
  const settings = await readSettingsFile();
  const bounds = settings.windowBounds;
  if (!bounds) {
    return;
  }

  const { workArea } = screen.getPrimaryDisplay();
  const width = Math.min(bounds.width, workArea.width);
  const height = Math.min(bounds.height, workArea.height);
  const x =
    bounds.x !== undefined
      ? Math.max(workArea.x, Math.min(bounds.x, workArea.x + workArea.width - width))
      : undefined;
  const y =
    bounds.y !== undefined
      ? Math.max(workArea.y, Math.min(bounds.y, workArea.y + workArea.height - height))
      : undefined;

  win.setBounds({ width, height, x, y });
}

export function persistWindowBounds(win: BrowserWindow): void {
  const bounds = win.getBounds();
  const patch = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
  };
  void readSettingsFile()
    .then((current) => writeSettingsFile({ ...current, windowBounds: patch }))
    .catch(() => undefined);
}
