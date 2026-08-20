import { Button } from '@/components/ui/Button';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    keys: ['Cmd/Ctrl', 'Enter'],
    description: 'Analyze Complexity of current code',
  },
  {
    keys: ['?'],
    description: 'Open this keyboard shortcuts cheat sheet',
  },
  {
    keys: ['Esc'],
    description: 'Close any active modal or sample dialog',
  },
];

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Quick keyboard actions for fast algorithmic analysis.
            </p>
          </div>
          <Button variant="ghost" size="xs" onClick={onClose} className="rounded-xl font-bold">
            ✕
          </Button>
        </div>

        <div className="space-y-2.5">
          {SHORTCUTS.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#0c101c] border border-gray-100 dark:border-gray-800/80"
            >
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {shortcut.description}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                {shortcut.keys.map((key, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-xs text-gray-400 font-bold">+</span>}
                    <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-mono font-bold text-gray-800 dark:text-gray-200 shadow-sm">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center pt-1">
          Tip: Press <kbd className="mx-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-[10px]">⌘/Ctrl + Enter</kbd> while typing in the editor to re-analyze instantly.
        </p>
      </div>
    </div>
  );
}
