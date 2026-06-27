import { useTranslation } from 'react-i18next';
import type { LibraryIndexStatus } from '@shared/library-types';

interface ResourceStatusBadgeProps {
  status: LibraryIndexStatus;
  title?: string;
}

export function ResourceStatusBadge({ status, title }: ResourceStatusBadgeProps) {
  const { t } = useTranslation('courses');

  return (
    <span className={`resource-status resource-status--${status}`} title={title}>
      {t(`status.${status}`)}
    </span>
  );
}
