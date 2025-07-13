/**
 * 색상 유틸리티 함수들
 * 노드, 엣지, 사용자 등의 색상 관리
 */

import { CONFIG } from '../config/constants';
import { THEME } from '../config/theme';

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  border: string;
  text: string;
  accent: string;
}

export interface NodeColorConfig {
  [nodeType: string]: ColorScheme;
}

// 기본 노드 색상 설정 - 테마 파일에서 가져오기
export const defaultNodeColors: NodeColorConfig = Object.entries(THEME.NODE_COLORS).reduce((acc, [key, value]) => {
  if (key !== 'default') {
    acc[key] = {
      primary: value.primary,
      secondary: value.lightBg,
      background: '#FFFFFF',
      border: value.border,
      text: value.text,
      accent: value.hover
    };
  }
  return acc;
}, {} as NodeColorConfig);

// 다크 모드 색상
export const darkNodeColors: NodeColorConfig = {
  file: {
    primary: '#6366F1',
    secondary: '#312E81',
    background: '#1F2937',
    border: '#4B5563',
    text: '#F3F4F6',
    accent: '#8B5CF6'
  },
  api: {
    primary: '#34D399',
    secondary: '#065F46',
    background: '#1F2937',
    border: '#4B5563',
    text: '#F3F4F6',
    accent: '#10B981'
  },
  function: {
    primary: '#FBBF24',
    secondary: '#92400E',
    background: '#1F2937',
    border: '#4B5563',
    text: '#F3F4F6',
    accent: '#F59E0B'
  },
  translation: {
    primary: '#A78BFA',
    secondary: '#5B21B6',
    background: '#1F2937',
    border: '#4B5563',
    text: '#F3F4F6',
    accent: '#8B5CF6'
  },
  websocket: {
    primary: '#F87171',
    secondary: '#991B1B',
    background: '#1F2937',
    border: '#4B5563',
    text: '#F3F4F6',
    accent: '#EF4444'
  },
  graphql: {
    primary: '#FB923C',
    secondary: '#C2410C',
    background: '#1F2937',
    border: '#4B5563',
    text: '#F3F4F6',
    accent: '#F97316'
  },
  service: {
    primary: '#22D3EE',
    secondary: '#164E63',
    background: '#1F2937',
    border: '#4B5563',
    text: '#F3F4F6',
    accent: '#06B6D4'
  },
  store: {
    primary: '#A3E635',
    secondary: '#365314',
    background: '#1F2937',
    border: '#4B5563',
    text: '#F3F4F6',
    accent: '#84CC16'
  }
};

// 상태별 색상 - 테마 파일에서 가져오기
export const statusColors = THEME.STATUS_COLORS;

// 사용자 협업 색상 - 테마 파일에서 가져오기
export const collaborationColors = THEME.COLLABORATION_COLORS;

/**
 * 노드 타입에 따른 색상 반환
 */
export function getNodeColor(nodeType: string, isDark = false): ColorScheme {
  const colorConfig = isDark ? darkNodeColors : defaultNodeColors;
  return colorConfig[nodeType] || colorConfig.file;
}

/**
 * 노드 상태에 따른 색상 반환
 */
export function getNodeStatusColor(status: 'normal' | 'selected' | 'error' | 'warning'): string {
  switch (status) {
    case 'selected':
      return '#3B82F6';
    case 'error':
      return statusColors.error;
    case 'warning':
      return statusColors.warning;
    default:
      return 'transparent';
  }
}

/**
 * 엣지 타입에 따른 색상 반환
 */
export function getEdgeColor(edgeType: string): string {
  switch (edgeType) {
    case 'import':
      return '#6B7280';
    case 'data-flow':
      return '#3B82F6';
    case 'api-call':
      return '#10B981';
    case 'websocket':
      return '#EF4444';
    case 'action':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
}

/**
 * 협업 사용자 색상 할당
 */
export function assignUserColor(userId: string): string {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const index = Math.abs(hash) % collaborationColors.length;
  return collaborationColors[index];
}

/**
 * 색상 밝기 조정
 */
export function adjustBrightness(color: string, amount: number): string {
  const usePound = color.startsWith('#');
  const col = usePound ? color.slice(1) : color;
  
  const num = parseInt(col, 16);
  let r = (num >> 16) + amount;
  let g = (num >> 8 & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;

  r = r > 255 ? 255 : r < 0 ? 0 : r;
  g = g > 255 ? 255 : g < 0 ? 0 : g;
  b = b > 255 ? 255 : b < 0 ? 0 : b;

  return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

/**
 * 색상 투명도 조정
 */
export function withOpacity(color: string, opacity: number): string {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  
  return color;
}

/**
 * 색상이 밝은지 어두운지 판단
 */
export function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // YIQ 공식 사용
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > CONFIG.COLOR.YIQ_BRIGHTNESS_THRESHOLD;
}

/**
 * 대비되는 텍스트 색상 반환
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
}

/**
 * 그라데이션 색상 생성
 */
export function generateGradient(color1: string, color2: string, direction = '45deg'): string {
  return `linear-gradient(${direction}, ${color1}, ${color2})`;
}

/**
 * 랜덤 색상 생성
 */
export function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F06292', '#AED581', '#FFD54F', '#4DB6AC', '#9575CD'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 색상 팔레트 생성
 */
export function generateColorPalette(baseColor: string, count: number): string[] {
  const palette: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const brightness = -50 + (100 / (count - 1)) * i;
    palette.push(adjustBrightness(baseColor, brightness));
  }
  
  return palette;
}

/**
 * CSS 변수로 색상 설정
 */
export function setCSSColorVariables(isDark = false): void {
  const root = document.documentElement;
  const colors = isDark ? darkNodeColors : defaultNodeColors;
  
  Object.entries(colors).forEach(([nodeType, colorScheme]) => {
    Object.entries(colorScheme).forEach(([colorType, colorValue]) => {
      root.style.setProperty(`--node-${nodeType}-${colorType}`, colorValue);
    });
  });
  
  // 상태 색상 설정
  Object.entries(statusColors).forEach(([status, color]) => {
    root.style.setProperty(`--status-${status}`, color);
  });
}

/**
 * 테마 전환
 */
export function switchTheme(isDark: boolean): void {
  setCSSColorVariables(isDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

/**
 * 색상 접근성 검사
 */
export function checkColorAccessibility(foreground: string, background: string): {
  ratio: number;
  isAccessible: boolean;
  level: 'AA' | 'AAA' | 'FAIL';
} {
  // WCAG 2.0 대비비 계산 (간단한 버전)
  const getLuminance = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    
    const srgb = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio,
    isAccessible: ratio >= CONFIG.COLOR.CONTRAST_RATIO_AA,
    level: ratio >= CONFIG.COLOR.CONTRAST_RATIO_AAA ? 'AAA' : ratio >= CONFIG.COLOR.CONTRAST_RATIO_AA ? 'AA' : 'FAIL'
  };
}