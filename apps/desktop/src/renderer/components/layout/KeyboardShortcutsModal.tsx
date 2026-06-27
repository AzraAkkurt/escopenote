import { useTranslation } from 'react-i18next';
import { Modal } from '@renderer/components/ui';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const { t } = useTranslation('shortcuts');

  const rows = [
    ['nav1', 'Ctrl/⌘ + 1'],
    ['nav2', 'Ctrl/⌘ + 2'],
    ['nav3', 'Ctrl/⌘ + 3'],
    ['nav4', 'Ctrl/⌘ + 4'],
    ['nav5', 'Ctrl/⌘ + 5'],
    ['newChat', 'Ctrl/⌘ + N'],
    ['help', '?'],
  ] as const;

  return (
    <Modal isOpen={open} title={t('title')} onClose={onClose}>
      <dl className="shortcuts-list">
        {rows.map(([key, keys]) => (
          <div key={key} className="shortcuts-list__row">
            <dt>{t(key)}</dt>
            <dd>
              <kbd>{keys}</kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
