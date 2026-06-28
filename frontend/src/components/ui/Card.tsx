import React from 'react';
import clsx from 'clsx';
import './Card.css';

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const BaseCard = React.forwardRef<HTMLDivElement, BaseCardProps>(
  ({ className, hoverable, loading, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'card',
          {
            'card-hoverable': hoverable,
            'card-loading': loading,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BaseCard.displayName = 'BaseCard';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('card-header', className)} {...props}>
        {children}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('card-content', className)} {...props}>
        {children}
      </div>
    );
  }
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('card-footer', className)} {...props}>
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';
