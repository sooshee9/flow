'use client';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';
import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', ...props },
    ref
  ) => {
    let base =
      'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    let variantClass = '';
    switch (variant) {
      case 'primary':
        variantClass =
          'bg-gradient-to-r from-blue-500 via-pink-500 to-yellow-500 text-white shadow-lg rounded-lg hover:from-blue-600 hover:via-pink-600 hover:to-yellow-600';
        break;
      case 'secondary':
        variantClass =
          'bg-gradient-to-r from-blue-200 via-pink-200 to-yellow-200 text-blue-900 dark:text-blue-200 rounded-lg hover:from-blue-300 hover:via-pink-300 hover:to-yellow-300';
        break;
      case 'destructive':
        variantClass =
          'bg-red-600 text-white rounded-lg hover:bg-red-700';
        break;
      case 'ghost':
        variantClass =
          'bg-transparent text-primary hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg';
        break;
      case 'outline':
        variantClass =
          'border border-blue-400 text-blue-700 dark:text-blue-300 bg-white dark:bg-zinc-900 rounded-lg hover:bg-blue-50 dark:hover:bg-zinc-800';
        break;
      default:
        variantClass = '';
    }
    let sizeClass = '';
    switch (size) {
      case 'sm':
        sizeClass = 'px-3 py-1.5 text-sm';
        break;
      case 'lg':
        sizeClass = 'px-6 py-3 text-lg';
        break;
      default:
        sizeClass = 'px-4 py-2 text-base';
    }
    return (
      <button
        ref={ref}
        className={cn(base, variantClass, sizeClass, className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// Add this export for use in other components (e.g., calendar)
export const buttonVariants = ({
  variant = 'primary',
  size = 'md',
}: { variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline'; size?: 'sm' | 'md' | 'lg' }) => {
  let base =
    'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  let variantClass = '';
  switch (variant) {
    case 'primary':
      variantClass =
        'bg-gradient-to-r from-blue-500 via-pink-500 to-yellow-500 text-white shadow-lg rounded-lg hover:from-blue-600 hover:via-pink-600 hover:to-yellow-600';
      break;
    case 'secondary':
      variantClass =
        'bg-gradient-to-r from-blue-200 via-pink-200 to-yellow-200 text-blue-900 dark:text-blue-200 rounded-lg hover:from-blue-300 hover:via-pink-300 hover:to-yellow-300';
      break;
    case 'destructive':
      variantClass =
        'bg-red-600 text-white rounded-lg hover:bg-red-700';
      break;
    case 'ghost':
      variantClass =
        'bg-transparent text-primary hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg';
      break;
    case 'outline':
      variantClass =
        'border border-blue-400 text-blue-700 dark:text-blue-300 bg-white dark:bg-zinc-900 rounded-lg hover:bg-blue-50 dark:hover:bg-zinc-800';
      break;
    default:
      variantClass = '';
  }
  let sizeClass = '';
  switch (size) {
    case 'sm':
      sizeClass = 'px-3 py-1.5 text-sm';
      break;
    case 'lg':
      sizeClass = 'px-6 py-3 text-lg';
      break;
    default:
      sizeClass = 'px-4 py-2 text-base';
  }
  return cn(base, variantClass, sizeClass);
};