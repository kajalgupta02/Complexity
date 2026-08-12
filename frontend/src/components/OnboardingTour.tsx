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
    title: 'Paste or type your code',
    description: 'Drop your algorithm here and pick your language above. We support JS, TS, Python, Java, and C++ out of the box.',
    selector: 'code-editor-step',
    placement: 'right',
  },
  {
    id: 2,
    title: 'Analyze with one click',
    description: 'Hit this button or press ⌘/Ctrl + Enter. The engine strips comments, detects loops, and maps recursion automatically.',
    selector: 'analyze-button-step',
    placement: 'top',
  },
  {
    id: 3,
    title: 'Read the 13-section breakdown',
    description: 'From Big-O class to step-by-step complexity derivation — every verdict comes with a full educational walkthrough.',
    selector: 'reasoning-step',
    placement: 'left',
  },
  {
    id: 4,
    title: 'Browse the sample library',
    description: 'Press ⌘/Ctrl + K anytime to open a searchable gallery of O(1), O(log n), O(n²), O(n³) and O(2ⁿ) examples across 4 languages.',
    selector: 'library-step',
    placement: 'bottom',
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
    placement === 'top' ? 'after:top-full after:mx-auto after:left-1/2 after:-translate-x-1/2 after:border-t-bg-secondary-dark/0 dark:after:border-t-bg-secondary-dark'
    : placement === 'bottom' ? 'after:bottom-full after:mx-auto after:left-1/2 after:-translate-x-1/2 after:border-b-bg-secondary-dark/0 dark:after:border-b-bg-secondary-dark'
    : placement === 'left' ? 'after:left-full after:top-1/2 after:-translate-y-1/2 after:border-l-bg-secondary-dark/0 dark:after:border-l-bg-secondary-dark'
    : 'after:right-full after:top-1/2 after:-translate-y-1/2 after:border-r-bg-secondary-dark/0 dark:after:border-r-bg-secondary-dark';

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
          const w = 400, h = 200;
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
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
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
            className="absolute rounded-2xl pointer-events-none animate-pop-in"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow:
                '0 0 0 2px rgba(102,56,255,0.9), 0 0 0 4px rgba(0,228,255,0.6), 0 0 40px rgba(102,56,255,0.5), inset 0 0 20px rgba(102,56,255,0.2)',
            }}
          />
        </>
      )}

      <div
        className="absolute pointer-events-auto animate-bounce-in"
        style={{
          top: cardPosition.top,
          left: cardPosition.left,
          width: CARD_WIDTH,
          maxWidth: 'calc(100vw - 48px)',
        }}
      >
        <div
          className={`relative bg-bg-secondary dark:bg-bg-secondary-dark border border-accent-500/40 rounded-2xl p-5 shadow-glow before:content-[''] before:absolute before:w-0 before:h-0 before:border-[10px] before:border-transparent after:content-[''] after:absolute after:w-0 after:h-0 after:border-[8px] after:border-transparent ${cardPosition.arrow}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-highlight-400 flex items-center justify-center text-white font-bold text-sm shadow-subtle animate-pop-in">
                {step.id}
              </span>
              <div className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-widest">
                Step {currentStep + 1} of {STEPS.length}
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted dark:text-text-muted-dark hover:text-text-primary dark:hover:text-text-primary-dark hover:bg-bg-tertiary dark:hover:bg-bg-tertiary-dark transition-colors"
              aria-label="Dismiss tour"
            >
              ✕
            </button>
          </div>

          <h3 className="text-lg font-black text-text-primary dark:text-text-primary-dark mb-1.5 leading-tight">
            {step.title}
          </h3>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark leading-relaxed mb-4">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={[
                    'h-1.5 rounded-full transition-all',
                    idx === currentStep
                      ? 'w-6 bg-gradient-to-r from-accent-500 to-highlight-400 shadow-subtle'
                      : idx < currentStep
                      ? 'w-2.5 bg-accent-500/60'
                      : 'w-2.5 bg-text-muted/30 dark:bg-text-muted-dark/30',
                  ].join(' ')}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" size="sm" onClick={back}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={next} className="animate-glow-pulse">
                {currentStep === STEPS.length - 1 ? "Let's go 🚀" : 'Next →'}
              </Button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="mt-4 w-full text-center text-[11px] text-text-muted dark:text-text-muted-dark hover:text-text-tertiary dark:hover:text-text-tertiary-dark transition-colors py-1 rounded-md hover:bg-bg-tertiary/40 dark:hover:bg-bg-tertiary-dark/40"
          >
            Skip tour — I know what I'm doing
          </button>
        </div>
      </div>
    </div>
  );
}
