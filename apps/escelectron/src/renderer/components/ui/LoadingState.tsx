import { Spinner } from './Spinner';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label, className = '' }: LoadingStateProps) {
  return (
    <div className={`loading-state ${className}`.trim()} role="status" aria-busy="true">
      <Spinner label={label} />
      {label ? <p className="loading-state__label">{label}</p> : null}
    </div>
  );
}
