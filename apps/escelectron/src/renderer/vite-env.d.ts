/// <reference types="vite/client" />

import type { EscopenoteApi } from '../../shared/ipc-types';

interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL?: string;
  readonly VITE_USE_FIXTURES?: string;
}

declare global {
  interface Window {
    escopenote: EscopenoteApi;
  }
}

export {};
