interface SpinnerProps {
  size?: 'md' | 'lg';
  label?: string;
}

export function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <div role="status" aria-label={label}>
      <div className={`ui-spinner${size === 'lg' ? ' ui-spinner--lg' : ''}`} />
    </div>
  );
}
