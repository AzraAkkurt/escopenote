import { useTranslation } from 'react-i18next';
import type { LibraryIndexStatus } from '@shared/library-types';

interface IndexStatusBadgeProps {
  status: LibraryIndexStatus;
  title?: string;
}

export function IndexStatusBadge({ status, title }: IndexStatusBadgeProps) {
  const { t } = useTranslation('library');

  return (
    <span
      className={`library-status library-status--${status}`}
      title={title}
    >
      {t(`status.${status}`)}
    </span>
  );
}
