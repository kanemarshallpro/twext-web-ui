import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import {
  Upload,
  FileCode,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  LogIn,
  ShieldAlert,
} from 'lucide-react';

interface PublishPageProps {
  onNavigate: (route: string) => void;
}

export const PublishPage: React.FC<PublishPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, hasAcceptedCurrentTerms, acceptCurrentTerms } = useAuth();

  const [manifestText, setManifestText] = useState('');
  const [codeText, setCodeText] = useState('');
  const [parsedManifest, setParsedManifest] = useState<Record<string, unknown> | null>(null);
  const [manifestParseError, setManifestParseError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<{
    message: string;
    namespace?: string;
    id?: string;
  } | null>(null);

  // Validate manifest JSON whenever text changes
  const handleManifestChange = (text: string) => {
    setManifestText(text);
    if (!text.trim()) {
      setParsedManifest(null);
      setManifestParseError(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Manifest must be a valid JSON object.');
      }
      setParsedManifest(parsed as Record<string, unknown>);
      setManifestParseError(null);
    } catch (err: unknown) {
      setParsedManifest(null);
      setManifestParseError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  const handleManifestFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleManifestChange(content);
    };
    reader.readAsText(file);
  };

  const handleCodeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCodeText(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    const sampleManifest = {
      id: 'twext-math-demo',
      name: 'Advanced Math Demo',
      version: '1.0.0',
      description:
        'A sample Twext compiled extension with fast math calculation blocks for TurboWarp.',
      tags: ['math', 'utilities', 'turbowarp'],
      author: user?.namespace || 'twext-author',
    };

    const sampleCode = `// Compiled with Twext CLI v1.0.0
class AdvancedMathExtension {
  getInfo() {
    return {
      id: 'twext-math-demo',
      name: 'Advanced Math Demo',
      color1: '#7b42bc',
      color2: '#6935a3',
      blocks: [
        {
          opcode: 'factorial',
          blockType: Scratch.BlockType.REPORTER,
          text: 'factorial of [NUM]',
          arguments: {
            NUM: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 5
            }
          }
        }
      ]
    };
  }

  factorial(args) {
    const n = Math.floor(Number(args.NUM) || 0);
    if (n <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= Math.min(n, 20); i++) res *= i;
    return res;
  }
}

Scratch.extensions.register(new AdvancedMathExtension());
`;

    handleManifestChange(JSON.stringify(sampleManifest, null, 2));
    setCodeText(sampleCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      setError('You must be signed in to submit an extension.');
      return;
    }

    if (!parsedManifest) {
      setError('Please provide a valid JSON manifest for your extension.');
      return;
    }

    if (!codeText.trim()) {
      setError('Please provide the compiled JavaScript code.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.publish({
        manifest: parsedManifest,
        code: codeText.trim(),
      });

      const extId = (parsedManifest.id as string) || 'my-extension';
      const extNamespace = user?.namespace || 'author';

      setPublishSuccess({
        message: res.message || 'Extension submitted successfully.',
        namespace: extNamespace,
        id: extId,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to publish extension. Please verify the manifest and code format.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-12 h-12 bg-[#f6f2fc] dark:bg-[#281e3a] text-[#7b42bc] dark:text-[#be98f7] rounded-full flex items-center justify-center mx-auto border border-[#e4d6f7] dark:border-[#432d66]">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Sign in to Publish</h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Twext requires an active author session to link submissions with your namespace and manage
          release permissions.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('login')}
            className="px-5 py-2 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-semibold rounded-[4px] flex items-center gap-1.5 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in
          </button>
          <button
            onClick={() => onNavigate('signup')}
            className="px-5 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-[4px] transition-colors"
          >
            Create account
          </button>
        </div>
      </div>
    );
  }

  if (publishSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Submission Received!
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            {publishSuccess.message}
          </p>
          <div className="pt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Target:{' '}
            <code className="text-zinc-800 dark:text-zinc-200 font-mono">
              @{publishSuccess.namespace}/{publishSuccess.id}
            </code>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 rounded-[6px] text-xs text-amber-900 dark:text-amber-200 max-w-lg mx-auto flex items-start gap-2.5 text-left">
          <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Review Status:</strong> Newly submitted releases undergo automatic checks and
            moderation before appearing in public searches. You can check its progress at any time
            in your dashboard.
          </span>
        </div>

        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-semibold rounded-[4px] transition-colors"
          >
            Go to My Dashboard
          </button>
          <button
            onClick={() => {
              setPublishSuccess(null);
              setManifestText('');
              setCodeText('');
              setParsedManifest(null);
            }}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-[4px] transition-colors"
          >
            Publish Another Extension
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Publish an Extension
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Submit your pre-compiled Twext output (manifest and JavaScript bundle) to the registry.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="text-xs text-[#7b42bc] dark:text-[#be98f7] hover:underline font-medium flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Load sample extension data
        </button>
      </div>

      {/* Terms Warning if not accepted */}
      {!hasAcceptedCurrentTerms && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-[6px] p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Terms of Service Notice:</strong> You must accept the latest Terms of Service
              before publishing extensions.
            </div>
          </div>
          <button
            type="button"
            onClick={acceptCurrentTerms}
            className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-[4px] font-medium shrink-0"
          >
            Accept Now
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 p-4 rounded-[6px] text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong>Submission Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Publish Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Manifest */}
        <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-[#7b42bc] dark:text-[#be98f7]" />
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                1. Extension Manifest (
                <code className="text-xs text-zinc-600 dark:text-zinc-400">manifest.json</code>)
              </label>
            </div>

            <label className="cursor-pointer text-xs font-medium text-[#7b42bc] dark:text-[#be98f7] hover:underline flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload JSON file</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleManifestFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Paste or upload the JSON manifest generated by the Twext compiler. Must contain{' '}
            <code className="text-zinc-700 dark:text-zinc-300">id</code>,{' '}
            <code className="text-zinc-700 dark:text-zinc-300">name</code>, and{' '}
            <code className="text-zinc-700 dark:text-zinc-300">version</code>.
          </p>

          <textarea
            required
            rows={8}
            value={manifestText}
            onChange={(e) => handleManifestChange(e.target.value)}
            placeholder={`{\n  "id": "my-extension",\n  "name": "My Custom Extension",\n  "version": "1.0.0",\n  "description": "Short description of blocks"\n}`}
            className="w-full p-3 font-mono text-xs bg-zinc-50 dark:bg-[#131319] border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1a1a24] focus:outline-none focus:border-[#7b42bc]"
          />

          {manifestParseError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3.5 h-3.5" />
              {manifestParseError}
            </p>
          )}

          {parsedManifest && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-[4px] text-xs space-y-1 text-emerald-900 dark:text-emerald-200">
              <div className="font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Valid Manifest Detected
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400">ID:</span>{' '}
                  {String(parsedManifest.id || '—')}
                </div>
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400">Name:</span>{' '}
                  {String(parsedManifest.name || '—')}
                </div>
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400">Version:</span>{' '}
                  {String(parsedManifest.version || '—')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Compiled JS Code */}
        <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#7b42bc] dark:text-[#be98f7]" />
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                2. Compiled Extension Code (
                <code className="text-xs text-zinc-600 dark:text-zinc-400">extension.js</code>)
              </label>
            </div>

            <label className="cursor-pointer text-xs font-medium text-[#7b42bc] dark:text-[#be98f7] hover:underline flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload JS bundle</span>
              <input
                type="file"
                accept=".js,text/javascript"
                onChange={handleCodeFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Paste the compiled JavaScript bundle generated by{' '}
            <code className="text-zinc-700 dark:text-zinc-300">twext build</code>. This code
            executes in the Scratch/TurboWarp runtime sandbox.
          </p>

          <textarea
            required
            rows={12}
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            placeholder={`// Paste the compiled extension JavaScript code here\nclass MyExtension {\n  getInfo() { /* ... */ }\n}\nScratch.extensions.register(new MyExtension());`}
            className="w-full p-3 font-mono text-xs bg-zinc-50 dark:bg-[#131319] border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1a1a24] focus:outline-none focus:border-[#7b42bc]"
          />

          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>
              Size:{' '}
              {codeText.length > 0 ? `${(new Blob([codeText]).size / 1024).toFixed(1)} KB` : '0 KB'}
            </span>
            <span>Lines: {codeText ? codeText.split('\n').length : 0}</span>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline"
          >
            Cancel and return to Dashboard
          </button>

          <button
            type="submit"
            disabled={submitting || !parsedManifest || !codeText.trim()}
            className="px-6 py-2.5 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-semibold rounded-[4px] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{submitting ? 'Submitting to Registry...' : 'Submit Extension for Review'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
