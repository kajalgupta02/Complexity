# Complexity Backend & AI Optimization Service

Production-minded, modular Node.js/Express REST API powering Complexity's static AST asymptotic complexity analysis, safe AI-assisted code optimization, and algorithmic intelligence.

---

## 🏗️ Architecture & Module Organization

The backend is built as a **modular monolith** with clean boundaries, zero heavy infrastructure dependencies, and strict resilience guarantees:

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts                 # Strongly-typed environment configuration & validation
│   ├── analyzer/                  # Authoritative Static Code Analysis Engine
│   │   ├── tokenizer.ts           # Multi-language lexical scanner & bracket matcher
│   │   ├── loopDetector.ts        # Nested loop bounds & step-factor detection
│   │   ├── recursionDetector.ts   # Call graph & recurrence relations (Master Theorem)
│   │   ├── complexityEstimator.ts # Big-O asymptotic derivations & space allocations
│   │   └── detailedAnalyzer.ts    # Comprehensive analysis orchestrator
│   ├── ai/                        # AI Integration & Proof-to-Optimize Layer
│   │   ├── types.ts               # Core interfaces (AIAdapter, OptimizationResult, etc.)
│   │   ├── prompt.ts              # Versioned (v1.0) prompt with anti-injection fences
│   │   ├── validator.ts           # Strict schema validation & sanitization of LLM responses
│   │   └── adapter.ts             # Native fetch adapter for Gemini & OpenAI with retry & timeout
│   ├── middleware/
│   │   ├── validate.ts            # Request validation (code bounds, 13 supported languages)
│   │   ├── rateLimit.ts           # Sliding-window in-memory rate limiter (30 req / 15 min)
│   │   └── errorHandler.ts        # Centralized Express error handler (no stack trace leaks)
│   ├── services/
│   │   ├── analysis.service.ts    # Authoritative AST analysis service & ID generation
│   │   └── optimize.service.ts    # DETECT → EXPLAIN → OPTIMIZE → VERIFY workflow
│   ├── routes/
│   │   ├── health.routes.ts       # GET /api/health sanitized status
│   │   ├── analyze.routes.ts      # POST /api/analyze controller
│   │   └── optimize.routes.ts     # POST /api/optimize controller
│   ├── db.ts                      # Embedded SQLite persistent store (node:sqlite)
│   ├── server.ts                  # Express application factory & route wiring
│   └── index.ts                   # Process bootstrap & graceful shutdown
├── database.sqlite                # Local SQLite persistence file
├── .env.example                   # Documented configuration template
├── package.json
└── tsconfig.json
```

### Guiding Architectural Principles

1. **Static Analysis Independence**: Static AST analysis operates completely independently of LLM providers. An AI provider failure, timeout, or missing API key **never** breaks or impedes static analysis.
2. **Authoritative Server Analysis**: Client-supplied complexity or findings are treated as untrusted input. The server always recomputes authoritative static findings before passing context to the AI optimization layer.
3. **Truth-in-Benchmarking & Verification**: The system rigorously distinguishes four distinct dimensions:
   - *Static analysis findings* (deterministic AST derivations).
   - *AI-generated recommendations* (asymptotic hypotheses).
   - *Correctness verification results* (explicitly marked `unverified` unless executed in a certified container sandbox).
   - *Actual benchmark measurements* (marked `unavailable` rather than hallucinating microsecond numbers).
4. **Credential Isolation**: AI API keys (`GEMINI_API_KEY` / `OPENAI_API_KEY`) exist strictly server-side and are never exposed in client bundles, response payloads, or log traces.

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `number` | `5000` | Port for the Express server to listen on |
| `NODE_ENV` | `string` | `development` | `development`, `production`, or `test` |
| `CORS_ORIGIN` | `string` | `http://localhost:3000` | Allowed frontend origins (comma-separated if multiple) |
| `AI_PROVIDER` | `string` | `gemini` | Configured AI provider: `gemini`, `openai`, or `mock` |
| `GEMINI_API_KEY` | `string` | *(optional)* | Google Gemini API key (recommended: `gemini-1.5-flash` or `gemini-1.5-pro`) |
| `GEMINI_MODEL` | `string` | `gemini-1.5-flash` | Gemini model identifier |
| `OPENAI_API_KEY` | `string` | *(optional)* | OpenAI API key |
| `OPENAI_MODEL` | `string` | `gpt-4o-mini` | OpenAI model identifier |
| `AI_TIMEOUT_MS` | `number` | `15000` | Timeout in milliseconds for upstream AI provider requests |
| `AI_RATE_LIMIT_WINDOW_MS` | `number` | `900000` (15m) | Sliding window duration for rate limiting |
| `AI_RATE_LIMIT_MAX_REQUESTS` | `number` | `30` | Maximum optimization requests per client IP per window |
| `DATABASE_PATH` | `string` | `./database.sqlite` | Path to the SQLite database file |

---

## 📡 REST API Specification

### 1. Health Check
`GET /api/health`

Returns application uptime, current timestamp, environment mode, and AI provider readiness. Excludes secrets or stack traces.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-10-20T15:00:00.000Z",
  "uptime": 124.5,
  "environment": "development",
  "ai": {
    "provider": "gemini",
    "configured": true,
    "model": "gemini-1.5-flash"
  }
}
```

---

### 2. Static Code Complexity Analysis
`POST /api/analyze`

Performs deterministic Abstract Syntax Tree (AST) analysis on submitted code. Reuses the multi-language analysis engine supporting 13 languages (JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, and Scala).

**Request Body**:
```json
{
  "language": "python",
  "code": "def find_duplicates(nums):\n    seen = set()\n    dups = []\n    for x in nums:\n        if x in seen:\n            dups.append(x)\n        seen.add(x)\n    return dups"
}
```

**Response `200 OK`**:
```json
{
  "analysisId": "anl-1729437123456-a1b2c3",
  "language": "python",
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(n)",
  "detailedComplexity": {
    "best": "O(1)",
    "average": "O(n)",
    "worst": "O(n)"
  },
  "explanation": "Linear time complexity O(n) driven by a single iteration over the array with O(1) set lookups.",
  "findings": [
    {
      "type": "loop",
      "complexity": "O(n)",
      "line": 4,
      "description": "for loop iterating over nums"
    }
  ],
  "loops": [
    {
      "type": "for",
      "line": 4,
      "depth": 1,
      "variable": "x",
      "iterations": "n",
      "complexity": "O(n)"
    }
  ],
  "recursions": [],
  "spaceAllocations": [
    {
      "type": "collection",
      "name": "seen",
      "complexity": "O(n)",
      "line": 2
    }
  ],
  "assumptions": [
    "Hash set operations execute in amortized O(1) time.",
    "Input size n corresponds to len(nums)."
  ],
  "uncertainty": "Low. Standard single-pass loop structure with linear auxiliary collection."
}
```

**Error Responses**:
- `400 Bad Request`: Missing `code` or `language`, code exceeds 50,000 characters, or unsupported language.

---

### 3. AI-Assisted Code Optimization
`POST /api/optimize`

Executes the signature **Proof-to-Optimize** pipeline:
1. Re-derives authoritative static findings from the submitted source code.
2. Validates whether the code exhibits potential asymptotic or structural inefficiencies.
3. Packages code and AST evidence inside prompt fences (`<user_source_code>`) to eliminate prompt injection risks.
4. Invokes the AI provider adapter with configured timeouts (15s) and automatic bounded retry on transient 429/503 errors.
5. Validates and sanitizes the structured JSON response using `OptimizationResponseValidator`.
6. Attaches explicit verification status (`unverified`) and suggested unit test cases.

**Request Body**:
```json
{
  "language": "javascript",
  "code": "function hasDuplicate(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = i + 1; j < arr.length; j++) {\n      if (arr[i] === arr[j]) return true;\n    }\n  }\n  return false;\n}"
}
```

**Response `200 OK`**:
```json
{
  "optimizationId": "opt-1729437123999-d4e5f6",
  "status": "success",
  "originalAnalysis": {
    "analysisId": "anl-1729437123456-a1b2c3",
    "language": "javascript",
    "timeComplexity": "O(n^2)",
    "spaceComplexity": "O(1)"
  },
  "explanation": "Nested iteration loops through pairs causing quadratic O(n^2) time complexity. Using a hash set achieves linear O(n) search.",
  "optimizedCode": "function hasDuplicate(arr) {\n  const seen = new Set();\n  for (const item of arr) {\n    if (seen.has(item)) return true;\n    seen.add(item);\n  }\n  return false;\n}",
  "metrics": {
    "originalTime": "O(n^2)",
    "optimizedTime": "O(n)",
    "originalSpace": "O(1)",
    "optimizedSpace": "O(n)",
    "primaryBottleneck": "Nested pairwise iteration over the array"
  },
  "tradeoffs": [
    "Trades O(n) auxiliary space to reduce execution time from quadratic to linear."
  ],
  "assumptions": [
    "JavaScript Set has average O(1) lookup and insertion."
  ],
  "verification": {
    "status": "unverified",
    "reason": "AI proposal generated in serverless environment; isolated execution sandbox is not yet enabled for runtime execution.",
    "benchmarkAvailable": false,
    "suggestedUnitTests": [
      {
        "description": "Returns true when consecutive duplicate elements exist",
        "input": "[1, 2, 3, 2]",
        "expectedOutput": "true"
      },
      {
        "description": "Returns false for an empty array or all distinct elements",
        "input": "[1, 2, 3, 4, 5]",
        "expectedOutput": "false"
      }
    ]
  },
  "metadata": {
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "promptVersion": "v1.0"
  }
}
```

**Error Responses**:
- `429 Too Many Requests`: Exceeded 30 optimization requests per 15-minute window (`Retry-After` header included).
- `503 Service Unavailable`: AI provider credentials are unconfigured or upstream provider is temporarily unavailable.
- `504 Gateway Timeout`: Upstream AI provider exceeded the 15-second response deadline.

---

### 4. Snippet Repository & Persistence (Optional Database)
Complexity includes embedded SQLite persistence (`node:sqlite`) for user snippet history and saved audits:
- `GET /api/snippets`: Fetch paginated snippets for the authenticated user / demo account.
- `POST /api/snippets`: Save analyzed code snippet and complexity metadata.
- `DELETE /api/snippets/:id`: Delete a saved snippet.

---

## 🔒 Security & Reliability Engineering

| Measure | Implementation |
| :--- | :--- |
| **Input Validation** | Rejects non-string inputs, empty strings, inputs exceeding 50,000 characters, or unsupported language tags. |
| **Request Size Limits** | Express JSON body parser strictly capped at `100kb`. |
| **Rate Limiting** | In-memory sliding window rate limiter applying IP-based limits (30 calls per 15 minutes) on the expensive `/api/optimize` route. |
| **Prompt Injection Protection** | User code is enclosed in strict XML delimiter boundaries (`<user_source_code>`). The system prompt explicitly instructs the LLM to treat all code and comments as untrusted data, not instructions. |
| **Safe Error Handling** | Production error handler suppresses internal stack traces, system paths, and API keys. |
| **Timeouts & Resilience** | Native `AbortController` limits external AI calls to 15 seconds. Automatic bounded retry (1 retry) on HTTP 429/503. |
| **Zero Server-Side Eval** | No submitted user code or AI-generated proposals are executed inside the Express process (`eval`, `vm`, or `child_process` are strictly forbidden). |

---

## 🧪 Testing & Canonical Evaluation

Run the automated test suites:

```bash
# Run all backend tests (32 tests across 5 test suites)
npm --prefix backend test

# Run tests in watch mode
npm --prefix backend run test:watch
```

### Test Coverage Highlights

- `server.test.ts`:
  - `GET /api/health` sanitized metadata validation.
  - `POST /api/analyze` valid AST parsing & complexity derivations.
  - `POST /api/analyze` invalid input handling (missing code, oversized payload, unsupported language).
  - `POST /api/optimize` rate limiter enforcement (`429 Too Many Requests`).
  - `POST /api/optimize` unconfigured provider graceful failure (`503 Service Unavailable`).
  - **Canonical Algorithm Evaluation Suite**: Validates complexity estimation accuracy across known algorithms:
    - Bubble Sort $\rightarrow O(n^2)$
    - Binary Search $\rightarrow O(\log n)$
    - Linear Search $\rightarrow O(n)$
    - Matrix Multiplication $\rightarrow O(n^3)$
- `ai.test.ts`:
  - Prompt construction with versioning and delimiter fencing.
  - Strict JSON schema validator handling markdown fences (` ```json `), missing fields, and type conversions.
  - Mock AI adapter testing end-to-end orchestration and timeout handling.

---

## 🚀 Running the Full Stack

From the root directory:

```bash
# 1. Install all dependencies
npm install

# 2. Build monorepo
npm run build

# 3. Start development server (Frontend on :3000, Backend on :5000)
npm run dev
```

The frontend Vite proxy automatically forwards `/api/*` requests to `http://localhost:5000`. If the backend is offline, the frontend seamlessly falls back to its local client-side AST engine.
