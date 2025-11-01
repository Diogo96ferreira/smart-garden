'use client';

import { motion } from 'framer-motion';

type StepperProps = {
  currentStep: number;
  totalSteps: number;
};

export function Stepper({ currentStep, totalSteps }: StepperProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm items-center gap-2 px-6 py-4">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step <= currentStep;

        return (
          <motion.span
            key={step}
            layout
            initial={false}
            animate={{
              backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-surface-strong)',
              flex: isActive ? 1.2 : 1,
              opacity: isActive ? 1 : 0.6,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-1.5 rounded-full"
          />
        );
      })}
    </div>
  );
}
