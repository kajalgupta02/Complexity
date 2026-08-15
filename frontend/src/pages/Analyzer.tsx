import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EditorView, basicSetup } from 'codemirror';
import {
  EditorState,
  Compartment,
  StateEffect,
  StateField,
  RangeSet,
  RangeSetBuilder,
  type Extension,
} from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { lineNumbers, keymap, GutterMarker, gutter, Decoration, type DecorationSet } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import type { ViewUpdate } from '@codemirror/view';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { analyzeCode, detectLanguage, type AnalysisResult, type SupportedLanguage, type LoopInfo } from '@/lib/analyzer';

type Language = SupportedLanguage;

/** Build a lightweight keyword/comment/number/string tokenizer StreamLanguage for langs
 *  that don't ship an official CodeMirror 6 grammar package (C#, Go, Rust, Swift, Kotlin, PHP, Ruby). */
function keywordLang(args: {
  lineComment?: string;
  blockComment?: [string, string];
  keywords: string[];
  types?: string[];
}): Extension {
  const kw = new Set(args.keywords);
  const ty = new Set(args.types ?? []);
  const lineCm = args.lineComment ?? '//';
  const blockStart = args.blockComment?.[0] ?? '/*';
  const blockEnd = args.blockComment?.[1] ?? '*/';
  return StreamLanguage.define({
    startState: () => ({ inBlock: false as boolean }),
    token(stream, state) {
      if (state.inBlock) {
        const rest = stream.string.slice(stream.pos);
        const endIdx = rest.indexOf(blockEnd);
        if (endIdx === -1) { stream.pos = stream.string.length; return 'comment'; }
        stream.pos += endIdx + blockEnd.length;
        state.inBlock = false;
        return 'comment';
      }
      if (stream.eatSpace()) return null;
      // Line comment
      if (stream.match(lineCm)) { stream.pos = stream.string.length; return 'comment'; }
      // Block comment start
      if (stream.match(blockStart)) {
        const rest = stream.string.slice(stream.pos);
        const endIdx = rest.indexOf(blockEnd);
        if (endIdx === -1) { state.inBlock = true; stream.pos = stream.string.length; }
        else { stream.pos += endIdx + blockEnd.length; }
        return 'comment';
      }
      // Strings
      if (stream.match(/^"(?:[^"\\]|\\.)*"/) || stream.match(/^'(?:[^'\\]|\\.)*'/) || stream.match(/^`[^`]*`/)) {
        return 'string';
      }
      // Ruby / PHP style heredoc-ignore; quick PHP var
      if (stream.match(/^\$\w+/)) return 'variableName';
      // Numbers
      if (stream.match(/^0[xX][0-9a-fA-F][0-9a-fA-F_]*/) || stream.match(/^\d+(?:_\d+)*(?:\.\d+(?:_\d+)*(?:[eE][+-]?\d+)?)?/)) {
        return 'number';
      }
      // Identifier
      if (stream.match(/^[A-Za-z_$][\w$]*/)) {
        const w = stream.current();
        if (kw.has(w)) return 'keyword';
        if (ty.has(w)) return 'typeName';
        return null;
      }
      stream.next();
      return null;
    },
    languageData: {},
  });
}

const LANG_EXTENSIONS: Record<SupportedLanguage, Extension> = {
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  python: python(),
  java: java(),
  c: cpp(),
  cpp: cpp(),
  csharp: keywordLang({
    lineComment: '//', blockComment: ['/*', '*/'],
    keywords: ['abstract','as','base','bool','break','byte','case','catch','char','checked','class','const','continue','decimal','default','delegate','do','double','else','enum','event','explicit','extern','false','finally','fixed','float','for','foreach','goto','if','implicit','in','int','interface','internal','is','lock','long','namespace','new','null','object','operator','out','override','params','private','protected','public','readonly','ref','return','sbyte','sealed','short','sizeof','stackalloc','static','string','struct','switch','this','throw','true','try','typeof','uint','ulong','unchecked','unsafe','ushort','using','var','virtual','void','volatile','while','async','await','record','init','with','get','set','add','remove','partial'],
    types: ['int','string','bool','long','double','float','decimal','char','byte','sbyte','short','ushort','uint','ulong','object','dynamic','DateTime','TimeSpan','Guid','String','Int32','Int64','Boolean','List','Dictionary','HashSet','Queue','Stack','IEnumerable','ICollection','IList','IDictionary','IReadOnlyList','IReadOnlyDictionary','Nullable','ValueTuple','Tuple','Array','Task','ValueTask','Action','Func','Span','ReadOnlySpan','Memory','ReadOnlyMemory'],
  }),
  go: keywordLang({
    lineComment: '//', blockComment: ['/*', '*/'],
    keywords: ['break','case','chan','const','continue','default','defer','else','fallthrough','for','func','go','goto','if','import','interface','map','package','range','return','select','struct','switch','type','var','go:embed','any'],
    types: ['int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64','uintptr','float32','float64','complex64','complex128','bool','byte','rune','string','error','any','interface','struct','slice','map','chan','array','nil','true','false','iota','append','cap','close','complex','copy','delete','imag','len','make','new','panic','print','println','real','recover'],
  }),
  rust: keywordLang({
    lineComment: '//', blockComment: ['/*', '*/'],
    keywords: ['as','break','const','continue','crate','else','enum','extern','false','fn','for','if','impl','in','let','loop','match','mod','move','mut','pub','ref','return','self','Self','static','struct','super','trait','true','type','unsafe','use','where','while','async','await','dyn','abstract','final','override','priv','try','union','become','box','do','macro','typeof','unsized','virtual','yield','macro_rules'],
    types: ['i8','i16','i32','i64','i128','isize','u8','u16','u32','u64','u128','usize','f32','f64','bool','char','str','String','Vec','Slice','Box','Rc','Arc','Cell','RefCell','Option','Result','HashMap','HashSet','BTreeMap','BTreeSet','VecDeque','LinkedList','BinaryHeap','PhantomData','Cow','Pin','Duration','Instant','SystemTime','Path','PathBuf','OsStr','OsString','Error','Sized','Send','Sync','Copy','Clone','Default','Debug','Display','PartialEq','Eq','PartialOrd','Ord','Hash','Drop','Iterator','IntoIterator','From','Into','TryFrom','TryInto','AsRef','AsMut','Fn','FnMut','FnOnce','Future','Poll','Ready','Pending','Ok','Err','Some','None','True','False'],
  }),
  swift: keywordLang({
    lineComment: '//', blockComment: ['/*', '*/'],
    keywords: ['associatedtype','class','deinit','enum','extension','fileprivate','func','import','init','inout','internal','let','open','operator','private','precedencegroup','protocol','public','rethrows','static','struct','subscript','typealias','var','break','case','catch','continue','default','defer','do','else','fallthrough','for','guard','if','in','repeat','return','throw','switch','where','while','Any','as','catch','false','is','nil','rethrows','self','Self','super','throw','throws','true','try','associativity','convenience','dynamic','didSet','final','get','indirect','infix','lazy','left','mutating','none','nonmutating','optional','override','postfix','precedence','prefix','Protocol','required','right','set','Type','unowned','weak','willSet','async','await','actor','some','any'],
    types: ['Int','UInt','Int8','UInt8','Int16','UInt16','Int32','UInt32','Int64','UInt64','Float','Double','Float80','Bool','Character','String','UnicodeScalar','StaticString','Substring','Array','Dictionary','Set','Slice','ContiguousArray','Collection','Sequence','Optional','Result','Data','Date','TimeInterval','URL','URLRequest','Data','Error','Never','Void','print','debugPrint','dump','sizeof','stride','min','max','abs'],
  }),
  kotlin: keywordLang({
    lineComment: '//', blockComment: ['/*', '*/'],
    keywords: ['abstract','actual','annotation','as','break','by','catch','class','companion','const','constructor','continue','crossinline','data','do','dynamic','else','enum','expect','external','false','final','finally','for','fun','get','if','import','in','infix','init','inline','inner','interface','internal','is','lateinit','noinline','null','object','open','operator','out','override','package','private','protected','public','return','reified','sealed','set','super','suspend','tailrec','this','throw','true','try','typealias','val','var','vararg','when','where','while','field','it','also','apply','run','with','let','takeIf','takeUnless','repeat'],
    types: ['Any','Nothing','Unit','Boolean','Byte','Short','Int','Long','Float','Double','Char','String','Array','IntArray','ShortArray','LongArray','FloatArray','DoubleArray','CharArray','ByteArray','List','MutableList','Map','MutableMap','Set','MutableSet','Collection','MutableCollection','Iterable','MutableIterable','Sequence','Comparable','Enum','Annotation','Throwable','Exception','Error','RuntimeException','NullPointerException','IllegalArgumentException','IllegalStateException','IndexOutOfBoundsException','HashMap','HashSet','LinkedHashMap','LinkedHashSet','TreeMap','TreeSet','ArrayList','arrayListOf','mapOf','mutableMapOf','setOf','mutableSetOf','listOf','mutableListOf','pair','triple','lazy','println','print','TODO','runCatching','resultOf'],
  }),
  php: keywordLang({
    lineComment: '//', blockComment: ['/*', '*/'],
    keywords: ['abstract','and','array','as','break','callable','case','catch','class','clone','const','continue','declare','default','die','do','echo','else','elseif','empty','enddeclare','endfor','endforeach','endif','endswitch','endwhile','eval','exit','extends','final','finally','for','foreach','function','global','goto','if','implements','include','include_once','instanceof','insteadof','interface','isset','list','match','namespace','new','or','print','private','protected','public','require','require_once','return','self','static','switch','throw','trait','try','unset','use','var','while','xor','yield','yield from','true','false','null','readonly','mixed','never','void','enum','fn','php','readonly','public','protected','private','final','abstract','static'],
    types: ['int','integer','string','float','double','bool','boolean','array','object','null','resource','callable','iterable','mixed','void','never','false','true','self','parent','static','Countable','Iterator','IteratorAggregate','ArrayAccess','Serializable','Closure','Generator','stdClass','Exception','ErrorException','Error','TypeError','ValueError','InvalidArgumentException','LogicException','RuntimeException','OutOfBoundsException','BadMethodCallException','ReflectionClass','ReflectionMethod','ReflectionProperty','ReflectionFunction','DateTime','DateTimeImmutable','DateTimeZone','DateInterval','PDO','PDOStatement','PDOException','mysqli','mysqli_stmt','SplFileInfo','SplFileObject','SplStack','SplQueue','SplDoublyLinkedList','SplPriorityQueue','SplObjectStorage','WeakMap','WeakReference','Ds\\Map','Ds\\Set','Ds\\Vector','Ds\\Deque','Ds\\Stack','Ds\\Queue','Ds\\PriorityQueue','Ds\\Pair'],
  }),
  ruby: keywordLang({
    lineComment: '#', blockComment: ['=begin', '=end'],
    keywords: ['alias','and','begin','break','case','class','def','defined?','do','else','elsif','end','ensure','false','for','if','in','module','next','nil','not','or','redo','rescue','retry','return','self','super','then','true','undef','unless','until','when','while','yield','BEGIN','END','__FILE__','__LINE__','__dir__','require','require_relative','load','include','extend','prepend','attr_accessor','attr_reader','attr_writer','public','protected','private','module_function','refine','using'],
    types: ['Object','BasicObject','Kernel','NilClass','TrueClass','FalseClass','String','Symbol','Integer','Float','Numeric','Bignum','Fixnum','Rational','Complex','Array','Hash','Set','SortedSet','Range','Regexp','MatchData','Struct','OpenStruct','Enumerable','Comparable','IO','File','Dir','Tempfile','Pathname','Time','Date','DateTime','Exception','StandardError','ArgumentError','TypeError','NameError','NoMethodError','RuntimeError','LoadError','SyntaxError','IndexError','RangeError','ZeroDivisionError','Thread','Mutex','ConditionVariable','Queue','SizedQueue','Fiber','Class','Module','Method','UnboundMethod','Proc','Binding','Enumerator','Lazy','Enumerator::Chain','Enumerator::ArithmeticSequence','TracePoint','GC','ObjectSpace','Random','SecureRandom','JSON','YAML','CSV','ERB','Logger','URI','Net::HTTP','Socket','Addrinfo','IPAddr','OpenSSL::SSL'],
  }),
};

const LANG_OPTIONS: { value: Language; label: string; icon: string }[] = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'python',     label: 'Python',     icon: '🐍' },
  { value: 'java',       label: 'Java',       icon: '☕' },
  { value: 'csharp',     label: 'C#',         icon: '🟣' },
  { value: 'go',         label: 'Go',         icon: '🐹' },
  { value: 'rust',       label: 'Rust',       icon: '🦀' },
  { value: 'cpp',        label: 'C++',        icon: '⚙️' },
  { value: 'c',          label: 'C',          icon: '🇨' },
  { value: 'swift',      label: 'Swift',      icon: '🍎' },
  { value: 'kotlin',     label: 'Kotlin',     icon: '🟪' },
  { value: 'php',        label: 'PHP',        icon: '🐘' },
  { value: 'ruby',       label: 'Ruby',       icon: '💎' },
];

const LANG_META: Record<Language, { label: string; icon: string; accent: string }> = {
  javascript: { label: 'JS',   icon: '🟨', accent: 'text-yellow-500' },
  typescript: { label: 'TS',   icon: '🔷', accent: 'text-blue-500' },
  python:     { label: 'PY',   icon: '🐍', accent: 'text-emerald-500' },
  java:       { label: 'Java', icon: '☕', accent: 'text-orange-500' },
  csharp:     { label: 'C#',   icon: '🟣', accent: 'text-violet-500' },
  go:         { label: 'Go',   icon: '🐹', accent: 'text-cyan-500' },
  rust:       { label: 'Rust', icon: '🦀', accent: 'text-orange-600' },
  cpp:        { label: 'C++',  icon: '⚙️', accent: 'text-pink-500' },
  c:          { label: 'C',    icon: '🇨', accent: 'text-sky-500' },
  swift:      { label: 'Swift',icon: '🍎', accent: 'text-rose-500' },
  kotlin:     { label: 'KT',   icon: '🟪', accent: 'text-fuchsia-500' },
  php:        { label: 'PHP',  icon: '🐘', accent: 'text-indigo-400' },
  ruby:       { label: 'Ruby', icon: '💎', accent: 'text-red-500' },
};

const FILE_NAME: Record<Language, string> = {
  javascript: 'main.js',
  typescript: 'main.ts',
  python:     'main.py',
  java:       'Main.java',
  csharp:     'Program.cs',
  go:         'main.go',
  rust:       'main.rs',
  cpp:        'main.cpp',
  c:          'main.c',
  swift:      'main.swift',
  kotlin:     'Main.kt',
  php:        'index.php',
  ruby:       'main.rb',
};

/** Map a loop's nesting depth + hasSortCall to a Big-O badge string */
function loopComplexityBadge(loop: LoopInfo): string {
  if (loop.nestingDepth === 0) {
    return loop.hasSortCall ? 'O(n log n)' : 'O(n)';
  }
  if (loop.nestingDepth === 1) {
    return loop.hasSortCall ? 'O(n² log n)' : 'O(n²)';
  }
  return 'O(n³)';
}

/** Loop gutter badge — small colored pill in the line-number gutter with O(…). */
class LoopGutterBadge extends GutterMarker {
  constructor(readonly label: string, readonly depth: number) { super(); }
  toDOM(): Node {
    const span = document.createElement('span');
    span.title = `Complexity driver: ${this.label} — nesting depth ${this.depth + 1}`;
    const isBad = this.depth >= 2;
    const isMedium = this.depth === 1;
    span.className =
      'inline-flex items-center justify-center text-[9px] font-bold font-mono leading-none ' +
      'px-1.5 py-0.5 rounded-full select-none pointer-events-none ' +
      (isBad
        ? 'bg-red-500/15 text-red-500 border border-red-500/30'
        : isMedium
        ? 'bg-orange-500/15 text-orange-500 border border-orange-500/30'
        : 'bg-amber-400/15 text-amber-500 border border-amber-400/30');
    span.textContent = this.label;
    return span;
  }
}

const setLoopMarkersEffect = StateEffect.define<DecorationSet>();

const loopMarkersField = StateField.define<DecorationSet>({
  create() { return Decoration.none; },
  update(prev, tr) {
    for (const e of tr.effects) if (e.is(setLoopMarkersEffect)) return e.value;
    return prev.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

const loopBadgeGutter = gutter({
  class: 'cm-loopBadge-gutter',
  markers: (view) => {
    const decorations = view.state.field(loopMarkersField, false);
    if (!decorations) return RangeSet.empty;
    const builder = new RangeSetBuilder<GutterMarker>();
    const addedLines = new Set<number>();
    decorations.between(0, view.state.doc.length, (f: number, _t: number, d: any) => {
      const spec = d?.spec?.loopMarkerSpec as { label: string; depth: number } | undefined;
      if (!spec) return;
      try {
        const line = view.state.doc.lineAt(f);
        if (!addedLines.has(line.number)) {
          addedLines.add(line.number);
          builder.add(line.from, line.from, new LoopGutterBadge(spec.label, spec.depth));
        }
      } catch { /* ignore */ }
    });
    return builder.finish();
  },
});

const themeLoopUnderlines = EditorView.baseTheme({
  '.cm-loopBadge-gutter': { width: 'auto', padding: '0 4px 0 2px', minWidth: '8px' },
  '.cm-loopHighlight-oN': {
    background: 'rgba(245, 158, 11, 0.08)',
    textDecoration: 'wavy underline rgba(245, 158, 11, 0.55)',
    textUnderlineOffset: '3px',
    textDecorationThickness: '1.5px',
  },
  '.cm-loopHighlight-oN2': {
    background: 'rgba(239, 68, 68, 0.1)',
    textDecoration: 'wavy underline rgba(239, 68, 68, 0.6)',
    textUnderlineOffset: '3px',
    textDecorationThickness: '1.5px',
  },
  '.cm-loopHighlight-oN3': {
    background: 'rgba(239, 68, 68, 0.14)',
    textDecoration: 'wavy underline rgba(239, 68, 68, 0.7)',
    textUnderlineOffset: '3px',
    textDecorationThickness: '1.8px',
  },
  '&dark .cm-loopHighlight-oN':  { background: 'rgba(245, 158, 11, 0.09)' },
  '&dark .cm-loopHighlight-oN2': { background: 'rgba(239, 68, 68, 0.11)' },
  '&dark .cm-loopHighlight-oN3': { background: 'rgba(239, 68, 68, 0.15)' },
});

/**
 * Apply gutter markers + inline wavy underlines for each complexity-contributing loop.
 */
export function applyLoopMarkers(view: EditorView | null, loops: LoopInfo[]) {
  if (!view) return;
  try {
    if (loops.length === 0) {
      view.dispatch({ effects: setLoopMarkersEffect.of(Decoration.none) });
      return;
    }
    const builder = new RangeSetBuilder<Decoration>();
    const doc = view.state.doc;
    for (const loop of loops) {
      const lineNo = Math.min(Math.max(1, loop.startLine), doc.lines);
      const line = doc.line(lineNo);
      const label = loopComplexityBadge(loop);
      const deco = Decoration.mark({
        class:
          loop.nestingDepth === 0
            ? 'cm-loopHighlight-oN'
            : loop.nestingDepth === 1
            ? 'cm-loopHighlight-oN2'
            : 'cm-loopHighlight-oN3',
        loopMarkerSpec: { label, depth: loop.nestingDepth, type: loop.type } as any,
        inclusive: true,
        inclusiveStart: true,
        inclusiveEnd: false,
      });
      const endPos = Math.min(line.to + 1, doc.length);
      builder.add(line.from, endPos, deco);
    }
    view.dispatch({ effects: setLoopMarkersEffect.of(builder.finish()) });
  } catch {
    try { view.dispatch({ effects: setLoopMarkersEffect.of(Decoration.none) }); } catch { /* ignore */ }
  }
}

const DEFAULT_SAMPLE_CODE = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`;

function formatCode(src: string, lang: Language): string {
  if (!src.trim()) return '';
  if (lang === 'python') {
    return src.replace(/\s+$/gm, '').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '') + '\n';
  }
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  let indent = 0;
  const result: string[] = [];
  const INDENT_UNIT = '  ';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { result.push(''); continue; }
    const opens = (line.match(/[[{(]/g) || []).length;
    const closes = (line.match(/[})\]]/g) || []).length;
    const startsWithClose = /^[})\]]/.test(line);
    if (startsWithClose && indent > 0) indent--;
    result.push(INDENT_UNIT.repeat(Math.max(0, indent)) + line);
    indent += opens - closes;
    if (startsWithClose) {
      indent = Math.max(0, indent + 1);
      const net = opens - closes;
      indent = Math.max(0, indent - 1 + net);
    }
    indent = Math.max(0, indent);
  }
  return result.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '') + '\n';
}

export const Analyzer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [code, setCode] = useState<string>(DEFAULT_SAMPLE_CODE);
  const [language, setLanguage] = useState<Language>('javascript');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [autoDetected, setAutoDetected] = useState<Language | null>(null);

  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const langCompartmentRef = useRef<Compartment>(new Compartment());
  const isSyncingRef = useRef<boolean>(false);
  const languageRef = useRef<Language>(language);
  const autoDetectDisabledUntilRef = useRef<number>(0);

  // Keep languageRef up to date so init-time closures still see the latest language
  useEffect(() => { languageRef.current = language; }, [language]);

  /** Auto-detect language from source code, switch grammar if different, show badge + toast */
  const tryAutoDetect = (
    src: string,
    currentLang: Language,
    onDetect: (detected: Language) => void,
    setBadge: (lang: Language | null) => void,
  ): void => {
    if (!src || Date.now() < autoDetectDisabledUntilRef.current) return;
    try {
      const detected = detectLanguage(src) as Language;
      if (!detected || detected === currentLang) return;
      if (!Object.prototype.hasOwnProperty.call(LANG_EXTENSIONS, detected)) return;
      onDetect(detected);
      setBadge(detected);
      addToast('info', `Auto-detected ${LANG_META[detected].label} — grammar switched`);
    } catch { /* ignore */ }
  };

  /** Copy to clipboard with fallback + toast */
  const copyCode = async (text: string, label: string): Promise<void> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      addToast('success', `${label} copied to clipboard`);
    } catch {
      addToast('danger', `Could not copy ${label}`);
    }
  };

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorContainerRef.current) return;

    let cancelled = false;

    const isDark = document.documentElement.classList.contains('dark');
    const themeExtension = isDark
      ? oneDark
      : EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': { fontFamily: 'JetBrains Mono, monospace' },
          '.cm-gutters': { borderRight: '1px solid rgba(120,130,160,0.15)' },
        });

    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        lineNumbers(),
        loopBadgeGutter,
        loopMarkersField,
        themeLoopUnderlines,
        themeExtension,
        langCompartmentRef.current.of(LANG_EXTENSIONS[languageRef.current]),
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged && !isSyncingRef.current) {
            const next = update.state.doc.toString();
            setCode(next);
            const originatedFromPasteOrCut =
              update.transactions.some((tr) => tr.isUserEvent('input.paste') || tr.isUserEvent('delete.cut') || tr.isUserEvent('input.drop'));
            if (originatedFromPasteOrCut) {
              tryAutoDetect(next, languageRef.current, (d) => {
                setLanguage(d);
                languageRef.current = d;
              }, setAutoDetected);
            } else if (next.length > 80 && update.transactions.some((tr) => tr.isUserEvent('input'))) {
              tryAutoDetect(next, languageRef.current, (d) => {
                setLanguage(d);
                languageRef.current = d;
              }, setAutoDetected);
            }
          }
        }),
        EditorView.domEventHandlers({
          paste: (_ev, view) => {
            const next = view.state.doc.toString();
            tryAutoDetect(next, languageRef.current, (d) => {
              setLanguage(d);
              languageRef.current = d;
            }, setAutoDetected);
            return false;
          },
          cut: (_ev, view) => {
            setTimeout(() => {
              try {
                tryAutoDetect(view.state.doc.toString(), languageRef.current, (d) => {
                  setLanguage(d);
                  languageRef.current = d;
                }, setAutoDetected);
              } catch { /* ignore */ }
            }, 0);
            return false;
          },
        }),
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              handleAnalyze();
              return true;
            },
          },
        ]),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });

    if (cancelled) { view.destroy(); return; }
    editorViewRef.current = view;

    return () => {
      cancelled = true;
      view.destroy();
    };
  }, []); // Mount once

  // Update language extension dynamically when language changes
  useEffect(() => {
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        effects: langCompartmentRef.current.reconfigure(LANG_EXTENSIONS[language]),
      });
    }
  }, [language]);

  // Handle URL query parameters (e.g. from Dashboard or Landing page)
  useEffect(() => {
    const qCode = searchParams.get('code');
    const qLang = searchParams.get('lang');
    if (qCode) {
      setCode(qCode);
      if (qLang && LANG_OPTIONS.some((o) => o.value === qLang)) {
        setLanguage(qLang as Language);
      }
      if (editorViewRef.current) {
        isSyncingRef.current = true;
        editorViewRef.current.dispatch({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: qCode,
          },
        });
        isSyncingRef.current = false;
      }
      // Auto-run analysis for loaded snippet
      executeAnalysis(qCode, (qLang as Language) || language);
    }
  }, [searchParams]);

  const executeAnalysis = async (codeToAnalyze: string, langToAnalyze: Language) => {
    if (!codeToAnalyze.trim()) {
      addToast('warning', 'Please enter some code to analyze.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = analyzeCode(codeToAnalyze, langToAnalyze);
      setResult(res);

      // WIRE: Interactive Line Diagnostics — mark complexity-driving loops in gutter + underline
      applyLoopMarkers(editorViewRef.current, res.loops ?? []);
    } catch {
      addToast('danger', 'Analysis encountered an issue.');
      applyLoopMarkers(editorViewRef.current, []);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    executeAnalysis(code, language);
  };

  const handleFormatCode = () => {
    const formatted = formatCode(code, language);
    setCode(formatted);
    if (editorViewRef.current) {
      isSyncingRef.current = true;
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: formatted,
        },
      });
      isSyncingRef.current = false;
    }
    applyLoopMarkers(editorViewRef.current, []);
    addToast('success', 'Code formatted');
  };

  const handleClearCode = () => {
    setCode('');
    setResult(null);
    setAutoDetected(null);
    if (editorViewRef.current) {
      isSyncingRef.current = true;
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: '',
        },
      });
      isSyncingRef.current = false;
      applyLoopMarkers(editorViewRef.current, []);
    }
    addToast('info', 'Editor cleared');
  };

  // Helper for complexity badge color
  const getComplexityBadgeColor = (complexity: string) => {
    if (complexity.includes('O(1)') || complexity.includes('O(log n)')) {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    if (complexity.includes('O(n)') || complexity.includes('O(n log n)')) {
      return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
    }
    if (complexity.includes('O(n²)') || complexity.includes('O(n³)')) {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
    return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
  };

  const spaceComplexityDisplay = result
    ? typeof result.spaceComplexity === 'string'
      ? result.spaceComplexity
      : result.spaceComplexity?.class || 'O(1)'
    : 'O(1)';

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* TOP CONTROL BAR: Language + Analyze only */}
        <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white">
                Paste & Analyze
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                Auto-detects 13 languages. Click <span className="font-mono font-semibold">Analyze</span> for time & space complexity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                id="language-select"
                value={language}
                onChange={(e) => {
                  const next = e.target.value as Language;
                  setLanguage(next);
                  languageRef.current = next;
                  setAutoDetected(null);
                  autoDetectDisabledUntilRef.current = Date.now() + 2000;
                }}
                className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer transition-all"
              >
                {LANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <span className="text-[11px] text-gray-400 hidden md:inline font-mono">
              ⌘/Ctrl + Enter
            </span>
            <Button
              variant="primary"
              size="md"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !code.trim()}
              className="w-full sm:w-auto px-6 py-2.5 font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin w-4 h-4 -ml-0.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  ⚡ Analyze Complexity
                </>
              )}
            </Button>
          </div>
        </div>

        {/* MAIN WORKSPACE GRID: Left (Code Input) + Right (Complexity Results & How Calculated) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: CODE EDITOR INPUT AREA */}
          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col h-[650px]">
            {/* PRODUCTION EDITOR HEADER: language icon + filename + Auto-Detected badge ↔ Copy/Format/Clear */}
            <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60 flex items-center justify-between gap-2">
              {/* LEFT: Language + filename + Auto-Detected badge */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700/60">
                  <span className="text-sm">{LANG_META[language].icon}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 font-mono hidden sm:inline">
                    {LANG_META[language].label}
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-200 min-w-0 truncate" title={FILE_NAME[language]}>
                  {FILE_NAME[language]}
                </span>
                {autoDetected && (
                  <Tooltip content={`Switched grammar to ${LANG_META[autoDetected].label} automatically. Click language dropdown to override.`} position="bottom">
                    <Badge variant="primary" size="xs" className="!text-[10px] !px-2 !py-0.5 tracking-wide uppercase">
                      <span className="mr-0.5">✨</span>Auto: {LANG_META[autoDetected].label}
                    </Badge>
                  </Tooltip>
                )}
              </div>
              {/* RIGHT: Copy / Format / Clear utility buttons */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <Tooltip content="Copy code (⌘C)" position="bottom">
                  <button
                    type="button"
                    onClick={() => copyCode(code, `${LANG_META[language].label} code`)}
                    disabled={!code.trim()}
                    title="Copy to clipboard"
                    className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    📋<span className="hidden sm:inline">Copy</span>
                  </button>
                </Tooltip>
                <Tooltip content="Auto-indent / Format code" position="bottom">
                  <button
                    type="button"
                    onClick={handleFormatCode}
                    disabled={!code.trim()}
                    title="Format indentation"
                    className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ✨<span className="hidden sm:inline">Format</span>
                  </button>
                </Tooltip>
                <Tooltip content="Clear editor" position="bottom">
                  <button
                    type="button"
                    onClick={handleClearCode}
                    disabled={!code.trim()}
                    title="Clear editor"
                    className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    🗑️<span className="hidden sm:inline">Clear</span>
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* CodeMirror Mounting Container */}
            <div
              ref={editorContainerRef}
              className="flex-1 overflow-auto font-mono text-sm bg-white dark:bg-[#0d121f]"
            />

            {/* Editor Footer Status Bar — shows loop count with complexity info */}
            <div className="px-3 sm:px-5 py-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
              <div className="flex items-center gap-3 sm:gap-4">
                <span>{code.split('\n').length} lines</span>
                <span>{code.length} chars</span>
                {result && (result.loops?.length ?? 0) > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    ⚠ {(result.loops?.length ?? 0)} loop{(result.loops?.length ?? 0) === 1 ? '' : 's'} · O(…) marked
                  </span>
                )}
              </div>
              <span className={`font-medium ${autoDetected ? 'text-indigo-500' : 'text-emerald-500'}`}>
                ● {autoDetected ? `${LANG_META[autoDetected].label} Auto-Detected` : 'Static Evaluator Ready'}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: TIME + SPACE COMPLEXITY RESULTS */}
          <div className="lg:col-span-6 space-y-4">
            {result ? (
              <div className="space-y-4">
                {/* HERO: Time + Space side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Time Complexity */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Time Complexity
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {Math.round(result.timeConfidence)}%
                      </span>
                    </div>
                    <span
                      className={`inline-block px-3.5 py-2 rounded-2xl text-2xl sm:text-3xl font-black font-mono border ${getComplexityBadgeColor(
                        result.timeComplexity
                      )}`}
                    >
                      {result.timeComplexity}
                    </span>
                  </div>

                  {/* Space Complexity */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Space Complexity
                      </span>
                      <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                        Auxiliary
                      </span>
                    </div>
                    <span
                      className={`inline-block px-3.5 py-2 rounded-2xl text-2xl sm:text-3xl font-black font-mono border ${getComplexityBadgeColor(
                        spaceComplexityDisplay
                      )}`}
                    >
                      {spaceComplexityDisplay}
                    </span>
                  </div>
                </div>

                {/* SUMMARY STATS: Loops / Recursion / Key Ops */}
                <div className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                        Analysis Summary
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Highlights that drive the Big-O bounds above.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(result.loops?.length ?? 0) > 0 && (
                        <Badge variant="warning" size="sm">
                          {(result.loops?.length ?? 0)} loop{(result.loops?.length ?? 0) === 1 ? '' : 's'}
                        </Badge>
                      )}
                      {result.recursion?.hasDirectRecursion && (
                        <Badge variant="primary" size="sm">
                          Recursive
                        </Badge>
                      )}
                      {!result.recursion?.hasDirectRecursion && (result.loops?.length ?? 0) === 0 && (
                        <Badge variant="success" size="sm">
                          No loops · constant time
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Loop table (if any) */}
                  {result.loops && result.loops.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Complexity-driving loops
                      </h3>
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                        {result.loops.map((loop, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-gray-50/60 dark:bg-[#0c101c]/60"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px]">
                                {String(loop.type || 'loop').toUpperCase()}
                              </span>
                              <span className="font-mono text-gray-700 dark:text-gray-200">
                                Line {loop.startLine}–{loop.endLine}
                              </span>
                            </div>
                            <span
                              className={`font-mono font-black px-2 py-0.5 rounded-md text-[11px] ${
                                loop.nestingDepth === 0
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : loop.nestingDepth === 1
                                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}
                            >
                              {loopComplexityBadge(loop)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key stdlib ops */}
                  {result.stdlibCalls && result.stdlibCalls.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Notable operations
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {result.stdlibCalls.slice(0, 8).map((op, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800/70 border border-gray-200/70 dark:border-gray-700/60 text-[11px] font-mono text-gray-700 dark:text-gray-200"
                          >
                            <span className="font-semibold">{op.name}</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                              {op.complexity}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recursion note */}
                  {result.recursion?.hasDirectRecursion && (
                    <div className="p-3 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/25 border border-cyan-200/60 dark:border-cyan-800/40 text-xs text-cyan-900 dark:text-cyan-200 space-y-1">
                      <p className="font-bold">🌿 Recursive call pattern detected</p>
                      <p className="text-cyan-800/90 dark:text-cyan-300/90">
                        Memory on the call stack grows with recursion depth unless tail-call optimization applies.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-10 text-center rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5 h-[650px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl shadow-sm">
                  ⚡
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Paste your code · click Analyze
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Get the <strong className="text-gray-800 dark:text-gray-200">time</strong> and{' '}
                    <strong className="text-gray-800 dark:text-gray-200">space</strong> Big-O complexity of any snippet.
                    The engine auto-detects 13 languages and marks complexity-driving loops in the gutter.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={!code.trim()}
                  className="font-bold shadow-md shadow-indigo-500/20"
                >
                  Analyze ⚡
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyzer;
