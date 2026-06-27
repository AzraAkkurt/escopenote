/** Fixed Brain API endpoint (VPS). Not user-configurable. */
export const VPS_GATEWAY_URL = 'http://31.57.46.24:3001';

export const GATEWAY_URL = VPS_GATEWAY_URL;

export function getDefaultGatewayUrl(): string {
  return GATEWAY_URL;
}

/** Always use VPS; migrate any stored localhost URL. */
export function normalizeGatewayUrl(_url: string): string {
  return GATEWAY_URL;
}
