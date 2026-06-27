import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, useToast } from '@renderer/components/ui';
import { getRequestErrorMessage } from '@renderer/lib/request-error';
import { ipcCall } from '@renderer/lib/ipc';
import type { UsageQuotaInfo } from '@shared/gateway-types';

export function UsageSettingsSection() {
  const { t } = useTranslation('settings');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const [quota, setQuota] = useState<UsageQuotaInfo | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const q = await ipcCall((api) => api.usage.getQuota());
      setQuota(q);
    } catch (err) {
      toast.show(getRequestErrorMessage(err, tc), 'error');
    } finally {
      setBusy(false);
    }
  }, [tc, toast]);

  useEffect(() => {
    void refresh();
    const onUsage = () => void refresh();
    window.addEventListener('escopenote:usage-updated', onUsage);
    return () => window.removeEventListener('escopenote:usage-updated', onUsage);
  }, [refresh]);

  return (
    <Card>
      <h2 className="settings-section__title">{t('usage.title')}</h2>
      <p className="settings-range__hint">{t('usage.hint')}</p>

      {quota ? (
        <div className="settings-account__logged-in">
          <p className="settings-account__balance">
            {t('usage.today', { used: quota.daily_used, limit: quota.daily_limit })}
          </p>
          <p className="settings-account__balance-sub">
            {t('usage.remaining', { count: quota.daily_remaining })}
          </p>
        </div>
      ) : (
        <p className="settings-range__hint">{tc('checking')}</p>
      )}

      <div className="settings-account__actions">
        <Button variant="ghost" disabled={busy} onClick={() => void refresh()}>
          {t('usage.refresh')}
        </Button>
      </div>
    </Card>
  );
}
