'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          'flex items-center gap-3 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            disabled={disabled}
            {...props}
          />
          <div
            className={cn(
              'w-11 h-6 bg-zinc-700 rounded-full',
              'peer-checked:bg-blue-600',
              'peer-focus:ring-2 peer-focus:ring-blue-500/50',
              'transition-colors duration-200'
            )}
          />
          <div
            className={cn(
              'absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-md',
              'peer-checked:translate-x-[-20px]',
              'transition-transform duration-200'
            )}
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium text-white">{label}</span>}
            {description && <span className="text-xs text-zinc-400">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
