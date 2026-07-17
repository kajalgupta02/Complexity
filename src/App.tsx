import { useState } from 'react';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Apply theme to <html> element
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Big-O Analyzer</h1>
          <p className="text-sm opacity-70 mt-1">Portfolio/SaaS-quality code complexity estimator</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded-full font-bold transition-all ${
              theme === 'dark' 
                ? 'bg-primary-500/20 text-white border border-primary-500/35' 
                : 'bg-transparent text-gray-500 hover:text-white'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded-full font-bold transition-all ${
              theme === 'light' 
                ? 'bg-primary-500/20 text-gray-900 border border-primary-500/35' 
                : 'bg-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            Light
          </button>
        </div>
      </header>

      {/* Main content placeholder */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <div className="p-8 rounded-2xl border border-white/10 bg-white/5 shadow-2xl text-center">
          <h2 className="text-xl font-bold mb-2">Project Foundation (Phase 1 Complete)</h2>
          <p className="text-sm opacity-70 mb-4">
            Stack: Vite + React 18 + TypeScript + Tailwind CSS + ESLint + Prettier
          </p>
          <div className="text-xs opacity-50">
            In later phases, we'll build out the code analysis UI and engine!
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 py-6 text-center text-sm opacity-50">
        Built with Vite, React, TypeScript & Tailwind CSS — Phase 1
      </footer>
    </div>
  );
}

export default App;
