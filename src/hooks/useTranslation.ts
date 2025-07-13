// 🌍 커스텀 번역 훅
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { changeLanguage, getCurrentLanguage, saveLanguagePreference } from '../i18n';

export interface TranslationOptions {
  ns?: string;
  keyPrefix?: string;
}

export const useTranslation = (options: TranslationOptions = {}) => {
  const { t, i18n } = useI18nTranslation(options.ns || 'common', {
    keyPrefix: options.keyPrefix
  });
  
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  // 🎯 언어 변경 핸들러
  const changeLanguageHandler = useCallback(async (lng: string) => {
    try {
      await changeLanguage(lng);
      saveLanguagePreference(lng);
      setCurrentLang(lng);
    } catch (error) {
      console.error('언어 변경 실패:', error);
      throw error;
    }
  }, []);

  // 📋 번역 키 존재 여부 확인
  const hasTranslation = useCallback((key: string, ns?: string) => {
    return i18n.exists(key, { ns: ns || options.ns || 'common' });
  }, [i18n, options.ns]);

  // 🚀 안전한 번역 (키가 없으면 기본값 반환)
  const safeTrans = useCallback((key: string, defaultValue?: string, interpolation?: Record<string, any>) => {
    if (hasTranslation(key)) {
      return t(key, interpolation);
    }
    return defaultValue || key;
  }, [t, hasTranslation]);

  // 🎯 언어 변경 이벤트 리스너
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLang(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return {
    t,
    i18n,
    currentLanguage: currentLang,
    changeLanguage: changeLanguageHandler,
    hasTranslation,
    safeTrans,
    isReady: i18n.isInitialized
  };
};

// 🌍 네임스페이스별 특화 훅들
export const useCommonTranslation = () => {
  return useTranslation({ ns: 'common' });
};

export const useLandingTranslation = () => {
  return useTranslation({ ns: 'landing' });
};

// 🎯 특정 키 프리픽스를 위한 훅
export const useAuthTranslation = () => {
  return useTranslation({ ns: 'common', keyPrefix: 'auth' });
};

export const useFeatureTranslation = () => {
  return useTranslation({ ns: 'common', keyPrefix: 'features' });
};

export const useDashboardTranslation = () => {
  return useTranslation({ ns: 'common', keyPrefix: 'dashboard' });
};

export default useTranslation;