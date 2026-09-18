import React from 'react';
import { ModerationStatus } from '../types/api';
import { AlertCircle, CheckCircle2, Clock, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status?: ModerationStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'published', size = 'sm' }) => {
  const styles: Record<
    ModerationStatus,
    { bg: string; text: string; border: string; label: string; icon: React.ReactNode }
  > = {
    published: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      label: 'Published',
      icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    pending: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800/60',
      label: 'Pending Review',
      icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    yanked: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800/60',
      label: 'Yanked',
      icon: <Ban className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    rejected: {
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-700 dark:text-zinc-300',
      border: 'border-zinc-300 dark:border-zinc-700',
      label: 'Rejected',
      icon: <AlertCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
  };

  const current = styles[status] || styles.published;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-[4px] border ${current.bg} ${current.text} ${current.border} ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
      }`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};
