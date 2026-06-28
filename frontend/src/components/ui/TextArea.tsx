import React from 'react';
import clsx from 'clsx';
import './TextArea.css';
import './Input.css'; // Reuse input-wrapper styles

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
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
        })}
      >
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        
        <textarea
          id={inputId}
          ref={ref}
          className={clsx('textarea-field', className)}
          disabled={disabled}
          {...props}
        />
        
        {error ? (
          <span className="input-message input-message-error">{error}</span>
        ) : helperText ? (
          <span className="input-message">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
