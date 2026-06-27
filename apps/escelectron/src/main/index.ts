import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { applyDevPlatformFlags, hasCustomTitleBar } from './platform';
import {
  applyStoredWindowBounds,
  persistWindowBounds,
  registerIpcHandlers,
} from './ipc/register-ipc';

const isDev = process.env.NODE_ENV === 'development';

applyDevPlatformFlags(isDev);

let mainWindow: BrowserWindow | null = null;

function resolvePreloadPath(): string {
  return path.join(__dirname, '../preload/index.js');
}

function getMainWindow(): BrowserWindow {
  if (!mainWindow) {
    throw new Error('Main window not available');
  }
  return mainWindow;
}

async function createWindow(): Promise<void> {
  const customTitleBar = hasCustomTitleBar();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    frame: !customTitleBar,
    autoHideMenuBar: true,
    backgroundColor: '#0f1419',
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await applyStoredWindowBounds(mainWindow);

  let boundsTimer: ReturnType<typeof setTimeout> | undefined;
  mainWindow.on('resize', () => {
    if (boundsTimer) {
      clearTimeout(boundsTimer);
    }
    boundsTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        persistWindowBounds(mainWindow);
      }
    }, 500);
  });

  mainWindow.on('move', () => {
    if (boundsTimer) {
      clearTimeout(boundsTimer);
    }
    boundsTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        persistWindowBounds(mainWindow);
      }
    }, 500);
  });

  mainWindow.on('close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      persistWindowBounds(mainWindow);
    }
  });

  const showWindow = () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  };

  mainWindow.once('ready-to-show', showWindow);

  // Fallback: some Linux GPU setups never fire ready-to-show.
  mainWindow.webContents.once('did-finish-load', showWindow);

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('[main] did-fail-load', { code, description, url });
    showWindow();
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[main] render-process-gone', details);
  });

  if (isDev) {
    void mainWindow.loadURL('http://localhost:5173');
    // Auto DevTools triggers renderer.bundle.js noise and can block first paint on Linux.
    if (process.env.ELECTRON_OPEN_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

registerIpcHandlers(getMainWindow);

app.whenReady().then(() => {
  app.setName('Escopenote');
  void createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
