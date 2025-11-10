// src/hooks/useSettings.ts
import * as React from 'react';
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings } from '@/lib/settings';

function mergeSettings(raw: unknown): Settings {
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { ...DEFAULT_SETTINGS, ...(obj as Partial<Settings>) };
  } catch (err) {
    // se JSON inválido, volta aos defaults
    void err;
    return DEFAULT_SETTINGS;
  }
}

// util: chaves que são boolean no Settings
type BoolKeys = {
  [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

export function useSettings() {
  // Lazy init from localStorage to avoid initial flicker
  const [settings, setSettings] = React.useState<Settings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      return raw ? mergeSettings(raw) : DEFAULT_SETTINGS;
    } catch (err) {
      void err;
      return DEFAULT_SETTINGS;
    }
  });

  // Cross-tab sync: update when SETTINGS_KEY changes in other tabs
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY) {
        try {
          const value = e.newValue ?? '';
          setSettings(value ? mergeSettings(value) : DEFAULT_SETTINGS);
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // save helper
  const save = React.useCallback(
    (updater: Partial<Settings> | ((s: Settings) => Partial<Settings>)) => {
      setSettings((prev) => {
        const patch = typeof updater === 'function' ? updater(prev) : updater;
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        } catch (err) {
          // pode falhar em navegação privada ou quota
          void err;
        }
        return next;
      });
    },
    [],
  );

  const reset = React.useCallback(() => {
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch (err) {
      void err;
    }
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // tiny util for toggles (apenas chaves boolean)
  const toggle = React.useCallback(
    (key: BoolKeys) => {
      save((s) => {
        const current = Boolean((s as Record<string, unknown>)[key as string]);
        // devolvemos só o patch, tipado, sem `any`
        return { [key as string]: !current } as Partial<Settings>;
      });
    },
    [save],
  );

  return { settings, save, reset, toggle };
}
