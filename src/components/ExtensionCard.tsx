import React from 'react';
import { Extension } from '../types/api';
import { StatusBadge } from './StatusBadge';
import { Package, User as UserIcon, ArrowUpRight } from 'lucide-react';

interface ExtensionCardProps {
  extension: Extension;
  onClick?: () => void;
}

export const ExtensionCard: React.FC<ExtensionCardProps> = ({ extension, onClick }) => {
  const authorNamespace =
    typeof extension.author === 'object' && extension.author !== null
      ? extension.author.namespace
      : extension.author || extension.namespace;

  const authorDisplayName =
    typeof extension.author === 'object' && extension.author !== null
      ? extension.author.displayName || authorNamespace
      : authorNamespace;

  const version =
    extension.latestVersion || (extension.versions && extension.versions[0]?.version) || '1.0.0';
  const status = extension.status || 'published';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 hover:border-[#7b42bc] dark:hover:border-[#9f75cd] hover:bg-zinc-50/50 dark:hover:bg-[#1f1f2c] transition-colors p-5 rounded-[6px] flex flex-col justify-between text-left cursor-pointer select-none group"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-[#f6f2fc] dark:bg-[#281e3a] border border-[#e4d6f7] dark:border-[#432d66] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-[#7b42bc] dark:text-[#be98f7]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>@{extension.namespace}</span>
                <span>/</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {extension.id}
                </span>
              </div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#7b42bc] dark:group-hover:text-[#be98f7] transition-colors leading-tight">
                {extension.name}
              </h4>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusBadge status={status} size="sm" />
            <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded-[4px] border border-zinc-200 dark:border-zinc-700">
              v{version}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
          {extension.shortDescription || extension.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{authorDisplayName}</span>
        </div>

        <span className="inline-flex items-center gap-1 text-[#7b42bc] dark:text-[#be98f7] font-medium text-xs group-hover:underline">
          View details
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
