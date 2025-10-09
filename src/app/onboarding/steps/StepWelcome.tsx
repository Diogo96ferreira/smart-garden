'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

type Props = { onNext: () => void };

export function StepWelcome({ onNext }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-center text-4xl font-extrabold">Welcome to</h1>
      <Image className="mb-4" src="/logo.svg" width={200} height={200} alt="Smart Garden logo" />
      <p className="text-muted-foreground text-center text-lg">
        We will take care of your garden <br />
        with the aid of AI.
      </p>
      <div className="fixed bottom-12 left-0 w-full px-6">
        <Button variant="outline" className="w-full rounded-full" onClick={onNext}>
          Let’s Start
        </Button>
      </div>
    </div>
  );
}
