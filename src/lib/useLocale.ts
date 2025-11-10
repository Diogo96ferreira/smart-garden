import { createContext, useContext } from 'react';

export type AppLocale = 'pt' | 'en';

export const LocaleContext = createContext<AppLocale>('pt');
export const LocaleContextProvider = LocaleContext.Provider;

export function useLocale(): AppLocale {
  return useContext(LocaleContext);
}
