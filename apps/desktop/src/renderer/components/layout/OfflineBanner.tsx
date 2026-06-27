import { useTranslation } from 'react-i18next';
import { useGateway } from '@renderer/providers/GatewayProvider';

export function OfflineBanner() {
  const { t } = useTranslation('common');
  const { status } = useGateway();

  if (status !== 'offline') {
    return null;
  }

  return (
    <div className="offline-banner" role="status">
      {t('gateway.offlineBanner')}
    </div>
  );
}
