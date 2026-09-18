import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  Compass,
  Upload,
  User as UserIcon,
  Key,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  Shield,
} from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchNavQuery, setSearchNavQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }
    const checkPending = async () => {
      try {
        const stats = await api.getStats();
        setPendingCount(stats.pending || 0);
      } catch {
        // ignore
      }
    };
    checkPending();
    const interval = setInterval(checkPending, 25000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchNavQuery.trim()) {
      onNavigate(`search?q=${encodeURIComponent(searchNavQuery.trim())}`);
      setSearchNavQuery('');
      setMobileMenuOpen(false);
    }
  };

  const navItemClass = (route: string) => {
    const isActive = currentRoute === route || currentRoute.startsWith(`${route}/`);
    return `px-3 py-1.5 text-xs font-medium rounded-[4px] transition-colors ${
      isActive
        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold'
        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
    }`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#15151c] border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Desktop Navigation Links */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className="text-left focus:outline-none flex items-center"
              aria-label="Twext Home"
            >
              <BrandLogo size="md" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button onClick={() => onNavigate('search')} className={navItemClass('search')}>
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  Explore
                </span>
              </button>

              <button onClick={() => onNavigate('publish')} className={navItemClass('publish')}>
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  Publish
                </span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors flex items-center gap-1.5 ${
                    currentRoute === 'admin'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                  title="Twext Registry Administration"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Admin</span>
                  {pendingCount > 0 && (
                    <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-tight">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Quick Search & Controls & Auth */}
          <div className="hidden lg:flex items-center gap-3">
            <form onSubmit={handleNavSearch} className="relative">
              <input
                type="text"
                placeholder="Search extensions..."
                value={searchNavQuery}
                onChange={(e) => setSearchNavQuery(e.target.value)}
                className="w-48 xl:w-60 pl-8 pr-3 py-1 text-xs bg-zinc-50 dark:bg-[#1d1d26] border border-zinc-200 dark:border-zinc-700/80 rounded-[4px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-[#181822] focus:outline-none focus:border-[#7b42bc] dark:focus:border-[#9f75cd] transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-2.5 top-2 pointer-events-none" />
            </form>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
              className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-[#1d1d26] hover:bg-zinc-100 dark:hover:bg-[#252532] border border-zinc-200 dark:border-zinc-700/80 rounded-[4px] transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-zinc-600" />
              )}
            </button>

            <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[4px] border transition-colors ${
                    currentRoute === 'dashboard'
                      ? 'border-[#7b42bc] text-[#7b42bc] dark:text-[#be98f7] bg-[#f6f2fc] dark:bg-[#281e3a]'
                      : 'border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#7b42bc] dark:text-[#a57de0]" />
                  <span>{user?.displayName || user?.namespace}</span>
                  {isAdmin && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                      Admin
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('sessions-tokens')}
                  title="Sessions & Automation Tokens"
                  className={navItemClass('sessions-tokens')}
                >
                  <Key className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                </button>

                <button
                  onClick={async () => {
                    await logout();
                    onNavigate('home');
                  }}
                  title="Sign out of Twext"
                  className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-[4px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log in</span>
                </button>

                <button
                  onClick={() => onNavigate('signup')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#7b42bc] hover:bg-[#6935a3] dark:bg-[#8e52d6] dark:hover:bg-[#7b42bc] rounded-[4px] transition-colors flex items-center gap-1 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign up</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu and controls */}
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
              className="p-1.5 text-zinc-600 dark:text-zinc-300 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#15151c] px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleNavSearch} className="relative">
            <input
              type="text"
              placeholder="Search extensions..."
              value={searchNavQuery}
              onChange={(e) => setSearchNavQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-[#1d1d26] border border-zinc-200 dark:border-zinc-700 rounded-[4px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
          </form>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[4px]"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('search');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[4px]"
            >
              Explore Extensions
            </button>
            <button
              onClick={() => {
                onNavigate('publish');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[4px]"
            >
              Publish Extension
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-2 text-left text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-[4px] flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Admin Console
                </span>
                {pendingCount > 0 && (
                  <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    {pendingCount} pending
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                onNavigate('terms');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[4px]"
            >
              Terms of Service
            </button>
            <button
              onClick={() => {
                onNavigate('privacy');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[4px]"
            >
              Privacy Policy
            </button>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {isAuthenticated ? (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 rounded-[4px] flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <span>@{user?.namespace}</span>
                    {isAdmin && (
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1 py-0.2 rounded font-bold uppercase">
                        Admin
                      </span>
                    )}
                  </span>
                  <UserIcon className="w-3.5 h-3.5 text-[#7b42bc] dark:text-[#a57de0]" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('sessions-tokens');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-[4px]"
                >
                  Sessions & CI Tokens
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    onNavigate('home');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-[4px]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-xs font-medium text-center text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-[4px]"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    onNavigate('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-xs font-medium text-center text-white bg-[#7b42bc] dark:bg-[#8e52d6] rounded-[4px]"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
