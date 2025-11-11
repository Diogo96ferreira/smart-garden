'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      try {
        await fetch('/api/logout', { method: 'POST' });
      } catch {
        /* ignore */
      }
      try {
        localStorage.setItem('app.isLoggedIn', 'false');
        localStorage.removeItem('onboardingComplete');
        localStorage.removeItem('userPlants');
      } catch {}
    } finally {
      router.replace('/signin');
    }
  };

  return (
    <Button variant="secondary" onClick={handleLogout} aria-label="Terminar sessão">
      Sair
    </Button>
  );
}
