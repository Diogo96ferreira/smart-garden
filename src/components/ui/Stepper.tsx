'use client';
import { motion } from 'framer-motion';

type StepperProps = {
  /** O step atual (começa em 1) */
  currentStep: number;
  /** Quantos steps existem no total */
  totalSteps: number;
};

export function Stepper({ currentStep, totalSteps }: StepperProps) {
  return (
    <div className="mt-2 flex items-center justify-center gap-3">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;

        return (
          <motion.div
            key={step}
            animate={{
              scale: isActive ? 1.3 : 1,
              opacity: isActive ? 1 : 0.4,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              isActive ? 'scale-105 bg-green-500 shadow-md shadow-green-300' : 'bg-gray-300'
            }`}
          />
        );
      })}
    </div>
  );
}
