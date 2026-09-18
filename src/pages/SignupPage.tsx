import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { BrandLogo } from '../components/BrandLogo';
import { UserPlus, AlertCircle, ArrowRight } from 'lucide-react';

interface SignupPageProps {
  onNavigate: (route: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const { signup, acceptCurrentTerms, latestTermsVersion } = useAuth();
  const [namespace, setNamespace] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namespace.trim() || !password) {
      setError('Please provide a namespace and password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service to register an account.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signup(
        namespace.trim().toLowerCase(),
        password,
        displayName.trim() || undefined
      );

      // Automatically accept current terms upon signup agreement
      if (agreeTerms) {
        try {
          await acceptCurrentTerms();
        } catch {
          // Non-blocking if terms endpoint had issues
        }
      }

      onNavigate('dashboard');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during signup.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-6 sm:p-8 space-y-6 transition-colors">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BrandLogo size="md" showText={false} />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Create Twext Account</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Claim your author namespace to publish and manage extensions on Twext.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 p-3 rounded-[4px] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-tight">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Namespace <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-zinc-400 font-mono">@</span>
              <input
                type="text"
                required
                pattern="^[a-zA-Z0-9_-]{2,32}$"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value.toLowerCase())}
                placeholder="your-namespace"
                className="w-full pl-7 pr-3 py-2 text-xs bg-white dark:bg-[#131319] border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#7b42bc] font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              Lowercase letters, numbers, and hyphens (e.g. <code>my-studio</code>). Packages will be named <code>@{namespace || 'your-namespace'}/package-id</code>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Display Name <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
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
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#131319] border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#7b42bc]"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded text-[#7b42bc] focus:ring-[#7b42bc]"
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-tight">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="text-[#7b42bc] dark:text-[#be98f7] hover:underline"
                >
                  Terms of Service (v{latestTermsVersion ?? 1})
                </button>{' '}
                and understand that extensions are publicly inspectable.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-semibold rounded-[4px] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'Register Namespace'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-[#7b42bc] dark:text-[#be98f7] font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Sign in <ArrowRight className="w-3 h-3" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
