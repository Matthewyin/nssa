import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'error';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = error || variant === 'error';

    const baseClasses = [
      'block w-full px-3 py-2 text-sm border rounded-lg bg-white',
      'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
      'transition-colors duration-200',
    ];

    const variantClasses = {
      default: [
        'border-gray-300 focus:ring-apple-blue focus:border-transparent',
      ],
      error: [
        'border-red-300 focus:ring-red-500 focus:border-transparent',
      ],
    };

    const iconClasses = 'h-4 w-4 text-gray-400';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className={iconClasses}>{leftIcon}</span>
            </div>
          )}
          
          <input
            type={type}
            id={inputId}
            className={cn(
              baseClasses,
              variantClasses[hasError ? 'error' : 'default'],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className={iconClasses}>{rightIcon}</span>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1 text-sm',
              error ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
