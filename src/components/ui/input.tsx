'use client';
import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'block w-full rounded-lg border border-blue-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-base text-blue-900 dark:text-blue-200 placeholder:text-blue-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 shadow-sm',
          'hover:border-pink-400 dark:hover:border-pink-400',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };