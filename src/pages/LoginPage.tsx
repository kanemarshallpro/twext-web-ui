import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { BrandLogo } from '../components/BrandLogo';
import { LogIn, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [namespace, setNamespace] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namespace.trim() || !password) {
      setError('Please provide both your namespace username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(namespace.trim().toLowerCase(), password);
      onNavigate('dashboard');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white dark:bg-[#181822] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-6 sm:p-8 space-y-6 transition-colors">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BrandLogo size="md" showText={false} />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Sign in to Twext</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Enter your namespace and account password to manage your extensions and tokens.
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
              Namespace Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-zinc-400 font-mono">@</span>
              <input
                type="text"
                required
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                placeholder="your-namespace"
                className="w-full pl-7 pr-3 py-2 text-xs bg-white dark:bg-[#131319] border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#7b42bc] font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              Example: <code className="text-zinc-600 dark:text-zinc-400">kanemarshall</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#131319] border border-zinc-300 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#7b42bc]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] text-white text-xs font-semibold rounded-[4px] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Don't have an author namespace yet?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="text-[#7b42bc] dark:text-[#be98f7] font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Sign up <ArrowRight className="w-3 h-3" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
