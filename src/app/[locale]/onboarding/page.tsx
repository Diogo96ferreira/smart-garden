'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Stepper } from '@/components/ui/Stepper';
import { Button } from '@/components/ui/button';
import { StepWelcome } from './steps/StepWelcome';
import { StepName } from './steps/StepName';
import { StepLocation } from './steps/StepLocation';
import { StepPlants } from './steps/StepPlants';
import { StepAI } from './steps/StepAI';
import { StepReady } from './steps/StepReady';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';

  const handleFinish = useCallback(() => {
    localStorage.setItem('onboardingComplete', 'true');
    router.push(`/${locale}/splash`);
  }, [router, locale]);

  const steps = useMemo(
    () => [
      <StepWelcome key="welcome" onNext={() => setStep(1)} />,
      <StepName key="name" onBack={() => setStep(0)} onNext={() => setStep(2)} />,
      <StepLocation key="location" onBack={() => setStep(1)} onNext={() => setStep(3)} />,
      <StepPlants key="plants" onBack={() => setStep(2)} onNext={() => setStep(4)} />,
      <StepAI key="ai" onBack={() => setStep(3)} onNext={() => setStep(5)} />,
      <StepReady key="ready" onBack={() => setStep(4)} onFinish={handleFinish} />,
    ],
    [handleFinish],
  );

  return (
    <main className="relative flex min-h-screen flex-col justify-between bg-[var(--color-background)]">
      {step > 0 && (
        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="h-10 w-10 rounded-full p-0"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            aria-label="Voltar"
          >
            <ArrowLeft />
          </Button>
        </div>
      )}

      <div className="flex flex-1 items-center justify-center">
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
      </div>

      <Stepper currentStep={step + 1} totalSteps={steps.length} />
    </main>
  );
}
