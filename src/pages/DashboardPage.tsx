import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import { Extension } from '../types/api';
import { ExtensionCard } from '../components/ExtensionCard';
import {
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Upload,
  Key,
  Package,
  Check,
  AlertCircle,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    refreshUser,
    hasAcceptedCurrentTerms,
    acceptCurrentTerms,
  } = useAuth();
  const [userExtensions, setUserExtensions] = useState<Extension[]>([]);
  const [loadingExts, setLoadingExts] = useState(true);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const loadUserExtensions = useCallback(async () => {
    if (!user) return;
    setLoadingExts(true);
    try {
      // Query extensions by namespace
      const res = await api.searchExtensions(user.namespace, { limit: 50 });
      // Filter strictly to user namespace
      const own = (res.data || []).filter((ext) => ext.namespace === user.namespace);
      setUserExtensions(own);
    } catch {
      setUserExtensions([]);
    } finally {
      setLoadingExts(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onNavigate('login');
      return;
    }

    if (user) {
      setDisplayName(user.displayName || '');
      loadUserExtensions();
    }
  }, [isAuthenticated, isLoading, user, onNavigate, loadUserExtensions]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const updateData: { displayName?: string; password?: string } = {};
      if (displayName !== user.displayName) {
        updateData.displayName = displayName;
      }
      if (newPassword.trim()) {
        if (newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters.');
        }
        updateData.password = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditingProfile(false);
        setSavingProfile(false);
        return;
      }

      await api.updateUser(user.namespace, updateData);
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Account profile updated successfully.' });
      setNewPassword('');
      setIsEditingProfile(false);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to update profile';
      setProfileMsg({ type: 'error', text: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Redirecting to login...</p>
      </div>
    );
  }

  const publishedCount = userExtensions.filter(
    (e) => e.status !== 'pending' && e.status !== 'yanked',
  ).length;
  const pendingCount = userExtensions.filter((e) => e.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Account Overview */}
      <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#f6f2fc] dark:bg-[#281e3a] border border-[#e4d6f7] dark:border-[#432d66] flex items-center justify-center text-[#7b42bc] dark:text-[#be98f7] font-bold text-xl shrink-0">
              {(user.displayName || user.namespace).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {user.displayName || user.namespace}
                </h1>
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-[4px] border border-zinc-200 dark:border-zinc-700">
                  @{user.namespace}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                <span>Role: {user.role || 'author'}</span>
                <span>•</span>
                <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {hasAcceptedCurrentTerms ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">Terms Accepted</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-amber-700 dark:text-amber-300">Terms Pending</span>
                      <button
                        onClick={acceptCurrentTerms}
                        className="text-[#7b42bc] dark:text-[#be98f7] underline font-medium ml-1"
                      >
                        Accept
                      </button>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-[4px] flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {isEditingProfile ? 'Cancel Editing' : 'Edit Profile'}
            </button>
            <button
              onClick={() => onNavigate('publish')}
              className="px-4 py-1.5 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-medium rounded-[4px] flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Publish Extension
            </button>
          </div>
        </div>

        {/* Profile notification */}
        {profileMsg && (
          <div
            className={`mt-4 p-3 rounded-[4px] text-xs flex items-center gap-2 border ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
            }`}
          >
            {profileMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        {/* Edit Profile Form drawer */}
        {isEditingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4"
          >
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">
              Update Account Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Kane Marshall"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#131319] border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#7b42bc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  New Password{' '}
                  <span className="text-zinc-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#131319] border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#7b42bc]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-1.5 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-medium rounded-[4px] disabled:opacity-50 transition-colors"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Quick shortcuts banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 p-4 rounded-[6px] flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-[4px] flex items-center justify-center">
              <Key className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Automation Tokens & Sessions
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Manage CI publish/yank tokens and browser logins
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('sessions-tokens')}
            className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-[4px] transition-colors"
          >
            Manage →
          </button>
        </div>

        <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 p-4 rounded-[6px] flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f6f2fc] dark:bg-[#281e3a] rounded-[4px] flex items-center justify-center">
              <Package className="w-5 h-5 text-[#7b42bc] dark:text-[#be98f7]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Publish Extension
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Submit a compiled TurboWarp extension via the web registry
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('publish')}
            className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-[4px] transition-colors"
          >
            Publish →
          </button>
        </div>
      </div>

      {/* User's Published & Pending Extensions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Your Extensions</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Extensions authored under your @{user.namespace} namespace ({publishedCount}{' '}
              published, {pendingCount} pending).
            </p>
          </div>
          <button
            onClick={() => onNavigate('publish')}
            className="text-xs font-semibold text-[#7b42bc] dark:text-[#be98f7] hover:underline flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            New Extension
          </button>
        </div>

        {loadingExts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-40 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-[6px] animate-pulse"
              />
            ))}
          </div>
        ) : userExtensions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userExtensions.map((ext) => (
              <ExtensionCard
                key={`${ext.namespace}/${ext.id}`}
                extension={ext}
                onClick={() => onNavigate(`ext/${ext.namespace}/${ext.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-12 text-center space-y-3 transition-colors">
            <Package className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No extensions under @{user.namespace} yet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Ready to share your custom TurboWarp blocks? Use the web publish tool or the Twext CLI
              to submit your compiled code.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('publish')}
                className="px-4 py-2 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-semibold rounded-[4px] inline-flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Publish Your First Extension
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
