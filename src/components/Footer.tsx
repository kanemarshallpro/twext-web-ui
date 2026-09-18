import React from 'react';
import { BrandLogo } from './BrandLogo';
import { api } from '../services/api';
import { ExternalLink, Server } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white dark:bg-[#15151c] border-t border-zinc-200 dark:border-zinc-800 mt-auto transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & summary */}
          <div className="md:col-span-2 space-y-3">
            <BrandLogo size="md" />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed">
              Twext is the official registry of extensions for TurboWarp. Publish, discover, and install community extensions built with the zero-config Twext compiler.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-[#1d1d26] border border-zinc-200 dark:border-zinc-700/80 rounded-[4px]">
                <Server className="w-3 h-3 text-[#7b42bc] dark:text-[#a57de0]" />
                <span>API: {api.getBaseUrl()}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Registry & Resources */}
          <div>
            <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider mb-3">
              Registry
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('search')}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-[#7b42bc] dark:hover:text-[#be98f7] transition-colors"
                >
                  Explore Extensions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('publish')}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-[#7b42bc] dark:hover:text-[#be98f7] transition-colors"
                >
                  Publish an Extension
                </button>
              </li>
              <li>
                <a
                  href="https://turbowarp.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-600 dark:text-zinc-400 hover:text-[#7b42bc] dark:hover:text-[#be98f7] transition-colors inline-flex items-center gap-1"
                >
                  TurboWarp Editor <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Governance */}
          <div>
            <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider mb-3">
              Governance
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-[#7b42bc] dark:hover:text-[#be98f7] transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-[#7b42bc] dark:hover:text-[#be98f7] transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('sessions-tokens')}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-[#7b42bc] dark:hover:text-[#be98f7] transition-colors"
                >
                  CI Automation Tokens
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
          <div>
            <span>© 2026 Twext Team. Public TurboWarp extension registry.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>RFC 7807 Compliant REST API v0</span>
            <span>•</span>
            <button
              onClick={() => onNavigate('publish')}
              className="hover:underline text-zinc-600 dark:text-zinc-400 hover:text-[#7b42bc] dark:hover:text-[#be98f7]"
            >
              Publish Guide
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
