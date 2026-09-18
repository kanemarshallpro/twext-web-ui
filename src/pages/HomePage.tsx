import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { Extension, InstanceStats } from '../types/api';
import { ExtensionCard } from '../components/ExtensionCard';
import {
  Search,
  ArrowRight,
  Package,
  Users,
  Clock,
  Sparkles,
  Terminal,
  Upload,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<InstanceStats | null>(null);
  const [recentExtensions, setRecentExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadHomeData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, extensionsData] = await Promise.all([
          api.getStats().catch(() => ({ published: 0, pending: 0, authors: 0 })),
          api.getExtensions({ limit: 6 }).catch(() => ({ data: [], pagination: { nextCursor: null, hasMore: false } })),
        ]);

        if (isMounted) {
          setStats(statsData);
          setRecentExtensions(extensionsData.data || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof ApiError ? err.message : 'Failed to connect to Twext server';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('search');
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="bg-white dark:bg-[#15151c] border-b border-zinc-200 dark:border-zinc-800 py-14 sm:py-20 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f6f2fc] dark:bg-[#251e33] border border-[#e4d6f7] dark:border-[#432d66] text-[#7b42bc] dark:text-[#be98f7] text-xs font-semibold rounded-[4px]">
            <Sparkles className="w-3.5 h-3.5 text-[#7b42bc] dark:text-[#be98f7]" />
            <span>The TurboWarp Extension Registry</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
            Discover & publish <span className="text-[#7b42bc] dark:text-[#9f75cd]">Twext</span> extensions.
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The community directory for extensions compiled with the zero-config Twext compiler. Search published packages, inspect manifests, or publish your own in seconds.
          </p>

          {/* Prominent Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-2">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-white dark:bg-[#1a1a24] p-1.5 border border-zinc-300 dark:border-zinc-700 rounded-[6px] focus-within:border-[#7b42bc] dark:focus-within:border-[#9f75cd] transition-colors">
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, namespace, or keyword (e.g. gamepad, physics, fetch)..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white font-medium text-sm rounded-[4px] transition-colors flex items-center justify-center gap-2 shrink-0 select-none"
              >
                <span>Search Twexts</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-2.5">
              <span>Quick tags:</span>
              <button
                type="button"
                onClick={() => onNavigate('search?q=utilities')}
                className="hover:text-[#7b42bc] dark:hover:text-[#be98f7] hover:underline"
              >
                utilities
              </button>
              <button
                type="button"
                onClick={() => onNavigate('search?q=gamepad')}
                className="hover:text-[#7b42bc] dark:hover:text-[#be98f7] hover:underline"
              >
                gamepad
              </button>
              <button
                type="button"
                onClick={() => onNavigate('search?q=audio')}
                className="hover:text-[#7b42bc] dark:hover:text-[#be98f7] hover:underline"
              >
                audio
              </button>
              <button
                type="button"
                onClick={() => onNavigate('search')}
                className="text-[#7b42bc] dark:text-[#be98f7] font-medium hover:underline"
              >
                Browse all →
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Instance-wide stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 p-5 rounded-[6px] flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-[4px] flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                {stats ? stats.published : '—'}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Published Extensions
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 p-5 rounded-[6px] flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 bg-[#f6f2fc] dark:bg-[#281e3a] border border-[#e4d6f7] dark:border-[#432d66] rounded-[4px] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-[#7b42bc] dark:text-[#be98f7]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                {stats ? stats.authors : '—'}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Registered Authors
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 p-5 rounded-[6px] flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-[4px] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                {stats ? stats.pending : '—'}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Pending Moderation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Error state if server unreachable */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 p-4 rounded-[6px] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <strong>Registry status notice:</strong> {error}
              <p className="mt-1 text-rose-700 dark:text-rose-300">
                You can configure the API endpoint URL or check server connectivity using the server button in the top right.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recently Published Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Recently Published</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Latest extension releases verified on the Twext registry.
            </p>
          </div>
          <button
            onClick={() => onNavigate('search')}
            className="text-xs font-semibold text-[#7b42bc] dark:text-[#be98f7] hover:text-[#6935a3] dark:hover:text-[#a57de0] flex items-center gap-1 hover:underline"
          >
            <span>View all extensions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-[6px] animate-pulse p-5"
              />
            ))}
          </div>
        ) : recentExtensions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentExtensions.map((ext) => (
              <ExtensionCard
                key={`${ext.namespace}/${ext.id}`}
                extension={ext}
                onClick={() => onNavigate(`ext/${ext.namespace}/${ext.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-10 text-center space-y-3 transition-colors">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No extensions published yet</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Be the first to publish a Twext TurboWarp extension on this instance using the Twext CLI or our web publisher.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('publish')}
                className="px-4 py-1.5 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-medium rounded-[4px] flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Publish an Extension
              </button>
              <button
                onClick={() => onNavigate('search')}
                className="px-4 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium rounded-[4px] flex items-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Browse Extensions
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Two-column Feature & Workflow Information */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 p-6 rounded-[6px] space-y-4 transition-colors">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
              <Terminal className="w-4 h-4 text-[#7b42bc] dark:text-[#be98f7]" />
              <h3>How to Publish with Twext CLI</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Twext extensions are compiled locally with the Twext tooling and uploaded using standard registry commands:
            </p>
            <div className="bg-zinc-950 text-zinc-100 p-3.5 rounded-[4px] font-mono text-xs space-y-2 border border-zinc-800 dark:border-zinc-900">
              <div className="text-zinc-400"># Authenticate with Twext</div>
              <div className="text-emerald-400">twext login</div>
              <div className="text-zinc-400 mt-2"># Compile & submit extension</div>
              <div className="text-emerald-400">twext publish</div>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              New publishers’ first submissions are reviewed by an administrator before appearing publicly.
            </p>
          </div>

          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 p-6 rounded-[6px] space-y-4 transition-colors">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
              <Package className="w-4 h-4 text-[#7b42bc] dark:text-[#be98f7]" />
              <h3>How to Install in TurboWarp</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Load extensions instantly in the TurboWarp editor using the public URL or load in your project:
            </p>
            <div className="bg-zinc-50 dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-[4px] text-xs space-y-2 font-mono">
              <div className="text-zinc-600 dark:text-zinc-400 font-sans text-[11px]">
                1. Open TurboWarp → <strong>Add Extension</strong> → <strong>Custom Extension</strong>
              </div>
              <div className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-[#181820] p-2 border border-zinc-200 dark:border-zinc-700/80 rounded-[3px] break-all select-all text-[11px]">
                https://twexts.sdisk.us/api/v0/extensions/{'{namespace}'}/{'{id}'}
              </div>
            </div>
            <div className="pt-1">
              <a
                href="https://turbowarp.org/editor"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#7b42bc] dark:text-[#be98f7] hover:underline inline-flex items-center gap-1"
              >
                Open TurboWarp Editor <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
