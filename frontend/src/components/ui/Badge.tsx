import React from 'react';
import clsx from 'clsx';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx('badge', `badge-${variant}`, `badge-${size}`, className)}
        {...props}
      >
        {icon}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
