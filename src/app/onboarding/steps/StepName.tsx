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
      <div className="content-wrapper space-y-4">
        <h2 className="text-center text-4xl font-extrabold">
          You already know who we are, now let us get to know you!
        </h2>
        <p className="text-muted-foreground text-center">
          Tell us a bit about yourself to personalize your experience.
        </p>
      </div>
      <Input type="text" placeholder="Your first name" className="max-w-xs px-2" />

      <div className="fixed bottom-12 left-0 w-full px-6">
        <Button className="h-12 w-full rounded-full text-base" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
