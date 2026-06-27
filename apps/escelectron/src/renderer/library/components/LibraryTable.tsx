import { useTranslation } from 'react-i18next';
import i18n from '@renderer/i18n';
import { Button } from '@renderer/components/ui';
import { FileTypeIcon } from '@renderer/library/components/FileTypeIcon';
import { IndexStatusBadge } from '@renderer/library/components/IndexStatusBadge';
import { IndexingProgress } from '@renderer/library/components/IndexingProgress';
import { formatAddedDate, formatFileSize } from '@renderer/library/utils';
import type { LibraryFileEntry } from '@shared/library-types';

interface LibraryTableProps {
  files: LibraryFileEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onReindex: (id: string) => void;
}

export function LibraryTable({
  files,
  selectedId,
  onSelect,
  onRemove,
  onReindex,
}: LibraryTableProps) {
  const { t } = useTranslation('library');
  const locale = i18n.language;

  return (
    <div className="library-table-wrap library-table-wrap--scroll" role="region" aria-label={t('tableAria')}>
      <table className="library-table">
        <thead>
          <tr>
            <th scope="col">{t('columnName')}</th>
            <th scope="col">{t('columnType')}</th>
            <th scope="col">{t('columnSize')}</th>
            <th scope="col">{t('columnStatus')}</th>
            <th scope="col">{t('columnAdded')}</th>
            <th scope="col" className="library-table__actions-col">
              {t('columnActions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr
              key={file.id}
              className={selectedId === file.id ? 'library-table__row--selected' : ''}
              onClick={() => onSelect(file.id)}
            >
              <td>
                <div className="library-table__name">
                  <FileTypeIcon type={file.type} />
                  <span>{file.name}</span>
                </div>
                <IndexingProgress status={file.status} progress={file.indexProgress} />
              </td>
              <td>{file.type.toUpperCase()}</td>
              <td>{formatFileSize(file.sizeBytes)}</td>
              <td>
                <IndexStatusBadge
                  status={file.status}
                  title={file.status === 'failed' ? file.errorMessage : undefined}
                />
              </td>
              <td>{formatAddedDate(file.addedAt, locale)}</td>
              <td className="library-table__actions" onClick={(e) => e.stopPropagation()}>
                {file.status === 'failed' ? (
                  <Button variant="ghost" size="sm" onClick={() => onReindex(file.id)}>
                    {t('retry')}
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" onClick={() => onRemove(file.id)}>
                  {t('remove')}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
