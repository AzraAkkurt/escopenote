import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'dashed';
}

export function Card({ children, variant = 'default', className = '', ...props }: CardProps) {
  const classes = ['ui-card', variant === 'dashed' ? 'ui-card--dashed' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
