import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { Extension } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { MarkdownView } from '../components/MarkdownView';
import {
  Package,
  User as UserIcon,
  Copy,
  Check,
  Calendar,
  Clock,
  ArrowLeft,
  ExternalLink,
  Terminal,
  FileCode,
  AlertTriangle,
} from 'lucide-react';

interface ExtensionDetailPageProps {
  namespace: string;
  id: string;
  onNavigate: (route: string) => void;
}

export const ExtensionDetailPage: React.FC<ExtensionDetailPageProps> = ({
  namespace,
  id,
  onNavigate,
}) => {
  const [extension, setExtension] = useState<Extension | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'url' | 'cli' | null>(null);
  const [activeTab, setActiveTab] = useState<'readme' | 'versions'>('readme');

  useEffect(() => {
    let isMounted = true;
    const fetchExtension = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getExtension(namespace, id);
        if (isMounted) {
          setExtension(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof ApiError ? err.message : 'Failed to load extension details';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchExtension();
    return () => {
      isMounted = false;
    };
  }, [namespace, id]);

  const authorNamespace =
    typeof extension?.author === 'object' && extension.author !== null
      ? extension.author.namespace
      : extension?.author || extension?.namespace || namespace;

  const authorDisplayName =
    typeof extension?.author === 'object' && extension.author !== null
      ? extension.author.displayName || authorNamespace
      : authorNamespace;

  const latestVersion =
    extension?.latestVersion ||
    (extension?.versions && extension.versions[0]?.version) ||
    '1.0.0';

  const moderationStatus = extension?.status || 'published';
  const isPending = moderationStatus === 'pending';

  const installUrl = `${api.getBaseUrl()}/extensions/${namespace}/${id}`;
  const cliInstallCommand = `twext add @${namespace}/${id}`;

  const handleCopy = (text: string, type: 'url' | 'cli') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-32 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[6px] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[6px] animate-pulse" />
          <div className="h-64 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[6px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !extension) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Extension Not Found</h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          {error || `The extension @${namespace}/${id} could not be located on this Twext instance.`}
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('search')}
            className="px-4 py-2 bg-[#7b42bc] dark:bg-[#8e52d6] text-white text-xs font-medium rounded-[4px] hover:bg-[#6935a3]"
          >
            ← Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate('search')}
        className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to search results
      </button>

      {/* Moderation Warning if Pending */}
      {isPending && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-[6px] p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-sm">Pending Moderation Review</strong>
            <p className="mt-0.5 leading-relaxed text-amber-800 dark:text-amber-300">
              This extension (or its latest version) is currently awaiting review by a Twext administrator. It is accessible directly via its URL, but will not appear in the general public registry search until approved.
            </p>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 bg-[#f6f2fc] dark:bg-[#281e3a] border border-[#e4d6f7] dark:border-[#432d66] rounded-[6px] flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-[#7b42bc] dark:text-[#be98f7]" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                <span>@{extension.namespace}</span>
                <span>/</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{extension.id}</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{extension.name}</h1>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                {extension.shortDescription || extension.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Badges & Meta */}
          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <StatusBadge status={moderationStatus} size="md" />
              <span className="font-mono text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-1 rounded-[4px] border border-zinc-200 dark:border-zinc-700">
                v{latestVersion}
              </span>
            </div>
            {extension.updatedAt && (
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Updated {new Date(extension.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Main Content & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Readme & Versions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab buttons */}
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#181822] px-4 rounded-t-[6px] border-t border-x transition-colors">
            <button
              onClick={() => setActiveTab('readme')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'readme'
                  ? 'border-[#7b42bc] text-[#7b42bc] dark:text-[#be98f7] dark:border-[#be98f7]'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <FileCode className="w-4 h-4" />
              Overview & README
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'versions'
                  ? 'border-[#7b42bc] text-[#7b42bc] dark:text-[#be98f7] dark:border-[#be98f7]'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              Version History ({extension.versions?.length || 1})
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-b-[6px] p-6 min-h-[320px] transition-colors">
            {activeTab === 'readme' ? (
              extension.readme ? (
                <MarkdownView content={extension.readme} />
              ) : (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 space-y-2">
                  <FileCode className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600" />
                  <p className="text-xs">No README file provided for this extension.</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Extension authors can include a markdown README when publishing with Twext CLI.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">All Releases</h3>
                {extension.versions && extension.versions.length > 0 ? (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[4px]">
                    {extension.versions.map((ver) => (
                      <div
                        key={ver.version}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#181822]"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              v{ver.version}
                            </span>
                            <StatusBadge status={ver.status} size="sm" />
                          </div>
                          {ver.changelog && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{ver.changelog}</p>
                          )}
                        </div>

                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
                          {ver.createdAt ? new Date(ver.createdAt).toLocaleDateString() : 'Initial release'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-[4px] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        v{latestVersion}
                      </span>
                      <StatusBadge status={moderationStatus} size="sm" />
                    </div>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Current version</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Install snippets & Author Details */}
        <div className="space-y-6">
          {/* TurboWarp Installation Snippet */}
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 space-y-4 transition-colors">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#7b42bc] dark:text-[#be98f7]" />
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Load in TurboWarp
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Paste this URL into TurboWarp under <strong>Add Extension → Custom Extension</strong>:
            </p>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={installUrl}
                className="w-full pl-3 pr-9 py-2 text-xs font-mono bg-zinc-50 dark:bg-[#131319] border border-zinc-200 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 select-all focus:outline-none focus:border-[#7b42bc]"
              />
              <button
                onClick={() => handleCopy(installUrl, 'url')}
                className="absolute right-1.5 top-1.5 p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-[3px] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="Copy URL"
              >
                {copiedType === 'url' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="pt-1">
              <a
                href={`https://turbowarp.org/editor?extension=${encodeURIComponent(installUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-medium rounded-[4px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open directly in TurboWarp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Twext CLI Installation Snippet */}
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 space-y-4 transition-colors">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Twext CLI Install
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Add to your Twext project dependencies:
            </p>
            <div className="relative bg-zinc-950 dark:bg-black text-zinc-100 p-3 rounded-[4px] font-mono text-xs border border-zinc-800">
              <code>{cliInstallCommand}</code>
              <button
                onClick={() => handleCopy(cliInstallCommand, 'cli')}
                className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-white rounded-[3px] hover:bg-zinc-800 transition-colors"
                title="Copy command"
              >
                {copiedType === 'cli' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Author Card */}
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 space-y-3 transition-colors">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Author
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f6f2fc] dark:bg-[#281e3a] border border-[#e4d6f7] dark:border-[#432d66] flex items-center justify-center text-[#7b42bc] dark:text-[#be98f7] font-bold text-sm">
                {authorDisplayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{authorDisplayName}</h4>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">@{authorNamespace}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => onNavigate(`search?q=${encodeURIComponent(authorNamespace)}`)}
                className="text-xs text-[#7b42bc] dark:text-[#be98f7] hover:underline font-medium flex items-center gap-1"
              >
                <UserIcon className="w-3.5 h-3.5" />
                View all packages by @{authorNamespace}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
