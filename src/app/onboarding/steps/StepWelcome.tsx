'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

type Props = { onNext: () => void };

export function StepWelcome({ onNext }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-8 p-8">
      <Image className="mb-4" src="/logo.svg" width={200} height={200} alt="Smart Garden logo" />
      <h1 className="text-center text-4xl font-extrabold">Welcome to Smart Garden 🌿</h1>
      <p className="text-muted-foreground text-center text-lg">
        We will take care of your garden with the aid of AI.
      </p>
      <div className="fixed bottom-8 left-0 w-full px-4">
        <Button variant="outline" className="w-full rounded-full" onClick={onNext}>
          Let’s Start
        </Button>
      </div>
    </div>
  );
}
