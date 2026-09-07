import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// Load page code only when its route is visited.
const Landing = lazy(() => import('@/pages/Landing'));
const Analyzer = lazy(() => import('@/pages/Analyzer'));
const Learn = lazy(() => import('@/pages/Learn'));
const Quiz = lazy(() => import('@/pages/Quiz'));
const About = lazy(() => import('@/pages/About'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Share = lazy(() => import('@/pages/Share'));
const CheatSheet = lazy(() => import('@/pages/CheatSheet'));
const NotFound = lazy(() => import('@/pages/NotFound'));
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
                <Suspense
                  fallback={
                    <div className="flex min-h-[50vh] items-center justify-center px-6">
                      <div className="flex items-center gap-3 text-sm font-medium text-gray-500 dark:text-gray-400" role="status">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-500" />
                        Loading workspace
                      </div>
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/analyzer" element={<Analyzer />} />
                    <Route path="/learn" element={<Learn />} />
                    <Route path="/quiz" element={<Quiz />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/share" element={<Share />} />
                    <Route path="/cheatsheet" element={<CheatSheet />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
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
