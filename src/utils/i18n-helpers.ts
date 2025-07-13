// 🌍 i18n 유틸리티 헬퍼 함수들
import { supportedLanguages } from '../i18n';

/**
 * 🎯 언어 코드로 언어 정보 가져오기
 */
export const getLanguageInfo = (code: string) => {
  return supportedLanguages.find(lang => lang.code === code);
};

/**
 * 🚀 브라우저 언어 감지 및 지원 언어 확인
 */
export const detectSupportedLanguage = () => {
  const browserLang = navigator.language;
  const primaryLang = browserLang.split('-')[0];
  
  // 정확한 언어 코드 매치 시도
  let detected = supportedLanguages.find(lang => lang.code === browserLang);
  
  // 주 언어 코드로 매치 시도
  if (!detected) {
    detected = supportedLanguages.find(lang => lang.code === primaryLang);
  }
  
  return detected || supportedLanguages[0]; // 기본값은 영어
};

/**
 * 📋 언어별 숫자 포맷팅
 */
export const formatNumber = (num: number, locale?: string) => {
  const currentLocale = locale || getCurrentLocale();
  return new Intl.NumberFormat(currentLocale).format(num);
};

/**
 * 📅 언어별 날짜 포맷팅
 */
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions, locale?: string) => {
  const currentLocale = locale || getCurrentLocale();
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(currentLocale, { ...defaultOptions, ...options }).format(date);
};

/**
 * 💰 언어별 통화 포맷팅
 */
export const formatCurrency = (amount: number, currency = 'USD', locale?: string) => {
  const currentLocale = locale || getCurrentLocale();
  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * 📏 상대적 시간 포맷팅 (예: "2일 전", "방금 전")
 */
export const formatRelativeTime = (date: Date, locale?: string) => {
  const currentLocale = locale || getCurrentLocale();
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
};

/**
 * 🎯 현재 로케일 가져오기 (i18n 언어 코드를 로케일로 변환)
 */
export const getCurrentLocale = () => {
  const lang = localStorage.getItem('i18nextLng') || 'en';
  
  // 언어 코드를 로케일로 매핑
  const localeMap: Record<string, string> = {
    'en': 'en-US',
    'ko': 'ko-KR',
    'ja': 'ja-JP',
    'zh': 'zh-CN',
    'es': 'es-ES'
  };
  
  return localeMap[lang] || 'en-US';
};

/**
 * 📱 텍스트 방향 가져오기 (RTL/LTR)
 */
export const getTextDirection = (langCode?: string) => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const lang = langCode || localStorage.getItem('i18nextLng') || 'en';
  return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
};

/**
 * 🎨 언어별 폰트 추천
 */
export const getRecommendedFont = (langCode?: string) => {
  const lang = langCode || localStorage.getItem('i18nextLng') || 'en';
  
  const fontMap: Record<string, string> = {
    'ko': '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif',
    'ja': '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif',
    'zh': '-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif',
    'en': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'es': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };
  
  return fontMap[lang] || fontMap['en'];
};

/**
 * 🔤 복수형 처리 헬퍼
 */
export const pluralize = (count: number, singular: string, plural?: string) => {
  if (count === 1) return singular;
  return plural || `${singular}s`;
};

/**
 * 🎯 키보드 단축키 텍스트 현지화
 */
export const localizeShortcut = (shortcut: string, langCode?: string) => {
  const lang = langCode || localStorage.getItem('i18nextLng') || 'en';
  
  if (lang === 'ko') {
    return shortcut
      .replace('Ctrl', '컨트롤')
      .replace('Alt', '알트')
      .replace('Shift', '시프트')
      .replace('Enter', '엔터')
      .replace('Space', '스페이스');
  }
  
  return shortcut;
};

/**
 * 🚀 언어 변경시 페이지 새로고침 여부 결정
 */
export const shouldRefreshOnLanguageChange = (oldLang: string, newLang: string) => {
  // RTL/LTR 변경시에는 새로고침 필요
  return getTextDirection(oldLang) !== getTextDirection(newLang);
};