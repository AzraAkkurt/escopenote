import type { LibraryIndexStatus } from '@shared/library-types';

interface IndexingProgressProps {
  status: LibraryIndexStatus;
  progress?: number;
}

export function IndexingProgress({ status, progress = 0 }: IndexingProgressProps) {
  if (status !== 'indexing' && status !== 'pending') {
    return null;
  }

  const value = status === 'pending' ? 0 : Math.min(100, Math.max(0, progress));

  return (
    <div className="library-progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="library-progress__bar" style={{ width: `${value}%` }} />
    </div>
  );
}
