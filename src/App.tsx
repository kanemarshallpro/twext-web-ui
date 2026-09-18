import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TermsBanner } from './components/TermsBanner';

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ExtensionDetailPage } from './pages/ExtensionDetailPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { PublishPage } from './pages/PublishPage';
import { SessionsTokensPage } from './pages/SessionsTokensPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  // Hash-based routing provides flawless navigation in static/iframe environments
  const getHashRoute = () => {
    const raw = window.location.hash.replace(/^#\/?/, '');
    return raw || 'home';
  };

  const [route, setRoute] = useState<string>(getHashRoute());
  const [configRefreshKey] = useState(0);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getHashRoute());
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((targetRoute: string) => {
    window.location.hash = targetRoute;
    setRoute(targetRoute);
    window.scrollTo(0, 0);
  }, []);

  // Parse route components
  const renderCurrentPage = () => {
    // Search route with optional query e.g. "search?q=foo"
    if (route.startsWith('search')) {
      const qIndex = route.indexOf('?q=');
      const query = qIndex !== -1 ? decodeURIComponent(route.substring(qIndex + 3)) : '';
      return <ExplorePage key={`${query}-${configRefreshKey}`} initialQuery={query} onNavigate={navigate} />;
    }

    // Extension detail route e.g. "ext/:namespace/:id"
    if (route.startsWith('ext/')) {
      const parts = route.split('/');
      const namespace = parts[1] || '';
      const id = parts[2] || '';
      if (namespace && id) {
        return (
          <ExtensionDetailPage
            key={`${namespace}/${id}-${configRefreshKey}`}
            namespace={namespace}
            id={id}
            onNavigate={navigate}
          />
        );
      }
    }

    switch (route) {
      case 'home':
        return <HomePage key={configRefreshKey} onNavigate={navigate} />;
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'signup':
        return <SignupPage onNavigate={navigate} />;
      case 'dashboard':
        return <DashboardPage key={configRefreshKey} onNavigate={navigate} />;
      case 'publish':
        return <PublishPage key={configRefreshKey} onNavigate={navigate} />;
      case 'sessions-tokens':
        return <SessionsTokensPage key={configRefreshKey} onNavigate={navigate} />;
      case 'admin':
        return <AdminPage key={configRefreshKey} onNavigate={navigate} />;
      case 'terms':
        return <TermsPage key={configRefreshKey} onNavigate={navigate} />;
      case 'privacy':
        return <PrivacyPage key={configRefreshKey} />;
      default:
        return <HomePage key={configRefreshKey} onNavigate={navigate} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#fcfcfd] dark:bg-[#0f0f13] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#7b42bc] selection:text-white transition-colors duration-150">
          {/* Navigation Bar */}
          <Navbar
            currentRoute={route}
            onNavigate={navigate}
          />

          {/* Global Terms Acceptance Warning Banner */}
          <TermsBanner onNavigate={navigate} />

          {/* Main Content Area */}
          <main className="flex-1">
            {renderCurrentPage()}
          </main>

          {/* Footer */}
          <Footer
            onNavigate={navigate}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
