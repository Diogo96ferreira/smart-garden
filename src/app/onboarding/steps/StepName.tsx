'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  onNext: () => void;
  onBack: () => void;
};

export function StepName({ onNext, onBack }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 space-y-8 p-8">
      <div className="content-wrapper">
        <h2 className="text-center text-2xl font-bold">
          You already know who we are, <br /> now let us get to know you!
        </h2>
        <p className="text-muted-foreground text-center">
          Tell us a bit about yourself to personalize your experience.
        </p>
      </div>
      <Input type="text" placeholder="Your first name" className="max-w-xs px-2" />

      <div className="fixed bottom-8 left-0 flex w-full gap-3 px-4">
        <Button className="w-full rounded-full" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
