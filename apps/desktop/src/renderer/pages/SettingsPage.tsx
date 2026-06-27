import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAppEnv, useFixturesMode } from '@renderer/config/env';
import { PageHeader } from '@renderer/components/layout/PageHeader';
import {
  Badge,
  Button,
  Card,
  Modal,
  Select,
  Spinner,
  Tabs,
  useToast,
  type SelectOption,
} from '@renderer/components/ui';
import { EMPTY_CHAT_STORE } from '@renderer/chat/defaults';
import { useLocalStore } from '@renderer/hooks/useLocalStore';
import type { ChatSessionsStore } from '@shared/chat-types';
import { ipcCall } from '@renderer/lib/ipc';
import { useAppSettings } from '@renderer/providers/SettingsProvider';
import { useGateway } from '@renderer/providers/GatewayProvider';
import { useLocale } from '@renderer/theme/LocaleProvider';
import { useTheme } from '@renderer/theme/ThemeProvider';
import type { AppVersionInfo, HealthPingResult } from '@shared/ipc-types';
import type { AppPlatform } from '@shared/platform';
import type { LocaleCode, ThemePreference } from '@shared/preferences';
import { UsageSettingsSection } from '@renderer/pages/settings/UsageSettingsSection';

export function SettingsPage() {
  const { t } = useTranslation('settings');
  const { t: tc } = useTranslation('common');
  const { t: tChat } = useTranslation('chat');
  const { settings, updateSettings } = useAppSettings();
  const { preference, setPreference } = useTheme();
  const { locale, setLocale } = useLocale();
  const toast = useToast();
  const fixtures = useFixturesMode();
  const { status: gatewayStatus, latencyMs } = useGateway();
  const [health, setHealth] = useState<HealthPingResult | null>(null);
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);
  const [dataBusy, setDataBusy] = useState(false);
  const [userDataPath, setUserDataPath] = useState<string>('');
  const [activeTab, setActiveTab] = useState('appearance');
  const [clearChatOpen, setClearChatOpen] = useState(false);
  const chatStore = useLocalStore<ChatSessionsStore>('chat.sessions');

  useEffect(() => {
    void window.escopenote?.ping().then(setHealth);
    void ipcCall((api) => api.getVersion()).then(setVersionInfo).catch(() => undefined);
    void ipcCall((api) => api.getPaths())
      .then((paths) => setUserDataPath(paths.userData))
      .catch(() => undefined);
  }, []);

  const themeOptions: SelectOption[] = [
    { value: 'light', label: t('appearance.themeLight') },
    { value: 'dark', label: t('appearance.themeDark') },
    { value: 'system', label: t('appearance.themeSystem') },
  ];

  const localeOptions: SelectOption[] = [
    { value: 'en', label: t('language.en') },
    { value: 'tr', label: t('language.tr') },
  ];

  const platformLabel =
    health?.platform && health.platform !== 'other'
      ? tc(`platform.${health.platform as AppPlatform}`)
      : health?.platform ?? tc('notAvailable');

  const handleThemeChange = (value: string) => {
    setPreference(value as ThemePreference);
    toast.show(tc('toast.themeUpdated'), 'success');
  };

  const handleLocaleChange = (value: string) => {
    setLocale(value as LocaleCode);
    toast.show(tc('toast.languageUpdated'), 'success');
  };

  const handleExportData = async () => {
    setDataBusy(true);
    try {
      const result = await ipcCall((api) => api.data.exportBackup());
      if (!result.canceled && result.path) {
        toast.show(t('data.exportDone', { path: result.path }), 'success');
      }
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('data.exportError'), 'error');
    } finally {
      setDataBusy(false);
    }
  };

  const handleImportData = async () => {
    setDataBusy(true);
    try {
      const result = await ipcCall((api) => api.data.importBackup());
      if (!result.canceled) {
        toast.show(t('data.importDone'), 'success');
        window.location.reload();
      }
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('data.importError'), 'error');
    } finally {
      setDataBusy(false);
    }
  };

  return (
    <div className="page page--wide">
      <PageHeader title={t('title')} description={t('description')} />

      <Tabs
        ariaLabel={t('title')}
        activeId={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: 'appearance',
            label: t('tabs.appearance'),
            panel: (
              <div className="settings-panels">
                <Card>
                  <h2 className="settings-section__title">{t('appearance.title')}</h2>
                  <div className="settings-panels__fields">
                    <Select
                      label={t('appearance.theme')}
                      options={themeOptions}
                      value={preference}
                      onChange={(e) => handleThemeChange(e.target.value)}
                    />
                    <div
                      className="settings-gateway-status"
                      role="status"
                      aria-live="polite"
                      aria-label={
                        gatewayStatus === 'online'
                          ? t('gateway.statusOnline', { ms: latencyMs ?? '—' })
                          : gatewayStatus === 'offline'
                            ? t('gateway.statusOffline')
                            : t('gateway.statusChecking')
                      }
                    >
                      <span className="settings-range__label">{t('gateway.server')}</span>
                      {gatewayStatus === 'checking' ? (
                        <Spinner size="md" label={t('gateway.statusChecking')} />
                      ) : gatewayStatus === 'online' ? (
                        <span className="settings-gateway-status__ok" aria-hidden="true">
                          ✓
                        </span>
                      ) : (
                        <span className="settings-gateway-status__fail" aria-hidden="true">
                          ✕
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
                <Card>
                  <h2 className="settings-section__title">{t('language.title')}</h2>
                  <Select
                    label={t('language.display')}
                    options={localeOptions}
                    value={locale}
                    onChange={(e) => handleLocaleChange(e.target.value)}
                  />
                </Card>
              </div>
            ),
          },
          {
            id: 'usage',
            label: t('tabs.usage'),
            panel: (
              <div className="settings-panels">
                <UsageSettingsSection />
              </div>
            ),
          },
          {
            id: 'rag',
            label: t('tabs.rag'),
            panel: (
              <Card>
                <h2 className="settings-section__title">{t('rag.title')}</h2>
                <div className="settings-panels__fields">
                  <label className="settings-range">
                    <span className="settings-range__label">
                      {t('rag.topK')}: <strong>{settings.ragTopK}</strong>
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={settings.ragTopK}
                      onChange={(e) =>
                        void updateSettings({ ragTopK: Number(e.target.value) })
                      }
                    />
                    <span className="settings-range__hint">{t('rag.topKHint')}</span>
                  </label>
                  <label className="settings-checkbox">
                    <input
                      type="checkbox"
                      checked={settings.confirmBeforeSavingWebResults}
                      onChange={(e) =>
                        void updateSettings({
                          confirmBeforeSavingWebResults: e.target.checked,
                        })
                      }
                    />
                    <span>{t('rag.confirmWeb')}</span>
                  </label>
                  <p className="settings-range__hint">{t('rag.confirmWebHint')}</p>
                </div>
              </Card>
            ),
          },
          {
            id: 'system',
            label: t('tabs.system'),
            panel: (
              <div className="settings-panels">
              <Card>
                <h2 className="settings-section__title">{t('about.title')}</h2>
                <p className="settings-about__tagline">{t('about.tagline')}</p>
                <dl className="settings-meta">
                  <dt>{t('about.version')}</dt>
                  <dd>{versionInfo?.version ?? tc('checking')}</dd>
                  <dt>{t('about.electron')}</dt>
                  <dd>{versionInfo?.electron ?? tc('notAvailable')}</dd>
                </dl>
              </Card>
              <Card>
                <h2 className="settings-section__title">{t('data.title')}</h2>
                <p className="settings-range__hint">{t('data.hint')}</p>
                <div className="settings-panels__actions">
                  <Button variant="secondary" disabled={dataBusy} onClick={() => void handleExportData()}>
                    {t('data.export')}
                  </Button>
                  <Button variant="ghost" disabled={dataBusy} onClick={() => void handleImportData()}>
                    {t('data.import')}
                  </Button>
                </div>
              </Card>
              <Card>
                <h2 className="settings-section__title">{t('system.title')}</h2>
                <dl className="settings-meta">
                  <dt>{t('system.environment')}</dt>
                  <dd>{getAppEnv()}</dd>
                  <dt>{t('system.userData')}</dt>
                  <dd>
                    <code>{userDataPath || tc('checking')}</code>
                  </dd>
                  <dt>{t('system.os')}</dt>
                  <dd>{platformLabel}</dd>
                  <dt>{t('system.ipc')}</dt>
                  <dd>{health ? tc('connected') : tc('checking')}</dd>
                  {fixtures ? (
                    <>
                      <dt>{t('system.fixtures')}</dt>
                      <dd>
                        <Badge variant="accent">{tc('fixturesMode')}</Badge>
                      </dd>
                    </>
                  ) : null}
                  {health ? (
                    <>
                      <dt>{t('system.electron')}</dt>
                      <dd>{health.electronVersion}</dd>
                    </>
                  ) : null}
                </dl>
                <div className="settings-panels__actions">
                  <Button
                    variant="secondary"
                    onClick={() => toast.show(t('system.previewToast'), 'default')}
                  >
                    {t('system.previewToast')}
                  </Button>
                  <Button variant="danger" onClick={() => setClearChatOpen(true)}>
                    {tChat('clearHistory')}
                  </Button>
                </div>
              </Card>
              </div>
            ),
          },
        ]}
      />

      <Modal
        isOpen={clearChatOpen}
        title={tChat('clearHistoryTitle')}
        onClose={() => setClearChatOpen(false)}
      >
        <p className="settings-modal__body">{tChat('clearHistoryBody')}</p>
        <div className="settings-panels__actions">
          <Button variant="ghost" onClick={() => setClearChatOpen(false)}>
            {tc('cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              void chatStore.save(EMPTY_CHAT_STORE).then(() => {
                toast.show(tChat('clearHistoryDone'), 'success');
                setClearChatOpen(false);
              });
            }}
          >
            {tChat('clearHistoryConfirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
