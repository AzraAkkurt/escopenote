import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui';
import { FileTypeIcon } from '@renderer/library/components/FileTypeIcon';
import { IndexStatusBadge } from '@renderer/library/components/IndexStatusBadge';
import { formatAddedDate, formatFileSize } from '@renderer/library/utils';
import type { LibraryFileEntry } from '@shared/library-types';

interface FileDetailDrawerProps {
  file: LibraryFileEntry | null;
  locale: string;
  onClose: () => void;
  onReindex: (id: string) => void;
}

export function FileDetailDrawer({ file, locale, onClose, onReindex }: FileDetailDrawerProps) {
  const { t } = useTranslation('library');

  if (!file) {
    return null;
  }

  return (
    <aside className="library-drawer" aria-label={t('detailTitle')}>
      <header className="library-drawer__header">
        <div className="library-drawer__title-row">
          <FileTypeIcon type={file.type} />
          <h3 className="library-drawer__title">{file.name}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label={t('detailClose')}>
          ×
        </Button>
      </header>

      <dl className="library-drawer__meta">
        <div>
          <dt>{t('detailStatus')}</dt>
          <dd>
            <IndexStatusBadge status={file.status} title={file.errorMessage} />
          </dd>
        </div>
        <div>
          <dt>{t('detailType')}</dt>
          <dd>{file.type.toUpperCase()}</dd>
        </div>
        <div>
          <dt>{t('detailSize')}</dt>
          <dd>{formatFileSize(file.sizeBytes)}</dd>
        </div>
        <div>
          <dt>{t('detailAdded')}</dt>
          <dd>{formatAddedDate(file.addedAt, locale)}</dd>
        </div>
        {file.chunkCount != null ? (
          <div>
            <dt>{t('detailChunks')}</dt>
            <dd>{file.chunkCount}</dd>
          </div>
        ) : null}
        {file.lastIndexedAt ? (
          <div>
            <dt>{t('detailLastIndexed')}</dt>
            <dd>{formatAddedDate(file.lastIndexedAt, locale)}</dd>
          </div>
        ) : null}
      </dl>

      {file.errorMessage ? (
        <p className="library-drawer__error" role="alert">
          {file.errorMessage}
        </p>
      ) : null}

      {file.previewText ? (
        <section className="library-drawer__preview">
          <h4>{t('detailPreview')}</h4>
          <pre>{file.previewText}</pre>
        </section>
      ) : null}

      <footer className="library-drawer__actions">
        <Button variant="secondary" onClick={() => onReindex(file.id)}>
          {t('reindex')}
        </Button>
      </footer>
    </aside>
  );
}
