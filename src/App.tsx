import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import DesignSystem from '@/pages/DesignSystem'
import { Button } from '@/components/ui/Button'

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
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-text-primary dark:text-text-primary-dark">
                  Big-O Analyzer
                </h1>
                <p className="text-sm text-text-muted dark:text-text-muted-dark mt-1">
                  Portfolio/SaaS-quality code complexity estimator
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-2 ml-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/design-system">Design System</Link>
              </Button>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant={theme === 'dark' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTheme('dark')}
            >
              Dark
            </Button>
            <Button
              variant={theme === 'light' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={
              <div className="w-full max-w-6xl mx-auto px-4 py-8">
                <div className="p-8 rounded-2xl border border-text-muted/20 dark:border-text-muted-dark/20 bg-bg-secondary dark:bg-bg-secondary-dark shadow-medium text-center animate-slide-up">
                  <h2 className="text-xl font-bold mb-2 text-text-primary dark:text-text-primary-dark">
                    Project Foundation (Phase 1-4 Complete)
                  </h2>
                  <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark mb-4">
                    Stack: Vite + React 18 + TypeScript + Tailwind CSS + ESLint + Prettier + Vitest
                  </p>
                  <div className="text-xs text-text-muted dark:text-text-muted-dark">
                    In later phases, we'll build out the full UI! Check out the Design System page!
                  </div>
                </div>
              </div>
            } />
            <Route path="/design-system" element={<DesignSystem />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-6xl mx-auto px-4 py-6 text-center text-sm text-text-muted dark:text-text-muted-dark">
          Built with Vite, React, TypeScript & Tailwind CSS — Phase 5 in progress
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
