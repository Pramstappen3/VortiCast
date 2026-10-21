import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'slate' | 'amber' | 'rose' | 'emerald' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  className,
  dot = false,
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-700/50',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
    purple: 'bg-purple-950/60 text-purple-300 border-purple-700/50',
  };

  const dotColors = {
    cyan: 'bg-cyan-400',
    slate: 'bg-slate-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    emerald: 'bg-emerald-400',
    purple: 'bg-purple-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', dotColors[variant])} />}
      {children}
    </span>
  );
};
