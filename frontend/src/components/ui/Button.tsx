import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold shadow-glow-cyan focus:ring-2 focus:ring-cyan-400',
    secondary: 'bg-navy-800 hover:bg-navy-700 text-slate-100 border border-slate-700/80 focus:ring-2 focus:ring-cyan-500/50',
    outline: 'border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 bg-transparent',
    ghost: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 bg-transparent',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-150 outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
