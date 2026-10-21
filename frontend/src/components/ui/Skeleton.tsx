import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-800/60 border border-slate-700/20',
        className
      )}
    />
  );
};
