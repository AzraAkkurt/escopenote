import { useTranslation } from 'react-i18next';
import { Spinner } from '@renderer/components/ui';

export function StreamingIndicator() {
  const { t } = useTranslation('chat');

  return (
    <div className="streaming-indicator" role="status" aria-live="polite">
      <Spinner />
      <span>{t('streaming')}</span>
      <span className="streaming-indicator__cursor" aria-hidden>
        |
      </span>
    </div>
  );
}
