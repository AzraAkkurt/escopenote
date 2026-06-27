import { getDefaultGatewayUrl, normalizeGatewayUrl } from './gateway-config';
import type { LocaleCode, ThemePreference } from './preferences';

export { GATEWAY_URL, VPS_GATEWAY_URL } from './gateway-config';

export interface WindowBounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

export interface AppSettings {
  theme: ThemePreference;
  locale: LocaleCode;
  gatewayUrl: string;
  preferencesInitialized: boolean;
  windowBounds?: WindowBounds;
  /** Local RAG retrieval depth (Phase 8+). */
  ragTopK: number;
  /** UI preference until Phase 9 web write-back. */
  confirmBeforeSavingWebResults: boolean;
  onboardingCompleted: boolean;
  privacyAcknowledged: boolean;
}

export const BRAIN_GATEWAY_URL = getDefaultGatewayUrl();

/** Point old mock-gateway defaults at Brain API; locked builds force VPS URL. */
export function migrateGatewayUrl(url: string): string {
  return normalizeGatewayUrl(url);
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  locale: 'en',
  gatewayUrl: getDefaultGatewayUrl(),
  preferencesInitialized: false,
  ragTopK: 5,
  confirmBeforeSavingWebResults: true,
  onboardingCompleted: false,
  privacyAcknowledged: false,
};
