import type { LibraryFileType } from '@shared/library-types';

const TYPE_ICONS: Record<LibraryFileType, string> = {
  pdf: '📕',
  html: '🌐',
  txt: '📄',
  md: '📝',
  csv: '📊',
  json: '{ }',
  docx: '📘',
  unknown: '📁',
};

interface FileTypeIconProps {
  type: LibraryFileType;
  className?: string;
}

export function FileTypeIcon({ type, className = '' }: FileTypeIconProps) {
  return (
    <span className={`library-type-icon ${className}`.trim()} aria-hidden>
      {TYPE_ICONS[type]}
    </span>
  );
}
