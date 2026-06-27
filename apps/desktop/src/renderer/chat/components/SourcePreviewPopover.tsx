import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFixturesMode } from '@renderer/config/env';
import { Button, Card, Spinner } from '@renderer/components/ui';
import { ipcCall } from '@renderer/lib/ipc';
import type { ChatCitation } from '@shared/chat-types';

interface SourcePreviewPopoverProps {
  citation: ChatCitation;
  onClose: () => void;
}

export function SourcePreviewPopover({ citation, onClose }: SourcePreviewPopoverProps) {
  const { t } = useTranslation('chat');
  const fixtures = useFixturesMode();
  const [fullText, setFullText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!citation.chunkId || fixtures) {
      setFullText(null);
      return;
    }

    setLoading(true);
    void ipcCall((api) => api.rag.getChunk(citation.chunkId!))
      .then((chunk) => setFullText(chunk?.text ?? null))
      .catch(() => setFullText(null))
      .finally(() => setLoading(false));
  }, [citation.chunkId, fixtures]);

  const body = fullText ?? citation.excerpt;

  return (
    <Card className="source-preview">
      <header className="source-preview__header">
        <strong>{t('citationPreview')}</strong>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          ×
        </Button>
      </header>
      <p className="source-preview__file">{citation.fileName}</p>
      {loading ? <Spinner /> : <p className="source-preview__excerpt">{body}</p>}
      {citation.chunkId ? (
        <p className="source-preview__meta">
          <code>{citation.chunkId}</code>
        </p>
      ) : null}
    </Card>
  );
}
