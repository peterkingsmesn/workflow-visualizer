// 🚀 i18n 메인 엔트리 포인트
import i18n from './config';

// 📄 번역 리소스 동적 로딩
import enCommon from './locales/en/common.json';
import koCommon from './locales/ko/common.json';
import jaCommon from './locales/ja/common.json';
import zhCommon from './locales/zh/common.json';
import esCommon from './locales/es/common.json';

// 🎯 리소스 등록
i18n.addResourceBundle('en', 'common', enCommon);
i18n.addResourceBundle('ko', 'common', koCommon);
i18n.addResourceBundle('ja', 'common', jaCommon);
i18n.addResourceBundle('zh', 'common', zhCommon);
i18n.addResourceBundle('es', 'common', esCommon);

export default i18n;
export { i18n };

// 🚀 언어 변경 유틸리티
export const changeLanguage = (lng: string) => {
  return i18n.changeLanguage(lng);
};

// 🎯 현재 언어 가져오기
export const getCurrentLanguage = () => {
  return i18n.language;
};

// 📋 지원되는 언어 목록
export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

// 🚀 언어 감지 유틸리티
export const detectBrowserLanguage = () => {
  const browserLang = navigator.language.split('-')[0];
  return supportedLanguages.find(lang => lang.code === browserLang)?.code || 'en';
};

// 🎯 언어 설정 저장/불러오기
export const saveLanguagePreference = (lng: string) => {
  localStorage.setItem('i18nextLng', lng);
};

export const getLanguagePreference = () => {
  return localStorage.getItem('i18nextLng') || detectBrowserLanguage();
};