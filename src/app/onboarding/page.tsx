'use client';

import { useMemo, useState } from 'react';
import { StepWelcome } from './steps/StepWelcome';
import { StepName } from './steps/StepName';
import { StepLocation } from './steps/StepLocation';
import { StepPlants } from './steps/StepPlants';
import { StepSensors } from './steps/StepSensors';
import { StepAI } from './steps/StepAI';
import { StepSummary } from './steps/StepSummary';

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  const stepContent = useMemo(() => {
    switch (step) {
      case 0:
        return <StepWelcome onNext={() => setStep(1)} />;
      case 1:
        return <StepName onBack={() => setStep(0)} onNext={() => setStep(2)} />;
      case 2:
        return <StepLocation onBack={() => setStep(1)} onNext={() => setStep(3)} />;
      case 3:
        return <StepPlants onBack={() => setStep(2)} onNext={() => setStep(4)} />;
      case 4:
        return <StepSensors onBack={() => setStep(3)} onNext={() => setStep(5)} />;
      case 5:
      default:
        return <StepAI onBack={() => setStep(4)} onNext={() => setStep(6)} />;
    }
  }, [step]);

  if (step === 6) {
    return (
      <>
        <StepSummary onBack={() => setStep(5)} />
        <ProgressDots current={step} />
      </>
    );
  }

  return (
    <main className="relative min-h-screen bg-transparent">
      {stepContent}
      <ProgressDots current={step} />
    </main>
  );
}

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="pointer-events-none fixed bottom-10 left-0 flex w-full justify-center">
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_STEPS + 1 }).map((_, index) => (
          <span
            key={`progress-${index}`}
            className={`h-1.5 w-8 rounded-full transition ${
              current === index ? 'bg-emerald-500' : 'bg-emerald-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
