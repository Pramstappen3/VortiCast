import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'panel' | 'subtle' | 'interactive';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'panel',
  ...props
}) => {
  const variantStyles = {
    panel: 'bg-navy-900 border border-slate-800/80 shadow-panel rounded-xl',
    subtle: 'bg-navy-950/60 border border-slate-800/50 rounded-lg',
    interactive: 'bg-navy-900 border border-slate-800 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer rounded-xl',
  };

  return (
    <div className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, icon, className }) => (
  <div className={cn('flex items-center justify-between border-b border-slate-800/70 px-5 py-4', className)}>
    <div className="flex items-center gap-3">
      {icon && <div className="text-cyan-400 flex items-center justify-center">{icon}</div>}
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('p-5', className)}>{children}</div>;
