import { app } from 'electron';
import type { AppPlatform } from '../../shared/platform';
import { normalizePlatform } from '../../shared/platform';

export function getAppPlatform(): AppPlatform | 'other' {
  return normalizePlatform(process.platform);
}

export function isLinux(): boolean {
  return process.platform === 'linux';
}

export function isWindows(): boolean {
  return process.platform === 'win32';
}

/**
 * Chromium flags for Linux dev environments where the setuid `chrome-sandbox`
 * helper is missing or misconfigured (common on Ubuntu, WSL, CI).
 * Also set via npm script: ELECTRON_DISABLE_SANDBOX=1 and `electron . --no-sandbox`.
 */
export function applyDevPlatformFlags(isDev: boolean): void {
  if (!isDev) {
    return;
  }

  if (isLinux()) {
    app.commandLine.appendSwitch('no-sandbox');
    app.commandLine.appendSwitch('disable-gpu-sandbox');
  }
}

export function hasCustomTitleBar(): boolean {
  return isLinux() || isWindows();
}
