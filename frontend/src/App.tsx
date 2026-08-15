import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// Pages
import Landing from '@/pages/Landing';
import Analyzer from '@/pages/Analyzer';
import About from '@/pages/About';

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
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-bg-primary dark:bg-bg-primary-dark text-text-primary dark:text-text-primary-dark">
          <Navbar theme={theme} setTheme={setTheme} />
          <main className="flex-1 w-full">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/analyzer" element={<Analyzer />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
