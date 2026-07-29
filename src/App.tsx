import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import DesignSystem from '@/pages/DesignSystem'
import Analyzer from '@/pages/Analyzer'
import { Button } from '@/components/ui/Button'
import { ToastProvider } from '@/components/ui/Toast'

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'dark' | 'light'
      return saved || 'dark'
    }
    return 'dark'
  })

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          {/* Header — Glassmorphic shell with grouped actions */}
          <header className="navbar-shell sticky top-0 z-40 w-full">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
              {/* Left: Brand + Primary Nav */}
              <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                <Link to="/" className="flex items-center gap-3 shrink-0">
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 via-accent-400 to-highlight-400 flex items-center justify-center shadow-glow">
                    <div className="absolute -inset-1 bg-gradient-to-br from-accent-500/30 to-highlight-400/30 rounded-xl blur-md opacity-70 -z-10" />
                    <span className="text-xl font-black text-white drop-shadow-sm">Ω</span>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-black tracking-tight text-text-primary dark:text-text-primary-dark leading-none">
                      Big-O Analyzer
                    </h1>
                    <p className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark mt-0.5 leading-none">
                      Complexity Estimator
                    </p>
                  </div>
                </Link>
                <nav className="hidden md:flex items-center ml-2">
                  <div className="nav-actions-group">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/design-system">
                        <span className="mr-1">🎨</span> Design System
                      </Link>
                    </Button>
                  </div>
                </nav>
              </div>

              {/* Right: Theme toggle (segmented) + mobile secondary nav */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <nav className="md:hidden">
                  <div className="nav-actions-group">
                    <Button variant="ghost" size="xs" asChild>
                      <Link to="/design-system">🎨</Link>
                    </Button>
                  </div>
                </nav>
                {/* Theme segmented control */}
                <div className="nav-actions-group" role="group" aria-label="Theme selector">
                  <Button
                    variant={theme === 'dark' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className={theme === 'dark' ? '' : 'text-text-secondary dark:text-text-tertiary'}
                  >
                    <span className="mr-1">🌙</span>
                    <span className="hidden sm:inline">Dark</span>
                  </Button>
                  <Button
                    variant={theme === 'light' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className={theme === 'light' ? '' : 'text-text-secondary dark:text-text-tertiary'}
                  >
                    <span className="mr-1">☀️</span>
                    <span className="hidden sm:inline">Light</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 w-full">
            <Routes>
              <Route path="/" element={<Analyzer />} />
              <Route path="/design-system" element={<DesignSystem />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
