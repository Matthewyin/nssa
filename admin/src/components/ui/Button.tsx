import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ];

    const variantClasses = {
      primary: [
        'bg-apple-blue text-white hover:bg-apple-blue-dark',
        'focus:ring-apple-blue shadow-sm',
      ],
      secondary: [
        'bg-gray-200 text-gray-900 hover:bg-gray-300',
        'focus:ring-gray-500 shadow-sm',
      ],
      danger: [
        'bg-red-600 text-white hover:bg-red-700',
        'focus:ring-red-500 shadow-sm',
      ],
      ghost: [
        'bg-transparent text-gray-700 hover:bg-gray-100',
        'focus:ring-gray-500',
      ],
      outline: [
        'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
        'focus:ring-apple-blue shadow-sm',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const iconClasses = {
      sm: 'h-4 w-4',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <div
            className={cn(
              'loading-spinner mr-2',
              iconClasses[size]
            )}
          />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className={cn('mr-2', iconClasses[size])}>
            {icon}
          </span>
        )}
        
        {children}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className={cn('ml-2', iconClasses[size])}>
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
