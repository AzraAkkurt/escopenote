import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui';

interface ComposerProps {
  disabled?: boolean;
  generating?: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function Composer({ disabled, generating, onSend, onStop }: ComposerProps) {
  const { t } = useTranslation('chat');
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || generating) {
      return;
    }
    onSend(trimmed);
    setText('');
  };

  return (
    <div className="chat-composer">
      <textarea
        className="chat-composer__input"
        rows={3}
        value={text}
        placeholder={t('composerPlaceholder')}
        disabled={disabled || generating}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="chat-composer__actions">
        {generating ? (
          <Button variant="danger" onClick={onStop}>
            {t('stop')}
          </Button>
        ) : (
          <Button variant="primary" onClick={submit} disabled={disabled || !text.trim()}>
            {t('send')}
          </Button>
        )}
      </div>
    </div>
  );
}
