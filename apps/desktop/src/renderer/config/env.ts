import { GATEWAY_URL } from '@shared/gateway-config';

export function getGatewayUrlFromEnv(): string {
  const fromEnv = import.meta.env.VITE_GATEWAY_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }
  return GATEWAY_URL;
}

export function getAppEnv(): 'development' | 'production' {
  return import.meta.env.DEV ? 'development' : 'production';
}

export function useFixturesMode(): boolean {
  return import.meta.env.VITE_USE_FIXTURES === 'true';
}
