import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { PrivacyDoc } from '../types/api';
import { MarkdownView } from '../components/MarkdownView';
import { Shield, Calendar, AlertCircle } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  const [privacy, setPrivacy] = useState<PrivacyDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPrivacy = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPrivacy();
        if (isMounted) {
          setPrivacy(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof ApiError ? err.message : 'Failed to load Privacy Policy from server';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPrivacy();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#7b42bc] dark:text-[#be98f7]" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Privacy Policy</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          {privacy && (
            <>
              <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300">
                Version {privacy.version}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Last Updated {new Date(privacy.updatedAt).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Document Content */}
      <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-6 sm:p-8 min-h-[400px] transition-colors">
        {loading ? (
          <div className="space-y-4">
            <div className="h-6 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-xs text-rose-600 dark:text-rose-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : privacy ? (
          <MarkdownView content={privacy.body} />
        ) : null}
      </div>
    </div>
  );
};
