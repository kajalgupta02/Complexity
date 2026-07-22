import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import DesignSystem from '@/pages/DesignSystem'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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
              <Button size="sm">Get Started</Button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={
                <div className="w-full">
                  {/* Hero Section */}
                  <section className="max-w-7xl mx-auto px-6 py-20">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                      <div className="space-y-8 animate-slide-up">
                        <Badge variant="primary" size="lg">Version 1.0 is here 🎉</Badge>
                        <div className="space-y-4">
                          <h2 className="text-5xl lg:text-7xl font-black leading-tight text-text-primary dark:text-text-primary-dark">
                            Analyze your <span className="bg-gradient-to-r from-accent-500 to-highlight-400 bg-clip-text text-transparent">code complexity</span> in seconds.
                          </h2>
                          <p className="text-xl text-text-tertiary dark:text-text-tertiary-dark max-w-lg">
                            Stop guessing about your code's performance. Get instant, accurate Big-O complexity analysis for your functions with zero setup.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <Button size="lg" className="text-base">Try it Now</Button>
                          <Button variant="secondary" size="lg" className="text-base">View Docs</Button>
                        </div>
                        <div className="flex items-center gap-8 pt-4">
                          <div>
                            <div className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">99.9%</div>
                            <div className="text-sm text-text-muted dark:text-text-muted-dark">Accuracy</div>
                          </div>
                          <div className="h-10 w-px bg-text-muted/20 dark:bg-text-muted-dark/20" />
                          <div>
                            <div className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">&lt;100ms</div>
                            <div className="text-sm text-text-muted dark:text-text-muted-dark">Analysis Time</div>
                          </div>
                          <div className="h-10 w-px bg-text-muted/20 dark:bg-text-muted-dark/20" />
                          <div>
                            <div className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">5+</div>
                            <div className="text-sm text-text-muted dark:text-text-muted-dark">Languages</div>
                          </div>
                        </div>
                      </div>

                      {/* Hero Visual */}
                      <div className="relative animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="absolute -inset-4 bg-gradient-to-r from-accent-500/20 to-highlight-400/20 rounded-3xl blur-2xl" />
                        <Card className="relative border-none shadow-strong">
                          <CardContent className="p-6">
                            <div className="bg-bg-tertiary dark:bg-bg-tertiary-dark rounded-xl p-4 font-mono text-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 rounded-full bg-danger-500" />
                                <div className="w-3 h-3 rounded-full bg-warning-500" />
                                <div className="w-3 h-3 rounded-full bg-success-500" />
                              </div>
                              <pre className="text-text-secondary dark:text-text-secondary-dark overflow-x-auto">
                                <span className="text-accent-500">function</span> <span className="text-highlight-400">fibonacci</span>(n) {'{'}<br />
                                &nbsp;&nbsp;<span className="text-text-muted dark:text-text-muted-dark">// O(2ⁿ) - Exponential time</span><br />
                                &nbsp;&nbsp;<span className="text-accent-500">if</span> (n &lt;= 1) <span className="text-accent-500">return</span> n;<br />
                                &nbsp;&nbsp;<span className="text-accent-500">return</span> fibonacci(n - 1) + fibonacci(n - 2);<br />
                                {'}'}<br /><br />
                                <span className="text-success-500">✓ Analyzed: O(2ⁿ)</span>
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </section>

                  {/* Features Section */}
                  <section className="max-w-7xl mx-auto px-6 py-20">
                    <div className="text-center mb-16 space-y-4">
                      <Badge variant="outline">Features</Badge>
                      <h3 className="text-4xl font-bold text-text-primary dark:text-text-primary-dark">
                        Everything you need for complexity analysis
                      </h3>
                      <p className="text-text-tertiary dark:text-text-tertiary-dark max-w-2xl mx-auto">
                        Powerful features designed for developers who care about performance.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                      {[
                        {
                          title: "Instant Analysis",
                          description: "Get real-time complexity analysis as you type. No waiting, no hassle.",
                          icon: "⚡"
                        },
                        {
                          title: "Multi-Language",
                          description: "Supports JavaScript, Python, Java, C++, and more coming soon.",
                          icon: "🌍"
                        },
                        {
                          title: "Educational Insights",
                          description: "Learn why your code has that complexity and how to optimize it.",
                          icon: "📚"
                        },
                        {
                          title: "Visual Charts",
                          description: "See performance trends with beautiful, interactive visualizations.",
                          icon: "📊"
                        },
                        {
                          title: "Code Comparisons",
                          description: "Compare different implementations side by side to find the best one.",
                          icon: "🔄"
                        },
                        {
                          title: "API Access",
                          description: "Integrate complexity analysis into your own tools with our simple API.",
                          icon: "🔌"
                        }
                      ].map((feature, idx) => (
                        <Card key={idx} className="group hover:shadow-strong transition-all duration-300">
                          <CardContent className="p-8">
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h4 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2 group-hover:text-accent-500 transition-colors">
                              {feature.title}
                            </h4>
                            <p className="text-text-tertiary dark:text-text-tertiary-dark">
                              {feature.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>

                  {/* CTA Section */}
                  <section className="max-w-7xl mx-auto px-6 py-20">
                    <div className="bg-gradient-to-r from-accent-500 to-highlight-400 rounded-3xl p-12 text-center">
                      <h3 className="text-4xl font-bold text-white mb-4">
                        Ready to optimize your code?
                      </h3>
                      <p className="text-white/80 text-xl mb-8 max-w-2xl mx-auto">
                        Start analyzing your code's complexity today and build faster, more efficient applications.
                      </p>
                      <div className="flex flex-wrap justify-center gap-4">
                        <Button variant="secondary" size="lg" className="bg-white text-accent-600 hover:bg-white/90">
                          Get Started Free
                        </Button>
                        <Button variant="ghost" size="lg" className="text-white hover:bg-white/10">
                          Contact Sales
                        </Button>
                      </div>
                    </div>
                  </section>
                </div>
              } />
              <Route path="/design-system" element={<DesignSystem />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="w-full max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-highlight-400 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">Ω</span>
                </div>
                <span className="font-bold text-text-primary dark:text-text-primary-dark">
                  Big-O Analyzer
                </span>
              </div>
              <div className="text-sm text-text-muted dark:text-text-muted-dark">
                © 2024 Big-O Analyzer. All rights reserved.
              </div>
              <div className="flex items-center gap-6 text-sm text-text-tertiary dark:text-text-tertiary-dark">
                <a href="#" className="hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
