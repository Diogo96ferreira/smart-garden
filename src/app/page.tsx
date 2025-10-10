'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboardingComplete') === 'true';

    if (hasCompletedOnboarding) {
      router.replace('/dashboard');
    } else {
      router.replace('/onboarding');
    }
  }, [router]);

  return null;
}
