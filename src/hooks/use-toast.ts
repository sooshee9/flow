'use client';

import { useCallback, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../src/lib/utils';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ToastProps extends VariantProps<typeof toastVariants> {
  id: string;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export type ToastOptions = Omit<ToastProps, 'id'>;

let toastId = 0;

function genId() {
  return (toastId++).toString();
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback(
    ({ variant, title, description, action, ...props }: ToastOptions) => {
      const id = genId();

      setToasts((currentToasts) => [
        ...currentToasts,
        { id, variant, title, description, action, ...props },
      ]);

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const update = useCallback(
    (id: string, { variant, title, description, action, ...props }: ToastOptions) => {
      setToasts((currentToasts) =>
        currentToasts.map((toast) =>
          toast.id === id ? { ...toast, variant, title, description, action, ...props } : toast
        )
      );
    },
    []
  );

  return {
    toast,
    dismiss,
    update,
    toasts,
  };
}

export { toastVariants };