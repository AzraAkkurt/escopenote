import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@renderer/components/ui';
import type { ChatCitation } from '@shared/chat-types';
import { SourcePreviewPopover } from './SourcePreviewPopover';

interface CitationChipProps {
  citation: ChatCitation;
}

export function CitationChip({ citation }: CitationChipProps) {
  const { t } = useTranslation('chat');
  const [open, setOpen] = useState(false);

  return (
    <span className="citation-chip-wrap">
      <button
        type="button"
        className={`citation-chip citation-chip--${citation.sourceType}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Badge variant={citation.sourceType === 'web' ? 'default' : 'accent'}>
          {citation.sourceType === 'web' ? t('sourceWeb') : t('sourceLocal')}
        </Badge>
        <span className="citation-chip__file">{citation.fileName}</span>
      </button>
      {open ? (
        <SourcePreviewPopover citation={citation} onClose={() => setOpen(false)} />
      ) : null}
    </span>
  );
}
