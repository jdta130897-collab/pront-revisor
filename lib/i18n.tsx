'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enMessages from '../messages/en.json';
import esMessages from '../messages/es.json';

type Locale = 'en' | 'es';
type Messages = typeof enMessages;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  messages: Messages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messagesMap: Record<Locale, Messages> = {
  en: enMessages,
  es: esMessages,
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es'); // Default Spanish

  // Load saved locale from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem('pront-locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('pront-locale', newLocale);
    
    // Optional: reload page for full consistency (or keep it reactive)
    // For now we keep it reactive
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = messagesMap[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Fallback to key
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters like {status}, {count}, etc.
    if (params) {
      return Object.keys(params).reduce((str, paramKey) => {
        return str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
      }, value);
    }

    return value;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, messages: messagesMap[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

// Helper component for language switcher with beautiful flags
export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center bg-muted/80 backdrop-blur-sm rounded-2xl p-1 text-sm border border-border/50 shadow-inner">
      <button
        onClick={() => setLocale('es')}
        className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 font-semibold text-xs tracking-[1px] ${
          locale === 'es' 
            ? 'bg-background shadow-lg text-foreground scale-[1.03] ring-2 ring-primary/40' 
            : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
        }`}
      >
        <span className="text-xl drop-shadow-sm">🇪🇸</span>
        <span>ES</span>
      </button>
      
      <button
        onClick={() => setLocale('en')}
        className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 font-semibold text-xs tracking-[1px] ${
          locale === 'en' 
            ? 'bg-background shadow-lg text-foreground scale-[1.03] ring-2 ring-primary/40' 
            : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
        }`}
      >
        <span className="text-xl drop-shadow-sm">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
