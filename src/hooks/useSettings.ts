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
  const [settings, setSettings] = React.useState<Settings>(DEFAULT_SETTINGS);

  // load once
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      setSettings(raw ? mergeSettings(raw) : DEFAULT_SETTINGS);
    } catch (err) {
      // localStorage inacessível (SSR/privacidade)
      void err;
      setSettings(DEFAULT_SETTINGS);
    }
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
        const current = s[key] as boolean;
        // devolvemos só o patch, tipado, sem `any`
        return { [key]: !current } as Partial<Settings>;
      });
    },
    [save],
  );

  return { settings, save, reset, toggle };
}
