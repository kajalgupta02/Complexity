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
import { useAuth } from '@/context/AuthContext';
import SampleGallery from '@/components/SampleGallery';
import OnboardingTour from '@/components/OnboardingTour';
import type { Sample } from '@/data/samples';
import {
  analyzeCode,
  detectLanguage,
  type AnalysisResult,
  type SupportedLanguage,
  type LoopInfo,
  type LoopType,
} from '@/lib/analyzer';

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
        if (endIdx === -1) {
          stream.pos = stream.string.length;
          return 'comment';
        }
        stream.pos += endIdx + blockEnd.length;
        state.inBlock = false;
        return 'comment';
      }
      if (stream.eatSpace()) return null;
      // Line comment
      if (stream.match(lineCm)) {
        stream.pos = stream.string.length;
        return 'comment';
      }
      // Block comment start
      if (stream.match(blockStart)) {
        const rest = stream.string.slice(stream.pos);
        const endIdx = rest.indexOf(blockEnd);
        if (endIdx === -1) {
          state.inBlock = true;
          stream.pos = stream.string.length;
        } else {
          stream.pos += endIdx + blockEnd.length;
        }
        return 'comment';
      }
      // Strings
      if (stream.match(/^"(?:[^"\\]|\\.)*"/) || stream.match(/^'(?:[^'\\]|\\.)*'/) || stream.match(/^`[^`]*`/)) {
        return 'string';
      }
      // Ruby / PHP style heredoc-ignore; quick PHP var
      if (stream.match(/^\$\w+/)) return 'variableName';
      // Numbers
      if (
        stream.match(/^0[xX][0-9a-fA-F][0-9a-fA-F_]*/) ||
        stream.match(/^\d+(?:_\d+)*(?:\.\d+(?:_\d+)*(?:[eE][+-]?\d+)?)?/)
      ) {
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
    lineComment: '//',
    blockComment: ['/*', '*/'],
    keywords: [
      'abstract','as','base','bool','break','byte','case','catch','char','checked','class','const','continue','decimal','default','delegate','do','double','else','enum','event','explicit','extern','false','finally','fixed','float','for','foreach','goto','if','implicit','in','int','interface','internal','is','lock','long','namespace','new','null','object','operator','out','override','params','private','protected','public','readonly','ref','return','sbyte','sealed','short','sizeof','stackalloc','static','string','struct','switch','this','throw','true','try','typeof','uint','ulong','unchecked','unsafe','ushort','using','var','virtual','void','volatile','while','async','await','record','init','with','get','set','add','remove','partial',
    ],
    types: [
      'int','string','bool','long','double','float','decimal','char','byte','sbyte','short','ushort','uint','ulong','object','dynamic','DateTime','TimeSpan','Guid','String','Int32','Int64','Boolean','List','Dictionary','HashSet','Queue','Stack','IEnumerable','ICollection','IList','IDictionary','IReadOnlyList','IReadOnlyDictionary','Nullable','ValueTuple','Tuple','Array','Task','ValueTask','Action','Func','Span','ReadOnlySpan','Memory','ReadOnlyMemory',
    ],
  }),
  go: keywordLang({
    lineComment: '//',
    blockComment: ['/*', '*/'],
    keywords: [
      'break','case','chan','const','continue','default','defer','else','fallthrough','for','func','go','goto','if','import','interface','map','package','range','return','select','struct','switch','type','var','go:embed','any',
    ],
    types: [
      'int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64','uintptr','float32','float64','complex64','complex128','bool','byte','rune','string','error','any','interface','struct','slice','map','chan','array','nil','true','false','iota','append','cap','close','complex','copy','delete','imag','len','make','new','panic','print','println','real','recover',
    ],
  }),
  rust: keywordLang({
    lineComment: '//',
    blockComment: ['/*', '*/'],
    keywords: [
      'as','break','const','continue','crate','else','enum','extern','false','fn','for','if','impl','in','let','loop','match','mod','move','mut','pub','ref','return','self','Self','static','struct','super','trait','true','type','unsafe','use','where','while','async','await','dyn','abstract','final','override','priv','try','union','become','box','do','macro','typeof','unsized','virtual','yield','macro_rules',
    ],
    types: [
      'i8','i16','i32','i64','i128','isize','u8','u16','u32','u64','u128','usize','f32','f64','bool','char','str','String','Vec','Slice','Box','Rc','Arc','Cell','RefCell','Option','Result','HashMap','HashSet','BTreeMap','BTreeSet','VecDeque','LinkedList','BinaryHeap','PhantomData','Cow','Pin','Duration','Instant','SystemTime','Path','PathBuf','OsStr','OsString','Error','Sized','Send','Sync','Copy','Clone','Default','Debug','Display','PartialEq','Eq','PartialOrd','Ord','Hash','Drop','Iterator','IntoIterator','From','Into','TryFrom','TryInto','AsRef','AsMut','Fn','FnMut','FnOnce','Future','Poll','Ready','Pending','Ok','Err','Some','None','True','False',
    ],
  }),
  swift: keywordLang({
    lineComment: '//',
    blockComment: ['/*', '*/'],
    keywords: [
      'associatedtype','class','deinit','enum','extension','fileprivate','func','import','init','inout','internal','let','open','operator','private','precedencegroup','protocol','public','rethrows','static','struct','subscript','typealias','var','break','case','catch','continue','default','defer','do','else','fallthrough','for','guard','if','in','repeat','return','throw','switch','where','while','Any','as','catch','false','is','nil','rethrows','self','Self','super','throw','throws','true','try','associativity','convenience','dynamic','didSet','final','get','indirect','infix','lazy','left','mutating','none','nonmutating','optional','override','postfix','precedence','prefix','Protocol','required','right','set','Type','unowned','weak','willSet','async','await','actor','some','any',
    ],
    types: [
      'Int','UInt','Int8','UInt8','Int16','UInt16','Int32','UInt32','Int64','UInt64','Float','Double','Float80','Bool','Character','String','UnicodeScalar','StaticString','Substring','Array','Dictionary','Set','Slice','ContiguousArray','Collection','Sequence','Optional','Result','Data','Date','TimeInterval','URL','URLRequest','Data','Error','Never','Void','print','debugPrint','dump','sizeof','stride','min','max','abs',
    ],
  }),
  kotlin: keywordLang({
    lineComment: '//',
    blockComment: ['/*', '*/'],
    keywords: [
      'abstract','actual','annotation','as','break','by','catch','class','companion','const','constructor','continue','crossinline','data','do','dynamic','else','enum','expect','external','false','final','finally','for','fun','get','if','import','in','infix','init','inline','inner','interface','internal','is','lateinit','noinline','null','object','open','operator','out','override','package','private','protected','public','return','reified','sealed','set','super','suspend','tailrec','this','throw','true','try','typealias','val','var','vararg','when','where','while','field','it','also','apply','run','with','let','takeIf','takeUnless','repeat',
    ],
    types: [
      'Any','Nothing','Unit','Boolean','Byte','Short','Int','Long','Float','Double','Char','String','Array','IntArray','ShortArray','LongArray','FloatArray','DoubleArray','CharArray','ByteArray','List','MutableList','Map','MutableMap','Set','MutableSet','Collection','MutableCollection','Iterable','MutableIterable','Sequence','Comparable','Enum','Annotation','Throwable','Exception','Error','RuntimeException','NullPointerException','IllegalArgumentException','IllegalStateException','IndexOutOfBoundsException','HashMap','HashSet','LinkedHashMap','LinkedHashSet','TreeMap','TreeSet','ArrayList','arrayListOf','mapOf','mutableMapOf','setOf','mutableSetOf','listOf','mutableListOf','pair','triple','lazy','println','print','TODO','runCatching','resultOf',
    ],
  }),
  php: keywordLang({
    lineComment: '//',
    blockComment: ['/*', '*/'],
    keywords: [
      'abstract','and','array','as','break','callable','case','catch','class','clone','const','continue','declare','default','die','do','echo','else','elseif','empty','enddeclare','endfor','endforeach','endif','endswitch','endwhile','eval','exit','extends','final','finally','for','foreach','function','global','goto','if','implements','include','include_once','instanceof','insteadof','interface','isset','list','match','namespace','new','or','print','private','protected','public','require','require_once','return','self','static','switch','throw','trait','try','unset','use','var','while','xor','yield','yield from','true','false','null','readonly','mixed','never','void','enum','fn','php',
    ],
    types: [
      'int','integer','string','float','double','bool','boolean','array','object','null','resource','callable','iterable','mixed','void','never','false','true','self','parent','static','Countable','Iterator','IteratorAggregate','ArrayAccess','Serializable','Closure','Generator','stdClass','Exception','ErrorException','Error','TypeError','ValueError','InvalidArgumentException','LogicException','RuntimeException','OutOfBoundsException','BadMethodCallException','ReflectionClass','ReflectionMethod','ReflectionProperty','ReflectionFunction','DateTime','DateTimeImmutable','DateTimeZone','DateInterval','PDO','PDOStatement','PDOException','mysqli','mysqli_stmt','SplFileInfo','SplFileObject','SplStack','SplQueue','SplDoublyLinkedList','SplPriorityQueue','SplObjectStorage','WeakMap','WeakReference',
    ],
  }),
  ruby: keywordLang({
    lineComment: '#',
    blockComment: ['=begin', '=end'],
    keywords: [
      'alias','and','begin','break','case','class','def','defined?','do','else','elsif','end','ensure','false','for','if','in','module','next','nil','not','or','redo','rescue','retry','return','self','super','then','true','undef','unless','until','when','while','yield','BEGIN','END','__FILE__','__LINE__','__dir__','require','require_relative','load','include','extend','prepend','attr_accessor','attr_reader','attr_writer','public','protected','private','module_function','refine','using',
    ],
    types: [
      'Object','BasicObject','Kernel','NilClass','TrueClass','FalseClass','String','Symbol','Integer','Float','Numeric','Bignum','Fixnum','Rational','Complex','Array','Hash','Set','SortedSet','Range','Regexp','MatchData','Struct','OpenStruct','Enumerable','Comparable','IO','File','Dir','Tempfile','Pathname','Time','Date','DateTime','Exception','StandardError','ArgumentError','TypeError','NameError','NoMethodError','RuntimeError','LoadError','SyntaxError','IndexError','RangeError','ZeroDivisionError','Thread','Mutex','ConditionVariable','Queue','SizedQueue','Fiber','Class','Module','Method','UnboundMethod','Proc','Binding','Enumerator','Lazy','TracePoint','GC','ObjectSpace','Random','SecureRandom','JSON','YAML','CSV','ERB','Logger','URI','Net::HTTP','Socket','Addrinfo','IPAddr','OpenSSL::SSL',
    ],
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

/** Loop gutter marker spec shape (attached to Decoration.spec) */
interface LoopMarkerSpec {
  label: string;
  depth: number;
  type: LoopType;
}

/** Loop gutter badge — small colored pill in the line-number gutter with O(…). */
class LoopGutterBadge extends GutterMarker {
  constructor(readonly label: string, readonly depth: number) {
    super();
  }
  toDOM(): Node {
    const span = document.createElement('span');
    span.title = `Complexity contributor: ${this.label} (nesting level ${this.depth + 1})`;
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
  create() {
    return Decoration.none;
  },
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
    decorations.between(0, view.state.doc.length, (f: number, _t: number, d: Decoration) => {
      const spec = d?.spec?.loopMarkerSpec as LoopMarkerSpec | undefined;
      if (!spec) return;
      try {
        const line = view.state.doc.lineAt(f);
        if (!addedLines.has(line.number)) {
          addedLines.add(line.number);
          builder.add(line.from, line.from, new LoopGutterBadge(spec.label, spec.depth));
        }
      } catch {
        /* ignore */
      }
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
function applyLoopMarkers(view: EditorView | null, loops: LoopInfo[]) {
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
        loopMarkerSpec: { label, depth: loop.nestingDepth, type: loop.type } satisfies LoopMarkerSpec as unknown as Record<string, unknown>,
        inclusive: true,
        inclusiveStart: true,
        inclusiveEnd: false,
      });
      const endPos = Math.min(line.to + 1, doc.length);
      builder.add(line.from, endPos, deco);
    }
    view.dispatch({ effects: setLoopMarkersEffect.of(builder.finish()) });
  } catch {
    try {
      view.dispatch({ effects: setLoopMarkersEffect.of(Decoration.none) });
    } catch {
      /* ignore */
    }
  }
}

const DEFAULT_SAMPLE_CODE = '';

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
    if (!line) {
      result.push('');
      continue;
    }
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
  const { recordAnalysisHistory } = useAuth();
  const { addToast } = useToast();

  const [code, setCode] = useState<string>(DEFAULT_SAMPLE_CODE);
  const [language, setLanguage] = useState<Language>('javascript');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [autoDetected, setAutoDetected] = useState<Language | null>(null);
  const [sampleGalleryOpen, setSampleGalleryOpen] = useState<boolean>(false);

  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const langCompartmentRef = useRef<Compartment>(new Compartment());
  const isSyncingRef = useRef<boolean>(false);
  const languageRef = useRef<Language>(language);
  const autoDetectDisabledUntilRef = useRef<number>(0);

  // Keep languageRef up to date so init-time closures still see the latest language
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

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
      addToast('info', `Auto-detected ${LANG_META[detected].label} — syntax grammar switched`);
    } catch {
      /* ignore */
    }
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
            const originatedFromPasteOrCut = update.transactions.some(
              (tr) =>
                tr.isUserEvent('input.paste') ||
                tr.isUserEvent('delete.cut') ||
                tr.isUserEvent('input.drop')
            );
            if (originatedFromPasteOrCut) {
              tryAutoDetect(
                next,
                languageRef.current,
                (d) => {
                  setLanguage(d);
                  languageRef.current = d;
                },
                setAutoDetected
              );
            } else if (next.length > 80 && update.transactions.some((tr) => tr.isUserEvent('input'))) {
              tryAutoDetect(
                next,
                languageRef.current,
                (d) => {
                  setLanguage(d);
                  languageRef.current = d;
                },
                setAutoDetected
              );
            }
          }
        }),
        EditorView.domEventHandlers({
          paste: (_ev, view) => {
            const next = view.state.doc.toString();
            tryAutoDetect(
              next,
              languageRef.current,
              (d) => {
                setLanguage(d);
                languageRef.current = d;
              },
              setAutoDetected
            );
            return false;
          },
          cut: (_ev, view) => {
            setTimeout(() => {
              try {
                tryAutoDetect(
                  view.state.doc.toString(),
                  languageRef.current,
                  (d) => {
                    setLanguage(d);
                    languageRef.current = d;
                  },
                  setAutoDetected
                );
              } catch {
                /* ignore */
              }
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

    if (cancelled) {
      view.destroy();
      return;
    }
    editorViewRef.current = view;

    return () => {
      cancelled = true;
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount once

  // Update language extension dynamically when language changes
  useEffect(() => {
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        effects: langCompartmentRef.current.reconfigure(LANG_EXTENSIONS[language]),
      });
    }
  }, [language]);

  // Handle URL query parameters (e.g. from Dashboard, Learn page, or Landing page)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const executeAnalysis = async (codeToAnalyze: string, langToAnalyze: Language) => {
    if (!codeToAnalyze.trim()) {
      addToast('warning', 'Please enter some code before starting the analysis.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = analyzeCode(codeToAnalyze, langToAnalyze);
      setResult(res);

      // Apply gutter markers + inline underlines for complexity-contributing loops
      applyLoopMarkers(editorViewRef.current, res.loops ?? []);

      // Record to user's analysis history
      const summary = codeToAnalyze.trim().split('\n')[0].slice(0, 45) || 'Code snippet';
      const spaceStr =
        typeof res.spaceComplexity === 'string'
          ? res.spaceComplexity
          : res.spaceComplexity?.class || 'O(1)';
      recordAnalysisHistory({
        summary,
        language: langToAnalyze as 'javascript' | 'typescript' | 'python' | 'java' | 'c' | 'cpp' | 'csharp' | 'go' | 'rust' | 'swift' | 'kotlin' | 'php' | 'ruby',
        timeComplexity: res.timeComplexity,
        spaceComplexity: spaceStr,
        code: codeToAnalyze,
      });

      if (res.error) {
        addToast(
          res.isPartialAnalysis ? 'warning' : 'danger',
          res.error
        );
      } else {
        addToast('success', `Analysis complete: ${res.timeComplexity} Time Complexity detected.`);
      }
    } catch {
      addToast(
        'danger',
        "We couldn't analyze this code. Make sure you've entered a valid code snippet and selected the correct programming language."
      );
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

  const handleSelectSample = (sample: Sample) => {
    setCode(sample.code);
    const targetLang = (sample.language === 'cpp' ? 'cpp' : sample.language) as Language;
    setLanguage(targetLang);
    languageRef.current = targetLang;
    setAutoDetected(null);
    autoDetectDisabledUntilRef.current = Date.now() + 2000;

    if (editorViewRef.current) {
      isSyncingRef.current = true;
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: sample.code,
        },
      });
      isSyncingRef.current = false;
    }
    executeAnalysis(sample.code, targetLang);
    addToast('success', `Loaded sample: ${sample.title} (${sample.complexity})`);
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
      {/* Onboarding Tour Component */}
      <OnboardingTour />

      {/* Preset Algorithm Samples Modal */}
      <SampleGallery
        open={sampleGalleryOpen}
        onClose={() => setSampleGalleryOpen(false)}
        onSelect={handleSelectSample}
      />

      <div className="max-w-7xl mx-auto space-y-4">
        {/* TOP CONTROL BAR: Language Selection + Browse Examples + Analyze Action */}
        <div className="p-3.5 sm:p-5 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 md:gap-4">
          <div className="space-y-1">
            <h1 className="text-base sm:text-xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <span>⚡</span> Code Complexity Analyzer
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
              Complexity analyzes the structure of your code without executing it. Auto-detects 13 programming languages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="language-select" className="text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:inline">
                Language:
              </label>
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
                title="Select Programming Language"
              >
                {LANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Browse Examples Button */}
            <Button
              id="sample-gallery-step"
              variant="secondary"
              size="md"
              onClick={() => setSampleGalleryOpen(true)}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5"
              title="Open preset algorithm gallery"
            >
              <span>💡</span>
              <span className="hidden sm:inline">Browse</span> Examples
            </Button>

            {/* Analyze Complexity Button */}
            <div className="flex items-center gap-2">
              <Button
                id="analyze-button-step"
                variant="primary"
                size="md"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !code.trim()}
                className="px-5 sm:px-6 py-2.5 font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                title="Run static complexity analysis (⌘/Ctrl + Enter)"
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
                    <span>⚡</span>
                    <span>Analyze Complexity</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* MAIN WORKSPACE GRID: Left (Code Editor) + Right (Complexity Results & Reasoning) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: CODE EDITOR INPUT AREA */}
          <div className="lg:col-span-6 lg:h-[calc(100vh-5rem)] lg:sticky lg:top-20 overflow-visible" id="code-editor-step">
            <div className="rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px] lg:h-[calc(100vh-6rem)]">
              {/* EDITOR HEADER: Title + Filename + Auto-Detected badge ↔ Utility buttons */}
              <div className="px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Code Editor
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700/60">
                    <span className="text-xs">{LANG_META[language].icon}</span>
                    <span className="text-[11px] font-mono font-semibold text-gray-700 dark:text-gray-300">
                      {FILE_NAME[language]}
                    </span>
                  </div>
                  {autoDetected && (
                    <Tooltip
                      content={`Switched grammar to ${LANG_META[autoDetected].label} automatically. Use the language selector to override.`}
                      position="bottom"
                    >
                      <Badge variant="primary" size="xs" className="!text-[10px] !px-2 !py-0.5 tracking-wide uppercase">
                        ✨ Auto: {LANG_META[autoDetected].label}
                      </Badge>
                    </Tooltip>
                  )}
                </div>

                {/* Editor Utility Actions */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <Tooltip content="Copy code to clipboard" position="bottom">
                    <button
                      type="button"
                      onClick={() => copyCode(code, `${LANG_META[language].label} code`)}
                      disabled={!code.trim()}
                      aria-label="Copy Code"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      📋<span className="hidden sm:inline">Copy Code</span>
                    </button>
                  </Tooltip>
                  <Tooltip content="Auto-format code" position="bottom">
                    <button
                      type="button"
                      onClick={handleFormatCode}
                      disabled={!code.trim()}
                      aria-label="Format Code"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ✨<span className="hidden sm:inline">Format Code</span>
                    </button>
                  </Tooltip>
                  <Tooltip content="Clear code and results" position="bottom">
                    <button
                      type="button"
                      onClick={handleClearCode}
                      disabled={!code.trim() && !result && !autoDetected}
                      aria-label="Clear Editor"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      🗑️<span className="hidden sm:inline">Clear Editor</span>
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* HELPFUL INSTRUCTION BANNER (Beginner Friendly) */}
              {!code.trim() && (
                <div className="px-4 py-2.5 bg-indigo-50/60 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-3">
                  <p className="leading-tight">
                    💡 <strong className="font-semibold">Paste or write your code</strong> here. Select a language or let the application detect it automatically.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSampleGalleryOpen(true)}
                    className="font-bold underline text-indigo-600 dark:text-indigo-400 hover:opacity-80 shrink-0 text-xs"
                  >
                    Load Sample Code →
                  </button>
                </div>
              )}

              {/* CodeMirror Mounting Container */}
              <div
                ref={editorContainerRef}
                className="flex-1 overflow-auto font-mono text-sm bg-white dark:bg-[#0d121f]"
              />

              {/* Editor Footer Status Bar */}
              <div className="px-4 sm:px-5 py-2.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
                <div className="flex items-center gap-3 sm:gap-4">
                  <span>{code.split('\n').length} lines</span>
                  <span>{code.length} chars</span>
                  {result && (result.loops?.length ?? 0) > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      ⚠ {(result.loops?.length ?? 0)} loop{(result.loops?.length ?? 0) === 1 ? '' : 's'} highlighted
                    </span>
                  )}
                </div>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Static Evaluator Ready
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TIME & SPACE COMPLEXITY RESULTS & EDUCATIONAL REASONING */}
          <div className="lg:col-span-6 space-y-4" id="results-step">
            {result ? (
              <div className="space-y-4">
                {/* HERO RESULTS: Time Complexity & Space Complexity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* TIME COMPLEXITY CARD */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Time Complexity
                        </span>
                        <Tooltip
                          content="Describes how the amount of work grows as the input size increases."
                          position="top"
                        >
                          <span className="cursor-help text-xs text-gray-400">ℹ️</span>
                        </Tooltip>
                      </div>
                      <Tooltip
                        content={`Confidence: ${Math.round(result.timeConfidence)}% — Higher confidence means the analyzer found clearer patterns in your code. Lower confidence means the result may depend on code behavior that cannot be determined reliably through static analysis.`}
                        position="top"
                      >
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 cursor-help bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {Math.round(result.timeConfidence)}% Confidence
                        </span>
                      </Tooltip>
                    </div>
                    <span
                      className={`inline-block px-4 py-2 rounded-2xl text-2xl sm:text-3xl font-black font-mono border ${getComplexityBadgeColor(
                        result.timeComplexity
                      )}`}
                    >
                      {result.timeComplexity}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Describes how the amount of work grows as the input size increases.
                    </p>
                  </div>

                  {/* SPACE COMPLEXITY CARD */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Space Complexity
                        </span>
                        <Tooltip
                          content="Describes how much additional memory the algorithm needs as the input size increases."
                          position="top"
                        >
                          <span className="cursor-help text-xs text-gray-400">ℹ️</span>
                        </Tooltip>
                      </div>
                      <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        Auxiliary Memory
                      </span>
                    </div>
                    <span
                      className={`inline-block px-4 py-2 rounded-2xl text-2xl sm:text-3xl font-black font-mono border ${getComplexityBadgeColor(
                        spaceComplexityDisplay
                      )}`}
                    >
                      {spaceComplexityDisplay}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Describes how much additional memory the algorithm needs as the input size increases.
                    </p>
                  </div>
                </div>

                {/* CONFIDENCE EXPLANATION BANNER */}
                <div className="px-4 py-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
                  <div className="flex items-center justify-between gap-2 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span>📊</span> Understanding Confidence ({Math.round(result.timeConfidence)}%)
                    </span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400">Heuristic Estimate</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
                    Higher confidence means the analyzer found clearer patterns in your code. Lower confidence means the result may depend on code behavior that cannot be determined reliably through static analysis.
                  </p>
                </div>

                {/* REASONING SECTION: WHY DID I GET THIS COMPLEXITY? */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>💡</span> Why did I get this complexity?
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        A beginner-friendly breakdown of why this Big-O bound was detected.
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

                  {/* Plain-English summary bullets */}
                  {result.detailed?.highLevelSummary && (
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0c101c] border border-gray-200/80 dark:border-gray-800 space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-start gap-2.5 text-gray-800 dark:text-gray-200 leading-relaxed">
                        <span className="text-indigo-500 font-bold mt-0.5">•</span>
                        <span>{result.detailed.highLevelSummary}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-800/80">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          Estimated Time Complexity:
                        </span>
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {result.timeComplexity}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 ml-2">
                          Estimated Space Complexity:
                        </span>
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          {spaceComplexityDisplay}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Loop Table (if any) */}
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
                              <span className="text-[10px] text-gray-400">
                                (Depth {loop.nestingDepth + 1})
                              </span>
                            </div>
                            <span
                              className={`font-mono font-black px-2.5 py-0.5 rounded-md text-[11px] ${
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

                  {/* Key stdlib operations */}
                  {result.stdlibCalls && result.stdlibCalls.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Notable built-in operations
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {result.stdlibCalls.slice(0, 8).map((op, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800/70 border border-gray-200/70 dark:border-gray-700/60 text-[11px] font-mono text-gray-700 dark:text-gray-200"
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
                    <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/25 border border-cyan-200/60 dark:border-cyan-800/40 text-xs text-cyan-900 dark:text-cyan-200 space-y-1">
                      <p className="font-bold">🌿 Recursive Call Pattern Detected</p>
                      <p className="text-cyan-800/90 dark:text-cyan-300/90 leading-relaxed">
                        Each recursive call allocates a stack frame. Memory on the call stack scales with the depth of recursion.
                      </p>
                    </div>
                  )}
                </div>

                {/* HOW WE CALCULATED IT: STEP-BY-STEP MATHEMATICAL DERIVATION */}
                {result.detailed?.complexityDerivation &&
                  result.detailed.complexityDerivation.length > 0 && (
                    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm">
                              📐
                            </span>
                            How We Calculated It
                          </h2>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Step-by-step mathematical reasoning that led to the <span className="font-mono font-bold">Big-O</span> verdict.
                          </p>
                        </div>
                        <Badge variant="primary" size="sm">
                          Worst: {result.timeComplexity}
                        </Badge>
                      </div>

                      {/* 1. Step-by-step execution */}
                      {result.detailed.stepByStepExecution &&
                        result.detailed.stepByStepExecution.length > 0 && (
                          <div className="space-y-2.5">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              1. How the algorithm executes
                            </h3>
                            <ol className="space-y-2">
                              {result.detailed.stepByStepExecution.map((s, i) => (
                                <li
                                  key={i}
                                  className="flex gap-3 p-3 rounded-2xl bg-gray-50/60 dark:bg-[#0c101c]/60 border border-gray-100 dark:border-gray-800/50"
                                >
                                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                    {s.step}
                                  </span>
                                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
                                    {s.description}
                                  </p>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                      {/* 2. Complexity Derivation Steps */}
                      <div className="space-y-2.5">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          2. Complexity derivation
                        </h3>
                        <ol className="space-y-2.5">
                          {result.detailed.complexityDerivation.map((s, i) => (
                            <li
                              key={i}
                              className="flex gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-cyan-50/40 dark:from-indigo-950/25 dark:to-cyan-950/15 border border-indigo-100 dark:border-indigo-900/30"
                            >
                              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-700/60 font-black text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                {s.step}
                              </span>
                              <div className="flex-1 space-y-1.5">
                                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                  {s.description}
                                </p>
                                {s.math && (
                                  <code className="inline-block px-2.5 py-1 rounded-lg bg-white dark:bg-black/40 border border-indigo-200/60 dark:border-indigo-800/40 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-sm">
                                    {s.math}
                                  </code>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Time & Space Breakdown Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                        <div className="p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-red-500/80 mb-1">Worst Case</p>
                          <p className="font-mono font-black text-red-700 dark:text-red-300 text-sm sm:text-base">
                            {result.detailed.timeComplexity?.worst ?? result.timeComplexity}
                          </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80 mb-1">Average Case</p>
                          <p className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm sm:text-base">
                            {result.detailed.timeComplexity?.average ?? result.timeComplexity}
                          </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500/80 mb-1">Best Case</p>
                          <p className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">
                            {result.detailed.timeComplexity?.best ?? 'O(1)'}
                          </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-500/80 mb-1">Auxiliary Space</p>
                          <p className="font-mono font-black text-cyan-700 dark:text-cyan-300 text-sm sm:text-base">
                            {result.detailed.spaceComplexity?.auxiliary ?? spaceComplexityDisplay}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* OPTIMIZATION SUGGESTIONS */}
                {result.detailed?.possibleOptimizations &&
                  result.detailed.possibleOptimizations.length > 0 && (
                    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-emerald-950/25 dark:via-[#111726] dark:to-cyan-950/25 border border-emerald-200/70 dark:border-emerald-800/30 shadow-sm space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xl shadow-md shadow-emerald-500/30 flex-shrink-0">
                            🚀
                          </div>
                          <div>
                            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                              Optimization Suggestions
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Practical ideas to reduce operations and improve your Big-O bounds.
                            </p>
                          </div>
                        </div>
                        <Badge variant="success" size="sm">
                          {result.detailed.possibleOptimizations.length} idea{result.detailed.possibleOptimizations.length > 1 ? 's' : ''}
                        </Badge>
                      </div>

                      <ol className="space-y-2.5">
                        {result.detailed.possibleOptimizations.map((opt, i) => (
                          <li
                            key={i}
                            className="flex gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-black/35 border border-gray-100 dark:border-gray-800/60 hover:border-emerald-400/50 dark:hover:border-emerald-600/40 transition-all"
                          >
                            <span className="flex-shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                              {i + 1}
                            </span>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
                              {opt}
                            </p>
                          </li>
                        ))}
                      </ol>

                      {/* Detected Pattern Tags */}
                      {result.detailed.algorithmUsed && result.detailed.algorithmUsed.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-1.5">
                            Detected patterns:
                          </span>
                          {result.detailed.algorithmUsed.map((algo, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-bold"
                            >
                              🧩 {algo}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                {/* PERFORMANCE NOTES */}
                {result.detailed?.performanceNotes && result.detailed.performanceNotes.length > 0 && (
                  <div className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm">
                        ⚠️
                      </span>
                      Performance & Scaling Notes
                    </h3>
                    <ul className="space-y-2">
                      {result.detailed.performanceNotes.map((note, i) => (
                        <li
                          key={i}
                          className="flex gap-2.5 p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/15 border border-amber-100/60 dark:border-amber-900/30"
                        >
                          <span className="text-amber-500 font-bold mt-0.5">▸</span>
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{note}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* MEMORY USAGE BREAKDOWN */}
                {result.detailed?.memoryUsage && result.detailed.memoryUsage.length > 0 && (
                  <div className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-sm">
                        💾
                      </span>
                      Auxiliary Memory Breakdown
                    </h3>
                    <ul className="space-y-2">
                      {result.detailed.memoryUsage.map((m, i) => (
                        <li
                          key={i}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                            m.affectsComplexity
                              ? 'bg-cyan-50/60 dark:bg-cyan-950/15 border-cyan-200/60 dark:border-cyan-800/40'
                              : 'bg-gray-50/60 dark:bg-[#0c101c]/60 border-gray-200/70 dark:border-gray-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-700/60 flex items-center justify-center text-base flex-shrink-0">
                              {m.type === 'Array'
                                ? '📦'
                                : m.type === 'HashMap'
                                ? '🗂️'
                                : m.type === 'HashSet'
                                ? '🧺'
                                : m.type === 'Stack' || m.type === 'RecursionStack'
                                ? '🥞'
                                : m.type === 'Queue'
                                ? '🚶'
                                : '🧱'}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{m.name}</p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{m.note}</p>
                            </div>
                          </div>
                          {m.affectsComplexity ? (
                            <Badge variant="warning" size="xs">Affects O</Badge>
                          ) : (
                            <Badge variant="success" size="xs">Constant</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CAVEATS & LIMITATIONS NOTICE */}
                <div className="p-5 rounded-3xl bg-gray-50 dark:bg-[#111726] border border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-sm">
                    <span>⚠️</span>
                    <h3>Caveats & Limitations</h3>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    This is an estimate based on static code patterns. Complex program behavior, unknown function implementations, dynamic values, or incomplete code may affect the result.
                  </p>
                  {(result.whatWouldChange?.length ?? 0) > 0 && (
                    <ul className="space-y-1.5 pt-1 border-t border-gray-200/60 dark:border-gray-800/80">
                      {result.whatWouldChange.map((item, idx) => (
                        <li key={idx} className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                          <span className="font-bold">•</span>
                          <span><strong>{item.factor}:</strong> {item.impact}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              /* EMPTY STATE: Welcoming & Beginner Friendly */
              <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-6 min-h-[500px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl shadow-sm border border-indigo-500/20">
                  ⚡
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    No analysis yet
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Paste your code into the editor and select <strong className="text-gray-800 dark:text-gray-200">Analyze Complexity</strong> to see your Time and Space Complexity.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleAnalyze}
                    disabled={!code.trim()}
                    className="font-bold shadow-md shadow-indigo-500/20"
                  >
                    <span>⚡ Analyze Complexity</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setSampleGalleryOpen(true)}
                    className="font-semibold text-xs sm:text-sm"
                  >
                    <span>💡 Browse Examples</span>
                  </Button>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 w-full max-w-sm">
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    🔒 100% Private Client-Side · 13 Supported Languages · No Execution
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyzer;
