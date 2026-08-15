# Complexity 🚀
### Algorithmic Intelligence & Big-O Asymptotic Analysis Platform

A production-grade, full-stack web application designed to eliminate algorithmic complexity. Complexity performs instant Abstract Syntax Tree (AST) static analysis, derives Big-O time and space complexity, visualizes recursion trees and memory allocations, provides automated code refactoring, and features an interactive Time & Space Complexity Masterclass.

---

## 🌟 Key Features

1. **SaaS Landing Page & Interactive Sandbox**:
   - Hero section with live AST analyzer preview.
   - Interactive $N$-element asymptotic growth visualizer ($O(1)$, $O(\log n)$, $O(n)$, $O(n \log n)$, $O(n^2)$, $O(2^n)$).
   - Data structures & algorithms cheat sheet matrix.
   - Transparent pricing plans (Free, Pro, Enterprise) and FAQ accordion.

2. **Live Code Analyzer IDE**:
   - Multi-language support: **JavaScript**, **TypeScript**, **Python**, **Java**, and **C++**.
   - Side-by-side **A/B Comparative Mode** with live performance winner verdict.
   - Loop gutter markers, nesting depth telemetry, and recurrence relation derivation.
   - One-click PDF audit report export and compressed shareable URLs.

3. **Time & Space Complexity Learning Hub**:
   - Structured curriculum with interactive lessons covering asymptotic notations, two-pointer techniques, sorting bounds, nested loop traps, and call stack memory footprints.
   - Interactive quizzes with immediate explanations, XP rewards, and mastery badges.

4. **Dedicated About Engine Architecture Page**:
   - Comprehensive breakdown of the 5-stage AST static evaluation pipeline (Lexer, Parser, Recurrence Solver, Constraint Bounder, and Refactor Generator).

5. **User Authentication & Persistent Storage**:
   - User account system with LocalStorage persistence and 1-click Demo Profile mode.
   - Personal Snippet Repository: save, tag, search, favorite, and reload analyzed snippets.
   - Activity history logger and learning progress / badge tracker.

---

## 🏗️ Architecture & Tech Stack

```
Complexity/
├── backend/                       # Node.js + Express REST API
│   ├── src/
│   │   ├── analyzer/              # Core Static Analysis Engine
│   │   │   ├── tokenizer.ts       # Multi-language lexical scanner
│   │   │   ├── loopDetector.ts    # Loop nesting and iteration bounds
│   │   │   ├── recursionDetector.ts
│   │   │   ├── complexityEstimator.ts
│   │   │   └── detailedAnalyzer.ts
│   │   └── server.ts              # API Server (POST /api/analyze, GET /api/health)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                      # React 18 + Vite UI Platform
│   ├── src/
│   │   ├── components/            # UI components, Navbar, Footer, AuthModal
│   │   ├── context/               # AuthContext, user data, progress tracking
│   │   ├── data/                  # Samples and learning curriculum
│   │   ├── pages/                 # Landing, Analyzer, Learn, About, Dashboard
│   │   ├── services/              # API layer with offline client fallback
│   │   └── styles/                # Tailwind CSS + Design tokens
│   ├── package.json
│   └── vite.config.ts             # Proxy config (/api -> http://localhost:5000)
│
└── package.json                   # Monorepo workspace runner
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm / pnpm / yarn

### Installation
```bash
# Install all dependencies across monorepo workspaces
npm install
```

### Development
```bash
# Start both frontend (port 3000) and backend (port 5000) concurrently
npm run dev

# Or run frontend only
npm run dev:frontend

# Or run backend only
npm run dev:backend
```

- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000` (`GET /api/health`, `POST /api/analyze`)

### Build & Verification
```bash
# Build both frontend and backend for production
npm run build

# Run unit tests across both workspaces
npm test

# Check frontend TypeScript types
npm --prefix frontend run typecheck

# Lint frontend code
npm --prefix frontend run lint
```

---

## 📄 License
MIT © Complexity Inc.
