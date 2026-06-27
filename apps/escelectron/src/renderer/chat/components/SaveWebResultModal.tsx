import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@renderer/components/ui';
import type { PendingWebSave } from '@shared/gateway-types';

interface SaveWebResultModalProps {
  pending: PendingWebSave | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function SaveWebResultModal({ pending, onAccept, onDecline }: SaveWebResultModalProps) {
  const { t } = useTranslation('chat');

  return (
    <Modal
      isOpen={pending !== null}
      title={t('saveWebTitle')}
      onClose={onDecline}
      closeLabel={t('saveWebDecline')}
    >
      {pending ? (
        <>
          <p className="settings-modal__body">{t('saveWebBody', { title: pending.title })}</p>
          <pre className="save-web-preview">{pending.summary.slice(0, 600)}</pre>
          <div className="settings-panels__actions">
            <Button variant="ghost" onClick={onDecline}>
              {t('saveWebDecline')}
            </Button>
            <Button variant="primary" onClick={onAccept}>
              {t('saveWebAccept')}
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
