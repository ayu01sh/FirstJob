import React from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import './Select.css';
import './Input.css'; // Reuse input-wrapper styles

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      id,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || Math.random().toString(36).substr(2, 9);
    
    return (
      <div
        className={clsx('input-wrapper', {
          'input-error': !!error,
        })}
      >
        {label && (
          <label htmlFor={selectId} className="input-label">
            {label}
          </label>
        )}
        
        <div className="select-wrapper">
          <select
            id={selectId}
            ref={ref}
            className={clsx('select-field', className)}
            disabled={disabled}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="select-icon" size={18} />
        </div>
        
        {error ? (
          <span className="input-message input-message-error">{error}</span>
        ) : helperText ? (
          <span className="input-message">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
