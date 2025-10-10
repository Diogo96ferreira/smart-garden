'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stepper } from '@/components/ui/Stepper';

// Importa os steps individuais
import { StepWelcome } from './steps/StepWelcome';
import { StepName } from './steps/StepName';
import { StepLocation } from './steps/StepLocation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  const steps = [
    <StepWelcome key="welcome" onNext={() => setStep(1)} />,
    <StepName key="name" onNext={() => setStep(2)} onBack={() => setStep(0)} />,
    <StepLocation
      key="location"
      onBack={() => setStep(1)}
      onFinish={() => alert('🎉 Onboarding finished!')}
    />,
  ];

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {step !== 0 && (
        <div className="fixed top-8 left-4">
          <Button
            className="rounded-full"
            variant="outline"
            size="icon"
            onClick={() => setStep(step - 1)} // volta um passo
          >
            <ArrowLeft />
          </Button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4 }}
          className="w-full"
          layout="position"
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-4 left-0 w-full">
        <Stepper currentStep={step + 1} totalSteps={steps.length} />
      </div>
    </main>
  );
}
