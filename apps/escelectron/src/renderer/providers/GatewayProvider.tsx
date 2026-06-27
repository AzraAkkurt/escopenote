import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useFixturesMode } from '@renderer/config/env';
import { ipcCall } from '@renderer/lib/ipc';
import { useAppSettings } from '@renderer/providers/SettingsProvider';
import type { GatewayProvider } from '@shared/gateway-types';

export type GatewayStatus = 'checking' | 'online' | 'offline';

interface GatewayContextValue {
  status: GatewayStatus;
  latencyMs: number | null;
  provider: GatewayProvider | null;
  lastChecked: number | null;
  refresh: () => Promise<void>;
}

const GatewayContext = createContext<GatewayContextValue | null>(null);

export function GatewayProvider({ children }: { children: ReactNode }) {
  const { settings } = useAppSettings();
  const fixtures = useFixturesMode();
  const [status, setStatus] = useState<GatewayStatus>('checking');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [provider, setProvider] = useState<GatewayProvider | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (fixtures) {
      setStatus('online');
      setLatencyMs(0);
      setProvider('mock');
      setLastChecked(Date.now());
      return;
    }

    setStatus('checking');
    try {
      const result = await ipcCall((api) => api.gateway.testConnection());
      setStatus(result.ok ? 'online' : 'offline');
      setLatencyMs(result.latencyMs);
      setProvider(result.provider ?? null);
      setLastChecked(Date.now());
    } catch {
      setStatus('offline');
      setLatencyMs(null);
      setProvider(null);
      setLastChecked(Date.now());
    }
  }, [fixtures]);

  useEffect(() => {
    void refresh();
  }, [refresh, settings.gatewayUrl]);

  useEffect(() => {
    if (fixtures) {
      return;
    }
    const id = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [fixtures, refresh]);

  return (
    <GatewayContext.Provider value={{ status, latencyMs, provider, lastChecked, refresh }}>
      {children}
    </GatewayContext.Provider>
  );
}

export function useGateway(): GatewayContextValue {
  const ctx = useContext(GatewayContext);
  if (!ctx) {
    throw new Error('useGateway must be used within GatewayProvider');
  }
  return ctx;
}
