import { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface TourStep {
  id: number;
  title: string;
  description: string;
  selector: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TourStep[] = [
  {
    id: 1,
    title: 'Paste or write your code',
    description:
      'Enter your algorithm in the editor. Complexity supports 13 languages including JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, Swift, Kotlin, PHP, and Ruby with automatic detection.',
    selector: 'code-editor-step',
    placement: 'right',
  },
  {
    id: 2,
    title: 'Analyze Complexity with one click',
    description:
      'Click "Analyze Complexity" or press ⌘/Ctrl + Enter. The static heuristic analyzer parses loops, nesting depth, recursion, and built-in methods without executing your code.',
    selector: 'analyze-button-step',
    placement: 'bottom',
  },
  {
    id: 3,
    title: 'Browse preset example algorithms',
    description:
      'Explore pre-built examples ranging from O(1) hash lookups and O(log n) binary search to O(n²) matrix operations and O(2ⁿ) recursive branching.',
    selector: 'sample-gallery-step',
    placement: 'bottom',
  },
  {
    id: 4,
    title: 'Explore results & mathematical derivations',
    description:
      'Review your Time and Space Complexity bounds, confidence ratings, step-by-step math explanations, loop diagnostics, and practical optimization suggestions.',
    selector: 'results-step',
    placement: 'left',
  },
];

const STORAGE_KEY = 'onboarding-completed-v1';
const SPOTLIGHT_PADDING = 8;
const CARD_OFFSET = 16;
const CARD_WIDTH = 360;

type Rect = { top: number; left: number; right: number; bottom: number; width: number; height: number };

function getCardPosition(elRect: Rect, placement: TourStep['placement']): { top: number; left: number; arrow: string } {
  const viewport = { w: window.innerWidth, h: window.innerHeight };
  let top = 0;
  let left = 0;
  const elCenterX = elRect.left + elRect.width / 2;
  const elCenterY = elRect.top + elRect.height / 2;

  switch (placement) {
    case 'top':
      left = elCenterX - CARD_WIDTH / 2;
      top = elRect.top - CARD_OFFSET - 220;
      break;
    case 'bottom':
      left = elCenterX - CARD_WIDTH / 2;
      top = elRect.bottom + CARD_OFFSET;
      break;
    case 'left':
      top = elCenterY - 110;
      left = elRect.left - CARD_OFFSET - CARD_WIDTH;
      break;
    case 'right':
    default:
      top = elCenterY - 110;
      left = elRect.right + CARD_OFFSET;
      break;
  }

  top = Math.max(24, Math.min(viewport.h - 260, top));
  left = Math.max(24, Math.min(viewport.w - CARD_WIDTH - 24, left));

  const arrowClass =
    placement === 'top'
      ? 'after:top-full after:mx-auto after:left-1/2 after:-translate-x-1/2'
      : placement === 'bottom'
      ? 'after:bottom-full after:mx-auto after:left-1/2 after:-translate-x-1/2'
      : placement === 'left'
      ? 'after:left-full after:top-1/2 after:-translate-y-1/2'
      : 'after:right-full after:top-1/2 after:-translate-y-1/2';

  return { top, left, arrow: arrowClass };
}

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const t = setTimeout(() => setIsVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const step = STEPS[currentStep];

  useLayoutEffect(() => {
    if (!isVisible || !step) return;
    const compute = () => {
      const el = document.getElementById(step.selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
      setTimeout(() => {
        const el2 = document.getElementById(step.selector);
        if (el2) {
          const r = el2.getBoundingClientRect();
          setTargetRect({
            top: Math.max(0, r.top - SPOTLIGHT_PADDING),
            left: Math.max(0, r.left - SPOTLIGHT_PADDING),
            right: Math.min(window.innerWidth, r.right + SPOTLIGHT_PADDING),
            bottom: Math.min(window.innerHeight, r.bottom + SPOTLIGHT_PADDING),
            width: r.width + SPOTLIGHT_PADDING * 2,
            height: r.height + SPOTLIGHT_PADDING * 2,
          });
        } else {
          const w = 400,
            h = 200;
          setTargetRect({
            top: (window.innerHeight - h) / 2,
            left: (window.innerWidth - w) / 2,
            right: (window.innerWidth + w) / 2,
            bottom: (window.innerHeight + h) / 2,
            width: w,
            height: h,
          });
        }
        setViewport({ w: window.innerWidth, h: window.innerHeight });
      }, 350);
    };
    compute();
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      compute();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [currentStep, isVisible, step]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* ignore */
    }
    setIsVisible(false);
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      dismiss();
    }
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const cardPosition = useMemo(() => {
    if (!targetRect) return { top: viewport.h / 2 - 120, left: viewport.w / 2 - CARD_WIDTH / 2, arrow: '' };
    return getCardPosition(targetRect, step?.placement ?? 'right');
  }, [targetRect, step, viewport]);

  if (!isVisible || !step) return null;

  const backdropTop = targetRect ? targetRect.top : 0;
  const backdropBottom = targetRect ? viewport.h - targetRect.bottom : 0;
  const backdropLeftWidth = targetRect ? targetRect.left : 0;
  const backdropRightWidth = targetRect ? viewport.w - targetRect.right : 0;
  const middleTop = targetRect ? targetRect.top : 0;
  const middleBottom = targetRect ? viewport.h - targetRect.bottom : 0;
  const middleHeight = viewport.h - middleTop - middleBottom;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" aria-modal="true">
      {targetRect && (
        <>
          <div
            className="absolute left-0 right-0 top-0 bg-black/60 backdrop-blur-[2px] animate-fade-in pointer-events-auto"
            style={{ height: backdropTop }}
            onClick={dismiss}
          />
          <div
            className="absolute left-0 right-0 bottom-0 bg-black/60 backdrop-blur-[2px] animate-fade-in pointer-events-auto"
            style={{ height: backdropBottom }}
            onClick={dismiss}
          />
          <div
            className="absolute left-0 bg-black/60 backdrop-blur-[2px] animate-fade-in pointer-events-auto"
            style={{ top: middleTop, height: middleHeight, width: backdropLeftWidth }}
            onClick={dismiss}
          />
          <div
            className="absolute right-0 bg-black/60 backdrop-blur-[2px] animate-fade-in pointer-events-auto"
            style={{ top: middleTop, height: middleHeight, width: backdropRightWidth }}
            onClick={dismiss}
          />
          <div
            className="absolute rounded-2xl pointer-events-none"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow:
                '0 0 0 2px rgba(99,102,241,0.9), 0 0 0 4px rgba(6,182,212,0.6), 0 0 40px rgba(99,102,241,0.4)',
            }}
          />
        </>
      )}

      <div
        className="absolute pointer-events-auto"
        style={{
          top: cardPosition.top,
          left: cardPosition.left,
          width: CARD_WIDTH,
          maxWidth: 'calc(100vw - 48px)',
        }}
      >
        <div className="relative bg-white dark:bg-[#111726] border border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {step.id}
              </span>
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Step {currentStep + 1} of {STEPS.length}
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-bold"
              aria-label="Dismiss tour"
            >
              ✕
            </button>
          </div>

          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
              {step.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-1.5">
              {step.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1.5">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={[
                    'h-1.5 rounded-full transition-all',
                    idx === currentStep
                      ? 'w-6 bg-gradient-to-r from-indigo-500 to-cyan-500'
                      : idx < currentStep
                      ? 'w-2 bg-indigo-500/60'
                      : 'w-2 bg-gray-200 dark:bg-gray-700',
                  ].join(' ')}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" size="xs" onClick={back} className="font-semibold text-xs">
                  Back
                </Button>
              )}
              <Button variant="primary" size="xs" onClick={next} className="font-bold text-xs shadow-sm">
                {currentStep === STEPS.length - 1 ? 'Got it! 🚀' : 'Next →'}
              </Button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="w-full text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-0.5"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}
