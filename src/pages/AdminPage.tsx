import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import { SourceReviewModal } from '../components/SourceReviewModal';
import {
  PendingVersion,
  Extension,
  User,
  InstanceStats,
  TermsDoc,
  PrivacyDoc,
  UserRole,
} from '../types/api';
import {
  Shield,
  Clock,
  Package,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Trash2,
  FileText,
  Lock,
  Eye,
  Sliders,
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (route: string) => void;
}

type AdminTab = 'moderation' | 'catalog' | 'users' | 'policies';

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('moderation');
  const [stats, setStats] = useState<InstanceStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Moderation state
  const [pendingVersions, setPendingVersions] = useState<PendingVersion[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [reviewingVersionId, setReviewingVersionId] = useState<string | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<PendingVersion | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedPendingDetail, setSelectedPendingDetail] = useState<PendingVersion | null>(null);

  // Catalog state
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [isLoadingExtensions, setIsLoadingExtensions] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Users state
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [updatingUserNamespace, setUpdatingUserNamespace] = useState<string | null>(null);

  // Policy docs state
  const [termsDoc, setTermsDoc] = useState<TermsDoc | null>(null);
  const [privacyDoc, setPrivacyDoc] = useState<PrivacyDoc | null>(null);
  const [termsText, setTermsText] = useState('');
  const [privacyText, setPrivacyText] = useState('');
  const [isSavingTerms, setIsSavingTerms] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // Feedback notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const clearNotifications = () => {
    setActionSuccess(null);
    setActionError(null);
  };

  // Load stats
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Load moderation queue
  const fetchPending = useCallback(async () => {
    setIsLoadingPending(true);
    try {
      const res = await api.listVersionsForReview();
      setPendingVersions(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to fetch pending versions';
      setActionError(msg);
    } finally {
      setIsLoadingPending(false);
    }
  }, []);

  // Load extensions
  const fetchExtensions = useCallback(async (query = '') => {
    setIsLoadingExtensions(true);
    try {
      const res = query
        ? await api.searchExtensions(query, { limit: 50 })
        : await api.getExtensions({ limit: 50 });
      setExtensions(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to fetch extensions';
      setActionError(msg);
    } finally {
      setIsLoadingExtensions(false);
    }
  }, []);

  // Load users
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.getUsers({ limit: 50 });
      setUsersList(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to fetch users';
      setActionError(msg);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Load policies
  const fetchPolicies = useCallback(async () => {
    try {
      const [terms, privacy] = await Promise.all([
        api.getTerms().catch(() => null),
        api.getPrivacy().catch(() => null),
      ]);
      if (terms) {
        setTermsDoc(terms);
        setTermsText(terms.body);
      }
      if (privacy) {
        setPrivacyDoc(privacy);
        setPrivacyText(privacy.body);
      }
    } catch {
      // ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchPending();
      fetchExtensions();
      fetchUsers();
      fetchPolicies();
    }
  }, [isAdmin, fetchStats, fetchPending, fetchExtensions, fetchUsers, fetchPolicies]);

  // Handle Review: Approve
  const handleApprove = async (item: PendingVersion) => {
    const targetNs = item.ownerNamespace || item.namespace;
    setReviewingVersionId(item.id + item.version);
    clearNotifications();
    try {
      await api.reviewVersion(targetNs, item.id, item.version, {
        status: 'approved',
      });
      setActionSuccess(
        `Version v${item.version} of @${targetNs}/${item.id} has been approved and published!`,
      );
      setPendingVersions((prev) =>
        prev.filter((p) => !(p.id === item.id && p.version === item.version)),
      );
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to approve version';
      setActionError(msg);
    } finally {
      setReviewingVersionId(null);
    }
  };

  // Handle Review: Reject
  const handleRejectConfirm = async () => {
    if (!rejectModalItem) return;
    const item = rejectModalItem;
    const targetNs = item.ownerNamespace || item.namespace;
    setReviewingVersionId(item.id + item.version);
    clearNotifications();
    try {
      await api.reviewVersion(targetNs, item.id, item.version, {
        status: 'rejected',
        reason: rejectReason.trim() || 'Submission does not meet registry guidelines.',
      });
      setActionSuccess(`Version v${item.version} of @${targetNs}/${item.id} was rejected.`);
      setPendingVersions((prev) =>
        prev.filter((p) => !(p.id === item.id && p.version === item.version)),
      );
      setRejectModalItem(null);
      setRejectReason('');
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to reject version';
      setActionError(msg);
    } finally {
      setReviewingVersionId(null);
    }
  };

  // Handle Yank Version
  const handleYankVersion = async (ext: Extension, version: string) => {
    if (
      !confirm(
        `Are you sure you want to yank version ${version} of @${ext.namespace}/${ext.id}? This will hide it from registry listings.`,
      )
    ) {
      return;
    }
    clearNotifications();
    try {
      await api.yankVersion(ext.namespace, ext.id, version);
      setActionSuccess(`Yanked version ${version} of @${ext.namespace}/${ext.id}.`);
      fetchExtensions(catalogSearch);
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to yank version';
      setActionError(msg);
    }
  };

  // Handle Delete Extension
  const handleDeleteExtension = async (ext: Extension) => {
    if (
      !confirm(
        `DANGER: Are you sure you want to permanently delete @${ext.namespace}/${ext.id} and all its versions from the registry?`,
      )
    ) {
      return;
    }
    clearNotifications();
    try {
      await api.deleteExtension(ext.namespace, ext.id);
      setActionSuccess(`Extension @${ext.namespace}/${ext.id} has been permanently deleted.`);
      setExtensions((prev) =>
        prev.filter((e) => !(e.namespace === ext.namespace && e.id === ext.id)),
      );
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete extension';
      setActionError(msg);
    }
  };

  // Handle Change User Role
  const handleToggleUserRole = async (targetUser: User) => {
    const newRole: UserRole = targetUser.role === 'admin' ? 'normal' : 'admin';
    if (targetUser.namespace === user?.namespace && newRole === 'normal') {
      if (
        !confirm(
          'Warning: You are about to remove administrative permissions from your own account. Continue?',
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Change role for @${targetUser.namespace} to "${newRole}"?`)) {
        return;
      }
    }

    setUpdatingUserNamespace(targetUser.namespace);
    clearNotifications();
    try {
      const updated = await api.updateUserRole(targetUser.namespace, { role: newRole });
      setUsersList((prev) =>
        prev.map((u) =>
          u.namespace === targetUser.namespace ? { ...u, role: updated.role || newRole } : u,
        ),
      );
      setActionSuccess(`Updated @${targetUser.namespace}'s role to ${newRole}.`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update user role';
      setActionError(msg);
    } finally {
      setUpdatingUserNamespace(null);
    }
  };

  // Handle Save Terms
  const handleSaveTerms = async () => {
    setIsSavingTerms(true);
    clearNotifications();
    try {
      const updated = await api.updateTerms(termsText);
      setTermsDoc(updated);
      setActionSuccess(`Terms of Service updated to revision #${updated.version}.`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update Terms of Service';
      setActionError(msg);
    } finally {
      setIsSavingTerms(false);
    }
  };

  // Handle Save Privacy
  const handleSavePrivacy = async () => {
    setIsSavingPrivacy(true);
    clearNotifications();
    try {
      const updated = await api.updatePrivacyPolicy(privacyText);
      setPrivacyDoc(updated);
      setActionSuccess(`Privacy Policy updated to revision #${updated.version}.`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update Privacy Policy';
      setActionError(msg);
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  // Permission check
  if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-900/50">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Administrator Access Required
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
          The administration portal is restricted to accounts with the{' '}
          <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono font-semibold">
            admin
          </code>{' '}
          role. Please authenticate with an authorized administrator account to manage moderation,
          extensions, and users.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-[4px] transition-colors"
          >
            Return to Registry
          </button>
          {!isAuthenticated && (
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#7b42bc] hover:bg-[#6834a3] rounded-[4px] transition-colors"
            >
              Sign In as Admin
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Header & Live System Status */}
      <div className="bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 rounded-[4px]">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Registry Administration
              </h1>
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-[4px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Authenticated as{' '}
              <strong className="text-zinc-700 dark:text-zinc-300">@{user?.namespace}</strong> •
              Server: <span className="font-mono">{api.getBaseUrl()}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === 'moderation') fetchPending();
                if (activeTab === 'catalog') fetchExtensions(catalogSearch);
                if (activeTab === 'users') fetchUsers();
                if (activeTab === 'policies') fetchPolicies();
              }}
              disabled={isLoadingStats || isLoadingPending || isLoadingExtensions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-[#1f1f2a] border border-zinc-200 dark:border-zinc-700/80 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* System Metric Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="bg-zinc-50/70 dark:bg-[#191924] p-3 rounded-[6px] border border-zinc-200/70 dark:border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
              <span>Pending Submissions</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {stats?.pending ?? pendingVersions.length}
            </div>
          </div>

          <div className="bg-zinc-50/70 dark:bg-[#191924] p-3 rounded-[6px] border border-zinc-200/70 dark:border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
              <span>Published Extensions</span>
              <Package className="w-3.5 h-3.5 text-[#7b42bc] dark:text-[#a57de0]" />
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {stats?.published ?? extensions.length}
            </div>
          </div>

          <div className="bg-zinc-50/70 dark:bg-[#191924] p-3 rounded-[6px] border border-zinc-200/70 dark:border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
              <span>Registered Authors</span>
              <Users className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {stats?.authors ?? usersList.length}
            </div>
          </div>

          <div className="bg-zinc-50/70 dark:bg-[#191924] p-3 rounded-[6px] border border-zinc-200/70 dark:border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
              <span>Terms Revision</span>
              <FileText className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              v{termsDoc?.version ?? 1}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-[6px] text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={clearNotifications}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-[6px] text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={clearNotifications}
            className="text-rose-600 hover:text-rose-800 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'moderation'
              ? 'border-[#7b42bc] dark:border-[#be98f7] text-[#7b42bc] dark:text-[#be98f7]'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Moderation Queue</span>
          {pendingVersions.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white font-mono font-bold">
              {pendingVersions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-[#7b42bc] dark:border-[#be98f7] text-[#7b42bc] dark:text-[#be98f7]'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Extension Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'users'
              ? 'border-[#7b42bc] dark:border-[#be98f7] text-[#7b42bc] dark:text-[#be98f7]'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'policies'
              ? 'border-[#7b42bc] dark:border-[#be98f7] text-[#7b42bc] dark:text-[#be98f7]'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Platform Policies</span>
        </button>
      </div>

      {/* Tab 1: Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {pendingVersions.length} submission{pendingVersions.length === 1 ? '' : 's'} waiting
              for administrative approval.
            </div>
            <button
              onClick={fetchPending}
              disabled={isLoadingPending}
              className="text-xs text-[#7b42bc] dark:text-[#be98f7] hover:underline flex items-center gap-1 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingPending ? 'animate-spin' : ''}`} />
              <span>Reload Queue</span>
            </button>
          </div>

          {isLoadingPending ? (
            <div className="space-y-3">
              <div className="h-24 bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded-[6px] animate-pulse" />
              <div className="h-24 bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded-[6px] animate-pulse" />
            </div>
          ) : pendingVersions.length === 0 ? (
            <div className="bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Moderation Queue is Clear
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                No new extension versions are currently waiting for review. New releases submitted
                with staging status will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVersions.map((item) => {
                const ns = item.ownerNamespace || item.namespace;
                const isWorking = reviewingVersionId === item.id + item.version;
                return (
                  <div
                    key={`${ns}/${item.id}/${item.version}`}
                    className="bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {item.name || item.id}
                        </span>
                        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          @{ns}/{item.id}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-[#f6f2fc] dark:bg-[#281e3a] text-[#7b42bc] dark:text-[#be98f7] border border-[#e4d6f7] dark:border-[#432d66] rounded-[3px]">
                          v{item.version}
                        </span>
                        {item.license && (
                          <span className="text-[10px] uppercase font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                            {item.license}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-3">
                        <span>
                          Submitted by{' '}
                          <strong className="text-zinc-600 dark:text-zinc-300">@{ns}</strong>
                        </span>
                        {item.createdAt && (
                          <span>• {new Date(item.createdAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedPendingDetail(item)}
                        className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-[3px] font-medium flex items-center gap-1"
                        title="Inspect manifest & source code"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => setRejectModalItem(item)}
                        disabled={isWorking}
                        className="px-2.5 py-1.5 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 rounded-[3px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApprove(item)}
                        disabled={isWorking}
                        className="px-3 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-[3px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isWorking ? 'Approving...' : 'Approve'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Extension Catalog Governance */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchExtensions(catalogSearch);
              }}
              className="relative w-full sm:w-80"
            >
              <input
                type="text"
                placeholder="Search extensions in catalog..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded-[4px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            </form>

            <button
              onClick={() => fetchExtensions(catalogSearch)}
              className="text-xs text-[#7b42bc] dark:text-[#be98f7] font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Catalog</span>
            </button>
          </div>

          {isLoadingExtensions ? (
            <div className="space-y-2">
              <div className="h-16 bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded animate-pulse" />
              <div className="h-16 bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded animate-pulse" />
            </div>
          ) : extensions.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-500">
              No extensions found matching your search.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[6px] bg-white dark:bg-[#15151c] overflow-hidden">
              {extensions.map((ext) => (
                <div
                  key={`${ext.namespace}/${ext.id}`}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{ext.name}</span>
                      <span className="font-mono text-zinc-500">
                        @{ext.namespace}/{ext.id}
                      </span>
                      {ext.latestVersion && (
                        <span className="px-1.5 py-0.2 font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700">
                          v{ext.latestVersion}
                        </span>
                      )}
                    </div>
                    {ext.description && (
                      <p className="text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-xl">
                        {ext.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onNavigate(`ext/${ext.namespace}/${ext.id}`)}
                      className="px-2.5 py-1 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-[3px] font-medium flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View</span>
                    </button>

                    {ext.latestVersion && (
                      <button
                        onClick={() => handleYankVersion(ext, ext.latestVersion!)}
                        className="px-2.5 py-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/60 rounded-[3px] font-medium"
                        title="Yank latest version from registry"
                      >
                        Yank v{ext.latestVersion}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteExtension(ext)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-[3px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Permanently Delete Extension"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: User Accounts */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Filter users by namespace..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded-[4px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            </div>

            <button
              onClick={fetchUsers}
              className="text-xs text-[#7b42bc] dark:text-[#be98f7] font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Users</span>
            </button>
          </div>

          {isLoadingUsers ? (
            <div className="space-y-2">
              <div className="h-14 bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded animate-pulse" />
              <div className="h-14 bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded animate-pulse" />
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-[6px] bg-white dark:bg-[#15151c] overflow-hidden">
              {usersList
                .filter(
                  (u) =>
                    !userSearch ||
                    u.namespace.toLowerCase().includes(userSearch.toLowerCase()) ||
                    (u.displayName &&
                      u.displayName.toLowerCase().includes(userSearch.toLowerCase())),
                )
                .map((u) => {
                  const isTargetAdmin = u.role === 'admin';
                  const isMe = u.namespace === user?.namespace;
                  const isUpdating = updatingUserNamespace === u.namespace;

                  return (
                    <div
                      key={u.namespace}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            @{u.namespace}
                          </span>
                          {u.displayName && (
                            <span className="text-zinc-500 dark:text-zinc-400">
                              ({u.displayName})
                            </span>
                          )}
                          {isTargetAdmin ? (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded">
                              Admin
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                              User
                            </span>
                          )}
                          {isMe && <span className="text-[10px] text-zinc-400 italic">(You)</span>}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                          <span>
                            Terms accepted:{' '}
                            {u.termsAcceptedVersion ? `v${u.termsAcceptedVersion}` : 'None'}
                          </span>
                          {u.createdAt && (
                            <span>• Member since {new Date(u.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          disabled={isUpdating}
                          className={`px-2.5 py-1 text-xs font-medium rounded-[3px] border transition-colors ${
                            isTargetAdmin
                              ? 'text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                              : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                          }`}
                        >
                          {isUpdating
                            ? 'Saving...'
                            : isTargetAdmin
                              ? 'Demote to Normal'
                              : 'Promote to Admin'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Platform Policies */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Terms of Service Editor */}
          <div className="bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Terms of Service (v{termsDoc?.version ?? 1})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Editing this document may prompt users to re-accept the updated terms version.
                </p>
              </div>
              <button
                onClick={handleSaveTerms}
                disabled={isSavingTerms}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#7b42bc] hover:bg-[#6834a3] rounded-[4px] transition-colors"
              >
                {isSavingTerms ? 'Saving...' : 'Publish Terms'}
              </button>
            </div>

            <textarea
              rows={16}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-zinc-50 dark:bg-[#181822] border border-zinc-200 dark:border-zinc-700/80 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#7b42bc]"
              placeholder="Markdown terms of service..."
            />
          </div>

          {/* Privacy Policy Editor */}
          <div className="bg-white dark:bg-[#15151c] border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Privacy Policy (v{privacyDoc?.version ?? 1})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Public privacy statement explaining data retention and user privacy commitments.
                </p>
              </div>
              <button
                onClick={handleSavePrivacy}
                disabled={isSavingPrivacy}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#7b42bc] hover:bg-[#6834a3] rounded-[4px] transition-colors"
              >
                {isSavingPrivacy ? 'Saving...' : 'Publish Privacy'}
              </button>
            </div>

            <textarea
              rows={16}
              value={privacyText}
              onChange={(e) => setPrivacyText(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-zinc-50 dark:bg-[#181822] border border-zinc-200 dark:border-zinc-700/80 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#7b42bc]"
              placeholder="Markdown privacy policy..."
            />
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[8px] max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <XCircle className="w-4 h-4" />
                <span>Reject Extension Submission</span>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              You are rejecting version{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                v{rejectModalItem.version}
              </strong>{' '}
              of{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                @{rejectModalItem.ownerNamespace || rejectModalItem.namespace}/{rejectModalItem.id}
              </strong>
              . Provide feedback to the author so they know what needs improvement.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Rejection Reason / Guidance:
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Manifest icon is missing, or code contains undeclared network calls without security justification."
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-[#14141c] border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail / Source Review Modal */}
      {selectedPendingDetail && (
        <SourceReviewModal
          item={selectedPendingDetail}
          onClose={() => setSelectedPendingDetail(null)}
          onApprove={(itm) => {
            setSelectedPendingDetail(null);
            handleApprove(itm);
          }}
          onReject={(itm) => {
            setSelectedPendingDetail(null);
            setRejectModalItem(itm);
          }}
        />
      )}
    </div>
  );
};
