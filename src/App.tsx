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
          {/* Header */}
          <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-highlight-400 flex items-center justify-center shadow-glow">
                  <span className="text-xl font-bold text-white">Ω</span>
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-text-primary dark:text-text-primary-dark">
                    Big-O Analyzer
                  </h1>
                </div>
              </Link>
              <nav className="flex items-center gap-2 ml-8">
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
