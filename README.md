# Big-O Analyzer 🚀

A production-ready, portfolio/SaaS-quality tool for estimating code time complexity using heuristic analysis.

## Tech Stack
- **Vite**: Blazing fast build tool
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **ESLint + Prettier**: Code quality and formatting
- **Vite Paths Alias**: Cleaner imports with `@/` prefix

## Project Structure
```
src/
├── components/   # React components
├── lib/          # Analysis engine (framework-agnostic)
├── hooks/        # Custom React hooks
├── types/        # TypeScript type definitions
├── styles/       # Global styles & Tailwind config
├── assets/       # Images, icons, etc.
├── App.tsx       # Root component
└── main.tsx      # React entry point
```

## Getting Started

### Prerequisites
- Node.js (v20 or later recommended)
- pnpm (or npm/yarn)

### Installation
```bash
# Install dependencies
pnpm install
```

### Development
```bash
# Start dev server
pnpm run dev
```
App runs on http://localhost:3000

### Build for Production
```bash
# Create production build in `dist/`
pnpm run build

# Preview production build
pnpm run preview
```

### Other Commands
```bash
# Lint code
pnpm run lint

# Typecheck
pnpm run typecheck

# Format code
pnpm run format
```

## How the Analysis Works (Coming Soon)
This is a heuristic-based analyzer designed for quick interview-style estimates, not formal verification:
- Detects `for`, `while`, `do-while` loops and nesting
- Detects self-recursion
- Looks for logarithmic patterns like `i *= 2`
- Estimates complexity: O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ)

## Deploy
Ready to deploy to Vercel/Netlify out of the box!

## License
MIT
