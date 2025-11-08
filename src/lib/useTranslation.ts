// src/lib/useTranslation.ts
import pt from '../locales/pt.json';
import en from '../locales/en.json';

// Estrutura do dicionário: cada valor pode ser string ou outro dicionário
export interface Dict {
  [key: string]: string | Dict;
}

// Dicionários disponíveis
const DICTS: Record<'pt' | 'en', Dict> = {
  pt: pt as Dict,
  en: en as Dict,
};

// Função segura para aceder a chaves do tipo "a.b.c"
function get(obj: Dict, path: string): string | undefined {
  const keys = path.split('.');
  let current: string | Dict | undefined = obj;

  for (const key of keys) {
    if (typeof current === 'object' && current !== null && key in current) {
      current = current[key] as string | Dict;
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

// Hook principal
export function useTranslation(locale: string) {
  const norm: 'pt' | 'en' = locale?.toLowerCase().startsWith('en') ? 'en' : 'pt';
  const dict = DICTS[norm];

  return (key: string): string => {
    const val = get(dict, key);
    if (process.env.NODE_ENV !== 'production' && val === undefined) {
      console.warn(`[i18n] missing key "${key}" for locale "${norm}"`);
    }
    return val ?? key;
  };
}
