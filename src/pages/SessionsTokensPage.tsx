import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import { AutomationToken, Session, TokenScope } from '../types/api';
import {
  Key,
  Laptop,
  Trash2,
  Plus,
  Copy,
  Check,
  AlertCircle,
  Shield,
  CheckCircle2,
} from 'lucide-react';

interface SessionsTokensPageProps {
  onNavigate: (route: string) => void;
}

export const SessionsTokensPage: React.FC<SessionsTokensPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, isLoading } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [tokens, setTokens] = useState<AutomationToken[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingTokens, setLoadingTokens] = useState(true);

  // New token form state
  const [newTokenName, setNewTokenName] = useState('');
  const [scopePublish, setScopePublish] = useState(true);
  const [scopeYank, setScopeYank] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [createdTokenSecret, setCreatedTokenSecret] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Notifications
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isSessionThisDevice = (sess: Session) => {
    const curToken = api.getToken();
    if (!curToken) return false;
    if (curToken === sess.id || curToken.startsWith(sess.id) || curToken.includes(sess.id)) {
      return true;
    }
    if (sessions.length === 1) return true;
    const sorted = [...sessions].sort((a, b) => {
      const tA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : new Date(a.createdAt).getTime();
      const tB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : new Date(b.createdAt).getTime();
      return tB - tA;
    });
    return sorted[0]?.id === sess.id;
  };

  const isTokenThisDevice = (tok: AutomationToken) => {
    const curToken = api.getToken();
    if (!curToken) return false;
    return curToken === tok.id || curToken.startsWith(tok.id) || curToken.includes(tok.id);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onNavigate('login');
      return;
    }

    if (isAuthenticated) {
      loadSessions();
      loadTokens();
    }
  }, [isAuthenticated, isLoading]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.getSessions();
      setSessions(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to fetch sessions';
      setActionError(msg);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadTokens = async () => {
    setLoadingTokens(true);
    try {
      const res = await api.getTokens();
      setTokens(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to fetch tokens';
      setActionError(msg);
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (targetSession && isSessionThisDevice(targetSession)) {
      setActionError('Cannot revoke the session currently being used on this device. Please use Logout to sign out.');
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    try {
      await api.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setActionSuccess('Session revoked successfully.');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to revoke session';
      setActionError(msg);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) {
      setActionError('Please provide a name for the automation token.');
      return;
    }

    const scopes: TokenScope[] = [];
    if (scopePublish) scopes.push('publish');
    if (scopeYank) scopes.push('yank');

    if (scopes.length === 0) {
      setActionError('At least one scope (publish or yank) must be selected.');
      return;
    }

    setCreatingToken(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const tokenResult = await api.createToken({
        name: newTokenName.trim(),
        scopes,
      });

      if (tokenResult.token) {
        setCreatedTokenSecret(tokenResult.token);
      }
      setNewTokenName('');
      setScopePublish(true);
      setScopeYank(false);
      await loadTokens();
      setActionSuccess('Automation token generated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create automation token';
      setActionError(msg);
    } finally {
      setCreatingToken(false);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    const targetToken = tokens.find((t) => t.id === tokenId);
    if (targetToken && isTokenThisDevice(targetToken)) {
      setActionError('Cannot revoke or delete the token currently in use on this device.');
      return;
    }

    if (!confirm('Are you sure you want to delete this token? Any CI scripts using it will lose access immediately.')) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.deleteToken(tokenId);
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      setActionSuccess('Token deleted successfully.');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete token';
      setActionError(msg);
    }
  };

  const handleCopySecret = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Sessions & Automation Tokens
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your browser sessions and generate scoped access tokens for automated CI/CD pipelines (e.g. GitHub Actions).
        </p>
      </div>

      {/* Global notifications */}
      {actionError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 p-3 rounded-[4px] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 p-3 rounded-[4px] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Newly Generated Token Alert */}
      {createdTokenSecret && (
        <div className="bg-[#f6f2fc] dark:bg-[#201530] border border-[#e4d6f7] dark:border-[#432d66] p-5 rounded-[6px] space-y-3">
          <div className="flex items-center gap-2 text-[#7b42bc] dark:text-[#be98f7]">
            <Key className="w-5 h-5" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Your New Automation Token</h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Make sure to copy your automation token now. You will <strong>not</strong> be able to see it again! Store it in your GitHub repository secrets as <code className="text-zinc-800 dark:text-zinc-200 font-mono">TWEXT_TOKEN</code>.
          </p>

          <div className="relative bg-white dark:bg-[#131319] border border-[#e4d6f7] dark:border-[#432d66] rounded-[4px] p-2.5 flex items-center justify-between font-mono text-xs text-zinc-800 dark:text-zinc-200">
            <span className="truncate pr-8">{createdTokenSecret}</span>
            <button
              onClick={() => handleCopySecret(createdTokenSecret)}
              className="px-3 py-1 bg-[#7b42bc] text-white rounded-[3px] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-xs flex items-center gap-1 shrink-0 transition-colors"
            >
              {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedToken ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-right">
            <button
              onClick={() => setCreatedTokenSecret(null)}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Two Columns: Automation Tokens & Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Automation Tokens */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 space-y-4 transition-colors">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#7b42bc] dark:text-[#be98f7]" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Generate Automation Token</h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Automation tokens authenticate the Twext CLI in headless environments such as GitHub Actions, GitLab CI, or custom deployment bots.
            </p>

            <form onSubmit={handleCreateToken} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Token Name / Identifier
                </label>
                <input
                  type="text"
                  required
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="e.g. github-actions-ci or release-bot"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-[#131319] border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1a1a24] focus:outline-none focus:border-[#7b42bc]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Permissions (Scopes)
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={scopePublish}
                      onChange={(e) => setScopePublish(e.target.checked)}
                      className="rounded text-[#7b42bc] focus:ring-[#7b42bc]"
                    />
                    <span>
                      <strong className="font-mono">publish</strong> — Allow uploading new extension releases
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={scopeYank}
                      onChange={(e) => setScopeYank(e.target.checked)}
                      className="rounded text-[#7b42bc] focus:ring-[#7b42bc]"
                    />
                    <span>
                      <strong className="font-mono">yank</strong> — Allow retracting/yanking bad releases
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creatingToken}
                  className="px-4 py-2 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-semibold rounded-[4px] flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{creatingToken ? 'Generating...' : 'Create Automation Token'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tokens List */}
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 space-y-3 transition-colors">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Active Tokens ({tokens.length})
            </h3>

            {loadingTokens ? (
              <div className="space-y-2">
                <div className="h-14 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-14 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
              </div>
            ) : tokens.length > 0 ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[4px]">
                {tokens.map((tok) => {
                  const isCurrent = isTokenThisDevice(tok);
                  return (
                    <div
                      key={tok.id}
                      className="p-3 flex items-center justify-between gap-3 text-xs bg-white dark:bg-[#181822]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{tok.name}</span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#f6f2fc] dark:bg-[#281e3a] text-[#7b42bc] dark:text-[#be98f7] border border-[#e4d6f7] dark:border-[#432d66] px-1.5 py-0.5 rounded-[3px]">
                              <Key className="w-3 h-3" />
                              This Device
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            {tok.scopes?.map((sc) => (
                              <span
                                key={sc}
                                className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-[3px] border border-zinc-200 dark:border-zinc-700"
                              >
                                {sc}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          Created {new Date(tok.createdAt).toLocaleDateString()}
                          {tok.lastUsedAt && ` • Last used ${new Date(tok.lastUsedAt).toLocaleDateString()}`}
                        </div>
                      </div>

                      {isCurrent ? (
                        <span
                          title="This token is currently active on this device and cannot be revoked."
                          className="px-2 py-1 text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-[3px] cursor-not-allowed opacity-60"
                        >
                          In Use
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeleteToken(tok.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-[3px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Revoke Token"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
                No automation tokens generated yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Active Sessions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 space-y-3 transition-colors">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#7b42bc] dark:text-[#be98f7]" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Active Web Sessions</h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              These are the devices and browsers currently logged into your Twext account. Revoking a session immediately terminates its access.
            </p>

            {loadingSessions ? (
              <div className="space-y-2 pt-2">
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
              </div>
            ) : sessions.length > 0 ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[4px] mt-2">
                {sessions.map((sess) => {
                  const isCurrent = isSessionThisDevice(sess);
                  return (
                    <div
                      key={sess.id}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs bg-white dark:bg-[#181822]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold truncate max-w-[180px]">
                            {sess.id.slice(0, 16)}...
                          </span>
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#f6f2fc] dark:bg-[#281e3a] text-[#7b42bc] dark:text-[#be98f7] border border-[#e4d6f7] dark:border-[#432d66] px-1.5 py-0.5 rounded">
                              <Laptop className="w-3 h-3" />
                              This Device
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                          <span>Created: {new Date(sess.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Expires: {new Date(sess.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <button
                          disabled
                          title="This session is currently being used on this device. Sign out via Logout to end this session."
                          className="px-2.5 py-1 text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-[3px] text-xs font-medium cursor-not-allowed opacity-60"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevokeSession(sess.id)}
                          className="px-2.5 py-1 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-[3px] text-xs font-medium transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
                No other active sessions recorded.
              </p>
            )}
          </div>

          <div className="bg-zinc-50 dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 space-y-2 text-xs text-zinc-600 dark:text-zinc-400 transition-colors">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
              <Shield className="w-4 h-4 text-[#7b42bc] dark:text-[#be98f7]" />
              <span>Security Tip</span>
            </div>
            <p className="leading-relaxed">
              If you suspect an automation token or session has been exposed, revoke it immediately. Revocations take effect across the entire Twext registry network within seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
