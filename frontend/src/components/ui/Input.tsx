import React from 'react';
import clsx from 'clsx';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      success,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || Math.random().toString(36).substr(2, 9);
    
    return (
      <div
        className={clsx('input-wrapper', {
          'input-error': !!error,
          'input-success': !!success && !error,
          'input-has-left-icon': !!leftIcon,
          'input-has-right-icon': !!rightIcon,
        })}
      >
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        
        <div className="input-container">
          {leftIcon && <span className="input-icon input-icon-left">{leftIcon}</span>}
          
          <input
            id={inputId}
            ref={ref}
            className={clsx('input-field', className)}
            disabled={disabled}
            {...props}
          />
          
          {rightIcon && <span className="input-icon input-icon-right">{rightIcon}</span>}
        </div>
        
        {error ? (
          <span className="input-message input-message-error">{error}</span>
        ) : success ? (
          <span className="input-message input-message-success">{success}</span>
        ) : helperText ? (
          <span className="input-message">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
