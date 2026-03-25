var { useState } = React;

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCommentsAndStrings(input) {
  let s = input || "";
  // Block comments: /* ... */
  s = s.replace(/\/\*[\s\S]*?\*\//g, " ");
  // Line comments: // ...
  s = s.replace(/\/\/.*$/gm, " ");
  // String literals (best-effort; enough for interview samples)
  s = s.replace(/"(?:\\.|[^"\\])*"/g, '""');
  s = s.replace(/'(?:\\.|[^'\\])*'/g, "''");
  s = s.replace(/`(?:\\.|[^`\\])*`/g, "``");
  return s;
}

function findMatchingBrace(text, openIndex) {
  if (openIndex < 0 || openIndex >= text.length || text[openIndex] !== "{") return -1;
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth === 0) return i;
  }
  return -1;
}

function detectRecursion(code) {
  const keywordSet = new Set([
    "if",
    "for",
    "while",
    "switch",
    "catch",
    "do",
    "return",
    "throw",
    "else",
    "try",
    "finally",
  ]);

  // function-like blocks: <name>(...) { ... }
  const fnRegex = /\b([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/g;
  let match;
  const results = [];

  while ((match = fnRegex.exec(code)) !== null) {
    const name = match[1];
    if (keywordSet.has(name)) continue;

    const braceIndex = code.indexOf("{", match.index);
    const closeIndex = findMatchingBrace(code, braceIndex);
    if (braceIndex === -1 || closeIndex === -1) continue;

    const body = code.slice(braceIndex, closeIndex + 1);
    const callRegex = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "g");
    const matches = body.match(callRegex) || [];

    if (matches.length > 0) results.push({ functionName: name, callCount: matches.length });
  }

  if (results.length === 0) return { recursionDetected: false, recursionCalls: 0, functionName: null };

  results.sort((a, b) => b.callCount - a.callCount);
  return {
    recursionDetected: true,
    recursionCalls: results[0].callCount,
    functionName: results[0].functionName,
  };
}

function extractLoopBlocks(code) {
  const loops = [];
  const skipRanges = [];

  function overlapsAnyRange(start, end) {
    for (const r of skipRanges) {
      if (start >= r.start && start < r.end) return true;
      if (end > r.start && end <= r.end) return true;
    }
    return false;
  }

  const candidates = [];
  let m;

  const forRe = /\bfor\s*\(/g;
  const whileRe = /\bwhile\s*\(/g;
  const doRe = /\bdo\b/g;

  while ((m = forRe.exec(code)) !== null) candidates.push({ kind: "for", index: m.index });
  while ((m = whileRe.exec(code)) !== null) candidates.push({ kind: "while", index: m.index });
  while ((m = doRe.exec(code)) !== null) candidates.push({ kind: "do", index: m.index });
  candidates.sort((a, b) => a.index - b.index);

  for (const c of candidates) {
    // Avoid double counting the while(...) part of a do-while.
    if (c.kind === "while" && overlapsAnyRange(c.index, c.index + 1)) continue;

    if (c.kind === "do") {
      const headerStart = c.index;
      const bodyBraceStart = code.indexOf("{", headerStart);
      if (bodyBraceStart === -1) continue;

      const bodyBraceEnd = findMatchingBrace(code, bodyBraceStart);
      if (bodyBraceEnd === -1) continue;

      const afterBody = code.slice(bodyBraceEnd);
      const whileInDo = /\bwhile\s*\(/.exec(afterBody);
      let endIndex = bodyBraceEnd + 1;

      if (whileInDo && typeof whileInDo.index === "number") {
        const whileIndex = bodyBraceEnd + whileInDo.index;
        const semi = code.indexOf(";", whileIndex);
        endIndex = semi === -1 ? bodyBraceEnd + 1 : semi + 1;
      }

      loops.push({
        kind: "do",
        start: headerStart,
        end: endIndex,
        headerText: code.slice(headerStart, bodyBraceStart).trim().slice(0, 180),
        loopText: code.slice(headerStart, endIndex),
      });
      skipRanges.push({ start: headerStart, end: endIndex });
      continue;
    }

    const headerStart = c.index;
    const braceIndex = code.indexOf("{", headerStart);
    const semiIndex = code.indexOf(";", headerStart);

    let endIndex = -1;
    let headerText = "";
    let loopText = "";

    if (braceIndex !== -1 && (semiIndex === -1 || braceIndex < semiIndex)) {
      const closeIndex = findMatchingBrace(code, braceIndex);
      if (closeIndex !== -1) {
        endIndex = closeIndex + 1;
        loopText = code.slice(headerStart, endIndex);
        headerText = code.slice(headerStart, braceIndex).trim().slice(0, 180);
      }
    }

    if (endIndex === -1) {
      const fallbackEnd = semiIndex !== -1 ? semiIndex + 1 : Math.min(headerStart + 240, code.length);
      endIndex = fallbackEnd;
      loopText = code.slice(headerStart, endIndex);
      headerText = code.slice(headerStart, Math.min(headerStart + 180, endIndex)).trim();
    }

    loops.push({ kind: c.kind, start: headerStart, end: endIndex, headerText, loopText });
  }

  return loops;
}

function computeLoopNestingStats(loops) {
  const levels = new Array(loops.length).fill(0);
  for (let i = 0; i < loops.length; i++) {
    for (let j = 0; j < loops.length; j++) {
      if (i === j) continue;
      const a = loops[i];
      const b = loops[j];
      const contains = a.start > b.start && a.end <= b.end;
      if (contains) levels[i]++;
    }
  }

  const maxNestingDepth = loops.length === 0 ? 0 : Math.max.apply(null, levels) + 1;

  const containsAny = (i) => loops.some((o, j) => j !== i && o.start > loops[i].start && o.end <= loops[i].end);
  const isContainedByAny = (i) => loops.some((o, j) => j !== i && loops[i].start > o.start && loops[i].end <= o.end);

  const innerNestedLoops = loops.filter((_, i) => isContainedByAny(i)).length;
  const outerNestedLoops = loops.filter((_, i) => containsAny(i)).length;
  const sequentialLoops = loops.filter((_, i) => !isContainedByAny(i) && !containsAny(i)).length;

  return { maxNestingDepth, levels, innerNestedLoops, outerNestedLoops, sequentialLoops };
}

function analyzeCode(rawCode) {
  const input = (rawCode || "").trim();
  if (!input) return { kind: "error", message: "Please paste some code to analyze." };

  const code = stripCommentsAndStrings(input);
  const recursion = detectRecursion(code);
  const loops = extractLoopBlocks(code);
  const loopsDetected = loops.length;
  const loopStats = computeLoopNestingStats(loops);

  // Log step inside loop like i *= 2 or i /= 2 (variable name can differ)
  const logRegex = /\b[A-Za-z_]\w*\s*(\*=|\/=)\s*2\b/;
  const logDetected = loops.some((l) => logRegex.test(l.loopText));

  const reasoningSteps = [
    {
      title: "Recursion check",
      detail: recursion.recursionDetected
        ? `Found recursion: function "${recursion.functionName}" calls itself (${recursion.recursionCalls} time(s)).`
        : "No self-recursive function call detected.",
    },
    {
      title: "Loop detection",
      detail:
        loopsDetected > 0
          ? `Detected ${loopsDetected} loop(s). Max nesting depth: ${loopStats.maxNestingDepth}.`
          : "No loops detected (no for/while/do).",
    },
    {
      title: "Logarithmic pattern",
      detail: logDetected
        ? "Found logarithmic step pattern like `i *= 2` / `i /= 2` inside a loop."
        : "No logarithmic step pattern found.",
    },
  ];

  let timeComplexity = "O(1)";
  let confidence = "High";
  let chosenRule = "No loops -> O(1)";

  if (recursion.recursionDetected) {
    timeComplexity = "O(2^n)";
    confidence = "High";
    chosenRule = "Self recursion -> exponential time (basic assumption)";
  } else if (loopStats.maxNestingDepth >= 2) {
    if (logDetected) {
      // Per requirement: Nested + Log -> O(n log n)
      timeComplexity = "O(n log n)";
      confidence = "Medium";
      chosenRule = "Nested loops + log step -> O(n log n) (heuristic)";
    } else {
      timeComplexity = "O(n^2)";
      confidence = "High";
      chosenRule = "Nested loops -> quadratic time";
    }
  } else if (logDetected) {
    timeComplexity = "O(log n)";
    confidence = "Medium";
    chosenRule = "Log step inside a single loop -> O(log n)";
  } else if (loopsDetected >= 1) {
    timeComplexity = "O(n)";
    confidence = "Low";
    chosenRule = "Loops without nesting -> linear growth (treat sequential loops as O(n))";
  } else {
    timeComplexity = "O(1)";
    confidence = "High";
    chosenRule = "No loops -> constant time";
  }

  reasoningSteps.push({
    title: "Final decision",
    detail: `Rule fired: ${chosenRule}.`,
  });

  const explanationShort = recursion.recursionDetected
    ? "Recursion detected, so runtime grows exponentially under the basic interview assumption."
    : loopStats.maxNestingDepth >= 2
      ? logDetected
        ? "Nested loops combined with a logarithmic step, modeled as O(n log n) by heuristic."
        : "Nested loops detected, so runtime is modeled as quadratic (O(n^2))."
      : logDetected
        ? "A logarithmic step pattern was detected in the loop, modeled as O(log n)."
        : loopsDetected >= 1
          ? "Loops detected without nesting, modeled as linear growth (O(n))."
          : "No loops detected, so runtime is constant (O(1)).";

  const detectedPatterns = [];
  if (recursion.recursionDetected) {
    detectedPatterns.push(`${recursion.functionName} recursion (${recursion.recursionCalls} call(s))`);
  }
  if (loopsDetected > 0) {
    detectedPatterns.push(`${loopsDetected} loop(s) detected`);
    if (loopStats.maxNestingDepth >= 2) detectedPatterns.push(`${loopStats.innerNestedLoops} nested (inner) loop(s)`);
    if (loopStats.sequentialLoops > 0) detectedPatterns.push(`${loopStats.sequentialLoops} sequential loop(s)`);
  }
  detectedPatterns.push(logDetected ? "log-step pattern found (i *= 2 / i /= 2)" : "no log-step pattern found");

  return {
    kind: "result",
    timeComplexity,
    confidence,
    explanationShort,
    loops,
    loopsDetected,
    loopStats,
    logDetected,
    recursionDetected: recursion.recursionDetected,
    recursionCalls: recursion.recursionCalls,
    recursionFunctionName: recursion.functionName,
    reasoningSteps,
    detectedPatterns,
  };
}

function Header({ theme, setTheme }) {
  return (
    <div className="header">
      <div className="headerLeft">
        <div className="title">Code Complexity Analyzer</div>
        <div className="subtitle">Big-O estimates from loops + recursion (interview-ready).</div>
      </div>

      <div className="headerRight">
        <div className="themeToggle" role="group" aria-label="Theme toggle">
          <button className={`themeBtn ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
            Dark
          </button>
          <button className={`themeBtn ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>
            Light
          </button>
        </div>
      </div>
    </div>
  );
}

function CodeInput({
  code,
  setCode,
  onAnalyze,
  onCopy,
  onClear,
  isAnalyzing,
  errorMessage,
  onSelectSample,
  onExplain,
  showExplain,
}) {
  const lineCount = Math.max(1, (code || "").split("\n").length);
  const limitedLineCount = Math.min(lineCount, 300);
  const [scrollTop, setScrollTop] = useState(0);

  return (
    <div className="card editorCard">
      <div className="cardHeader">
        <div className="cardTitle">Input Code</div>
        <div className="cardMeta">Supports C++ / Java / JavaScript-style syntax.</div>
      </div>

      <div className="sampleRow">
        <div className="sampleLabel">Quick tests:</div>
        <div className="sampleButtons">
          <button className="btn secondary" onClick={() => onSelectSample("on")}>
            Test O(n)
          </button>
          <button className="btn secondary" onClick={() => onSelectSample("on2")}>
            Test O(n^2)
          </button>
        </div>
      </div>

      <div className="codePane">
        <div className="lineNumbers" aria-hidden="true" style={{ transform: `translateY(${-scrollTop}px)` }}>
          {Array.from({ length: limitedLineCount }, (_, i) => (
            <div key={i + 1} className="ln">
              {i + 1}
            </div>
          ))}
          {lineCount > limitedLineCount && <div className="ln ellipsis">...</div>}
        </div>

        <textarea
          className="codeTextarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={(e) => setScrollTop(e.target.scrollTop)}
          spellCheck={false}
          placeholder="Paste code here..."
        />
      </div>

      {errorMessage && <div className="errorBox">{errorMessage}</div>}

      <div className="btnRow">
        <button className="btn" onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <span className="spinner" aria-label="Analyzing" /> : "Analyze"}
        </button>
        <button className="btn secondary" onClick={onCopy}>
          Copy
        </button>
        <button className="btn secondary" onClick={onClear}>
          Clear
        </button>
        <button className="btn secondary" onClick={onExplain} disabled={showExplain}>
          Explain Complexity
        </button>
      </div>
    </div>
  );
}

function ComplexityBadge({ value }) {
  return (
    <div className="badge">
      <div className="badgeK">Complexity</div>
      <div className="badgeV">{value}</div>
    </div>
  );
}

function ConfidenceBadge({ value }) {
  return (
    <div className="badge">
      <div className="badgeK">Confidence</div>
      <div className={`badgeV ${value.toLowerCase()}`}>{value}</div>
    </div>
  );
}

function LoopHighlights({ loops }) {
  if (!loops || loops.length === 0) return <div className="muted">No loop blocks to highlight.</div>;

  return (
    <div className="loopList">
      {loops.map((l, idx) => (
        <div className="loopItem" key={`${l.start}-${idx}`}>
          <div className="loopTop">
            <div className="loopType">{l.kind.toUpperCase()}</div>
            <div className="loopHint">Detected</div>
          </div>
          <div className="loopHeader">
            <span className="loopKw">{l.kind}</span>
            <span className="loopText">{l.headerText ? " " + l.headerText : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultCard({ result, showExplain }) {
  if (!result) {
    return (
      <div className="card resultCard">
        <div className="muted">Paste code and click Analyze.</div>
      </div>
    );
  }

  if (result.kind === "error") {
    return (
      <div className="card resultCard">
        <div className="errorBox">{result.message}</div>
      </div>
    );
  }

  return (
    <div className="card resultCard">
      <div className="resultTop">
        <ComplexityBadge value={result.timeComplexity} />
        <ConfidenceBadge value={result.confidence} />
      </div>

      <div className="section">
        <div className="sectionTitle">Explanation</div>
        <div className="explainText">{result.explanationShort}</div>
      </div>

      <div className="section">
        <div className="sectionTitle">Detected Patterns</div>
        <div className="patterns">
          {result.detectedPatterns.map((p, idx) => (
            <div className="pattern" key={`${p}-${idx}`}>
              {p}
            </div>
          ))}
        </div>
      </div>

      {showExplain && (
        <div className="section">
          <div className="sectionTitle">Reasoning (step-by-step)</div>
          <div className="reasoning">
            {result.reasoningSteps.map((s, idx) => (
              <div className="reasonStep" key={`${s.title}-${idx}`}>
                <div className="reasonTitle">
                  {idx + 1}. {s.title}
                </div>
                <div className="reasonDetail">{s.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="sectionTitle">Loop highlights</div>
        <LoopHighlights loops={result.loops} />
      </div>

      {!showExplain && <div className="muted small">Press "Explain Complexity" to see detailed reasoning.</div>}
    </div>
  );
}

function Footer() {
  return <div className="footer">Built for interviews: fast heuristics, readable reasoning, and a clean developer-tool UI.</div>;
}

function App() {
  const initialExampleCode = `function sum(n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += i;
  }
  return total;
}`;

  const samples = {
    on: initialExampleCode,
    on2: `function countPairs(n) {
  let pairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      pairs++;
    }
  }
  return pairs;
}`,
  };

  const [theme, setTheme] = useState("dark");
  const [code, setCode] = useState(initialExampleCode);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;

  const analyze = async () => {
    setErrorMessage("");
    const trimmed = (code || "").trim();
    if (!trimmed) {
      setResult({ kind: "error", message: "Please paste some code to analyze." });
      setErrorMessage("Input is empty.");
      return;
    }

    setIsAnalyzing(true);
    await new Promise((r) => setTimeout(r, 350));
    setResult(analyzeCode(code));
    setIsAnalyzing(false);
    setShowExplain(false);
  };

  const onCopy = async () => {
    setErrorMessage("");
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {
      setErrorMessage("Copy failed. Your browser may block clipboard access.");
    }
  };

  const onClear = () => {
    setErrorMessage("");
    setCode("");
    setResult(null);
    setShowExplain(false);
  };

  const onSelectSample = (key) => {
    const next = samples[key] || initialExampleCode;
    setCode(next);
    setResult(null);
    setErrorMessage("");
    setShowExplain(false);
  };

  const onExplain = () => setShowExplain(true);

  return (
    <div className="appRoot">
      <Header theme={theme} setTheme={setTheme} />
      <div className="mainGrid">
        <CodeInput
          code={code}
          setCode={setCode}
          onAnalyze={analyze}
          onCopy={onCopy}
          onClear={onClear}
          isAnalyzing={isAnalyzing}
          errorMessage={errorMessage}
          onSelectSample={onSelectSample}
          onExplain={onExplain}
          showExplain={showExplain}
        />
        <ResultCard result={result} showExplain={showExplain} />
      </div>
      <Footer />
    </div>
  );
}

window.App = App;

var { useState } = React;

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCommentsAndStrings(input) {
  let s = input || "";
  s = s.replace(/\/\*[\s\S]*?\*\//g, " ");
  s = s.replace(/\/\/.*$/gm, " ");
  s = s.replace(/"(?:\\.|[^"\\])*"/g, '""');
  s = s.replace(/'(?:\\.|[^'\\])*'/g, "''");
  s = s.replace(/`(?:\\.|[^`\\])*`/g, "``");
  return s;
}

function findMatchingBrace(text, openIndex) {
  if (openIndex < 0 || openIndex >= text.length || text[openIndex] !== "{") return -1;
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth === 0) return i;
  }
  return -1;
}

function detectRecursion(code) {
  const keywordSet = new Set([
    "if",
    "for",
    "while",
    "switch",
    "catch",
    "do",
    "return",
    "throw",
    "else",
    "try",
    "finally",
  ]);

  const fnRegex = /\b([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/g;
  const results = [];

  let match;
  while ((match = fnRegex.exec(code)) !== null) {
    const name = match[1];
    if (keywordSet.has(name)) continue;

    const braceIndex = code.indexOf("{", match.index);
    const closeIndex = findMatchingBrace(code, braceIndex);
    if (braceIndex === -1 || closeIndex === -1) continue;

    const body = code.slice(braceIndex, closeIndex + 1);
    const callRegex = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "g");
    const matches = body.match(callRegex) || [];
    if (matches.length > 0) results.push({ functionName: name, callCount: matches.length });
  }

  if (results.length === 0) return { recursionDetected: false, recursionCalls: 0, functionName: null };

  results.sort((a, b) => b.callCount - a.callCount);
  return { recursionDetected: true, recursionCalls: results[0].callCount, functionName: results[0].functionName };
}

function extractLoopBlocks(code) {
  const loops = [];
  const skipRanges = [];

  function overlapsAnyRange(start, end) {
    for (const r of skipRanges) {
      if (start >= r.start && start < r.end) return true;
      if (end > r.start && end <= r.end) return true;
    }
    return false;
  }

  const candidates = [];
  let m;
  const forRe = /\bfor\s*\(/g;
  const whileRe = /\bwhile\s*\(/g;
  const doRe = /\bdo\b/g;

  while ((m = forRe.exec(code)) !== null) candidates.push({ kind: "for", index: m.index });
  while ((m = whileRe.exec(code)) !== null) candidates.push({ kind: "while", index: m.index });
  while ((m = doRe.exec(code)) !== null) candidates.push({ kind: "do", index: m.index });
  candidates.sort((a, b) => a.index - b.index);

  for (const c of candidates) {
    if (c.kind === "while" && overlapsAnyRange(c.index, c.index + 1)) continue;

    if (c.kind === "do") {
      const headerStart = c.index;
      const bodyBraceStart = code.indexOf("{", headerStart);
      if (bodyBraceStart === -1) continue;

      const bodyBraceEnd = findMatchingBrace(code, bodyBraceStart);
      if (bodyBraceEnd === -1) continue;

      const afterBody = code.slice(bodyBraceEnd);
      const whileInDo = /\bwhile\s*\(/.exec(afterBody);
      let endIndex = bodyBraceEnd + 1;

      if (whileInDo && typeof whileInDo.index === "number") {
        const whileIndex = bodyBraceEnd + whileInDo.index;
        const semi = code.indexOf(";", whileIndex);
        endIndex = semi === -1 ? bodyBraceEnd + 1 : semi + 1;
      }

      loops.push({
        kind: "do",
        start: headerStart,
        end: endIndex,
        headerText: code.slice(headerStart, bodyBraceStart).trim().slice(0, 180),
        loopText: code.slice(headerStart, endIndex),
      });
      skipRanges.push({ start: headerStart, end: endIndex });
      continue;
    }

    const headerStart = c.index;
    const braceIndex = code.indexOf("{", headerStart);
    const semiIndex = code.indexOf(";", headerStart);

    let endIndex = -1;
    let headerText = "";
    let loopText = "";

    if (braceIndex !== -1 && (semiIndex === -1 || braceIndex < semiIndex)) {
      const closeIndex = findMatchingBrace(code, braceIndex);
      if (closeIndex !== -1) {
        endIndex = closeIndex + 1;
        loopText = code.slice(headerStart, endIndex);
        headerText = code.slice(headerStart, braceIndex).trim().slice(0, 180);
      }
    }

    if (endIndex === -1) {
      const fallbackEnd = semiIndex !== -1 ? semiIndex + 1 : Math.min(headerStart + 240, code.length);
      endIndex = fallbackEnd;
      loopText = code.slice(headerStart, endIndex);
      headerText = code.slice(headerStart, Math.min(headerStart + 180, endIndex)).trim();
    }

    loops.push({ kind: c.kind, start: headerStart, end: endIndex, headerText, loopText });
  }

  return loops;
}

function computeLoopNestingStats(loops) {
  const levels = new Array(loops.length).fill(0);

  for (let i = 0; i < loops.length; i++) {
    for (let j = 0; j < loops.length; j++) {
      if (i === j) continue;
      const a = loops[i];
      const b = loops[j];
      const contains = a.start > b.start && a.end <= b.end;
      if (contains) levels[i]++;
    }
  }

  const maxNestingDepth = loops.length === 0 ? 0 : Math.max(...levels) + 1;

  const containsAny = (i) => loops.some((o, j) => j !== i && o.start > loops[i].start && o.end <= loops[i].end);
  const isContainedByAny = (i) => loops.some((o, j) => j !== i && loops[i].start > o.start && loops[i].end <= o.end);

  const innerNestedLoops = loops.filter((_, i) => isContainedByAny(i)).length;
  const outerNestedLoops = loops.filter((_, i) => containsAny(i)).length;
  const sequentialLoops = loops.filter((_, i) => !isContainedByAny(i) && !containsAny(i)).length;

  return { maxNestingDepth, levels, innerNestedLoops, outerNestedLoops, sequentialLoops };
}

function analyzeCode(rawCode) {
  const input = (rawCode || "").trim();
  if (!input) return { kind: "error", message: "Please paste some code to analyze." };

  const code = stripCommentsAndStrings(input);
  const recursion = detectRecursion(code);
  const loops = extractLoopBlocks(code);
  const loopsDetected = loops.length;
  const loopStats = computeLoopNestingStats(loops);

  const logRegex = /\b[A-Za-z_]\w*\s*(\*=|\/=)\s*2\b/;
  const logDetected = loops.some((l) => logRegex.test(l.loopText));

  const reasoningSteps = [
    {
      title: "Recursion check",
      detail: recursion.recursionDetected
        ? `Found recursion: function "${recursion.functionName}" calls itself (${recursion.recursionCalls} time(s)).`
        : "No self-recursive function call detected.",
    },
    {
      title: "Loop detection",
      detail:
        loopsDetected > 0
          ? `Detected ${loopsDetected} loop(s). Max nesting depth: ${loopStats.maxNestingDepth}.`
          : "No loops detected (no for/while/do).",
    },
    {
      title: "Logarithmic pattern",
      detail: logDetected
        ? "Found logarithmic step pattern like `i *= 2` / `i /= 2` inside a loop."
        : "No logarithmic step pattern found.",
    },
  ];

  let timeComplexity = "O(1)";
  let confidence = "High";
  let chosenRule = "No loops -> O(1)";

  if (recursion.recursionDetected) {
    timeComplexity = "O(2^n)";
    confidence = "High";
    chosenRule = "Self recursion -> exponential time (basic assumption)";
  } else if (loopStats.maxNestingDepth >= 2) {
    if (logDetected) {
      timeComplexity = "O(n log n)";
      confidence = "Medium";
      chosenRule = "Nested loops + log step -> O(n log n) (heuristic)";
    } else {
      timeComplexity = "O(n^2)";
      confidence = "High";
      chosenRule = "Nested loops -> quadratic time";
    }
  } else if (logDetected) {
    timeComplexity = "O(log n)";
    confidence = "Medium";
    chosenRule = "Log step inside a single loop -> O(log n)";
  } else if (loopsDetected >= 1) {
    timeComplexity = "O(n)";
    confidence = "Low";
    chosenRule = "Loops without nesting -> linear growth (treat sequential loops as O(n))";
  } else {
    timeComplexity = "O(1)";
    confidence = "High";
    chosenRule = "No loops -> constant time";
  }

  reasoningSteps.push({ title: "Final decision", detail: `Rule fired: ${chosenRule}.` });

  const explanationShort = recursion.recursionDetected
    ? "Recursion detected, so runtime grows exponentially under the basic interview assumption."
    : loopStats.maxNestingDepth >= 2
      ? logDetected
        ? "Nested loops combined with a logarithmic step, modeled as O(n log n) by heuristic."
        : "Nested loops detected, so runtime is modeled as quadratic (O(n^2))."
      : logDetected
        ? "A logarithmic step pattern was detected in the loop, modeled as O(log n)."
        : loopsDetected >= 1
          ? "Loops detected without nesting, modeled as linear growth (O(n))."
          : "No loops detected, so runtime is constant (O(1)).";

  const detectedPatterns = [];
  if (recursion.recursionDetected) {
    detectedPatterns.push(`${recursion.functionName} recursion (${recursion.recursionCalls} call(s))`);
  }
  if (loopsDetected > 0) {
    detectedPatterns.push(`${loopsDetected} loop(s) detected`);
    if (loopStats.maxNestingDepth >= 2) detectedPatterns.push(`${loopStats.innerNestedLoops} nested (inner) loop(s)`);
    if (loopStats.sequentialLoops > 0) detectedPatterns.push(`${loopStats.sequentialLoops} sequential loop(s)`);
  }
  detectedPatterns.push(logDetected ? "log-step pattern found (i *= 2 / i /= 2)" : "no log-step pattern found");

  return {
    kind: "result",
    timeComplexity,
    confidence,
    explanationShort,
    loops,
    loopsDetected,
    loopStats,
    logDetected,
    recursionDetected: recursion.recursionDetected,
    recursionCalls: recursion.recursionCalls,
    recursionFunctionName: recursion.functionName,
    reasoningSteps,
    detectedPatterns,
  };
}

function Header({ theme, setTheme }) {
  return (
    <div className="header">
      <div className="headerLeft">
        <div className="title">Code Complexity Analyzer</div>
        <div className="subtitle">Big-O estimates from loops + recursion (interview-ready).</div>
      </div>

      <div className="headerRight">
        <div className="themeToggle" role="group" aria-label="Theme toggle">
          <button className={`themeBtn ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
            Dark
          </button>
          <button className={`themeBtn ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>
            Light
          </button>
        </div>
      </div>
    </div>
  );
}

function CodeInput({
  code,
  setCode,
  onAnalyze,
  onCopy,
  onClear,
  isAnalyzing,
  errorMessage,
  onSelectSample,
  onExplain,
  showExplain,
}) {
  const lineCount = Math.max(1, (code || "").split("\n").length);
  const limitedLineCount = Math.min(lineCount, 300);
  const [scrollTop, setScrollTop] = useState(0);

  return (
    <div className="card editorCard">
      <div className="cardHeader">
        <div className="cardTitle">Input Code</div>
        <div className="cardMeta">Supports C++ / Java / JavaScript-style syntax.</div>
      </div>

      <div className="sampleRow">
        <div className="sampleLabel">Quick tests:</div>
        <div className="sampleButtons">
          <button className="btn secondary" onClick={() => onSelectSample("on")}>
            Test O(n)
          </button>
          <button className="btn secondary" onClick={() => onSelectSample("on2")}>
            Test O(n^2)
          </button>
        </div>
      </div>

      <div className="codePane">
        <div className="lineNumbers" aria-hidden="true" style={{ transform: `translateY(${-scrollTop}px)` }}>
          {Array.from({ length: limitedLineCount }, (_, i) => (
            <div key={i + 1} className="ln">
              {i + 1}
            </div>
          ))}
          {lineCount > limitedLineCount && <div className="ln ellipsis">...</div>}
        </div>

        <textarea
          className="codeTextarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={(e) => setScrollTop(e.target.scrollTop)}
          spellCheck={false}
          placeholder="Paste code here..."
        />
      </div>

      {errorMessage && <div className="errorBox">{errorMessage}</div>}

      <div className="btnRow">
        <button className="btn" onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <span className="spinner" aria-label="Analyzing" /> : "Analyze"}
        </button>
        <button className="btn secondary" onClick={onCopy}>
          Copy
        </button>
        <button className="btn secondary" onClick={onClear}>
          Clear
        </button>
        <button className="btn secondary" onClick={onExplain} disabled={showExplain}>
          Explain Complexity
        </button>
      </div>
    </div>
  );
}

function ComplexityBadge({ value }) {
  return (
    <div className="badge">
      <div className="badgeK">Complexity</div>
      <div className="badgeV">{value}</div>
    </div>
  );
}

function ConfidenceBadge({ value }) {
  return (
    <div className="badge">
      <div className="badgeK">Confidence</div>
      <div className={`badgeV ${value.toLowerCase()}`}>{value}</div>
    </div>
  );
}

function LoopHighlights({ loops }) {
  if (!loops || loops.length === 0) return <div className="muted">No loop blocks to highlight.</div>;

  return (
    <div className="loopList">
      {loops.map((l, idx) => (
        <div className="loopItem" key={`${l.start}-${idx}`}>
          <div className="loopTop">
            <div className="loopType">{l.kind.toUpperCase()}</div>
            <div className="loopHint">Detected</div>
          </div>
          <div className="loopHeader">
            <span className="loopKw">{l.kind}</span>
            <span className="loopText">{l.headerText ? " " + l.headerText : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultCard({ result, showExplain }) {
  if (!result) {
    return (
      <div className="card resultCard">
        <div className="muted">Paste code and click Analyze.</div>
      </div>
    );
  }

  if (result.kind === "error") {
    return (
      <div className="card resultCard">
        <div className="errorBox">{result.message}</div>
      </div>
    );
  }

  return (
    <div className="card resultCard">
      <div className="resultTop">
        <ComplexityBadge value={result.timeComplexity} />
        <ConfidenceBadge value={result.confidence} />
      </div>

      <div className="section">
        <div className="sectionTitle">Explanation</div>
        <div className="explainText">{result.explanationShort}</div>
      </div>

      <div className="section">
        <div className="sectionTitle">Detected Patterns</div>
        <div className="patterns">
          {result.detectedPatterns.map((p, idx) => (
            <div className="pattern" key={`${p}-${idx}`}>
              {p}
            </div>
          ))}
        </div>
      </div>

      {showExplain && (
        <div className="section">
          <div className="sectionTitle">Reasoning (step-by-step)</div>
          <div className="reasoning">
            {result.reasoningSteps.map((s, idx) => (
              <div className="reasonStep" key={`${s.title}-${idx}`}>
                <div className="reasonTitle">
                  {idx + 1}. {s.title}
                </div>
                <div className="reasonDetail">{s.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="sectionTitle">Loop highlights</div>
        <LoopHighlights loops={result.loops} />
      </div>

      {!showExplain && <div className="muted small">Press “Explain Complexity” to see detailed reasoning.</div>}
    </div>
  );
}

function Footer() {
  return (
    <div className="footer">
      Built for interviews: fast heuristics, readable reasoning, and a clean developer-tool UI.
    </div>
  );
}

function App() {
  const initialExampleCode = `function sum(n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += i;
  }
  return total;
}`;

  const samples = {
    on: initialExampleCode,
    on2: `function countPairs(n) {
  let pairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      pairs++;
    }
  }
  return pairs;
}`,
  };

  const [theme, setTheme] = useState("dark");
  const [code, setCode] = useState(initialExampleCode);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;

  const analyze = async () => {
    setErrorMessage("");
    const trimmed = (code || "").trim();
    if (!trimmed) {
      setResult(analyzeCode(code));
      setErrorMessage("Input is empty.");
      return;
    }

    setIsAnalyzing(true);
    await new Promise((r) => setTimeout(r, 350));
    setResult(analyzeCode(code));
    setIsAnalyzing(false);
    setShowExplain(false);
  };

  const onCopy = async () => {
    setErrorMessage("");
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {
      setErrorMessage("Copy failed. Your browser may block clipboard access.");
    }
  };

  const onClear = () => {
    setErrorMessage("");
    setCode("");
    setResult(null);
    setShowExplain(false);
  };

  const onSelectSample = (key) => {
    const next = samples[key] || initialExampleCode;
    setCode(next);
    setResult(null);
    setErrorMessage("");
    setShowExplain(false);
  };

  const onExplain = () => setShowExplain(true);

  return (
    <div className="appRoot">
      <Header theme={theme} setTheme={setTheme} />
      <div className="mainGrid">
        <CodeInput
          code={code}
          setCode={setCode}
          onAnalyze={analyze}
          onCopy={onCopy}
          onClear={onClear}
          isAnalyzing={isAnalyzing}
          errorMessage={errorMessage}
          onSelectSample={onSelectSample}
          onExplain={onExplain}
          showExplain={showExplain}
        />
        <ResultCard result={result} showExplain={showExplain} />
      </div>
      <Footer />
    </div>
  );
}

window.App = App;

var { useState } = React;

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCommentsAndStrings(input) {
  let s = input || "";

  // Block comments: /* ... */
  s = s.replace(/\/\*[\s\S]*?\*\//g, " ");
  // Line comments: // ...
  s = s.replace(/\/\/.*$/gm, " ");

  // String literals (best-effort; enough for interview-style samples)
  s = s.replace(/"(?:\\.|[^"\\])*"/g, '""');
  s = s.replace(/'(?:\\.|[^'\\])*'/g, "''");
  s = s.replace(/`(?:\\.|[^`\\])*`/g, "``");

  return s;
}

function findMatchingBrace(text, openIndex) {
  if (openIndex < 0 || openIndex >= text.length || text[openIndex] !== "{") return -1;

  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth === 0) return i;
  }
  return -1;
}

function detectRecursion(code) {
  // Looks for function-like blocks: <name>(...) { ... }
  // Then checks whether the function body calls <name>( ... ).
  const keywordSet = new Set([
    "if",
    "for",
    "while",
    "switch",
    "catch",
    "do",
    "return",
    "throw",
    "else",
    "try",
    "finally",
  ]);

  const fnRegex = /\b([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/g;
  const results = [];

  let match;
  while ((match = fnRegex.exec(code)) !== null) {
    const name = match[1];
    if (keywordSet.has(name)) continue;

    const braceIndex = code.indexOf("{", match.index);
    const closeIndex = findMatchingBrace(code, braceIndex);
    if (braceIndex === -1 || closeIndex === -1) continue;

    const body = code.slice(braceIndex, closeIndex + 1);
    const callRegex = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "g");
    const matches = body.match(callRegex) || [];

    if (matches.length > 0) {
      results.push({ functionName: name, callCount: matches.length });
    }
  }

  if (results.length === 0) {
    return { recursionDetected: false, recursionCalls: 0, functionName: null };
  }

  // Use the strongest recursion signal (highest call count).
  results.sort((a, b) => b.callCount - a.callCount);
  return {
    recursionDetected: true,
    recursionCalls: results[0].callCount,
    functionName: results[0].functionName,
  };
}

function extractLoopBlocks(code) {
  const loops = [];
  const skipRanges = [];

  function overlapsAnyRange(start, end) {
    for (const r of skipRanges) {
      if (start >= r.start && start < r.end) return true;
      if (end > r.start && end <= r.end) return true;
    }
    return false;
  }

  const candidates = [];
  let m;

  const forRe = /\bfor\s*\(/g;
  const whileRe = /\bwhile\s*\(/g;
  const doRe = /\bdo\b/g;

  while ((m = forRe.exec(code)) !== null) candidates.push({ kind: "for", index: m.index });
  while ((m = whileRe.exec(code)) !== null) candidates.push({ kind: "while", index: m.index });
  while ((m = doRe.exec(code)) !== null) candidates.push({ kind: "do", index: m.index });

  candidates.sort((a, b) => a.index - b.index);

  for (const c of candidates) {
    // Avoid double counting the "while (...)" in do-while.
    if (c.kind === "while" && overlapsAnyRange(c.index, c.index + 1)) continue;

    if (c.kind === "do") {
      const headerStart = c.index;
      const bodyBraceStart = code.indexOf("{", headerStart);
      if (bodyBraceStart === -1) continue;

      const bodyBraceEnd = findMatchingBrace(code, bodyBraceStart);
      if (bodyBraceEnd === -1) continue;

      // Find trailing while (...) after closing brace.
      const afterBody = code.slice(bodyBraceEnd);
      const whileInDo = /\bwhile\s*\(/.exec(afterBody);
      let endIndex = bodyBraceEnd + 1;

      if (whileInDo && typeof whileInDo.index === "number") {
        const whileIndex = bodyBraceEnd + whileInDo.index;
        const semi = code.indexOf(";", whileIndex);
        endIndex = semi === -1 ? bodyBraceEnd + 1 : semi + 1;
      }

      const headerText = code
        .slice(headerStart, bodyBraceStart)
        .trim()
        .slice(0, 180);

      loops.push({
        kind: "do",
        start: headerStart,
        end: endIndex,
        headerText,
        loopText: code.slice(headerStart, endIndex),
      });

      skipRanges.push({ start: headerStart, end: endIndex });
      continue;
    }

    const headerStart = c.index;
    const braceIndex = code.indexOf("{", headerStart);
    const semiIndex = code.indexOf(";", headerStart);

    let endIndex = -1;
    let headerText = "";
    let loopText = "";

    // Prefer extracting {...} body when present.
    if (braceIndex !== -1 && (semiIndex === -1 || braceIndex < semiIndex)) {
      const closeIndex = findMatchingBrace(code, braceIndex);
      if (closeIndex !== -1) {
        endIndex = closeIndex + 1;
        loopText = code.slice(headerStart, endIndex);
        headerText = code.slice(headerStart, braceIndex).trim().slice(0, 180);
      }
    }

    // Fallback: extract until semicolon.
    if (endIndex === -1) {
      const fallbackEnd = semiIndex !== -1 ? semiIndex + 1 : Math.min(headerStart + 240, code.length);
      endIndex = fallbackEnd;
      loopText = code.slice(headerStart, endIndex);
      headerText = code.slice(headerStart, Math.min(headerStart + 180, endIndex)).trim();
    }

    loops.push({
      kind: c.kind,
      start: headerStart,
      end: endIndex,
      headerText,
      loopText,
    });
  }

  return loops;
}

function computeLoopNestingStats(loops) {
  // nestingLevel: how many other loops contain this loop.
  const levels = new Array(loops.length).fill(0);

  for (let i = 0; i < loops.length; i++) {
    for (let j = 0; j < loops.length; j++) {
      if (i === j) continue;
      const a = loops[i];
      const b = loops[j];
      const contains = a.start > b.start && a.end <= b.end;
      if (contains) levels[i]++;
    }
  }

  const maxNestingDepth = loops.length === 0 ? 0 : Math.max(...levels) + 1; // level 0 -> depth 1

  const containsAny = (i) => loops.some((o, j) => j !== i && o.start > loops[i].start && o.end <= loops[i].end);
  const isContainedByAny = (i) =>
    loops.some((o, j) => j !== i && loops[i].start > o.start && loops[i].end <= o.end);

  const innerNestedLoops = loops.filter((_, i) => isContainedByAny(i)).length;
  const outerNestedLoops = loops.filter((_, i) => containsAny(i)).length;
  const sequentialLoops = loops.filter((_, i) => !isContainedByAny(i) && !containsAny(i)).length;

  return {
    maxNestingDepth,
    levels,
    innerNestedLoops,
    outerNestedLoops,
    sequentialLoops,
  };
}

function analyzeCode(rawCode) {
  const input = (rawCode || "").trim();
  if (!input) return { kind: "error", message: "Please paste some code to analyze." };

  const code = stripCommentsAndStrings(input);

  const recursion = detectRecursion(code);
  const loops = extractLoopBlocks(code);
  const loopsDetected = loops.length;
  const loopStats = computeLoopNestingStats(loops);

  // Log pattern: loop step like i *= 2 or i /= 2 (variable name can differ).
  const logRegex = /\b[A-Za-z_]\w*\s*(\*=|\/=)\s*2\b/;
  const logDetected = loops.some((l) => logRegex.test(l.loopText));

  const reasoningSteps = [];
  reasoningSteps.push({
    title: "Recursion check",
    detail: recursion.recursionDetected
      ? `Found recursion: function "${recursion.functionName}" calls itself (${recursion.recursionCalls} time(s)).`
      : "No self-recursive function call detected.",
  });
  reasoningSteps.push({
    title: "Loop detection",
    detail:
      loopsDetected > 0
        ? `Detected ${loopsDetected} loop(s). Max nesting depth: ${loopStats.maxNestingDepth}.`
        : "No loops detected (no for/while/do).",
  });
  reasoningSteps.push({
    title: "Logarithmic pattern",
    detail: logDetected
      ? "Found logarithmic step pattern like `i *= 2` / `i /= 2` inside a loop."
      : "No logarithmic step pattern found.",
  });

  // Rule order (interview-level, simple heuristics)
  let timeComplexity = "O(1)";
  let confidence = "High";
  let chosenRule = "No loops -> O(1)";

  if (recursion.recursionDetected) {
    timeComplexity = "O(2^n)";
    confidence = "High";
    chosenRule = "Self recursion -> exponential time (basic assumption)";
  } else if (loopStats.maxNestingDepth >= 2) {
    if (logDetected) {
      // Per user requirement: Nested + Log -> O(n log n) basic handling
      timeComplexity = "O(n log n)";
      confidence = "Medium";
      chosenRule = "Nested loops + log step -> O(n log n) (heuristic)";
    } else {
      timeComplexity = "O(n^2)";
      confidence = "High";
      chosenRule = "Nested loops -> quadratic time";
    }
  } else if (logDetected) {
    timeComplexity = "O(log n)";
    confidence = "Medium";
    chosenRule = "Log step inside a single loop -> O(log n)";
  } else if (loopsDetected >= 1) {
    timeComplexity = "O(n)";
    confidence = "Low";
    chosenRule = "Loops without nesting -> linear growth (treat sequential loops as O(n))";
  } else {
    timeComplexity = "O(1)";
    confidence = "High";
    chosenRule = "No loops -> constant time";
  }

  reasoningSteps.push({
    title: "Final decision",
    detail: `Rule fired: ${chosenRule}.`,
  });

  const explanationShort = recursion.recursionDetected
    ? "Recursion detected, so runtime grows exponentially under the basic interview assumption."
    : loopStats.maxNestingDepth >= 2
      ? logDetected
        ? "Nested loops combined with a logarithmic step, modeled as O(n log n) by heuristic."
        : "Nested loops detected, so runtime is modeled as quadratic (O(n^2))."
      : logDetected
        ? "A logarithmic step pattern was detected in the loop, modeled as O(log n)."
        : loopsDetected >= 1
          ? "Loops detected without nesting, modeled as linear growth (O(n))."
          : "No loops detected, so runtime is constant (O(1)).";

  const detectedPatterns = [];
  if (recursion.recursionDetected) {
    detectedPatterns.push(`${recursion.functionName} recursion (${recursion.recursionCalls} call(s))`);
  }
  if (loopsDetected > 0) {
    detectedPatterns.push(`${loopsDetected} loop(s) detected`);
    if (loopStats.maxNestingDepth >= 2) detectedPatterns.push(`${loopStats.innerNestedLoops} nested (inner) loop(s)`);
    if (loopStats.sequentialLoops > 0) detectedPatterns.push(`${loopStats.sequentialLoops} sequential loop(s)`);
  }
  detectedPatterns.push(logDetected ? "log-step pattern found (i *= 2 / i /= 2)" : "no log-step pattern found");

  return {
    kind: "result",
    timeComplexity,
    confidence,
    explanationShort,
    loops,
    loopsDetected,
    loopStats,
    logDetected,
    recursionDetected: recursion.recursionDetected,
    recursionCalls: recursion.recursionCalls,
    recursionFunctionName: recursion.functionName,
    reasoningSteps,
    detectedPatterns,
  };
}

function Header({ theme, setTheme }) {
  return (
    <div className="header">
      <div className="headerLeft">
        <div className="title">Code Complexity Analyzer</div>
        <div className="subtitle">Big-O estimates from loops + recursion (interview-ready).</div>
      </div>

      <div className="headerRight">
        <div className="themeToggle" role="group" aria-label="Theme toggle">
          <button
            className={`themeBtn ${theme === "dark" ? "active" : ""}`}
            onClick={() => setTheme("dark")}
          >
            Dark
          </button>
          <button
            className={`themeBtn ${theme === "light" ? "active" : ""}`}
            onClick={() => setTheme("light")}
          >
            Light
          </button>
        </div>
      </div>
    </div>
  );
}

function CodeInput({
  code,
  setCode,
  onAnalyze,
  onCopy,
  onClear,
  isAnalyzing,
  errorMessage,
  onSelectSample,
  onExplain,
  showExplain,
}) {
  const lineCount = Math.max(1, (code || "").split("\n").length);
  const limitedLineCount = Math.min(lineCount, 300);

  const [scrollTop, setScrollTop] = useState(0);

  return (
    <div className="card editorCard">
      <div className="cardHeader">
        <div className="cardTitle">Input Code</div>
        <div className="cardMeta">Supports C++ / Java / JavaScript-style syntax.</div>
      </div>

      <div className="sampleRow">
        <div className="sampleLabel">Quick tests:</div>
        <div className="sampleButtons">
          <button className="btn secondary" onClick={() => onSelectSample("on")}>
            Test O(n)
          </button>
          <button className="btn secondary" onClick={() => onSelectSample("on2")}>
            Test O(n^2)
          </button>
        </div>
      </div>

      <div className="codePane">
        <div className="lineNumbers" aria-hidden="true" style={{ transform: `translateY(${-scrollTop}px)` }}>
          {Array.from({ length: limitedLineCount }, (_, i) => (
            <div key={i + 1} className="ln">
              {i + 1}
            </div>
          ))}
          {lineCount > limitedLineCount && <div className="ln ellipsis">...</div>}
        </div>

        <textarea
          className="codeTextarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={(e) => setScrollTop(e.target.scrollTop)}
          spellCheck={false}
          placeholder="Paste code here..."
        />
      </div>

      {errorMessage && <div className="errorBox">{errorMessage}</div>}

      <div className="btnRow">
        <button className="btn" onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <span className="spinner" aria-label="Analyzing" /> : "Analyze"}
        </button>
        <button className="btn secondary" onClick={onCopy}>
          Copy
        </button>
        <button className="btn secondary" onClick={onClear}>
          Clear
        </button>
        <button className="btn secondary" onClick={onExplain} disabled={showExplain}>
          Explain Complexity
        </button>
      </div>
    </div>
  );
}

function ComplexityBadge({ value }) {
  return (
    <div className="badge">
      <div className="badgeK">Complexity</div>
      <div className="badgeV">{value}</div>
    </div>
  );
}

function ConfidenceBadge({ value }) {
  return (
    <div className="badge">
      <div className="badgeK">Confidence</div>
      <div className={`badgeV ${value.toLowerCase()}`}>{value}</div>
    </div>
  );
}

function LoopHighlights({ loops }) {
  if (!loops || loops.length === 0) return <div className="muted">No loop blocks to highlight.</div>;

  return (
    <div className="loopList">
      {loops.map((l, idx) => (
        <div className="loopItem" key={`${l.start}-${idx}`}>
          <div className="loopTop">
            <div className="loopType">{l.kind.toUpperCase()}</div>
            <div className="loopHint">Detected</div>
          </div>
          <div className="loopHeader">
            <span className="loopKw">{l.kind}</span>
            <span className="loopText">{l.headerText ? " " + l.headerText : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultCard({ result, showExplain }) {
  if (!result) {
    return (
      <div className="card resultCard">
        <div className="muted">Paste code and click Analyze.</div>
      </div>
    );
  }

  if (result.kind === "error") {
    return (
      <div className="card resultCard">
        <div className="errorBox">{result.message}</div>
      </div>
    );
  }

  return (
    <div className="card resultCard">
      <div className="resultTop">
        <ComplexityBadge value={result.timeComplexity} />
        <ConfidenceBadge value={result.confidence} />
      </div>

      <div className="section">
        <div className="sectionTitle">Explanation</div>
        <div className="explainText">{result.explanationShort}</div>
      </div>

      <div className="section">
        <div className="sectionTitle">Detected Patterns</div>
        <div className="patterns">
          {result.detectedPatterns.map((p, idx) => (
            <div className="pattern" key={`${p}-${idx}`}>
              {p}
            </div>
          ))}
        </div>
      </div>

      {showExplain && (
        <div className="section">
          <div className="sectionTitle">Reasoning (step-by-step)</div>
          <div className="reasoning">
            {result.reasoningSteps.map((s, idx) => (
              <div className="reasonStep" key={`${s.title}-${idx}`}>
                <div className="reasonTitle">
                  {idx + 1}. {s.title}
                </div>
                <div className="reasonDetail">{s.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="sectionTitle">Loop highlights</div>
        <LoopHighlights loops={result.loops} />
      </div>

      {!showExplain && <div className="muted small">Press “Explain Complexity” to see detailed reasoning.</div>}
    </div>
  );
}

function Footer() {
  return <div className="footer">Built for interviews: fast heuristics, readable reasoning, and a clean developer-tool UI.</div>;
}

function App() {
  const initialExample = {
    id: "on",
    label: "Default: Single loop",
    code: `function sum(n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += i;
  }
  return total;
}`,
  };

  const samples = {
    on: `function sum(n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += i;
  }
  return total;
}`,
    on2: `function countPairs(n) {
  let pairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      pairs++;
    }
  }
  return pairs;
}`,
  };

  const [theme, setTheme] = useState("dark");
  const [code, setCode] = useState(initialExample.code);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  // Apply theme attribute for CSS variables.
  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;

  const analyze = async () => {
    setErrorMessage("");

    const trimmed = (code || "").trim();
    if (!trimmed) {
      const next = analyzeCode(code);
      setResult(next);
      setErrorMessage("Input is empty.");
      return;
    }

    setIsAnalyzing(true);
    await new Promise((r) => setTimeout(r, 350));

    const next = analyzeCode(code);
    setResult(next);
    setIsAnalyzing(false);
    setShowExplain(false);
  };

  const onCopy = async () => {
    setErrorMessage("");
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {
      setErrorMessage("Copy failed. Your browser may block clipboard access.");
    }
  };

  const onClear = () => {
    setErrorMessage("");
    setCode("");
    setResult(null);
    setShowExplain(false);
  };

  const onSelectSample = (key) => {
    const next = samples[key] || initialExample.code;
    setCode(next);
    setResult(null);
    setErrorMessage("");
    setShowExplain(false);
  };

  const onExplain = () => setShowExplain(true);

  return (
    <div className="appRoot">
      <Header theme={theme} setTheme={setTheme} />

      <div className="mainGrid">
        <CodeInput
          code={code}
          setCode={setCode}
          onAnalyze={analyze}
          onCopy={onCopy}
          onClear={onClear}
          isAnalyzing={isAnalyzing}
          errorMessage={errorMessage}
          onSelectSample={onSelectSample}
          onExplain={onExplain}
          showExplain={showExplain}
        />

        <ResultCard result={result} showExplain={showExplain} />
      </div>

      <Footer />
    </div>
  );
}

window.App = App;

var { useState } = React;

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCommentsAndStrings(input) {
  let s = input || "";

  // Block comments: /* ... */
  s = s.replace(/\/\*[\s\S]*?\*\//g, " ");
  // Line comments: // ...
  s = s.replace(/\/\/.*$/gm, " ");

  // String literals (best-effort; enough for interview-style samples)
  s = s.replace(/"(?:\\.|[^"\\])*"/g, '""');
  s = s.replace(/'(?:\\.|[^'\\])*'/g, "''");
  s = s.replace(/`(?:\\.|[^`\\])*`/g, "``");

  return s;
}

function findMatchingBrace(text, openIndex) {
  if (openIndex < 0 || openIndex >= text.length || text[openIndex] !== "{") return -1;

  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth === 0) return i;
  }
  return -1;
}

function detectRecursion(code) {
  // Looks for function-like blocks: <name>(...) { ... }
  // Then checks whether the function body calls <name>( ... ).
  const keywordSet = new Set([
    "if",
    "for",
    "while",
    "switch",
    "catch",
    "do",
    "return",
    "throw",
    "else",
    "try",
    "finally",
  ]);

  const fnRegex = /\b([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/g;
  const results = [];

  let match;
  while ((match = fnRegex.exec(code)) !== null) {
    const name = match[1];
    if (keywordSet.has(name)) continue;

    const braceIndex = code.indexOf("{", match.index);
    const closeIndex = findMatchingBrace(code, braceIndex);
    if (braceIndex === -1 || closeIndex === -1) continue;

    const body = code.slice(braceIndex, closeIndex + 1);
    const callRegex = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "g");
    const matches = body.match(callRegex) || [];

    if (matches.length > 0) {
      results.push({ functionName: name, callCount: matches.length });
    }
  }

  if (results.length === 0) return { recursionDetected: false, recursionCalls: 0, functionName: null };

  // Use the strongest recursion signal (highest call count).
  results.sort((a, b) => b.callCount - a.callCount);
  return {
    recursionDetected: true,
    recursionCalls: results[0].callCount,
    functionName: results[0].functionName,
  };
}

function extractLoopBlocks(code) {
  const loops = [];
  const skipRanges = [];

  function overlapsAnyRange(start, end) {
    for (const r of skipRanges) {
      if (start >= r.start && start < r.end) return true;
      if (end > r.start && end <= r.end) return true;
    }
    return false;
  }

  const candidates = [];
  let m;

  const forRe = /\bfor\s*\(/g;
  const whileRe = /\bwhile\s*\(/g;
  const doRe = /\bdo\b/g;

  while ((m = forRe.exec(code)) !== null) candidates.push({ kind: "for", index: m.index });
  while ((m = whileRe.exec(code)) !== null) candidates.push({ kind: "while", index: m.index });
  while ((m = doRe.exec(code)) !== null) candidates.push({ kind: "do", index: m.index });

  candidates.sort((a, b) => a.index - b.index);

  for (const c of candidates) {
    // Avoid double counting the "while (...)" in do-while.
    if (c.kind === "while" && overlapsAnyRange(c.index, c.index + 1)) continue;

    if (c.kind === "do") {
      const headerStart = c.index;
      const bodyBraceStart = code.indexOf("{", headerStart);
      if (bodyBraceStart === -1) continue;

      const bodyBraceEnd = findMatchingBrace(code, bodyBraceStart);
      if (bodyBraceEnd === -1) continue;

      // Find trailing while (...) after closing brace.
      const afterBody = code.slice(bodyBraceEnd);
      const whileInDo = /\bwhile\s*\(/.exec(afterBody);
      let endIndex = bodyBraceEnd + 1;

      if (whileInDo && typeof whileInDo.index === "number") {
        const whileIndex = bodyBraceEnd + whileInDo.index;
        const semi = code.indexOf(";", whileIndex);
        endIndex = semi === -1 ? bodyBraceEnd + 1 : semi + 1;
      }

      const headerText = code
        .slice(headerStart, bodyBraceStart)
        .trim()
        .slice(0, 180);

      loops.push({
        kind: "do",
        start: headerStart,
        end: endIndex,
        headerText,
        loopText: code.slice(headerStart, endIndex),
      });

      skipRanges.push({ start: headerStart, end: endIndex });
      continue;
    }

    const headerStart = c.index;
    const braceIndex = code.indexOf("{", headerStart);
    const semiIndex = code.indexOf(";", headerStart);

    let endIndex = -1;
    let headerText = "";
    let loopText = "";

    // Prefer extracting {...} body when present.
    if (braceIndex !== -1 && (semiIndex === -1 || braceIndex < semiIndex)) {
      const closeIndex = findMatchingBrace(code, braceIndex);
      if (closeIndex !== -1) {
        endIndex = closeIndex + 1;
        loopText = code.slice(headerStart, endIndex);
        headerText = code.slice(headerStart, braceIndex).trim().slice(0, 180);
      }
    }

    // Fallback: extract until semicolon.
    if (endIndex === -1) {
      const fallbackEnd = semiIndex !== -1 ? semiIndex + 1 : Math.min(headerStart + 240, code.length);
      endIndex = fallbackEnd;
      loopText = code.slice(headerStart, endIndex);
      headerText = code.slice(headerStart, Math.min(headerStart + 180, endIndex)).trim();
    }

    loops.push({
      kind: c.kind,
      start: headerStart,
      end: endIndex,
      headerText,
      loopText,
    });
  }

  return loops;
}

function computeLoopNestingStats(loops) {
  // nestingLevel: how many other loops contain this loop.
  const levels = new Array(loops.length).fill(0);

  for (let i = 0; i < loops.length; i++) {
    for (let j = 0; j < loops.length; j++) {
      if (i === j) continue;
      const a = loops[i];
      const b = loops[j];
      const contains = a.start > b.start && a.end <= b.end;
      if (contains) levels[i]++;
    }
  }

  const maxNestingDepth = loops.length === 0 ? 0 : Math.max(...levels) + 1; // level 0 -> depth 1

  const containsAny = (i) => loops.some((o, j) => j !== i && o.start > loops[i].start && o.end <= loops[i].end);
  const isContainedByAny = (i) =>
    loops.some((o, j) => j !== i && loops[i].start > o.start && loops[i].end <= o.end);

  const innerNestedLoops = loops.filter((_, i) => isContainedByAny(i)).length;
  const outerNestedLoops = loops.filter((_, i) => containsAny(i)).length;
  const sequentialLoops = loops.filter((_, i) => !isContainedByAny(i) && !containsAny(i)).length;

  return {
    maxNestingDepth,
    levels,
    innerNestedLoops,
    outerNestedLoops,
    sequentialLoops,
  };
}

function analyzeCode(rawCode) {
  const input = (rawCode || "").trim();
  if (!input) {
    return { kind: "error", message: "Please paste some code to analyze." };
  }

  const code = stripCommentsAndStrings(input);

  const recursion = detectRecursion(code);
  const loops = extractLoopBlocks(code);
  const loopsDetected = loops.length;
  const loopStats = computeLoopNestingStats(loops);

  // Log pattern: loop step like i *= 2 or i /= 2 (variable name can differ).
  const logRegex = /\b[A-Za-z_]\w*\s*(\*=|\/=)\s*2\b/;
  const logDetected = loops.some((l) => logRegex.test(l.loopText));

  const reasoningSteps = [];
  reasoningSteps.push({
    title: "Recursion check",
    detail: recursion.recursionDetected
      ? `Found recursion: function "${recursion.functionName}" calls itself (${recursion.recursionCalls} time(s)).`
      : "No self-recursive function call detected.",
  });
  reasoningSteps.push({
    title: "Loop detection",
    detail:
      loopsDetected > 0
        ? `Detected ${loopsDetected} loop(s). Max nesting depth: ${loopStats.maxNestingDepth}.`
        : "No loops detected (no for/while/do).",
  });
  reasoningSteps.push({
    title: "Logarithmic pattern",
    detail: logDetected
      ? "Found logarithmic step pattern like `i *= 2` / `i /= 2` inside a loop."
      : "No logarithmic step pattern found.",
  });

  // Rule order (interview-level, simple heuristics)
  let timeComplexity = "O(1)";
  let confidence = "High";
  let chosenRule = "No loops -> O(1)";

  if (recursion.recursionDetected) {
    timeComplexity = "O(2^n)";
    confidence = "High";
    chosenRule = "Self recursion -> exponential time (basic assumption)";
  } else if (loopStats.maxNestingDepth >= 2) {
    if (logDetected) {
      // Per user requirement: Nested + Log -> O(n log n) basic handling
      timeComplexity = "O(n log n)";
      confidence = "Medium";
      chosenRule = "Nested loops + log step -> O(n log n) (heuristic)";
    } else {
      timeComplexity = "O(n^2)";
      confidence = "High";
      chosenRule = "Nested loops -> quadratic time";
    }
  } else if (logDetected) {
    timeComplexity = "O(log n)";
    confidence = "Medium";
    chosenRule = "Log step inside a single loop -> O(log n)";
  } else if (loopsDetected >= 1) {
    timeComplexity = "O(n)";
    confidence = "Low";
    chosenRule = "Loops without nesting -> linear growth (treat sequential loops as O(n))";
  } else {
    timeComplexity = "O(1)";
    confidence = "High";
    chosenRule = "No loops -> constant time";
  }

  reasoningSteps.push({
    title: "Final decision",
    detail: `Rule fired: ${chosenRule}.`,
  });

  const detectedPatterns = [];
  if (recursion.recursionDetected) {
    detectedPatterns.push(`${recursion.functionName} recursion (${recursion.recursionCalls} call(s))`);
  }
  if (loopsDetected > 0) {
    detectedPatterns.push(`${loopsDetected} loop(s) detected`);
    if (loopStats.maxNestingDepth >= 2) detectedPatterns.push(`${loopStats.innerNestedLoops} nested (inner) loop(s)`);
    if (loopStats.sequentialLoops > 0) detectedPatterns.push(`${loopStats.sequentialLoops} sequential loop(s)`);
  }
  detectedPatterns.push(logDetected ? "log-step pattern found (i *= 2 / i /= 2)" : "no log-step pattern found");

  return {
    kind: "result",
    timeComplexity,
    confidence,
    loops,
    loopsDetected,
    loopStats,
    logDetected,
    recursionDetected: recursion.recursionDetected,
    recursionCalls: recursion.recursionCalls,
    recursionFunctionName: recursion.functionName,
    reasoningSteps,
    detectedPatterns,
  };
}

function Header({ theme, setTheme }) {
  return (
    <div className="header">
      <div className="headerLeft">
        <div className="title">Code Complexity Analyzer</div>
        <div className="subtitle">Big-O estimates from loops + recursion (interview-ready).</div>
      </div>

      <div className="headerRight">
        <div className="themeToggle" role="group" aria-label="Theme toggle">
          <button
            className={`themeBtn ${theme === "dark" ? "active" : ""}`}
            onClick={() => setTheme("dark")}
          >
            Dark
          </button>
          <button
            className={`themeBtn ${theme === "light" ? "active" : ""}`}
            onClick={() => setTheme("light")}
          >
            Light
          </button>
        </div>
      </div>
    </div>
  );
}

function CodeInput({
  code,
  setCode,
  onAnalyze,
  onCopy,
  onClear,
  isAnalyzing,
  errorMessage,
  onSelectSample,
  onExplain,
  showExplain,
}) {
  const lineCount = Math.max(1, (code || "").split("\n").length);
  const limitedLineCount = Math.min(lineCount, 300);

  const [scrollTop, setScrollTop] = useState(0);

  return (
    <div className="card editorCard">
      <div className="cardHeader">
        <div className="cardTitle">Input Code</div>
        <div className="cardMeta">Supports C++ / Java / JavaScript-style syntax.</div>
      </div>

      <div className="sampleRow">
        <div className="sampleLabel">Quick tests:</div>
        <div className="sampleButtons">
          <button className="btn secondary" onClick={() => onSelectSample("on")}>
            Test O(n)
          </button>
          <button className="btn secondary" onClick={() => onSelectSample("on2")}>
            Test O(n^2)
          </button>
        </div>
      </div>

      <div className="codePane">
        <div className="lineNumbers" aria-hidden="true" style={{ transform: `translateY(${-scrollTop}px)` }}>
          {Array.from({ length: limitedLineCount }, (_, i) => (
            <div key={i + 1} className="ln">
              {i + 1}
            </div>
          ))}
          {lineCount > limitedLineCount && <div className="ln ellipsis">...</div>}
        </div>

        <textarea
          className="codeTextarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={(e) => setScrollTop(e.target.scrollTop)}
          spellCheck={false}
          placeholder="Paste code here..."
        />
      </div>

      {errorMessage && <div className="errorBox">{errorMessage}</div>}

      <div className="btnRow">
        <button className="btn" onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <span className="spinner" aria-label="Analyzing" /> : "Analyze"}
        </button>
        <button className="btn secondary" onClick={onCopy}>
          Copy
        </button>
        <button className="btn secondary" onClick={onClear}>
          Clear
        </button>
        <button className="btn secondary" onClick={onExplain} disabled={!showExplain}>
          Explain Complexity
        </button>
      </div>
    </div>
  );
}

function ComplexityBadge({ value }) {
  return (
    <div className="badge">
      <div className="badgeK">Complexity</div>
      <div className="badgeV">{value}</div>
    </div>
  );
}

function ConfidenceBadge({ value }) {
  return (
    <div className="badge">
      <div className="badgeK">Confidence</div>
      <div className={`badgeV ${value.toLowerCase()}`}>{value}</div>
    </div>
  );
}

function LoopHighlights({ loops }) {
  if (!loops || loops.length === 0) {
    return <div className="muted">No loop blocks to highlight.</div>;
  }

  return (
    <div className="loopList">
      {loops.map((l, idx) => (
        <div className="loopItem" key={`${l.start}-${idx}`}>
          <div className="loopTop">
            <div className="loopType">{l.kind.toUpperCase()}</div>
            <div className="loopHint">Detected</div>
          </div>
          <div className="loopHeader">
            <span className="loopKw">{l.kind}</span>
            <span className="loopText">{l.headerText ? " " + l.headerText : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultCard({ result, showExplain }) {
  if (!result) {
    return (
      <div className="card resultCard">
        <div className="muted">Paste code and click Analyze.</div>
      </div>
    );
  }

  if (result.kind === "error") {
    return (
      <div className="card resultCard">
        <div className="errorBox">{result.message}</div>
      </div>
    );
  }

  return (
    <div className="card resultCard">
      <div className="resultTop">
        <ComplexityBadge value={result.timeComplexity} />
        <ConfidenceBadge value={result.confidence} />
      </div>

      <div className="section">
        <div className="sectionTitle">Detected Patterns</div>
        <div className="patterns">
          {result.detectedPatterns.map((p, idx) => (
            <div className="pattern" key={`${p}-${idx}`}>
              {p}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="sectionTitle">Reasoning (step-by-step)</div>
        <div className="reasoning">
          {result.reasoningSteps.map((s, idx) => (
            <div className="reasonStep" key={`${s.title}-${idx}`}>
              <div className="reasonTitle">{idx + 1}. {s.title}</div>
              <div className="reasonDetail">{s.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="sectionTitle">Loop highlights</div>
        <LoopHighlights loops={result.loops} />
      </div>

      {!showExplain && (
        <div className="muted small">
          Click “Explain Complexity” to show reasoning in a structured way.
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <div className="footer">
      Built for interviews: fast heuristics, readable reasoning, and a clean developer-tool UI.
    </div>
  );
}

function App() {
  const initialExample = {
    id: "on",
    label: "Default: Single loop",
    code: `function sum(n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += i;
  }
  return total;
}`,
  };

  const samples = {
    on: `function sum(n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += i;
  }
  return total;
}`,
    on2: `function countPairs(n) {
  let pairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      pairs++;
    }
  }
  return pairs;
}`,
  };

  const [theme, setTheme] = useState("dark");
  const [code, setCode] = useState(initialExample.code);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExplain, setShowExplain] = useState(true);

  // Apply theme attribute for CSS variables.
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }

  const analyze = async () => {
    setErrorMessage("");

    const trimmed = (code || "").trim();
    if (!trimmed) {
      setResult({ kind: "error", message: "Please paste some code to analyze." });
      setErrorMessage("Input is empty.");
      return;
    }

    setIsAnalyzing(true);
    // Small delay so the loading spinner feels responsive.
    await new Promise((r) => setTimeout(r, 350));

    const next = analyzeCode(code);
    setResult(next.kind === "error" ? next : next);
    setIsAnalyzing(false);
    setShowExplain(true);
  };

  const onCopy = async () => {
    setErrorMessage("");
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {
      setErrorMessage("Copy failed. Your browser may block clipboard access.");
    }
  };

  const onClear = () => {
    setErrorMessage("");
    setCode("");
    setResult(null);
    setShowExplain(true);
  };

  const onSelectSample = (key) => {
    const next = samples[key] || initialExample.code;
    setCode(next);
    setResult(null);
    setErrorMessage("");
    setShowExplain(true);
  };

  const onExplain = () => {
    setShowExplain(true);
  };

  return (
    <div className="appRoot">
      <Header theme={theme} setTheme={setTheme} />

      <div className="mainGrid">
        <CodeInput
          code={code}
          setCode={setCode}
          onAnalyze={analyze}
          onCopy={onCopy}
          onClear={onClear}
          isAnalyzing={isAnalyzing}
          errorMessage={errorMessage}
          onSelectSample={onSelectSample}
          onExplain={onExplain}
          showExplain={showExplain}
        />

        <ResultCard result={result} showExplain={showExplain} />
      </div>

      <Footer />
    </div>
  );
}

window.App = App;

var { useState } = React;

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Removes comments and string literals so keywords like "for" inside strings
// don't create false positives during the interview-style analysis.
function stripCommentsAndStrings(input) {
  let s = input;

  // Block comments: /* ... */
  s = s.replace(/\/\*[\s\S]*?\*\//g, " ");
  // Line comments: // ...
  s = s.replace(/\/\/.*$/gm, " ");

  // String literals (best-effort; enough for beginner/interview samples)
  s = s.replace(/"(?:\\.|[^"\\])*"/g, '""');
  s = s.replace(/'(?:\\.|[^'\\])*'/g, "''");
  s = s.replace(/`(?:\\.|[^`\\])*`/g, "``");

  return s;
}

function findMatchingBrace(text, openIndex) {
  if (openIndex < 0 || openIndex >= text.length || text[openIndex] !== "{") return -1;

  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth === 0) return i;
  }
  return -1;
}

function detectRecursion(codeNoStringsNoComments) {
  // Catch function-like blocks: <name>(...) { ... }
  // This intentionally ignores common control keywords.
  const keywordSet = new Set([
    "if",
    "for",
    "while",
    "switch",
    "catch",
    "do",
    "return",
    "throw",
    "else",
    "try",
    "finally",
  ]);

  const fnRegex = /\b([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/g;
  let match;

  while ((match = fnRegex.exec(codeNoStringsNoComments)) !== null) {
    const name = match[1];
    if (keywordSet.has(name)) continue;

    const braceIndex = codeNoStringsNoComments.indexOf("{", match.index);
    const closeIndex = findMatchingBrace(codeNoStringsNoComments, braceIndex);
    if (braceIndex === -1 || closeIndex === -1) continue;

    const body = codeNoStringsNoComments.slice(braceIndex, closeIndex + 1);
    const callRegex = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "g");

    if (callRegex.test(body)) {
      return { recursionDetected: true, functionName: name };
    }
  }

  return { recursionDetected: false, functionName: null };
}

function extractLoopBlocks(codeNoStringsNoComments) {
  // Collect candidate loop keywords and then extract their bodies using brace matching
  // (or fallback to the next semicolon for single-statement loops).
  const loops = [];
  const skipWhileRanges = [];

  function overlapsAnyRange(start, end) {
    for (const r of skipWhileRanges) {
      if (start >= r.start && start < r.end) return true;
      if (end > r.start && end <= r.end) return true;
    }
    return false;
  }

  const forRe = /\bfor\s*\(/g;
  const whileRe = /\bwhile\s*\(/g;
  const doRe = /\bdo\b/g;

  const candidates = [];

  let m;
  while ((m = forRe.exec(codeNoStringsNoComments)) !== null) {
    candidates.push({ kind: "for", index: m.index });
  }
  while ((m = whileRe.exec(codeNoStringsNoComments)) !== null) {
    candidates.push({ kind: "while", index: m.index });
  }
  while ((m = doRe.exec(codeNoStringsNoComments)) !== null) {
    candidates.push({ kind: "do", index: m.index });
  }

  candidates.sort((a, b) => a.index - b.index);

  for (const c of candidates) {
    // Avoid counting the "while (...)" part of a do-while as an extra loop.
    if (c.kind === "while" && overlapsAnyRange(c.index, c.index + 1)) continue;

    if (c.kind === "do") {
      const headerStart = c.index;
      const bodyBraceStart = codeNoStringsNoComments.indexOf("{", headerStart);
      if (bodyBraceStart === -1) continue;

      const bodyBraceEnd = findMatchingBrace(codeNoStringsNoComments, bodyBraceStart);
      if (bodyBraceEnd === -1) continue;

      // Find the trailing "while (...);" after the closing brace.
      const afterBody = codeNoStringsNoComments.slice(bodyBraceEnd);
      const whileInDo = /\bwhile\s*\(/.exec(afterBody);
      let endIndex = bodyBraceEnd + 1;

      if (whileInDo && typeof whileInDo.index === "number") {
        const whileIndex = bodyBraceEnd + whileInDo.index;
        const semi = codeNoStringsNoComments.indexOf(";", whileIndex);
        endIndex = semi === -1 ? bodyBraceEnd + 1 : semi + 1;
      }

      const loopText = codeNoStringsNoComments.slice(headerStart, endIndex);
      const headerText = codeNoStringsNoComments
        .slice(headerStart, bodyBraceStart)
        .trim()
        .slice(0, 160);

      loops.push({
        kind: "do",
        start: headerStart,
        end: endIndex,
        headerText,
        loopText,
      });

      skipWhileRanges.push({ start: headerStart, end: endIndex });
      continue;
    }

    // for / while
    const headerStart = c.index;
    const braceIndex = codeNoStringsNoComments.indexOf("{", headerStart);
    const semiIndex = codeNoStringsNoComments.indexOf(";", headerStart);

    let endIndex = -1;
    let loopText = "";
    let headerText = "";

    if (braceIndex !== -1 && (semiIndex === -1 || braceIndex < semiIndex)) {
      const closeIndex = findMatchingBrace(codeNoStringsNoComments, braceIndex);
      if (closeIndex !== -1) {
        endIndex = closeIndex + 1;
        loopText = codeNoStringsNoComments.slice(headerStart, endIndex);
        headerText = codeNoStringsNoComments.slice(headerStart, braceIndex).trim().slice(0, 160);
      }
    }

    if (endIndex === -1) {
      const fallbackEnd = semiIndex !== -1 ? semiIndex + 1 : Math.min(headerStart + 220, codeNoStringsNoComments.length);
      endIndex = fallbackEnd;
      loopText = codeNoStringsNoComments.slice(headerStart, endIndex);
      headerText = codeNoStringsNoComments.slice(headerStart, Math.min(headerStart + 160, endIndex)).trim();
    }

    loops.push({
      kind: c.kind,
      start: headerStart,
      end: endIndex,
      headerText,
      loopText,
    });
  }

  return loops;
}

function computeMaxNestingDepth(loops) {
  if (loops.length === 0) return 0;

  const memo = new Array(loops.length).fill(null);

  function depthAt(i) {
    if (memo[i] !== null) return memo[i];

    let maxChild = 0;
    for (let j = 0; j < loops.length; j++) {
      if (i === j) continue;
      const a = loops[i];
      const b = loops[j];

      const contains = b.start > a.start && b.end <= a.end;
      if (contains) {
        maxChild = Math.max(maxChild, depthAt(j));
      }
    }

    memo[i] = 1 + maxChild;
    return memo[i];
  }

  let maxDepth = 0;
  for (let i = 0; i < loops.length; i++) {
    maxDepth = Math.max(maxDepth, depthAt(i));
  }
  return maxDepth;
}

function analyzeCode(rawCode) {
  const code = rawCode || "";
  const stripped = stripCommentsAndStrings(code);

  const recursion = detectRecursion(stripped);
  if (recursion.recursionDetected) {
    return {
      timeComplexity: "O(2^n)",
      explanation:
        `Detected recursion: function "${recursion.functionName}" appears to call itself. ` +
        "Using the basic interview assumption, this is estimated as exponential time.",
      loopsDetected: 0,
      maxLoopNestingDepth: 0,
      logDetected: false,
      recursionDetected: true,
      loops: [],
    };
  }

  const loops = extractLoopBlocks(stripped);
  const loopsDetected = loops.length;
  const maxLoopNestingDepth = computeMaxNestingDepth(loops);

  // Log pattern: loop steps like i *= 2 or i /= 2 (variable name can differ).
  const logRegex = /\b[A-Za-z_]\w*\s*(\*=|\/=)\s*2\b/;
  const logDetected = loops.some((l) => logRegex.test(l.loopText));

  if (maxLoopNestingDepth >= 2) {
    return {
      timeComplexity: "O(n^2)",
      explanation:
        `Detected nested loops (maximum nesting depth: ${maxLoopNestingDepth}). ` +
        "Nested loops multiply the number of iterations, so we estimate O(n^2).",
      loopsDetected,
      maxLoopNestingDepth,
      logDetected,
      recursionDetected: false,
      loops,
    };
  }

  if (logDetected) {
    return {
      timeComplexity: "O(log n)",
      explanation:
        "Detected a logarithmic step inside a loop (pattern like `i *= 2` or `i /= 2`). " +
        "Such loops reduce or expand the problem size multiplicatively, which is modeled as O(log n).",
      loopsDetected,
      maxLoopNestingDepth,
      logDetected,
      recursionDetected: false,
      loops,
    };
  }

  if (loopsDetected >= 1) {
    return {
      timeComplexity: "O(n)",
      explanation:
        `Detected ${loopsDetected} loop(s) without nesting across loop bodies. ` +
        "We treat multiple separate loops as still O(n) (dominant linear growth).",
      loopsDetected,
      maxLoopNestingDepth,
      logDetected,
      recursionDetected: false,
      loops,
    };
  }

  return {
    timeComplexity: "O(1)",
    explanation: "No loops detected in the provided code. With no iteration over n, we estimate O(1).",
    loopsDetected: 0,
    maxLoopNestingDepth: 0,
    logDetected: false,
    recursionDetected: false,
    loops: [],
  };
}

function LoopList({ loops }) {
  if (!loops || loops.length === 0) return null;

  return (
    <div className="loopList" aria-label="Detected loops">
      {loops.map((l, idx) => {
        const keyword = l.kind;
        const header = l.headerText || `${keyword} (...)`;

        // headerText is usually the slice starting at the keyword, so highlight from the start.
        const start = 0;
        const end = Math.min(header.length, keyword.length);
        const before = header.slice(0, start);
        const kw = header.slice(start, end);
        const after = header.slice(end);

        return (
          <div className="loopItem" key={`${l.start}-${idx}`}>
            <div className="type">
              <span>Loop</span>
              <span className="pill">{keyword.toUpperCase()}</span>
            </div>
            <code>
              {before}
              <span className="loopHl">{kw}</span>
              {after}
            </code>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const examples = [
    {
      id: "no-loops",
      title: "No loops (O(1))",
      code: `// Example: constant work
function helper(x) {
  const y = x * 2;
  return y + 10;
}`,
    },
    {
      id: "single-loop",
      title: "Single loop (O(n))",
      code: `// Example: iterate once over n
function sum(n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += i;
  }
  return total;
}`,
    },
    {
      id: "nested-loops",
      title: "Nested loops (O(n^2))",
      code: `// Example: nested iteration
function countPairs(n) {
  let pairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      pairs++;
    }
  }
  return pairs;
}`,
    },
    {
      id: "log-loop",
      title: "Log loop (O(log n))",
      code: `// Example: i doubles each step
function fastPow(n) {
  let i = 1;
  while (i < n) {
    i *= 2; // logarithmic growth
  }
  return i;
}`,
    },
    {
      id: "recursion",
      title: "Recursion (O(2^n))",
      code: `// Example: self recursion
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}`,
    },
  ];

  const [selectedExampleId, setSelectedExampleId] = useState(examples[0].id);
  const [code, setCode] = useState(examples[0].code);
  const [result, setResult] = useState(() => analyzeCode(examples[0].code));

  const onAnalyze = () => {
    const next = analyzeCode(code);
    setResult(next);
  };

  const selected = examples.find((e) => e.id === selectedExampleId) || examples[0];

  return (
    <div className="app">
      <div className="header">
        <div className="brand">
          <h1>Code Complexity Analyzer</h1>
          <p>Interview-ready Big-O estimates from loops + recursion.</p>
        </div>
        <div className="chip">Dark mode • No backend • Simple heuristics</div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardInner">
            <div className="labelRow">
              <div>
                <label htmlFor="exampleSelect">Starter examples</label>
              </div>
              <select
                id="exampleSelect"
                className="select"
                value={selectedExampleId}
                onChange={(e) => {
                  const id = e.target.value;
                  const ex = examples.find((x) => x.id === id) || examples[0];
                  setSelectedExampleId(id);
                  setCode(ex.code);
                  setResult(analyzeCode(ex.code));
                }}
                aria-label="Select example"
              >
                {examples.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>

            <label htmlFor="codeInput">Paste code below</label>
            <textarea
              id="codeInput"
              className="textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste C++, Java, or JavaScript-style code..."
              spellCheck={false}
            />

            <div className="controls">
              <button className="btn" onClick={onAnalyze}>
                Analyze
              </button>
              <button
                className="btn secondary"
                onClick={() => {
                  setSelectedExampleId(selected.id);
                  setCode(selected.code);
                  setResult(analyzeCode(selected.code));
                }}
              >
                Reset to example
              </button>
            </div>

            <div className="hint">
              Tip: The analyzer looks for `for`/`while` loops, nesting depth, patterns like `i *= 2`
              or `i /= 2`, and self-recursion inside function bodies.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="outputTitle">
              <div>
                <div className="pill">Estimated Time Complexity</div>
                <div className="complexity" aria-live="polite">
                  {result.timeComplexity}
                </div>
              </div>
              <div className="pill">{result.recursionDetected ? "Recursion" : "No recursion"}</div>
            </div>

            <div className="explanation">{result.explanation}</div>

            <div className="metaRow" aria-label="Detection summary">
              <div className="metaItem">
                <div className="k">Loops detected</div>
                <div className="v">{result.loopsDetected}</div>
              </div>
              <div className="metaItem">
                <div className="k">Max loop nesting</div>
                <div className="v">{result.maxLoopNestingDepth}</div>
              </div>
              <div className="metaItem">
                <div className="k">Log pattern</div>
                <div className="v">{result.logDetected ? "Yes" : "No"}</div>
              </div>
            </div>

            <div className="hint" style={{ marginTop: 14 }}>
              Detected loop highlights:
            </div>
            <LoopList loops={result.loops} />
            {(!result.loops || result.loops.length === 0) && (
              <div className="hint">No loop blocks to highlight.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Expose the React component for the entry script (no ES module imports).
window.App = App;

// ============================================================
// Final override: upgraded interview-level UI + analysis
// (This file may contain duplicated legacy content due to tooling,
// so we force the correct App at the very end.)
// ============================================================
;(function () {
  var { useState } = React;

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function stripCommentsAndStrings(input) {
    let s = input || "";
    s = s.replace(/\/\*[\s\S]*?\*\//g, " ");
    s = s.replace(/\/\/.*$/gm, " ");
    s = s.replace(/"(?:\\.|[^"\\])*"/g, '""');
    s = s.replace(/'(?:\\.|[^'\\])*'/g, "''");
    s = s.replace(/`(?:\\.|[^`\\])*`/g, "``");
    return s;
  }

  function findMatchingBrace(text, openIndex) {
    if (openIndex < 0 || openIndex >= text.length || text[openIndex] !== "{") return -1;
    let depth = 0;
    for (let i = openIndex; i < text.length; i++) {
      const ch = text[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth === 0) return i;
    }
    return -1;
  }

  function detectRecursion(code) {
    const keywordSet = new Set([
      "if",
      "for",
      "while",
      "switch",
      "catch",
      "do",
      "return",
      "throw",
      "else",
      "try",
      "finally",
    ]);

    const fnRegex = /\b([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/g;
    const results = [];

    let match;
    while ((match = fnRegex.exec(code)) !== null) {
      const name = match[1];
      if (keywordSet.has(name)) continue;

      const braceIndex = code.indexOf("{", match.index);
      const closeIndex = findMatchingBrace(code, braceIndex);
      if (braceIndex === -1 || closeIndex === -1) continue;

      const body = code.slice(braceIndex, closeIndex + 1);
      const callRegex = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "g");
      const matches = body.match(callRegex) || [];
      if (matches.length > 0) results.push({ functionName: name, callCount: matches.length });
    }

    if (results.length === 0) return { recursionDetected: false, recursionCalls: 0, functionName: null };
    results.sort((a, b) => b.callCount - a.callCount);
    return { recursionDetected: true, recursionCalls: results[0].callCount, functionName: results[0].functionName };
  }

  function extractLoopBlocks(code) {
    const loops = [];
    const skipRanges = [];

    function overlapsAnyRange(start, end) {
      for (const r of skipRanges) {
        if (start >= r.start && start < r.end) return true;
        if (end > r.start && end <= r.end) return true;
      }
      return false;
    }

    const candidates = [];
    let m;
    const forRe = /\bfor\s*\(/g;
    const whileRe = /\bwhile\s*\(/g;
    const doRe = /\bdo\b/g;

    while ((m = forRe.exec(code)) !== null) candidates.push({ kind: "for", index: m.index });
    while ((m = whileRe.exec(code)) !== null) candidates.push({ kind: "while", index: m.index });
    while ((m = doRe.exec(code)) !== null) candidates.push({ kind: "do", index: m.index });
    candidates.sort((a, b) => a.index - b.index);

    for (const c of candidates) {
      if (c.kind === "while" && overlapsAnyRange(c.index, c.index + 1)) continue;

      if (c.kind === "do") {
        const headerStart = c.index;
        const bodyBraceStart = code.indexOf("{", headerStart);
        if (bodyBraceStart === -1) continue;

        const bodyBraceEnd = findMatchingBrace(code, bodyBraceStart);
        if (bodyBraceEnd === -1) continue;

        const afterBody = code.slice(bodyBraceEnd);
        const whileInDo = /\bwhile\s*\(/.exec(afterBody);
        let endIndex = bodyBraceEnd + 1;

        if (whileInDo && typeof whileInDo.index === "number") {
          const whileIndex = bodyBraceEnd + whileInDo.index;
          const semi = code.indexOf(";", whileIndex);
          endIndex = semi === -1 ? bodyBraceEnd + 1 : semi + 1;
        }

        loops.push({
          kind: "do",
          start: headerStart,
          end: endIndex,
          headerText: code.slice(headerStart, bodyBraceStart).trim().slice(0, 180),
          loopText: code.slice(headerStart, endIndex),
        });
        skipRanges.push({ start: headerStart, end: endIndex });
        continue;
      }

      const headerStart = c.index;
      const braceIndex = code.indexOf("{", headerStart);
      const semiIndex = code.indexOf(";", headerStart);

      let endIndex = -1;
      let headerText = "";
      let loopText = "";

      if (braceIndex !== -1 && (semiIndex === -1 || braceIndex < semiIndex)) {
        const closeIndex = findMatchingBrace(code, braceIndex);
        if (closeIndex !== -1) {
          endIndex = closeIndex + 1;
          loopText = code.slice(headerStart, endIndex);
          headerText = code.slice(headerStart, braceIndex).trim().slice(0, 180);
        }
      }

      if (endIndex === -1) {
        const fallbackEnd = semiIndex !== -1 ? semiIndex + 1 : Math.min(headerStart + 240, code.length);
        endIndex = fallbackEnd;
        loopText = code.slice(headerStart, endIndex);
        headerText = code.slice(headerStart, Math.min(headerStart + 180, endIndex)).trim();
      }

      loops.push({ kind: c.kind, start: headerStart, end: endIndex, headerText, loopText });
    }

    return loops;
  }

  function computeLoopNestingStats(loops) {
    const levels = new Array(loops.length).fill(0);

    for (let i = 0; i < loops.length; i++) {
      for (let j = 0; j < loops.length; j++) {
        if (i === j) continue;
        const a = loops[i];
        const b = loops[j];
        const contains = a.start > b.start && a.end <= b.end;
        if (contains) levels[i]++;
      }
    }

    const maxNestingDepth = loops.length === 0 ? 0 : Math.max.apply(null, levels) + 1;

    const containsAny = (i) => loops.some((o, j) => j !== i && o.start > loops[i].start && o.end <= loops[i].end);
    const isContainedByAny = (i) => loops.some((o, j) => j !== i && loops[i].start > o.start && loops[i].end <= o.end);

    const innerNestedLoops = loops.filter((_, i) => isContainedByAny(i)).length;
    const outerNestedLoops = loops.filter((_, i) => containsAny(i)).length;
    const sequentialLoops = loops.filter((_, i) => !isContainedByAny(i) && !containsAny(i)).length;

    return { maxNestingDepth, levels, innerNestedLoops, outerNestedLoops, sequentialLoops };
  }

  function analyzeCode(rawCode) {
    const input = (rawCode || "").trim();
    if (!input) return { kind: "error", message: "Please paste some code to analyze." };

    const code = stripCommentsAndStrings(input);
    const recursion = detectRecursion(code);
    const loops = extractLoopBlocks(code);
    const loopsDetected = loops.length;
    const loopStats = computeLoopNestingStats(loops);

    const logRegex = /\b[A-Za-z_]\w*\s*(\*=|\/=)\s*2\b/;
    const logDetected = loops.some((l) => logRegex.test(l.loopText));

    const reasoningSteps = [
      {
        title: "Recursion check",
        detail: recursion.recursionDetected
          ? `Found recursion: function "${recursion.functionName}" calls itself (${recursion.recursionCalls} time(s)).`
          : "No self-recursive function call detected.",
      },
      {
        title: "Loop detection",
        detail:
          loopsDetected > 0
            ? `Detected ${loopsDetected} loop(s). Max nesting depth: ${loopStats.maxNestingDepth}.`
            : "No loops detected (no for/while/do).",
      },
      {
        title: "Logarithmic pattern",
        detail: logDetected
          ? "Found logarithmic step pattern like `i *= 2` / `i /= 2` inside a loop."
          : "No logarithmic step pattern found.",
      },
    ];

    let timeComplexity = "O(1)";
    let confidence = "High";
    let chosenRule = "No loops -> O(1)";

    if (recursion.recursionDetected) {
      timeComplexity = "O(2^n)";
      confidence = "High";
      chosenRule = "Self recursion -> exponential time (basic assumption)";
    } else if (loopStats.maxNestingDepth >= 2) {
      if (logDetected) {
        timeComplexity = "O(n log n)";
        confidence = "Medium";
        chosenRule = "Nested loops + log step -> O(n log n) (heuristic)";
      } else {
        timeComplexity = "O(n^2)";
        confidence = "High";
        chosenRule = "Nested loops -> quadratic time";
      }
    } else if (logDetected) {
      timeComplexity = "O(log n)";
      confidence = "Medium";
      chosenRule = "Log step inside a single loop -> O(log n)";
    } else if (loopsDetected >= 1) {
      timeComplexity = "O(n)";
      confidence = "Low";
      chosenRule = "Loops without nesting -> linear growth (treat sequential loops as O(n))";
    } else {
      timeComplexity = "O(1)";
      confidence = "High";
      chosenRule = "No loops -> constant time";
    }

    reasoningSteps.push({ title: "Final decision", detail: `Rule fired: ${chosenRule}.` });

    const explanationShort = recursion.recursionDetected
      ? "Recursion detected, so runtime grows exponentially under the basic interview assumption."
      : loopStats.maxNestingDepth >= 2
        ? logDetected
          ? "Nested loops combined with a logarithmic step, modeled as O(n log n) by heuristic."
          : "Nested loops detected, so runtime is modeled as quadratic (O(n^2))."
        : logDetected
          ? "A logarithmic step pattern was detected in the loop, modeled as O(log n)."
          : loopsDetected >= 1
            ? "Loops detected without nesting, modeled as linear growth (O(n))."
            : "No loops detected, so runtime is constant (O(1)).";

    const detectedPatterns = [];
    if (recursion.recursionDetected) {
      detectedPatterns.push(`${recursion.functionName} recursion (${recursion.recursionCalls} call(s))`);
    }
    if (loopsDetected > 0) {
      detectedPatterns.push(`${loopsDetected} loop(s) detected`);
      if (loopStats.maxNestingDepth >= 2)
        detectedPatterns.push(`${loopStats.innerNestedLoops} nested (inner) loop(s)`);
      if (loopStats.sequentialLoops > 0)
        detectedPatterns.push(`${loopStats.sequentialLoops} sequential loop(s)`);
    }
    detectedPatterns.push(logDetected ? "log-step pattern found (i *= 2 / i /= 2)" : "no log-step pattern found");

    return {
      kind: "result",
      timeComplexity,
      confidence,
      explanationShort,
      loops,
      loopsDetected,
      loopStats,
      logDetected,
      recursionDetected: recursion.recursionDetected,
      recursionCalls: recursion.recursionCalls,
      recursionFunctionName: recursion.functionName,
      reasoningSteps,
      detectedPatterns,
    };
  }

  function Header({ theme, setTheme }) {
    return (
      <div className="header">
        <div className="headerLeft">
          <div className="title">Code Complexity Analyzer</div>
          <div className="subtitle">Big-O estimates from loops + recursion (interview-ready).</div>
        </div>
        <div className="headerRight">
          <div className="themeToggle" role="group" aria-label="Theme toggle">
            <button className={`themeBtn ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
              Dark
            </button>
            <button className={`themeBtn ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>
              Light
            </button>
          </div>
        </div>
      </div>
    );
  }

  function CodeInput({
    code,
    setCode,
    onAnalyze,
    onCopy,
    onClear,
    isAnalyzing,
    errorMessage,
    onSelectSample,
    onExplain,
    showExplain,
  }) {
    const lineCount = Math.max(1, (code || "").split("\n").length);
    const limitedLineCount = Math.min(lineCount, 300);
    const [scrollTop, setScrollTop] = useState(0);

    return (
      <div className="card editorCard">
        <div className="cardHeader">
          <div className="cardTitle">Input Code</div>
          <div className="cardMeta">Supports C++ / Java / JavaScript-style syntax.</div>
        </div>

        <div className="sampleRow">
          <div className="sampleLabel">Quick tests:</div>
          <div className="sampleButtons">
            <button className="btn secondary" onClick={() => onSelectSample("on")}>
              Test O(n)
            </button>
            <button className="btn secondary" onClick={() => onSelectSample("on2")}>
              Test O(n^2)
            </button>
          </div>
        </div>

        <div className="codePane">
          <div className="lineNumbers" aria-hidden="true" style={{ transform: `translateY(${-scrollTop}px)` }}>
            {Array.from({ length: limitedLineCount }, (_, i) => (
              <div key={i + 1} className="ln">
                {i + 1}
              </div>
            ))}
            {lineCount > limitedLineCount && <div className="ln ellipsis">...</div>}
          </div>

          <textarea
            className="codeTextarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={(e) => setScrollTop(e.target.scrollTop)}
            spellCheck={false}
            placeholder="Paste code here..."
          />
        </div>

        {errorMessage && <div className="errorBox">{errorMessage}</div>}

        <div className="btnRow">
          <button className="btn" onClick={onAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? <span className="spinner" aria-label="Analyzing" /> : "Analyze"}
          </button>
          <button className="btn secondary" onClick={onCopy}>
            Copy
          </button>
          <button className="btn secondary" onClick={onClear}>
            Clear
          </button>
          <button className="btn secondary" onClick={onExplain} disabled={showExplain}>
            Explain Complexity
          </button>
        </div>
      </div>
    );
  }

  function ComplexityBadge({ value }) {
    return (
      <div className="badge">
        <div className="badgeK">Complexity</div>
        <div className="badgeV">{value}</div>
      </div>
    );
  }

  function ConfidenceBadge({ value }) {
    return (
      <div className="badge">
        <div className="badgeK">Confidence</div>
        <div className={`badgeV ${value.toLowerCase()}`}>{value}</div>
      </div>
    );
  }

  function LoopHighlights({ loops }) {
    if (!loops || loops.length === 0) return <div className="muted">No loop blocks to highlight.</div>;
    return (
      <div className="loopList">
        {loops.map((l, idx) => (
          <div className="loopItem" key={`${l.start}-${idx}`}>
            <div className="loopTop">
              <div className="loopType">{l.kind.toUpperCase()}</div>
              <div className="loopHint">Detected</div>
            </div>
            <div className="loopHeader">
              <span className="loopKw">{l.kind}</span>
              <span className="loopText">{l.headerText ? " " + l.headerText : ""}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function ResultCard({ result, showExplain }) {
    if (!result) {
      return (
        <div className="card resultCard">
          <div className="muted">Paste code and click Analyze.</div>
        </div>
      );
    }

    if (result.kind === "error") {
      return (
        <div className="card resultCard">
          <div className="errorBox">{result.message}</div>
        </div>
      );
    }

    return (
      <div className="card resultCard">
        <div className="resultTop">
          <ComplexityBadge value={result.timeComplexity} />
          <ConfidenceBadge value={result.confidence} />
        </div>

        <div className="section">
          <div className="sectionTitle">Explanation</div>
          <div className="explainText">{result.explanationShort}</div>
        </div>

        <div className="section">
          <div className="sectionTitle">Detected Patterns</div>
          <div className="patterns">
            {result.detectedPatterns.map((p, idx) => (
              <div className="pattern" key={`${p}-${idx}`}>
                {p}
              </div>
            ))}
          </div>
        </div>

        {showExplain && (
          <div className="section">
            <div className="sectionTitle">Reasoning (step-by-step)</div>
            <div className="reasoning">
              {result.reasoningSteps.map((s, idx) => (
                <div className="reasonStep" key={`${s.title}-${idx}`}>
                  <div className="reasonTitle">
                    {idx + 1}. {s.title}
                  </div>
                  <div className="reasonDetail">{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section">
          <div className="sectionTitle">Loop highlights</div>
          <LoopHighlights loops={result.loops} />
        </div>

        {!showExplain && <div className="muted small">Press “Explain Complexity” to see detailed reasoning.</div>}
      </div>
    );
  }

  function Footer() {
    return <div className="footer">Built for interviews: fast heuristics, readable reasoning, and a clean developer-tool UI.</div>;
  }

  function FinalApp() {
    var initialExampleCode = `function sum(n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += i;
  }
  return total;
}`;

    var samples = {
      on: initialExampleCode,
      on2: `function countPairs(n) {
  let pairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      pairs++;
    }
  }
  return pairs;
}`,
    };

    var [theme, setTheme] = useState("dark");
    var [code, setCode] = useState(initialExampleCode);
    var [result, setResult] = useState(null);
    var [errorMessage, setErrorMessage] = useState("");
    var [isAnalyzing, setIsAnalyzing] = useState(false);
    var [showExplain, setShowExplain] = useState(false);

    if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;

    var analyze = function () {
      setErrorMessage("");
      var trimmed = (code || "").trim();
      if (!trimmed) {
        setResult(analyzeCode(code));
        setErrorMessage("Input is empty.");
        return;
      }

      setIsAnalyzing(true);
      setTimeout(function () {
        setResult(analyzeCode(code));
        setIsAnalyzing(false);
        setShowExplain(false);
      }, 350);
    };

    var onCopy = function () {
      setErrorMessage("");
      navigator.clipboard
        .writeText(code)
        .catch(function () {
          setErrorMessage("Copy failed. Your browser may block clipboard access.");
        });
    };

    var onClear = function () {
      setErrorMessage("");
      setCode("");
      setResult(null);
      setShowExplain(false);
    };

    var onSelectSample = function (key) {
      var next = samples[key] || initialExampleCode;
      setCode(next);
      setResult(null);
      setErrorMessage("");
      setShowExplain(false);
    };

    var onExplain = function () {
      setShowExplain(true);
    };

    return (
      <div className="appRoot">
        <Header theme={theme} setTheme={setTheme} />
        <div className="mainGrid">
          <CodeInput
            code={code}
            setCode={setCode}
            onAnalyze={analyze}
            onCopy={onCopy}
            onClear={onClear}
            isAnalyzing={isAnalyzing}
            errorMessage={errorMessage}
            onSelectSample={onSelectSample}
            onExplain={onExplain}
            showExplain={showExplain}
          />
          <ResultCard result={result} showExplain={showExplain} />
        </div>
        <Footer />
      </div>
    );
  }

  window.App = FinalApp;
})();

