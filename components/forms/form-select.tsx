'use client';

import { SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options?: { value: string; label: string }[];
  error?: string;
  children?: ReactNode;
}

export function FormSelect({
  label,
  options,
  error,
  className,
  children,
  ...props
}: FormSelectProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        className={cn(
          'w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors',
          'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      >
        {children ? children : (
          <>
            <option value="">Seleccionar...</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
