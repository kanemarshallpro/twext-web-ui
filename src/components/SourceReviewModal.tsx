import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../services/api';
import { PendingVersion } from '../types/api';
import {
  Check,
  CheckCircle2,
  Copy,
  FileCode,
  FileJson,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';

interface SourceReviewModalProps {
  item: PendingVersion;
  onClose: () => void;
  onApprove: (item: PendingVersion) => void;
  onReject: (item: PendingVersion) => void;
}

type SourceTab = 'manifest' | 'code';

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function buildManifest(item: PendingVersion): Record<string, unknown> {
  const manifest: Record<string, unknown> = {
    id: item.id,
    name: item.name,
    version: item.version,
  };
  if (item.license) manifest.license = item.license;
  if (item.description) manifest.description = item.description;
  if (item.author) manifest.author = item.author;
  return manifest;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

function CodeEditor({ value, onChange, label }: CodeEditorProps) {
  const lineCount = value ? value.split('\n').length : 1;
  const longestLine = useMemo(() => {
    let longest = 1;
    for (const line of value.split('\n')) longest = Math.max(longest, line.length);
    return longest;
  }, [value]);

  return (
    <div className="overflow-auto bg-[#0d0d13] border border-zinc-800 rounded-[4px] font-mono text-xs leading-5" style={{ maxHeight: '52vh' }}>
      <div className="flex items-stretch">
        <div
          aria-hidden="true"
          className="shrink-0 select-none text-right text-zinc-600 bg-zinc-900/60 border-r border-zinc-800 px-2 py-2 leading-5"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="flex-1 resize-none bg-transparent text-zinc-100 outline-none px-2 py-2 leading-5 whitespace-pre"
          style={{ minWidth: `${Math.max(longestLine + 4, 60)}ch`, tabSize: 2 }}
        />
      </div>
    </div>
  );
}

export const SourceReviewModal: React.FC<SourceReviewModalProps> = ({
  item,
  onClose,
  onApprove,
  onReject,
}) => {
  const [activeTab, setActiveTab] = useState<SourceTab>('manifest');
  const [manifestText, setManifestText] = useState(() =>
    JSON.stringify(buildManifest(item), null, 2),
  );
  const [codeText, setCodeText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeUnavailable, setCodeUnavailable] = useState(false);
  const [copied, setCopied] = useState<SourceTab | null>(null);

  const ns = item.ownerNamespace || item.namespace;

  const loadCode = useCallback(async () => {
    setIsLoading(true);
    setCodeError(null);
    setCodeUnavailable(false);
    try {
      const code = await api.downloadVersion(ns, item.id, item.version);
      setCodeText(code);
    } catch (err: unknown) {
      setCodeError(errorMessage(err, 'Failed to load extension.js.'));
      setCodeUnavailable(err instanceof ApiError && err.status === 404);
    } finally {
      setIsLoading(false);
    }
  }, [ns, item.id, item.version]);

  useEffect(() => {
    void loadCode();
  }, [loadCode]);

  const manifestParse = useMemo(() => {
    if (!manifestText.trim()) return { ok: false as const, message: 'manifest.json is empty.' };
    try {
      const parsed = JSON.parse(manifestText);
      if (typeof parsed !== 'object' || parsed === null) {
        return { ok: false as const, message: 'Manifest must be a valid JSON object.' };
      }
      return { ok: true as const, message: `Valid manifest (${Object.keys(parsed).length} fields)` };
    } catch (err: unknown) {
      return { ok: false as const, message: errorMessage(err, 'Invalid JSON') };
    }
  }, [manifestText]);

  const activeText = activeTab === 'manifest' ? manifestText : codeText;
  const activeError = activeTab === 'manifest' ? null : codeError;
  const lineCount = activeText ? activeText.split('\n').length : 0;
  const sizeKb = activeText ? (new Blob([activeText]).size / 1024).toFixed(1) : '0.0';

  const handleCopy = (tab: SourceTab) => {
    navigator.clipboard?.writeText(activeText);
    setCopied(tab);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded-[8px] w-full max-w-6xl flex flex-col overflow-hidden shadow-xl max-h-[94vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {item.name || item.id}
              </h2>
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                @{ns}/{item.id}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-[#f6f2fc] dark:bg-[#281e3a] text-[#7b42bc] dark:text-[#be98f7] border border-[#e4d6f7] dark:border-[#432d66] rounded-[3px]">
                v{item.version}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Source review — inspect the manifest and compiled JavaScript before approving.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors shrink-0"
            aria-label="Close source review"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 bg-zinc-50 dark:bg-[#12121a] border-b border-zinc-200 dark:border-zinc-800 text-[11px]">
          {item.description && (
            <span className="text-zinc-600 dark:text-zinc-400 line-clamp-1 max-w-xl">
              {item.description}
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto text-zinc-500 dark:text-zinc-400 shrink-0">
            {item.license && (
              <span className="px-1.5 py-0.5 uppercase font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
                {item.license}
              </span>
            )}
            <span>
              by <strong className="text-zinc-700 dark:text-zinc-300">@{ns}</strong>
            </span>
            {item.createdAt && <span>• {new Date(item.createdAt).toLocaleString()}</span>}
          </div>
        </div>

        {/* Editor file tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#12121a]">
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-4 py-2 text-xs font-semibold border-r border-zinc-200 dark:border-zinc-800 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'manifest'
                ? 'border-b-[#7b42bc] dark:border-b-[#be98f7] text-[#7b42bc] dark:text-[#be98f7] bg-white dark:bg-[#15151c]'
                : 'border-b-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>manifest.json</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 text-xs font-semibold border-r border-zinc-200 dark:border-zinc-800 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'code'
                ? 'border-b-[#7b42bc] dark:border-b-[#be98f7] text-[#7b42bc] dark:text-[#be98f7] bg-white dark:bg-[#15151c]'
                : 'border-b-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>extension.js</span>
          </button>
        </div>

        {/* Editor body */}
        <div className="flex-1 overflow-hidden px-5 py-4 min-h-[320px]">
          {activeTab === 'code' && isLoading ? (
            <div className="space-y-3">
              <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-72 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[4px] animate-pulse" />
            </div>
          ) : activeError ? (
            <div className="space-y-3">
              {codeUnavailable ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-[6px] text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>extension.js is not downloadable yet.</strong> Compiled bundles are only
                    served for published versions, so the source becomes available here once this
                    submission is approved.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-[6px] text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Unable to load extension.js:</strong> {activeError}
                  </div>
                </div>
              )}
              <div className="p-6 rounded-[4px] border border-dashed border-zinc-300 dark:border-zinc-700 text-center text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                extension.js unavailable
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTab === 'manifest' && (
                <div
                  className={`p-2.5 text-xs font-mono rounded-[4px] border flex items-center gap-1.5 ${
                    manifestParse.ok
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {manifestParse.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{manifestParse.message}</span>
                </div>
              )}
              <CodeEditor
                label={activeTab === 'manifest' ? 'manifest.json editor' : 'extension.js editor'}
                value={activeText}
                onChange={activeTab === 'manifest' ? setManifestText : setCodeText}
              />
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#12121a] text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
          <span>
            {activeTab === 'manifest' ? 'manifest.json' : 'extension.js'} • {lineCount} lines •{' '}
            {sizeKb} KB
          </span>
          <button
            onClick={() => handleCopy(activeTab)}
            disabled={isLoading}
            className="text-[#7b42bc] dark:text-[#be98f7] hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
          >
            {copied === activeTab ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy {activeTab === 'manifest' ? 'manifest' : 'source'}</span>
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            Close
          </button>
          <button
            onClick={() => onReject(item)}
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded"
          >
            Reject Submission
          </button>
          <button
            onClick={() => onApprove(item)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
          >
            Approve & Publish
          </button>
        </div>
      </div>
    </div>
  );
};