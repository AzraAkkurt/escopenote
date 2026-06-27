/** Supported desktop targets for Escopenote. */
export type AppPlatform = 'linux' | 'win32' | 'darwin';

export function normalizePlatform(platform: NodeJS.Platform): AppPlatform | 'other' {
  if (platform === 'linux' || platform === 'win32' || platform === 'darwin') {
    return platform;
  }
  return 'other';
}

export function isSupportedDesktop(platform: AppPlatform | 'other'): platform is AppPlatform {
  return platform === 'linux' || platform === 'win32' || platform === 'darwin';
}
