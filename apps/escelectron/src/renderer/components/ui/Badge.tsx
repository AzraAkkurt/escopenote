import type { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'default' | 'accent' | 'success';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  const classes = ['ui-badge', variant !== 'default' ? `ui-badge--${variant}` : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
