import React, { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '../services/api';
import { Extension, Pagination } from '../types/api';
import { ExtensionCard } from '../components/ExtensionCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List as ListIcon,
  Package,
  AlertCircle,
  X,
  User as UserIcon,
} from 'lucide-react';

interface ExplorePageProps {
  initialQuery?: string;
  onNavigate: (route: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ initialQuery = '', onNavigate }) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ nextCursor: null, hasMore: false });
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState<number>(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExtensions = useCallback(async (searchQ: string, cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (searchQ.trim()) {
        res = await api.searchExtensions(searchQ.trim(), { cursor, limit });
      } else {
        res = await api.getExtensions({ cursor, limit });
      }
      setExtensions(res.data || []);
      setPagination(res.pagination || { nextCursor: null, hasMore: false });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load extensions';
      setError(msg);
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    setCurrentCursor(undefined);
    setCursorHistory([]);
    fetchExtensions(activeQuery, undefined);
  }, [activeQuery, limit, fetchExtensions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(query);
  };

  const handleClearSearch = () => {
    setQuery('');
    setActiveQuery('');
  };

  const handleNextPage = () => {
    if (pagination.nextCursor) {
      setCursorHistory((prev) => [...prev, currentCursor || '']);
      setCurrentCursor(pagination.nextCursor);
      fetchExtensions(activeQuery, pagination.nextCursor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prevHistory = [...cursorHistory];
      const prevCursor = prevHistory.pop();
      setCursorHistory(prevHistory);
      const targetCursor = prevCursor || undefined;
      setCurrentCursor(targetCursor);
      fetchExtensions(activeQuery, targetCursor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Explore Twext Extensions
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Browse published packages, search community authors, or discover newly submitted TurboWarp plugins.
          </p>
        </div>

        {/* View Switcher & Limit */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-[4px] bg-white dark:bg-[#181822] p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-[3px] text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-[3px] text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Per page:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1 bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-700 rounded-[4px] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#7b42bc]"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 p-3 rounded-[6px] transition-colors">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by extension title, namespace, author, or keywords..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-50 dark:bg-[#131319] border border-zinc-200 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-[#1a1a24] focus:outline-none focus:border-[#7b42bc] dark:focus:border-[#9f75cd]"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-medium rounded-[4px] transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {activeQuery && (
          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>
              Showing results for: <strong className="text-zinc-900 dark:text-zinc-200">"{activeQuery}"</strong>
            </span>
            <button
              onClick={handleClearSearch}
              className="text-[#7b42bc] dark:text-[#be98f7] hover:underline text-[11px]"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Error notification */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 p-4 rounded-[6px] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Extensions Listing */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-zinc-100 dark:bg-zinc-800/50 rounded-[6px] animate-pulse border border-zinc-200 dark:border-zinc-800" />
          ))}
        </div>
      ) : extensions.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extensions.map((ext) => (
              <ExtensionCard
                key={`${ext.namespace}/${ext.id}`}
                extension={ext}
                onClick={() => onNavigate(`ext/${ext.namespace}/${ext.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] divide-y divide-zinc-200 dark:divide-zinc-800 transition-colors">
            {extensions.map((ext) => {
              const authorNamespace =
                typeof ext.author === 'object' && ext.author !== null
                  ? ext.author.namespace
                  : ext.author || ext.namespace;
              const authorDisplayName =
                typeof ext.author === 'object' && ext.author !== null
                  ? ext.author.displayName || authorNamespace
                  : authorNamespace;
              const version = ext.latestVersion || (ext.versions && ext.versions[0]?.version) || '1.0.0';

              return (
                <div
                  key={`${ext.namespace}/${ext.id}`}
                  onClick={() => onNavigate(`ext/${ext.namespace}/${ext.id}`)}
                  className="p-4 hover:bg-zinc-50 dark:hover:bg-[#20202c] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        @{ext.namespace}/{ext.id}
                      </span>
                      <StatusBadge status={ext.status || 'published'} size="sm" />
                      <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded-[4px] border border-zinc-200 dark:border-zinc-700">
                        v{version}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-[#7b42bc] dark:hover:text-[#be98f7]">
                      {ext.name}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                      {ext.shortDescription || ext.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-700 dark:text-zinc-300">{authorDisplayName}</span>
                    </div>
                    <span className="text-[#7b42bc] dark:text-[#be98f7] font-medium hover:underline">
                      View →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-12 text-center space-y-3 transition-colors">
          <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {activeQuery ? `No extensions matching "${activeQuery}"` : 'No extensions found'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {activeQuery
              ? 'Try checking for typos or searching with broader keywords.'
              : 'The registry currently has no published extensions listed. You can publish the first!'}
          </p>
          {activeQuery && (
            <button
              onClick={handleClearSearch}
              className="mt-2 text-xs font-semibold text-[#7b42bc] dark:text-[#be98f7] hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs">
        <div>
          {cursorHistory.length > 0 && (
            <span className="text-zinc-500 dark:text-zinc-400">Page {cursorHistory.length + 1}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={cursorHistory.length === 0 || loading}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleNextPage}
            disabled={!pagination.hasMore || loading}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
