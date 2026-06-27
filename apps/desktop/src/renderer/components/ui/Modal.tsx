import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

export type ModalSize = 'default' | 'medium' | 'large';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
  size?: ModalSize;
}

export function Modal({
  isOpen,
  title,
  onClose,
  children,
  closeLabel = 'Close',
  size = 'default',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="ui-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className={`ui-modal ui-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ui-modal__header">
          <h2 id="modal-title" className="ui-modal__title">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={closeLabel}>
            ×
          </Button>
        </header>
        <div className="ui-modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
