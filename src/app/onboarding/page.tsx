'use client';

import { useState } from 'react';
import { StepWelcome } from './steps/StepWelcome';
import { StepName } from './steps/StepName';
import { StepLocation } from './steps/StepLocation';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  const steps = [
    <StepWelcome key="welcome" onNext={() => setStep(1)} />,
    <StepName key="name" onBack={() => setStep(0)} onNext={() => setStep(2)} />,
    <StepLocation key="location" onBack={() => setStep(1)} onFinish={() => setStep(2)} />,
  ];

  return (
    <main className="relative min-h-screen bg-transparent">
      {steps[step]}
      <div className="pointer-events-none fixed bottom-10 left-0 flex w-full justify-center">
        <div className="flex gap-2">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 w-8 rounded-full transition ${
                step === index ? 'bg-emerald-500' : 'bg-emerald-200'
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
