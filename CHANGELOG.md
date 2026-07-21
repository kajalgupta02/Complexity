# Changelog

## [1.4.0] - 2026-07-21
### Phase 5: Visual Identity
- **Created design system**:
  - New color palette (deep violet + electric cyan accents)
  - Comprehensive typography (Inter for UI, JetBrains Mono for code)
  - Elevation/shadow system (subtle, medium, strong, glow)
  - Spacing and radius scales
  - Dark mode first, with full light mode support
- **Built internal component library**:
  - `Button` - 6 variants, 5 sizes, `asChild` support
  - `Card` - with Header, Title, Description, Content, Footer
  - `Badge` - 6 variants, 4 sizes
  - `Skeleton` - text, circle, rectangle variants
  - `Tabs` - with List, Trigger, Content
  - All components accessible (focus states, keyboard nav)
- **Added React Router DOM** for routing
- **Created `/design-system` showcase page**
- **Wrote `MOTION.md`** guidelines document
- **Updated Tailwind config** with design tokens
- **Updated global styles** with CSS custom properties
- **Added theme persistence** to localStorage

## [1.3.0] - 2026-07-20
### Phase 4: Language Coverage & Edge Cases
- **Redesigned `AnalysisResult` type** with:
  - `reasoningChain`: ordered list of `ReasoningStep`s (each step includes rule, evidence, weight, and confidence change)
  - `timeConfidence` as 0-100 score (instead of high/medium/low)
  - `whatWouldChange`: list of factors that could impact the estimate
  - `knownLimitations`: honest list of tool limitations for transparency
- **Updated loop detection (`loopDetector.ts`)**:
  - Added `startLine`/`endLine`
  - Added `bodyText`
  - Added `hasEarlyBreak` (detects early breaks/returns/throws)
  - Added `hasUnknownFunctionCalls` (lists functions called inside loops that we can't analyze)
- **Updated complexity estimation (`complexityEstimator.ts`)**:
  - Adjusts confidence based on:
    - Early breaks in loops
    - Unknown function calls
    - Ambiguous patterns
  - Generates clear, evidence-based reasoning steps
- **Updated `tokenizer.ts`**: Added helper functions `getLineNumber` and `getCodeSnippet` for better evidence display
- **Updated `recursionDetector.ts`**: Updated to new types
- **Updated `patternDetector.ts`**: Updated to new types

## [1.1.0] - 2026-07-18
### Phase 2: Analysis Engine Rewrite
- **Modular TypeScript analysis engine in `src/lib/analyzer/`**
  - `tokenizer.ts`: Safe comment/string/regex stripping, improved robustness over old version
  - `loopDetector.ts`: Proper brace-matching loop detection with nesting depth calculation
  - `recursionDetector.ts`: Detects both direct and mutual recursion using graph cycle detection
  - `patternDetector.ts`: Detects logarithmic step patterns and divide-and-conquer recursion
  - `complexityEstimator.ts`: Rules engine that combines all signals
  - `index.ts`: Public API (`analyzeCode()`) entrypoint, fully pure function
- Added new complexity classes: O(n³), O(√n), "indeterminate"
- Added space complexity estimation (recursion stack depth, etc.)
- Added Vitest testing framework and comprehensive test suite
- Updated README.md to reflect new analysis engine

## [1.0.0] - 2026-07-17
### Phase 1: Project Foundation
- **Migration from CDN React/Babel to Vite + React 18 + TypeScript toolchain**
- Set up ESLint + Prettier with sane, opinionated configs
- Configured TypeScript in strict mode with path aliases (`@/components`, `@/lib`, `@/hooks`, etc.)
- Integrated Tailwind CSS for modern, responsive, themeable styling (replaced single `style.css`)
- Established clear folder structure (`src/components/`, `src/lib/`, `src/hooks/`, `src/types/`, etc.)
- Added full package.json scripts: `dev`, `build`, `preview`, `lint`, `format`, `typecheck`, `test`
- Set up `.gitignore`, `.env.example`, README.md with project info
- Added GitHub Actions CI workflow that runs `lint`, `typecheck`, and `build` on push/pull request
- Created basic shell UI with dark/light theme toggle
