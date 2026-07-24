import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

const STEPS = [
  {
    id: 1,
    title: 'Write or paste your code',
    description: 'Drop your function in the editor, or use the language selector above.',
    selector: 'code-editor-step',
  },
  {
    id: 2,
    title: 'Hit Analyze This',
    description: 'Click the big button (or use Cmd/Ctrl + Enter) to run the analysis.',
    selector: 'analyze-button-step',
  },
  {
    id: 3,
    title: 'Read the reasoning chain',
    description: 'Each step explains exactly why we arrived at this complexity.',
    selector: 'reasoning-step',
  },
  {
    id: 4,
    title: 'Try the sample library',
    description: 'Press Cmd/Ctrl + K or click Library to explore complexity examples.',
    selector: 'library-step',
  },
];

const STORAGE_KEY = 'onboarding-completed-v1';

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const t = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
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
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* overlay with cut-out spotlight */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={dismiss}
      />

      {/* Floating card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto w-[90%] max-w-md animate-slide-up">
        <div className="bg-bg-secondary dark:bg-bg-secondary-dark border border-accent-500/40 rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-highlight-400 flex items-center justify-center text-white font-bold">
                {step.id}
              </span>
              <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark">
                {step.title}
              </h3>
            </div>
            <button
              onClick={dismiss}
              className="text-text-muted dark:text-text-muted-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-5 leading-relaxed">
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
                      ? 'w-6 bg-accent-500'
                      : idx < currentStep
                      ? 'w-2.5 bg-accent-500/60'
                      : 'w-2.5 bg-text-muted/40 dark:bg-text-muted-dark/40',
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
              <Button size="sm" onClick={next}>
                {currentStep === STEPS.length - 1 ? 'Got it!' : 'Next'}
              </Button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="mt-3 w-full text-center text-xs text-text-muted dark:text-text-muted-dark hover:text-text-tertiary dark:hover:text-text-tertiary-dark"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}
