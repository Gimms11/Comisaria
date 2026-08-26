import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'urgent' | 'warning' | 'success' | 'info' | 'outline' | 'purple';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  pulse = false,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    urgent: 'bg-red-500/20 text-red-400 border-red-500/40',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    info: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    outline: 'border border-slate-600 text-slate-300 bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        variants[variant],
        pulse && 'radar-emergency',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
