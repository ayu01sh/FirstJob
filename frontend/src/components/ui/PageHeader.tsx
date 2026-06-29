import React from 'react';
import clsx from 'clsx';
import './PageHeader.css';

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ className, title, eyebrow, description, actions, ...props }, ref) => {
    return (
      <header ref={ref} className={clsx('ui-page-header', className)} {...props}>
        <div className="ui-page-header-content">

          <h2 className="ui-page-header-title">{title}</h2>
          {description && <p className="ui-page-header-description">{description}</p>}
        </div>
        {actions && <div className="ui-page-header-actions">{actions}</div>}
      </header>
    );
  }
);
PageHeader.displayName = 'PageHeader';
