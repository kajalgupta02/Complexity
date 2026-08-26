import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// Pages
import Landing from '@/pages/Landing';
import Analyzer from '@/pages/Analyzer';
import Learn from '@/pages/Learn';
import About from '@/pages/About';
import Dashboard from '@/pages/Dashboard';
import Interview from '@/pages/Interview';
import Share from '@/pages/Share';
import CheatSheet from '@/pages/CheatSheet';
import NotFound from '@/pages/NotFound';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'dark' | 'light';
      return saved || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-indigo-600 focus:text-white focus:font-bold focus:rounded-2xl focus:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Skip to main content
          </a>
          <div className="min-h-screen flex flex-col bg-bg-primary dark:bg-bg-primary-dark text-text-primary dark:text-text-primary-dark">
            <Navbar theme={theme} setTheme={setTheme} />
            <main id="main-content" tabIndex={-1} className="flex-1 w-full focus:outline-none">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/analyzer" element={<Analyzer />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/interview" element={<Interview />} />
                  <Route path="/share" element={<Share />} />
                  <Route path="/cheatsheet" element={<CheatSheet />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
