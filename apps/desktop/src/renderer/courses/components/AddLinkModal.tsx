import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal } from '@renderer/components/ui';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string) => Promise<void>;
}

export function AddLinkModal({ isOpen, onClose, onAdd }: AddLinkModalProps) {
  const { t } = useTranslation('courses');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setUrl('');
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(trimmed);
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title={t('addLinkTitle')} onClose={handleClose} closeLabel={t('cancel')}>
      <div className="course-add-link-modal">
        <Input
          label={t('urlLabel')}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('urlPlaceholder')}
          autoFocus
        />
        <div className="course-add-link-modal__actions">
          <Button variant="ghost" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" disabled={!url.trim() || submitting} onClick={() => void handleSubmit()}>
            {t('addLink')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
