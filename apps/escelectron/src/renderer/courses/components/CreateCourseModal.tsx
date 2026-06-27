import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal } from '@renderer/components/ui';

const PRESET_EMOJIS = ['📘', '📗', '📙', '📕', '🧮', '🔬', '💻', '🎨'] as const;

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; icon?: string }) => Promise<void>;
}

export function CreateCourseModal({ isOpen, onClose, onCreate }: CreateCourseModalProps) {
  const { t } = useTranslation('courses');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(PRESET_EMOJIS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setName('');
    setIcon(PRESET_EMOJIS[0]);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({ name: trimmed, icon });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title={t('createTitle')} onClose={handleClose} closeLabel={t('cancel')}>
      <div className="course-create-modal">
        <Input
          label={t('nameLabel')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          autoFocus
        />
        <fieldset className="course-create-modal__emojis">
          <legend className="course-create-modal__legend">{t('iconLabel')}</legend>
          <div className="course-create-modal__emoji-grid" role="radiogroup" aria-label={t('iconLabel')}>
            {PRESET_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="radio"
                aria-checked={icon === emoji}
                className={`course-create-modal__emoji${icon === emoji ? ' course-create-modal__emoji--active' : ''}`}
                onClick={() => setIcon(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="course-create-modal__actions">
          <Button variant="ghost" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" disabled={!name.trim() || submitting} onClick={() => void handleSubmit()}>
            {t('create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
