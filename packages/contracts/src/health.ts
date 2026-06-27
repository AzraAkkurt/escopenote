export interface HealthResponse {
  ok: boolean;
  version: string;
  api: 'v1';
  capabilities: string[];
  provider: 'gemini' | 'mock';
}
