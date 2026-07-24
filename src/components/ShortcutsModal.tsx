import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    keys: ['Cmd/Ctrl', 'Enter'],
    description: 'Analyze the current code',
  },
  {
    keys: ['Cmd/Ctrl', 'K'],
    description: 'Open the sample library',
  },
  {
    keys: ['?'],
    description: 'Open the shortcuts cheat sheet',
  },
  {
    keys: ['Esc'],
    description: 'Close any modal / tour',
  },
];

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <Card className="w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark mt-1">
                Work faster with these power-user tricks
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          <div className="space-y-3">
            {SHORTCUTS.map((shortcut, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/50 dark:bg-bg-tertiary-dark/50"
              >
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  {shortcut.description}
                </p>
                <div className="flex items-center gap-1.5">
                  {shortcut.keys.map((key, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-xs text-text-muted">+</span>}
                      <kbd className="px-2 py-1 rounded-md bg-bg-secondary dark:bg-bg-secondary-dark border border-text-muted/30 dark:border-text-muted-dark/30 text-xs font-mono font-medium text-text-primary dark:text-text-primary-dark shadow-subtle">
                        {key}
                      </kbd>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-text-muted dark:text-text-muted-dark text-center">
            Press <kbd className="mx-1 px-1.5 py-0.5 rounded bg-bg-tertiary/50 dark:bg-bg-tertiary-dark/50 border border-text-muted/20">?</kbd> any time to see this
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
