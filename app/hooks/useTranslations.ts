'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';

// Static imports for translations
import enTranslations from '../../messages/en.json';
import esTranslations from '../../messages/es.json';
import frTranslations from '../../messages/fr.json';

interface Translations {
  [key: string]: any;
}

const translationMap: Record<string, Translations> = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
};

export function useTranslations() {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<Translations>(translationMap.en);
  const [isClient, setIsClient] = useState(false);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const selectedTranslations = translationMap[currentLanguage] || translationMap.en;
      setTranslations(selectedTranslations);
      setTranslationsLoaded(true);
    }
  }, [currentLanguage, isClient]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    // Use loaded translations if available, otherwise fall back to the selected language map (or English)
    const effectiveTranslations =
      translationsLoaded && translations ? translations : (translationMap[currentLanguage] || translationMap.en);

    const keys = key.split('.');
    let value: any = effectiveTranslations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} at step: ${k}`);
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string for key: ${key}, value:`, value);
      return key;
    }

    // Debug logging for AI treatment recommendations and assistant
    if (key.includes('treatmentRecommendations') || key.includes('assistant')) {
      console.log('Translating key:', key);
      console.log('Translation result:', value);
      console.log('Current language:', currentLanguage);
      console.log('Translations loaded:', translationsLoaded);
    }

    // Replace parameters in the translation string
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  return { t, currentLanguage, isClient, translationsLoaded };
}
