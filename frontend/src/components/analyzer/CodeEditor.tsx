import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import {
  EditorState,
  Compartment,
  type Extension,
} from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import type { ViewUpdate } from '@codemirror/view';
import { Button } from '@/components/ui/Button';
import type { SupportedLanguage } from '@/lib/analyzer';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

/** Lightweight StreamLanguage fallback for languages without official CM6 package */
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
      if (stream.match(lineCm)) {
        stream.pos = stream.string.length;
        return 'comment';
      }
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
      if (stream.match(/^"(?:[^"\\]|\\.)*"/) || stream.match(/^'(?:[^'\\]|\\.)*'/) || stream.match(/^`[^`]*`/)) {
        return 'string';
      }
      if (stream.match(/^\$\w+/)) return 'variableName';
      if (
        stream.match(/^0[xX][0-9a-fA-F][0-9a-fA-F_]*/) ||
        stream.match(/^\d+(?:_\d+)*(?:\.\d+(?:_\d+)*(?:[eE][+-]?\d+)?)?/)
      ) {
        return 'number';
      }
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
    keywords: ['abstract','as','async','await','base','bool','break','byte','case','catch','char','class','const','continue','decimal','default','delegate','do','double','else','enum','event','explicit','extern','false','finally','fixed','float','for','foreach','goto','if','implicit','in','int','interface','internal','is','lock','long','namespace','new','null','object','operator','out','override','params','private','protected','public','readonly','ref','return','sbyte','sealed','short','sizeof','stackalloc','static','string','struct','switch','this','throw','true','try','typeof','uint','ulong','unchecked','unsafe','ushort','using','virtual','void','volatile','while'],
    types: ['Task','List','Dictionary','IEnumerable','ICollection','HashSet','Action','Func'],
  }),
  go: keywordLang({
    keywords: ['break','case','chan','const','continue','default','defer','else','fallthrough','for','func','go','goto','if','import','interface','map','package','range','return','select','struct','switch','type','var'],
    types: ['int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64','float32','float64','string','bool','byte','rune','error','any'],
  }),
  rust: keywordLang({
    keywords: ['as','async','await','break','const','continue','crate','dyn','else','enum','extern','false','fn','for','if','impl','in','let','loop','match','mod','move','mut','pub','ref','return','self','Self','static','struct','super','trait','true','type','union','unsafe','use','where','while'],
    types: ['i8','i16','i32','i64','i128','isize','u8','u16','u32','u64','u128','usize','f32','f64','bool','char','str','String','Vec','Option','Result','Box','Rc','Arc'],
  }),
  swift: keywordLang({
    keywords: ['associatedtype','class','deinit','enum','extension','fileprivate','func','import','init','inout','internal','let','open','operator','private','protocol','public','rethrows','static','struct','subscript','typealias','var','break','case','continue','default','defer','do','else','fallthrough','for','guard','if','in','repeat','return','switch','where','while','as','catch','false','is','nil','self','Self','super','throw','throws','true','try'],
    types: ['Int','Double','Float','String','Bool','Array','Dictionary','Set','Optional'],
  }),
  kotlin: keywordLang({
    keywords: ['as','break','class','continue','do','else','false','for','fun','if','in','interface','is','null','object','package','return','super','this','throw','true','try','typealias','val','var','when','while','by','catch','constructor','delegate','dynamic','field','file','finally','get','import','init','param','property','receiver','set','setparam','where','actual','abstract','annotation','companion','const','crossinline','data','enum','expect','external','final','infix','inline','inner','internal','lateinit','noinline','open','operator','out','override','private','protected','public','reified','sealed','suspend','tailrec','vararg'],
    types: ['Int','Long','Short','Byte','Float','Double','Boolean','Char','String','Array','List','Map','Set'],
  }),
  php: keywordLang({
    lineComment: '//',
    blockComment: ['/*', '*/'],
    keywords: ['__halt_compiler','abstract','and','array','as','break','callable','case','catch','class','clone','const','continue','declare','default','die','do','echo','else','elseif','empty','enddeclare','endfor','endforeach','endif','endswitch','endwhile','eval','exit','extends','final','finally','fn','for','foreach','function','global','goto','if','implements','include','include_once','instanceof','insteadof','interface','isset','list','match','namespace','new','or','print','private','protected','public','readonly','require','require_once','return','static','switch','throw','trait','try','unset','use','var','while','xor','yield'],
    types: ['int','float','string','bool','array','object','iterable','mixed','void','never','null'],
  }),
  ruby: keywordLang({
    lineComment: '#',
    keywords: ['alias','and','BEGIN','begin','break','case','class','def','defined?','do','else','elsif','END','end','ensure','false','for','if','in','module','next','nil','not','or','redo','rescue','retry','return','self','super','then','true','undef','unless','until','when','while','yield'],
    types: ['Array','Hash','String','Integer','Float','Symbol','TrueClass','FalseClass','NilClass'],
  }),
};

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  go: 'Go',
  rust: 'Rust',
  swift: 'Swift',
  kotlin: 'Kotlin',
  php: 'PHP',
  ruby: 'Ruby',
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language,
  onLanguageChange,
  onAnalyze,
  isAnalyzing,
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const languageCompartmentRef = useRef<Compartment>(new Compartment());
  const initialCodeRef = useRef(code);
  const initialLanguageRef = useRef(language);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Initialize CodeMirror instance
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const langExt = LANG_EXTENSIONS[initialLanguageRef.current] || javascript();

    const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const val = update.state.doc.toString();
        onChangeRef.current(val);
      }
    });

    const customTheme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
        backgroundColor: '#0d121f',
        color: '#f3f4f6',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
      },
      '.cm-content': {
        padding: '16px 0',
      },
      '.cm-line': {
        padding: '0 16px',
        lineHeight: '1.6',
      },
      '.cm-gutters': {
        backgroundColor: '#090d16',
        color: '#4b5563',
        borderRight: '1px solid #1f293d',
      },
      '.cm-activeLine': {
        backgroundColor: '#161f36',
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#1e293b',
        color: '#94a3b8',
      },
    });

    const state = EditorState.create({
      doc: initialCodeRef.current,
      extensions: [
        basicSetup,
        oneDark,
        customTheme,
        languageCompartmentRef.current.of(langExt),
        updateListener,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, []);

  // Sync external code updates into editor
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (code !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: code },
      });
    }
  }, [code]);

  // Sync language changes into editor
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    const ext = LANG_EXTENSIONS[language] || javascript();
    view.dispatch({
      effects: languageCompartmentRef.current.reconfigure(ext),
    });
  }, [language]);

  return (
    <div className="flex flex-col h-full rounded-3xl bg-[#0d121f] border border-gray-800 shadow-xl overflow-hidden">
      {/* Clean Minimal Toolbar: Language Selector & Analyze Button */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#090d16] border-b border-gray-800 text-xs">
        {/* Language Selector */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            aria-label="Programming language"
            className="bg-gray-800/90 hover:bg-gray-750 text-gray-100 font-semibold rounded-xl px-3.5 py-1.5 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer text-xs"
          >
            {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
              <option key={key} value={key} className="bg-gray-900 text-white">
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Analyze Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onAnalyze}
          disabled={isAnalyzing || !code.trim()}
          className="font-bold px-4 py-1.5 shadow-md shadow-indigo-500/20"
          aria-label="Analyze complexity"
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            <span>⚡ Analyze</span>
          )}
        </Button>
      </div>

      {/* CodeMirror Surface */}
      <div
        ref={editorContainerRef}
        className="flex-1 h-full min-h-[460px] overflow-auto text-left font-mono text-sm relative"
      />

      {/* Footer Info Strip */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#090d16] border-t border-gray-800/80 text-[11px] text-gray-400">
        <div className="flex items-center gap-3">
          <span>{code.split('\n').length} lines</span>
          <span>{code.length} characters</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Private Client Analysis</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
