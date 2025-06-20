'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { Label } from './label';

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  return {
    name: fieldContext.name,
    ...fieldState,
  };
};

// Remove all inline 'export function' and use only one export block at the end

function AppForm({ children, className, form, ...rest }: { children: React.ReactNode; className?: string; form: any } & React.ComponentProps<'form'>) {
  return (
    <FormProvider {...form}>
      <form
        className={cn('space-y-6', className)}
        autoComplete="off"
        {...rest}
      >
        {children}
      </form>
    </FormProvider>
  );
}

function AppFormItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mb-2 rounded-lg bg-gradient-to-r from-blue-50 via-pink-50 to-yellow-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 p-3',
        className
      )}
      {...props}
    />
  );
}

function AppFormLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-base font-semibold mb-1', className)}
      {...props}
    />
  );
}

function AppFormControl({ ...props }: React.ComponentPropsWithoutRef<typeof Slot>) {
  const { error, name } = useFormField();
  return <Slot id={name} aria-invalid={!!error} {...props} />;
}
AppFormControl.displayName = 'AppFormControl';

function AppFormMessage({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { error } = useFormField();
  const body = error ? String(error?.message) : props.children;
  if (!body) {
    return null;
  }
  return (
    <div className={cn('text-xs text-red-600 mt-1', className)} {...props}>
      {body}
    </div>
  );
}
AppFormMessage.displayName = 'AppFormMessage';

export {
  useFormField,
  AppForm,
  AppFormItem,
  AppFormLabel,
  AppFormControl,
  AppFormMessage,
  FormField,
};